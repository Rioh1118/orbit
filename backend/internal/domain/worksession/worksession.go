package worksession

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

type Mode string

const (
	ModeSpecRead      Mode = "spec_read"
	ModeTaskBreakdown Mode = "task_breakdown"
	ModeCodeExplore   Mode = "code_explore"
	ModeDesign        Mode = "design"
	ModeImplement     Mode = "implement"
	ModeVerify        Mode = "verify"
	ModeDebug         Mode = "debug"
	ModeAIReview      Mode = "ai_review"
	ModeHumanReview   Mode = "human_review"
	ModeConsult       Mode = "consult"
	ModeOther         Mode = "other"
)

var validModes = map[Mode]bool{
	ModeSpecRead:      true,
	ModeTaskBreakdown: true,
	ModeCodeExplore:   true,
	ModeDesign:        true,
	ModeImplement:     true,
	ModeVerify:        true,
	ModeDebug:         true,
	ModeAIReview:      true,
	ModeHumanReview:   true,
	ModeConsult:       true,
	ModeOther:         true,
}

func (m Mode) Valid() bool { return validModes[m] }

// Key returns the 1-key keyboard shortcut associated with this mode.
// S/B/E/G/I/V/D/A/R/C/O per PRODUCT_BRIEF.
func (m Mode) Key() string {
	switch m {
	case ModeSpecRead:
		return "S"
	case ModeTaskBreakdown:
		return "B"
	case ModeCodeExplore:
		return "E"
	case ModeDesign:
		return "G"
	case ModeImplement:
		return "I"
	case ModeVerify:
		return "V"
	case ModeDebug:
		return "D"
	case ModeAIReview:
		return "A"
	case ModeHumanReview:
		return "R"
	case ModeConsult:
		return "C"
	case ModeOther:
		return "O"
	}
	return ""
}

const (
	minDensity = 1
	maxDensity = 5
	maxNoteLen = 1000
)

type WorkSession struct {
	ID          uuid.UUID
	UserID      uuid.UUID
	TaskID      *uuid.UUID
	Mode        Mode
	StartedAt   time.Time
	EndedAt     *time.Time
	DurationSec *int
	Density     *int
	Note        string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

var (
	ErrInvalidMode    = errors.New("invalid work session mode")
	ErrInvalidDensity = errors.New("density must be 1-5")
	ErrNoteTooLong    = errors.New("note must be <= 1000 chars")
	ErrAlreadyEnded   = errors.New("work session already ended")
	ErrEndBeforeStart = errors.New("ended_at must be >= started_at")
	ErrZeroStartedAt  = errors.New("started_at is required")
)

func (w *WorkSession) Validate() error {
	if !w.Mode.Valid() {
		return ErrInvalidMode
	}
	if w.StartedAt.IsZero() {
		return ErrZeroStartedAt
	}
	if w.EndedAt != nil && w.EndedAt.Before(w.StartedAt) {
		return ErrEndBeforeStart
	}
	if w.Density != nil && (*w.Density < minDensity || *w.Density > maxDensity) {
		return ErrInvalidDensity
	}
	if len(w.Note) > maxNoteLen {
		return ErrNoteTooLong
	}
	return nil
}

// End sets ended_at, duration_sec, and optional density.
func (w *WorkSession) End(at time.Time, density *int) error {
	if w.EndedAt != nil {
		return ErrAlreadyEnded
	}
	if at.Before(w.StartedAt) {
		return ErrEndBeforeStart
	}
	if density != nil && (*density < minDensity || *density > maxDensity) {
		return ErrInvalidDensity
	}
	w.EndedAt = &at
	dur := int(at.Sub(w.StartedAt).Seconds())
	w.DurationSec = &dur
	if density != nil {
		d := *density
		w.Density = &d
	}
	return nil
}
