package workslice

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestModeValid(t *testing.T) {
	for _, m := range []Mode{ModeSpecRead, ModeTaskBreakdown, ModeCodeExplore, ModeDesign, ModeImplement, ModeVerify, ModeDebug, ModeAIReview, ModeHumanReview, ModeConsult, ModeOther} {
		if !m.Valid() {
			t.Errorf("Mode(%q) should be valid", m)
		}
		if m.Key() == "" {
			t.Errorf("Mode(%q) should have a key", m)
		}
	}
	if Mode("garbage").Valid() {
		t.Error("garbage should be invalid")
	}
}

func TestEnd(t *testing.T) {
	start := time.Date(2026, 1, 1, 10, 0, 0, 0, time.UTC)
	end := start.Add(30 * time.Minute)
	density := 4

	w := &WorkSlice{ID: uuid.New(), UserID: uuid.New(), Mode: ModeCodeExplore, StartedAt: start}
	if err := w.End(end, &density); err != nil {
		t.Fatalf("End: %v", err)
	}
	if w.EndedAt == nil || !w.EndedAt.Equal(end) {
		t.Errorf("EndedAt mismatch")
	}
	if w.DurationSec == nil || *w.DurationSec != 1800 {
		t.Errorf("DurationSec = %v, want 1800", w.DurationSec)
	}
	if w.Density == nil || *w.Density != 4 {
		t.Errorf("Density = %v, want 4", w.Density)
	}

	if err := w.End(end, nil); err != ErrAlreadyEnded {
		t.Errorf("expected ErrAlreadyEnded, got %v", err)
	}

	bad := &WorkSlice{Mode: ModeCodeExplore, StartedAt: start}
	if err := bad.End(start.Add(-1*time.Minute), nil); err != ErrEndBeforeStart {
		t.Errorf("expected ErrEndBeforeStart, got %v", err)
	}
	d := 6
	if err := bad.End(end, &d); err != ErrInvalidDensity {
		t.Errorf("expected ErrInvalidDensity, got %v", err)
	}
}

func TestValidate(t *testing.T) {
	start := time.Date(2026, 1, 1, 10, 0, 0, 0, time.UTC)
	cases := []struct {
		name string
		w    WorkSlice
		want error
	}{
		{"valid", WorkSlice{Mode: ModeCodeExplore, StartedAt: start}, nil},
		{"invalid mode", WorkSlice{Mode: "garbage", StartedAt: start}, ErrInvalidMode},
		{"zero start", WorkSlice{Mode: ModeCodeExplore}, ErrZeroStartedAt},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if err := c.w.Validate(); err != c.want {
				t.Errorf("err = %v, want %v", err, c.want)
			}
		})
	}
}
