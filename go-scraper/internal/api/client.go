package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"

	"jchatai.space/scraper/internal/models"
)

const (
	BaseURL   = "https://gateway.chub.ai/api"
	SearchURL = "https://gateway.chub.ai/search"
	UserAgent = "Mozilla/5.0 (Windows NT 10.0; w64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

type Client struct {
	http *http.Client
}

func NewClient() *Client {
	return &Client{http: http.DefaultClient}
}

func (c *Client) FetchNode(path string) (*models.ChubNode, error) {
	url := fmt.Sprintf("%s/%s?full=true", BaseURL, path)
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("User-Agent", UserAgent)

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("HTTP %d", resp.StatusCode)
	}

	body, _ := io.ReadAll(resp.Body)
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, err
	}

	var node models.ChubNode
	target := body
	if val, ok := raw["node"]; ok {
		target = val
	}
	if err := json.Unmarshal(target, &node); err != nil {
		return nil, err
	}
	return &node, nil
}

func (c *Client) FetchImage(urlStr string) ([]byte, string, error) {
	req, _ := http.NewRequest("GET", urlStr, nil)
	resp, err := c.http.Do(req)
	if err != nil {
		return nil, "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, "", fmt.Errorf("HTTP %d", resp.StatusCode)
	}

	data, err := io.ReadAll(resp.Body)
	mime := "image/jpeg"
	if strings.HasSuffix(strings.ToLower(urlStr), ".png") {
		mime = "image/png"
	} else if strings.HasSuffix(strings.ToLower(urlStr), ".webp") {
		mime = "image/webp"
	}
	return data, mime, err
}

func (c *Client) Search(query, tags, sort, contentType string, limit int) ([]string, error) {
	u, _ := url.Parse(SearchURL)
	q := u.Query()
	q.Set("first", strconv.Itoa(limit))
	q.Set("page", "1")
	q.Set("include_forks", "true")
	q.Set("nsfw", "true")
	q.Set("chub", "true")

	if contentType == "character" {
		q.Del("namespace")
	} else {
		q.Set("namespace", "lorebooks")
	}

	if sort != "" {
		q.Set("sort", sort)
	} else {
		q.Set("sort", "star_count")
	}
	if query != "" {
		q.Set("search", query)
	}
	if tags != "" {
		q.Set("topics", tags)
	}

	u.RawQuery = q.Encode()
	resp, err := http.Get(u.String())
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var data models.ChubSearchResponse
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &data)

	nodes := data.Data.Nodes
	if len(nodes) == 0 {
		nodes = data.Nodes
	}

	var results []string
	for _, n := range nodes {
		if n.FullPath != "" {
			results = append(results, n.FullPath)
		} else if n.ID != 0 {
			if contentType == "character" {
				results = append(results, n.FullPath)
			} else {
				results = append(results, fmt.Sprintf("lorebooks/%d", n.ID))
			}
		}
	}
	return results, nil
}

// Helper to strip HTML/Entities
var htmlTagRegex = regexp.MustCompile(`<[^>]*>`)

func StripHtml(s string) string {
	s = htmlTagRegex.ReplaceAllString(s, "")
	replacer := strings.NewReplacer(
		"&nbsp;", " ", "&amp;", "&", "&lt;", "<", "&gt;", ">",
		"&quot;", "\"", "&#39;", "'",
	)
	return strings.TrimSpace(replacer.Replace(s))
}
