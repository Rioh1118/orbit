package user

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID           uuid.UUID
	Email        string
	DisplayName  string
	APIKeyHash   string
	APIKeyPrefix string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}
