#!/usr/bin/env ruby
# style-analyzer.rb - Measure your code against Campfire style patterns
# Usage: ./style-analyzer.rb [path]

require 'json'
require 'fileutils'

class CampfireStyleAnalyzer
  VERSION = "1.0.0"

  PATTERNS = {
    stabby_lambda: {
      name: "Stabby Lambda Syntax",
      good: '->',
      bad: 'lambda ',
      description: "Use -> instead of lambda keyword",
      category: "syntax",
      impact: "high",
      auto_fix: true
    },
    modern_hash: {
      name: "Modern Hash Syntax",
      good: '\w+:\s',
      bad: ':\w+\s*=>',
      description: "Use key: value instead of :key => value",
      category: "syntax",
      impact: "high",
      auto_fix: true
    },
    symbol_array: {
      name: "Symbol Array (%i[])",
      good: '%i\[',
      bad: '\[\s*:\w+\s*,',
      description: "Use %i[] for symbol arrays",
      category: "syntax",
      impact: "medium",
      auto_fix: true
    },
    time_current: {
      name: "Time.current vs Time.now",
      good: 'Time\.current',
      bad: 'Time\.now',
      description: "Use Time.current for timezone safety",
      category: "rails",
      impact: "critical",
      auto_fix: true
    },
    pluck_usage: {
      name: ".pluck for attributes",
      good: '\.pluck\(',
      bad: '\.map\(&:\w+\)',
      description: "Use .pluck instead of .map for attributes",
      category: "performance",
      impact: "high",
      auto_fix: false
    },
    exists_check: {
      name: ".exists? for presence",
      good: '\.exists\?',
      bad: '\.where\(.*\)\.present\?',
      description: "Use .exists? instead of .present? for AR queries",
      category: "performance",
      impact: "high",
      auto_fix: false
    },
    find_each: {
      name: ".find_each for large collections",
      good: '\.find_each',
      bad: '\.all\.each',
      description: "Use .find_each for batched processing",
      category: "performance",
      impact: "critical",
      auto_fix: false
    },
    string_interpolation: {
      name: "String interpolation",
      good: '#\{',
      bad: '"\s*\+\s*',
      description: "Use interpolation instead of concatenation",
      category: "syntax",
      impact: "low",
      auto_fix: false
    }
  }

  def initialize(path = 'app')
    @path = path
    @results = {}
    @files_scanned = 0
    @violations = []
    @summary = {
      total_files: 0,
      total_lines: 0,
      violations_by_category: {},
      compliance_by_pattern: {},
      overall_score: 0
    }
  end

  def analyze
    print_header
    scan_files
    calculate_scores
    print_results
    generate_report
    print_recommendations
  end

  private

  def print_header
    puts "=" * 80
    puts "🔍 Campfire Style Analyzer v#{VERSION}"
    puts "=" * 80
    puts "Analyzing: #{@path}"
    puts "Started: #{Time.now}"
    puts "=" * 80
    puts ""
  end

  def scan_files
    puts "📂 Scanning Ruby files..."

    ruby_files = Dir.glob("#{@path}/**/*.rb")
    @summary[:total_files] = ruby_files.size

    puts "Found #{ruby_files.size} Ruby files\n\n"

    ruby_files.each_with_index do |file, index|
      print "\rProgress: #{index + 1}/#{ruby_files.size} files"
      scan_file(file)
    end

    print "\r" + " " * 50 + "\r"
    puts "✅ Scan complete!\n\n"
  end

  def scan_file(file_path)
    return unless File.exist?(file_path)

    begin
      content = File.read(file_path, encoding: 'UTF-8')
    rescue Encoding::InvalidByteSequenceError, Encoding::UndefinedConversionError
      # Try with binary encoding if UTF-8 fails
      content = File.read(file_path, encoding: 'BINARY').force_encoding('UTF-8')
      content = content.encode('UTF-8', invalid: :replace, undef: :replace, replace: '')
    end

    lines = content.lines
    @summary[:total_lines] += lines.size
    @files_scanned += 1

    PATTERNS.each do |pattern_key, pattern|
      begin
        good_count = content.scan(/#{pattern[:good]}/).size
        bad_count = content.scan(/#{pattern[:bad]}/).size
      rescue RegexpError => e
        # Skip patterns that cause regex errors
        good_count = 0
        bad_count = 0
      end

      @results[pattern_key] ||= { good: 0, bad: 0, files: [] }
      @results[pattern_key][:good] += good_count
      @results[pattern_key][:bad] += bad_count

      if bad_count > 0
        @results[pattern_key][:files] << file_path
        @violations << {
          file: file_path,
          pattern: pattern_key,
          count: bad_count,
          severity: pattern[:impact]
        }
      end
    end
  end

  def calculate_scores
    PATTERNS.each do |pattern_key, pattern|
      result = @results[pattern_key] || { good: 0, bad: 0 }
      total = result[:good] + result[:bad]

      compliance = total > 0 ? (result[:good].to_f / total * 100).round(1) : 100.0

      @summary[:compliance_by_pattern][pattern_key] = {
        name: pattern[:name],
        good: result[:good],
        bad: result[:bad],
        compliance: compliance,
        category: pattern[:category],
        impact: pattern[:impact],
        auto_fix: pattern[:auto_fix]
      }

      # Track by category
      category = pattern[:category]
      @summary[:violations_by_category][category] ||= 0
      @summary[:violations_by_category][category] += result[:bad]
    end

    # Calculate overall score
    compliances = @summary[:compliance_by_pattern].values.map { |p| p[:compliance] }
    @summary[:overall_score] = (compliances.sum / compliances.size).round(1)
  end

  def print_results
    puts "📊 ANALYSIS RESULTS"
    puts "=" * 80
    puts ""

    # Overall summary
    puts "📈 Overall Statistics:"
    puts "  Files scanned:    #{@summary[:total_files]}"
    puts "  Lines of code:    #{@summary[:total_lines]}"
    puts "  Violations found: #{@violations.size}"
    puts ""

    # Pattern-by-pattern results
    puts "🔍 Pattern Compliance:"
    puts ""

    @summary[:compliance_by_pattern].each do |pattern_key, data|
      status = compliance_status(data[:compliance])
      auto_fix_indicator = data[:auto_fix] ? " 🔧" : ""

      puts "  #{status} #{data[:name]}#{auto_fix_indicator}"
      puts "     ✅ Good: #{data[:good]}"
      puts "     ❌ Bad:  #{data[:bad]}"
      puts "     📊 Compliance: #{data[:compliance]}%"
      puts "     🎯 Impact: #{data[:impact]}"
      puts ""
    end

    # Overall score
    grade = overall_grade(@summary[:overall_score])
    puts "=" * 80
    puts "🎯 OVERALL COMPLIANCE: #{@summary[:overall_score]}% - Grade: #{grade}"
    puts "=" * 80
    puts ""
  end

  def print_recommendations
    puts "💡 RECOMMENDATIONS"
    puts "=" * 80
    puts ""

    # Critical violations first
    critical = @violations.select { |v| v[:severity] == 'critical' }
    if critical.any?
      puts "🚨 CRITICAL (Fix immediately):"
      critical.group_by { |v| v[:pattern] }.each do |pattern, viols|
        pattern_name = PATTERNS[pattern][:name]
        file_count = viols.map { |v| v[:file] }.uniq.size
        puts "  • #{pattern_name}: #{file_count} files"
      end
      puts ""
    end

    # High impact
    high = @violations.select { |v| v[:severity] == 'high' }
    if high.any?
      puts "⚠️  HIGH PRIORITY (Fix soon):"
      high.group_by { |v| v[:pattern] }.each do |pattern, viols|
        pattern_name = PATTERNS[pattern][:name]
        file_count = viols.map { |v| v[:file] }.uniq.size
        auto_fix = PATTERNS[pattern][:auto_fix] ? " (auto-fixable)" : ""
        puts "  • #{pattern_name}: #{file_count} files#{auto_fix}"
      end
      puts ""
    end

    # Auto-fixable patterns
    auto_fixable = @violations.select { |v| PATTERNS[v[:pattern]][:auto_fix] }
    if auto_fixable.any?
      puts "🔧 AUTO-FIXABLE:"
      puts "  Run these commands to auto-fix:"
      puts ""

      auto_fixable.group_by { |v| v[:pattern] }.each do |pattern, _|
        pattern_name = PATTERNS[pattern][:name]
        case pattern
        when :stabby_lambda
          puts "  • #{pattern_name}:"
          puts "    rubocop --only Style/Lambda --auto-correct"
        when :modern_hash
          puts "  • #{pattern_name}:"
          puts "    rubocop --only Style/HashSyntax --auto-correct"
        when :time_current
          puts "  • #{pattern_name}:"
          puts "    ruby -i -pe 's/Time\\.now/Time.current/g' #{@path}/**/*.rb"
        end
      end
      puts ""
    end

    # Next steps
    puts "📚 NEXT STEPS:"
    if @summary[:overall_score] >= 90
      puts "  ✅ Excellent compliance! Keep it up!"
      puts "  • Review EXTENDED-PATTERNS.md for advanced patterns"
      puts "  • Set up automation: cd automation-toolkit && ./install-all.sh"
    elsif @summary[:overall_score] >= 75
      puts "  ✅ Good compliance!"
      puts "  • Fix remaining violations using REFACTORING-PLAYBOOK.md"
      puts "  • Focus on high-impact patterns first"
    else
      puts "  ⚠️  Needs improvement"
      puts "  • Start with QUICK-REFERENCE.md for top 10 patterns"
      puts "  • Follow TRAINING-PROGRAM.md Week 1-2"
      puts "  • Use automation tools to catch violations early"
    end

    puts ""
    puts "📖 Documentation:"
    puts "  • REFACTORING-PLAYBOOK.md  - How to fix violations"
    puts "  • PERFORMANCE-BENCHMARKS.md - Why patterns matter"
    puts "  • TRAINING-PROGRAM.md      - Progressive learning path"
    puts ""
  end

  def generate_report
    report = {
      version: VERSION,
      timestamp: Time.now.strftime('%Y-%m-%dT%H:%M:%S%z'),
      analyzed_path: @path,
      summary: @summary,
      violations: @violations.map { |v|
        {
          file: v[:file],
          pattern: PATTERNS[v[:pattern]][:name],
          severity: v[:severity],
          count: v[:count]
        }
      }
    }

    filename = "style-analysis-report.json"
    File.write(filename, JSON.pretty_generate(report))

    puts "💾 Report saved: #{filename}"
    puts ""
  end

  def compliance_status(compliance)
    case compliance
    when 100 then "✅"
    when 90..99 then "🟢"
    when 75..89 then "🟡"
    when 50..74 then "🟠"
    else "🔴"
    end
  end

  def overall_grade(score)
    case score
    when 95..100 then "A+ 🌟"
    when 90..94 then "A"
    when 85..89 then "B+"
    when 80..84 then "B"
    when 75..79 then "C+"
    when 70..74 then "C"
    when 60..69 then "D"
    else "F"
    end
  end
end

# CLI
if __FILE__ == $0
  path = ARGV[0] || 'app'

  unless Dir.exist?(path)
    puts "❌ Error: Directory '#{path}' not found"
    puts ""
    puts "Usage: #{$0} [path]"
    puts "Example: #{$0} app"
    exit 1
  end

  analyzer = CampfireStyleAnalyzer.new(path)
  analyzer.analyze
end
