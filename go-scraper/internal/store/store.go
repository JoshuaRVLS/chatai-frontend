package store

import (
	"context"
	"fmt"

	"jchatai.space/scraper/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Store struct {
	pool *pgxpool.Pool
}

func NewStore(pool *pgxpool.Pool) *Store {
	return &Store{pool: pool}
}

func (s *Store) Close() {
	s.pool.Close()
}

func (s *Store) SaveLorebook(ctx context.Context, lb *models.ScrapedLorebook, userId string) (string, bool, error) {
	// Check duplicates
	var id string
	err := s.pool.QueryRow(ctx, `SELECT "id" FROM "Lorebook" WHERE "chubId" = $1`, lb.FullPath).Scan(&id)
	if err == nil {
		return id, true, nil // Exists (Skipped)
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return "", false, err
	}
	defer tx.Rollback(ctx)

	// Tags
	tagIds := s.upsertTags(ctx, tx, lb.Topics)

	// Insert Lorebook
	lbId := uuid.NewString()
	_, err = tx.Exec(ctx, `
		INSERT INTO "Lorebook" ("id", "name", "description", "chubId", "scanDepth", "tokenBudget", "recursiveScanning", "userId", "createdAt", "updatedAt")
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
	`, lbId, lb.Name, lb.Description, lb.FullPath, lb.ScanDepth, lb.TokenBudget, lb.RecursiveScanning, userId)
	if err != nil {
		return "", false, err
	}

	// Entries
	for _, e := range lb.Entries {
		_, err = tx.Exec(ctx, `
			INSERT INTO "LoreEntry" ("id", "lorebookId", "keywords", "content", "enabled", "createdAt", "updatedAt")
			VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		`, uuid.NewString(), lbId, e.Keys, e.Content, e.Enabled)
		if err != nil {
			return "", false, err
		}
	}

	// Link Tags
	for _, tid := range tagIds {
		tx.Exec(ctx, `INSERT INTO "_LorebookToLorebookTag" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING`, lbId, tid)
	}

	return lbId, false, tx.Commit(ctx)
}

func (s *Store) SaveCharacter(ctx context.Context, char *models.ScrapedCharacter, userId string, imgData []byte, mimeType string) (bool, error) {
	// Check Chara exists
	var exists int
	if err := s.pool.QueryRow(ctx, `SELECT 1 FROM "Character" WHERE "chubId" = $1`, char.FullPath).Scan(&exists); err == nil {
		return true, nil // Skipped
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return false, err
	}
	defer tx.Rollback(ctx)

	tagIds := s.upsertTags(ctx, tx, char.Topics, "CharacterTag") // Reuse generic if possible, but keeping separate slightly cleaner

	charId := uuid.NewString()
	_, err = tx.Exec(ctx, `
		INSERT INTO "Character" ("id", "name", "chubId", "persona", "bio", "scenario", "introMessage", "exampleConversations", "isNsfw", "authorId", "createdAt", "updatedAt")
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
	`, charId, char.Name, char.FullPath, char.Persona, char.Bio, char.Scenario, char.IntroMessage, char.ExampleConversations, char.IsNsfw, userId)
	if err != nil {
		return false, err
	}

	// Link Tags
	for _, tid := range tagIds {
		tx.Exec(ctx, `INSERT INTO "_CharacterToCharacterTag" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING`, charId, tid)
	}

	// Avatar
	if len(imgData) > 0 {
		tx.Exec(ctx, `INSERT INTO "CharacterImage" ("id", "data", "name", "mimetype", "charId") VALUES ($1, $2, $3, $4, $5)`,
			uuid.NewString(), imgData, char.Name+"_avatar", mimeType, charId)
	}

	if err := tx.Commit(ctx); err != nil {
		return false, err
	}

	// Handle embedded lorebook via main flow to avoid circular dep or heavy complexity here
	return false, nil
}

func (s *Store) upsertTags(ctx context.Context, tx pgx.Tx, tags []string, tableName ...string) []string {
	table := "LorebookTag"
	if len(tableName) > 0 {
		table = tableName[0]
	}

	var ids []string
	for _, name := range tags {
		var id string // check exist
		err := tx.QueryRow(ctx, fmt.Sprintf(`SELECT "id" FROM "%s" WHERE "name" = $1`, table), name).Scan(&id)
		if err == pgx.ErrNoRows {
			newId := uuid.NewString()
			_, err = tx.Exec(ctx, fmt.Sprintf(`INSERT INTO "%s" ("id", "name") VALUES ($1, $2) ON CONFLICT ("name") DO NOTHING`, table), newId, name)
			if err == nil {
				// Retry fetch
				tx.QueryRow(ctx, fmt.Sprintf(`SELECT "id" FROM "%s" WHERE "name" = $1`, table), name).Scan(&id)
			}
		}
		if id != "" {
			ids = append(ids, id)
		}
	}
	return ids
}

func (s *Store) LinkCharacterLorebook(ctx context.Context, charId, lbId string) error {
	_, err := s.pool.Exec(ctx, `INSERT INTO "_CharacterToLorebook" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING`, charId, lbId)
	return err
}

func (s *Store) GetCharacterId(ctx context.Context, chubId string) (string, error) {
	var id string
	err := s.pool.QueryRow(ctx, `SELECT "id" FROM "Character" WHERE "chubId" = $1`, chubId).Scan(&id)
	return id, err
}
