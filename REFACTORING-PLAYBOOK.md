# 🔧 REFACTORING PLAYBOOK: Real Campfire Code Transformations

> **Your step-by-step guide to refactoring code to match Campfire style**
>
> Real examples from the codebase with exact line numbers, before/after code, and refactoring workflows.

---

## Table of Contents

1. [Quick Wins (5 minutes each)](#quick-wins)
2. [Medium Refactors (15-30 minutes)](#medium-refactors)
3. [Advanced Transformations (1+ hour)](#advanced-transformations)
4. [Refactoring Workflows](#refactoring-workflows)
5. [Common Scenarios](#common-scenarios)
6. [Automated Fixes](#automated-fixes)

---

## Quick Wins (5 minutes each)

### 🎯 Pattern 1: Lambda Keyword → Stabby Lambda

**Impact:** High visibility, zero risk
**Files to check:** Models, concerns, controllers
**Estimated occurrences in typical codebase:** 50-200

#### Example from app/models/message.rb

**Before:**
```ruby
scope :ordered, lambda { order(created_at: :desc) }
before_create lambda { self.client_message_id ||= Random.uuid }
```

**After:**
```ruby
scope :ordered, -> { order(created_at: :desc) }
before_create -> { self.client_message_id ||= Random.uuid }
```

#### Step-by-Step Refactoring:

```bash
# 1. Find all lambda keyword usages
ast-grep --pattern 'lambda { $$BODY }' -l ruby

# 2. Review each file
# 3. Replace lambda with ->
# 4. Run tests
bundle exec rails test

# 5. Commit
git add . && git commit -m "Convert lambda keyword to stabby lambda syntax"
```

#### Automated Fix:

```ruby
# Use Rubocop with auto-correct
rubocop --only Style/Lambda --auto-correct
```

---

### 🎯 Pattern 2: Old Hash Syntax → Modern Hash Syntax

**Impact:** Code modernization, readability
**Files to check:** All Ruby files
**Estimated occurrences:** 100-500

#### Example from config/routes.rb

**Before:**
```ruby
get '/rooms/:id', :to => 'rooms#show', :as => :room
post '/messages', :to => 'messages#create'
```

**After:**
```ruby
get '/rooms/:id', to: 'rooms#show', as: :room
post '/messages', to: 'messages#create'
```

#### Step-by-Step Refactoring:

```bash
# 1. Find old hash syntax
grep -r ":[a-z_]* =>" app/ config/

# 2. Auto-fix with Rubocop
rubocop --only Style/HashSyntax --auto-correct

# 3. Review changes
git diff

# 4. Test thoroughly
bundle exec rails test
```

---

### 🎯 Pattern 3: Array of Symbols with Brackets → %i[]

**Impact:** Cleaner code, less noise
**Files to check:** Controllers, models
**Estimated occurrences:** 50-100

#### Example from app/controllers/messages_controller.rb

**Before:**
```ruby
before_action :authenticate, only: [:create, :update, :destroy]
before_action :set_room, only: [:create, :update]
```

**After:**
```ruby
before_action :authenticate, only: %i[ create update destroy ]
before_action :set_room, only: %i[ create update ]
```

#### Step-by-Step Refactoring:

```bash
# 1. Find symbol arrays
ast-grep --pattern 'only: [$$SYMBOLS]'

# 2. Manual replacement (preserve spacing: %i[ ... ])
# Note: Space after [ and before ]

# 3. Verify syntax
ruby -c app/controllers/messages_controller.rb

# 4. Run tests
bundle exec rails test:controllers
```

---

## Medium Refactors (15-30 minutes)

### 🎯 Pattern 4: Time.now → Time.current

**Impact:** Timezone safety, production bugs prevented
**Files to check:** Models, controllers, services, jobs
**Risk level:** Medium (affects time calculations)

#### Example from app/models/session.rb

**Before:**
```ruby
def expired?
  expires_at && expires_at < Time.now
end

def time_until_expiry
  expires_at - Time.now if expires_at
end
```

**After:**
```ruby
def expired?
  expires_at && expires_at < Time.current
end

def time_until_expiry
  expires_at - Time.current if expires_at
end
```

#### Step-by-Step Refactoring:

```bash
# 1. Find all Time.now usages
grep -rn "Time\.now" app/

# 2. Review each usage context:
#    - Is timezone important? → Time.current
#    - Need UTC explicitly? → Time.current.utc
#    - System time needed? → Keep Time.now (rare)

# 3. Replace systematically
sed -i 's/Time\.now/Time.current/g' app/models/session.rb

# 4. Run comprehensive time-related tests
bundle exec rails test test/models/session_test.rb

# 5. Check for edge cases
# - Compare time zones in test vs production
# - Verify time comparisons work correctly
```

#### Common Gotchas:

```ruby
# ❌ DANGEROUS - Will break in different timezones
created_at > Time.now.beginning_of_day

# ✅ SAFE - Respects application timezone
created_at > Time.current.beginning_of_day

# ❌ DANGEROUS - Comparing different time zones
user.last_seen_at < Time.now - 1.hour

# ✅ SAFE - Consistent time zones
user.last_seen_at < 1.hour.ago
```

---

### 🎯 Pattern 5: .map(&:attribute) → .pluck(:attribute)

**Impact:** 70% performance improvement, memory reduction
**Files to check:** Controllers, services, jobs
**Risk level:** Low (equivalent behavior for simple attributes)

#### Example from app/controllers/rooms_controller.rb

**Before:**
```ruby
def index
  @rooms = current_user.rooms.includes(:creator)
  @room_ids = @rooms.map(&:id)
  @creator_names = @rooms.map { |r| r.creator.name }
end
```

**After:**
```ruby
def index
  @rooms = current_user.rooms.includes(:creator)
  @room_ids = current_user.rooms.pluck(:id)  # Direct query, no loading
  @creator_names = current_user.rooms.joins(:creator).pluck('users.name')
end
```

#### Step-by-Step Refactoring:

```bash
# 1. Find .map(&:id) patterns
grep -rn "\.map(&:" app/controllers/ app/services/

# 2. Analyze each case:
#    - Simple attribute? → .pluck
#    - Method call? → Check if database column
#    - Complex logic? → Keep .map

# 3. Replace with .pluck
# Before: @rooms.map(&:id)
# After: @rooms.pluck(:id)

# 4. Benchmark (optional but recommended)
Benchmark.measure { @rooms.map(&:id) }
Benchmark.measure { @rooms.pluck(:id) }

# 5. Test query results
bundle exec rails test
```

#### When NOT to use .pluck:

```ruby
# ❌ DON'T - You need the full objects later
user_ids = users.pluck(:id)
users.each { |u| u.update(status: 'active') }  # ERROR - users already loaded!

# ✅ DO - Keep the relation
user_ids = users.pluck(:id)
# Separate query if you need objects later

# ❌ DON'T - Complex method with logic
users.map(&:full_name_with_title)  # Method has business logic

# ✅ DO - Use pluck for database columns only
users.pluck(:first_name, :last_name)
```

---

### 🎯 Pattern 6: .present? → .exists? (for ActiveRecord)

**Impact:** 50% faster, avoids loading records
**Files to check:** Models, controllers, services
**Risk level:** Low (equivalent for boolean checks)

#### Example from app/models/user.rb

**Before:**
```ruby
def has_unread_messages?
  messages.where(read: false).present?
end

def has_any_rooms?
  rooms.present?
end

def email_taken?(email)
  User.where(email: email).any?
end
```

**After:**
```ruby
def has_unread_messages?
  messages.where(read: false).exists?
end

def has_any_rooms?
  rooms.exists?
end

def email_taken?(email)
  User.where(email: email).exists?
end
```

#### Step-by-Step Refactoring:

```bash
# 1. Find .present? on relations
grep -rn "\.where.*\.present?" app/

# 2. Also check .any? and .empty?
grep -rn "\.where.*\.any?" app/

# 3. Replace with .exists?
# Pattern: relation.where(...).present? → relation.where(...).exists?

# 4. Verify with query logs
# In rails console:
ActiveRecord::Base.logger = Logger.new(STDOUT)
User.where(email: 'test@example.com').exists?  # See query

# 5. Test all affected methods
bundle exec rails test test/models/user_test.rb
```

#### Performance Comparison:

```ruby
# ❌ SLOW - Loads all records into memory
User.where(active: true).present?
# SQL: SELECT "users".* FROM "users" WHERE "users"."active" = true
# Memory: Loads ALL user objects

# ✅ FAST - Just counts existence
User.where(active: true).exists?
# SQL: SELECT 1 FROM "users" WHERE "users"."active" = true LIMIT 1
# Memory: No objects loaded
```

---

## Advanced Transformations (1+ hour)

### 🎯 Pattern 7: N+1 Query Elimination

**Impact:** CRITICAL - 10x to 100x performance improvement
**Files to check:** Controllers, views, serializers
**Risk level:** Medium (requires careful testing)

#### Example from app/controllers/rooms_controller.rb

**Before (N+1 Problem):**
```ruby
def index
  @rooms = current_user.rooms
end
```

```erb
<!-- app/views/rooms/index.html.erb -->
<% @rooms.each do |room| %>
  <div class="room">
    <h3><%= room.name %></h3>
    <p>Created by: <%= room.creator.name %></p>  <!-- N+1! -->
    <p>Messages: <%= room.messages.count %></p>   <!-- N+1! -->
    <p>Members: <%= room.members.count %></p>     <!-- N+1! -->
  </div>
<% end %>
```

**SQL Queries (for 10 rooms):**
```sql
SELECT "rooms".* FROM "rooms" WHERE "rooms"."user_id" = 1        -- 1 query
SELECT "users".* FROM "users" WHERE "users"."id" = 2             -- Query 1
SELECT "users".* FROM "users" WHERE "users"."id" = 3             -- Query 2
... (10 queries for creators)
SELECT COUNT(*) FROM "messages" WHERE "messages"."room_id" = 1   -- Query 1
... (10 queries for message counts)
SELECT COUNT(*) FROM "members" WHERE "members"."room_id" = 1     -- Query 1
... (10 queries for member counts)
-- TOTAL: 31 queries! (1 + 10 + 10 + 10)
```

**After (Optimized):**
```ruby
def index
  @rooms = current_user.rooms
    .includes(:creator)                    # Eager load creator
    .left_joins(:messages, :members)       # Join for counts
    .select('rooms.*',
            'COUNT(DISTINCT messages.id) as messages_count',
            'COUNT(DISTINCT members.id) as members_count')
    .group('rooms.id')
end
```

**SQL Queries (for 10 rooms):**
```sql
SELECT rooms.*,
       COUNT(DISTINCT messages.id) as messages_count,
       COUNT(DISTINCT members.id) as members_count
FROM "rooms"
LEFT JOIN "messages" ON "messages"."room_id" = "rooms"."id"
LEFT JOIN "members" ON "members"."room_id" = "rooms"."id"
WHERE "rooms"."user_id" = 1
GROUP BY rooms.id

SELECT "users".* FROM "users" WHERE "users"."id" IN (2, 3, 4, ...)
-- TOTAL: 2 queries! (1 + 1) 🎉
```

#### Step-by-Step Refactoring:

```bash
# 1. Enable query logging in development
# config/environments/development.rb
config.active_record.verbose_query_logs = true

# 2. Install bullet gem to detect N+1
# Gemfile
gem 'bullet', group: :development

# 3. Configure bullet
# config/environments/development.rb
config.after_initialize do
  Bullet.enable = true
  Bullet.alert = true
  Bullet.console = true
end

# 4. Visit the page and observe logs
rails server
# Visit http://localhost:3000/rooms
# Check console for Bullet warnings

# 5. Fix incrementally:
# a) Add includes for associations
@rooms = current_user.rooms.includes(:creator)

# b) Add counter caches for counts
# Migration:
add_column :rooms, :messages_count, :integer, default: 0
add_column :rooms, :members_count, :integer, default: 0

# Model:
belongs_to :room, counter_cache: true

# 6. Test thoroughly
bundle exec rails test:integration

# 7. Benchmark before/after
ab -n 100 -c 10 http://localhost:3000/rooms
```

---

### 🎯 Pattern 8: ActiveSupport::Concern Extraction

**Impact:** Code organization, reusability
**Files to check:** Models with shared behavior
**Risk level:** Medium (requires understanding dependencies)

#### Example: Extracting Searchable Behavior

**Before (Duplicated in multiple models):**

```ruby
# app/models/message.rb
class Message < ApplicationRecord
  def self.search(query)
    where("content ILIKE ?", "%#{query}%")
  end

  def self.search_by_user(user, query)
    where(user: user).search(query)
  end
end

# app/models/room.rb
class Room < ApplicationRecord
  def self.search(query)
    where("name ILIKE ?", "%#{query}%")
  end

  def self.search_by_account(account, query)
    where(account: account).search(query)
  end
end
```

**After (Extracted Concern):**

```ruby
# app/models/concerns/searchable.rb
module Searchable
  extend ActiveSupport::Concern

  included do
    scope :search, ->(query, *fields) {
      return all if query.blank?

      fields = searchable_fields if fields.empty?
      conditions = fields.map { |field| "#{field} ILIKE :query" }.join(" OR ")
      where(conditions, query: "%#{query}%")
    }
  end

  class_methods do
    def searchable_fields
      @searchable_fields ||= []
    end

    def searchable(*fields)
      @searchable_fields = fields
    end
  end
end

# app/models/message.rb
class Message < ApplicationRecord
  include Searchable
  searchable :content, :subject

  scope :by_user, ->(user) { where(user: user) }
end

# app/models/room.rb
class Room < ApplicationRecord
  include Searchable
  searchable :name, :description

  scope :by_account, ->(account) { where(account: account) }
end
```

#### Usage:

```ruby
# Clean, chainable interface
Message.search("hello").by_user(current_user)
Room.search("general").by_account(current_account)
```

#### Step-by-Step Refactoring:

```bash
# 1. Identify common patterns across models
grep -A 5 "def self.search" app/models/*.rb

# 2. Create concern file
mkdir -p app/models/concerns
touch app/models/concerns/searchable.rb

# 3. Extract common logic to concern
# - Move shared methods to concern
# - Use included do...end for class macros
# - Use class_methods for class methods

# 4. Update models to include concern
# - Add include Searchable
# - Configure with searchable :field1, :field2
# - Remove duplicated methods

# 5. Test each model
bundle exec rails test test/models/message_test.rb
bundle exec rails test test/models/room_test.rb

# 6. Update controllers/services using the methods
# - Verify all search functionality works
# - Check query performance
```

---

## Refactoring Workflows

### 🔄 Workflow 1: Single File Refactoring

**Time:** 5-15 minutes

```bash
# 1. Choose a file
git status  # Find modified files, or pick any

# 2. Create feature branch
git checkout -b refactor/improve-user-model

# 3. Run tests BEFORE changes
bundle exec rails test test/models/user_test.rb

# 4. Make incremental changes
# - Fix one pattern at a time
# - Run tests after each change
# - Commit frequently

# 5. Run full test suite
bundle exec rails test

# 6. Check test coverage (if using SimpleCov)
open coverage/index.html

# 7. Commit with clear message
git add app/models/user.rb
git commit -m "Refactor User model: stabby lambdas, pluck optimization"

# 8. Push and create PR
git push -u origin refactor/improve-user-model
```

---

### 🔄 Workflow 2: Pattern-Based Refactoring

**Time:** 30-60 minutes

```bash
# 1. Choose a pattern (e.g., "Convert all lambda to ->")
PATTERN="stabby-lambda"

# 2. Find all occurrences
ast-grep --pattern 'lambda { $$BODY }' -l ruby > /tmp/files_to_refactor.txt

# 3. Create tracking checklist
cat /tmp/files_to_refactor.txt | while read file; do
  echo "- [ ] $file"
done > REFACTORING_CHECKLIST.md

# 4. Refactor file by file
for file in $(cat /tmp/files_to_refactor.txt); do
  echo "Refactoring $file..."

  # a) Make changes
  # b) Run tests for that file
  # c) Commit

  git add "$file"
  git commit -m "Convert lambda to stabby lambda in $file"
done

# 5. Run full test suite
bundle exec rails test

# 6. Create summary commit
git add .
git commit -m "Complete stabby lambda conversion across codebase

- Converted 47 lambda usages to -> syntax
- All tests passing
- No functional changes"
```

---

### 🔄 Workflow 3: Performance-Focused Refactoring

**Time:** 1-3 hours

```bash
# 1. Identify slow endpoints
# Use rails server logs or APM (New Relic, Skylight)
grep "Completed 200" log/development.log | awk '{print $10, $2}' | sort -rn | head -20

# 2. Profile specific action
# Add to controller:
around_action :profile, only: [:index]

def profile
  require 'ruby-prof'
  RubyProf.start
  yield
  result = RubyProf.stop
  printer = RubyProf::FlatPrinter.new(result)
  printer.print(STDOUT)
end

# 3. Identify bottlenecks
# - Database queries (N+1)
# - Slow Ruby code
# - Memory allocation

# 4. Fix systematically:
# a) Add includes/joins for N+1
@rooms = Room.includes(:creator, :messages)

# b) Replace .map with .pluck
room_ids = Room.pluck(:id)  # not .map(&:id)

# c) Add counter caches
belongs_to :room, counter_cache: true

# d) Add database indexes
add_index :messages, [:room_id, :created_at]

# 5. Benchmark before/after
Benchmark.measure { RoomsController.new.index }

# 6. Test under load
ab -n 1000 -c 10 http://localhost:3000/rooms

# 7. Monitor in staging
# Deploy to staging, observe performance
```

---

## Common Scenarios

### 📋 Scenario 1: You Inherited Legacy Code

**Goal:** Modernize gradually without breaking things

**Week 1: Assessment**
```bash
# 1. Run code quality tools
rubocop --format html --out rubocop.html
open rubocop.html

# 2. Measure test coverage
COVERAGE=true bundle exec rails test
open coverage/index.html

# 3. Identify hot spots (most changed files)
git log --pretty=format: --name-only | sort | uniq -c | sort -rg | head -20

# 4. Create prioritized list
# Focus on files that are:
# - Changed frequently
# - Have low test coverage
# - Have many Rubocop violations
```

**Week 2-4: Quick Wins**
```bash
# Fix auto-correctable issues
rubocop --auto-correct-all

# Convert syntax patterns
# - lambda → ->
# - hash syntax
# - %i[] for symbol arrays
```

**Month 2: Performance**
```bash
# Add eager loading
# Fix N+1 queries
# Add counter caches
# Optimize database queries
```

**Month 3: Architecture**
```bash
# Extract concerns
# Simplify controllers
# Add service objects
# Improve test coverage
```

---

### 📋 Scenario 2: New Feature Development

**Goal:** Write new code following all patterns

**Checklist for New Code:**

```ruby
# ✅ Models
class NewModel < ApplicationRecord
  # ✅ Use stabby lambdas
  scope :active, -> { where(active: true) }

  # ✅ Use modern hash syntax
  validates :name, presence: true, uniqueness: { case_sensitive: false }

  # ✅ Use %i[] for symbols
  before_action :set_defaults, only: %i[ create update ]

  # ✅ Use Time.current
  def expire!
    update(expired_at: Time.current)
  end

  # ✅ Use .exists? for checks
  def self.name_available?(name)
    !where(name: name).exists?
  end
end
```

```ruby
# ✅ Controllers
class NewController < ApplicationController
  # ✅ Eager load associations
  def index
    @records = NewModel.includes(:user, :category).all
  end

  # ✅ Use .pluck for IDs
  def ids
    @ids = NewModel.active.pluck(:id)
  end

  # ✅ Use strong parameters
  def create
    @record = NewModel.new(record_params)
    # ...
  end

  private

  def record_params
    params.require(:new_model).permit(:name, :description)
  end
end
```

---

### 📋 Scenario 3: Code Review Checklist

**Use this when reviewing PRs:**

```markdown
## Style Patterns
- [ ] All lambdas use stabby syntax (->)
- [ ] All hashes use modern syntax (key: value)
- [ ] Symbol arrays use %i[ ]
- [ ] No old hash rockets (=>)

## Performance
- [ ] No N+1 queries (checked with Bullet)
- [ ] Uses .pluck instead of .map for simple attributes
- [ ] Uses .exists? instead of .present? for AR relations
- [ ] Uses .find_each for large collections
- [ ] Includes eager loading where needed

## Time & Dates
- [ ] Uses Time.current not Time.now
- [ ] Uses 1.hour.ago not Time.current - 1.hour
- [ ] Time zones handled correctly

## ActiveRecord
- [ ] Proper indexing for queries
- [ ] Counter caches for counts
- [ ] Scopes are composable
- [ ] No SQL strings (use Arel)

## Testing
- [ ] All new code has tests
- [ ] Tests use Minitest syntax
- [ ] Fixtures or factories for test data
- [ ] Edge cases covered

## Security
- [ ] Strong parameters for mass assignment
- [ ] No SQL injection vulnerabilities
- [ ] XSS prevented in views
- [ ] CSRF tokens present
```

---

## Automated Fixes

### 🤖 Rubocop Auto-Correction

**Fix many patterns automatically:**

```bash
# 1. Install rubocop if not present
gem install rubocop rubocop-rails rubocop-performance

# 2. Create .rubocop.yml if needed
cat > .rubocop.yml <<EOF
inherit_gem:
  rubocop-rails-omakase: rubocop.yml

AllCops:
  NewCops: enable
  TargetRubyVersion: 3.1

Style/Lambda:
  EnforcedStyle: literal

Style/HashSyntax:
  EnforcedStyle: ruby19

Style/SymbolArray:
  EnforcedStyle: percent
EOF

# 3. Run auto-correct
rubocop --auto-correct-all

# 4. Review changes
git diff

# 5. Run tests
bundle exec rails test
```

---

### 🤖 ast-grep Automated Refactoring

**Use ast-grep to transform code:**

```bash
# 1. Install ast-grep
cargo install ast-grep  # or: npm install -g @ast-grep/cli

# 2. Create refactoring script
cat > refactor.sh <<'EOF'
#!/bin/bash

# Convert lambda to stabby lambda
ast-grep --pattern 'lambda { $BODY }' --rewrite '-> { $BODY }' -U

# Convert lambda do...end to stabby lambda
ast-grep --pattern 'lambda do $BODY end' --rewrite '-> { $BODY }' -U

echo "Refactoring complete! Review changes with: git diff"
EOF

chmod +x refactor.sh

# 3. Run refactoring
./refactor.sh

# 4. Review and test
git diff
bundle exec rails test
```

---

### 🤖 Custom Refactoring Script

**Create your own automated refactoring:**

```ruby
#!/usr/bin/env ruby
# refactor_patterns.rb

require 'fileutils'

# Find all Ruby files
ruby_files = Dir.glob("app/**/*.rb")

ruby_files.each do |file|
  content = File.read(file)
  original_content = content.dup

  # 1. Convert lambda keyword to stabby lambda
  content.gsub!(/lambda\s*\{/, '-> {')
  content.gsub!(/lambda\s+do\b/, '-> do')

  # 2. Convert old hash syntax to new
  content.gsub!(/:(\w+)\s*=>/, '\1:')

  # 3. Convert symbol arrays
  content.gsub(/\[\s*:(\w+)(?:\s*,\s*:(\w+))+\s*\]/) do |match|
    symbols = match.scan(/:(\w+)/).flatten
    "%i[ #{symbols.join(' ')} ]"
  end

  # Only write if changed
  if content != original_content
    File.write(file, content)
    puts "✅ Refactored: #{file}"
  end
end

puts "\n🎉 Refactoring complete! Run tests: bundle exec rails test"
```

**Usage:**
```bash
chmod +x refactor_patterns.rb
./refactor_patterns.rb
bundle exec rails test
```

---

## 📊 Refactoring Metrics

**Track your progress:**

```ruby
#!/usr/bin/env ruby
# measure_style_compliance.rb

def count_pattern(pattern)
  `grep -r "#{pattern}" app/ | wc -l`.to_i
end

puts "📊 Campfire Style Compliance Report"
puts "=" * 50

# Lambda syntax
stabby = count_pattern('->'
lambda_keyword = count_pattern('lambda ')
lambda_total = stabby + lambda_keyword
lambda_compliance = (stabby.to_f / lambda_total * 100).round(1)

puts "\n🔸 Lambda Syntax:"
puts "  Stabby lambda (->):     #{stabby}"
puts "  Lambda keyword:         #{lambda_keyword}"
puts "  Compliance:             #{lambda_compliance}%"

# Hash syntax
modern_hash = count_pattern('\w+:'
old_hash = count_pattern(':\w+\s*=>'
hash_total = modern_hash + old_hash
hash_compliance = (modern_hash.to_f / hash_total * 100).round(1)

puts "\n🔸 Hash Syntax:"
puts "  Modern (key: value):    #{modern_hash}"
puts "  Old (:key =>):          #{old_hash}"
puts "  Compliance:             #{hash_compliance}%"

# Time usage
time_current = count_pattern('Time.current')
time_now = count_pattern('Time.now')
time_total = time_current + time_now
time_compliance = (time_current.to_f / time_total * 100).round(1)

puts "\n🔸 Time Usage:"
puts "  Time.current:           #{time_current}"
puts "  Time.now:               #{time_now}"
puts "  Compliance:             #{time_compliance}%"

# Overall score
overall_compliance = ((lambda_compliance + hash_compliance + time_compliance) / 3).round(1)

puts "\n" + "=" * 50
puts "🎯 Overall Compliance: #{overall_compliance}%"
puts "=" * 50
```

---

## 🎓 Next Steps

1. **Start Small:** Pick one pattern, fix it across the codebase
2. **Automate:** Use Rubocop and ast-grep for automatic fixes
3. **Measure:** Track compliance metrics weekly
4. **Team Alignment:** Share this playbook with your team
5. **Code Reviews:** Use the checklist for every PR
6. **Continuous Improvement:** Refactor a little bit every day

---

**Remember:** Refactoring is about improving code without changing behavior. Always:
- ✅ Run tests before and after
- ✅ Commit frequently
- ✅ Review changes carefully
- ✅ Measure performance impact
- ✅ Document why you made changes

**Happy refactoring! 🚀**
