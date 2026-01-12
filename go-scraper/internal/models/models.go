package models

type ChubNode struct {
	Name        string          `json:"name"`
	Tagline     string          `json:"tagline"`
	Description string          `json:"description"`
	Definition  *ChubDefinition `json:"definition"`
	Entries     []ChubEntryRaw  `json:"entries"`
	Topics      []string        `json:"topics"`
	AvatarURL   string          `json:"avatar_url"`
	MaxResURL   string          `json:"max_res_url"`
}

type ChubDefinition struct {
	Name             string                `json:"name"`
	Description      string                `json:"description"`
	Personality      string                `json:"personality"`
	Scenario         string                `json:"scenario"`
	FirstMessage     string                `json:"first_message"`
	ExampleDialogue  string                `json:"example_dialogue"`
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
	Keywords       []string `json:"keywords"`
	Content        string   `json:"content"`
	Text           string   `json:"text"`
	Enabled        *bool    `json:"enabled"`
	InsertionOrder int      `json:"insertion_order"`
	Order          int      `json:"order"`
}

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

type ChubSearchResponse struct {
	Data struct {
		Nodes []ChubSearchNode `json:"nodes"`
	} `json:"data"`
	Nodes []ChubSearchNode `json:"nodes"`
}

type ChubSearchNode struct {
	ID       int    `json:"id"`
	FullPath string `json:"fullPath"`
}
