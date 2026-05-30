package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/Rioh1118/orbit/backend/internal/domain/task"
	appmw "github.com/Rioh1118/orbit/backend/internal/httpapi/middleware"
	"github.com/Rioh1118/orbit/backend/internal/httpapi/response"
	"github.com/Rioh1118/orbit/backend/internal/repo"
	"github.com/Rioh1118/orbit/backend/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type TaskHandler struct {
	svc *service.TaskService
}

func NewTaskHandler(svc *service.TaskService) *TaskHandler {
	return &TaskHandler{svc: svc}
}

func (h *TaskHandler) Routes() http.Handler {
	r := chi.NewRouter()
	r.Get("/", h.list)
	r.Post("/", h.create)
	r.Get("/{id}", h.get)
	r.Patch("/{id}", h.update)
	r.Delete("/{id}", h.delete)
	return r
}

type taskDTO struct {
	ID          uuid.UUID `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Category    string    `json:"category"`
	Status      string    `json:"status"`
	ExternalRef string    `json:"external_ref"`
	StartedAt   *string   `json:"started_at"`
	CompletedAt *string   `json:"completed_at"`
	CreatedAt   string    `json:"created_at"`
	UpdatedAt   string    `json:"updated_at"`
}

func fmtTimePtr(t *time.Time) *string {
	if t == nil {
		return nil
	}
	s := t.UTC().Format(time.RFC3339)
	return &s
}

func toDTO(t *task.Task) taskDTO {
	return taskDTO{
		ID:          t.ID,
		Title:       t.Title,
		Description: t.Description,
		Category:    string(t.Category),
		Status:      string(t.Status),
		ExternalRef: t.ExternalRef,
		StartedAt:   fmtTimePtr(t.StartedAt),
		CompletedAt: fmtTimePtr(t.CompletedAt),
		CreatedAt:   t.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt:   t.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func (h *TaskHandler) list(w http.ResponseWriter, r *http.Request) {
	uid, _ := appmw.UserIDFromCtx(r.Context())
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	var status *task.Status
	if s := r.URL.Query().Get("status"); s != "" {
		st := task.Status(s)
		if !st.Valid() {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid status", map[string]any{"field": "status"})
			return
		}
		status = &st
	}

	var category *task.Category
	if c := r.URL.Query().Get("category"); c != "" {
		ct := task.Category(c)
		if !ct.Valid() {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid category", map[string]any{"field": "category"})
			return
		}
		category = &ct
	}

	tasks, total, err := h.svc.List(r.Context(), service.ListInput{
		UserID: uid, Status: status, Category: category, Limit: limit, Offset: offset,
	})
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error(), nil)
		return
	}
	dtos := make([]taskDTO, len(tasks))
	for i, t := range tasks {
		dtos[i] = toDTO(t)
	}
	effectiveLimit := limit
	if effectiveLimit <= 0 {
		effectiveLimit = 50
	}
	response.List(w, http.StatusOK, dtos, response.MetaObj{
		Total: int(total), Limit: effectiveLimit, Offset: offset,
	})
}

type createReq struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Category    string `json:"category"`
	Status      string `json:"status"`
	ExternalRef string `json:"external_ref"`
}

func (h *TaskHandler) create(w http.ResponseWriter, r *http.Request) {
	uid, _ := appmw.UserIDFromCtx(r.Context())
	var req createReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid json", nil)
		return
	}
	t, err := h.svc.Create(r.Context(), service.CreateInput{
		UserID:      uid,
		Title:       req.Title,
		Description: req.Description,
		Category:    task.Category(req.Category),
		Status:      task.Status(req.Status),
		ExternalRef: req.ExternalRef,
	})
	if err != nil {
		if errors.Is(err, task.ErrInvalidTitle) ||
			errors.Is(err, task.ErrInvalidStatus) ||
			errors.Is(err, task.ErrInvalidCategory) {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", err.Error(), nil)
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error(), nil)
		return
	}
	response.Success(w, http.StatusCreated, toDTO(t))
}

func (h *TaskHandler) get(w http.ResponseWriter, r *http.Request) {
	uid, _ := appmw.UserIDFromCtx(r.Context())
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid id", nil)
		return
	}
	t, err := h.svc.Get(r.Context(), id, uid)
	if err != nil {
		if errors.Is(err, repo.ErrTaskNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "task not found", nil)
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error(), nil)
		return
	}
	response.Success(w, http.StatusOK, toDTO(t))
}

type updateReq struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
	Category    *string `json:"category"`
	Status      *string `json:"status"`
	ExternalRef *string `json:"external_ref"`
}

func (h *TaskHandler) update(w http.ResponseWriter, r *http.Request) {
	uid, _ := appmw.UserIDFromCtx(r.Context())
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid id", nil)
		return
	}
	var req updateReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid json", nil)
		return
	}
	var status *task.Status
	if req.Status != nil {
		s := task.Status(*req.Status)
		status = &s
	}
	var category *task.Category
	if req.Category != nil {
		c := task.Category(*req.Category)
		category = &c
	}
	t, err := h.svc.Update(r.Context(), service.UpdateInput{
		ID:          id,
		UserID:      uid,
		Title:       req.Title,
		Description: req.Description,
		Category:    category,
		Status:      status,
		ExternalRef: req.ExternalRef,
	})
	if err != nil {
		if errors.Is(err, repo.ErrTaskNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "task not found", nil)
			return
		}
		if errors.Is(err, task.ErrInvalidStatus) ||
			errors.Is(err, task.ErrInvalidTitle) ||
			errors.Is(err, task.ErrInvalidCategory) {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", err.Error(), nil)
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error(), nil)
		return
	}
	response.Success(w, http.StatusOK, toDTO(t))
}

func (h *TaskHandler) delete(w http.ResponseWriter, r *http.Request) {
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
