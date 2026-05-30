package friction

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestPatternTagValid(t *testing.T) {
	for _, tag := range []PatternTag{TagCantFind, TagUnexpectedState, TagTypeMismatch, TagAPIContract, TagEnvSetup, TagFlakyTest, TagUnclearSpec, TagWaitingHuman, TagToolQuirk, TagConceptGap} {
		if !tag.Valid() {
			t.Errorf("%q should be valid", tag)
		}
	}
	if PatternTag("garbage").Valid() {
		t.Error("garbage should be invalid")
	}
}

func TestFrictionValidate(t *testing.T) {
	base := Friction{ID: uuid.New(), UserID: uuid.New(), PatternTag: TagCantFind, Severity: 2, Description: "ok"}
	cases := []struct {
		name string
		mut  func(f *Friction)
		want error
	}{
		{"valid", func(f *Friction) {}, nil},
		{"bad tag", func(f *Friction) { f.PatternTag = "garbage" }, ErrInvalidPatternTag},
		{"low severity", func(f *Friction) { f.Severity = 0 }, ErrInvalidSeverity},
		{"high severity", func(f *Friction) { f.Severity = 4 }, ErrInvalidSeverity},
		{"empty desc", func(f *Friction) { f.Description = "" }, ErrDescriptionEmpty},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			f := base
			c.mut(&f)
			if err := f.Validate(); err != c.want {
				t.Errorf("err = %v, want %v", err, c.want)
			}
		})
	}
}

func TestResolve(t *testing.T) {
	f := &Friction{PatternTag: TagCantFind, Severity: 1, Description: "x"}
	at := time.Date(2026, 1, 1, 10, 0, 0, 0, time.UTC)
	if err := f.Resolve(at, "found it"); err != nil {
		t.Fatalf("Resolve: %v", err)
	}
	if f.ResolvedAt == nil || !f.ResolvedAt.Equal(at) {
		t.Error("ResolvedAt mismatch")
	}
	if f.ResolutionNote != "found it" {
		t.Errorf("note = %q", f.ResolutionNote)
	}
	if err := f.Resolve(at, ""); err != ErrAlreadyResolved {
		t.Errorf("expected ErrAlreadyResolved, got %v", err)
	}
}
