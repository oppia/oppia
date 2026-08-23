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
  'modern-image-formats': ['error', {maxLength: 0, strategy: 'pessimistic'}],
  'uses-passive-event-listeners': ['error', {minScore: 1}],
  deprecations: ['error', {minScore: 1}],
  redirects: ['error', {minScore: 1}],
  'uses-responsive-images': ['error', {minScore: 0.8}],
  charset: ['warn', {minScore: 1}],
  viewport: ['warn', {minScore: 1}],
  'font-size': ['warn', {minScore: 1}],
  'image-size-responsive': ['warn', {minScore: 1}],
  'third-party-cookies': ['warn', {minScore: 1}],
  'inspector-issues': ['warn', {minScore: 1}],
  'redirects-http': ['warn', {minScore: 1}],
};

/**
 * Builds the catch-all assert matrix entry with performance metric thresholds.
 *
 * @param {Object} perfThresholds - Performance metric maxNumericValue thresholds
 *   in milliseconds (CLS is unitless).
 * @param {number} perfThresholds.fcp - First Contentful Paint.
 * @param {number} perfThresholds.speedIndex - Speed Index.
 * @param {number} perfThresholds.lcp - Largest Contentful Paint.
 * @param {number} perfThresholds.tbt - Total Blocking Time.
 * @param {number} perfThresholds.cls - Cumulative Layout Shift.
 * @returns {Object} The catch-all assert matrix entry.
 */
function buildPerformanceCatchAll(perfThresholds) {
  return {
    matchingUrlPattern: '.*',
    assertions: {
      // Performance metrics — error-level safety net. Per-page thresholds
      // override these at tighter values; these catch any unlisted page.
      'first-contentful-paint': [
        'error',
        {maxNumericValue: perfThresholds.fcp},
      ],
      'speed-index': ['error', {maxNumericValue: perfThresholds.speedIndex}],
      'largest-contentful-paint': [
        'error',
        {maxNumericValue: perfThresholds.lcp},
      ],
      'total-blocking-time': ['error', {maxNumericValue: perfThresholds.tbt}],
      'cumulative-layout-shift': [
        'error',
        {maxNumericValue: perfThresholds.cls},
      ],
      'uses-optimized-images': ['error', {minScore: 1}],
      'uses-rel-preconnect': ['error', {minScore: 0.5}],
      'efficient-animated-content': ['error', {minScore: 1}],
      'server-response-time': ['off', {}],
      // Best practices category.
      'no-document-write': ['error', {minScore: 1}],
      'geolocation-on-start': ['error', {minScore: 1}],
      doctype: ['error', {minScore: 1}],
      'notification-on-start': ['error', {minScore: 1}],
      'paste-preventing-inputs': ['error', {minScore: 1}],
      'image-aspect-ratio': ['error', {minScore: 1}],
      'is-on-https': ['off', {}],
      'uses-http2': ['off', {}],
    },
  };
}

/**
 * Builds the assertion object for a single page, merging base performance
 * assertions with page-specific overrides and per-page performance thresholds.
 *
 * @param {Object} overrides - Page-specific audit overrides.
 * @param {number} accessibilityMinScore - Minimum accessibility score.
 * @param {Object|null} pagePerfThresholds - Per-page performance metric
 *   thresholds (fcp, speedIndex, lcp, tbt, cls). When provided, these override
 *   the global catch-all thresholds for this page at error level.
 * @returns {Object} The merged assertion object.
 */
function buildPageAssertions(
  overrides = {},
  accessibilityMinScore = 1,
  pagePerfThresholds = null
) {
  const perfAssertions = pagePerfThresholds
    ? {
        'first-contentful-paint': [
          'error',
          {maxNumericValue: pagePerfThresholds.fcp},
        ],
        'speed-index': [
          'error',
          {maxNumericValue: pagePerfThresholds.speedIndex},
        ],
        'largest-contentful-paint': [
          'error',
          {maxNumericValue: pagePerfThresholds.lcp},
        ],
        'total-blocking-time': [
          'error',
          {maxNumericValue: pagePerfThresholds.tbt},
        ],
        'cumulative-layout-shift': [
          'error',
          {maxNumericValue: pagePerfThresholds.cls},
        ],
      }
    : {};
  return {
    ...basePerformanceAssertions,
    ...perfAssertions,
    'categories:accessibility': ['error', {minScore: accessibilityMinScore}],
    'categories:seo': ['warn', {minScore: 1}],
    ...overrides,
  };
}

/**
 * Builds the full assert matrix by prepending the performance catch-all
 * entry and then appending one entry per page.
 *
 * @param {Array} pageConfigs - Array of objects, each with:
 *   - matchingUrlPattern {string}: Regex pattern for the URL.
 *   - overrides {Object}: (optional) Page-specific audit overrides.
 *   - accessibilityMinScore {number}: (optional) Min accessibility score.
 *   - pagePerfThresholds {Object}: (optional) Per-page performance thresholds
 *     with keys fcp, speedIndex, lcp, tbt, cls. Overrides the global catch-all
 *     at error level for this specific page.
 * @param {Object} perfThresholds - Performance metric thresholds for the
 *   catch-all entry (fcp, speedIndex, lcp, tbt, cls).
 * @returns {Array} The full LHCI assert matrix.
 */
function buildAssertMatrix(pageConfigs, perfThresholds) {
  return [
    buildPerformanceCatchAll(perfThresholds),
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
