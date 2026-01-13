package main

import (
	"context"
	"flag"
	"log"
	"os"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"

	"jchatai.space/scraper/internal/api"
	"jchatai.space/scraper/internal/store"
	"jchatai.space/scraper/internal/worker"
)

func main() {
	// Flags
	fType := flag.String("type", "lorebook", "lorebook|character")
	fSearch := flag.String("search", "", "Query")
	fTags := flag.String("tags", "", "Topics")
	fId := flag.String("id", "", "ID/Path")
	fUid := flag.String("userId", "", "Author UUID")
	fSort := flag.String("sort", "star_count", "Sort")
	fLimit := flag.Int("limit", 20, "Limit")
	fConc := flag.Int("concurrency", 10, "Workers")
	flag.Parse()

	if *fUid == "" {
		log.Fatal("❌ --userId is required")
	}

	// Env
	if err := godotenv.Load(); err != nil {
		_ = godotenv.Load("../.env")
	}
	if os.Getenv("DATABASE_URL") == "" {
		// Fallback resilient load logic omitted for brevity, standard godotenv usually enough
		log.Fatal("❌ DATABASE_URL missing")
	}

	// DB
	cfg, _ := pgxpool.ParseConfig(os.Getenv("DATABASE_URL"))
	cfg.MaxConns = int32(*fConc * 2)
	cfg.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	pool, err := pgxpool.NewWithConfig(context.Background(), cfg)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	// Services
	client := api.NewClient()
	db := store.NewStore(pool)
	wp := worker.NewWorkerPool(client, db, *fUid)

	// execution
	var paths []string
	if *fId != "" {
		p := *fId
		if *fType == "lorebook" && !strings.HasPrefix(p, "lorebooks/") {
			p = "lorebooks/" + p
		}
		paths = []string{p}
	} else if *fSearch != "" || *fTags != "" {
		log.Printf("🔍 Searching...")
		paths, err = client.Search(*fSearch, *fTags, *fSort, *fType, *fLimit)
		if err != nil {
			log.Fatal(err)
		}
		log.Printf("Found %d results", len(paths))
	} else {
		log.Fatal("Provide --search, --tags, or --id")
	}

	wp.Run(paths, *fConc, *fType)
}
