# 🤖 AUTOMATION TOOLKIT: Enforce Campfire Style Automatically

> **Stop manually checking style - automate it!**
>
> Pre-commit hooks, CI/CD scripts, and automated enforcement tools.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Pre-Commit Hooks](#pre-commit-hooks)
3. [CI/CD Integration](#cicd-integration)
4. [Git Hooks](#git-hooks)
5. [Rubocop Configuration](#rubocop-configuration)
6. [AST-Grep Automation](#ast-grep-automation)
7. [Custom Scripts](#custom-scripts)

---

## Quick Start

### Option 1: Full Setup (Recommended)

```bash
# Run the complete setup script
cd automation-toolkit
./install-all.sh

# This installs:
# ✅ Pre-commit hooks
# ✅ Git hooks
# ✅ Rubocop configuration
# ✅ AST-grep rules
# ✅ CI scripts
```

### Option 2: Selective Setup

```bash
# Install only pre-commit hooks
./install-pre-commit.sh

# Install only CI scripts
./install-ci.sh

# Install only Rubocop
./install-rubocop.sh
```

---

## Pre-Commit Hooks

### What Gets Checked:

- ✅ Ruby syntax errors
- ✅ Rubocop style violations
- ✅ AST-grep pattern violations
- ✅ Test failures for changed files
- ✅ Bundle audit (security vulnerabilities)
- ✅ Brakeman (Rails security issues)

### Installation:

```bash
cd automation-toolkit/pre-commit-hooks
./install.sh
```

### Files:

- `pre-commit` - Main pre-commit hook
- `pre-push` - Runs full test suite before push
- `commit-msg` - Validates commit message format
- `post-checkout` - Reminds about bundle install

### Skip Hooks (Emergency):

```bash
# Skip pre-commit hook (use sparingly!)
git commit --no-verify -m "Emergency fix"

# Better: Fix the issues first!
rubocop --auto-correct-all
git commit -m "Fix style violations"
```

---

## CI/CD Integration

### GitHub Actions

**File:** `ci-scripts/github-actions.yml`

```yaml
name: Campfire Style Check

on: [push, pull_request]

jobs:
  style-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: 3.2
          bundler-cache: true

      - name: Run Rubocop
        run: bundle exec rubocop --parallel

      - name: Run AST-grep
        run: |
          npm install -g @ast-grep/cli
          ast-grep scan

      - name: Run Tests
        run: bundle exec rails test
```

**Installation:**

```bash
# Copy to your GitHub workflows
cp ci-scripts/github-actions.yml .github/workflows/style-check.yml
git add .github/workflows/style-check.yml
git commit -m "Add style check CI workflow"
```

### GitLab CI

**File:** `ci-scripts/gitlab-ci.yml`

```yaml
style-check:
  stage: test
  script:
    - bundle install
    - bundle exec rubocop --parallel
    - npm install -g @ast-grep/cli
    - ast-grep scan
  only:
    - merge_requests
    - main
```

### CircleCI

**File:** `ci-scripts/circle-ci.yml`

```yaml
version: 2.1
jobs:
  style-check:
    docker:
      - image: circleci/ruby:3.2
    steps:
      - checkout
      - run: bundle install
      - run: bundle exec rubocop --parallel
      - run: npm install -g @ast-grep/cli && ast-grep scan
```

---

## Git Hooks

### Available Hooks:

#### 1. pre-commit
**Location:** `git-hooks/pre-commit`

Checks:
- Ruby syntax
- Rubocop violations (auto-fix when possible)
- AST-grep patterns
- Test files for changed files

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "🔍 Running pre-commit checks..."

# Get changed Ruby files
FILES=$(git diff --cached --name-only --diff-filter=ACM | grep '\.rb$')

if [ -z "$FILES" ]; then
  echo "✅ No Ruby files changed"
  exit 0
fi

# 1. Check syntax
echo "📝 Checking Ruby syntax..."
for FILE in $FILES; do
  ruby -c "$FILE" > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    echo "❌ Syntax error in $FILE"
    ruby -c "$FILE"
    exit 1
  fi
done

# 2. Run Rubocop with auto-correct
echo "🔧 Running Rubocop..."
bundle exec rubocop --auto-correct $FILES
if [ $? -ne 0 ]; then
  echo "❌ Rubocop violations found (couldn't auto-fix)"
  echo "Run: bundle exec rubocop $FILES"
  exit 1
fi

# 3. Run AST-grep
echo "🔍 Running AST-grep checks..."
for FILE in $FILES; do
  ast-grep scan "$FILE" --config sgconfig.yml
  if [ $? -ne 0 ]; then
    echo "❌ AST-grep violations in $FILE"
    exit 1
  fi
done

# 4. Re-add auto-corrected files
git add $FILES

echo "✅ All pre-commit checks passed!"
```

#### 2. pre-push
**Location:** `git-hooks/pre-push`

Runs full test suite before pushing:

```bash
#!/bin/bash
# .git/hooks/pre-push

echo "🧪 Running tests before push..."

bundle exec rails test
TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -ne 0 ]; then
  echo "❌ Tests failed! Fix them before pushing."
  exit 1
fi

echo "✅ All tests passed! Pushing..."
```

#### 3. commit-msg
**Location:** `git-hooks/commit-msg`

Validates commit message format:

```bash
#!/bin/bash
# .git/hooks/commit-msg

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# Check minimum length
if [ ${#COMMIT_MSG} -lt 10 ]; then
  echo "❌ Commit message too short (minimum 10 characters)"
  echo "Your message: $COMMIT_MSG"
  exit 1
fi

# Check for common typos
if echo "$COMMIT_MSG" | grep -qi "WIP\|TODO\|FIXME" > /dev/null; then
  echo "⚠️  Warning: Commit message contains WIP/TODO/FIXME"
  echo "Are you sure you want to commit? (y/n)"
  read -r response
  if [ "$response" != "y" ]; then
    exit 1
  fi
fi

echo "✅ Commit message validated"
```

### Installation:

```bash
# Install all git hooks
cd automation-toolkit/git-hooks
./install-hooks.sh

# Or manually:
cp pre-commit ../../.git/hooks/
cp pre-push ../../.git/hooks/
cp commit-msg ../../.git/hooks/
chmod +x ../../.git/hooks/*
```

---

## Rubocop Configuration

### Campfire Style Rubocop Config

**File:** `rubocop-configs/.rubocop-campfire.yml`

```yaml
# Campfire Style - Rubocop Configuration
# Based on Rails Omakase + Campfire patterns

inherit_gem:
  rubocop-rails-omakase: rubocop.yml

require:
  - rubocop-rails
  - rubocop-performance
  - rubocop-minitest

AllCops:
  NewCops: enable
  TargetRubyVersion: 3.1
  TargetRailsVersion: 7.1
  Exclude:
    - 'bin/**/*'
    - 'db/schema.rb'
    - 'node_modules/**/*'
    - 'tmp/**/*'
    - 'vendor/**/*'

# ========================================
# Style Rules - Campfire Patterns
# ========================================

Style/Lambda:
  Description: 'Use stabby lambda (->) instead of lambda keyword'
  EnforcedStyle: literal
  Enabled: true

Style/HashSyntax:
  Description: 'Use modern hash syntax (key: value)'
  EnforcedStyle: ruby19
  EnforcedShorthandSyntax: always  # Use {foo:} not {foo: foo}
  Enabled: true

Style/SymbolArray:
  Description: 'Use %i[] for symbol arrays'
  EnforcedStyle: percent
  MinSize: 2
  Enabled: true

Style/StringLiterals:
  Description: 'Use double quotes for strings'
  EnforcedStyle: double_quotes
  Enabled: true

Style/TrailingCommaInArrayLiteral:
  EnforcedStyleForMultiline: comma

Style/TrailingCommaInHashLiteral:
  EnforcedStyleForMultiline: comma

# ========================================
# Rails Rules
# ========================================

Rails/TimeZone:
  Description: 'Use Time.current not Time.now'
  Enabled: true
  EnforcedStyle: flexible

Rails/Date:
  Description: 'Use Date.current not Date.today'
  Enabled: true
  EnforcedStyle: flexible

Rails/PluckInWhere:
  Description: 'Use .pluck instead of .map for simple attributes'
  Enabled: true

Rails/FindEach:
  Description: 'Use .find_each for large collections'
  Enabled: true

Rails/Pick:
  Description: 'Use .pick instead of .pluck.first'
  Enabled: true

# ========================================
# Performance Rules
# ========================================

Performance/Count:
  Description: 'Use .count for ActiveRecord, .size for arrays'
  Enabled: true

Performance/Detect:
  Description: 'Use .detect instead of .select.first'
  Enabled: true

Performance/Size:
  Description: 'Use .size not .count for arrays'
  Enabled: true

# ========================================
# Disabled Rules (Too Strict)
# ========================================

Style/Documentation:
  Enabled: false

Style/FrozenStringLiteralComment:
  Enabled: false

Metrics/MethodLength:
  Max: 25  # Increased from default 10

Metrics/ClassLength:
  Max: 250  # Increased from default 100
```

### Installation:

```bash
# Copy to project root
cp rubocop-configs/.rubocop-campfire.yml ../../.rubocop.yml

# Or link it
ln -s automation-toolkit/rubocop-configs/.rubocop-campfire.yml .rubocop.yml

# Run Rubocop
bundle exec rubocop

# Auto-fix violations
bundle exec rubocop --auto-correct-all
```

---

## AST-Grep Automation

### Automated Scanning Script

**File:** `ast-grep-scan.sh`

```bash
#!/bin/bash
# automation-toolkit/ast-grep-scan.sh

set -e

echo "🔍 Running AST-grep pattern analysis..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if ast-grep is installed
if ! command -v ast-grep &> /dev/null; then
  echo "${RED}❌ ast-grep not installed${NC}"
  echo "Install: npm install -g @ast-grep/cli"
  exit 1
fi

# Scan all Ruby files
VIOLATIONS=$(ast-grep scan --config sgconfig.yml 2>&1 || true)

if [ -z "$VIOLATIONS" ]; then
  echo "${GREEN}✅ No AST-grep violations found!${NC}"
  exit 0
else
  echo "${RED}❌ AST-grep violations found:${NC}"
  echo "$VIOLATIONS"

  echo ""
  echo "${YELLOW}📝 Suggested fixes:${NC}"
  echo "1. Review violations above"
  echo "2. Run auto-fix: ./ast-grep-fix.sh"
  echo "3. Or fix manually following REFACTORING-PLAYBOOK.md"

  exit 1
fi
```

### Auto-Fix Script

**File:** `ast-grep-fix.sh`

```bash
#!/bin/bash
# automation-toolkit/ast-grep-fix.sh

echo "🔧 Auto-fixing AST-grep violations..."

# Fix lambda keyword → stabby lambda
ast-grep scan --pattern 'lambda { $BODY }' \
  --rewrite '-> { $BODY }' \
  --update-all

ast-grep scan --pattern 'lambda do $BODY end' \
  --rewrite '-> do $BODY end' \
  --update-all

# Fix old hash syntax (simple cases)
# Note: Complex cases need manual review
ruby -i -pe 's/:(\w+)\s*=>/\1:/g' app/**/*.rb

echo "✅ Auto-fix complete!"
echo "⚠️  Review changes: git diff"
echo "📝 Run tests: bundle exec rails test"
```

---

## Custom Scripts

### 1. Style Compliance Reporter

**File:** `scripts/style-compliance-report.rb`

```ruby
#!/usr/bin/env ruby
# automation-toolkit/scripts/style-compliance-report.rb

require 'json'

class StyleComplianceReport
  PATTERNS = {
    stabby_lambda: {
      good: '->',
      bad: 'lambda ',
      description: 'Stabby lambda syntax'
    },
    modern_hash: {
      good: '\w+:',
      bad: ':\w+\s*=>',
      description: 'Modern hash syntax'
    },
    time_current: {
      good: 'Time.current',
      bad: 'Time.now',
      description: 'Time.current usage'
    },
    pluck: {
      good: '\.pluck\(',
      bad: '\.map\(&:',
      description: '.pluck for attributes'
    }
  }

  def generate
    puts "📊 Campfire Style Compliance Report"
    puts "=" * 70
    puts "Generated: #{Time.now}"
    puts "=" * 70

    results = {}

    PATTERNS.each do |pattern_name, pattern|
      good_count = count_pattern(pattern[:good])
      bad_count = count_pattern(pattern[:bad])
      total = good_count + bad_count

      compliance = total > 0 ? (good_count.to_f / total * 100).round(1) : 100.0

      results[pattern_name] = {
        good: good_count,
        bad: bad_count,
        compliance: compliance,
        description: pattern[:description]
      }

      puts "\n#{pattern[:description]}:"
      puts "  ✅ Good: #{good_count}"
      puts "  ❌ Bad:  #{bad_count}"
      puts "  📊 Compliance: #{compliance}%"

      if compliance < 100
        puts "  💡 Fix with: See REFACTORING-PLAYBOOK.md"
      end
    end

    overall = results.values.sum { |r| r[:compliance] } / results.size

    puts "\n" + "=" * 70
    puts "🎯 Overall Compliance: #{overall.round(1)}%"
    puts "=" * 70

    grade = case overall
    when 90..100 then "🌟 Excellent"
    when 75..89 then "✅ Good"
    when 50..74 then "⚠️  Needs Work"
    else "❌ Poor"
    end

    puts "\nGrade: #{grade}"

    # Save to JSON
    File.write('style-compliance-report.json', JSON.pretty_generate({
      timestamp: Time.now.iso8601,
      overall_compliance: overall,
      patterns: results
    }))

    puts "\n📄 Report saved to: style-compliance-report.json"
  end

  private

  def count_pattern(pattern)
    `grep -r "#{pattern}" app/ 2>/dev/null | wc -l`.to_i
  end
end

StyleComplianceReport.new.generate
```

**Usage:**

```bash
chmod +x automation-toolkit/scripts/style-compliance-report.rb
./automation-toolkit/scripts/style-compliance-report.rb
```

### 2. Bulk Refactor Script

**File:** `scripts/bulk-refactor.rb`

```ruby
#!/usr/bin/env ruby
# automation-toolkit/scripts/bulk-refactor.rb

require 'fileutils'

class BulkRefactor
  def initialize(pattern_name)
    @pattern_name = pattern_name
    @files_changed = []
  end

  def run
    case @pattern_name
    when 'stabby-lambda'
      refactor_stabby_lambda
    when 'hash-syntax'
      refactor_hash_syntax
    when 'time-current'
      refactor_time_current
    else
      puts "Unknown pattern: #{@pattern_name}"
      puts "Available: stabby-lambda, hash-syntax, time-current"
      exit 1
    end

    summarize
  end

  private

  def refactor_stabby_lambda
    puts "🔧 Refactoring: lambda keyword → stabby lambda"

    ruby_files.each do |file|
      content = File.read(file)
      original = content.dup

      # Replace lambda { } with -> { }
      content.gsub!(/lambda\s*\{/, '-> {')

      # Replace lambda do with -> do
      content.gsub!(/lambda\s+do\b/, '-> do')

      if content != original
        File.write(file, content)
        @files_changed << file
        puts "  ✅ #{file}"
      end
    end
  end

  def refactor_hash_syntax
    puts "🔧 Refactoring: old hash syntax → modern syntax"

    ruby_files.each do |file|
      content = File.read(file)
      original = content.dup

      # :symbol => to symbol:
      content.gsub!(/:(\w+)\s*=>/, '\1:')

      if content != original
        File.write(file, content)
        @files_changed << file
        puts "  ✅ #{file}"
      end
    end
  end

  def refactor_time_current
    puts "🔧 Refactoring: Time.now → Time.current"

    ruby_files.each do |file|
      content = File.read(file)
      original = content.dup

      content.gsub!(/Time\.now\b/, 'Time.current')

      if content != original
        File.write(file, content)
        @files_changed << file
        puts "  ✅ #{file}"
      end
    end
  end

  def ruby_files
    Dir.glob('app/**/*.rb')
  end

  def summarize
    puts "\n" + "=" * 70
    puts "📊 Refactoring Summary"
    puts "=" * 70
    puts "Files changed: #{@files_changed.size}"
    puts "\n🧪 Next steps:"
    puts "1. Review changes: git diff"
    puts "2. Run tests: bundle exec rails test"
    puts "3. Commit: git commit -am 'Refactor: #{@pattern_name}'"
  end
end

# Usage: ./bulk-refactor.rb stabby-lambda
if ARGV.empty?
  puts "Usage: #{$0} <pattern-name>"
  puts "Patterns: stabby-lambda, hash-syntax, time-current"
  exit 1
end

BulkRefactor.new(ARGV[0]).run
```

---

## Installation Scripts

### Master Install Script

**File:** `install-all.sh`

```bash
#!/bin/bash
# automation-toolkit/install-all.sh

set -e

echo "🚀 Installing Campfire Style Automation Toolkit"
echo "=" * 70

# 1. Install git hooks
echo "📝 Installing git hooks..."
cd git-hooks
./install-hooks.sh
cd ..

# 2. Install Rubocop config
echo "🔧 Installing Rubocop configuration..."
cp rubocop-configs/.rubocop-campfire.yml ../../.rubocop.yml

# 3. Copy CI scripts
echo "🏗️  Setting up CI scripts..."
mkdir -p ../../.github/workflows
cp ci-scripts/github-actions.yml ../../.github/workflows/style-check.yml

# 4. Make scripts executable
echo "🔨 Making scripts executable..."
chmod +x scripts/*.rb
chmod +x *.sh

# 5. Install dependencies
echo "📦 Installing dependencies..."
gem install rubocop rubocop-rails rubocop-performance rubocop-minitest 2>/dev/null || true

if command -v npm &> /dev/null; then
  npm install -g @ast-grep/cli 2>/dev/null || echo "⚠️  npm not found, skip ast-grep"
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "🎯 What's installed:"
echo "  ✅ Pre-commit hooks (.git/hooks/pre-commit)"
echo "  ✅ Pre-push hooks (.git/hooks/pre-push)"
echo "  ✅ Commit message validation (.git/hooks/commit-msg)"
echo "  ✅ Rubocop configuration (.rubocop.yml)"
echo "  ✅ GitHub Actions workflow (.github/workflows/style-check.yml)"
echo "  ✅ Style enforcement scripts (automation-toolkit/scripts/)"
echo ""
echo "🧪 Test it:"
echo "  bundle exec rubocop"
echo "  ast-grep scan"
echo "  ./automation-toolkit/scripts/style-compliance-report.rb"
echo ""
echo "📚 Documentation:"
echo "  automation-toolkit/README.md"
```

---

## Usage Examples

### Daily Workflow

```bash
# 1. Make changes
vim app/models/user.rb

# 2. Pre-commit hook runs automatically
git add app/models/user.rb
git commit -m "Add user validation"
# → Rubocop runs
# → AST-grep runs
# → Tests run
# → Auto-fixes applied

# 3. Push (pre-push hook runs)
git push
# → Full test suite runs
# → Only pushes if tests pass
```

### CI/CD Pipeline

```bash
# On GitHub PR:
# 1. Style check runs automatically
# 2. Tests run
# 3. Coverage report generated
# 4. Security scan (Brakeman, Bundle Audit)
# 5. PR blocked if any checks fail
```

### Manual Checks

```bash
# Run style compliance report
./automation-toolkit/scripts/style-compliance-report.rb

# Bulk refactor a pattern
./automation-toolkit/scripts/bulk-refactor.rb stabby-lambda

# Check specific files
ast-grep scan app/models/user.rb

# Run Rubocop on changed files
git diff --name-only main | xargs bundle exec rubocop
```

---

## Troubleshooting

### Hook Not Running

```bash
# Check if hook is executable
ls -la .git/hooks/pre-commit
# Should show: -rwxr-xr-x

# Make executable
chmod +x .git/hooks/pre-commit

# Test hook directly
.git/hooks/pre-commit
```

### Rubocop Failing

```bash
# See what's wrong
bundle exec rubocop

# Auto-fix
bundle exec rubocop --auto-correct-all

# Check specific file
bundle exec rubocop app/models/user.rb
```

### AST-Grep Not Found

```bash
# Install ast-grep
npm install -g @ast-grep/cli

# Or with cargo (Rust)
cargo install ast-grep

# Verify installation
ast-grep --version
```

---

## 📚 Further Reading

- `REFACTORING-PLAYBOOK.md` - How to fix violations
- `PERFORMANCE-BENCHMARKS.md` - Why these patterns matter
- `QUICK-REFERENCE.md` - Pattern cheat sheet
- `sgconfig.yml` - AST-grep rules

---

**Remember:** Automation makes style enforcement painless! Set it up once, benefit forever. 🚀
