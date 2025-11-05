# 🎓 TRAINING PROGRAM: Master Campfire Style in 8 Weeks

> **Progressive learning path for teams and individuals**
>
> Week-by-week curriculum with exercises, goals, and measurable outcomes.

---

## Table of Contents

1. [Program Overview](#program-overview)
2. [Week 1: Foundations](#week-1-foundations)
3. [Week 2: Database Patterns](#week-2-database-patterns)
4. [Week 3: Performance Optimization](#week-3-performance-optimization)
5. [Week 4: Testing Patterns](#week-4-testing-patterns)
6. [Week 5: Rails Idioms](#week-5-rails-idioms)
7. [Week 6: Advanced Patterns](#week-6-advanced-patterns)
8. [Week 7: Real-World Refactoring](#week-7-real-world-refactoring)
9. [Week 8: Team Integration](#week-8-team-integration)
10. [Certification & Mastery](#certification--mastery)

---

## Program Overview

### Learning Objectives

By the end of this 8-week program, you will:

- ✅ Master 50+ Campfire style patterns
- ✅ Write performant Rails code (10-100x faster)
- ✅ Understand WHY behind each pattern
- ✅ Confidently refactor legacy code
- ✅ Pass code reviews with zero style violations
- ✅ Mentor others on best practices

### Time Commitment

- **Self-paced:** 3-5 hours per week
- **Team-paced:** 1 hour meeting + 2-3 hours practice
- **Total:** 24-40 hours over 8 weeks

### Prerequisites

- Basic Ruby/Rails knowledge
- Working Rails development environment
- Access to Campfire codebase (or similar Rails app)
- Git basics

### Materials Needed

- ✅ campfire-style-guide.md
- ✅ REFACTORING-PLAYBOOK.md
- ✅ PERFORMANCE-BENCHMARKS.md
- ✅ QUICK-REFERENCE.md
- ✅ automation-toolkit/

---

## Week 1: Foundations

### 🎯 Goals

- Understand the "why" behind style patterns
- Master top 10 must-use patterns
- Set up automation tools
- Complete first refactoring

### 📚 Reading (60 minutes)

1. **QUICK-REFERENCE.md** - Top 10 patterns (15 min)
2. **campfire-style-guide.md** - Sections 1-3 (30 min)
3. **ANTI-PATTERNS.md** - Lambda & Hash sections (15 min)

### 🛠️ Setup (30 minutes)

```bash
# 1. Install automation toolkit
cd automation-toolkit
./install-all.sh

# 2. Run initial compliance check
./scripts/style-compliance-report.rb

# 3. Set up editor (see editor-integration/)
```

### 💻 Exercises (2 hours)

#### Exercise 1.1: Lambda Syntax (30 min)

**Task:** Convert all `lambda` keyword usages to stabby lambda `->`.

```ruby
# Find all lambda usages
grep -rn "lambda " app/models/

# Fix one file at a time
# Example: app/models/user.rb

# Before
scope :active, lambda { where(active: true) }

# After
scope :active, -> { where(active: true) }
```

**Success Criteria:**
- ✅ Zero `lambda` keyword usages in models
- ✅ All tests passing
- ✅ Commit with message: "Convert lambda to stabby syntax in models"

#### Exercise 1.2: Hash Syntax (30 min)

**Task:** Convert old hash syntax (`:key =>`) to modern (`key:`).

```ruby
# Find old hash syntax
grep -rn ":[a-z_]* =>" app/controllers/

# Fix systematically
# Before
render json: { :name => "John", :email => "john@example.com" }

# After
render json: { name: "John", email: "john@example.com" }
```

**Success Criteria:**
- ✅ Zero old hash syntax in controllers
- ✅ Run: `rubocop --only Style/HashSyntax`
- ✅ Commit: "Modernize hash syntax in controllers"

#### Exercise 1.3: Symbol Arrays (30 min)

**Task:** Convert symbol arrays to `%i[]` notation.

```ruby
# Find symbol arrays
grep -rn "only: \[:" app/controllers/

# Before
before_action :authenticate, only: [:create, :update, :destroy]

# After
before_action :authenticate, only: %i[ create update destroy ]
```

**Success Criteria:**
- ✅ All symbol arrays use `%i[]` (where applicable)
- ✅ Tests passing
- ✅ Commit: "Use %i[] for symbol arrays"

### 📊 Week 1 Assessment

Run compliance check and compare to Week 1 start:

```bash
./automation-toolkit/scripts/style-compliance-report.rb
```

**Target Scores:**
- Lambda syntax: 100%
- Hash syntax: 100%
- Overall: 85%+

### 🎓 Quiz (10 questions)

1. Why use `->` instead of `lambda` keyword?
2. What's the difference between `key:` and `:key =>`?
3. When should you use `%i[]` notation?
4. What does "stabby lambda" mean?
5. How do you auto-fix Rubocop violations?

---

## Week 2: Database Patterns

### 🎯 Goals

- Master ActiveRecord query patterns
- Eliminate N+1 queries
- Understand eager loading
- Optimize database performance

### 📚 Reading (60 minutes)

1. **PERFORMANCE-BENCHMARKS.md** - Database section (30 min)
2. **REFACTORING-PLAYBOOK.md** - N+1 elimination (20 min)
3. **campfire-style-guide.md** - Database section (10 min)

### 💻 Exercises (3 hours)

#### Exercise 2.1: Detect N+1 Queries (45 min)

**Task:** Install Bullet gem and find N+1 queries.

```ruby
# Gemfile
gem 'bullet', group: :development

# config/environments/development.rb
config.after_initialize do
  Bullet.enable = true
  Bullet.alert = true
  Bullet.console = true
end

# Start server and navigate through app
rails server

# Check console for Bullet warnings
```

**Success Criteria:**
- ✅ Bullet configured
- ✅ Found at least 3 N+1 queries
- ✅ Documented findings

#### Exercise 2.2: Fix N+1 with Eager Loading (90 min)

**Task:** Add `.includes()` to eliminate N+1 queries.

```ruby
# Example: app/controllers/rooms_controller.rb

# Before (N+1)
@rooms = current_user.rooms
# View accesses room.creator.name → N+1!

# After (Eager loading)
@rooms = current_user.rooms.includes(:creator)
# Single query for all creators!
```

**Success Criteria:**
- ✅ Fixed all N+1 queries found in Exercise 2.1
- ✅ Bullet shows no warnings
- ✅ Benchmark: Response time improved 50%+

#### Exercise 2.3: Add Counter Caches (45 min)

**Task:** Add counter caches for `.count` calls.

```ruby
# Migration
rails g migration AddCounterCachesToRooms messages_count:integer

# Edit migration
class AddCounterCachesToRooms < ActiveRecord::Migration[7.1]
  def change
    add_column :rooms, :messages_count, :integer, default: 0

    # Populate existing counts
    Room.find_each do |room|
      Room.reset_counters(room.id, :messages)
    end
  end
end

# Model
class Message < ApplicationRecord
  belongs_to :room, counter_cache: true
end

# Usage
room.messages_count  # Fast! No COUNT query
```

**Success Criteria:**
- ✅ Counter caches added for at least 2 associations
- ✅ Migration runs successfully
- ✅ Benchmark: COUNT queries eliminated

### 📊 Week 2 Assessment

**Performance Benchmarks:**

```ruby
# Run benchmarks
ab -n 100 -c 10 http://localhost:3000/rooms

# Measure improvement from Week 2 start
```

**Target Improvements:**
- Response time: 50%+ faster
- Database queries: 70%+ fewer
- Bullet warnings: 0

---

## Week 3: Performance Optimization

### 🎯 Goals

- Master `.pluck` vs `.map`
- Understand `.exists?` vs `.present?`
- Use `.find_each` for large datasets
- Write memory-efficient code

### 📚 Reading (60 minutes)

1. **PERFORMANCE-BENCHMARKS.md** - Patterns 1-4 (40 min)
2. **REFACTORING-PLAYBOOK.md** - Performance section (20 min)

### 💻 Exercises (3 hours)

#### Exercise 3.1: Replace .map with .pluck (60 min)

**Task:** Find and replace `.map(&:attribute)` with `.pluck(:attribute)`.

```ruby
# Find candidates
grep -rn "\.map(&:" app/

# Before
user_ids = User.active.map(&:id)  # Loads all User objects!

# After
user_ids = User.active.pluck(:id)  # Just gets IDs from DB
```

**Success Criteria:**
- ✅ Replaced 10+ `.map(&:id)` with `.pluck(:id)`
- ✅ Benchmark: 50%+ faster
- ✅ Memory usage reduced

#### Exercise 3.2: Replace .present? with .exists? (45 min)

**Task:** Use `.exists?` for ActiveRecord presence checks.

```ruby
# Find candidates
grep -rn "\.where.*\.present?" app/

# Before
if User.where(email: email).present?  # Loads records!
  # ...
end

# After
if User.where(email: email).exists?  # Just checks existence
  # ...
end
```

**Success Criteria:**
- ✅ Replaced 5+ `.present?` with `.exists?`
- ✅ Benchmark: 40%+ faster
- ✅ Zero records loaded for checks

#### Exercise 3.3: Use .find_each for Large Datasets (45 min)

**Task:** Replace `.each` with `.find_each` for large collections.

```ruby
# Before - Memory hog!
User.all.each do |user|
  user.update(last_checked: Time.current)
end
# Loads ALL users into memory!

# After - Memory efficient
User.find_each do |user|
  user.update(last_checked: Time.current)
end
# Processes in batches of 1,000
```

**Success Criteria:**
- ✅ Found and fixed 3+ `.each` usages
- ✅ Memory usage: 90%+ reduction
- ✅ No OOM (Out of Memory) errors

### 📊 Week 3 Assessment

**Performance Report:**

```bash
# Run style compliance
./automation-toolkit/scripts/style-compliance-report.rb

# Run performance benchmarks
ruby automation-toolkit/scripts/performance-benchmark.rb
```

**Target Scores:**
- `.pluck` usage: 80%+
- `.exists?` usage: 90%+
- Performance grade: A

---

## Week 4: Testing Patterns

### 🎯 Goals

- Master Minitest conventions
- Write effective fixtures
- Test performance patterns
- Understand test organization

### 📚 Reading (45 minutes)

1. **campfire-style-guide.md** - Testing section (30 min)
2. **QUICK-REFERENCE.md** - Testing essentials (15 min)

### 💻 Exercises (2.5 hours)

#### Exercise 4.1: Organize Test Files (30 min)

**Task:** Ensure test organization matches app structure.

```
test/
├── models/
│   ├── user_test.rb
│   └── room_test.rb
├── controllers/
│   └── rooms_controller_test.rb
└── integration/
    └── user_flows_test.rb
```

**Success Criteria:**
- ✅ All tests organized correctly
- ✅ Test files match model/controller names
- ✅ Run: `rails test` - all passing

#### Exercise 4.2: Write Performance Tests (90 min)

**Task:** Add tests that verify performance patterns.

```ruby
# test/models/user_test.rb
class UserTest < ActiveSupport::TestCase
  test "uses pluck not map for IDs" do
    # This test ensures we're using efficient patterns
    assert_queries(1) do
      User.active.pluck(:id)
    end

    # This would be BAD (loads all records)
    # User.active.map(&:id)
  end

  test "uses exists not present for checks" do
    email = "test@example.com"

    # Efficient check
    assert_queries(1) do
      assert User.where(email: email).exists?
    end

    # Would be less efficient:
    # User.where(email: email).present?
  end
end
```

**Success Criteria:**
- ✅ Added 5+ performance tests
- ✅ Tests verify efficient patterns are used
- ✅ All tests passing

### 📊 Week 4 Assessment

**Test Coverage:**

```bash
# Run with coverage
COVERAGE=true bundle exec rails test
open coverage/index.html

# Target: 90%+ coverage
```

---

## Week 5: Rails Idioms

### 🎯 Goals

- Master Time/Date operations
- Use Rails helpers effectively
- Understand concerns
- Write idiomatic Rails code

### 📚 Reading (60 minutes)

1. **campfire-style-guide.md** - Rails idioms section (40 min)
2. **EXTENDED-PATTERNS.md** - Rails patterns (20 min)

### 💻 Exercises (3 hours)

#### Exercise 5.1: Time.now → Time.current (45 min)

**Task:** Replace all `Time.now` with `Time.current`.

```ruby
# Find usages
grep -rn "Time\.now" app/

# Before
if created_at > Time.now - 1.hour
  # Wrong timezone!
end

# After
if created_at > Time.current - 1.hour
  # Respects app timezone
end

# Even better
if created_at > 1.hour.ago
  # Most idiomatic
end
```

**Success Criteria:**
- ✅ Zero `Time.now` usages
- ✅ All time operations use `Time.current`
- ✅ Tests verify timezone handling

#### Exercise 5.2: Extract Concern (90 min)

**Task:** Extract shared behavior into a concern.

```ruby
# Identify duplicate code across models
# Extract into: app/models/concerns/archivable.rb

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

# Include in models
class Room < ApplicationRecord
  include Archivable
end
```

**Success Criteria:**
- ✅ Created 1-2 concerns
- ✅ Removed duplicate code
- ✅ All tests passing

### 📊 Week 5 Assessment

**Code Quality Metrics:**
- Time.current usage: 100%
- Concerns properly used: ✅
- Code duplication: Reduced 30%+

---

## Week 6: Advanced Patterns

### 🎯 Goals

- Master complex queries
- Understand metaprogramming patterns
- Write service objects
- Advanced refactoring

### 📚 Reading (90 minutes)

1. **EXTENDED-PATTERNS.md** - Advanced sections (60 min)
2. **MASTER-GUIDE.md** - Decision trees (30 min)

### 💻 Exercises (4 hours)

#### Exercise 6.1: Complex Queries (2 hours)

**Task:** Write efficient complex queries.

```ruby
# Task: Get all rooms with message count, creator name, and last activity

# Inefficient (N+1 queries)
rooms = Room.all
rooms.map do |room|
  {
    name: room.name,
    creator: room.creator.name,
    messages_count: room.messages.count,
    last_activity: room.messages.maximum(:created_at)
  }
end

# Efficient (2-3 queries)
Room.includes(:creator)
  .left_joins(:messages)
  .select('rooms.*',
          'users.name as creator_name',
          'COUNT(messages.id) as messages_count',
          'MAX(messages.created_at) as last_activity')
  .joins('LEFT JOIN users ON users.id = rooms.creator_id')
  .group('rooms.id', 'users.name')
```

**Success Criteria:**
- ✅ Wrote 3+ complex queries
- ✅ Eliminated N+1 queries
- ✅ Benchmark: 10x+ faster

#### Exercise 6.2: Create Service Object (2 hours)

**Task:** Extract complex business logic into service object.

```ruby
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

# Usage in controller
def create
  room = RoomCreator.new(current_user, room_params).call
  redirect_to room
end
```

**Success Criteria:**
- ✅ Created 1-2 service objects
- ✅ Controllers are thin (<10 lines per action)
- ✅ Business logic is testable

### 📊 Week 6 Assessment

**Advanced Patterns Score:**
- Complex queries: Mastered
- Service objects: Implemented
- Code organization: Excellent

---

## Week 7: Real-World Refactoring

### 🎯 Goals

- Refactor a complete feature
- Apply all learned patterns
- Measure performance improvements
- Document changes

### 💻 Project (8-10 hours)

**Choose one feature to refactor completely:**

Options:
1. User authentication system
2. Room/channel management
3. Messaging system
4. Search functionality

**Requirements:**

✅ **Style Patterns (100% compliance)**
- Stabby lambdas
- Modern hash syntax
- %i[] for symbols
- Time.current

✅ **Performance Patterns**
- Eager loading (no N+1)
- .pluck for attributes
- .exists? for checks
- Counter caches

✅ **Code Organization**
- Concerns extracted
- Service objects for complex logic
- Thin controllers
- Well-tested

✅ **Documentation**
- Before/after benchmarks
- Performance improvements documented
- Pattern usage explained

### 📊 Week 7 Deliverables

1. **Refactored code** (committed to branch)
2. **Performance report** (benchmarks before/after)
3. **Documentation** (what changed and why)
4. **Tests** (100% coverage for refactored code)

---

## Week 8: Team Integration

### 🎯 Goals

- Set up team automation
- Create team guidelines
- Train other developers
- Establish code review process

### 📚 Tasks (6 hours)

#### Task 8.1: Setup Team Automation (2 hours)

```bash
# Install automation toolkit for team
cd automation-toolkit
./install-all.sh

# Set up CI/CD
# - GitHub Actions
# - Pre-commit hooks
# - Rubocop configuration

# Configure Slack notifications
# - PR checks
# - CI failures
# - Style violations
```

#### Task 8.2: Create Team Guidelines (2 hours)

**Create:** `TEAM-STYLE-GUIDE.md`

Include:
- Top 10 must-follow patterns
- Code review checklist
- How to fix common violations
- When to ask for help
- Team-specific conventions

#### Task 8.3: Train One Developer (2 hours)

**Pair programming session:**
1. Walk through QUICK-REFERENCE.md
2. Show how to use automation tools
3. Refactor code together
4. Answer questions

### 📊 Week 8 Assessment

**Team Readiness:**
- ✅ Automation installed
- ✅ Team guidelines documented
- ✅ 1+ developer trained
- ✅ CI/CD passing
- ✅ Code reviews enforcing patterns

---

## Certification & Mastery

### 🏆 Certification Requirements

To be certified as "Campfire Style Master":

#### Knowledge (80%+ on quiz)
- ✅ Understand all 50+ patterns
- ✅ Know WHY behind each pattern
- ✅ Can explain performance implications

#### Practical (All completed)
- ✅ All 8 weeks of exercises completed
- ✅ Week 7 project delivered
- ✅ Code review passed by senior dev
- ✅ Style compliance: 95%+

#### Leadership (At least 1)
- ✅ Trained 1+ other developer
- ✅ Led refactoring project
- ✅ Contributed to team guidelines
- ✅ Presented patterns to team

### 📚 Master Level Curriculum

**After certification, continue with:**

1. **Performance Optimization Mastery**
   - Advanced database queries
   - Caching strategies
   - Background job patterns
   - API optimization

2. **Architecture Patterns**
   - Service objects
   - Query objects
   - Form objects
   - Decorators

3. **Testing Mastery**
   - TDD workflow
   - Integration testing
   - Performance testing
   - Test optimization

### 🎯 Continuous Learning

**Monthly:**
- Review new patterns in codebase
- Update compliance scores
- Refactor one legacy feature
- Mentor junior developers

**Quarterly:**
- Run performance audits
- Update automation tools
- Review Ruby/Rails changes
- Team training session

---

## Learning Resources

### Internal Docs
- ✅ campfire-style-guide.md
- ✅ QUICK-REFERENCE.md
- ✅ REFACTORING-PLAYBOOK.md
- ✅ PERFORMANCE-BENCHMARKS.md
- ✅ ANTI-PATTERNS.md
- ✅ MASTER-GUIDE.md

### External Resources
- Ruby Style Guide: https://rubystyle.guide
- Rails Guides: https://guides.rubyonrails.org
- RuboCop Docs: https://docs.rubocop.org
- Rails Performance: https://www.speedshop.co/

### Tools
- Rubocop: Style enforcement
- Bullet: N+1 detection
- rack-mini-profiler: Performance profiling
- SimpleCov: Test coverage
- Brakeman: Security scanning

---

## FAQ

### Q: Can I skip weeks?
**A:** Advanced developers can skip Week 1-2, but complete assessments to verify knowledge.

### Q: How long does certification take?
**A:** 8 weeks self-paced, or 4 weeks intensive (10 hours/week).

### Q: What if I fail an assessment?
**A:** Review the material, complete additional exercises, retake assessment.

### Q: Can I customize for my team?
**A:** Yes! Adapt exercises to your codebase and team needs.

### Q: Is this Rails-specific?
**A:** Mostly. Ruby patterns apply broadly, but ActiveRecord patterns are Rails-specific.

---

## Progress Tracking

### Personal Progress Sheet

```
Week 1: Foundations
 ☐ Reading completed
 ☐ Setup completed
 ☐ Exercise 1.1 (Lambda)
 ☐ Exercise 1.2 (Hash)
 ☐ Exercise 1.3 (Symbols)
 ☐ Assessment passed (85%+)
 ☐ Quiz completed (8/10+)

Week 2: Database Patterns
 ☐ Reading completed
 ☐ Exercise 2.1 (Bullet)
 ☐ Exercise 2.2 (N+1)
 ☐ Exercise 2.3 (Counter cache)
 ☐ Assessment passed

[... continue for all weeks ...]

Certification:
 ☐ All exercises completed
 ☐ Week 7 project delivered
 ☐ Quiz: ___/100
 ☐ Style compliance: ___%
 ☐ Code review passed
 ☐ Trained 1+ developers
```

---

**🎉 Congratulations on starting your journey to Campfire Style mastery!**

**Remember:** Mastery comes from consistent practice. Complete one week at a time, apply what you learn, and help others along the way.

**You've got this! 🚀**
