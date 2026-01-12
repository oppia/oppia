#!/bin/bash
# Quick test to verify Bootstrap/FontAwesome webpack bundling

set -e

echo "=========================================="
echo "Testing webpack CSS bundling changes"
echo "=========================================="

echo ""
echo "1. Checking if Bootstrap CSS exists in node_modules..."
if [ -f "node_modules/bootstrap/dist/css/bootstrap.min.css" ]; then
    echo "   ✓ Bootstrap CSS found"
else
    echo "   ✗ Bootstrap CSS NOT found - install dependencies first"
    exit 1
fi

echo ""
echo "2. Checking if FontAwesome CSS exists in node_modules..."
if [ -f "node_modules/@fortawesome/fontawesome-free/css/fontawesome.min.css" ]; then
    echo "   ✓ FontAwesome CSS found"
else
    echo "   ✗ FontAwesome CSS NOT found - install dependencies first"
    exit 1
fi

echo ""
echo "3. Checking if CSS imports are in common-imports.ts..."
if grep -q "bootstrap/dist/css/bootstrap.min.css" core/templates/pages/common-imports.ts; then
    echo "   ✓ Bootstrap import found"
else
    echo "   ✗ Bootstrap import NOT found"
    exit 1
fi

if grep -q "@fortawesome/fontawesome-free/css/fontawesome.min.css" core/templates/pages/common-imports.ts; then
    echo "   ✓ FontAwesome import found"
else
    echo "   ✗ FontAwesome import NOT found"
    exit 1
fi

echo ""
echo "4. Checking that build.py doesn't reference npm_static_assets..."
if grep -q "npm_static_assets" scripts/build.py; then
    echo "   ✗ build.py still has npm_static_assets references"
    exit 1
else
    echo "   ✓ build.py cleaned up"
fi

echo ""
echo "5. Checking HTML files don't have old preload links..."
if grep -q "/third_party/generated/css/third_party" src/index.html; then
    echo "   ✗ index.html still has old CSS preload"
    exit 1
else
    echo "   ✓ HTML files cleaned up"
fi

echo ""
echo "=========================================="
echo "✓ All checks passed!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Watch CI for green checks"
echo "2. (Optional) Run: python -m scripts.start"
echo "3. (Optional) Open http://localhost:8181 and check:"
echo "   - No console errors"
echo "   - FontAwesome icons show"
echo "   - Bootstrap styles work"
