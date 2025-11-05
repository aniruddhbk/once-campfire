# 🎯 QUICK REFERENCE: Campfire Ruby/Rails Style

**One-Page Cheat Sheet** | Print and Keep at Your Desk!

---

## 🔥 Top 10 Must-Use Patterns

```ruby
# 1. STABBY LAMBDA - Always, everywhere, no exceptions
scope :active, -> { where(active: true) }
before_create -> { self.token ||= generate_token }

# 2. MODERN HASH SYNTAX - Never use =>
{ name: "David", role: :admin }

# 3. SYMBOL ARRAYS - Use %i[] notation
before_action :authenticate, only: %i[ create update destroy ]

# 4. TIME.CURRENT - Not Time.now (timezone-aware)
created_at: Time.current

# 5. SAFE NAVIGATION - Prevent NoMethodError
user&.profile&.avatar_url

# 6. PRESENCE - Return nil for empty/blank
value.presence || default

# 7. PLUCK - Extract attributes efficiently
User.active.pluck(:email)  # NOT .map(&:email)

# 8. EXISTS? - Check presence without loading
User.where(email: email).exists?  # NOT .present?

# 9. COMPACT_BLANK - Clean hashes and arrays
{ host: host, protocol: protocol }.compact_blank

# 10. DELEGATE - Forward methods cleanly
delegate :name, to: :user, prefix: true
```

---

## ⚡ Performance Quick Wins

| ❌ Slow | ✅ Fast | Speedup |
|---------|---------|---------|
| `.map(&:id)` | `.pluck(:id)` | **70%** |
| `.present?` | `.exists?` | **50%** |
| `.each` (large) | `.find_each` | **90%** memory |
| `where.not(id: ids)` | `.excluding(records)` | **30%** |
| `.join(", ")` | `.to_sentence` | More readable |

---

## 🧪 Testing Essentials

```ruby
# ALWAYS USE
test "description of what it tests" do
  setup do
    @user = users(:david)
  end

  assert_not user.admin?  # NOT refute
  assert_difference -> { User.count }, 1 do
    User.create!(name: "Alice")
  end

  travel_to 1.day.from_now do
    # Time-dependent code
  end
end
```

---

## 🎮 Controller Patterns

```ruby
class UsersController < ApplicationController
  # Macros at top
  allow_unauthenticated_access only: %i[ new create ]
  rate_limit to: 10, within: 3.minutes, only: :create

  before_action :set_user, only: %i[ show edit update ]

  def create
    @user = User.create!(user_params)
    redirect_to @user
  rescue ActiveRecord::RecordInvalid
    flash.now[:alert] = "Invalid"  # .now for render!
    render :new
  end

  def destroy
    head :forbidden unless can_delete?
  end

  private
    def user_params
      params.require(:user).permit(:name, :email)
    end
end
```

---

## 📦 Model Patterns

```ruby
class User < ApplicationRecord
  # 1. Includes at top
  include Avatar, Mentionable, Role

  # 2. Associations
  belongs_to :account, default: -> { Current.account }
  has_many :messages, dependent: :destroy

  # 3. Scopes (always stabby lambda)
  scope :active, -> { where(active: true) }
  scope :ordered, -> { order("LOWER(name)") }

  # 4. Callbacks (stabby lambda)
  before_create -> { self.token ||= SecureRandom.hex }
  after_destroy_commit -> { broadcast_remove }

  # 5. Class methods
  class << self
    def authenticate(email, password)
      find_by(email: email)&.authenticate(password)
    end
  end

  # 6. Instance methods
  def full_name
    [first_name, last_name].compact_blank.join(" ")
  end

  # 7. Private methods (indented under private)
  private
    def generate_token
      SecureRandom.alphanumeric(32)
    end
end
```

---

## 🔧 ActiveRecord Essentials

```ruby
# QUERY OPTIMIZATION
User.active.pluck(:id)              # NOT .map(&:id)
User.where(email: email).exists?    # NOT .present?
User.active.find_each { |u| ... }   # NOT .each

# UPDATES
record.touch                        # Update timestamp
record.update!(name: "Alice")       # ! raises on error

# DELETION
Model.destroy_by(status: :old)      # NOT where(...).destroy_all

# RELATIONS
Model.none                          # Empty relation
Model.excluding(records)            # Exclude records

# STI
record.becomes!(NewType)            # Convert STI type
```

---

## 🎨 String & Collection Tricks

```ruby
# STRINGS
str.presence || default             # nil if blank
str.strip                          # Remove whitespace
str.dup.force_encoding("UTF-8")    # Safe encoding
array.to_sentence                  # "A, B, and C"

# COLLECTIONS
array.without(item)                # Remove item
array.compact_blank                # Remove nil & empty
hash.compact_blank                 # Remove nil & empty values
array.excluding(items)             # ActiveRecord relations

# CHECKS
value.blank?                       # nil, "", [], {}
value.present?                     # Opposite of blank?
value.in?([1, 2, 3])              # Inclusion check
```

---

## 🚦 Conditionals

```ruby
# POSITIVE CONDITIONS
if user.admin?
  grant_access
end

# NEGATIVE CONDITIONS (single line only!)
redirect_to root_path unless signed_in?

# NEVER THIS
unless condition
  something
else  # ❌ CONFUSING!
  something_else
end

# CASE WITHOUT VARIABLE (for booleans)
case
when admin?     then grant_full_access
when member?    then grant_member_access
else                 deny_access
end
```

---

## 🎯 Concern Pattern

```ruby
module User::Mentionable
  extend ActiveSupport::Concern

  # Constants at top
  MENTION_REGEX = /@(\w+)/

  # included block for class-level DSL
  included do
    has_many :mentions, dependent: :destroy
    validates :username, format: { with: MENTION_REGEX }
  end

  # Class methods
  class_methods do
    def find_by_mention(text)
      # ...
    end
  end

  # Instance methods
  def mentioned_by?(user)
    mentions.exists?(user: user)
  end

  # Private methods
  private
    def extract_mentions
      # ...
    end
end
```

---

## ⏰ Time & Dates

```ruby
# ALWAYS USE Time.current (NOT Time.now)
created_at: Time.current

# RELATIVE TIMES
1.hour.ago
2.days.from_now
created_at.before?(1.week.ago)

# TESTING
travel_to 1.day.from_now do
  # Code runs as if tomorrow
end
```

---

## 🔒 Environment & Config

```ruby
# ALWAYS USE ENV.fetch
ENV.fetch("API_KEY", "default")    # NOT ENV["API_KEY"] || "default"

# CHECK FOR PRESENCE
ENV["DISABLE_SSL"].blank?          # NOT .nil? or == ""

# LAMBDAS IN CONFIG
config.middleware.use -> {
  condition ? MiddlewareA : MiddlewareB
}
```

---

## 🎪 Helper Patterns

```ruby
module RoomsHelper
  # Accept blocks with &
  def room_card(room, **attrs, &)
    tag.div **attrs, class: "room-card", &
  end

  # Forward keyword args with **
  def time_tag(datetime, **attrs)
    tag.time datetime.iso8601, **attrs
  end

  # Accessibility
  button_tag "Delete", aria: { label: "Delete room" }

  # Data attributes (underscores become hyphens)
  link_to "Room", room, data: { turbo_confirm: "Sure?" }
end
```

---

## 🚫 Common Anti-Patterns

| ❌ NEVER DO | ✅ ALWAYS DO |
|-------------|--------------|
| `lambda { }` | `-> { }` |
| `{ :key => value }` | `{ key: value }` |
| `Time.now` | `Time.current` |
| `.map(&:attr)` | `.pluck(:attr)` |
| `refute` | `assert_not` |
| `def test_name` | `test "description"` |
| `flash[:alert]` + `render` | `flash.now[:alert]` + `render` |
| `rescue Exception` | `rescue StandardError` |
| `.each` (large) | `.find_each` |
| `ENV["KEY"] \|\| default` | `ENV.fetch("KEY", default)` |

---

## 📊 When to Use What?

```
Need to extract IDs from query?
├─ Single attribute? → .pluck(:id)
└─ Multiple attributes? → .pluck(:id, :name)

Need to check if records exist?
├─ Just checking presence? → .exists?
├─ Need the record? → .find_by
└─ Need count? → .count

Need to iterate over many records?
├─ < 1000 records? → .each
├─ > 1000 records? → .find_each
└─ Need all in memory? → .to_a.each

Need to handle nil values?
├─ Return nil for blank? → .presence
├─ Safe navigation? → &.
└─ Default value? → .presence || default

Need to clean hash/array?
├─ Remove nil only? → .compact
├─ Remove nil & empty? → .compact_blank
└─ Remove specific keys? → .except(:key)
```

---

## 🎓 Learning Priority

**Week 1: Fundamentals (Must Know)**
- Stabby lambda everywhere
- Modern hash syntax
- %i[] for symbol arrays
- Time.current not Time.now
- assert_not not refute

**Week 2: Performance (Should Know)**
- .pluck for attributes
- .exists? for checks
- .find_each for batching
- .compact_blank for cleaning

**Week 3: Advanced (Nice to Know)**
- delegate for forwarding
- Concern patterns
- STI with .becomes!
- Testing with travel_to

---

## 🔍 Quick Lookup

**Need:** | **Use:**
---------|----------
Extract attribute | `.pluck(:attr)`
Check existence | `.exists?`
Remove nils | `.compact_blank`
Empty relation | `Model.none`
Safe navigation | `&.`
Default value | `.presence \|\| default`
Forward methods | `delegate :method, to: :object`
Update timestamp | `.touch`
Batch processing | `.find_each`
Time travel (test) | `travel_to time`

---

## 📝 Commit Message Template

```
Short imperative summary (50 chars or less)

Longer explanation if needed:
- What changed
- Why it changed
- Any side effects

Refs #123
```

---

## 🎯 Code Review Checklist

```ruby
✓ All lambdas use -> syntax?
✓ All hashes use key: value?
✓ All symbol arrays use %i[]?
✓ Using Time.current not Time.now?
✓ Using .pluck not .map for attributes?
✓ Using .exists? not .present? for queries?
✓ Using assert_not not refute in tests?
✓ Private methods indented under private?
✓ Concerns using ActiveSupport::Concern?
✓ Using flash.now when rendering?
```

---

**Print this page and keep it visible!**
**File:** QUICK-REFERENCE.md
**Updated:** 2025-11-05
**Version:** Ultra-Awesome Edition
