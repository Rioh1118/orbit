package config

import (
	"fmt"
	"os"
)

type Config struct {
	Port        string
	DatabaseURL string
	LogLevel    string
	APIKeySalt  string
	CORSOrigin  string
}

func Load() (*Config, error) {
	cfg := &Config{
		Port:        getEnvOr("PORT", "8080"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
		LogLevel:    getEnvOr("LOG_LEVEL", "info"),
		APIKeySalt:  os.Getenv("API_KEY_SALT"),
		CORSOrigin:  getEnvOr("CORS_ORIGIN", "http://localhost:5173"),
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.APIKeySalt == "" {
		return nil, fmt.Errorf("API_KEY_SALT is required")
	}

	return cfg, nil
}

func getEnvOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
