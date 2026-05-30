package friction

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

type PatternTag string

const (
	TagCantFind        PatternTag = "cant_find"
	TagUnexpectedState PatternTag = "unexpected_state"
	TagTypeMismatch    PatternTag = "type_mismatch"
	TagAPIContract     PatternTag = "api_contract"
	TagEnvSetup        PatternTag = "env_setup"
	TagFlakyTest       PatternTag = "flaky_test"
	TagUnclearSpec     PatternTag = "unclear_spec"
	TagWaitingHuman    PatternTag = "waiting_human"
	TagToolQuirk       PatternTag = "tool_quirk"
	TagConceptGap      PatternTag = "concept_gap"
)

var validTags = map[PatternTag]bool{
	TagCantFind:        true,
	TagUnexpectedState: true,
	TagTypeMismatch:    true,
	TagAPIContract:     true,
	TagEnvSetup:        true,
	TagFlakyTest:       true,
	TagUnclearSpec:     true,
	TagWaitingHuman:    true,
	TagToolQuirk:       true,
	TagConceptGap:      true,
}

func (t PatternTag) Valid() bool { return validTags[t] }

const (
	minSeverity        = 1
	maxSeverity        = 3
	maxDescriptionLen  = 2000
	maxResolutionLen   = 2000
)

type Friction struct {
	ID             uuid.UUID
	UserID         uuid.UUID
	TaskID         *uuid.UUID
	WorkSliceID    *uuid.UUID
	PatternTag     PatternTag
	Severity       int
	Description    string
	ResolvedAt     *time.Time
	ResolutionNote string
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

var (
	ErrInvalidPatternTag = errors.New("invalid friction pattern_tag")
	ErrInvalidSeverity   = errors.New("severity must be 1-3")
	ErrDescriptionEmpty  = errors.New("description is required")
	ErrDescriptionLong   = errors.New("description must be <= 2000 chars")
	ErrResolutionLong    = errors.New("resolution_note must be <= 2000 chars")
	ErrAlreadyResolved   = errors.New("friction already resolved")
)

func (f *Friction) Validate() error {
	if !f.PatternTag.Valid() {
		return ErrInvalidPatternTag
	}
	if f.Severity < minSeverity || f.Severity > maxSeverity {
		return ErrInvalidSeverity
	}
	if f.Description == "" {
		return ErrDescriptionEmpty
	}
	if len(f.Description) > maxDescriptionLen {
		return ErrDescriptionLong
	}
	if len(f.ResolutionNote) > maxResolutionLen {
		return ErrResolutionLong
	}
	return nil
}

// Resolve marks the friction as resolved at `at` with an optional note.
func (f *Friction) Resolve(at time.Time, note string) error {
	if f.ResolvedAt != nil {
		return ErrAlreadyResolved
	}
	if len(note) > maxResolutionLen {
		return ErrResolutionLong
	}
	f.ResolvedAt = &at
	if note != "" {
		f.ResolutionNote = note
	}
	return nil
}
