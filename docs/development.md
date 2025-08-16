# Development Guide

This guide covers development setup, best practices, and common workflows for contributing to Oppia.

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Git
- Google Cloud SDK (for local development)

### Setup

1. Clone the repository
2. Install dependencies
3. Set up local environment
4. Start development servers

## Local Development

### Starting the Server

```bash
# Start all services
python -m scripts.start

# Start backend only
python -m scripts.run_backend_tests

# Start frontend only
python -m scripts.run_frontend_tests
```

### Development Mode

Ensure `DEV_MODE = True` in your local configuration to enable development features.

## Math Classroom Generator for Local Development

### Quick Setup

To generate a complete math classroom for local development:

```bash
# 1. Ensure you're in development mode
# Check that DEV_MODE = True in constants.py

# 2. Start the local server
python -m scripts.start

# 3. Navigate to Admin page
# Go to http://localhost:8181/admin

# 4. Generate the classroom
# Click "Generate Math Classroom" button
```

### What Gets Created

The generator creates these entities in sequence:

1. **Skills** (3 total)

   - Basic Fractions
   - Fraction Operations
   - Advanced Fractions

2. **Topic**: Fractions

   - 3 subtopics linked to skills
   - Diagnostic test enabled
   - Proper thumbnails and colors

3. **Story**: Fractions Story

   - 3 chapters with explorations
   - Linear progression between chapters
   - Proper node linking

4. **Explorations** (3 total)

   - Chapter 1, 2, 3
   - EndExploration interactions
   - Published and indexed

5. **Questions** (9 total)

   - 3 questions per skill
   - Proper skill linking
   - Ready for practice sessions

6. **Classroom**: Math
   - Linked to Fractions topic
   - Published and accessible
   - Proper thumbnails and banners

### Verification

After generation, verify:

```bash
# Check entities were created
python -m scripts.run_backend_tests --test_target=core.controllers.admin_test.GenerateFullMathClassroomTest

# Visit the classroom
# Go to http://localhost:8181/classroom/math

# Test story progression
# Navigate through the Fractions story chapters

# Practice skills
# Use the practice session feature
```

### Troubleshooting

**"Entity not found" errors**: Ensure you're running as curriculum admin
**"User does not have enough rights"**: Check your user role assignment
**Missing entities**: Verify DEV_MODE is enabled

## Testing

### Running Tests

```bash
# Backend tests
python -m scripts.run_backend_tests

# Frontend tests
python -m scripts.run_frontend_tests

# Specific test
python -m scripts.run_backend_tests --test_target=core.controllers.admin_test.GenerateFullMathClassroomTest
```

### Writing Tests

Follow Oppia's testing conventions:

- Use descriptive test names
- Test both success and failure cases
- Mock external dependencies
- Clean up test data

## Code Style

### Python

- Follow PEP 8
- Use type hints
- Write docstrings for all functions
- Follow Oppia's naming conventions

### JavaScript/TypeScript

- Use ESLint rules
- Follow Angular style guide
- Use proper typing
- Write unit tests

## Common Workflows

### Adding New Features

1. Create feature branch
2. Implement functionality
3. Add tests
4. Update documentation
5. Submit PR

### Bug Fixes

1. Reproduce the issue
2. Write failing test
3. Fix the bug
4. Verify test passes
5. Submit PR

## Deployment

### Local Testing

Test your changes thoroughly in the local environment before submitting.

### Code Review

Ensure your code follows Oppia's standards and passes all tests.
