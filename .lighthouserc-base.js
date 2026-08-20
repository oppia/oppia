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
 * @fileoverview Configuration for lighthouse-ci.
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

const basePerformanceAssertMatrix = {
  matchingUrlPattern: '.*',
  assertions: {
    // Performance category.
    'first-contentful-paint': ['warn', {maxNumericValue: 1230000}],
    'speed-index': ['warn', {maxNumericValue: 1230000}],
    'largest-contentful-paint': ['warn', {maxNumericValue: 2500000}],
    'total-blocking-time': ['warn', {maxNumericValue: 300}],
    'cumulative-layout-shift': ['warn', {maxNumericValue: 0.1}],
    'uses-optimized-images': ['error', {minScore: 1}],
    'uses-rel-preconnect': ['error', {minScore: 0.5}],
    'efficient-animated-content': ['error', {minScore: 1}],
    // offscreen-images is asserted per-page because the audit consistently
    // scores 0 in headless CI environments.
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

/**
 * Builds the assertion object for a single page, merging base performance
 * assertions with page-specific overrides.
 *
 * @param {Object} overrides - Page-specific audit overrides.
 * @param {number} accessibilityMinScore - Minimum accessibility score.
 * @returns {Object} The merged assertion object.
 */
function buildPageAssertions(overrides = {}, accessibilityMinScore = 1) {
  return {
    ...basePerformanceAssertions,
    'categories:accessibility': ['error', {minScore: accessibilityMinScore}],
    // TODO(#17560): Change the SEO category assertion from warn to error once
    // real CI runs confirm which pages score 1.0.
    'categories:seo': ['warn', {minScore: 1}],
    ...overrides,
  };
}

/**
 * Builds the full assert matrix by prepending the base performance catch-all
 * entry and then appending one entry per page.
 *
 * @param {Array} pageConfigs - Array of objects, each with:
 *   - matchingUrlPattern {string}: Regex pattern for the URL.
 *   - overrides {Object}: (optional) Page-specific audit overrides.
 *   - accessibilityMinScore {number}: (optional) Min accessibility score.
 * @returns {Array} The full LHCI assert matrix.
 */
function buildAssertMatrix(pageConfigs) {
  return [
    basePerformanceAssertMatrix,
    ...pageConfigs.map(
      ({matchingUrlPattern, overrides, accessibilityMinScore}) => ({
        matchingUrlPattern,
        assertions: buildPageAssertions(overrides, accessibilityMinScore),
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
  basePerformanceAssertMatrix,
  basePerformanceAssertions,
};
