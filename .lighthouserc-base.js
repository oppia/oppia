// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Shared configuration and helpers for lighthouse-ci.
 */

const dotenv = require('dotenv');

dotenv.config({path: './core/tests/puppeteer/.env'});
const ALL_LIGHTHOUSE_URLS = process.env.ALL_LIGHTHOUSE_URLS.split(',');
const LIGHTHOUSE_URLS_TO_RUN = process.env.LIGHTHOUSE_URLS_TO_RUN
  ? process.env.LIGHTHOUSE_URLS_TO_RUN.split(',')
  : ALL_LIGHTHOUSE_URLS;

const basePerformanceAssertions = {
  'errors-in-console': ['error', {minScore: 1}],
  'uses-optimized-images': ['error', {minScore: 1}],
  'modern-image-formats': ['error', {maxLength: 0, strategy: 'pessimistic'}],
  'uses-passive-event-listeners': ['error', {minScore: 1}],
  deprecations: ['error', {minScore: 1}],
  redirects: ['error', {minScore: 1}],
  'uses-responsive-images': ['error', {minScore: 0.8}],
  charset: ['error', {minScore: 1}],
  viewport: ['error', {minScore: 1}],
  'font-size': ['error', {minScore: 0}],
  'image-size-responsive': ['error', {minScore: 0}],
  'third-party-cookies': ['error', {minScore: 1}],
  'inspector-issues': ['error', {minScore: 1}],
  'redirects-http': ['error', {minScore: 1}],
};

// The performance thresholds every page is expected to meet by default. These
// reflect the Core Web Vitals "good" thresholds (FCP 1.8s, LCP 2.5s, CLS 0.1)
// together with Lighthouse's good cutoffs for speed index and total blocking
// time. Pages that cannot yet meet the baseline specify pagePerfThresholds
// overrides; each override is a known failure case to be removed as the page
// improves.
const IDEAL_BASELINE_THRESHOLDS = {
  fcp: 1800,
  speedIndex: 3400,
  lcp: 2500,
  tbt: 200,
  cls: 0.1,
};

/**
 * Builds the catch-all assert matrix entry for non-performance audits.
 *
 * Performance metrics are intentionally not included here. LHCI evaluates every
 * matching assertMatrix entry for a given URL (see buildAssertMatrix), so any
 * catch-all performance threshold would also bind to every listed page and
 * defeat per-page overrides. The uniform ideal baseline is instead applied
 * inside buildPageAssertions, and per-page thresholds replace it for pages that
 * cannot yet meet it.
 *
 * @returns {Object} The catch-all assert matrix entry.
 */
function buildAuditCatchAll() {
  return {
    matchingUrlPattern: '.*',
    assertions: {
      'uses-rel-preconnect': ['error', {minScore: 0.5}],
      'efficient-animated-content': ['error', {minScore: 1}],
      'server-response-time': ['off', {}],
      // Best practices category.
      'no-document-write': ['error', {minScore: 1}],
      'geolocation-on-start': ['error', {minScore: 1}],
      doctype: ['error', {minScore: 1}],
      'notification-on-start': ['error', {minScore: 1}],
      'paste-preventing-inputs': ['error', {minScore: 1}],
      'image-aspect-ratio': ['error', {minScore: 0}],
      'is-on-https': ['off', {}],
      'uses-http2': ['off', {}],
    },
  };
}

/**
 * Builds the assertion object for a single page, merging base performance
 * assertions with page-specific overrides and performance thresholds.
 *
 * Every page is held to IDEAL_BASELINE_THRESHOLDS by default. A page that
 * cannot yet meet the ideal baseline specifies pagePerfThresholds, which
 * replace the ideal values for that page and represent a known failure case
 * to be fixed.
 *
 * @param {Object} overrides - Page-specific audit overrides.
 * @param {number} accessibilityMinScore - Minimum accessibility score.
 * @param {Object|null} pagePerfThresholds - Per-page performance metric
 *   thresholds (fcp, speedIndex, lcp, tbt, cls). When provided, these replace
 *   IDEAL_BASELINE_THRESHOLDS for this page at error level.
 * @returns {Object} The merged assertion object.
 */
function buildPageAssertions(
  overrides = {},
  accessibilityMinScore = 1,
  pagePerfThresholds = null
) {
  const perfThresholds = pagePerfThresholds || IDEAL_BASELINE_THRESHOLDS;
  const perfAssertions = {
    'first-contentful-paint': ['error', {maxNumericValue: perfThresholds.fcp}],
    'speed-index': ['error', {maxNumericValue: perfThresholds.speedIndex}],
    'largest-contentful-paint': [
      'error',
      {maxNumericValue: perfThresholds.lcp},
    ],
    'total-blocking-time': ['error', {maxNumericValue: perfThresholds.tbt}],
    'cumulative-layout-shift': ['error', {maxNumericValue: perfThresholds.cls}],
  };
  return {
    ...basePerformanceAssertions,
    ...perfAssertions,
    'categories:accessibility': ['error', {minScore: accessibilityMinScore}],
    'categories:seo': ['error', {minScore: 0.7}],
    ...overrides,
  };
}

/**
 * Builds the full assert matrix by prepending the audit catch-all entry and
 * then appending one entry per page.
 *
 * @param {Array} pageConfigs - Array of objects, each with:
 *   - matchingUrlPattern {string}: Regex pattern for the URL.
 *   - overrides {Object}: (optional) Page-specific audit overrides.
 *   - accessibilityMinScore {number}: (optional) Min accessibility score.
 *   - pagePerfThresholds {Object}: (optional) Per-page performance thresholds
 *     with keys fcp, speedIndex, lcp, tbt, cls. Replaces
 *     IDEAL_BASELINE_THRESHOLDS at error level for this specific page.
 * @returns {Array} The full LHCI assert matrix.
 */
function buildAssertMatrix(pageConfigs) {
  // LHCI evaluates every matching assertMatrix entry for a given URL; there is
  // no first-match-wins behavior (see getAllAssertionResults in
  // node_modules/@lhci/utils/src/assertions.js, which iterates all entries per
  // URL group). The audit catch-all '.*' entry is therefore a safety net for
  // any unlisted page, while each page entry applies the ideal performance
  // baseline, or a tighter/looser per-page override. Ordering is cosmetic.
  return [
    buildAuditCatchAll(),
    ...pageConfigs.map(
      ({
        matchingUrlPattern,
        overrides,
        accessibilityMinScore,
        pagePerfThresholds,
      }) => ({
        matchingUrlPattern,
        assertions: buildPageAssertions(
          overrides,
          accessibilityMinScore,
          pagePerfThresholds
        ),
      })
    ),
  ];
}

module.exports = {
  buildPageAssertions,
  buildAssertMatrix,
  numberOfRuns: 3,
  puppeteerScript: 'puppeteer-login-script.js',
  // CI-stability flags for the Chrome instance managed by the puppeteerScript.
  // These match the flags already used by Karma in core/tests/karma.conf.ts.
  puppeteerLaunchOptions: {
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  },
  urls: LIGHTHOUSE_URLS_TO_RUN,
  basePerformanceAssertions,
};
