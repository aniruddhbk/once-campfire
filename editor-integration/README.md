# 🎨 EDITOR INTEGRATION: Campfire Style in Your Editor

> **Bring Campfire style patterns into your favorite editor**
>
> Snippets, configs, and extensions for faster, better coding.

---

## Table of Contents

1. [VS Code Setup](#vs-code-setup)
2. [RubyMine Setup](#rubymine-setup)
3. [Sublime Text Setup](#sublime-text-setup)
4. [Vim/Neovim Setup](#vimneovim-setup)
5. [Universal EditorConfig](#universal-editorconfig)

---

## VS Code Setup

### 1. Install Extensions

```bash
# Essential extensions
code --install-extension rebornix.ruby
code --install-extension castwide.solargraph
code --install-extension kaiwood.endwise
code --install-extension misogi.ruby-rubocop

# Optional but recommended
code --install-extension vortizhe.simple-ruby-erb
code --install-extension wingrunr21.vscode-ruby
```

### 2. Configure Settings

**File:** `vscode/settings.json`

Copy to your project: `.vscode/settings.json`

```json
{
  // Ruby configuration
  "ruby.rubocop.onSave": true,
  "ruby.rubocop.configFilePath": ".rubocop.yml",
  "ruby.rubocop.suppressRubocopWarnings": false,
  "ruby.rubocop.executePath": "bundle exec rubocop",

  // Format on save
  "editor.formatOnSave": true,
  "[ruby]": {
    "editor.defaultFormatter": "misogi.ruby-rubocop",
    "editor.formatOnSave": true,
    "editor.tabSize": 2,
    "editor.insertSpaces": true
  },

  // File associations
  "files.associations": {
    "*.jbuilder": "ruby",
    "*.rake": "ruby",
    "Gemfile": "ruby",
    "Rakefile": "ruby",
    "*.ru": "ruby"
  },

  // Trim trailing whitespace
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,

  // Minitest support
  "ruby.testFramework": "minitest",

  // Solargraph (Ruby language server)
  "ruby.intellisense": "rubyLocate",
  "solargraph.diagnostics": true,
  "solargraph.formatting": true
}
```

### 3. Install Snippets

**File:** `vscode/ruby-campfire.code-snippets`

Copy to: `.vscode/ruby-campfire.code-snippets`

```json
{
  "Stabby Lambda": {
    "prefix": "lam",
    "body": [
      "-> { $1 }"
    ],
    "description": "Stabby lambda with block"
  },

  "Stabby Lambda with Params": {
    "prefix": "lamp",
    "body": [
      "->(${1:params}) { $2 }"
    ],
    "description": "Stabby lambda with parameters"
  },

  "Stabby Lambda do-end": {
    "prefix": "lamdo",
    "body": [
      "-> do",
      "  $1",
      "end"
    ],
    "description": "Stabby lambda with do-end"
  },

  "Scope": {
    "prefix": "scope",
    "body": [
      "scope :${1:name}, -> { ${2:where(active: true)} }"
    ],
    "description": "ActiveRecord scope with stabby lambda"
  },

  "Before Action": {
    "prefix": "before",
    "body": [
      "before_action :${1:authenticate}, only: %i[ ${2:create update destroy} ]"
    ],
    "description": "Controller before_action with %i[]"
  },

  "After Action": {
    "prefix": "after",
    "body": [
      "after_action :${1:log_action}, only: %i[ ${2:create update} ]"
    ],
    "description": "Controller after_action with %i[]"
  },

  "Pluck": {
    "prefix": "pluck",
    "body": [
      "${1:Model}.${2:where(active: true)}.pluck(:${3:id})"
    ],
    "description": "ActiveRecord pluck"
  },

  "Exists Check": {
    "prefix": "exists",
    "body": [
      "${1:Model}.where(${2:field}: ${3:value}).exists?"
    ],
    "description": "ActiveRecord exists? check"
  },

  "Find Each": {
    "prefix": "findeach",
    "body": [
      "${1:Model}.find_each do |${2:record}|",
      "  $3",
      "end"
    ],
    "description": "ActiveRecord find_each for batching"
  },

  "Time Current": {
    "prefix": "timec",
    "body": [
      "Time.current"
    ],
    "description": "Time.current (timezone-aware)"
  },

  "Date Current": {
    "prefix": "datec",
    "body": [
      "Date.current"
    ],
    "description": "Date.current (timezone-aware)"
  },

  "Presence": {
    "prefix": "pres",
    "body": [
      "${1:value}.presence || ${2:default}"
    ],
    "description": "presence pattern"
  },

  "Concern": {
    "prefix": "concern",
    "body": [
      "module ${1:ModuleName}",
      "  extend ActiveSupport::Concern",
      "",
      "  included do",
      "    $2",
      "  end",
      "",
      "  class_methods do",
      "    $3",
      "  end",
      "",
      "  $4",
      "end"
    ],
    "description": "ActiveSupport::Concern template"
  },

  "Test Case": {
    "prefix": "test",
    "body": [
      "test \"${1:should do something}\" do",
      "  $2",
      "end"
    ],
    "description": "Minitest test case"
  },

  "Setup": {
    "prefix": "setup",
    "body": [
      "setup do",
      "  $1",
      "end"
    ],
    "description": "Minitest setup"
  },

  "Assert": {
    "prefix": "assert",
    "body": [
      "assert ${1:condition}, \"${2:message}\""
    ],
    "description": "Minitest assertion"
  }
}
```

### 4. Tasks Configuration

**File:** `vscode/tasks.json`

Copy to: `.vscode/tasks.json`

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Run Tests",
      "type": "shell",
      "command": "bundle exec rails test",
      "group": {
        "kind": "test",
        "isDefault": true
      },
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "Run Rubocop",
      "type": "shell",
      "command": "bundle exec rubocop",
      "group": "build",
      "presentation": {
        "reveal": "always",
        "panel": "shared"
      }
    },
    {
      "label": "Rubocop Auto-correct",
      "type": "shell",
      "command": "bundle exec rubocop --auto-correct-all",
      "group": "build",
      "presentation": {
        "reveal": "always",
        "panel": "shared"
      }
    },
    {
      "label": "Style Analysis",
      "type": "shell",
      "command": "./style-analyzer.rb",
      "group": "build",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "AST-grep Scan",
      "type": "shell",
      "command": "ast-grep scan --config sgconfig.yml",
      "group": "build",
      "presentation": {
        "reveal": "always",
        "panel": "shared"
      }
    }
  ]
}
```

### 5. Keybindings

**File:** `vscode/keybindings.json`

Add to your keybindings:

```json
[
  {
    "key": "cmd+shift+t",
    "command": "workbench.action.tasks.runTask",
    "args": "Run Tests"
  },
  {
    "key": "cmd+shift+r",
    "command": "workbench.action.tasks.runTask",
    "args": "Run Rubocop"
  },
  {
    "key": "cmd+shift+f",
    "command": "workbench.action.tasks.runTask",
    "args": "Rubocop Auto-correct"
  }
]
```

---

## RubyMine Setup

### 1. Configure Rubocop

1. **Preferences → Tools → Rubocop**
2. ✅ Enable Rubocop
3. Configuration file: `.rubocop.yml`
4. ✅ Run Rubocop on save

### 2. Live Templates (Snippets)

**File:** `rubymine/campfire-templates.xml`

1. **Preferences → Editor → Live Templates**
2. Click **+** → Create new template group: "Campfire"
3. Import these templates:

```xml
<templateSet group="Campfire">
  <template name="lam" value="-> { $END$ }" description="Stabby lambda" toReformat="true" toShortenFQNames="true">
    <context>
      <option name="RUBY" value="true"/>
    </context>
  </template>

  <template name="scope" value="scope :$NAME$, -> { $BODY$ }" description="Scope with stabby lambda" toReformat="true" toShortenFQNames="true">
    <context>
      <option name="RUBY" value="true"/>
    </context>
    <variable name="NAME" expression="" defaultValue="" alwaysStopAt="true" />
    <variable name="BODY" expression="" defaultValue="" alwaysStopAt="true" />
  </template>

  <template name="pluck" value="$MODEL$.pluck(:$ATTR$)" description="ActiveRecord pluck" toReformat="true" toShortenFQNames="true">
    <context>
      <option name="RUBY" value="true"/>
    </context>
    <variable name="MODEL" expression="" defaultValue="" alwaysStopAt="true" />
    <variable name="ATTR" expression="" defaultValue="id" alwaysStopAt="true" />
  </template>
</templateSet>
```

### 3. File Watchers

**Automatically run Rubocop on file changes:**

1. **Preferences → Tools → File Watchers**
2. Click **+** → Add new watcher:
   - Name: Rubocop Auto-correct
   - File type: Ruby
   - Scope: Project Files
   - Program: `bundle`
   - Arguments: `exec rubocop --auto-correct $FilePath$`
   - Output paths: `$FilePath$`
   - ✅ Auto-save edited files

---

## Sublime Text Setup

### 1. Install Packages

Install via Package Control:

- SublimeLinter
- SublimeLinter-rubocop
- RubyTest
- Ruby Completions

### 2. Snippets

**File:** `sublime/stabby-lambda.sublime-snippet`

Save to: `~/Library/Application Support/Sublime Text/Packages/User/`

```xml
<snippet>
  <content><![CDATA[
-> { ${1:body} }
]]></content>
  <tabTrigger>lam</tabTrigger>
  <scope>source.ruby</scope>
  <description>Stabby Lambda</description>
</snippet>
```

**File:** `sublime/scope.sublime-snippet`

```xml
<snippet>
  <content><![CDATA[
scope :${1:name}, -> { ${2:where(active: true)} }
]]></content>
  <tabTrigger>scope</tabTrigger>
  <scope>source.ruby</scope>
  <description>ActiveRecord Scope</description>
</snippet>
```

### 3. Build System

**File:** `sublime/Ruby-Test.sublime-build`

```json
{
  "cmd": ["bundle", "exec", "rails", "test", "$file"],
  "file_regex": "^\\s*# (.*\\.rb):(\\d+)",
  "working_dir": "${project_path}",
  "selector": "source.ruby",
  "variants": [
    {
      "name": "Run All Tests",
      "cmd": ["bundle", "exec", "rails", "test"]
    },
    {
      "name": "Run Rubocop",
      "cmd": ["bundle", "exec", "rubocop", "$file"]
    }
  ]
}
```

---

## Vim/Neovim Setup

### 1. Install Plugins (vim-plug)

```vim
" ~/.vimrc or ~/.config/nvim/init.vim

call plug#begin('~/.vim/plugged')

" Ruby
Plug 'vim-ruby/vim-ruby'
Plug 'tpope/vim-rails'
Plug 'tpope/vim-endwise'

" Linting
Plug 'dense-analysis/ale'

" Completion
Plug 'neoclide/coc.nvim', {'branch': 'release'}

call plug#end()
```

### 2. ALE Configuration (Linting)

```vim
" ~/.vimrc

" ALE configuration
let g:ale_linters = {
\   'ruby': ['rubocop', 'ruby'],
\}

let g:ale_fixers = {
\   'ruby': ['rubocop'],
\}

let g:ale_fix_on_save = 1
let g:ale_ruby_rubocop_executable = 'bundle'

" Run Rubocop on save
autocmd BufWritePost *.rb silent! !bundle exec rubocop --auto-correct %
```

### 3. Snippets (UltiSnips)

**File:** `vim/ruby-campfire.snippets`

```vim
# Stabby lambda
snippet lam "Stabby lambda"
-> { ${1:body} }
endsnippet

snippet lamp "Stabby lambda with params"
->(${1:params}) { ${2:body} }
endsnippet

# Scope
snippet scope "ActiveRecord scope"
scope :${1:name}, -> { ${2:where(active: true)} }
endsnippet

# Before action
snippet before "before_action"
before_action :${1:method}, only: %i[ ${2:create update} ]
endsnippet

# Pluck
snippet pluck "ActiveRecord pluck"
${1:Model}.pluck(:${2:id})
endsnippet

# Exists
snippet exists "ActiveRecord exists?"
${1:Model}.where(${2:field}: ${3:value}).exists?
endsnippet

# Test
snippet test "Minitest test case"
test "${1:should do something}" do
  ${2:# test code}
end
endsnippet
```

---

## Universal EditorConfig

**File:** `.editorconfig`

Copy to your project root:

```ini
# Campfire Style - EditorConfig
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.rb]
indent_style = space
indent_size = 2

[*.erb]
indent_style = space
indent_size = 2

[*.yml]
indent_style = space
indent_size = 2

[*.js]
indent_style = space
indent_size = 2

[Gemfile]
indent_style = space
indent_size = 2

[Rakefile]
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false
```

---

## Quick Setup Script

```bash
#!/bin/bash
# setup-editor.sh - Quick setup for your editor

echo "🎨 Campfire Style - Editor Setup"
echo ""

# Detect editor
if command -v code &> /dev/null; then
  echo "📝 VS Code detected"
  mkdir -p .vscode
  cp editor-integration/vscode/*.json .vscode/
  echo "✅ VS Code configured"
fi

# EditorConfig (universal)
cp editor-integration/.editorconfig .
echo "✅ EditorConfig installed"

echo ""
echo "🎉 Editor setup complete!"
echo ""
echo "Next steps:"
echo "1. Restart your editor"
echo "2. Install recommended extensions"
echo "3. Start coding with snippets! Type 'lam' and press Tab"
```

---

## Snippet Cheat Sheet

### Quick Reference

| Trigger | Expands to | Description |
|---------|------------|-------------|
| `lam` | `-> { }` | Stabby lambda |
| `lamp` | `->(params) { }` | Lambda with params |
| `scope` | `scope :name, -> { }` | Model scope |
| `before` | `before_action :method` | Controller hook |
| `pluck` | `.pluck(:id)` | ActiveRecord pluck |
| `exists` | `.exists?` | Existence check |
| `timec` | `Time.current` | Current time |
| `pres` | `.presence \|\| default` | Presence pattern |
| `test` | `test "..." do` | Minitest test |
| `concern` | `module ... extend Concern` | Rails concern |

---

## Tips & Tricks

### VS Code

**1. Multi-cursor lambda replacement:**
```
1. Select "lambda"
2. Cmd+D to select next occurrence
3. Type "->" to replace all
```

**2. Format on save:**
Already configured! Just save and Rubocop fixes style.

**3. Run tests with shortcut:**
Press `Cmd+Shift+T` to run tests

### RubyMine

**1. Inline variable:**
`Cmd+Alt+N` to inline variable

**2. Extract method:**
Select code → `Cmd+Alt+M`

**3. Navigate to test:**
`Cmd+Shift+T` toggles between code and test

### Universal

**Use file watchers:** Auto-run Rubocop on every save

**Use snippets:** Type trigger + Tab for instant code

**Configure auto-format:** Let your editor handle style automatically

---

## Troubleshooting

### Rubocop not running

```bash
# Check if Rubocop is installed
bundle exec rubocop --version

# Install if missing
gem install rubocop rubocop-rails

# Add to Gemfile
gem 'rubocop', require: false
```

### Snippets not working

- **VS Code:** Check `.vscode/ruby-campfire.code-snippets` exists
- **RubyMine:** Verify template group is active
- **Sublime:** Restart Sublime Text after installing snippets

### Format on save not working

- **VS Code:** Check `editor.formatOnSave` is `true`
- **RubyMine:** Enable "Run Rubocop on save" in settings
- **Vim:** Verify ALE is installed and configured

---

## 🎉 Happy Coding!

With these editor integrations, writing Campfire-style code is faster and easier than ever!

**Remember:** Use snippets, enable auto-format, and let your editor do the work! 🚀
