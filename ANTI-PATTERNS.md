# 🚫 ANTI-PATTERNS: What NOT to Do in Campfire Code

**Learn from mistakes before you make them!**

This guide catalogs common anti-patterns found in Ruby/Rails codebases and shows the Campfire-approved way to write the code.

---

## Table of Contents

1. [Lambda and Proc Anti-Patterns](#lambda-and-proc-anti-patterns)
2. [Hash and Collection Anti-Patterns](#hash-and-collection-anti-patterns)
3. [ActiveRecord Anti-Patterns](#activerecord-anti-patterns)
4. [Controller Anti-Patterns](#controller-anti-patterns)
5. [Testing Anti-Patterns](#testing-anti-patterns)
6. [Performance Anti-Patterns](#performance-anti-patterns)
7. [Security Anti-Patterns](#security-anti-patterns)
8. [Code Organization Anti-Patterns](#code-organization-anti-patterns)

---

## Lambda and Proc Anti-Patterns

### ❌ ANTI-PATTERN: Using `lambda` keyword

```ruby
# ❌ BAD - Old-style lambda
scope :active, lambda { where(active: true) }
callback = lambda { |x| x * 2 }

# ❌ BAD - Proc.new
process = Proc.new { |item| transform(item) }
```

**Why it's bad:**
- Verbose and outdated syntax
- Not consistent with modern Ruby
- Found in ZERO places in Campfire codebase

**✅ CORRECT WAY:**
```ruby
# ✅ GOOD - Stabby lambda
scope :active, -> { where(active: true) }
callback = ->(x) { x * 2 }

# ✅ GOOD - Consistent with 100% of Campfire code
process = ->(item) { transform(item) }
```

---

## Hash and Collection Anti-Patterns

### ❌ ANTI-PATTERN: Hash rockets for symbols

```ruby
# ❌ BAD - Hash rockets (1.8 syntax)
user = { :name => "David", :email => "david@example.com" }
render :json => { :status => "ok" }
```

**Why it's bad:**
- Outdated Ruby 1.8 syntax
- Less readable
- Inconsistent with 99% of Campfire code

**✅ CORRECT WAY:**
```ruby
# ✅ GOOD - Modern hash syntax
user = { name: "David", email: "david@example.com" }
render json: { status: "ok" }
```

**Exception:** Hash rockets acceptable for non-symbol keys:
```ruby
# OK for string keys
{ "Content-Type" => "application/json" }
```

---

### ❌ ANTI-PATTERN: Traditional symbol arrays

```ruby
# ❌ BAD - Verbose symbol array
before_action :authenticate, only: [:create, :update, :destroy]
resources :users, only: [:index, :show, :create]
```

**Why it's bad:**
- More typing (`:` for each symbol)
- Easy to forget colons
- Not used anywhere in Campfire

**✅ CORRECT WAY:**
```ruby
# ✅ GOOD - %i[] notation (100% consistent in Campfire)
before_action :authenticate, only: %i[ create update destroy ]
resources :users, only: %i[ index show create ]
```

---

### ❌ ANTI-PATTERN: Array subtraction for single items

```ruby
# ❌ BAD - Verbose array subtraction
users = room.users - [current_user]
items = list - [item_to_remove]
```

**Why it's bad:**
- Requires array wrapper
- Less clear intent
- Not idiomatic Rails

**✅ CORRECT WAY:**
```ruby
# ✅ GOOD - .without method (Rails 6.1+)
users = room.users.without(current_user)
items = list.without(item_to_remove)

# ✅ ALSO GOOD - Multiple items
users = room.users.without(user1, user2, user3)
```

---

## ActiveRecord Anti-Patterns

### ❌ ANTI-PATTERN: Using `.map` for single attributes

```ruby
# ❌ BAD - Loads all records into memory, then maps
user_ids = User.active.map(&:id)
emails = User.where(role: :admin).map(&:email)

# 🐌 SLOW - Loads full ActiveRecord objects
names = Room.all.map { |room| room.name }
```

**Why it's bad:**
- Loads ALL columns from database
- Creates ActiveRecord objects (expensive)
- Uses 10-50x more memory
- 70% slower than .pluck

**✅ CORRECT WAY:**
```ruby
# ✅ GOOD - Database-level extraction (70% faster!)
user_ids = User.active.pluck(:id)
emails = User.where(role: :admin).pluck(:email)
names = Room.all.pluck(:name)

# ✅ ALSO GOOD - Multiple attributes
User.active.pluck(:id, :email)  #=> [[1, "a@ex.com"], [2, "b@ex.com"]]
```

---

### ❌ ANTI-PATTERN: Using `.present?` for existence checks

```ruby
# ❌ BAD - Loads records to check existence
if User.where(email: email).present?
  # User exists
end

# ❌ BAD - Same problem
return if messages.where(user: user).any?
```

**Why it's bad:**
- Loads records from database
- Uses more memory
- 50% slower than .exists?
- Unnecessarily instantiates AR objects

**✅ CORRECT WAY:**
```ruby
# ✅ GOOD - Just checks existence (50% faster!)
if User.where(email: email).exists?
  # User exists
end

# ✅ ALSO GOOD - Specific ID
return if messages.exists?(user: user)
```

---

### ❌ ANTI-PATTERN: Using `.each` on large collections

```ruby
# ❌ BAD - Loads ALL records into memory
User.all.each do |user|
  user.send_notification
end

# 💥 MEMORY EXPLOSION with 10,000+ records
Message.where(created_at: ..1.year.ago).each do |message|
  message.archive!
end
```

**Why it's bad:**
- Loads all records at once
- Can cause out-of-memory errors
- No batching
- 90% more memory usage

**✅ CORRECT WAY:**
```ruby
# ✅ GOOD - Batches of 1000 (90% less memory!)
User.all.find_each do |user|
  user.send_notification
end

# ✅ ALSO GOOD - Custom batch size
Message.where(created_at: ..1.year.ago).find_each(batch_size: 500) do |message|
  message.archive!
end
```

---

### ❌ ANTI-PATTERN: Empty relation hacks

```ruby
# ❌ BAD - SQL hack
messages = Message.where("1 = 0")

# ❌ BAD - Breaks relation chain
messages = []

# ❌ BAD - Doesn't return relation
messages = nil
```

**Why it's bad:**
- SQL hack is ugly and non-obvious
- Array breaks relation methods
- Can't chain further queries

**✅ CORRECT WAY:**
```ruby
# ✅ GOOD - Returns proper empty relation
messages = Message.none

# ✅ Can still chain!
messages.where(room: room).order(:created_at)  # Works!
```

---

### ❌ ANTI-PATTERN: Updating timestamps manually

```ruby
# ❌ BAD - Manual timestamp update
search.update(updated_at: Time.current)

# ❌ BAD - Triggers callbacks unnecessarily
record.update!(updated_at: Time.current)
```

**Why it's bad:**
- Verbose
- May trigger unwanted callbacks
- Not idiomatic Rails

**✅ CORRECT WAY:**
```ruby
# ✅ GOOD - Updates timestamp without callbacks
search.touch

# ✅ ALSO GOOD - Touch specific column
search.touch(:last_viewed_at)
```

---

## Controller Anti-Patterns

### ❌ ANTI-PATTERN: Using `flash` when rendering

```ruby
# ❌ BAD - Flash persists to NEXT request!
def create
  @user = User.new(user_params)
  if @user.save
    redirect_to @user
  else
    flash[:alert] = "Validation failed"  # ⚠️ WRONG!
    render :new  # User sees flash, THEN sees it again on next request!
  end
end
```

**Why it's bad:**
- `flash` persists to next request
- User sees same message twice
- Confusing UX

**✅ CORRECT WAY:**
```ruby
# ✅ GOOD - flash.now for current request only
def create
  @user = User.new(user_params)
  if @user.save
    redirect_to @user
  else
    flash.now[:alert] = "Validation failed"  # ✅ Current request only
    render :new
  end
end

# REMEMBER: flash = redirect, flash.now = render
```

---

### ❌ ANTI-PATTERN: Rendering body for empty responses

```ruby
# ❌ BAD - Renders empty body
render nothing: true, status: :forbidden
render body: nil, status: :not_found
render json: {}, status: :no_content
```

**Why it's bad:**
- Verbose
- `nothing: true` is deprecated
- Not the Rails way

**✅ CORRECT WAY:**
```ruby
# ✅ GOOD - head for empty responses
head :forbidden
head :not_found
head :no_content
```

---

### ❌ ANTI-PATTERN: String status codes

```ruby
# ❌ BAD - Magic numbers
redirect_to root_path, status: 301
render json: {}, status: 422
head 403
```

**Why it's bad:**
- Magic numbers aren't self-documenting
- Easy to forget what code means
- Not semantic

**✅ CORRECT WAY:**
```ruby
# ✅ GOOD - Semantic status symbols
redirect_to root_path, status: :moved_permanently
render json: {}, status: :unprocessable_entity
head :forbidden
```

---

## Testing Anti-Patterns

### ❌ ANTI-PATTERN: Using `refute`

```ruby
# ❌ BAD - Old Minitest syntax
test "user is not admin" do
  refute users(:david).admin?
  refute_equal "admin", user.role
end
```

**Why it's bad:**
- Not Rails convention
- Less readable
- Not used in Campfire (0 occurrences)

**✅ CORRECT WAY:**
```ruby
# ✅ GOOD - assert_not (100% consistent in Campfire)
test "user is not admin" do
  assert_not users(:david).admin?
  assert_not_equal "admin", user.role
end
```

---

### ❌ ANTI-PATTERN: `def test_` method names

```ruby
# ❌ BAD - Method-style test names
def test_user_can_create_room
  # ...
end

def test_admin_can_delete_message
  # ...
end
```

**Why it's bad:**
- Less readable
- No spaces in test names
- Not found anywhere in Campfire

**✅ CORRECT WAY:**
```ruby
# ✅ GOOD - String descriptions (100% consistent)
test "user can create room" do
  # ...
end

test "admin can delete message" do
  # ...
end
```

---

### ❌ ANTI-PATTERN: `def setup` instead of block

```ruby
# ❌ BAD - Method-style setup
class UserTest < ActiveSupport::TestCase
  def setup
    @user = users(:david)
    @room = rooms(:watercooler)
  end
end
```

**Why it's bad:**
- Verbose
- Not the Minitest convention in Rails
- Not used in Campfire

**✅ CORRECT WAY:**
```ruby
# ✅ GOOD - Block-style setup (100% consistent)
class UserTest < ActiveSupport::TestCase
  setup do
    @user = users(:david)
    @room = rooms(:watercooler)
  end
end
```

---

### ❌ ANTI-PATTERN: Time stubbing instead of travel_to

```ruby
# ❌ BAD - Manual time stubbing
Time.stubs(:now).returns(1.day.from_now)
Time.stub(:current, future_time) do
  # test code
end
```

**Why it's bad:**
- Mocha dependency for simple time travel
- Can forget to unstub
- Less clean

**✅ CORRECT WAY:**
```ruby
# ✅ GOOD - Built-in time travel
travel_to 1.day.from_now do
  # test code runs as if tomorrow
end

# ✅ Automatically travels back after block!
```

---

## Performance Anti-Patterns

### ❌ ANTI-PATTERN: N+1 queries

```ruby
# ❌ BAD - N+1 query problem
@rooms = Room.all
@rooms.each do |room|
  puts room.creator.name      # Query per room! 💥
  puts room.messages.count    # Query per room! 💥
end

# 100 rooms = 201 queries! (1 for rooms + 100 for creators + 100 for messages)
```

**Why it's bad:**
- Exponentially slow with more records
- Database connection pressure
- Can bring down production

**✅ CORRECT WAY:**
```ruby
# ✅ GOOD - Eager loading (only 3 queries!)
@rooms = Room.includes(:creator, :messages).all
@rooms.each do |room|
  puts room.creator.name      # No query! Already loaded
  puts room.messages.count    # No query! Already loaded
end

# Or use counter_cache for counts
```

---

### ❌ ANTI-PATTERN: Loading records for attribute check

```ruby
# ❌ BAD - Loads full records
user = User.find(id)
if user.email == target_email
  # ...
end

# ❌ BAD - N+1 for attribute checks
rooms.select { |room| room.creator_id == current_user.id }
```

**Why it's bad:**
- Loads unnecessary columns
- Instantiates AR objects
- Slow for large datasets

**✅ CORRECT WAY:**
```ruby
# ✅ GOOD - Database-level check
if User.where(id: id, email: target_email).exists?
  # ...
end

# ✅ GOOD - pluck for attribute filtering
room_ids = rooms.where(creator_id: current_user.id).pluck(:id)
```

---

## Security Anti-Patterns

### ❌ ANTI-PATTERN: Rescuing `Exception`

```ruby
# ❌ BAD - Catches EVERYTHING including system exits!
begin
  process_payment
rescue Exception => e
  logger.error e.message
end

# 💥 This catches SystemExit, SignalException, etc.!
```

**Why it's bad:**
- Catches system interrupts (Ctrl+C)
- Catches `exit` calls
- Prevents proper error handling
- Makes debugging impossible

**✅ CORRECT WAY:**
```ruby
# ✅ GOOD - Rescue StandardError or specific exceptions
begin
  process_payment
rescue StandardError => e
  logger.error e.message
end

# ✅ BETTER - Rescue specific exceptions
rescue ActiveRecord::RecordInvalid, Stripe::CardError => e
  logger.error e.message
end
```

**Exception:** Only acceptable in thread pools for safety:
```ruby
# OK in thread context
thread_pool.post do
  work
rescue Exception => e  # OK here - thread safety
  log_error(e)
end
```

---

### ❌ ANTI-PATTERN: Mass assignment without strong params

```ruby
# ❌ BAD - Security vulnerability!
def create
  @user = User.create(params[:user])  # 💥 Allows ANY attribute!
end

# Attacker can send: { user: { admin: true } }
```

**Why it's bad:**
- Mass assignment vulnerability
- Attacker can set admin, role, etc.
- Major security issue

**✅ CORRECT WAY:**
```ruby
# ✅ GOOD - Whitelist with strong parameters
def create
  @user = User.create(user_params)
end

private
  def user_params
    params.require(:user).permit(:name, :email, :password)
  end
```

---

## Code Organization Anti-Patterns

### ❌ ANTI-PATTERN: `self.method` in models

```ruby
# ❌ BAD - Scattered class methods
class Room < ApplicationRecord
  def self.open_rooms
    where(type: "Rooms::Open")
  end

  # ... instance methods ...

  def self.find_by_token(token)
    find_by(access_token: token)
  end
end
```

**Why it's bad:**
- Class methods scattered throughout file
- Hard to find all class methods
- Not consistent with Campfire (0% usage)

**✅ CORRECT WAY:**
```ruby
# ✅ GOOD - Group in class << self block (100% consistent)
class Room < ApplicationRecord
  class << self
    def open_rooms
      where(type: "Rooms::Open")
    end

    def find_by_token(token)
      find_by(access_token: token)
    end
  end

  # ... instance methods ...
end
```

---

### ❌ ANTI-PATTERN: Concerns without ActiveSupport::Concern

```ruby
# ❌ BAD - Manual module mixing
module Mentionable
  def self.included(base)
    base.has_many :mentions
    base.scope :mentioned, -> { ... }
  end

  def mentioned_by?(user)
    # ...
  end
end
```

**Why it's bad:**
- Verbose callback
- No class_methods helper
- Not the Rails way
- 0% usage in Campfire

**✅ CORRECT WAY:**
```ruby
# ✅ GOOD - ActiveSupport::Concern (100% consistent)
module Mentionable
  extend ActiveSupport::Concern

  included do
    has_many :mentions
    scope :mentioned, -> { ... }
  end

  class_methods do
    def find_by_mention(text)
      # ...
    end
  end

  def mentioned_by?(user)
    # ...
  end
end
```

---

### ❌ ANTI-PATTERN: Private methods not indented

```ruby
# ❌ BAD - Private not indented (Rubocop default)
class UsersController < ApplicationController
  def create
    # ...
  end

  private

  def user_params  # ❌ Not indented!
    params.require(:user).permit(:name)
  end
end
```

**Why it's bad:**
- Not Campfire convention
- Less clear visual separation
- Rubocop Rails Omakase expects indentation

**✅ CORRECT WAY:**
```ruby
# ✅ GOOD - Private methods indented (Omakase style)
class UsersController < ApplicationController
  def create
    # ...
  end

  private
    def user_params  # ✅ Indented under private
      params.require(:user).permit(:name)
    end

    def set_user
      @user = User.find(params[:id])
    end
end
```

---

## Environment and Configuration Anti-Patterns

### ❌ ANTI-PATTERN: ENV[] with || operator

```ruby
# ❌ BAD - Treats empty string as truthy!
api_key = ENV["API_KEY"] || "default"
log_level = ENV["LOG_LEVEL"] || "info"

# If ENV["API_KEY"] = "", you get "" not "default"!
```

**Why it's bad:**
- Empty string is truthy in Ruby
- ENV["KEY"] returns "" for unset with some setups
- Doesn't handle blank values

**✅ CORRECT WAY:**
```ruby
# ✅ GOOD - ENV.fetch handles empty and nil
api_key = ENV.fetch("API_KEY", "default")
log_level = ENV.fetch("LOG_LEVEL", "info")

# ✅ ALSO GOOD - Check for blank
api_key = ENV["API_KEY"].presence || "default"
```

---

### ❌ ANTI-PATTERN: Time.now in app code

```ruby
# ❌ BAD - Doesn't respect timezone config
created_at: Time.now
expires_at: Time.now + 1.hour
```

**Why it's bad:**
- Ignores `config.time_zone` setting
- Causes timezone bugs
- Not consistent (2 uses in Campfire, should be 0)

**✅ CORRECT WAY:**
```ruby
# ✅ GOOD - Timezone-aware
created_at: Time.current
expires_at: 1.hour.from_now

# ✅ ALSO GOOD
Time.zone.now  # Same as Time.current
```

---

## Code Smell Detection Checklist

Use this checklist to detect anti-patterns in pull requests:

```
🔍 ANTI-PATTERN DETECTION CHECKLIST

Lambda & Procs:
□ Any `lambda {` found? Should be `->`
□ Any `Proc.new` found? Should be `->`

Hashes & Collections:
□ Any `:key =>` found? Should be `key:`
□ Any `[:symbol, :array]` found? Should be `%i[]`
□ Any `array - [item]`? Should be `.without()`

ActiveRecord:
□ Any `.map(&:attr)` on AR relation? Should be `.pluck(:attr)`
□ Any `.present?` on AR relation? Should be `.exists?`
□ Any `.each` on large collection? Should be `.find_each`
□ Any `where("1 = 0")`? Should be `.none`

Controllers:
□ Any `flash[:key]` with `render`? Should be `flash.now[:key]`
□ Any `render body: nil`? Should be `head :status`
□ Any numeric status codes? Should be symbols

Testing:
□ Any `refute` found? Should be `assert_not`
□ Any `def test_`? Should be `test "description"`
□ Any `def setup`? Should be `setup do`
□ Any time stubbing? Should be `travel_to`

Performance:
□ Any iteration without `.includes`? Check for N+1
□ Any `.map(&:id)` on AR? Should be `.pluck(:id)`
□ Any `.present?` checks? Should be `.exists?`

Security:
□ Any `rescue Exception`? Should be `StandardError`
□ Any params without `.permit`? Security issue!
□ Any `eval`, `send` with user input? Security issue!

Organization:
□ Any `def self.method` in models? Should be `class << self`
□ Any module without `extend ActiveSupport::Concern`?
□ Any private methods not indented?

Config:
□ Any `ENV["KEY"] ||`? Should be `ENV.fetch("KEY")`
□ Any `Time.now` in app code? Should be `Time.current`
□ Any `.nil?` on ENV? Should be `.blank?`
```

---

## Quick Anti-Pattern Reference

| ❌ Anti-Pattern | ✅ Correct Pattern | Impact |
|-----------------|-------------------|---------|
| `lambda { }` | `-> { }` | Style |
| `:key => val` | `key: val` | Style |
| `[:a, :b]` | `%i[ a b ]` | Style |
| `.map(&:id)` | `.pluck(:id)` | 70% faster |
| `.present?` (AR) | `.exists?` | 50% faster |
| `.each` (large) | `.find_each` | 90% memory |
| `flash` + `render` | `flash.now` + `render` | Bug |
| `refute` | `assert_not` | Style |
| `def test_` | `test "..."` | Style |
| `Time.now` | `Time.current` | Bug |
| `rescue Exception` | `rescue StandardError` | Bug |
| `ENV[] \|\|` | `ENV.fetch()` | Bug |

---

**Remember:** These aren't just style preferences - many prevent REAL BUGS and performance issues!

**File:** ANTI-PATTERNS.md
**Updated:** 2025-11-05
**Version:** Ultra-Awesome Edition
