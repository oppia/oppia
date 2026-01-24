#!/bin/bash
# Script to verify frontend and full-stack tests before pushing
# Usage: ./verify_before_push.sh

set -e  # Exit on error

echo "=========================================="
echo "Verifying tests before push..."
echo "=========================================="

# Activate venv
source venv/bin/activate

# Set Node.js path
export PATH="/home/vxtr/Desktop/oppia_tools/node-16.13.0/bin:$PATH"

echo ""
echo "1. Running TypeScript checks..."
python -m scripts.run_typescript_checks --strict_checks
echo "✓ TypeScript checks passed"

echo ""
echo "2. Running lint checks on changed files..."
python -m scripts.linters.run_lint_checks --files \
  core/templates/pages/exploration-editor-page/editor-tab/exploration-editor-tab.component.spec.ts \
  core/templates/pages/exploration-editor-page/editor-tab/exploration-editor-tab.component.ts \
  core/templates/pages/exploration-editor-page/editor-tab/services/solution-verification.service.spec.ts \
  core/templates/pages/exploration-editor-page/editor-tab/templates/modal-templates/add-answer-group-modal.component.ts \
  core/templates/pages/exploration-editor-page/editor-tab/templates/modal-templates/customize-interaction-modal.component.spec.ts \
  core/templates/pages/exploration-editor-page/editor-tab/templates/modal-templates/customize-interaction-modal.component.ts \
  core/templates/pages/exploration-editor-page/editor-tab/training-panel/training-data.service.spec.ts \
  core/templates/pages/exploration-editor-page/editor-tab/training-panel/training-modal.component.spec.ts \
  core/templates/pages/exploration-editor-page/editor-tab/training-panel/training-modal.component.ts
echo "✓ Lint checks passed"

echo ""
echo "3. Running frontend tests for Group 6 files..."
python -m scripts.run_frontend_tests --specs_to_run=\
core/templates/pages/exploration-editor-page/editor-tab/exploration-editor-tab.component.spec.ts,\
core/templates/pages/exploration-editor-page/editor-tab/services/solution-verification.service.spec.ts,\
core/templates/pages/exploration-editor-page/editor-tab/templates/modal-templates/customize-interaction-modal.component.spec.ts,\
core/templates/pages/exploration-editor-page/editor-tab/training-panel/training-data.service.spec.ts,\
core/templates/pages/exploration-editor-page/editor-tab/training-panel/training-modal.component.spec.ts
echo "✓ Frontend tests passed"

echo ""
echo "4. Running a sample full-stack acceptance test..."
echo "   (This may take several minutes)"
python -m scripts.run_acceptance_tests \
  --suite="exploration-editor/publish-the-exploration-with-an-interaction" \
  --headless \
  --skip_build
echo "✓ Full-stack test passed"

echo ""
echo "=========================================="
echo "All verifications passed! Safe to push."
echo "=========================================="
