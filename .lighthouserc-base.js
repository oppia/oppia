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

module.exports = {
  numberOfRuns: 3,
  puppeteerScript: 'puppeteer-login-script.js',
  urls: LIGHTHOUSE_URLS_TO_RUN,
  basePerformanceAssertMatrix: {
    matchingUrlPattern: '.*',
    assertions: {
      // Performance category.
      'first-contentful-paint': ['warn', {maxNumericValue: 1230000}],
      'first-meaningful-paint': ['warn', {maxNumericValue: 1280000}],
      'speed-index': ['warn', {maxNumericValue: 1230000}],
      interactive: ['warn', {maxNumericValue: 1540000}],
      'max-potential-fid': ['warn', {maxNumericValue: 130000}],
      'uses-optimized-images': ['error', {minScore: 1}],
      'uses-rel-preconnect': ['error', {minScore: 0.5}],
      'efficient-animated-content': ['error', {minScore: 1}],
      'offscreen-images': ['error', {minScore: 0.45}],
      'time-to-first-byte': ['off', {}],
      // Best practices category.
      'no-document-write': ['error', {minScore: 1}],
      'geolocation-on-start': ['error', {minScore: 1}],
      doctype: ['error', {minScore: 1}],
      'no-vulnerable-libraries': ['off', {minScore: 1}],
      'notification-on-start': ['error', {minScore: 1}],
      'password-inputs-can-be-pasted-into': ['error', {minScore: 1}],
      'image-aspect-ratio': ['error', {minScore: 1}],
      'is-on-https': ['off', {}],
      'uses-http2': ['off', {}],
    },
  },
  basePerformanceAssertions: {
    'errors-in-console': ['error', {minScore: 1}],
    'modern-image-formats': ['error', {maxLength: 0, strategy: 'pessimistic'}],
    'uses-passive-event-listeners': ['error', {minScore: 1}],
    'uses-rel-preload': ['error', {minScore: 1}],
    deprecations: ['error', {minScore: 1}],
    redirects: ['error', {minScore: 1}],
    'uses-responsive-images': ['error', {minScore: 0.8}],
  },
  baseAccessibilityAssertions: {
    'categories:accessibility': ['error', {minScore: 1}],
  },
};
