package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"os"
	"time"

	"github.com/Rioh1118/orbit/backend/internal/auth"
	"github.com/Rioh1118/orbit/backend/internal/config"
	"github.com/Rioh1118/orbit/backend/internal/domain/user"
	"github.com/Rioh1118/orbit/backend/internal/platform/db"
	"github.com/Rioh1118/orbit/backend/internal/repo"
	"github.com/google/uuid"
)

func main() {
	var email, displayName string
	flag.StringVar(&email, "email", "", "user email (required)")
	flag.StringVar(&displayName, "name", "", "display name (optional)")
	flag.Parse()

	if email == "" {
		fmt.Fprintln(os.Stderr, "usage: keygen -email <email> [-name <name>]")
		os.Exit(2)
	}

	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintln(os.Stderr, "config:", err)
		os.Exit(1)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := db.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		fmt.Fprintln(os.Stderr, "db:", err)
		os.Exit(1)
	}
	defer pool.Close()

	users := repo.NewUserRepo(pool)

	raw, prefix, err := auth.Generate()
	if err != nil {
		fmt.Fprintln(os.Stderr, "generate:", err)
		os.Exit(1)
	}
	hash := auth.Hash(cfg.APIKeySalt, raw)

	existing, err := users.GetByEmail(ctx, email)
	switch {
	case err == nil:
		if _, err := users.UpdateAPIKey(ctx, existing.ID, hash, prefix); err != nil {
			fmt.Fprintln(os.Stderr, "update:", err)
			os.Exit(1)
		}
		fmt.Fprintf(os.Stderr, "rotated api key for user %s (%s)\n", existing.ID, email)
	case errors.Is(err, repo.ErrUserNotFound):
		id, err := uuid.NewV7()
		if err != nil {
			fmt.Fprintln(os.Stderr, "uuid:", err)
			os.Exit(1)
		}
		if _, err := users.Create(ctx, &user.User{
			ID:           id,
			Email:        email,
			DisplayName:  displayName,
			APIKeyHash:   hash,
			APIKeyPrefix: prefix,
		}); err != nil {
			fmt.Fprintln(os.Stderr, "create:", err)
			os.Exit(1)
		}
		fmt.Fprintf(os.Stderr, "created user %s (%s)\n", id, email)
	default:
		fmt.Fprintln(os.Stderr, "lookup:", err)
		os.Exit(1)
	}

	fmt.Println("===== API KEY (save this — shown once) =====")
	fmt.Println(raw)
	fmt.Println("=============================================")
}
