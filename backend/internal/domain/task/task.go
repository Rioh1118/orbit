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
	CategoryNewFeature    Category = "new_feature"
	CategoryBugFix        Category = "bug_fix"
	CategoryRefactor      Category = "refactor"
	CategoryInvestigation Category = "investigation"
	CategorySupport       Category = "support"
	CategoryOther         Category = "other"
)

// learning is intentionally NOT a category (ADR 005): it is observed as a mode
// signature (high study+code_explore share), not a task output type.
var validCategories = map[Category]bool{
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

// NextLifecycle returns the started_at / completed_at a task should carry after a
// transition to newStatus, per the ADR-005 task state machine. It is pure: the
// caller supplies `now`, so the same inputs always yield the same result.
//
// Invariants:
//   - started_at is stamped on the first entry into in_progress and is sticky
//     thereafter (it records "work began at least once").
//   - completed_at is stamped on entering done, and cleared when the task returns
//     to an active backlog state (open / in_progress) — so reopening a finished
//     task discards its completion stamp (a deliberately destructive, menu-gated
//     UI action, brief §7.12.2). blocked / archived preserve both stamps, so
//     filing a finished task keeps its completion record.
func NextLifecycle(newStatus Status, started, completed *time.Time, now time.Time) (*time.Time, *time.Time) {
	switch newStatus {
	case StatusInProgress:
		if started == nil {
			started = &now
		}
		completed = nil
	case StatusOpen:
		completed = nil
	case StatusDone:
		if completed == nil {
			completed = &now
		}
	}
	return started, completed
}
