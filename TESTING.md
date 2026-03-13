# DiscoveryIntel Testing Guide

## Manual Testing Checklist

### Authentication Flow

- [ ] Sign up with new email
- [ ] Sign up with existing email (should fail)
- [ ] Sign up with weak password (should fail)
- [ ] Login with correct credentials
- [ ] Login with wrong password (should fail)
- [ ] Access protected route without token (should redirect)
- [ ] Logout and verify token cleared

### Case Management

- [ ] Create new case with name only
- [ ] Create new case with name and description
- [ ] View list of cases
- [ ] Click on case to view details
- [ ] Verify only user's cases are visible

### Document Upload

- [ ] Upload PDF file
- [ ] Upload DOCX file
- [ ] Upload TXT file
- [ ] Try uploading invalid file type (should fail)
- [ ] Try uploading file >50MB (should fail)
- [ ] Verify processing status changes from pending → processing → completed
- [ ] Check document appears in case view

### Document Processing

- [ ] Upload text-based PDF (verify text extraction)
- [ ] Upload scanned PDF (verify OCR runs)
- [ ] Upload DOCX with formatting (verify text extraction)
- [ ] Check document_chunks created in database
- [ ] Verify embeddings generated

### Analysis Results

- [ ] Upload multiple documents to a case
- [ ] Wait for all to process
- [ ] Verify timeline tab shows events
- [ ] Check contradictions tab for conflicts
- [ ] Review impeachment opportunities
- [ ] Check evidence signals
- [ ] View deposition analysis (if transcript uploaded)
- [ ] Review case strategy summary

### Search Functionality

- [ ] Enter search query
- [ ] Verify results returned with similarity scores
- [ ] Try different queries
- [ ] Verify results are from correct case only

### Demo Mode

- [ ] Access /demo page
- [ ] Verify pre-loaded data displays
- [ ] Check all tabs work
- [ ] Verify "Get Started" CTA works

### UI/UX

- [ ] Responsive design on mobile
- [ ] Responsive design on tablet
- [ ] All buttons clickable
- [ ] Forms validate properly
- [ ] Error messages display correctly
- [ ] Loading states show during async operations
- [ ] Navigation works correctly

## Test Cases

### Test Case 1: Simple Case with One Document

1. Create case "Test Case 1"
2. Upload single PDF document
3. Wait for processing
4. Verify timeline generated
5. Check evidence signals extracted

**Expected Result:** Basic analysis completes successfully

### Test Case 2: Complex Case with Multiple Documents

1. Create case "Insurance Dispute"
2. Upload 5 different documents:
   - Deposition transcript
   - Engineer report
   - Adjuster report
   - Email chain
   - Inspection photos (PDF)
3. Wait for all processing
4. Verify all analysis modules run
5. Check contradictions found between documents
6. Verify impeachment opportunities identified

**Expected Result:** Full analysis with contradictions and impeachment opportunities

### Test Case 3: Search Functionality

1. Use case from Test Case 2
2. Search: "What does the engineer say about damage?"
3. Verify relevant chunks returned
4. Search: "Timeline of inspections"
5. Verify chronological information returned

**Expected Result:** Relevant results with high similarity scores

### Test Case 4: Error Handling

1. Try uploading without selecting file
2. Try uploading .exe file
3. Try accessing another user's case
4. Try invalid login credentials
5. Try creating case with empty name

**Expected Result:** Appropriate error messages displayed

## API Testing with cURL

### Sign Up
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Create Case
```bash
curl -X POST http://localhost:3001/api/cases \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"case_name":"Test Case","description":"Test description"}'
```

### Upload Document
```bash
curl -X POST http://localhost:3001/api/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/document.pdf" \
  -F "caseId=YOUR_CASE_ID"
```

### Get Timeline
```bash
curl http://localhost:3001/api/analysis/YOUR_CASE_ID/timeline \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Search
```bash
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"caseId":"YOUR_CASE_ID","query":"wind damage","limit":5}'
```

## Database Testing

### Verify Data Integrity

```sql
-- Check user created
SELECT * FROM users WHERE email = 'test@example.com';

-- Check case created
SELECT * FROM cases WHERE user_id = 'USER_ID';

-- Check document uploaded
SELECT id, filename, processing_status FROM documents WHERE case_id = 'CASE_ID';

-- Check chunks created
SELECT COUNT(*) FROM document_chunks WHERE document_id = 'DOCUMENT_ID';

-- Check embeddings exist
SELECT COUNT(*) FROM document_chunks WHERE embedding_vector IS NOT NULL;

-- Check analysis results
SELECT analysis_type, created_at FROM analysis_results WHERE case_id = 'CASE_ID';
```

### Vector Search Test

```sql
-- Test vector similarity search
SELECT * FROM search_document_chunks(
  '[0.1, 0.2, ...]'::text,  -- Sample embedding
  0.7,
  10,
  'CASE_ID'::uuid
);
```

## Performance Testing

### Document Processing Time

- Small PDF (1-5 pages): 30-60 seconds
- Medium PDF (10-20 pages): 1-2 minutes
- Large PDF (50+ pages): 3-5 minutes
- DOCX files: Generally faster than PDF

### Analysis Time

- Timeline: 30-60 seconds per document
- Contradictions: 1-2 minutes per document pair
- Full analysis (5 documents): 5-10 minutes

### Search Performance

- Query response time: <2 seconds
- Embedding generation: <1 second
- Vector search: <500ms

## Load Testing

Use tools like Apache Bench or k6:

```bash
# Install k6
# Test signup endpoint
k6 run load-test.js
```

Sample k6 script:
```javascript
import http from 'k6/http';

export default function() {
  const payload = JSON.stringify({
    email: `test${__VU}@example.com`,
    password: 'password123'
  });

  http.post('http://localhost:3001/api/auth/signup', payload, {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

## Security Testing

### Authentication
- [ ] JWT expires after 7 days
- [ ] Invalid tokens rejected
- [ ] Expired tokens rejected
- [ ] Password requirements enforced

### Authorization
- [ ] Users cannot access other users' cases
- [ ] Users cannot upload to other users' cases
- [ ] RLS policies enforced in database

### Input Validation
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized
- [ ] File upload restrictions enforced
- [ ] Request size limits enforced

## Automated Testing

### Unit Tests (Future)

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Integration Tests (Future)

Test complete workflows:
- User signup → create case → upload document → view results
- Search functionality end-to-end
- Analysis pipeline completion

### E2E Tests (Future)

Use Playwright or Cypress:
```bash
npm run test:e2e
```

## Monitoring Tests

### Health Check
```bash
curl http://localhost:3001/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2026-03-12T10:00:00.000Z"
}
```

### Database Connection
Check Supabase dashboard for:
- Active connections
- Query performance
- Error logs

### OpenAI API
Monitor:
- API response times
- Error rates
- Token usage
- Cost per request

## Bug Reporting

When reporting bugs, include:

1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Screenshots** (if UI issue)
5. **Console logs** (browser and server)
6. **Environment details** (OS, Node version, browser)
7. **Database state** (relevant table contents)

## Test Data

### Sample Documents

Create test documents for different scenarios:

1. **Simple Timeline Test**: Document with clear dates
2. **Contradiction Test**: Two documents with conflicting info
3. **Deposition Test**: Transcript with Q&A format
4. **Evidence Test**: Document with admissions
5. **Large Document Test**: 50+ page PDF

### Sample Queries

Test search with:
- "What caused the damage?"
- "Timeline of inspections"
- "What does the engineer report say?"
- "Contradictions in testimony"
- "Evidence of bad faith"

## Known Limitations

- OCR quality depends on scan quality
- GPT-4 context limits (may truncate very long documents)
- Processing time increases with document count
- Vector search accuracy depends on embedding quality
- No real-time updates (requires page refresh)

## Future Testing Needs

- Automated test suite
- CI/CD pipeline with tests
- Performance benchmarks
- Security audit
- Accessibility testing
- Cross-browser compatibility
- Mobile device testing
