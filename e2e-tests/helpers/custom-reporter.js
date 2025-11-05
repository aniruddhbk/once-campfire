/**
 * Custom Playwright Reporter for Campfire Tests
 *
 * This reporter provides enhanced output with:
 * - Colorful console output
 * - Performance metrics summary
 * - Test duration tracking
 * - Failure summaries
 * - Success rate calculation
 */

class CampfireReporter {
  constructor(options = {}) {
    this.options = options;
    this.results = {
      passed: [],
      failed: [],
      skipped: [],
      startTime: null,
      endTime: null,
      totalDuration: 0,
    };
  }

  // Called once before running tests
  onBegin(config, suite) {
    this.results.startTime = Date.now();
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║     🔥 CAMPFIRE PLAYWRIGHT TEST SUITE - ENHANCED      ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    console.log(`📋 Total tests: ${suite.allTests().length}`);
    console.log(`🔧 Workers: ${config.workers}`);
    console.log(`🌐 Base URL: ${config.use.baseURL}`);
    console.log('\n' + '─'.repeat(60) + '\n');
  }

  // Called after a test begins
  onTestBegin(test, result) {
    const testName = test.title;
    const suiteName = test.parent.title;

    console.log(`\n▶️  ${suiteName} > ${testName}`);
  }

  // Called after a test ends
  onTestEnd(test, result) {
    const testName = test.title;
    const duration = result.duration;
    const status = result.status;

    // Track results
    if (status === 'passed') {
      this.results.passed.push({ test: testName, duration });
      console.log(`   ✅ PASSED (${duration}ms)`);
    } else if (status === 'failed') {
      this.results.failed.push({ test: testName, duration, error: result.error });
      console.log(`   ❌ FAILED (${duration}ms)`);
      if (result.error) {
        console.log(`   📝 Error: ${result.error.message}`);
      }
    } else if (status === 'skipped') {
      this.results.skipped.push({ test: testName });
      console.log(`   ⏭️  SKIPPED`);
    }
  }

  // Called after all tests complete
  onEnd(result) {
    this.results.endTime = Date.now();
    this.results.totalDuration = this.results.endTime - this.results.startTime;

    console.log('\n\n' + '═'.repeat(60));
    console.log('🎯 TEST SUMMARY');
    console.log('═'.repeat(60) + '\n');

    // Overall statistics
    const total = this.results.passed.length + this.results.failed.length + this.results.skipped.length;
    const passRate = total > 0 ? ((this.results.passed.length / total) * 100).toFixed(2) : 0;

    console.log(`📊 Results:`);
    console.log(`   ✅ Passed:  ${this.results.passed.length}`);
    console.log(`   ❌ Failed:  ${this.results.failed.length}`);
    console.log(`   ⏭️  Skipped: ${this.results.skipped.length}`);
    console.log(`   📈 Pass Rate: ${passRate}%`);
    console.log(`   ⏱️  Total Duration: ${(this.results.totalDuration / 1000).toFixed(2)}s`);

    // Performance summary
    if (this.results.passed.length > 0) {
      const avgDuration = this.results.passed.reduce((sum, t) => sum + t.duration, 0) / this.results.passed.length;
      const slowest = this.results.passed.reduce((max, t) => t.duration > max.duration ? t : max);
      const fastest = this.results.passed.reduce((min, t) => t.duration < min.duration ? t : min);

      console.log('\n⚡ Performance Metrics:');
      console.log(`   Average test duration: ${avgDuration.toFixed(2)}ms`);
      console.log(`   Fastest test: ${fastest.test} (${fastest.duration}ms)`);
      console.log(`   Slowest test: ${slowest.test} (${slowest.duration}ms)`);
    }

    // Failed tests summary
    if (this.results.failed.length > 0) {
      console.log('\n\n🔍 FAILED TESTS:');
      console.log('─'.repeat(60));
      this.results.failed.forEach((failure, index) => {
        console.log(`\n${index + 1}. ${failure.test}`);
        if (failure.error) {
          console.log(`   Error: ${failure.error.message}`);
          if (failure.error.stack) {
            const stackLines = failure.error.stack.split('\n').slice(0, 3);
            stackLines.forEach(line => console.log(`   ${line.trim()}`));
          }
        }
      });
    }

    // Final status
    console.log('\n\n' + '═'.repeat(60));
    if (this.results.failed.length === 0) {
      console.log('🎉 ALL TESTS PASSED! 🎉');
    } else {
      console.log('⚠️  SOME TESTS FAILED');
    }
    console.log('═'.repeat(60) + '\n');

    // Additional info
    console.log('📁 Test artifacts:');
    console.log(`   - HTML Report: playwright-report/index.html`);
    console.log(`   - Test Results: test-results/`);
    console.log('\n💡 Tip: Run "npm run test:report" to view the HTML report\n');
  }

  // Called when a step begins (for debugging)
  onStepBegin(test, result, step) {
    if (this.options.verbose) {
      console.log(`     → ${step.title}`);
    }
  }

  // Called when a step ends (for debugging)
  onStepEnd(test, result, step) {
    if (this.options.verbose && step.error) {
      console.log(`     ✗ Step failed: ${step.title}`);
    }
  }
}

module.exports = CampfireReporter;
