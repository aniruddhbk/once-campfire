/**
 * TEST ANALYTICS DASHBOARD
 *
 * Comprehensive test analytics and metrics tracking system.
 * Provides insights into test performance, reliability, and trends.
 *
 * Features:
 * - Test execution statistics
 * - Performance metrics tracking
 * - Failure analysis
 * - Trend reporting
 * - CI/CD integration metrics
 * - Test reliability scores
 * - Flakiness detection
 */

const fs = require('fs');
const path = require('path');

class TestAnalytics {
  constructor() {
    this.analyticsDir = path.join(process.cwd(), 'test-analytics');
    this.ensureAnalyticsDirectory();

    this.currentRun = {
      startTime: Date.now(),
      endTime: null,
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        flaky: 0
      },
      performance: {
        totalDuration: 0,
        averageDuration: 0,
        fastestTest: null,
        slowestTest: null
      },
      environment: {
        ci: process.env.CI || false,
        node: process.version,
        playwright: this.getPlaywrightVersion(),
        os: process.platform,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Ensure analytics directory exists
   */
  ensureAnalyticsDirectory() {
    if (!fs.existsSync(this.analyticsDir)) {
      fs.mkdirSync(this.analyticsDir, { recursive: true });
    }
  }

  /**
   * Get Playwright version
   */
  getPlaywrightVersion() {
    try {
      const packageJson = require('@playwright/test/package.json');
      return packageJson.version;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Record test result
   */
  recordTest(testName, result, duration, metadata = {}) {
    const testRecord = {
      name: testName,
      result, // 'passed', 'failed', 'skipped'
      duration,
      timestamp: Date.now(),
      ...metadata
    };

    this.currentRun.tests.push(testRecord);

    // Update summary
    this.currentRun.summary.total++;
    this.currentRun.summary[result]++;

    // Update performance metrics
    this.updatePerformanceMetrics(testRecord);
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(testRecord) {
    const { duration, name } = testRecord;

    this.currentRun.performance.totalDuration += duration;

    // Fastest test
    if (!this.currentRun.performance.fastestTest ||
        duration < this.currentRun.performance.fastestTest.duration) {
      this.currentRun.performance.fastestTest = { name, duration };
    }

    // Slowest test
    if (!this.currentRun.performance.slowestTest ||
        duration > this.currentRun.performance.slowestTest.duration) {
      this.currentRun.performance.slowestTest = { name, duration };
    }

    // Average duration
    this.currentRun.performance.averageDuration =
      this.currentRun.performance.totalDuration / this.currentRun.tests.length;
  }

  /**
   * Complete test run
   */
  completeRun() {
    this.currentRun.endTime = Date.now();
    this.currentRun.totalDuration = this.currentRun.endTime - this.currentRun.startTime;

    // Save run data
    const runId = `run-${Date.now()}`;
    const runFile = path.join(this.analyticsDir, `${runId}.json`);
    fs.writeFileSync(runFile, JSON.stringify(this.currentRun, null, 2));

    // Update historical data
    this.updateHistoricalData();

    // Generate report
    this.generateHTMLReport();

    return runId;
  }

  /**
   * Update historical analytics data
   */
  updateHistoricalData() {
    const historicalFile = path.join(this.analyticsDir, 'historical.json');
    let historical = { runs: [] };

    if (fs.existsSync(historicalFile)) {
      historical = JSON.parse(fs.readFileSync(historicalFile, 'utf8'));
    }

    historical.runs.push({
      timestamp: this.currentRun.environment.timestamp,
      summary: this.currentRun.summary,
      performance: this.currentRun.performance,
      duration: this.currentRun.totalDuration
    });

    // Keep only last 100 runs
    if (historical.runs.length > 100) {
      historical.runs = historical.runs.slice(-100);
    }

    fs.writeFileSync(historicalFile, JSON.stringify(historical, null, 2));
  }

  /**
   * Detect flaky tests
   */
  detectFlakyTests() {
    const historicalFile = path.join(this.analyticsDir, 'historical.json');
    if (!fs.existsSync(historicalFile)) {
      return [];
    }

    const historical = JSON.parse(fs.readFileSync(historicalFile, 'utf8'));
    const testResults = {};

    // Collect all test results
    historical.runs.forEach(run => {
      if (run.tests) {
        run.tests.forEach(test => {
          if (!testResults[test.name]) {
            testResults[test.name] = { passes: 0, fails: 0, total: 0 };
          }
          testResults[test.name].total++;
          if (test.result === 'passed') {
            testResults[test.name].passes++;
          } else if (test.result === 'failed') {
            testResults[test.name].fails++;
          }
        });
      }
    });

    // Find flaky tests (tests that sometimes pass, sometimes fail)
    const flakyTests = [];
    Object.entries(testResults).forEach(([name, results]) => {
      if (results.fails > 0 && results.passes > 0) {
        const flakinessScore = results.fails / results.total;
        if (flakinessScore > 0.1) { // More than 10% failure rate
          flakyTests.push({
            name,
            flakinessScore: (flakinessScore * 100).toFixed(2),
            passes: results.passes,
            fails: results.fails,
            total: results.total
          });
        }
      }
    });

    return flakyTests.sort((a, b) => b.flakinessScore - a.flakinessScore);
  }

  /**
   * Calculate test reliability score
   */
  calculateReliabilityScore() {
    const historicalFile = path.join(this.analyticsDir, 'historical.json');
    if (!fs.existsSync(historicalFile)) {
      return 100;
    }

    const historical = JSON.parse(fs.readFileSync(historicalFile, 'utf8'));
    const recentRuns = historical.runs.slice(-20); // Last 20 runs

    let totalTests = 0;
    let totalPassed = 0;

    recentRuns.forEach(run => {
      totalTests += run.summary.total;
      totalPassed += run.summary.passed;
    });

    return totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : 100;
  }

  /**
   * Get performance trends
   */
  getPerformanceTrends() {
    const historicalFile = path.join(this.analyticsDir, 'historical.json');
    if (!fs.existsSync(historicalFile)) {
      return null;
    }

    const historical = JSON.parse(fs.readFileSync(historicalFile, 'utf8'));
    const recentRuns = historical.runs.slice(-10);

    return {
      averageDuration: recentRuns.map(r => r.performance.averageDuration),
      totalDuration: recentRuns.map(r => r.duration),
      timestamps: recentRuns.map(r => r.timestamp)
    };
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport() {
    const flakyTests = this.detectFlakyTests();
    const reliabilityScore = this.calculateReliabilityScore();
    const trends = this.getPerformanceTrends();

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Analytics Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      color: #333;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    h1 {
      color: #667eea;
      margin-bottom: 30px;
      font-size: 2.5em;
      text-align: center;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .card {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .card h2 {
      font-size: 1.2em;
      margin-bottom: 10px;
      color: #667eea;
    }
    .metric {
      font-size: 2.5em;
      font-weight: bold;
      color: #333;
    }
    .success { color: #10b981; }
    .error { color: #ef4444; }
    .warning { color: #f59e0b; }
    .info { color: #3b82f6; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #667eea;
      color: white;
      font-weight: 600;
    }
    tr:hover {
      background: #f9fafb;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.875em;
      font-weight: 600;
    }
    .badge-success {
      background: #10b981;
      color: white;
    }
    .badge-error {
      background: #ef4444;
      color: white;
    }
    .badge-warning {
      background: #f59e0b;
      color: white;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      color: #6b7280;
      font-size: 0.875em;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧪 Test Analytics Dashboard</h1>

    <div class="grid">
      <div class="card">
        <h2>Total Tests</h2>
        <div class="metric info">${this.currentRun.summary.total}</div>
      </div>
      <div class="card">
        <h2>Passed</h2>
        <div class="metric success">${this.currentRun.summary.passed}</div>
      </div>
      <div class="card">
        <h2>Failed</h2>
        <div class="metric error">${this.currentRun.summary.failed}</div>
      </div>
      <div class="card">
        <h2>Pass Rate</h2>
        <div class="metric ${this.currentRun.summary.total > 0 ? (this.currentRun.summary.passed / this.currentRun.summary.total * 100 >= 90 ? 'success' : 'warning') : 'info'}">
          ${this.currentRun.summary.total > 0 ? ((this.currentRun.summary.passed / this.currentRun.summary.total * 100).toFixed(1)) : 0}%
        </div>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <h2>Total Duration</h2>
        <div class="metric">${(this.currentRun.totalDuration / 1000).toFixed(2)}s</div>
      </div>
      <div class="card">
        <h2>Average Duration</h2>
        <div class="metric">${(this.currentRun.performance.averageDuration).toFixed(2)}ms</div>
      </div>
      <div class="card">
        <h2>Reliability Score</h2>
        <div class="metric success">${reliabilityScore}%</div>
      </div>
      <div class="card">
        <h2>Flaky Tests</h2>
        <div class="metric ${flakyTests.length === 0 ? 'success' : 'error'}">${flakyTests.length}</div>
      </div>
    </div>

    ${flakyTests.length > 0 ? `
      <h2 style="margin: 30px 0 15px; color: #ef4444;">⚠️ Flaky Tests Detected</h2>
      <table>
        <thead>
          <tr>
            <th>Test Name</th>
            <th>Flakiness Score</th>
            <th>Passes</th>
            <th>Fails</th>
            <th>Total Runs</th>
          </tr>
        </thead>
        <tbody>
          ${flakyTests.map(test => `
            <tr>
              <td>${test.name}</td>
              <td><span class="badge badge-error">${test.flakinessScore}%</span></td>
              <td>${test.passes}</td>
              <td>${test.fails}</td>
              <td>${test.total}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : ''}

    <h2 style="margin: 30px 0 15px; color: #667eea;">📊 Performance Metrics</h2>
    <table>
      <thead>
        <tr>
          <th>Metric</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Fastest Test</td>
          <td>${this.currentRun.performance.fastestTest?.name || 'N/A'} (${this.currentRun.performance.fastestTest?.duration || 0}ms)</td>
        </tr>
        <tr>
          <td>Slowest Test</td>
          <td>${this.currentRun.performance.slowestTest?.name || 'N/A'} (${this.currentRun.performance.slowestTest?.duration || 0}ms)</td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <p>Generated on ${new Date().toLocaleString()}</p>
      <p>Environment: ${this.currentRun.environment.ci ? 'CI' : 'Local'} | Node ${this.currentRun.environment.node} | Playwright ${this.currentRun.environment.playwright}</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const reportFile = path.join(this.analyticsDir, 'dashboard.html');
    fs.writeFileSync(reportFile, html);

    console.log(`\n📊 Analytics dashboard generated: ${reportFile}`);
  }
}

// Export singleton instance
const analytics = new TestAnalytics();

module.exports = {
  TestAnalytics,
  analytics
};
