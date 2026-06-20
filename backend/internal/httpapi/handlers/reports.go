package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/Rioh1118/orbit/backend/internal/domain/task"
	appmw "github.com/Rioh1118/orbit/backend/internal/httpapi/middleware"
	"github.com/Rioh1118/orbit/backend/internal/httpapi/response"
	"github.com/Rioh1118/orbit/backend/internal/service"
	"github.com/go-chi/chi/v5"
)

type ReportHandler struct {
	svc *service.ReportService
}

func NewReportHandler(svc *service.ReportService) *ReportHandler {
	return &ReportHandler{svc: svc}
}

func (h *ReportHandler) Routes() http.Handler {
	r := chi.NewRouter()
	r.Get("/then-vs-now", h.thenVsNow)
	return r
}

const weekFmt = "2006-01-02"

type modeWeekDTO struct {
	Week    string `json:"week"`
	Mode    string `json:"mode"`
	Seconds int64  `json:"seconds"`
}

type completedWeekDTO struct {
	Week              string `json:"week"`
	TaskCount         int64  `json:"task_count"`
	TotalSeconds      int64  `json:"total_seconds"`
	AvgSecondsPerTask int64  `json:"avg_seconds_per_task"`
}

type frictionWeekDTO struct {
	Week       string `json:"week"`
	PatternTag string `json:"pattern_tag"`
	Count      int64  `json:"count"`
}

type thenVsNowDTO struct {
	Category        string             `json:"category"`
	TZ              string             `json:"tz"`
	From            string             `json:"from"`
	To              string             `json:"to"`
	ModeByWeek      []modeWeekDTO      `json:"mode_by_week"`
	CompletedByWeek []completedWeekDTO `json:"completed_by_week"`
	FrictionByWeek  []frictionWeekDTO  `json:"friction_by_week"`
}

func (h *ReportHandler) thenVsNow(w http.ResponseWriter, r *http.Request) {
	uid, _ := appmw.UserIDFromCtx(r.Context())
	q := r.URL.Query()

	category := task.Category(q.Get("category"))
	if !category.Valid() {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid category", map[string]any{"field": "category"})
		return
	}
	weeks, _ := strconv.Atoi(q.Get("weeks"))

	res, err := h.svc.ThenVsNow(r.Context(), service.ThenVsNowInput{
		UserID: uid, Category: category, Weeks: weeks, TZ: q.Get("tz"),
	})
	if err != nil {
		if errors.Is(err, task.ErrInvalidCategory) || errors.Is(err, service.ErrInvalidTZ) {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", err.Error(), nil)
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "internal error", nil)
		return
	}

	dto := thenVsNowDTO{
		Category:        string(res.Category),
		TZ:              res.TZ,
		From:            res.From.UTC().Format(time.RFC3339),
		To:              res.To.UTC().Format(time.RFC3339),
		ModeByWeek:      make([]modeWeekDTO, 0, len(res.ModeByWeek)),
		CompletedByWeek: make([]completedWeekDTO, 0, len(res.CompletedByWeek)),
		FrictionByWeek:  make([]frictionWeekDTO, 0, len(res.FrictionByWeek)),
	}
	for _, b := range res.ModeByWeek {
		dto.ModeByWeek = append(dto.ModeByWeek, modeWeekDTO{
			Week: b.WeekStart.Format(weekFmt), Mode: string(b.Mode), Seconds: b.TotalSeconds,
		})
	}
	for _, b := range res.CompletedByWeek {
		var avg int64
		if b.TaskCount > 0 {
			avg = b.TotalSeconds / b.TaskCount
		}
		dto.CompletedByWeek = append(dto.CompletedByWeek, completedWeekDTO{
			Week: b.WeekStart.Format(weekFmt), TaskCount: b.TaskCount,
			TotalSeconds: b.TotalSeconds, AvgSecondsPerTask: avg,
		})
	}
	for _, b := range res.FrictionByWeek {
		dto.FrictionByWeek = append(dto.FrictionByWeek, frictionWeekDTO{
			Week: b.WeekStart.Format(weekFmt), PatternTag: string(b.PatternTag), Count: b.Count,
		})
	}
	response.Success(w, http.StatusOK, dto)
}
