package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/Rioh1118/orbit/backend/internal/domain/worksession"
	appmw "github.com/Rioh1118/orbit/backend/internal/httpapi/middleware"
	"github.com/Rioh1118/orbit/backend/internal/httpapi/response"
	"github.com/Rioh1118/orbit/backend/internal/repo"
	"github.com/Rioh1118/orbit/backend/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type WorkSessionHandler struct {
	svc *service.WorkSessionService
}

func NewWorkSessionHandler(svc *service.WorkSessionService) *WorkSessionHandler {
	return &WorkSessionHandler{svc: svc}
}

func (h *WorkSessionHandler) Routes() http.Handler {
	r := chi.NewRouter()
	r.Get("/", h.list)
	r.Get("/active", h.active)
	r.Post("/start", h.start)
	r.Post("/{id}/end", h.end)
	r.Patch("/{id}", h.update)
	r.Delete("/{id}", h.delete)
	return r
}

type workSessionDTO struct {
	ID          uuid.UUID  `json:"id"`
	TaskID      *uuid.UUID `json:"task_id"`
	Mode        string     `json:"mode"`
	StartedAt   string     `json:"started_at"`
	EndedAt     *string    `json:"ended_at"`
	DurationSec *int       `json:"duration_sec"`
	Density     *int       `json:"density"`
	Note        string     `json:"note"`
	CreatedAt   string     `json:"created_at"`
	UpdatedAt   string     `json:"updated_at"`
}

func wsToDTO(w *worksession.WorkSession) workSessionDTO {
	return workSessionDTO{
		ID:          w.ID,
		TaskID:      w.TaskID,
		Mode:        string(w.Mode),
		StartedAt:   w.StartedAt.UTC().Format(time.RFC3339),
		EndedAt:     fmtTimePtr(w.EndedAt),
		DurationSec: w.DurationSec,
		Density:     w.Density,
		Note:        w.Note,
		CreatedAt:   w.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt:   w.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func parseRFC3339Ptr(s string) (*time.Time, error) {
	if s == "" {
		return nil, nil
	}
	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (h *WorkSessionHandler) list(w http.ResponseWriter, r *http.Request) {
	uid, _ := appmw.UserIDFromCtx(r.Context())
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))

	var taskID *uuid.UUID
	if s := q.Get("task_id"); s != "" {
		id, err := uuid.Parse(s)
		if err != nil {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid task_id", nil)
			return
		}
		taskID = &id
	}

	var mode *worksession.Mode
	if s := q.Get("mode"); s != "" {
		m := worksession.Mode(s)
		if !m.Valid() {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid mode", nil)
			return
		}
		mode = &m
	}

	from, err := parseRFC3339Ptr(q.Get("from"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid from", nil)
		return
	}
	to, err := parseRFC3339Ptr(q.Get("to"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid to", nil)
		return
	}

	sessions, total, err := h.svc.List(r.Context(), service.WSListInput{
		UserID: uid, TaskID: taskID, Mode: mode, From: from, To: to, Limit: limit, Offset: offset,
	})
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error(), nil)
		return
	}
	dtos := make([]workSessionDTO, len(sessions))
	for i, s := range sessions {
		dtos[i] = wsToDTO(s)
	}
	effectiveLimit := limit
	if effectiveLimit <= 0 {
		effectiveLimit = 50
	}
	response.List(w, http.StatusOK, dtos, response.MetaObj{
		Total: int(total), Limit: effectiveLimit, Offset: offset,
	})
}

func (h *WorkSessionHandler) active(w http.ResponseWriter, r *http.Request) {
	uid, _ := appmw.UserIDFromCtx(r.Context())
	sessions, err := h.svc.ListActive(r.Context(), uid)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error(), nil)
		return
	}
	dtos := make([]workSessionDTO, len(sessions))
	for i, s := range sessions {
		dtos[i] = wsToDTO(s)
	}
	response.Success(w, http.StatusOK, dtos)
}

type startReq struct {
	Mode   string  `json:"mode"`
	TaskID *string `json:"task_id"`
	Note   string  `json:"note"`
}

func (h *WorkSessionHandler) start(w http.ResponseWriter, r *http.Request) {
	uid, _ := appmw.UserIDFromCtx(r.Context())
	var req startReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid json", nil)
		return
	}
	var taskID *uuid.UUID
	if req.TaskID != nil && *req.TaskID != "" {
		id, err := uuid.Parse(*req.TaskID)
		if err != nil {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid task_id", nil)
			return
		}
		taskID = &id
	}
	mode := worksession.Mode(req.Mode)
	if !mode.Valid() {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid mode", map[string]any{"field": "mode"})
		return
	}
	session, err := h.svc.Start(r.Context(), service.WSStartInput{
		UserID: uid, TaskID: taskID, Mode: mode, Note: req.Note,
	})
	if err != nil {
		if errors.Is(err, worksession.ErrInvalidMode) || errors.Is(err, worksession.ErrNoteTooLong) {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", err.Error(), nil)
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error(), nil)
		return
	}
	response.Success(w, http.StatusCreated, wsToDTO(session))
}

type endReq struct {
	Density *int `json:"density"`
}

func (h *WorkSessionHandler) end(w http.ResponseWriter, r *http.Request) {
	uid, _ := appmw.UserIDFromCtx(r.Context())
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid id", nil)
		return
	}
	var req endReq
	if r.ContentLength > 0 {
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid json", nil)
			return
		}
	}
	session, err := h.svc.End(r.Context(), service.WSEndInput{ID: id, UserID: uid, Density: req.Density})
	if err != nil {
		if errors.Is(err, repo.ErrWorkSessionNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "work session not found", nil)
			return
		}
		if errors.Is(err, worksession.ErrAlreadyEnded) {
			response.Error(w, http.StatusConflict, "CONFLICT", err.Error(), nil)
			return
		}
		if errors.Is(err, worksession.ErrInvalidDensity) || errors.Is(err, worksession.ErrEndBeforeStart) {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", err.Error(), nil)
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error(), nil)
		return
	}
	response.Success(w, http.StatusOK, wsToDTO(session))
}

type wsUpdateReq struct {
	Mode      *string `json:"mode"`
	TaskID    *string `json:"task_id"`
	StartedAt *string `json:"started_at"`
	EndedAt   *string `json:"ended_at"`
	Density   *int    `json:"density"`
	Note      *string `json:"note"`
}

func (h *WorkSessionHandler) update(w http.ResponseWriter, r *http.Request) {
	uid, _ := appmw.UserIDFromCtx(r.Context())
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid id", nil)
		return
	}
	var req wsUpdateReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid json", nil)
		return
	}
	in := service.WSUpdateInput{ID: id, UserID: uid, Density: req.Density, Note: req.Note}
	if req.Mode != nil {
		m := worksession.Mode(*req.Mode)
		in.Mode = &m
	}
	if req.TaskID != nil {
		if *req.TaskID == "" {
			in.ClearTaskID = true
		} else {
			tid, err := uuid.Parse(*req.TaskID)
			if err != nil {
				response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid task_id", nil)
				return
			}
			in.TaskID = &tid
		}
	}
	if req.StartedAt != nil {
		t, err := time.Parse(time.RFC3339, *req.StartedAt)
		if err != nil {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid started_at", nil)
			return
		}
		in.StartedAt = &t
	}
	if req.EndedAt != nil {
		t, err := time.Parse(time.RFC3339, *req.EndedAt)
		if err != nil {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid ended_at", nil)
			return
		}
		in.EndedAt = &t
	}
	session, err := h.svc.Update(r.Context(), in)
	if err != nil {
		if errors.Is(err, repo.ErrWorkSessionNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "work session not found", nil)
			return
		}
		if errors.Is(err, worksession.ErrInvalidMode) || errors.Is(err, worksession.ErrInvalidDensity) ||
			errors.Is(err, worksession.ErrEndBeforeStart) || errors.Is(err, worksession.ErrNoteTooLong) {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", err.Error(), nil)
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error(), nil)
		return
	}
	response.Success(w, http.StatusOK, wsToDTO(session))
}

func (h *WorkSessionHandler) delete(w http.ResponseWriter, r *http.Request) {
	uid, _ := appmw.UserIDFromCtx(r.Context())
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid id", nil)
		return
	}
	if err := h.svc.Delete(r.Context(), id, uid); err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error(), nil)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
