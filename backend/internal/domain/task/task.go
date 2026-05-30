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

type Category string

const (
	CategoryLearning      Category = "learning"
	CategoryNewFeature    Category = "new_feature"
	CategoryBugFix        Category = "bug_fix"
	CategoryRefactor      Category = "refactor"
	CategoryInvestigation Category = "investigation"
	CategorySupport       Category = "support"
	CategoryOther         Category = "other"
)

var validCategories = map[Category]bool{
	CategoryLearning:      true,
	CategoryNewFeature:    true,
	CategoryBugFix:        true,
	CategoryRefactor:      true,
	CategoryInvestigation: true,
	CategorySupport:       true,
	CategoryOther:         true,
}

func (c Category) Valid() bool { return validCategories[c] }

type Task struct {
	ID          uuid.UUID
	UserID      uuid.UUID
	Title       string
	Description string
	Category    Category
	Status      Status
	ExternalRef string
	StartedAt   *time.Time
	CompletedAt *time.Time
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

var (
	ErrInvalidStatus   = errors.New("invalid task status")
	ErrInvalidCategory = errors.New("invalid task category")
	ErrInvalidTitle    = errors.New("title must be 1-200 chars")
)

func (t *Task) Validate() error {
	if t.Title == "" || len(t.Title) > 200 {
		return ErrInvalidTitle
	}
	if !t.Status.Valid() {
		return ErrInvalidStatus
	}
	if !t.Category.Valid() {
		return ErrInvalidCategory
	}
	return nil
}
