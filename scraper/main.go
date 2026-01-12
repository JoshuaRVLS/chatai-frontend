package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strconv"
	"strings"
	"sync"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Constants
const (
	ChubGatewayAPI    = "https://gateway.chub.ai/api"
	ChubGatewaySearch = "https://gateway.chub.ai/search"
	UserAgent         = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

// structs mapping Chub API JSON
type ChubResponse struct {
	Node ChubNode `json:"node"`
}

type ChubNode struct {
	Name        string          `json:"name"`
	Tagline     string          `json:"tagline"`    // Character "Bio" often maps here or Description
	Description string          `json:"description"`
	Definition  *ChubDefinition `json:"definition"`
	Entries     []ChubEntryRaw  `json:"entries"` // root level entries (Lorebooks)
	Topics      []string        `json:"topics"`
	AvatarURL   string          `json:"avatar_url"`
	MaxResURL   string          `json:"max_res_url"`
}

type ChubDefinition struct {
	// Character Fields
	Name                 string `json:"name"`
	Description          string `json:"description"` // Often the "Description/Persona"
	Personality          string `json:"personality"`
	Scenario             string `json:"scenario"`
	FirstMessage         string `json:"first_message"`
	ExampleDialogue      string `json:"example_dialogue"`
	
	// Lorebook Fields
	EmbeddedLorebook *ChubEmbeddedLorebook `json:"embedded_lorebook"`
	Entries          []ChubEntryRaw        `json:"entries"`
}

type ChubEmbeddedLorebook struct {
	Entries           []ChubEntryRaw `json:"entries"`
	ScanDepth         int            `json:"scan_depth"`
	TokenBudget       int            `json:"token_budget"`
	RecursiveScanning bool           `json:"recursive_scanning"`
}

type ChubEntryRaw struct {
	Keys           []string `json:"keys"`
	Keywords       []string `json:"keywords"` // alternate key
	Content        string   `json:"content"`
	Text           string   `json:"text"` // alternate content
	Enabled        *bool    `json:"enabled"`
	InsertionOrder int      `json:"insertion_order"`
	Order          int      `json:"order"`
}

// Normalized Internal Structs
type ScrapedLorebook struct {
	FullPath          string
	Name              string
	Description       string
	Entries           []ScrapedEntry
	ScanDepth         int
	TokenBudget       int
	RecursiveScanning bool
	Topics            []string
	AvatarURL         string
}

type ScrapedEntry struct {
	Keys    []string
	Content string
	Enabled bool
	Order   int
}

type ScrapedCharacter struct {
    FullPath             string
    Name                 string
    Persona              string
    Bio                  string
    Scenario             string
    IntroMessage         string
    ExampleConversations string
    IsNsfw               bool
    Topics               []string
    AvatarURL            string
    Lorebook             *ScrapedLorebook
}

// Search Response
type ChubSearchResponse struct {
	Data struct {
		Nodes []ChubSearchNode `json:"nodes"`
	} `json:"data"`
	Nodes []ChubSearchNode `json:"nodes"` // alternate
}

type ChubSearchNode struct {
	ID       int    `json:"id"`
	FullPath string `json:"fullPath"`
}

var (
	htmlTagRegex = regexp.MustCompile(`<[^>]*>`)
	pool         *pgxpool.Pool
)

// stripHtml removes HTML tags and entities (simple version)
func stripHtml(s string) string {
	s = htmlTagRegex.ReplaceAllString(s, "")
	s = strings.ReplaceAll(s, "&nbsp;", " ")
	s = strings.ReplaceAll(s, "&amp;", "&")
	s = strings.ReplaceAll(s, "&lt;", "<")
	s = strings.ReplaceAll(s, "&gt;", ">")
	s = strings.ReplaceAll(s, "&quot;", "\"")
	s = strings.ReplaceAll(s, "&#39;", "'")
	return strings.TrimSpace(s)
}

// --- FETCHING LOREBOOKS ---

func fetchChubLorebook(path string) (*ScrapedLorebook, error) {
	node, err := fetchRawNode(path)
	if err != nil {
		return nil, err
	}

	lb := &ScrapedLorebook{
		FullPath: path,
		Name:     node.Name,
		Description: func() string {
			if node.Description != "" {
				return stripHtml(node.Description)
			}
			return stripHtml(node.Tagline)
		}(),
		Topics:    node.Topics,
		AvatarURL: node.AvatarURL,
	}

	if lb.AvatarURL == "" {
		lb.AvatarURL = node.MaxResURL
	}
	if lb.Name == "" {
		lb.Name = "Unnamed Lorebook"
	}

	// Extract Settings & Entries
	var rawEntries []ChubEntryRaw
	lb.ScanDepth = 4
	lb.TokenBudget = 512

	if node.Definition != nil {
		if node.Definition.EmbeddedLorebook != nil {
			rawEntries = node.Definition.EmbeddedLorebook.Entries
			lb.ScanDepth = node.Definition.EmbeddedLorebook.ScanDepth
			lb.TokenBudget = node.Definition.EmbeddedLorebook.TokenBudget
			lb.RecursiveScanning = node.Definition.EmbeddedLorebook.RecursiveScanning
		} else if len(node.Definition.Entries) > 0 {
			rawEntries = node.Definition.Entries
		}
	}
	if len(rawEntries) == 0 && len(node.Entries) > 0 {
		rawEntries = node.Entries
	}

	if lb.ScanDepth == 0 { lb.ScanDepth = 4 }
	if lb.TokenBudget == 0 { lb.TokenBudget = 512 }

	for _, entry := range rawEntries {
		keys := entry.Keys
		if len(keys) == 0 {
			keys = entry.Keywords
		}
		content := entry.Content
		if content == "" {
			content = entry.Text
		}
		enabled := true
		if entry.Enabled != nil {
			enabled = *entry.Enabled
		}
		order := entry.InsertionOrder
		if order == 0 {
			order = entry.Order
		}

		lb.Entries = append(lb.Entries, ScrapedEntry{
			Keys:    keys,
			Content: stripHtml(content),
			Enabled: enabled,
			Order:   order,
		})
	}

	return lb, nil
}

// --- FETCHING CHARACTERS ---

func fetchChubCharacter(path string) (*ScrapedCharacter, error) {
    // Ensure path has 'characters/' prefix for API call if it's just user/slug
    apiPath := path
    if !strings.HasPrefix(apiPath, "characters/") && !strings.HasPrefix(apiPath, "lorebooks/") {
        // Assume it's a character if we are in this function
        apiPath = "characters/" + path
    }
    
	node, err := fetchRawNode(apiPath)
	if err != nil {
		return nil, err
	}

	char := &ScrapedCharacter{
		FullPath: path,
		Name:     node.Name,
		IsNsfw:   true, // Default assume NSFW if mostly pulling from Chub
		Topics:   node.Topics,
		AvatarURL: node.AvatarURL,
	}
	
	// Prioritize Max Resolution
	char.AvatarURL = node.MaxResURL
	if char.AvatarURL == "" {
		char.AvatarURL = node.AvatarURL
	}

	// Mapping Logic
	// Bio: usually 'description' (the short one) or 'tagline'
	char.Bio = stripHtml(node.Description)
	if char.Bio == "" {
		char.Bio = stripHtml(node.Tagline)
	}

	if node.Definition != nil {
		// Persona: 'description' inside definition, or 'personality'
		char.Persona = node.Definition.Description
		if char.Persona == "" {
			char.Persona = node.Definition.Personality
		}
		
		char.Scenario = node.Definition.Scenario
		char.IntroMessage = node.Definition.FirstMessage
		char.ExampleConversations = node.Definition.ExampleDialogue
	}

	// Fallback/Cleanups
	if char.Name == "" { char.Name = "Unnamed Character" }
	char.Persona = stripHtml(char.Persona)
	char.Scenario = stripHtml(char.Scenario)
	char.IntroMessage = stripHtml(char.IntroMessage)
	// Example dialogue often needs preservation of formatting, but we strip generic HTML
	char.ExampleConversations = stripHtml(char.ExampleConversations)

	// Extract Embedded Lorebook
	// 1. Explicit embedded_lorebook
	// 2. Entries directly on definition (Chub v2 sometimes does this)
	var rawEntries []ChubEntryRaw
	var scanDepth = 4
	var tokenBudget = 512
	var recursive = false
    var hasEmbedded bool

	if node.Definition != nil {
		if node.Definition.EmbeddedLorebook != nil {
			rawEntries = node.Definition.EmbeddedLorebook.Entries
			scanDepth = node.Definition.EmbeddedLorebook.ScanDepth
			tokenBudget = node.Definition.EmbeddedLorebook.TokenBudget
			recursive = node.Definition.EmbeddedLorebook.RecursiveScanning
            hasEmbedded = true
		} else if len(node.Definition.Entries) > 0 {
			rawEntries = node.Definition.Entries
            hasEmbedded = true
		}
	}
    
    if hasEmbedded && len(rawEntries) > 0 {
        // Create a synthetic lorebook
        lbName := char.Name + " Lorebook"
        if node.Name != "" { lbName = node.Name + " Lore" }
        
        char.Lorebook = &ScrapedLorebook{
            FullPath: "embedded/" + strings.TrimPrefix(path, "characters/"), // Synthetic ID
            Name: lbName,
            Description: "Embedded lorebook for " + char.Name,
            ScanDepth: scanDepth,
            TokenBudget: tokenBudget,
            RecursiveScanning: recursive,
            Topics: char.Topics, // Inherit topics
            AvatarURL: char.AvatarURL,
        }
        
        for _, entry := range rawEntries {
            keys := entry.Keys
            if len(keys) == 0 { keys = entry.Keywords }
            content := entry.Content
            if content == "" { content = entry.Text }
            enabled := true
            if entry.Enabled != nil { enabled = *entry.Enabled }
            order := entry.InsertionOrder
            if order == 0 { order = entry.Order }

            char.Lorebook.Entries = append(char.Lorebook.Entries, ScrapedEntry{
                Keys:    keys,
                Content: stripHtml(content),
                Enabled: enabled,
                Order:   order,
            })
        }
    }

	return char, nil
}

// Helper to get raw node
func fetchRawNode(path string) (*ChubNode, error) {
	url := fmt.Sprintf("%s/%s?full=true", ChubGatewayAPI, path)
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("User-Agent", UserAgent)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("status %d", resp.StatusCode)
	}

	body, _ := io.ReadAll(resp.Body)
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, err
	}

	var node ChubNode
	if val, ok := raw["node"]; ok {
		json.Unmarshal(val, &node)
	} else {
		json.Unmarshal(body, &node)
	}
	return &node, nil
}

// --- NETWORKING ---

func downloadImage(urlStr string) ([]byte, string, error) {
	req, _ := http.NewRequest("GET", urlStr, nil)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return nil, "", fmt.Errorf("status %d", resp.StatusCode)
	}
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, "", err
	}

	mimeType := "image/jpeg"
	if strings.HasSuffix(strings.ToLower(urlStr), ".png") {
		mimeType = "image/png"
	} else if strings.HasSuffix(strings.ToLower(urlStr), ".webp") {
		mimeType = "image/webp"
	}
	return data, mimeType, nil
}

// --- DB IMPORT ---

func importLorebook(ctx context.Context, lb *ScrapedLorebook, userId string) (string, bool, bool, error) {
	// ... (Previous implementation remains similar, ensure it's checked by ID/Name)
	// Check duplicate by ChubID
	// Check duplicate by ChubID
    var existingId string
	err := pool.QueryRow(ctx, `SELECT "id" FROM "Lorebook" WHERE "chubId" = $1`, lb.FullPath).Scan(&existingId)
	if err == nil { return existingId, true, true, nil }
	if err != pgx.ErrNoRows { return "", false, false, err }

	err = pool.QueryRow(ctx, `SELECT "id" FROM "Lorebook" WHERE "name" = $1 AND "userId" = $2`, lb.Name, userId).Scan(&existingId)
	if err == nil { return existingId, true, true, nil }
	if err != pgx.ErrNoRows { return "", false, false, err }

	tx, err := pool.Begin(ctx)
	if err != nil { return "", false, false, err }
	defer tx.Rollback(ctx)

	// Upsert Tags (Transaction Safe)
	var tagIds []string
	for _, tagName := range lb.Topics {
		var tagId string
		// Try Select
		err = tx.QueryRow(ctx, `SELECT "id" FROM "LorebookTag" WHERE "name" = $1`, tagName).Scan(&tagId)
		if err == pgx.ErrNoRows {
			// Insert with ON CONFLICT DO NOTHING to match pgx simple protocol behaviour and avoid errors
            newId := uuid.NewString()
			_, err = tx.Exec(ctx, `INSERT INTO "LorebookTag" ("id", "name", "createdAt") VALUES ($1, $2, NOW()) ON CONFLICT ("name") DO NOTHING`, newId, tagName)
            if err == nil {
                // If we inserted, use newId. If conflict, select again.
                // Optimistically assume newId was used or check via select
                err = tx.QueryRow(ctx, `SELECT "id" FROM "LorebookTag" WHERE "name" = $1`, tagName).Scan(&tagId)
            }
		}
		if tagId != "" { tagIds = append(tagIds, tagId) }
	}

	lbId := uuid.NewString()
	_, err = tx.Exec(ctx, `
		INSERT INTO "Lorebook" (
			"id", "name", "description", "chubId", "scanDepth", "tokenBudget", "recursiveScanning", "userId", "createdAt", "updatedAt"
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
	`, lbId, lb.Name, lb.Description, lb.FullPath, lb.ScanDepth, lb.TokenBudget, lb.RecursiveScanning, userId)
	if err != nil { return "", false, false, fmt.Errorf("insert lorebook: %v", err) }

	if len(lb.Entries) > 0 {
		for _, e := range lb.Entries {
			entryId := uuid.NewString()
			_, err = tx.Exec(ctx, `
				INSERT INTO "LoreEntry" (
					"id", "lorebookId", "keywords", "content", "enabled", "createdAt", "updatedAt"
				) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
			`, entryId, lbId, e.Keys, e.Content, e.Enabled)
			if err != nil { return "", false, false, fmt.Errorf("insert entry: %v", err) }
		}
	}

	for _, tId := range tagIds {
		_, err = tx.Exec(ctx, `INSERT INTO "_LorebookToLorebookTag" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING`, lbId, tId)
		if err != nil { log.Printf("Warning: failed to link tag: %v", err) }
	}

	if lb.AvatarURL != "" {
		imgData, mime, err := downloadImage(lb.AvatarURL)
		if err == nil {
			imgId := uuid.NewString()
			_, err = tx.Exec(ctx, `
				INSERT INTO "LorebookImage" (
					"id", "lorebookId", "name", "mimetype", "data", "createdAt"
				) VALUES ($1, $2, $3, $4, $5, NOW())
			`, imgId, lbId, lb.Name+"_avatar", mime, imgData)
			if err != nil { log.Printf("Warning: failed save avatar: %v", err) }
		}
	}

	if err := tx.Commit(ctx); err != nil { return "", false, false, err }
	return lbId, true, false, nil
}

func importCharacter(ctx context.Context, char *ScrapedCharacter, userId string) (bool, bool, error) {
	// Check duplicate
	var exists int
	err := pool.QueryRow(ctx, `SELECT 1 FROM "Character" WHERE "chubId" = $1`, char.FullPath).Scan(&exists)
	if err == nil { return true, true, nil }
    
    // Also check if path without prefix exists (legacy imports might have stored it differently)
    strippedPath := strings.TrimPrefix(char.FullPath, "characters/")
	err = pool.QueryRow(ctx, `SELECT 1 FROM "Character" WHERE "chubId" = $1`, strippedPath).Scan(&exists)
	if err == nil { return true, true, nil }

	if err != pgx.ErrNoRows { return false, false, err }
	
	// Secondary duplicate check
    err = pool.QueryRow(ctx, `SELECT 1 FROM "Character" WHERE "name" = $1 AND "authorId" = $2`, char.Name, userId).Scan(&exists)
    if err == nil { return true, true, nil }
    if err != pgx.ErrNoRows { return false, false, err }

	tx, err := pool.Begin(ctx)
	if err != nil { return false, false, err }
	defer tx.Rollback(ctx)

	// Upsert Tags (Transaction Safe)
	var tagIds []string
	for _, tagName := range char.Topics {
		var tagId string
		err = tx.QueryRow(ctx, `SELECT "id" FROM "CharacterTag" WHERE "name" = $1`, tagName).Scan(&tagId)
		if err == pgx.ErrNoRows {
            newId := uuid.NewString()
			_, err = tx.Exec(ctx, `INSERT INTO "CharacterTag" ("id", "name") VALUES ($1, $2) ON CONFLICT ("name") DO NOTHING`, newId, tagName)
			if err == nil { 
                _ = tx.QueryRow(ctx, `SELECT "id" FROM "CharacterTag" WHERE "name" = $1`, tagName).Scan(&tagId) 
            }
		}
		if tagId != "" { tagIds = append(tagIds, tagId) }
	}

	charId := uuid.NewString()
	_, err = tx.Exec(ctx, `
		INSERT INTO "Character" (
			"id", "name", "chubId", "persona", "bio", "scenario", "introMessage", "exampleConversations", "isNsfw", "authorId", "createdAt", "updatedAt"
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
	`, charId, char.Name, char.FullPath, char.Persona, char.Bio, char.Scenario, char.IntroMessage, char.ExampleConversations, char.IsNsfw, userId)
	if err != nil { return false, false, fmt.Errorf("insert char: %v", err) }

	// Link Tags
	for _, tId := range tagIds {
		_, err = tx.Exec(ctx, `INSERT INTO "_CharacterToCharacterTag" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING`, charId, tId)
		if err != nil { log.Printf("Warning: failed to link tag: %v", err) }
	}

	// Avatar
	if char.AvatarURL != "" {
		imgData, mime, err := downloadImage(char.AvatarURL)
		if err == nil {
			imgId := uuid.NewString()
			_, err = tx.Exec(ctx, `
				INSERT INTO "CharacterImage" (
					"id", "data", "name", "mimetype", "charId"
				) VALUES ($1, $2, $3, $4, $5)
			`, imgId, imgData, char.Name+"_avatar", mime, charId)
			if err != nil { log.Printf("Warning: failed save avatar: %v", err) }
		}
	}

	if err := tx.Commit(ctx); err != nil { return false, false, err }

    // Import embedded lorebook after character commit
    // Import embedded lorebook after character commit
    if char.Lorebook != nil {
        lbId, _, _, lErr := importLorebook(ctx, char.Lorebook, userId)
        if lErr != nil {
            log.Printf("⚠️ Failed to import embedded lorebook for %s: %v", char.Name, lErr)
        } else {
             // Link Character to Lorebook
             // Implicit M-N table: _CharacterToLorebook (A: Character, B: Lorebook)
             _, linkErr := pool.Exec(ctx, `INSERT INTO "_CharacterToLorebook" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING`, charId, lbId)
             if linkErr != nil {
                 log.Printf("⚠️ Failed to link embedded lorebook %s to %s: %v", lbId, char.Name, linkErr)
             } else {
                 log.Printf("📘 Imported & Linked embedded lorebook for %s", char.Name)
             }
        }
    }

	return true, false, nil
}

func searchContent(query string, tags string, sort string, limit int, contentType string) ([]string, error) {
	u, _ := url.Parse(ChubGatewaySearch)
	q := u.Query()
	q.Set("first", strconv.Itoa(limit))
	q.Set("page", "1")
	
	// Switch namespace
	if contentType == "character" {
		q.Set("namespace", "blue_archive") // Chub often defaults to this or just empty namespace for chars? Actually 'public' or unset is usually chars.
		// NOTE: Chub search is a bit weird. 'lorebooks' is strict. For characters, omitting namespace or using 'public' usually works.
		// Let's try omitting namespace by default for characters or use 'characters' if supported?
		// Testing shows removing namespace is safest for general search.
		q.Del("namespace")
	} else {
		q.Set("namespace", "lorebooks")
	}

	q.Set("include_forks", "true")
	q.Set("nsfw", "true")
	q.Set("chub", "true") // only chub native
	
	if sort != "" { q.Set("sort", sort) } else { q.Set("sort", "star_count") }
	if query != "" { q.Set("search", query) }
	if tags != "" { q.Set("topics", tags) }

	u.RawQuery = q.Encode()
	
	// For characters, sometimes we need to filter `contentType=character`
    // But namespace unset usually returns characters.
    
    resp, err := http.Get(u.String())
	if err != nil { return nil, err }
	defer resp.Body.Close()

	var data ChubSearchResponse
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &data)

	var nodes []ChubSearchNode
	if len(data.Data.Nodes) > 0 {
		nodes = data.Data.Nodes
	} else {
		nodes = data.Nodes
	}

	var results []string
	for _, n := range nodes {
		if n.FullPath != "" {
			results = append(results, n.FullPath)
		} else if n.ID != 0 {
			// For chars, format might just be the ID or name/ID
			if contentType == "character" {
			    results = append(results, n.FullPath)
			} else {
			    results = append(results, fmt.Sprintf("lorebooks/%d", n.ID))
			}
		}
	}
	return results, nil
}


func main() {
	typeFlag := flag.String("type", "lorebook", "Type of content to scrape: 'lorebook' or 'character'")
	searchFlag := flag.String("search", "", "Search query")
	tagsFlag := flag.String("tags", "", "Comma-separated tags")
	idFlag := flag.String("id", "", "Specific ID (full path)")
	userIdFlag := flag.String("userId", "", "User ID (Admin) to assign content to")
	sortFlag := flag.String("sort", "star_count", "Sort order")
	limitFlag := flag.Int("limit", 20, "Limit results")
	concurrencyFlag := flag.Int("concurrency", 10, "Workers")
	flag.Parse()

	if *userIdFlag == "" {
		log.Fatal("❌ --userId is required")
	}
	
	if *typeFlag != "lorebook" && *typeFlag != "character" {
	    log.Fatal("❌ --type must be 'lorebook' or 'character'")
	}

	// Load .env - try multiple locations
	envPaths := []string{".env", "../.env", "../../.env"}
	var envLoaded bool
	for _, p := range envPaths {
		if err := loadEnvResilient(p); err == nil {
			log.Printf("✅ Loaded environment from %s", p)
			envLoaded = true
			break
		}
	}
	
	if !envLoaded {
	    log.Println("⚠️ Warning: Could not load .env file from common locations. Relying on system environment variables.")
	}

	dbUrl := os.Getenv("DATABASE_URL")
	if dbUrl == "" {
		log.Fatal("❌ DATABASE_URL not set. Please ensure .env exists or export the variable.")
	}

	var err error
	config, _ := pgxpool.ParseConfig(dbUrl)
	config.MaxConns = int32(*concurrencyFlag * 2)
	
	// FIX for "prepared statement already exists" (42P05)
	// This happens when using transaction poolers (Supabase/PgBouncer).
	// We force Simple Protocol which doesn't use prepared statements.
	config.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	pool, err = pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		log.Fatal("Unable to connect to database:", err)
	}
	defer pool.Close()

	var paths []string

	if *idFlag != "" {
		path := *idFlag
		if *typeFlag == "lorebook" && !strings.HasPrefix(path, "lorebooks/") {
			path = "lorebooks/" + path
		}
		// Characters often don't have a prefix, or use user/name format. We take raw ID/Path.
		paths = []string{path}
	} else if *searchFlag != "" || *tagsFlag != "" {
		log.Printf("🔍 Searching %ss for '%s' (Tags: %s)...", *typeFlag, *searchFlag, *tagsFlag)
		paths, err = searchContent(*searchFlag, *tagsFlag, *sortFlag, *limitFlag, *typeFlag)
		if err != nil { log.Fatal("Search failed:", err) }
		log.Printf("Found %d results", len(paths))
	} else {
		log.Fatal("Please provide --search, --tags, or --id")
	}

	// WORKER POOL
	jobs := make(chan string, len(paths))
	results := make(chan string, len(paths))
	var wg sync.WaitGroup

	log.Printf("🚀 Starting import (%s) with %d workers...", *typeFlag, *concurrencyFlag)

	for w := 0; w < *concurrencyFlag; w++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			for path := range jobs {
			    var success, skipped bool
			    var name string
			    var err error

			    if *typeFlag == "lorebook" {
    				lb, fetchErr := fetchChubLorebook(path)
    				if fetchErr != nil {
    				    log.Printf("Worker %d: ❌ Failed fetch %s: %v", id, path, fetchErr)
    				    results <- "error"; continue
    				}
    				name = lb.Name
    				_, success, skipped, err = importLorebook(context.Background(), lb, *userIdFlag)
			    } else {
    				char, fetchErr := fetchChubCharacter(path)
    				if fetchErr != nil {
    				    log.Printf("Worker %d: ❌ Failed fetch %s: %v", id, path, fetchErr)
    				    results <- "error"; continue
    				}
    				name = char.Name
    				success, skipped, err = importCharacter(context.Background(), char, *userIdFlag)
			    }

				if err != nil {
					log.Printf("Worker %d: ❌ Failed import %s: %v", id, name, err)
					results <- "error"
				} else if skipped {
					log.Printf("Worker %d: ⏩ Skipped %s", id, name)
					results <- "skipped"
				} else if success {
					log.Printf("Worker %d: ✅ Imported %s", id, name)
					results <- "success"
				}
			}
		}(w)
	}

	for _, p := range paths {
		jobs <- p
	}
	close(jobs)
	wg.Wait()
	close(results)

	var s, sk, f int
	for res := range results {
		switch res {
		case "success": s++
		case "skipped": sk++
		case "error": f++
		}
	}
	fmt.Printf("\n📊 Summary (%s):\n   ✅ Imported: %d\n   ⏩ Skipped: %d\n   ❌ Failed: %d\n", *typeFlag, s, sk, f)
}

// loadEnvResilient reads a file and sets environment variables, skipping invalid lines
func loadEnvResilient(filename string) error {
	f, err := os.Open(filename)
	if err != nil {
		return err
	}
	defer f.Close()

	if _, err := io.ReadAll(f); err != nil { return err } // Check read
	f.Seek(0, 0) // Reset

	// Simple manual parsing
	raw, err := io.ReadAll(f)
	if err != nil { return err }
	
	lines := strings.Split(string(raw), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") { continue }
		
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue // Skip lines without =
		}
		
		key := strings.TrimSpace(parts[0])
		val := strings.TrimSpace(parts[1])
		
		// Remove quotes if present
		if strings.HasPrefix(val, "\"") && strings.HasSuffix(val, "\"") {
			val = strings.Trim(val, "\"")
		}
		if strings.HasPrefix(val, "'") && strings.HasSuffix(val, "'") {
			val = strings.Trim(val, "'")
		}
		
		os.Setenv(key, val)
	}
	return nil
}
