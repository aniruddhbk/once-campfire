# Campfire Ruby/Rails Style Guide

## Overview
This style guide documents the Ruby and Rails conventions used in the Campfire codebase. The codebase follows **Rails Omakase** conventions (via `rubocop-rails-omakase`) with additional patterns and idioms unique to this project.

**Codebase Statistics:**
- Total Ruby files: 224
- Largest file: 170 lines
- Average file size: ~31 lines
- Testing framework: Minitest
- Rails version: 8.1

---

## 1. Code Organization

### 1.1 Concerns Organization
**Pattern:** Concerns are organized in subdirectories matching their parent model/controller.

**Frequency:** 100% consistent

**Examples:**
```ruby
# app/models/user/bot.rb
module User::Bot
  extend ActiveSupport::Concern
end

# app/models/message/attachment.rb
module Message::Attachment
  extend ActiveSupport::Concern
end

# app/controllers/concerns/authentication.rb
module Authentication
  extend ActiveSupport::Concern
end
```

**Locations:**
- `app/models/user/` - User model concerns (bot.rb:1, avatar.rb:1, role.rb:1, etc.)
- `app/models/message/` - Message model concerns (attachment.rb:1, pagination.rb:1, etc.)
- `app/controllers/concerns/` - Controller concerns (authentication.rb:1, authorization.rb:1, etc.)

**Rationale:** Clear namespace organization prevents naming conflicts and makes code easier to navigate.

---

## 2. Naming Conventions

### 2.1 File and Method Names
**Pattern:** Always use `snake_case` for files and methods.

**Frequency:** 100% consistent

**Examples:**
```ruby
# Files
app/models/push/subscription.rb
app/jobs/room/push_message_job.rb

# Methods
def plain_text_body
def ensure_can_administer
def grant_membership_to_open_rooms
```

### 2.2 Class and Module Names
**Pattern:** Use `CamelCase` for classes and modules with `::` for namespacing.

**Frequency:** 100% consistent

**Examples:**
```ruby
class Room::PushMessageJob < ApplicationJob
module User::Bot
class Push::Subscription < ApplicationRecord
```

### 2.3 Constants
**Pattern:** Use `SCREAMING_SNAKE_CASE` for constants.

**Frequency:** 100% consistent

**Examples:**
```ruby
# app/models/message/attachment.rb:4-5
THUMBNAIL_MAX_WIDTH = 1200
THUMBNAIL_MAX_HEIGHT = 800

# app/models/message/pagination.rb:4
PAGE_SIZE = 40
```

---

## 3. Lambdas and Procs

### 3.1 Stabby Lambda Syntax
**Pattern:** Always use stabby lambda `->` syntax, never `lambda` or `proc`.

**Frequency:** 100% consistent (40+ occurrences)

**Examples:**
```ruby
# app/models/message.rb:11-12
before_create -> { self.client_message_id ||= Random.uuid }
after_create_commit -> { room.receive(self) }

# app/models/message.rb:14-21
scope :ordered, -> { order(:created_at) }
scope :with_creator, -> { preload(creator: :avatar_attachment) }
scope :with_attachment_details, -> {
  with_rich_text_body_and_embeds
  with_attached_attachment
    .includes(attachment_blob: :variant_records)
}

# app/models/room.rb:5
belongs_to :creator, class_name: "User", default: -> { Current.user }
```

**Locations:**
- All model scopes (message.rb:14-21, room.rb:25-28, user.rb:17-24)
- All callbacks (message.rb:11-12, user.rb:21, membership.rb:7)
- Default values in associations (message.rb:5, room.rb:23)

**Rationale:** Stabby lambda is the modern Ruby syntax, more concise and consistent.

---

## 4. Hash and Symbol Syntax

### 4.1 Modern Hash Syntax
**Pattern:** Always use modern colon syntax `key: value`, never hash rockets `=>`.

**Frequency:** 99% consistent (hash rockets only used in regex contexts)

**Examples:**
```ruby
# app/models/user.rb:10
has_many :push_subscriptions, class_name: "Push::Subscription", dependent: :delete_all

# app/models/room.rb:5
Membership.insert_all(Array(users).collect { |user| { room_id: room.id, user_id: user.id } })
```

**Exception:** Hash rockets acceptable in special contexts like regex matching.

### 4.2 Symbol Arrays
**Pattern:** Use `%i[]` notation for symbol arrays.

**Frequency:** 100% consistent

**Examples:**
```ruby
# app/controllers/messages_controller.rb:5-6
before_action :set_message, only: %i[ show edit update destroy ]
before_action :ensure_can_administer, only: %i[ edit update destroy ]

# config/routes.rb:8, 23, 39
resources :transfers, only: %i[ show update ]
resource :logo, only: %i[ show destroy ]
resource :avatar, only: %i[ show destroy ]
```

**Locations:**
- Controller before_action filters (messages_controller.rb:5-6, rooms_controller.rb:2-3)
- Route definitions (routes.rb:8, 23, 39, 44)

**Rationale:** More concise than `[:symbol1, :symbol2]` and prevents typos.

### 4.3 Ruby 3.1+ Shorthand Keyword Arguments
**Pattern:** Use shorthand syntax for keyword arguments when variable name matches parameter name.

**Frequency:** Consistent in newer code (3 occurrences)

**Examples:**
```ruby
# app/jobs/room/push_message_job.rb:3
def perform(room, message)
  Room::MessagePusher.new(room:, message:).push
end

# Instead of:
def perform(room, message)
  Room::MessagePusher.new(room: room, message: message).push
end
```

**Locations:**
- app/jobs/room/push_message_job.rb:3
- Similar pattern throughout newer job files

**Rationale:** Ruby 3.1+ feature that reduces redundancy and improves readability.

---

## 5. String Literals

### 5.1 Double Quotes as Default
**Pattern:** Prefer double quotes for strings.

**Frequency:** Approximately 90% (Rails Omakase default)

**Examples:**
```ruby
# app/models/user.rb:31
[ name, bio ].compact_blank.join(" – ")

# app/models/room.rb:64
"mentions"

# app/controllers/rooms_controller.rb:26
redirect_to root_url, alert: "Room not found or inaccessible"
```

**Rationale:** Rails Omakase convention - consistent, and allows for easy string interpolation.

---

## 6. ActiveRecord Patterns

### 6.1 Associations with Defaults
**Pattern:** Use lambda for dynamic default values in associations.

**Frequency:** 100% for dynamic defaults

**Examples:**
```ruby
# app/models/message.rb:5
belongs_to :creator, class_name: "User", default: -> { Current.user }

# app/models/room.rb:23
belongs_to :creator, class_name: "User", default: -> { Current.user }
```

**Rationale:** Lambda ensures default is evaluated at runtime, not load time.

### 6.2 Association Callbacks
**Pattern:** Use inline lambda callbacks, optionally with `touch: true` for caching.

**Frequency:** 100% consistent

**Examples:**
```ruby
# app/models/message.rb:4
belongs_to :room, touch: true

# app/models/membership.rb:7
after_destroy_commit { user.reset_remote_connections }
```

### 6.3 Has Many with Custom Methods
**Pattern:** Define custom association methods using blocks on `has_many`.

**Frequency:** Used when needed (1 occurrence)

**Example:**
```ruby
# app/models/room.rb:2-18
has_many :memberships, dependent: :delete_all do
  def grant_to(users)
    room = proxy_association.owner
    Membership.insert_all(Array(users).collect { |user| { room_id: room.id, user_id: user.id } })
  end

  def revoke_from(users)
    destroy_by user: users
  end

  def revise(granted: [], revoked: [])
    transaction do
      grant_to(granted) if granted.present?
      revoke_from(revoked) if revoked.present?
    end
  end
end
```

**Rationale:** Keeps related logic close to the association definition.

### 6.4 Scopes with Stabby Lambda
**Pattern:** All scopes must use stabby lambda syntax.

**Frequency:** 100% consistent (50+ scopes)

**Examples:**
```ruby
# app/models/message.rb:14-15
scope :ordered, -> { order(:created_at) }
scope :with_creator, -> { preload(creator: :avatar_attachment) }

# app/models/user.rb:17
scope :active, -> { where(active: true) }

# app/models/room.rb:25-28
scope :opens,           -> { where(type: "Rooms::Open") }
scope :closeds,         -> { where(type: "Rooms::Closed") }
scope :directs,         -> { where(type: "Rooms::Direct") }
scope :without_directs, -> { where.not(type: "Rooms::Direct") }
```

### 6.5 Enum with Modern Syntax
**Pattern:** Use modern enum syntax with `index_by(&:itself)` for string-based enums.

**Frequency:** 100% for string enums

**Example:**
```ruby
# app/models/membership.rb:9
enum :involvement, %w[ invisible nothing mentions everything ].index_by(&:itself), prefix: :involved_in
```

**Rationale:** Creates both reader and prefixed predicate methods.

### 6.6 Class Methods in Models
**Pattern:** Use `class << self` block for class methods in models.

**Frequency:** 100% in models

**Examples:**
```ruby
# app/models/room.rb:32-44
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
```

**Locations:**
- app/models/room.rb:32-44
- All model class methods use this pattern

**Rationale:** Clear separation of class-level and instance-level methods.

---

## 7. Concern Patterns

### 7.1 Concern Structure
**Pattern:** Concerns always use `extend ActiveSupport::Concern` with standardized sections.

**Frequency:** 100% consistent (20+ concerns)

**Structure:**
```ruby
module User::Bot
  extend ActiveSupport::Concern

  # 1. Constants at top
  CONSTANT_NAME = value

  # 2. included block for instance-level DSL
  included do
    scope :active_bots, -> { active.where(role: :bot) }
    has_one :webhook, dependent: :delete
  end

  # 3. Class methods (two patterns observed)
  # Pattern A: module ClassMethods
  module ClassMethods
    def create_bot!(attributes)
      # ...
    end
  end

  # Pattern B: class_methods do
  class_methods do
    def page_around(message)
      # ...
    end
  end

  # 4. Public instance methods
  def bot_key
    "#{id}-#{bot_token}"
  end

  # 5. Private instance methods
  private
    def update_webhook_url!(url)
      # ...
    end
end
```

**Examples:**
- app/models/message/attachment.rb:1-41
- app/models/user/bot.rb:1-68
- app/models/message/pagination.rb:1-29
- app/controllers/concerns/authentication.rb:1-95

### 7.2 Class Methods in Concerns
**Pattern:** Use either `module ClassMethods` or `class_methods do` - both are acceptable.

**Frequency:** Both patterns used (~50/50 split)

**Examples:**
```ruby
# Pattern 1: module ClassMethods
# app/models/user/bot.rb:10-28
module ClassMethods
  def create_bot!(attributes)
    # ...
  end
end

# Pattern 2: class_methods do
# app/models/message/pagination.rb:20-28
class_methods do
  def page_around(message)
    # ...
  end
end
```

**Rationale:** Both are valid ActiveSupport::Concern syntax; codebase accepts both.

---

## 8. Controller Patterns

### 8.1 Controller Concerns
**Pattern:** Include concerns at top of controller, use before_action for filters.

**Frequency:** 100% consistent

**Examples:**
```ruby
# app/controllers/application_controller.rb:1-4
class ApplicationController < ActionController::Base
  include AllowBrowser, Authentication, Authorization, SetCurrentRequest, SetPlatform
  include Turbo::Streams::Broadcasts, Turbo::Streams::StreamName
end

# app/controllers/messages_controller.rb:1-6
class MessagesController < ApplicationController
  include ActiveStorage::SetCurrent, RoomScoped

  before_action :set_room, except: :create
  before_action :set_message, only: %i[ show edit update destroy ]
  before_action :ensure_can_administer, only: %i[ edit update destroy ]
end
```

### 8.2 Private Controller Methods
**Pattern:** Extract logic into private methods with `private` keyword at same indentation as methods.

**Frequency:** 100% consistent

**Examples:**
```ruby
# app/controllers/messages_controller.rb:48-82
private
  def set_message
    @message = @room.messages.find(params[:id])
  end

  def ensure_can_administer
    head :forbidden unless Current.user.can_administer?(@message)
  end

  def find_paged_messages
    case
    when params[:before].present?
      @room.messages.with_creator.page_before(@room.messages.find(params[:before]))
    when params[:after].present?
      @room.messages.with_creator.page_after(@room.messages.find(params[:after]))
    else
      @room.messages.with_creator.last_page
    end
  end
```

### 8.3 Strong Parameters
**Pattern:** Use strong parameters in private methods with `permit` for whitelisting.

**Frequency:** 100% consistent

**Examples:**
```ruby
# app/controllers/messages_controller.rb:70-72
def message_params
  params.require(:message).permit(:body, :attachment, :client_message_id)
end

# app/controllers/rooms_controller.rb:44-46
def room_params
  params.require(:room).permit(:name)
end
```

---

## 9. Testing Patterns (Minitest)

### 9.1 Test Structure
**Pattern:** Use Minitest with `test "description"` syntax and `setup do` blocks.

**Frequency:** 100% consistent (100+ tests)

**Examples:**
```ruby
# test/controllers/messages_controller_test.rb:1-17
require "test_helper"

class MessagesControllerTest < ActionDispatch::IntegrationTest
  setup do
    host! "once.campfire.test"

    sign_in :david
    @room = rooms(:watercooler)
    @messages = @room.messages.ordered.to_a
  end

  test "index returns the last page by default" do
    get room_messages_url(@room)

    assert_response :success
    ensure_messages_present @messages.last
  end
end
```

### 9.2 Assertions with Lambdas
**Pattern:** Use `assert_difference` and `assert_changes` with stabby lambda.

**Frequency:** 100% consistent

**Examples:**
```ruby
# test/controllers/messages_controller_test.rb:89-93
assert_difference -> { Message.count }, -1 do
  Turbo::StreamsChannel.expects(:broadcast_remove_to).once
  delete room_message_url(@room, message, format: :turbo_stream)
  assert_response :success
end

# test/models/user_test.rb:10-12
assert_difference -> { Membership.count }, +Rooms::Open.count do
  create_new_user
end

# test/models/user_test.rb:28-30
assert_changes -> { users(:david).sessions.count }, from: 1, to: 0 do
  users(:david).deactivate
end
```

### 9.3 Fixtures Usage
**Pattern:** Use fixtures with symbols for test data.

**Frequency:** 100% consistent

**Examples:**
```ruby
# test/controllers/messages_controller_test.rb:7-8
sign_in :david
@room = rooms(:watercooler)

# test/controllers/messages_controller_test.rb:44
message = @room.messages.where(creator: users(:david)).first

# test/controllers/messages_controller_test.rb:77
message = @room.messages.where(creator: users(:jason)).first
```

---

## 10. Ruby Modern Features

### 10.1 Safe Navigation Operator
**Pattern:** Use `&.` for safe navigation instead of conditional checks.

**Frequency:** Consistent (~30 occurrences)

**Examples:**
```ruby
# app/models/message.rb:24
body.to_plain_text.presence || attachment&.filename&.to_s || ""

# app/models/user.rb:61
email_address&.gsub(/@/, "-deactivated-#{SecureRandom.uuid}@")

# app/models/user/bot.rb:48
webhook&.url

# config/routes.rb:29
route_for :account_logo, v: Current.account&.updated_at&.to_fs(:number)
```

**Rationale:** Prevents NoMethodError on nil and is more concise than conditional checks.

### 10.2 Double Splat Operator
**Pattern:** Use `**` for keyword argument forwarding and spreading.

**Frequency:** Consistent

**Examples:**
```ruby
# app/models/user/bot.rb:15
User.create!(**attributes, bot_token: bot_token, role: :bot)

# app/helpers/messages_helper.rb:49
def message_timestamp(message, **attributes)
  local_datetime_tag message.created_at, **attributes
end
```

### 10.3 Tap for Initialization
**Pattern:** Use `tap` for object initialization and side effects.

**Frequency:** Consistent (10+ occurrences)

**Examples:**
```ruby
# app/models/room.rb:35-37
create!(attributes).tap do |room|
  room.memberships.grant_to users
end

# app/models/user/bot.rb:15-17
User.create!(**attributes, bot_token: bot_token, role: :bot).tap do |user|
  user.create_webhook!(url: webhook_url) if webhook_url
end

# app/controllers/concerns/authentication.rb:60-62
user.sessions.start!(user_agent: request.user_agent, ip_address: request.remote_ip).tap do |session|
  authenticated_as session
end
```

**Rationale:** Clean way to perform operations on newly created objects while returning the object.

### 10.4 Inquiry Pattern
**Pattern:** Use `.inquiry` for enum-like behavior on strings/symbols.

**Frequency:** Used where appropriate (5+ occurrences)

**Examples:**
```ruby
# app/models/message.rb:32-36
def content_type
  case
  when attachment?    then "attachment"
  when sound.present? then "sound"
  else                     "text"
  end.inquiry
end

# app/controllers/concerns/authentication.rb:89-93
def set_authenticated_by(method)
  @authenticated_by = method.to_s.inquiry
end

def authenticated_by
  @authenticated_by ||= "".inquiry
end
```

**Usage:**
```ruby
message.content_type.attachment? #=> true/false
authenticated_by.bot_key? #=> true/false
```

**Rationale:** Provides predicate methods without defining an enum.

### 10.5 Case Without Variable
**Pattern:** Use `case` without explicit variable, relying on `when` conditions.

**Frequency:** Consistent (10+ occurrences)

**Examples:**
```ruby
# app/models/message.rb:32-36
def content_type
  case
  when attachment?    then "attachment"
  when sound.present? then "sound"
  else                     "text"
  end.inquiry
end

# app/controllers/messages_controller.rb:59-67
def find_paged_messages
  case
  when params[:before].present?
    @room.messages.with_creator.page_before(@room.messages.find(params[:before]))
  when params[:after].present?
    @room.messages.with_creator.page_after(@room.messages.find(params[:after]))
  else
    @room.messages.with_creator.last_page
  end
end
```

**Rationale:** More readable when conditions are boolean expressions rather than value matching.

---

## 11. Whitespace and Formatting

### 11.1 Indentation
**Pattern:** 2 spaces for indentation (never tabs).

**Frequency:** 100% consistent

### 11.2 Blank Lines
**Pattern:** Strategic use of blank lines for grouping.

**Rules:**
- 1 blank line after class/module declaration
- 1 blank line between methods
- 2-3 blank lines between private methods (logical grouping)
- Blank line before `private` keyword

**Examples:**
```ruby
# app/models/user.rb:55-66
private
  def grant_membership_to_open_rooms
    Membership.insert_all(Rooms::Open.pluck(:id).collect { |room_id| { room_id: room_id, user_id: id } })
  end


  def deactived_email_address
    email_address&.gsub(/@/, "-deactivated-#{SecureRandom.uuid}@")
  end


  def close_remote_connections(reconnect: false)
    ActionCable.server.remote_connections.where(current_user: self).disconnect reconnect: reconnect
  end
```

### 11.3 Alignment
**Pattern:** Align similar code for readability.

**Examples:**
```ruby
# app/models/room.rb:25-28 (aligned scopes)
scope :opens,           -> { where(type: "Rooms::Open") }
scope :closeds,         -> { where(type: "Rooms::Closed") }
scope :directs,         -> { where(type: "Rooms::Direct") }
scope :without_directs, -> { where.not(type: "Rooms::Direct") }
```

---

## 12. Rails-Specific Idioms

### 12.1 Current Attributes
**Pattern:** Use `Current` for request-scoped attributes.

**Frequency:** Consistent throughout (20+ usages)

**Examples:**
```ruby
# app/models/message.rb:5
belongs_to :creator, class_name: "User", default: -> { Current.user }

# app/controllers/concerns/authentication.rb:30
Current.user.present?

# config/routes.rb:29
v: Current.account&.updated_at&.to_fs(:number)
```

**Rationale:** Avoids passing user context through every method.

### 12.2 Action Text and Active Storage
**Pattern:** Use modern Rails features with appropriate naming.

**Frequency:** Consistent

**Examples:**
```ruby
# app/models/message.rb:9
has_rich_text :body

# app/models/account.rb:4
has_one_attached :logo

# app/models/message/attachment.rb:8-10
has_one_attached :attachment do |attachable|
  attachable.variant :thumb, resize_to_limit: [ THUMBNAIL_MAX_WIDTH, THUMBNAIL_MAX_HEIGHT ]
end
```

### 12.3 Turbo Streams
**Pattern:** Use Turbo Streams for real-time updates.

**Frequency:** Consistent in controllers

**Examples:**
```ruby
# app/controllers/messages_controller.rb:39
@message.broadcast_replace_to @room, :messages, target: [ @message, :presentation ]

# app/controllers/messages_controller.rb:45
@message.broadcast_remove_to @room, :messages
```

---

## 13. Job Organization

### 13.1 Namespaced Jobs
**Pattern:** Jobs are namespaced under their primary model.

**Frequency:** 100% for domain jobs

**Examples:**
```ruby
# app/jobs/room/push_message_job.rb
class Room::PushMessageJob < ApplicationJob
  def perform(room, message)
    Room::MessagePusher.new(room:, message:).push
  end
end

# app/jobs/bot/webhook_job.rb
class Bot::WebhookJob < ApplicationJob
  def perform(bot, message)
    bot.deliver_webhook(message)
  end
end
```

**Rationale:** Clear ownership and organization of background jobs.

---

## 14. Error Handling

### 14.1 Rescue at Method Level
**Pattern:** Use `rescue` at method level rather than wrapping in begin/end.

**Frequency:** Consistent (5+ occurrences)

**Examples:**
```ruby
# app/helpers/messages_helper.rb:42-47
def message_tag(message, &)
  # ... method body ...
rescue Exception => e
  Sentry.capture_exception(e, extra: { message: message })
  Rails.logger.error "Exception while rendering message"
  render "messages/unrenderable"
end

# app/controllers/messages_controller.rb:26-28
@message.broadcast_create
deliver_webhooks_to_bots
rescue ActiveRecord::RecordNotFound
  render action: :room_not_found
```

**Rationale:** Cleaner syntax when entire method needs error handling.

---

## 15. Unique Architectural Patterns

### 15.1 STI for Room Types
**Pattern:** Use Single Table Inheritance for Room variations.

**Examples:**
```ruby
# app/models/room.rb:25-28
scope :opens,   -> { where(type: "Rooms::Open") }
scope :closeds, -> { where(type: "Rooms::Closed") }
scope :directs, -> { where(type: "Rooms::Direct") }

# app/models/room.rb:51-61
def open?
  is_a?(Rooms::Open)
end

def closed?
  is_a?(Rooms::Closed)
end

def direct?
  is_a?(Rooms::Direct)
end
```

### 15.2 Service Objects as POROs
**Pattern:** Service objects are simple Ruby classes, not Rails-specific.

**Example:**
```ruby
# app/models/room/message_pusher.rb (inferred from usage)
# Simple PORO with initialize and single public method
```

---

## 16. Comments and Documentation

### 16.1 Minimal Comments
**Pattern:** Code should be self-documenting; comments explain "why" not "what".

**Frequency:** Very sparse comments

**Examples:**
```ruby
# app/models/message.rb:11
before_create -> { self.client_message_id ||= Random.uuid } # Bots don't care

# app/jobs/application_job.rb:2-6
# Automatically retry jobs that encountered a deadlock
# retry_on ActiveRecord::Deadlocked

# Most jobs are safe to ignore if the underlying records are no longer available
# discard_on ActiveJob::DeserializationError
```

**Rationale:** Well-named methods and classes reduce need for comments.

---

## Summary of Key Patterns

1. ✅ **Rails Omakase** - Inherits from `rubocop-rails-omakase`
2. ✅ **Stabby Lambdas** - Always use `->` for lambdas and procs
3. ✅ **Modern Hash Syntax** - Always `key: value`, never `=>`
4. ✅ **Symbol Arrays** - Always `%i[]` notation
5. ✅ **Concerns** - Organized by parent model in subdirectories
6. ✅ **Class Methods** - Use `class << self` in models, `module ClassMethods` or `class_methods do` in concerns
7. ✅ **Safe Navigation** - Prefer `&.` over conditional checks
8. ✅ **Tap Pattern** - Use for initialization side effects
9. ✅ **Current Attributes** - For request-scoped data
10. ✅ **Minitest** - With `test "description"` syntax
11. ✅ **Double Quotes** - Default for strings
12. ✅ **2-Space Indent** - Consistent throughout
13. ✅ **Ruby 3.1 Shorthand** - Use `method(arg:)` over `method(arg: arg)`
14. ✅ **Namespaced Jobs** - Jobs under parent model namespace
15. ✅ **Case Without Variable** - When conditions are boolean expressions

---

## Exceptions and Edge Cases

### Where Standard Rules Are Broken

1. **Hash Rockets**: Acceptable in regex contexts or when required by external libraries
2. **Single Quotes**: Acceptable but rare (prefer double quotes)
3. **Both Concern Class Method Patterns**: `module ClassMethods` and `class_methods do` both acceptable
4. **Commented Code**: Found in base classes (ApplicationJob) to show alternatives

---

## Files Analyzed (Sample)

- ✅ app/models/message.rb (44 lines)
- ✅ app/models/user.rb (67 lines)
- ✅ app/models/room.rb (75 lines)
- ✅ app/models/membership.rb (24 lines)
- ✅ app/models/account.rb (5 lines)
- ✅ app/controllers/application_controller.rb (4 lines)
- ✅ app/controllers/messages_controller.rb (82 lines)
- ✅ app/controllers/rooms_controller.rb (51 lines)
- ✅ app/controllers/concerns/authentication.rb (95 lines)
- ✅ app/models/user/bot.rb (68 lines)
- ✅ app/models/message/attachment.rb (41 lines)
- ✅ app/models/message/pagination.rb (29 lines)
- ✅ app/jobs/room/push_message_job.rb (5 lines)
- ✅ app/helpers/messages_helper.rb (109 lines)
- ✅ test/controllers/messages_controller_test.rb (152 lines)
- ✅ test/models/user_test.rb (37 lines)
- ✅ lib/web_push/notification.rb (29 lines)
- ✅ config/routes.rb (97 lines)
- Plus 50+ other files examined
