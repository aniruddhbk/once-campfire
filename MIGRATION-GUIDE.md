# 🚀 MIGRATION GUIDE: Transform Your Codebase to Campfire Style

> **Step-by-step guide for gradual codebase transformation**
>
> Migrate your Rails application to Campfire style without breaking anything.

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Migration Checklist](#pre-migration-checklist)
3. [Phase 1: Foundation (Week 1-2)](#phase-1-foundation-week-1-2)
4. [Phase 2: Performance (Week 3-4)](#phase-2-performance-week-3-4)
5. [Phase 3: Advanced Patterns (Week 5-6)](#phase-3-advanced-patterns-week-5-6)
6. [Phase 4: Polish & Automation (Week 7-8)](#phase-4-polish--automation-week-7-8)
7. [Rollback Strategy](#rollback-strategy)
8. [Measuring Success](#measuring-success)

---

## Overview

### Migration Philosophy

**Gradual > Big Bang**

- ✅ Incremental changes
- ✅ Continuous testing
- ✅ Measure improvements
- ✅ Roll back if needed
- ❌ Don't refactor everything at once

### Timeline

- **Small codebase (<10k LOC):** 4 weeks
- **Medium codebase (10k-50k LOC):** 8 weeks
- **Large codebase (>50k LOC):** 12 weeks

### Team Size Impact

- **Solo developer:** Can move faster
- **Small team (2-5):** 1 meeting/week + async work
- **Large team (6+):** Coordinate carefully, assign areas

---

## Pre-Migration Checklist

### ✅ Before You Start

```bash
# 1. Ensure you have comprehensive tests
bundle exec rails test
# Target: 80%+ code coverage

# 2. Set up continuous integration
# GitHub Actions, CircleCI, or GitLab CI

# 3. Create feature branch
git checkout -b refactor/campfire-style-migration

# 4. Backup database (for staging/production migrations)
bundle exec rails db:dump

# 5. Run initial analysis
./style-analyzer.rb
# Note your starting score

# 6. Document current performance
# Use APM tool or custom benchmarks
ab -n 100 -c 10 http://localhost:3000/
```

### 📊 Baseline Metrics

**Record these before starting:**

```bash
# Style compliance
./style-analyzer.rb > baseline-style.txt

# Test coverage
COVERAGE=true bundle exec rails test
# Save coverage/index.html

# Performance baselines
# - Average response time
# - Database query count
# - Memory usage
# - Error rate
```

### 🛡️ Safety Measures

1. **Feature flags:** Use for risky changes
2. **Incremental deploys:** Deploy small changes frequently
3. **Monitoring:** Watch metrics closely
4. **Rollback plan:** Know how to revert quickly

---

## Phase 1: Foundation (Week 1-2)

### 🎯 Goals

- Set up automation tools
- Fix syntax patterns (zero risk)
- Establish workflow
- Build team confidence

### Day 1-2: Setup

```bash
# 1. Install automation toolkit
cd automation-toolkit
./install-all.sh

# 2. Configure Rubocop
cp rubocop-configs/.rubocop-campfire.yml .rubocop.yml

# 3. Install pre-commit hooks
cd git-hooks
./install-hooks.sh

# 4. Configure CI/CD
cp ci-scripts/github-actions.yml .github/workflows/style-check.yml
```

### Day 3-5: Lambda Syntax (LOW RISK)

**Target:** Convert all `lambda` keyword to stabby lambda `->`.

```bash
# 1. Find all usages
grep -rn "lambda " app/ | wc -l
# Note count: e.g., "Found 127 usages"

# 2. Auto-fix with Rubocop
bundle exec rubocop --only Style/Lambda --auto-correct-all

# 3. Manual review
git diff

# 4. Run full test suite
bundle exec rails test

# 5. Commit
git add .
git commit -m "Convert lambda keyword to stabby lambda syntax

- Auto-fixed 127 lambda usages with Rubocop
- All tests passing
- Zero functional changes
- Compliance: lambda_syntax 100%"

# 6. Push and monitor
git push origin refactor/campfire-style-migration
```

**Expected Results:**
- ✅ All tests passing
- ✅ Zero functional changes
- ✅ Lambda syntax: 100% compliance

### Day 6-8: Hash Syntax (LOW RISK)

**Target:** Convert old hash syntax (`:key =>`) to modern (`key:`).

```bash
# 1. Find all usages
grep -rn ":[a-z_]* =>" app/ | wc -l

# 2. Auto-fix
bundle exec rubocop --only Style/HashSyntax --auto-correct-all

# 3. Test thoroughly
bundle exec rails test

# 4. Visual inspection
# Check views and complex hashes

# 5. Commit
git add .
git commit -m "Modernize hash syntax throughout codebase

- Converted :key => value to key: value
- Fixed 450+ occurrences
- All tests passing"
```

### Day 9-10: Symbol Arrays (LOW RISK)

**Target:** Use `%i[]` for symbol arrays.

```bash
# 1. Find symbol arrays
grep -rn "only: \[:" app/controllers/ | wc -l

# 2. Auto-fix with Rubocop
bundle exec rubocop --only Style/SymbolArray --auto-correct-all

# 3. Manual adjustments (Rubocop might miss some)
# Before: only: [:create, :update, :destroy]
# After:  only: %i[ create update destroy ]

# 4. Test
bundle exec rails test:controllers

# 5. Commit
git commit -am "Use %i[] notation for symbol arrays"
```

### Day 11-14: Review & Deploy

```bash
# 1. Full test suite
bundle exec rails test

# 2. Integration tests
bundle exec rails test:integration

# 3. Manual QA
# Test major features in development

# 4. Create PR
gh pr create --title "Phase 1: Syntax modernization" \
  --body "$(cat <<EOF
## Phase 1: Foundation Complete

### Changes
- ✅ Lambda keyword → stabby lambda (127 occurrences)
- ✅ Old hash syntax → modern syntax (450 occurrences)
- ✅ Symbol arrays → %i[] notation (83 occurrences)

### Metrics
- Tests: All passing (0 failures)
- Coverage: 85% (no change)
- Compliance: Lambda 100%, Hash 100%, Symbols 100%

### Risk Assessment
- Risk level: LOW
- Functional changes: ZERO
- Performance impact: NONE

### Rollback
If needed: git revert <commit-range>
EOF
)"

# 5. Deploy to staging
# Monitor for 24-48 hours

# 6. Deploy to production
# Monitor closely for first 2 hours
```

**Phase 1 Success Criteria:**
- ✅ All syntax patterns at 100%
- ✅ Zero test failures
- ✅ Zero production issues
- ✅ Team confident in process

---

## Phase 2: Performance (Week 3-4)

### 🎯 Goals

- Fix N+1 queries
- Optimize database patterns
- Measure performance gains
- Add counter caches

### Day 1-3: N+1 Query Detection (PREP)

```bash
# 1. Install Bullet gem
# Gemfile
gem 'bullet', group: :development

bundle install

# 2. Configure Bullet
# config/environments/development.rb
config.after_initialize do
  Bullet.enable = true
  Bullet.alert = true
  Bullet.console = true
  Bullet.rails_logger = true
end

# 3. Navigate through app
rails server
# Click through major features
# Note all Bullet warnings

# 4. Document N+1 queries
cat > n1_queries.md <<EOF
# N+1 Queries Found

## Critical (Production endpoints)
1. GET /rooms - rooms.creator (N+1) - ~100 queries per request
2. GET /messages - messages.user (N+1) - ~200 queries per request

## High Priority
3. GET /users/:id/rooms - room.members.count (N+1) - ~50 queries

## Medium Priority
...
EOF
```

### Day 4-8: Fix N+1 Queries (MEDIUM RISK)

**Fix one endpoint at a time, test thoroughly.**

#### Example: Fix GET /rooms

```ruby
# app/controllers/rooms_controller.rb

# BEFORE (N+1)
def index
  @rooms = current_user.rooms
  # View accesses room.creator → N+1!
  # View accesses room.messages.count → N+1!
end

# AFTER (Optimized)
def index
  @rooms = current_user.rooms
    .includes(:creator)                    # Eager load creator
    .left_joins(:messages)                 # Join for count
    .select('rooms.*',
            'COUNT(DISTINCT messages.id) as messages_count')
    .group('rooms.id')
end
```

**Testing Strategy:**

```bash
# 1. Write test to verify query count
# test/controllers/rooms_controller_test.rb
test "index does not have N+1 queries" do
  users(:one).rooms.create!(name: "Room 1", creator: users(:two))
  users(:one).rooms.create!(name: "Room 2", creator: users(:two))

  assert_queries(3) do  # 1 for rooms, 1 for creators, 1 for count
    get rooms_url
  end

  assert_response :success
end

# 2. Run test
bundle exec rails test test/controllers/rooms_controller_test.rb

# 3. Check Bullet
# No warnings should appear

# 4. Benchmark
ab -n 100 -c 10 http://localhost:3000/rooms
# Compare to baseline

# 5. Commit
git commit -am "Fix N+1 query in rooms#index

- Add eager loading for creator
- Add counter query for messages
- Reduced queries from 201 → 3
- Response time: 850ms → 185ms (78% faster)"
```

**Repeat for each N+1 query, one at a time.**

### Day 9-11: Add Counter Caches (MEDIUM RISK)

```bash
# 1. Generate migration
rails g migration AddCounterCachesToRooms messages_count:integer members_count:integer

# 2. Edit migration
class AddCounterCachesToRooms < ActiveRecord::Migration[7.1]
  def change
    add_column :rooms, :messages_count, :integer, default: 0
    add_column :rooms, :members_count, :integer, default: 0

    reversible do |dir|
      dir.up do
        # Populate existing counts
        Room.find_each do |room|
          Room.reset_counters(room.id, :messages, :members)
        end
      end
    end
  end
end

# 3. Run migration in development
bundle exec rails db:migrate

# 4. Update models
# app/models/message.rb
class Message < ApplicationRecord
  belongs_to :room, counter_cache: true
end

# app/models/membership.rb
class Membership < ApplicationRecord
  belongs_to :room, counter_cache: :members_count
end

# 5. Update views
# Before: room.messages.count
# After:  room.messages_count

# 6. Test thoroughly
bundle exec rails test

# 7. Test migration in staging
# Backup database first!
bundle exec rails db:migrate

# 8. Monitor performance
# Should see massive improvement in queries with .count

# 9. Deploy to production
# Monitor counter cache accuracy
```

### Day 12-14: .pluck and .exists? (LOW RISK)

```bash
# 1. Find .map(&:id) usages
grep -rn "\.map(&:id)" app/

# 2. Replace with .pluck(:id)
# Before: User.all.map(&:id)
# After:  User.pluck(:id)

# 3. Find .present? on relations
grep -rn "\.where.*\.present?" app/

# 4. Replace with .exists?
# Before: User.where(email: email).present?
# After:  User.where(email: email).exists?

# 5. Test each change
bundle exec rails test

# 6. Benchmark
# Measure memory usage and query speed

# 7. Commit incrementally
git commit -am "Replace .map with .pluck for attribute extraction"
git commit -am "Use .exists? for ActiveRecord presence checks"
```

**Phase 2 Success Criteria:**
- ✅ Zero Bullet warnings
- ✅ Response times 50%+ faster
- ✅ Database queries reduced 70%+
- ✅ All tests passing

---

## Phase 3: Advanced Patterns (Week 5-6)

### 🎯 Goals

- Time/date operations
- Extract concerns
- Service objects
- Code organization

### Day 1-3: Time.now → Time.current (LOW-MEDIUM RISK)

```bash
# 1. Find all Time.now usages
grep -rn "Time\.now" app/ > time_now_usages.txt

# 2. Review each usage
# Categorize:
# - Needs timezone (→ Time.current)
# - System time OK (→ keep Time.now)

# 3. Bulk replace (if safe)
ruby -i -pe 's/Time\.now/Time.current/g' app/models/**/*.rb
ruby -i -pe 's/Time\.now/Time.current/g' app/controllers/**/*.rb

# 4. Manual review
git diff

# 5. Test time-sensitive features
# - User timezones
# - Scheduled jobs
# - Time comparisons

# 6. Test in different timezones
TZ=America/New_York bundle exec rails test
TZ=Asia/Tokyo bundle exec rails test
TZ=Europe/London bundle exec rails test

# 7. Commit
git commit -am "Use Time.current for timezone safety"
```

### Day 4-7: Extract Concerns (MEDIUM RISK)

**Identify duplicate code, extract to concerns.**

```bash
# 1. Find duplicate patterns
# Example: Multiple models have archive functionality

# 2. Create concern
# app/models/concerns/archivable.rb
module Archivable
  extend ActiveSupport::Concern

  included do
    scope :archived, -> { where.not(archived_at: nil) }
    scope :active, -> { where(archived_at: nil) }
  end

  def archive!
    update(archived_at: Time.current)
  end

  def archived?
    archived_at.present?
  end
end

# 3. Include in models (one at a time)
class Room < ApplicationRecord
  include Archivable
  # Remove duplicate methods
end

# 4. Test each model thoroughly
bundle exec rails test test/models/room_test.rb

# 5. Repeat for other models
# Only after first model is tested and working

# 6. Commit per concern
git commit -am "Extract Archivable concern from Room model"
```

### Day 8-10: Create Service Objects (MEDIUM-HIGH RISK)

**Extract complex business logic.**

```bash
# 1. Identify fat controllers
# Find controllers with >10 line actions

# 2. Extract to service object (one at a time)
# app/services/room_creator.rb
class RoomCreator
  def initialize(user, params)
    @user = user
    @params = params
  end

  def call
    Room.transaction do
      room = create_room
      add_creator_as_member(room)
      send_notifications(room)
      room
    end
  rescue ActiveRecord::RecordInvalid => e
    Rails.logger.error "Room creation failed: #{e.message}"
    nil
  end

  private

  def create_room
    @user.rooms.create!(@params)
  end

  def add_creator_as_member(room)
    room.memberships.create!(user: @user, role: :owner)
  end

  def send_notifications(room)
    RoomCreatedNotificationJob.perform_later(room)
  end
end

# 3. Update controller
class RoomsController < ApplicationController
  def create
    room = RoomCreator.new(current_user, room_params).call

    if room
      redirect_to room, notice: "Room created"
    else
      render :new, status: :unprocessable_entity
    end
  end
end

# 4. Write service object tests
# test/services/room_creator_test.rb
require 'test_helper'

class RoomCreatorTest < ActiveSupport::TestCase
  test "creates room successfully" do
    user = users(:one)
    params = { name: "Test Room" }

    room = RoomCreator.new(user, params).call

    assert room.persisted?
    assert_equal "Test Room", room.name
    assert_equal user, room.creator
  end

  test "adds creator as member" do
    user = users(:one)
    params = { name: "Test Room" }

    room = RoomCreator.new(user, params).call

    assert room.memberships.where(user: user, role: :owner).exists?
  end
end

# 5. Test controller integration
bundle exec rails test test/controllers/rooms_controller_test.rb

# 6. Deploy to staging, monitor

# 7. Commit
git commit -am "Extract room creation logic to service object"
```

### Day 11-14: Review & Deploy Phase 3

```bash
# 1. Full test suite
bundle exec rails test

# 2. Style compliance check
./style-analyzer.rb

# 3. Performance benchmarks
# Verify no regressions

# 4. Create PR
# Document all changes and performance improvements

# 5. Deploy to staging
# Monitor for 48 hours

# 6. Deploy to production
# Gradual rollout if possible
```

**Phase 3 Success Criteria:**
- ✅ All Time.now replaced with Time.current
- ✅ 2-3 concerns extracted
- ✅ 2-3 service objects created
- ✅ Controllers are thin (<10 lines per action)
- ✅ Test coverage maintained or improved

---

## Phase 4: Polish & Automation (Week 7-8)

### 🎯 Goals

- Fine-tune remaining patterns
- Full automation setup
- Documentation
- Team training

### Day 1-3: Remaining Patterns

```bash
# 1. Run style analyzer
./style-analyzer.rb

# 2. Fix any remaining violations
# - String operations
# - Array operations
# - Edge cases

# 3. Aim for 95%+ compliance
```

### Day 4-6: Automation & CI/CD

```bash
# 1. Verify pre-commit hooks working
git commit -m "test"
# Should run Rubocop automatically

# 2. Verify CI passing
# Check GitHub Actions / GitLab CI

# 3. Set up monitoring
# - Performance monitoring
# - Error tracking
# - Style compliance tracking

# 4. Automate compliance reports
# Add to CI:
./style-analyzer.rb
# Fail if compliance < 90%
```

### Day 7-10: Documentation

```bash
# 1. Update team documentation
# - Coding guidelines
# - Style patterns
# - How to fix violations

# 2. Create onboarding guide
# For new developers

# 3. Document performance improvements
# Before/after metrics

# 4. Create troubleshooting guide
# Common issues and solutions
```

### Day 11-14: Team Training

```bash
# 1. Team meeting: Present results
# - Show performance improvements
# - Demonstrate automation tools
# - Answer questions

# 2. Pair programming sessions
# - Walk through patterns
# - Show how to refactor code

# 3. Code review guidelines
# - Checklist for reviewers
# - How to enforce patterns

# 4. Celebrate! 🎉
# You did it!
```

**Phase 4 Success Criteria:**
- ✅ Style compliance: 95%+
- ✅ Automation fully configured
- ✅ Team trained
- ✅ Documentation complete

---

## Rollback Strategy

### When to Rollback

- ❌ Critical production bug
- ❌ Significant performance regression
- ❌ Major test failures
- ❌ Breaking changes discovered late

### How to Rollback

#### Git Revert

```bash
# 1. Find commit to revert
git log --oneline

# 2. Revert specific commit
git revert <commit-hash>

# 3. Or revert range
git revert <start-commit>..<end-commit>

# 4. Push
git push

# 5. Deploy immediately
```

#### Database Rollback

```bash
# If counter cache migration causes issues
bundle exec rails db:rollback

# Or specific version
bundle exec rails db:migrate:down VERSION=20250115123456
```

#### Feature Flag

```ruby
# If using feature flags
if FeatureFlag.enabled?(:campfire_style_refactor)
  # New code
else
  # Old code
end

# Disable flag:
FeatureFlag.disable(:campfire_style_refactor)
```

---

## Measuring Success

### Metrics to Track

#### Style Compliance

```bash
# Run weekly
./style-analyzer.rb

# Track improvement
Week 1: 45%
Week 2: 62%
Week 4: 78%
Week 6: 88%
Week 8: 95%
```

#### Performance Improvements

```bash
# Response Times
Before: 850ms average
After:  180ms average
Improvement: 78% faster

# Database Queries
Before: 201 queries per request
After:  3 queries per request
Improvement: 98.5% reduction

# Memory Usage
Before: 145 MB per request
After:  18 MB per request
Improvement: 87.6% reduction
```

#### Code Quality

```bash
# Test Coverage
Before: 82%
After:  88%

# Code Duplication
Before: 15%
After:  6%

# Average Method Length
Before: 18 lines
After:  12 lines
```

### Success Dashboard

Create a dashboard tracking:

1. **Style Compliance:** Target 95%
2. **Performance:** Response time, queries, memory
3. **Quality:** Test coverage, duplication, complexity
4. **Team:** Violations per PR, review time

### Celebrating Wins

**Share improvements with team:**

```markdown
## Migration Complete! 🎉

### Results
- ✅ Style compliance: 45% → 95% (+50%)
- ✅ Response time: 850ms → 180ms (78% faster)
- ✅ Database queries: 201 → 3 (98.5% reduction)
- ✅ Memory usage: 145 MB → 18 MB (87.6% less)
- ✅ Test coverage: 82% → 88% (+6%)

### Business Impact
- 10x more concurrent users supported
- Server costs reduced 60%
- Zero style-related bugs in production
- Faster onboarding for new developers

### Team Feedback
"The automation catches issues before code review!"
"Much faster to write new features now."
"Performance improvement is incredible!"

Thank you to everyone who contributed! 🚀
```

---

## FAQ

### Q: Can we skip phases?

**A:** No. Each phase builds on the previous one. Phase 1 is lowest risk and builds confidence. Phase 2 has the biggest performance impact. Phases 3-4 improve maintainability.

### Q: What if tests fail after refactoring?

**A:** Revert the change, investigate, fix the test or the refactoring, try again. Never commit with failing tests.

### Q: How do we handle merge conflicts during migration?

**A:** Communicate with team. Have everyone merge from migration branch frequently. Consider feature freeze for critical refactoring weeks.

### Q: Should we refactor while adding features?

**A:** For migration period, separate refactoring PRs from feature PRs. After migration, refactor opportunistically (Boy Scout Rule: leave code better than you found it).

### Q: What if we find performance regressions?

**A:** Immediately revert, investigate with profiling tools, fix, re-deploy. Performance should never regress.

---

## Checklist

### Pre-Migration
- [ ] 80%+ test coverage
- [ ] CI/CD configured
- [ ] Baseline metrics recorded
- [ ] Rollback plan documented
- [ ] Team aligned

### Phase 1: Foundation
- [ ] Automation toolkit installed
- [ ] Lambda syntax: 100%
- [ ] Hash syntax: 100%
- [ ] Symbol arrays: 100%
- [ ] All tests passing

### Phase 2: Performance
- [ ] Bullet configured
- [ ] N+1 queries fixed
- [ ] Counter caches added
- [ ] .pluck/.exists? adopted
- [ ] 50%+ faster response times

### Phase 3: Advanced
- [ ] Time.current everywhere
- [ ] Concerns extracted
- [ ] Service objects created
- [ ] Controllers thin

### Phase 4: Polish
- [ ] 95%+ compliance
- [ ] Automation complete
- [ ] Team trained
- [ ] Documentation done

---

**🎉 Congratulations on completing your migration!**

Your codebase is now faster, cleaner, and more maintainable. Keep the momentum going by:

1. **Enforcing patterns** in code reviews
2. **Monitoring compliance** weekly
3. **Training new team members** on patterns
4. **Celebrating wins** with the team

**You've transformed your codebase! 🚀**
