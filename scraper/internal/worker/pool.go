package worker

import (
	"context"
	"fmt"
	"log"
	"strings"
	"sync"

	"jchatai.space/scraper/internal/api"
	"jchatai.space/scraper/internal/models"
	"jchatai.space/scraper/internal/store"
)

type WorkerPool struct {
	client *api.Client
	store  *store.Store
	userId string
}

func NewWorkerPool(c *api.Client, s *store.Store, uid string) *WorkerPool {
	return &WorkerPool{client: c, store: s, userId: uid}
}

func (wp *WorkerPool) Run(paths []string, concurrency int, contentType string) {
	jobs := make(chan string, len(paths))
	results := make(chan string, len(paths))
	var wg sync.WaitGroup

	for w := 0; w < concurrency; w++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			for path := range jobs {
				res := wp.process(id, path, contentType)
				results <- res
			}
		}(w)
	}

	for _, p := range paths {
		jobs <- p
	}
	close(jobs)
	wg.Wait()
	close(results)

	wp.summary(results)
}

func (wp *WorkerPool) process(wid int, path, kind string) string {
	var err error
	var name string
	var skipped bool

	if kind == "lorebook" {
		lb, e := wp.fetchLorebook(path)
		if e != nil {
			log.Printf("Worker %d: ❌ Err %s: %v", wid, path, e)
			return "error"
		}
		name = lb.Name
		_, skipped, err = wp.store.SaveLorebook(context.Background(), lb, wp.userId)
	} else {
		char, e := wp.fetchCharacter(path)
		if e != nil {
			log.Printf("Worker %d: ❌ Err %s: %v", wid, path, e)
			return "error"
		}
		name = char.Name
		img, mime, _ := wp.client.FetchImage(char.AvatarURL)

		skipped, err = wp.store.SaveCharacter(context.Background(), char, wp.userId, img, mime)

		// Handle embedded lorebook
		if err == nil && char.Lorebook != nil {
			lbId, _, e := wp.store.SaveLorebook(context.Background(), char.Lorebook, wp.userId)
			if e == nil {
				// We need the character ID to link.
				cid, _ := wp.store.GetCharacterId(context.Background(), char.FullPath)
				wp.store.LinkCharacterLorebook(context.Background(), cid, lbId)
			}
		}
	}

	if err != nil {
		log.Printf("Worker %d: ❌ Failed %s: %v", wid, name, err)
		return "error"
	}
	if skipped {
		log.Printf("Worker %d: ⏩ Skipped %s", wid, name)
		return "skipped"
	}
	log.Printf("Worker %d: ✅ Imported %s", wid, name)
	return "success"
}

func (wp *WorkerPool) fetchLorebook(path string) (*models.ScrapedLorebook, error) {
	node, err := wp.client.FetchNode(path)
	if err != nil {
		return nil, err
	}

	lb := &models.ScrapedLorebook{
		FullPath:    path,
		Name:        node.Name,
		Description: api.StripHtml(node.Description),
		Topics:      node.Topics,
		AvatarURL:   node.AvatarURL,
		ScanDepth:   4,
		TokenBudget: 512,
	}
	if lb.Name == "" {
		lb.Name = "Unnamed Lorebook"
	}
	if lb.AvatarURL == "" {
		lb.AvatarURL = node.MaxResURL
	}

	var raw []models.ChubEntryRaw
	if node.Definition != nil {
		if node.Definition.EmbeddedLorebook != nil {
			raw = node.Definition.EmbeddedLorebook.Entries
			lb.ScanDepth = node.Definition.EmbeddedLorebook.ScanDepth
			lb.TokenBudget = node.Definition.EmbeddedLorebook.TokenBudget
			lb.RecursiveScanning = node.Definition.EmbeddedLorebook.RecursiveScanning
		} else {
			raw = node.Definition.Entries
		}
	} else {
		raw = node.Entries
	}

	for _, r := range raw {
		keys := r.Keys
		if len(keys) == 0 {
			keys = r.Keywords
		}
		content := r.Content
		if content == "" {
			content = r.Text
		}

		enabled := true
		if r.Enabled != nil {
			enabled = *r.Enabled
		}

		order := r.InsertionOrder
		if order == 0 {
			order = r.Order
		}

		lb.Entries = append(lb.Entries, models.ScrapedEntry{
			Keys:    keys,
			Content: api.StripHtml(content),
			Enabled: enabled,
			Order:   order,
		})
	}
	return lb, nil
}

func (wp *WorkerPool) fetchCharacter(path string) (*models.ScrapedCharacter, error) {
	// API path correction
	apiPath := path
	if !strings.HasPrefix(apiPath, "characters/") && !strings.HasPrefix(apiPath, "lorebooks/") {
		apiPath = "characters/" + path
	}

	node, err := wp.client.FetchNode(apiPath)
	if err != nil {
		return nil, err
	}

	char := &models.ScrapedCharacter{
		FullPath:  path,
		Name:      node.Name,
		IsNsfw:    true,
		Topics:    node.Topics,
		AvatarURL: node.MaxResURL,
		Bio:       api.StripHtml(node.Description),
	}
	if char.AvatarURL == "" {
		char.AvatarURL = node.AvatarURL
	}
	if char.Bio == "" {
		char.Bio = api.StripHtml(node.Tagline)
	}

	if node.Definition != nil {
		char.Persona = api.StripHtml(node.Definition.Description)
		if char.Persona == "" {
			char.Persona = api.StripHtml(node.Definition.Personality)
		}
		char.Scenario = api.StripHtml(node.Definition.Scenario)
		char.IntroMessage = api.StripHtml(node.Definition.FirstMessage)
		char.ExampleConversations = api.StripHtml(node.Definition.ExampleDialogue)

		// Check embedded
		hasEmbed := false
		var raw []models.ChubEntryRaw
		if node.Definition.EmbeddedLorebook != nil {
			raw = node.Definition.EmbeddedLorebook.Entries
			hasEmbed = true
		} else if len(node.Definition.Entries) > 0 {
			raw = node.Definition.Entries
			hasEmbed = true
		}

		if hasEmbed {
			// Construct synthetic
			lbName := char.Name + " Lore"
			char.Lorebook = &models.ScrapedLorebook{
				FullPath:          "embedded/" + strings.TrimPrefix(path, "characters/"),
				Name:              lbName,
				Description:       "Embedded for " + char.Name,
				ScanDepth:         4,
				TokenBudget:       512,
				RecursiveScanning: false,
				Topics:            char.Topics,
			}
			// (Reuse logic ideally, but inlining for brevity of migration)
			for _, r := range raw {
				keys := r.Keys
				if len(keys) == 0 {
					keys = r.Keywords
				}
				content := r.Content
				if content == "" {
					content = r.Text
				}
				lb_enabled := true
				if r.Enabled != nil {
					lb_enabled = *r.Enabled
				}
				char.Lorebook.Entries = append(char.Lorebook.Entries, models.ScrapedEntry{
					Keys: keys, Content: api.StripHtml(content), Enabled: lb_enabled,
				})
			}
		}
	}
	return char, nil
}

func (wp *WorkerPool) summary(results chan string) {
	var s, sk, f int
	for res := range results {
		switch res {
		case "success":
			s++
		case "skipped":
			sk++
		case "error":
			f++
		}
	}
	fmt.Printf("\n📊 Summary:\n   ✅ Imported: %d\n   ⏩ Skipped: %d\n   ❌ Failed: %d\n", s, sk, f)
}
