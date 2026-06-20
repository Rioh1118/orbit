package workslice

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// Type is the timeline layer: craft work (counts toward growth) vs off (excluded).
type Type string

const (
	TypeWork Type = "work"
	TypeOff  Type = "off"
)

func (t Type) Valid() bool { return t == TypeWork || t == TypeOff }

// Mode is the kind of craft performed during a work segment (ADR 005, 11 values).
type Mode string

const (
	ModeSpecRead      Mode = "spec_read"
	ModeTaskBreakdown Mode = "task_breakdown"
	ModeStudy         Mode = "study"
	ModeCodeExplore   Mode = "code_explore"
	ModeDesign        Mode = "design"
	ModeImplement     Mode = "implement"
	ModeReview        Mode = "review"
	ModeVerify        Mode = "verify"
	ModeDebug         Mode = "debug"
	ModeConsult       Mode = "consult"
	ModeOther         Mode = "other"
)

var validModes = map[Mode]bool{
	ModeSpecRead:      true,
	ModeTaskBreakdown: true,
	ModeStudy:         true,
	ModeCodeExplore:   true,
	ModeDesign:        true,
	ModeImplement:     true,
	ModeReview:        true,
	ModeVerify:        true,
	ModeDebug:         true,
	ModeConsult:       true,
	ModeOther:         true,
}

func (m Mode) Valid() bool { return validModes[m] }

// Key returns the 1-key keyboard shortcut associated with this mode.
func (m Mode) Key() string {
	switch m {
	case ModeSpecRead:
		return "S"
	case ModeTaskBreakdown:
		return "B"
	case ModeStudy:
		return "Y"
	case ModeCodeExplore:
		return "E"
	case ModeDesign:
		return "G"
	case ModeImplement:
		return "I"
	case ModeReview:
		return "R"
	case ModeVerify:
		return "V"
	case ModeDebug:
		return "D"
	case ModeConsult:
		return "C"
	case ModeOther:
		return "O"
	}
	return ""
}

// Driver is who/what drove the craft (ADR 005, orthogonal to Mode).
type Driver string

const (
	DriverSolo  Driver = "solo"
	DriverAI    Driver = "ai"
	DriverHuman Driver = "human"
)

func (d Driver) Valid() bool { return d == DriverSolo || d == DriverAI || d == DriverHuman }

// OffReason classifies non-craft time. Excluded from growth aggregation.
type OffReason string

const (
	OffBreak   OffReason = "break"
	OffMeeting OffReason = "meeting"
	OffOther   OffReason = "other"
)

func (o OffReason) Valid() bool { return o == OffBreak || o == OffMeeting || o == OffOther }

const maxNoteLen = 1000

// WorkSlice is a single continuous interval on the timeline (ADR 005 "作業区間").
// A WORK segment carries Mode+Driver; an OFF segment carries OffReason.
type WorkSlice struct {
	ID          uuid.UUID
	UserID      uuid.UUID
	TaskID      *uuid.UUID
	Type        Type
	Mode        Mode      // set iff Type==work
	Driver      Driver    // set iff Type==work
	OffReason   OffReason // set iff Type==off
	StartedAt   time.Time
	EndedAt     *time.Time
	DurationSec *int
	Note        string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

var (
	ErrInvalidType      = errors.New("invalid work slice type")
	ErrInvalidMode      = errors.New("invalid work slice mode")
	ErrInvalidDriver    = errors.New("invalid work slice driver")
	ErrInvalidOffReason = errors.New("invalid off_reason")
	ErrLayerMismatch    = errors.New("work requires mode+driver and no off_reason; off requires off_reason and no mode/driver/task")
	ErrNoteTooLong      = errors.New("note must be <= 1000 chars")
	ErrAlreadyEnded     = errors.New("work slice already ended")
	ErrEndBeforeStart   = errors.New("ended_at must be >= started_at")
	ErrZeroStartedAt    = errors.New("started_at is required")
)

func (w *WorkSlice) Validate() error {
	if !w.Type.Valid() {
		return ErrInvalidType
	}
	switch w.Type {
	case TypeWork:
		if !w.Mode.Valid() {
			return ErrInvalidMode
		}
		if !w.Driver.Valid() {
			return ErrInvalidDriver
		}
		if w.OffReason != "" {
			return ErrLayerMismatch
		}
	case TypeOff:
		if !w.OffReason.Valid() {
			return ErrInvalidOffReason
		}
		if w.Mode != "" || w.Driver != "" || w.TaskID != nil {
			return ErrLayerMismatch
		}
	}
	if w.StartedAt.IsZero() {
		return ErrZeroStartedAt
	}
	if w.EndedAt != nil && w.EndedAt.Before(w.StartedAt) {
		return ErrEndBeforeStart
	}
	if len(w.Note) > maxNoteLen {
		return ErrNoteTooLong
	}
	return nil
}

// End closes the segment at `at` and computes duration_sec.
func (w *WorkSlice) End(at time.Time) error {
	if w.EndedAt != nil {
		return ErrAlreadyEnded
	}
	if at.Before(w.StartedAt) {
		return ErrEndBeforeStart
	}
	w.EndedAt = &at
	dur := int(at.Sub(w.StartedAt).Seconds())
	w.DurationSec = &dur
	return nil
}
