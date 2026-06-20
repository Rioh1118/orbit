package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/Rioh1118/orbit/backend/internal/domain/friction"
	appmw "github.com/Rioh1118/orbit/backend/internal/httpapi/middleware"
	"github.com/Rioh1118/orbit/backend/internal/httpapi/response"
	"github.com/Rioh1118/orbit/backend/internal/repo"
	"github.com/Rioh1118/orbit/backend/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type FrictionHandler struct {
	svc *service.FrictionService
}

func NewFrictionHandler(svc *service.FrictionService) *FrictionHandler {
	return &FrictionHandler{svc: svc}
}

func (h *FrictionHandler) Routes() http.Handler {
	r := chi.NewRouter()
	r.Get("/", h.list)
	r.Post("/", h.create)
	r.Patch("/{id}", h.update)
	r.Delete("/{id}", h.delete)
	return r
}

type frictionDTO struct {
	ID             uuid.UUID  `json:"id"`
	TaskID         *uuid.UUID `json:"task_id"`
	WorkSliceID    *uuid.UUID `json:"work_slice_id"`
	PatternTag     string     `json:"pattern_tag"`
	Description    string     `json:"description"`
	ResolvedAt     *string    `json:"resolved_at"`
	ResolutionNote string     `json:"resolution_note"`
	CreatedAt      string     `json:"created_at"`
	UpdatedAt      string     `json:"updated_at"`
}

func fToDTO(f *friction.Friction) frictionDTO {
	return frictionDTO{
		ID:             f.ID,
		TaskID:         f.TaskID,
		WorkSliceID:    f.WorkSliceID,
		PatternTag:     string(f.PatternTag),
		Description:    f.Description,
		ResolvedAt:     fmtTimePtr(f.ResolvedAt),
		ResolutionNote: f.ResolutionNote,
		CreatedAt:      f.CreatedAt.UTC().Format(time.RFC3339),
		UpdatedAt:      f.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func (h *FrictionHandler) list(w http.ResponseWriter, r *http.Request) {
	uid, _ := appmw.UserIDFromCtx(r.Context())
	q := r.URL.Query()
	limit, _ := strconv.Atoi(q.Get("limit"))
	offset, _ := strconv.Atoi(q.Get("offset"))

	in := service.FListInput{UserID: uid, Limit: limit, Offset: offset}

	if s := q.Get("task_id"); s != "" {
		id, err := uuid.Parse(s)
		if err != nil {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid task_id", nil)
			return
		}
		in.TaskID = &id
	}
	if s := q.Get("work_slice_id"); s != "" {
		id, err := uuid.Parse(s)
		if err != nil {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid work_slice_id", nil)
			return
		}
		in.WorkSliceID = &id
	}
	if s := q.Get("pattern_tag"); s != "" {
		tag := friction.PatternTag(s)
		if !tag.Valid() {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid pattern_tag", nil)
			return
		}
		in.PatternTag = &tag
	}
	if s := q.Get("resolved"); s != "" {
		v, err := strconv.ParseBool(s)
		if err != nil {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid resolved", nil)
			return
		}
		in.Resolved = &v
	}
	if s := q.Get("from"); s != "" {
		t, err := time.Parse(time.RFC3339, s)
		if err != nil {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid from", nil)
			return
		}
		in.From = &t
	}
	if s := q.Get("to"); s != "" {
		t, err := time.Parse(time.RFC3339, s)
		if err != nil {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid to", nil)
			return
		}
		in.To = &t
	}

	rows, total, err := h.svc.List(r.Context(), in)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error(), nil)
		return
	}
	dtos := make([]frictionDTO, len(rows))
	for i, f := range rows {
		dtos[i] = fToDTO(f)
	}
	effectiveLimit := limit
	if effectiveLimit <= 0 {
		effectiveLimit = 50
	}
	response.List(w, http.StatusOK, dtos, response.MetaObj{
		Total: int(total), Limit: effectiveLimit, Offset: offset,
	})
}

type fCreateReq struct {
	TaskID      *string `json:"task_id"`
	WorkSliceID *string `json:"work_slice_id"`
	PatternTag  string  `json:"pattern_tag"`
	Description string  `json:"description"`
}

func parseUUIDPtr(s *string, field string) (*uuid.UUID, error) {
	if s == nil || *s == "" {
		return nil, nil
	}
	id, err := uuid.Parse(*s)
	if err != nil {
		return nil, errors.New("invalid " + field)
	}
	return &id, nil
}

func (h *FrictionHandler) create(w http.ResponseWriter, r *http.Request) {
	uid, _ := appmw.UserIDFromCtx(r.Context())
	var req fCreateReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid json", nil)
		return
	}
	taskID, err := parseUUIDPtr(req.TaskID, "task_id")
	if err != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", err.Error(), nil)
		return
	}
	wsID, err := parseUUIDPtr(req.WorkSliceID, "work_slice_id")
	if err != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", err.Error(), nil)
		return
	}
	tag := friction.PatternTag(req.PatternTag)
	if !tag.Valid() {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid pattern_tag", map[string]any{"field": "pattern_tag"})
		return
	}
	f, err := h.svc.Create(r.Context(), service.FCreateInput{
		UserID:      uid,
		TaskID:      taskID,
		WorkSliceID: wsID,
		PatternTag:  tag,
		Description: req.Description,
	})
	if err != nil {
		if isFrictionValidationErr(err) {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", err.Error(), nil)
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error(), nil)
		return
	}
	response.Success(w, http.StatusCreated, fToDTO(f))
}

type fUpdateReq struct {
	TaskID         *string `json:"task_id"`
	WorkSliceID    *string `json:"work_slice_id"`
	PatternTag     *string `json:"pattern_tag"`
	Description    *string `json:"description"`
	ResolutionNote *string `json:"resolution_note"`
	Resolved       *bool   `json:"resolved"`
}

func (h *FrictionHandler) update(w http.ResponseWriter, r *http.Request) {
	uid, _ := appmw.UserIDFromCtx(r.Context())
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid id", nil)
		return
	}
	var req fUpdateReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", "invalid json", nil)
		return
	}
	in := service.FUpdateInput{
		ID:             id,
		UserID:         uid,
		Description:    req.Description,
		ResolutionNote: req.ResolutionNote,
		Resolve:        req.Resolved,
	}
	if req.TaskID != nil {
		if *req.TaskID == "" {
			in.ClearTaskID = true
		} else {
			tid, err := parseUUIDPtr(req.TaskID, "task_id")
			if err != nil {
				response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", err.Error(), nil)
				return
			}
			in.TaskID = tid
		}
	}
	if req.WorkSliceID != nil {
		if *req.WorkSliceID == "" {
			in.ClearWorkSlice = true
		} else {
			wid, err := parseUUIDPtr(req.WorkSliceID, "work_slice_id")
			if err != nil {
				response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", err.Error(), nil)
				return
			}
			in.WorkSliceID = wid
		}
	}
	if req.PatternTag != nil {
		tag := friction.PatternTag(*req.PatternTag)
		in.PatternTag = &tag
	}
	f, err := h.svc.Update(r.Context(), in)
	if err != nil {
		if errors.Is(err, repo.ErrFrictionNotFound) {
			response.Error(w, http.StatusNotFound, "NOT_FOUND", "friction not found", nil)
			return
		}
		if isFrictionValidationErr(err) {
			response.Error(w, http.StatusBadRequest, "VALIDATION_FAILED", err.Error(), nil)
			return
		}
		response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", err.Error(), nil)
		return
	}
	response.Success(w, http.StatusOK, fToDTO(f))
}

func (h *FrictionHandler) delete(w http.ResponseWriter, r *http.Request) {
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

func isFrictionValidationErr(err error) bool {
	return errors.Is(err, friction.ErrInvalidPatternTag) ||
		errors.Is(err, friction.ErrDescriptionEmpty) ||
		errors.Is(err, friction.ErrDescriptionLong) ||
		errors.Is(err, friction.ErrResolutionLong)
}
