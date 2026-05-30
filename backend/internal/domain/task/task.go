package task

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

type Status string

const (
	StatusOpen       Status = "open"
	StatusInProgress Status = "in_progress"
	StatusBlocked    Status = "blocked"
	StatusDone       Status = "done"
	StatusArchived   Status = "archived"
)

var validStatuses = map[Status]bool{
	StatusOpen:       true,
	StatusInProgress: true,
	StatusBlocked:    true,
	StatusDone:       true,
	StatusArchived:   true,
}

func (s Status) Valid() bool { return validStatuses[s] }

type Task struct {
	ID          uuid.UUID
	UserID      uuid.UUID
	Title       string
	Description string
	Status      Status
	ExternalRef string
	StartedAt   *time.Time
	CompletedAt *time.Time
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

var (
	ErrInvalidStatus = errors.New("invalid task status")
	ErrInvalidTitle  = errors.New("title must be 1-200 chars")
)

func (t *Task) Validate() error {
	if t.Title == "" || len(t.Title) > 200 {
		return ErrInvalidTitle
	}
	if !t.Status.Valid() {
		return ErrInvalidStatus
	}
	return nil
}
