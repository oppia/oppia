// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Custom Playwright reporter for acceptance tests.
 */

import type {
  Reporter,
  TestCase,
  TestResult,
  FullResult,
} from '@playwright/test/reporter';

export default class CompactReporter implements Reporter {
  private passed = 0;
  private failed = 0;
  private skipped = 0;
  private lastSuiteTitle: string | null = null;

  onStdOut(chunk: string | Buffer): void {
    process.stdout.write(chunk);
  }

  onStdErr(chunk: string | Buffer): void {
    process.stderr.write(chunk);
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const suiteTitle = test.parent.title;
    if (suiteTitle !== this.lastSuiteTitle) {
      // eslint-disable-next-line no-console
      console.log(`\n  ${suiteTitle}`);
      this.lastSuiteTitle = suiteTitle;
    }

    const location = `${test.location.file}:${test.location.line}:${test.location.column}`;

    if (result.status === 'passed') {
      this.passed++;
      // eslint-disable-next-line no-console
      console.log(`    ✓ ${test.title} (${result.duration}ms)`);
    } else if (result.status === 'skipped') {
      this.skipped++;
      // eslint-disable-next-line no-console
      console.log(`    - ${test.title} (skipped)`);
    } else {
      this.failed++;
      // eslint-disable-next-line no-console
      console.log(`    ✗ ${test.title} (${result.duration}ms)`);
      // eslint-disable-next-line no-console
      console.log(`\n  ${suiteTitle} › ${test.title}\n  ${location}\n`);
      if (result.error?.snippet) {
        // eslint-disable-next-line no-console
        console.log(`${result.error.snippet}`);
      }
      if (result.error?.stack) {
        // eslint-disable-next-line no-console
        console.log(`\n${result.error.stack}`);
      }

      const runningInCI = !!process.env.CI;
      if (runningInCI) {
        // eslint-disable-next-line no-console
        console.log(
          '\nDownload the Playwright test results artifact for this job (find it under ' +
            '"Summary" > "Artifacts" on the GitHub Actions run) to view screenshots, diffs, ' +
            'and recordings, or drag trace.zip into https://trace.playwright.dev for the full ' +
            'recorded trace.\n'
        );
      } else {
        // eslint-disable-next-line no-console
        console.log(
          '\nSee oppia_full_stack_test_playwright_results for screenshots, diffs, and ' +
            'recordings, or drag trace.zip into https://trace.playwright.dev for the full ' +
            'recorded trace.\n'
        );
      }
    }
  }

  onEnd(result: FullResult): void {
    // eslint-disable-next-line no-console
    console.log(
      `\n${this.passed} passed, ${this.failed} failed, ${this.skipped} skipped\n`
    );
  }
}
