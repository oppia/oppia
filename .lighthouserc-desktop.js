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
 * @fileoverview Configuration for lighthouse-ci desktop runs.
 *
 * This config runs the same pages as .lighthouserc.js but with desktop
 * emulation and its own assertion thresholds. The assertion matrix is defined
 * independently so that desktop thresholds can diverge from mobile over time.
 */

const baseConfig = require('./.lighthouserc-base.js');

// Desktop emulation metrics, matching the desktop preset in Lighthouse
// (see node_modules/lighthouse/core/config/constants.js).
const DESKTOP_SCREEN_EMULATION = {
  mobile: false,
  width: 1350,
  height: 940,
  deviceScaleFactor: 1,
  disabled: false,
};

// Throttling for a dense 4G desktop connection, matching the desktopDense4G
// constants in Lighthouse's lantern simulation. The request latency and
// throughput values are set to 0 (meaning unset) so that Lantern derives them
// from rttMs and throughputKbps; otherwise the mobile defaults would persist
// through the settings merge.
const DESKTOP_THROTTLING = {
  rttMs: 40,
  throughputKbps: 10240,
  cpuSlowdownMultiplier: 1,
  requestLatencyMs: 0,
  downloadThroughputKbps: 0,
  uploadThroughputKbps: 0,
};

module.exports = {
  ci: {
    collect: {
      numberOfRuns: baseConfig['numberOfRuns'],
      puppeteerScript: baseConfig['puppeteerScript'],
      url: baseConfig['urls'],
      settings: {
        formFactor: 'desktop',
        screenEmulation: DESKTOP_SCREEN_EMULATION,
        throttling: DESKTOP_THROTTLING,
        // Set to true so that Lighthouse uses the user agent associated with
        // the desktop form factor.
        emulatedUserAgent: true,
        onlyCategories: [
          'performance',
          'accessibility',
          'best-practices',
          'seo',
        ],
      },
    },
    assert: {
      assertMatrix: baseConfig.buildAssertMatrix(
        [
          {
            matchingUrlPattern: 'http://[^/]+/$',
            pagePerfThresholds: {
              fcp: 3045,
              speedIndex: 4680,
              lcp: 10185,
              tbt: 300,
              cls: 0.15,
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/about$',
            pagePerfThresholds: {
              fcp: 4380,
              speedIndex: 5670,
              lcp: 12750,
              tbt: 300,
              cls: 0.15,
            },
            accessibilityMinScore: 0.88,
          },
          {
            matchingUrlPattern: 'http://[^/]+/admin$',
            pagePerfThresholds: {
              fcp: 2820,
              speedIndex: 2820,
              lcp: 8415,
              tbt: 300,
              cls: 0.15,
            },
            accessibilityMinScore: 0.93,
          },
          {
            matchingUrlPattern: '^http://localhost:8181/blog-dashboard$',
            pagePerfThresholds: {
              fcp: 2835,
              speedIndex: 3135,
              lcp: 11100,
              tbt: 300,
              cls: 0.15,
            },
            accessibilityMinScore: 0.92,
          },
          {
            matchingUrlPattern: 'http://[^/]+/community-library$',
            pagePerfThresholds: {
              fcp: 2835,
              speedIndex: 4665,
              lcp: 9240,
              tbt: 300,
              cls: 0.15,
            },
            accessibilityMinScore: 0.91,
          },
          {
            matchingUrlPattern: 'http://[^/]+/contact$',
            pagePerfThresholds: {
              fcp: 5550,
              speedIndex: 4755,
              lcp: 9015,
              tbt: 300,
              cls: 0.44,
            },
            accessibilityMinScore: 0.95,
          },
          {
            matchingUrlPattern: 'http://[^/]+/contributor-dashboard$',
            pagePerfThresholds: {
              fcp: 2955,
              speedIndex: 5385,
              lcp: 10785,
              tbt: 300,
              cls: 0.2,
            },
            accessibilityMinScore: 0.95,
          },
          {
            matchingUrlPattern: 'http://[^/]+/creator-dashboard$',
            pagePerfThresholds: {
              fcp: 2775,
              speedIndex: 4170,
              lcp: 11400,
              tbt: 300,
              cls: 0.15,
            },
            accessibilityMinScore: 0.88,
          },
          {
            matchingUrlPattern: 'http://[^/]+/creator-guidelines$',
            pagePerfThresholds: {
              fcp: 4230,
              speedIndex: 5700,
              lcp: 8940,
              tbt: 300,
              cls: 0.51,
            },
            accessibilityMinScore: 0.91,
          },
          {
            matchingUrlPattern: 'http://[^/]+/delete-account$',
            pagePerfThresholds: {
              fcp: 4575,
              speedIndex: 4575,
              lcp: 10950,
              tbt: 300,
              cls: 0.15,
            },
            accessibilityMinScore: 0.95,
          },
          {
            matchingUrlPattern: 'http://[^/]+/donate$',
            pagePerfThresholds: {
              fcp: 4395,
              speedIndex: 5670,
              lcp: 9315,
              tbt: 300,
              cls: 0.51,
            },
            overrides: {
              'errors-in-console': ['error', {minScore: 0}],
              // The YouTube embed on donate page loads images in jpg format,
              // thus we need to allow one image.
              'modern-image-formats': [
                'error',
                {maxLength: 1, strategy: 'pessimistic'},
              ],
              // The YouTube embed on donate page uses passive listeners.
              'uses-passive-event-listeners': ['error', {minScore: 0}],
              deprecations: ['error', {minScore: 0}],
              redirects: ['error', {minScore: 1}],
              'uses-responsive-images': ['error', {minScore: 0.5}],
            },
            accessibilityMinScore: 0.91,
          },
          {
            matchingUrlPattern: 'http://[^/]+/get-started$',
            pagePerfThresholds: {
              fcp: 4395,
              speedIndex: 4395,
              lcp: 10500,
              tbt: 300,
              cls: 0.57,
            },
            accessibilityMinScore: 0.91,
          },
          {
            matchingUrlPattern: 'http://[^/]+/learner-dashboard$',
            pagePerfThresholds: {
              fcp: 4200,
              speedIndex: 4500,
              lcp: 13500,
              tbt: 800,
              cls: 0.15,
            },
            accessibilityMinScore: 0.91,
            overrides: {
              'errors-in-console': ['error', {minScore: 1}],
              'modern-image-formats': [
                'error',
                {maxLength: 0, strategy: 'pessimistic'},
              ],
              // We need to use passive event listeners on this page so that
              // the page works correctly.
              'uses-passive-event-listeners': ['error', {minScore: 0}],
              // Sign up redirects logged-in user to learner dashboard page.
              // Learner dashboard Page cannot be preloaded.
              deprecations: ['error', {minScore: 1}],
              redirects: ['error', {minScore: 0}],
              'uses-responsive-images': ['error', {minScore: 0.8}],
              // All images are offscreen on the learner dashboard.
              'offscreen-images': ['error', {minScore: 0}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/license$',
            pagePerfThresholds: {
              fcp: 4410,
              speedIndex: 4680,
              lcp: 9030,
              tbt: 300,
              cls: 0.29,
            },
            accessibilityMinScore: 0.91,
            overrides: {
              'offscreen-images': ['error', {minScore: 0}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/moderator$',
            pagePerfThresholds: {
              fcp: 2790,
              speedIndex: 4410,
              lcp: 9135,
              tbt: 300,
              cls: 0.15,
            },
            accessibilityMinScore: 0.92,
          },
          {
            matchingUrlPattern: 'http://[^/]+/preferences$',
            pagePerfThresholds: {
              fcp: 2955,
              speedIndex: 4575,
              lcp: 9585,
              tbt: 300,
              cls: 0.15,
            },
            accessibilityMinScore: 0.84,
            overrides: {
              'offscreen-images': ['error', {minScore: 0}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/privacy-policy$',
            pagePerfThresholds: {
              fcp: 4440,
              speedIndex: 4440,
              lcp: 8955,
              tbt: 300,
              cls: 0.15,
            },
            accessibilityMinScore: 0.95,
          },
          {
            matchingUrlPattern: 'http://[^/]+/profile/username1$',
            pagePerfThresholds: {
              fcp: 2925,
              speedIndex: 4515,
              lcp: 9405,
              tbt: 300,
              cls: 0.15,
            },
            accessibilityMinScore: 0.95,
            overrides: {
              'offscreen-images': ['error', {minScore: 0}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/signup\\?return_url=%2F$',
            pagePerfThresholds: {
              fcp: 4650,
              speedIndex: 5700,
              lcp: 10800,
              tbt: 300,
              cls: 0.6,
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/teach$',
            pagePerfThresholds: {
              fcp: 2760,
              speedIndex: 6150,
              lcp: 9390,
              tbt: 300,
              cls: 0.15,
            },
            accessibilityMinScore: 0.91,
            overrides: {
              'uses-responsive-images': ['error', {minScore: 0.5}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/terms$',
            pagePerfThresholds: {
              fcp: 4245,
              speedIndex: 4560,
              lcp: 8715,
              tbt: 300,
              cls: 0.15,
            },
            accessibilityMinScore: 0.95,
          },
          {
            matchingUrlPattern: 'http://[^/]+/thanks$',
            pagePerfThresholds: {
              fcp: 4560,
              speedIndex: 4725,
              lcp: 9075,
              tbt: 300,
              cls: 0.15,
            },
            accessibilityMinScore: 0.95,
            overrides: {
              'offscreen-images': ['error', {minScore: 0}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/volunteer$',
            pagePerfThresholds: {
              fcp: 4350,
              speedIndex: 5145,
              lcp: 9615,
              tbt: 300,
              cls: 0.59,
            },
            accessibilityMinScore: 0.88,
            overrides: {
              'uses-responsive-images': ['error', {minScore: 0}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/topics-and-skills-dashboard$',
            pagePerfThresholds: {
              fcp: 2775,
              speedIndex: 4695,
              lcp: 9510,
              tbt: 300,
              cls: 0.15,
            },
            overrides: {
              'offscreen-images': ['error', {minScore: 0}],
            },
            accessibilityMinScore: 0.9,
          },
          {
            matchingUrlPattern:
              '^http://localhost:8181/learn/staging/dummy-topic-one/story$',
            pagePerfThresholds: {
              fcp: 2775,
              speedIndex: 4815,
              lcp: 9810,
              tbt: 300,
              cls: 0.15,
            },
            accessibilityMinScore: 0.88,
            overrides: {
              'offscreen-images': ['error', {minScore: 0}],
            },
          },
          {
            matchingUrlPattern:
              '^http://localhost:8181/learn/staging/dummy-topic-one/story/help-jamie-win-arcade$',
            pagePerfThresholds: {
              fcp: 2775,
              speedIndex: 5370,
              lcp: 10290,
              tbt: 300,
              cls: 0.15,
            },
            accessibilityMinScore: 0.88,
            overrides: {
              'errors-in-console': ['error', {minScore: 0}],
              'offscreen-images': ['error', {minScore: 0}],
            },
          },
          {
            matchingUrlPattern: '^http://localhost:8181/learn/math$',
            pagePerfThresholds: {
              fcp: 2835,
              speedIndex: 5145,
              lcp: 9540,
              tbt: 300,
              cls: 0.15,
            },
            accessibilityMinScore: 0.95,
            overrides: {
              // Classroom pages use JPEG images that are not next-gen formats.
              'modern-image-formats': [
                'error',
                {maxLength: 1, strategy: 'pessimistic'},
              ],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/create/.*$',
            pagePerfThresholds: {
              fcp: 2790,
              speedIndex: 5685,
              lcp: 16500,
              tbt: 915,
              cls: 0.15,
            },
            accessibilityMinScore: 0.95,
            overrides: {
              'errors-in-console': ['error', {minScore: 1}],
              // TODO(#13465): Change this maxLength to 0 once images are
              // migrated.
              'modern-image-formats': [
                'error',
                {maxLength: 3, strategy: 'pessimistic'},
              ],
              // We need to use passive event listeners on this page so that
              // the page works correctly.
              'uses-passive-event-listeners': ['error', {minScore: 0}],
              // MIDI library uses some deprecated API.
              deprecations: ['error', {minScore: 0}],
              redirects: ['error', {minScore: 1}],
              'uses-responsive-images': ['error', {minScore: 1}],
            },
          },
          {
            matchingUrlPattern: '^http://localhost:8181/explore/.*$',
            pagePerfThresholds: {
              fcp: 2775,
              speedIndex: 2775,
              lcp: 14805,
              tbt: 810,
              cls: 0.15,
            },
            accessibilityMinScore: 0.91,
            overrides: {
              // Explore page uses deprecated APIs from third-party scripts.
              deprecations: ['error', {minScore: 0}],
              // Explore page has images that are not in next-gen formats.
              'modern-image-formats': [
                'error',
                {maxLength: 3, strategy: 'pessimistic'},
              ],
              // All images are offscreen on the explore page.
              'offscreen-images': ['error', {minScore: 0}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/topic_editor/.*$',
            pagePerfThresholds: {
              fcp: 2775,
              speedIndex: 2775,
              lcp: 11580,
              tbt: 420,
              cls: 0.15,
            },
            accessibilityMinScore: 0.92,
          },
          {
            matchingUrlPattern: 'http://[^/]+/skill_editor/.*$',
            pagePerfThresholds: {
              fcp: 2775,
              speedIndex: 2775,
              lcp: 11865,
              tbt: 390,
              cls: 0.15,
            },
            accessibilityMinScore: 0.91,
          },
          {
            matchingUrlPattern: '^http://[^/]+/story_editor/.*$',
            pagePerfThresholds: {
              fcp: 2850,
              speedIndex: 2850,
              lcp: 9690,
              tbt: 330,
              cls: 0.15,
            },
            accessibilityMinScore: 0.84,
          },
        ],
        // Error-level safety-net thresholds for desktop. Per-page entries
        // override these at tighter values.
        {
          fcp: 5550,
          speedIndex: 6150,
          lcp: 16500,
          tbt: 975,
          cls: 1.0,
        }
      ),
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
