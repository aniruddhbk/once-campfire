#!/bin/bash
# Install Campfire Style Git Hooks

set -e

echo "📦 Installing git hooks..."

# Find git root directory
GIT_ROOT=$(git rev-parse --show-toplevel)
HOOKS_DIR="$GIT_ROOT/.git/hooks"

# Copy hooks
cp pre-commit "$HOOKS_DIR/pre-commit"
cp pre-push "$HOOKS_DIR/pre-push"

# Make executable
chmod +x "$HOOKS_DIR/pre-commit"
chmod +x "$HOOKS_DIR/pre-push"

echo "✅ Git hooks installed!"
echo ""
echo "Installed hooks:"
echo "  • pre-commit  - Style checks before commit"
echo "  • pre-push    - Test suite before push"
echo ""
echo "💡 To skip hooks (emergency only):"
echo "   git commit --no-verify"
echo "   git push --no-verify"
