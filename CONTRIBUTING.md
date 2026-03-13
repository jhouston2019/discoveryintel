# Contributing to DiscoveryIntel

Thank you for your interest in contributing to DiscoveryIntel!

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Make your changes
5. Submit a pull request

## Development Setup

See `SETUP.md` for complete setup instructions.

## Code Style

### TypeScript

- Use TypeScript for all new code
- Define interfaces for all data structures
- Avoid `any` types
- Use strict mode

### Formatting

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons
- Use trailing commas in objects/arrays

### Naming Conventions

- **Files**: camelCase for utilities, PascalCase for components
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Interfaces**: PascalCase with descriptive names
- **Functions**: camelCase, verb-based names

## Project Structure

```
/backend
  /src
    /api          # Express route handlers
    /services     # Business logic
      /ai         # AI analysis modules
    /db           # Database utilities
    /middleware   # Express middleware
    /utils        # Helper functions

/frontend
  /src
    /app          # Next.js pages (App Router)
    /components   # React components
      /ui         # ShadCN UI components
    /lib          # Utilities and API client

/shared
  /src            # Shared TypeScript types
```

## Adding New Features

### New AI Analysis Module

1. Create file in `backend/src/services/ai/yourModule.ts`
2. Implement class with analysis method
3. Add to `AnalysisOrchestrator`
4. Create API endpoint in `backend/src/api/analysis.ts`
5. Add frontend display in case page
6. Update types in `shared/src/types.ts`

Example:
```typescript
export class YourAnalyzer {
  async analyze(caseId: string): Promise<YourResult[]> {
    // 1. Fetch relevant documents
    // 2. Call OpenAI API with structured prompt
    // 3. Parse and validate response
    // 4. Store in analysis_results table
    // 5. Return results
  }
}
```

### New UI Component

1. Create component in `frontend/src/components/`
2. Use TypeScript and proper typing
3. Use ShadCN UI components where possible
4. Follow existing patterns for styling
5. Make responsive (mobile-first)

### New API Endpoint

1. Add route in appropriate file in `backend/src/api/`
2. Use authentication middleware
3. Validate inputs with Zod
4. Handle errors properly
5. Document in `API.md`

## Testing

### Before Submitting PR

- [ ] Code builds without errors
- [ ] TypeScript type checks pass
- [ ] No console errors
- [ ] Tested manually
- [ ] Updated documentation if needed

### Run Checks

```bash
# Type check backend
cd backend
npm run type-check

# Type check frontend
cd frontend
npm run type-check

# Lint frontend
npm run lint
```

## Pull Request Process

1. **Create Feature Branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make Changes**
- Write clean, documented code
- Follow existing patterns
- Keep commits atomic

3. **Commit**
```bash
git add .
git commit -m "Add: description of feature"
```

Commit message format:
- `Add:` for new features
- `Fix:` for bug fixes
- `Update:` for improvements
- `Refactor:` for code restructuring
- `Docs:` for documentation

4. **Push**
```bash
git push origin feature/your-feature-name
```

5. **Create PR**
- Go to GitHub repository
- Click "New Pull Request"
- Describe your changes
- Reference any related issues

## Code Review

PRs will be reviewed for:
- Code quality and clarity
- TypeScript usage
- Error handling
- Security considerations
- Performance implications
- Documentation updates

## Areas for Contribution

### High Priority

- Automated test suite
- Additional file format support (MSG, EML)
- Real-time processing status updates
- Export analysis to PDF
- Batch document upload

### Medium Priority

- Advanced search filters
- Document annotations
- Team collaboration features
- Email notifications
- Analytics dashboard

### Nice to Have

- Mobile app
- Browser extension
- Integration with legal software
- Multi-language support
- Voice-to-text for depositions

## Bug Reports

Use GitHub Issues with:
- Clear title
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details

## Feature Requests

Use GitHub Issues with:
- Clear description
- Use case explanation
- Proposed solution (optional)
- Mockups (optional)

## Questions

For questions:
- Check existing documentation
- Search closed issues
- Open new issue with "Question:" prefix

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
