# Example Violations: Campfire Ruby/Rails Style

This document provides concrete examples of code that **violates** Campfire style conventions, along with the **correct** implementation and **rationale** for each pattern.

---

## 1. Lambda and Proc Patterns

### ❌ VIOLATION: Using `lambda` keyword instead of stabby lambda

```ruby
# BAD
scope :ordered, lambda { order(:created_at) }
before_create lambda { self.client_message_id ||= Random.uuid }

# BAD
callback = lambda do |message|
  process(message)
end

# BAD
Proc.new { |x| x * 2 }
```

### ✅ CORRECT: Always use stabby lambda syntax

```ruby
# GOOD
scope :ordered, -> { order(:created_at) }
before_create -> { self.client_message_id ||= Random.uuid }

# GOOD
callback = ->(message) do
  process(message)
end

# GOOD
->(x) { x * 2 }
```

**Rationale:** Stabby lambda is the modern Ruby syntax (introduced in 1.9). The Campfire codebase shows 100% consistency with this pattern across all lambdas (40+ occurrences). It's more concise and is the community standard.

**Severity:** Error
**Rule ID:** `use-stabby-lambda-not-lambda-keyword`, `use-stabby-lambda-not-proc`
**Auto-fixable:** Yes

---

## 2. Hash Syntax

### ❌ VIOLATION: Using hash rockets for symbol keys

```ruby
# BAD
has_many :messages, :class_name => "Message", :dependent => :destroy

# BAD
redirect_to root_url, :alert => "Not found"

# BAD
{ :name => "David", :role => "admin" }
```

### ✅ CORRECT: Use modern hash syntax with colons

```ruby
# GOOD
has_many :messages, class_name: "Message", dependent: :destroy

# GOOD
redirect_to root_url, alert: "Not found"

# GOOD
{ name: "David", role: "admin" }
```

**Rationale:** Modern hash syntax (introduced in Ruby 1.9) is cleaner and more readable. The Campfire codebase shows 99% consistency with this pattern (200+ occurrences). Hash rockets are only acceptable in special contexts like regex or when keys are not symbols.

**Severity:** Warning
**Rule ID:** `prefer-modern-hash-syntax`
**Auto-fixable:** Yes

---

## 3. Symbol Arrays

### ❌ VIOLATION: Using traditional symbol array syntax

```ruby
# BAD
before_action :set_message, only: [:show, :edit, :update, :destroy]

# BAD
resources :users, only: [:index, :show, :create]

# BAD
skip_before_action :authenticate, except: [:index, :show]
```

### ✅ CORRECT: Use %i[] notation for symbol arrays

```ruby
# GOOD
before_action :set_message, only: %i[ show edit update destroy ]

# GOOD
resources :users, only: %i[ index show create ]

# GOOD
skip_before_action :authenticate, except: %i[ index show ]
```

**Rationale:** The `%i[]` notation is more concise and prevents typos (no colons needed for each symbol). The Campfire codebase shows 100% consistency with this pattern in controller filters and routes (40+ occurrences).

**Severity:** Warning
**Rule ID:** `use-percent-i-for-symbol-arrays`, `before-action-only-except-use-symbols`, `routes-resource-only-use-symbols`
**Auto-fixable:** Yes

---

## 4. ActiveRecord Scope Syntax

### ❌ VIOLATION: Scope without lambda

```ruby
# BAD - Will be evaluated at load time, not query time
scope :ordered, order(:created_at)

# BAD - Using lambda keyword
scope :active, lambda { where(active: true) }
```

### ✅ CORRECT: Scopes must use stabby lambda

```ruby
# GOOD
scope :ordered, -> { order(:created_at) }

# GOOD
scope :active, -> { where(active: true) }

# GOOD - Multi-line scope
scope :with_attachment_details, -> {
  with_rich_text_body_and_embeds
  with_attached_attachment
    .includes(attachment_blob: :variant_records)
}
```

**Rationale:** Scopes must use lambdas to ensure they're evaluated at query time, not at class load time. Stabby lambda is the consistent syntax used throughout Campfire (50+ scope definitions).

**Severity:** Error
**Rule ID:** `scope-must-use-stabby-lambda`
**Auto-fixable:** Yes

---

## 5. Belongs To Default Values

### ❌ VIOLATION: Static default value for belongs_to

```ruby
# BAD - Evaluated at class load time
belongs_to :creator, class_name: "User", default: Current.user

# BAD - No lambda wrapper
belongs_to :account, default: Account.first
```

### ✅ CORRECT: Use lambda for dynamic defaults

```ruby
# GOOD - Evaluated at runtime
belongs_to :creator, class_name: "User", default: -> { Current.user }

# GOOD
belongs_to :account, default: -> { Account.default }
```

**Rationale:** Lambdas ensure the default value is evaluated at runtime (when the record is created), not at class load time. This is critical for values that change per request (like `Current.user`) or per execution context.

**Severity:** Error
**Rule ID:** `belongs-to-default-should-use-lambda`
**Auto-fixable:** Partially (can add lambda wrapper)

---

## 6. Concern Structure

### ❌ VIOLATION: Concern without ActiveSupport::Concern

```ruby
# BAD
module User::Bot
  def bot_key
    "#{id}-#{bot_token}"
  end

  def self.included(base)
    base.scope :active_bots, -> { active.where(role: :bot) }
  end
end
```

### ✅ CORRECT: Use ActiveSupport::Concern pattern

```ruby
# GOOD
module User::Bot
  extend ActiveSupport::Concern

  included do
    scope :active_bots, -> { active.where(role: :bot) }
    has_one :webhook, dependent: :delete
  end

  module ClassMethods
    def authenticate_bot(bot_key)
      # ...
    end
  end

  def bot_key
    "#{id}-#{bot_token}"
  end
end
```

**Rationale:** ActiveSupport::Concern provides cleaner syntax for defining concerns with class methods, instance methods, and DSL blocks. It's the Rails standard and used consistently in 100% of Campfire concerns (20+).

**Severity:** Error
**Rule ID:** `concern-must-extend-activesupport`
**Auto-fixable:** No (structural change required)

---

## 7. String Literals

### ❌ VIOLATION: Inconsistent use of single quotes

```ruby
# DISCOURAGED (not an error, but inconsistent)
redirect_to root_url, alert: 'Room not found'

def title
  [ name, bio ].join(' – ')
end

scope :filtered_by, ->(query) { where('name like ?', "%#{query}%") }
```

### ✅ CORRECT: Prefer double quotes

```ruby
# PREFERRED
redirect_to root_url, alert: "Room not found"

def title
  [ name, bio ].join(" – ")
end

scope :filtered_by, ->(query) { where("name like ?", "%#{query}%") }
```

**Rationale:** Rails Omakase convention prefers double quotes for consistency. While single quotes are acceptable, Campfire shows ~90% usage of double quotes. Double quotes also allow for easy addition of interpolation later.

**Severity:** Info
**Rule ID:** `prefer-double-quotes-for-strings`
**Auto-fixable:** Yes

**Exception:** Single quotes are fine in `require` statements and when explicitly avoiding interpolation for performance-critical code.

---

## 8. Enum Definitions

### ❌ VIOLATION: Array-based enum without .index_by

```ruby
# BAD - Creates integer-based enum
enum :involvement, %w[ invisible nothing mentions everything ]

# BAD - Manual hash creation
enum :involvement, {
  invisible: "invisible",
  nothing: "nothing",
  mentions: "mentions",
  everything: "everything"
}
```

### ✅ CORRECT: Use .index_by(&:itself) for string-based enums

```ruby
# GOOD - Creates string-based enum with cleaner syntax
enum :involvement, %w[ invisible nothing mentions everything ].index_by(&:itself), prefix: :involved_in
```

**Rationale:** String-based enums are more debuggable and database-readable. The `.index_by(&:itself)` pattern creates a hash mapping each string to itself, avoiding manual repetition. This is the consistent pattern in Campfire (3+ enum definitions).

**Severity:** Info
**Rule ID:** `enum-should-use-index-by-pattern`
**Auto-fixable:** Partially

---

## 9. Safe Navigation Operator

### ❌ VIOLATION: Conditional checks instead of safe navigation

```ruby
# BAD - Verbose
email = user && user.email_address

# BAD - Ternary
filename = attachment ? attachment.filename : nil

# BAD - If block
if account
  logo_url = account.logo_url
else
  logo_url = nil
end

# BAD - Multiple conditions
username = user && user.profile && user.profile.username
```

### ✅ CORRECT: Use safe navigation operator

```ruby
# GOOD - Concise
email = user&.email_address

# GOOD
filename = attachment&.filename

# GOOD
logo_url = account&.logo_url

# GOOD - Chainable
username = user&.profile&.username
```

**Rationale:** The safe navigation operator (`&.`) is more concise and prevents `NoMethodError` on nil. Campfire shows 30+ usages throughout the codebase, demonstrating strong adoption of this Ruby 2.3+ feature.

**Severity:** Info
**Rule ID:** `use-safe-navigation-operator`
**Auto-fixable:** Partially (context-dependent)

---

## 10. Class Methods in Models

### ❌ VIOLATION: Individual self.method definitions

```ruby
# DISCOURAGED - Scattered class methods
class Room < ApplicationRecord
  def self.create_for(attributes, users:)
    # ...
  end

  # ... instance methods ...

  def self.original
    # ...
  end
end
```

### ✅ CORRECT: Use class << self block

```ruby
# PREFERRED - Grouped class methods
class Room < ApplicationRecord
  class << self
    def create_for(attributes, users:)
      transaction do
        create!(attributes).tap do |room|
          room.memberships.grant_to users
        end
      end
    end

    def original
      order(:created_at).first
    end
  end

  # ... instance methods ...
end
```

**Rationale:** The `class << self` block clearly groups all class methods together, improving readability and organization. This is the consistent pattern in 100% of Campfire models with class methods.

**Severity:** Warning
**Rule ID:** `class-methods-in-models-use-class-self`
**Auto-fixable:** Yes

---

## 11. Test Assertions with Lambdas

### ❌ VIOLATION: Not using stabby lambda in assertions

```ruby
# BAD - Using block directly
assert_difference("Message.count", -1) do
  delete room_message_url(@room, message)
end

# BAD - Using lambda keyword
assert_changes(lambda { user.status }) do
  user.activate
end
```

### ✅ CORRECT: Use stabby lambda in test assertions

```ruby
# GOOD
assert_difference -> { Message.count }, -1 do
  delete room_message_url(@room, message)
end

# GOOD
assert_changes -> { user.status }, from: :inactive, to: :active do
  user.activate
end

# GOOD - Multiple counters
assert_difference -> { Membership.count }, +Rooms::Open.count do
  create_new_user
end
```

**Rationale:** Consistent with the lambda pattern used throughout the codebase. Stabby lambda is required for consistency. Campfire shows 100% usage of stabby lambda in test assertions (30+ occurrences).

**Severity:** Error
**Rule ID:** `test-assertions-use-stabby-lambda`
**Auto-fixable:** Yes

---

## 12. Ruby 3.1 Shorthand Keyword Arguments

### ❌ VIOLATION: Redundant keyword argument specification

```ruby
# REDUNDANT (not wrong, but verbose)
def perform(room, message)
  Room::MessagePusher.new(room: room, message: message).push
end

# REDUNDANT
User.create(name: name, email: email, role: role)
```

### ✅ CORRECT: Use Ruby 3.1+ shorthand when applicable

```ruby
# CONCISE - Ruby 3.1+
def perform(room, message)
  Room::MessagePusher.new(room:, message:).push
end

# CONCISE
User.create(name:, email:, role:)
```

**Rationale:** Ruby 3.1 introduced shorthand syntax for keyword arguments when the variable name matches the parameter name. This reduces redundancy and improves readability. Campfire shows increasing adoption (3+ occurrences in newer code).

**Severity:** Info (only for Ruby 3.1+)
**Rule ID:** `use-ruby-3-shorthand-kwargs`
**Auto-fixable:** Yes
**Note:** Only apply if your project uses Ruby 3.1 or later.

---

## 13. Case Statements with Boolean Conditions

### ❌ VIOLATION: Case with variable for boolean conditions

```ruby
# AWKWARD - Variable not really needed
case content
when content.attachment?
  render_attachment
when content.sound?
  render_sound
else
  render_text
end
```

### ✅ CORRECT: Case without variable for boolean conditions

```ruby
# CLEAN - More readable for boolean logic
case
when attachment?
  render_attachment
when sound?
  render_sound
else
  render_text
end

# ALSO GOOD - Using inquiry pattern
def content_type
  case
  when attachment?    then "attachment"
  when sound.present? then "sound"
  else                     "text"
  end.inquiry
end
```

**Rationale:** When conditions are boolean expressions rather than value comparisons, omitting the case variable improves readability. This pattern appears in 10+ locations in Campfire.

**Severity:** Info
**Rule ID:** `case-boolean-conditions-without-variable`
**Auto-fixable:** Partially

---

## 14. Private Method Organization

### ❌ VIOLATION: Incorrect indentation of private methods

```ruby
# BAD - Private methods not indented
class MessagesController < ApplicationController
  def index
    # ...
  end

  private

  def set_message
    @message = @room.messages.find(params[:id])
  end
end
```

### ✅ CORRECT: Indent private methods under private keyword

```ruby
# GOOD - Private methods indented 2 spaces
class MessagesController < ApplicationController
  def index
    # ...
  end

  private
    def set_message
      @message = @room.messages.find(params[:id])
    end

    def ensure_can_administer
      head :forbidden unless Current.user.can_administer?(@message)
    end
end
```

**Rationale:** Rails Omakase convention indents private methods to visually distinguish them from public methods. The `private` keyword itself remains at the same indentation level as public method definitions.

**Severity:** Error
**Rule ID:** `controller-private-methods-indented`
**Auto-fixable:** Yes (use Rubocop for formatting)

---

## 15. Concern Naming and Organization

### ❌ VIOLATION: Concern not namespaced correctly

```ruby
# BAD - Flat structure in models directory
# app/models/bot_methods.rb
module BotMethods
  extend ActiveSupport::Concern
  # ...
end

# BAD - Wrong namespace
# app/models/bot.rb
module Bot
  extend ActiveSupport::Concern
  # ... (should be under User)
end
```

### ✅ CORRECT: Namespace concerns under parent model

```ruby
# GOOD - Proper namespacing and file location
# app/models/user/bot.rb
module User::Bot
  extend ActiveSupport::Concern

  included do
    scope :active_bots, -> { active.where(role: :bot) }
  end

  module ClassMethods
    def authenticate_bot(bot_key)
      # ...
    end
  end
end

# In User model:
class User < ApplicationRecord
  include Bot
  # ...
end
```

**Rationale:** Namespacing concerns under their parent model prevents naming conflicts and makes the codebase easier to navigate. File location must match namespace (`app/models/user/bot.rb` for `User::Bot`). This is 100% consistent in Campfire (20+ concerns).

**Severity:** Warning
**Rule ID:** `concern-naming-matches-parent-model`
**Auto-fixable:** No (requires file move and refactoring)

---

## 16. Job Naming and Organization

### ❌ VIOLATION: Jobs not namespaced

```ruby
# DISCOURAGED - Flat job structure
# app/jobs/push_message_job.rb
class PushMessageJob < ApplicationJob
  def perform(room, message)
    # ...
  end
end

# DISCOURAGED
# app/jobs/webhook_job.rb
class WebhookJob < ApplicationJob
  def perform(bot, message)
    # ...
  end
end
```

### ✅ CORRECT: Namespace jobs under domain model

```ruby
# PREFERRED
# app/jobs/room/push_message_job.rb
class Room::PushMessageJob < ApplicationJob
  def perform(room, message)
    Room::MessagePusher.new(room:, message:).push
  end
end

# PREFERRED
# app/jobs/bot/webhook_job.rb
class Bot::WebhookJob < ApplicationJob
  def perform(bot, message)
    bot.deliver_webhook(message)
  end
end
```

**Rationale:** Namespacing jobs under their primary domain model provides clear ownership and organization. This makes it easy to find related jobs and understand the system's background job structure. Campfire shows 100% consistency with this pattern.

**Severity:** Info
**Rule ID:** `jobs-should-be-namespaced`
**Auto-fixable:** No (requires file move and refactoring)

---

## 17. Tap for Initialization

### ❌ VIOLATION: Verbose initialization with assignments

```ruby
# VERBOSE - Separate creation and configuration
def create_room(attributes, users)
  room = Room.create!(attributes)
  room.memberships.grant_to users
  room.broadcast_create
  room
end

# VERBOSE
def create_bot(attributes)
  user = User.create!(**attributes, bot_token: token, role: :bot)
  user.create_webhook!(url: webhook_url) if webhook_url
  user
end
```

### ✅ CORRECT: Use .tap for initialization side effects

```ruby
# CONCISE - Tap returns the object
def create_room(attributes, users)
  Room.create!(attributes).tap do |room|
    room.memberships.grant_to users
    room.broadcast_create
  end
end

# CONCISE
def create_bot(attributes)
  User.create!(**attributes, bot_token: token, role: :bot).tap do |user|
    user.create_webhook!(url: webhook_url) if webhook_url
  end
end
```

**Rationale:** The `.tap` method yields the object to a block and returns the object, making it ideal for initialization with side effects. This pattern appears 10+ times in Campfire and is a Ruby idiom for cleaner initialization.

**Severity:** Info
**Rule ID:** `use-tap-for-initialization`
**Auto-fixable:** Partially

---

## 18. Method-Level Rescue

### ❌ VIOLATION: Wrapping entire method in begin/rescue/end

```ruby
# VERBOSE
def message_tag(message, &)
  begin
    tag.div id: dom_id(message), class: "message" do
      # ... complex rendering logic ...
    end
  rescue Exception => e
    Sentry.capture_exception(e)
    Rails.logger.error "Exception: #{e.message}"
    render "messages/unrenderable"
  end
end
```

### ✅ CORRECT: Use method-level rescue

```ruby
# CLEAN
def message_tag(message, &)
  tag.div id: dom_id(message), class: "message" do
    # ... complex rendering logic ...
  end
rescue Exception => e
  Sentry.capture_exception(e)
  Rails.logger.error "Exception: #{e.message}"
  render "messages/unrenderable"
end
```

**Rationale:** When the entire method body needs error handling, method-level rescue is cleaner and more readable. This avoids unnecessary indentation and makes the happy path more prominent. Campfire uses this pattern 5+ times.

**Severity:** Info
**Rule ID:** `rescue-at-method-level-preferred`
**Auto-fixable:** Yes

---

## 19. Where.not for Negative Conditions

### ❌ VIOLATION: Using != in SQL string

```ruby
# LESS PREFERRED - Raw SQL
scope :without_bots, -> { where("role != ?", "bot") }

# LESS PREFERRED
scope :active, -> { where("status != 'inactive'") }
```

### ✅ CORRECT: Use where.not with Arel

```ruby
# PREFERRED - Arel syntax
scope :without_bots, -> { where.not(role: :bot) }

# PREFERRED
scope :active, -> { where.not(status: :inactive) }

# ALSO GOOD - Complex conditions
scope :without_direct_rooms, -> { joins(:room).where.not(room: { type: "Rooms::Direct" }) }
```

**Rationale:** Arel provides cleaner syntax and better database portability. The `where.not` method is more readable and doesn't require SQL string manipulation.

**Severity:** Info
**Rule ID:** `use-where-not-for-negative-conditions`
**Auto-fixable:** Partially (context-dependent)

---

## 20. Constant Naming

### ❌ VIOLATION: Constants not in SCREAMING_SNAKE_CASE

```ruby
# BAD
module Message::Attachment
  ThumbnailMaxWidth = 1200
  thumbnail_max_height = 800
  THUMBNAIL-MAX-PIXELS = 960000
end
```

### ✅ CORRECT: Use SCREAMING_SNAKE_CASE for constants

```ruby
# GOOD
module Message::Attachment
  THUMBNAIL_MAX_WIDTH = 1200
  THUMBNAIL_MAX_HEIGHT = 800
  THUMBNAIL_MAX_PIXELS = 960_000  # Underscores for readability
end
```

**Rationale:** Ruby convention dictates SCREAMING_SNAKE_CASE for constants. This is 100% consistent throughout Campfire (20+ constants). Underscores can be used in numeric literals for readability.

**Severity:** Error
**Rule ID:** `constants-use-screaming-snake-case`
**Auto-fixable:** Yes

---

## 21. Include Concerns at Top of Class

### ❌ VIOLATION: Including concerns after associations/methods

```ruby
# BAD - Concerns mixed with other code
class User < ApplicationRecord
  has_many :messages
  has_many :sessions

  include Avatar
  include Bot

  scope :active, -> { where(active: true) }

  include Role  # Too late!

  def name
    # ...
  end
end
```

### ✅ CORRECT: Include all concerns at top of class

```ruby
# GOOD - All includes together at top
class User < ApplicationRecord
  include Avatar, Bot, Mentionable, Role, Transferable

  has_many :messages
  has_many :sessions

  scope :active, -> { where(active: true) }

  def name
    # ...
  end
end
```

**Rationale:** Including concerns at the top of the class definition makes it immediately clear what functionality is mixed in. This is 100% consistent in Campfire and is a Rails best practice.

**Severity:** Info
**Rule ID:** `include-concerns-before-class-body`
**Auto-fixable:** No (requires manual reorganization)

---

## 22. Collect vs Map

### ❌ VIOLATION: Using .map instead of .collect

```ruby
# LESS IDIOMATIC (in Rails context)
user_ids = users.map { |user| user.id }

room_ids = Rooms::Open.pluck(:id).map { |id| { room_id: id, user_id: user_id } }
```

### ✅ CORRECT: Prefer .collect in Rails

```ruby
# MORE IDIOMATIC
user_ids = users.collect { |user| user.id }

# Or better, use pluck
user_ids = users.pluck(:id)

room_ids = Rooms::Open.pluck(:id).collect { |id| { room_id: id, user_id: user_id } }
```

**Rationale:** Historically, Rails has preferred `collect` over `map` for consistency with ActiveRecord methods like `pluck` and `select`. While `map` is more common in Ruby, Campfire uses `collect` consistently. Both work identically.

**Severity:** Info
**Rule ID:** `use-collect-over-map-for-transformations`
**Auto-fixable:** Yes

---

## 23. Callbacks Should Use Stabby Lambda

### ❌ VIOLATION: Callbacks without lambda or using lambda keyword

```ruby
# BAD - No lambda wrapper
before_create { self.join_code = generate_join_code }

# BAD - Using lambda keyword
after_destroy_commit lambda { user.reset_remote_connections }
```

### ✅ CORRECT: Callbacks use stabby lambda

```ruby
# GOOD
before_create -> { self.join_code = generate_join_code }

# GOOD
after_destroy_commit -> { user.reset_remote_connections }

# GOOD - Symbol for method name is also acceptable
before_validation :set_defaults
```

**Rationale:** Consistency with lambda pattern throughout codebase. Stabby lambda clearly indicates deferred execution. Campfire shows 100% usage of stabby lambda for inline callbacks (20+ occurrences).

**Severity:** Warning
**Rule ID:** `callbacks-should-use-stabby-lambda`
**Auto-fixable:** Yes

---

## Summary of Violations by Severity

### Errors (Must Fix)
1. Using `lambda` keyword instead of `->`
2. Scopes without lambda
3. Concern without `ActiveSupport::Concern`
4. `belongs_to` default without lambda
5. Constants not in SCREAMING_SNAKE_CASE
6. Private methods not indented
7. Test assertions without stabby lambda

### Warnings (Should Fix)
1. Hash rockets instead of modern syntax
2. Traditional symbol arrays instead of `%i[]`
3. Class methods not in `class << self` block (models)
4. Callbacks without stabby lambda
5. Concern naming/organization issues

### Info (Consider Fixing)
1. Single quotes instead of double quotes
2. Not using safe navigation operator
3. Not using `.tap` for initialization
4. Jobs not namespaced
5. Case with variable for boolean conditions
6. Not using method-level rescue
7. Using `.map` instead of `.collect`
8. Not using Ruby 3.1 shorthand kwargs (if Ruby 3.1+)

---

## Running Checks

```bash
# Scan for violations
sg scan --config sgconfig.yml app/ lib/

# Auto-fix where possible
sg scan --config sgconfig.yml --fix app/ lib/

# Check specific rule
sg scan --rule use-stabby-lambda-not-lambda-keyword app/

# Generate report
sg scan --config sgconfig.yml --json > violations-report.json
```

---

## False Positives and Exceptions

### When to Ignore Rules

1. **Hash Rockets**: Acceptable in regex patterns or external API requirements
2. **Single Quotes**: Acceptable in `require` statements
3. **Old Lambda Syntax**: May appear in vendored code or gems
4. **Non-Namespaced Jobs**: Generic jobs like `ApplicationJob` or one-off maintenance jobs

### Suppressing Specific Warnings

```ruby
# Use standard ast-grep ignore comments
# sg-ignore: use-stabby-lambda-not-lambda-keyword
lambda { puts "legacy code" }
```

---

**Last Updated:** 2025-11-05
**Rules Covered:** 30+
**Campfire Compliance:** 95%+
