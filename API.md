# DiscoveryIntel API Documentation

Base URL: `http://localhost:3001` (development)

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### POST /api/auth/signup

Create a new user account.

**Request:**
```json
{
  "email": "attorney@lawfirm.com",
  "password": "securepassword123"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "email": "attorney@lawfirm.com",
    "created_at": "2026-03-12T10:00:00Z"
  },
  "token": "jwt-token-string"
}
```

**Errors:**
- `400` - Email already registered
- `400` - Invalid email or password format

### POST /api/auth/login

Login to existing account.

**Request:**
```json
{
  "email": "attorney@lawfirm.com",
  "password": "securepassword123"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "attorney@lawfirm.com",
    "created_at": "2026-03-12T10:00:00Z"
  },
  "token": "jwt-token-string"
}
```

**Errors:**
- `401` - Invalid credentials

### GET /api/auth/me

Get current user information.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "attorney@lawfirm.com",
    "created_at": "2026-03-12T10:00:00Z"
  }
}
```

**Errors:**
- `401` - Invalid or missing token
- `404` - User not found

## Cases

### GET /api/cases

List all cases for authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "cases": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "case_name": "Smith v. ABC Corp",
      "description": "Property damage dispute",
      "created_at": "2026-03-12T10:00:00Z"
    }
  ]
}
```

### POST /api/cases

Create a new case.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "case_name": "Smith v. ABC Corp",
  "description": "Property damage dispute"
}
```

**Response:** `201 Created`
```json
{
  "case": {
    "id": "uuid",
    "user_id": "uuid",
    "case_name": "Smith v. ABC Corp",
    "description": "Property damage dispute",
    "created_at": "2026-03-12T10:00:00Z"
  }
}
```

### GET /api/cases/:id

Get case details with documents.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "case": {
    "id": "uuid",
    "user_id": "uuid",
    "case_name": "Smith v. ABC Corp",
    "description": "Property damage dispute",
    "created_at": "2026-03-12T10:00:00Z"
  },
  "documents": [
    {
      "id": "uuid",
      "case_id": "uuid",
      "filename": "inspection_report.pdf",
      "file_type": "application/pdf",
      "file_size": 1024000,
      "storage_path": "case-id/file-name.pdf",
      "upload_date": "2026-03-12T10:30:00Z",
      "processing_status": "completed"
    }
  ]
}
```

**Errors:**
- `404` - Case not found or unauthorized

## Documents

### POST /api/documents/upload

Upload a discovery document.

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request:** Form data with:
- `file`: File (PDF, DOCX, TXT)
- `caseId`: UUID string

**Response:** `201 Created`
```json
{
  "document_id": "uuid",
  "filename": "inspection_report.pdf",
  "status": "pending"
}
```

**Errors:**
- `400` - No file or invalid file type
- `404` - Case not found
- `413` - File too large (>50MB)

### GET /api/documents/:caseId

List all documents for a case.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "documents": [...]
}
```

### GET /api/documents/:id/status

Check document processing status.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "status": "completed",
  "error": null
}
```

Status values: `pending`, `processing`, `completed`, `failed`

## Analysis

### POST /api/analysis/:caseId/run

Trigger full analysis for a case.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "message": "Analysis started",
  "case_id": "uuid"
}
```

### GET /api/analysis/:caseId/timeline

Get case timeline.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "events": [
    {
      "date": "2024-01-15",
      "event": "Initial inspection conducted",
      "document_source": "inspection_report.pdf",
      "document_id": "uuid",
      "confidence": 0.95
    }
  ]
}
```

### GET /api/analysis/:caseId/contradictions

Get detected contradictions.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "contradictions": [
    {
      "id": "uuid",
      "statement_a": "No damage observed",
      "statement_b": "Significant damage documented",
      "source_a": "adjuster_report.pdf",
      "source_b": "engineer_report.pdf",
      "document_id_a": "uuid",
      "document_id_b": "uuid",
      "severity": "high",
      "explanation": "Direct contradiction between reports"
    }
  ]
}
```

### GET /api/analysis/:caseId/impeachment

Get impeachment opportunities.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "opportunities": [
    {
      "id": "uuid",
      "witness": "John Smith",
      "statement": "I conducted thorough inspection",
      "contradicting_evidence": "Time logs show 10 minute visit",
      "document_source": "time_logs.pdf",
      "document_id": "uuid",
      "page_reference": "Page 3",
      "strength": "high"
    }
  ]
}
```

### GET /api/analysis/:caseId/evidence

Get evidence signals.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "signals": [
    {
      "id": "uuid",
      "signal_type": "admission",
      "description": "Internal email admits fault",
      "document_source": "emails.pdf",
      "document_id": "uuid",
      "page_reference": "Page 5",
      "importance": "critical"
    }
  ]
}
```

Signal types: `admission`, `inconsistency`, `suspicious_communication`, `timeline_gap`, `other`

### GET /api/analysis/:caseId/deposition

Get deposition analysis.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "analyses": [
    {
      "id": "uuid",
      "witness": "John Smith",
      "key_admissions": [
        {
          "page_reference": "Page 45",
          "statement": "I did not review the photos",
          "analysis": "Admission of incomplete investigation",
          "significance": "high"
        }
      ],
      "contradictions": [...],
      "evasive_answers": [...],
      "document_id": "uuid"
    }
  ]
}
```

### GET /api/analysis/:caseId/strategy

Get case strategy summary.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "case_strengths": [
    "Strong documentary evidence",
    "Multiple contradictions in defense testimony"
  ],
  "case_weaknesses": [
    "Delayed claim filing",
    "Some pre-existing conditions"
  ],
  "key_leverage_points": [
    "Internal emails show bad faith",
    "Expert report supports claim"
  ],
  "potential_defense_narrative": "Defense will likely argue...",
  "recommended_actions": [
    "Depose claims manager",
    "Request internal communications"
  ]
}
```

## Search

### POST /api/search

Semantic search across case documents.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "caseId": "uuid",
  "query": "What contradicts the engineer report?",
  "limit": 10
}
```

**Response:** `200 OK`
```json
{
  "results": [
    {
      "document_id": "uuid",
      "document_name": "adjuster_report.pdf",
      "chunk_text": "The damage appears to be from normal wear...",
      "similarity_score": 0.89,
      "page_reference": null
    }
  ]
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "ErrorName",
  "message": "Human-readable error message",
  "statusCode": 400
}
```

Common status codes:
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limits

Currently no rate limits implemented. Consider adding for production:
- 100 requests per minute per user
- 10 document uploads per hour per user
- 50 search queries per hour per user

## Webhooks

Not currently implemented. Future feature for:
- Document processing completion
- Analysis completion
- Error notifications

## SDKs

JavaScript/TypeScript client available in frontend code:
- See `frontend/src/lib/api.ts` for reference implementation
- Can be extracted into standalone npm package
