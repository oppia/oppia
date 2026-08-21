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
              fcp: 2030,
              speedIndex: 3120,
              lcp: 6790,
              tbt: 200,
              cls: 0.1,
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/about$',
            pagePerfThresholds: {
              fcp: 2920,
              speedIndex: 3780,
              lcp: 7020,
              tbt: 200,
              cls: 0.1,
            },
            accessibilityMinScore: 0.88,
          },
          {
            matchingUrlPattern: 'http://[^/]+/admin$',
            pagePerfThresholds: {
              fcp: 1880,
              speedIndex: 1880,
              lcp: 5610,
              tbt: 200,
              cls: 0.1,
            },
            accessibilityMinScore: 0.93,
          },
          {
            matchingUrlPattern: '^http://localhost:8181/blog-dashboard$',
            pagePerfThresholds: {
              fcp: 1890,
              speedIndex: 2090,
              lcp: 6020,
              tbt: 200,
              cls: 0.1,
            },
            accessibilityMinScore: 0.92,
          },
          {
            matchingUrlPattern: 'http://[^/]+/community-library$',
            pagePerfThresholds: {
              fcp: 1890,
              speedIndex: 3110,
              lcp: 6160,
              tbt: 200,
              cls: 0.1,
            },
            accessibilityMinScore: 0.91,
          },
          {
            matchingUrlPattern: 'http://[^/]+/contact$',
            pagePerfThresholds: {
              fcp: 2880,
              speedIndex: 3170,
              lcp: 6010,
              tbt: 200,
              cls: 0.29,
            },
            accessibilityMinScore: 0.95,
          },
          {
            matchingUrlPattern: 'http://[^/]+/contributor-dashboard$',
            pagePerfThresholds: {
              fcp: 1970,
              speedIndex: 3590,
              lcp: 7190,
              tbt: 200,
              cls: 0.13,
            },
            accessibilityMinScore: 0.95,
          },
          {
            matchingUrlPattern: 'http://[^/]+/creator-dashboard$',
            pagePerfThresholds: {
              fcp: 1850,
              speedIndex: 2780,
              lcp: 6220,
              tbt: 200,
              cls: 0.1,
            },
            accessibilityMinScore: 0.88,
          },
          {
            matchingUrlPattern: 'http://[^/]+/creator-guidelines$',
            pagePerfThresholds: {
              fcp: 2820,
              speedIndex: 3030,
              lcp: 5960,
              tbt: 200,
              cls: 0.34,
            },
            accessibilityMinScore: 0.91,
          },
          {
            matchingUrlPattern: 'http://[^/]+/delete-account$',
            pagePerfThresholds: {
              fcp: 3050,
              speedIndex: 3050,
              lcp: 5870,
              tbt: 200,
              cls: 0.1,
            },
            accessibilityMinScore: 0.95,
          },
          {
            matchingUrlPattern: 'http://[^/]+/donate$',
            pagePerfThresholds: {
              fcp: 2930,
              speedIndex: 3780,
              lcp: 6210,
              tbt: 200,
              cls: 0.34,
            },
            overrides: {
              // TODO(#17279): There is an error on the /donate page due to the
              // embedded Stripe third-party component within it. Find a way to
              // ignore that error.
              'errors-in-console': ['error', {minScore: 0}],
              // The YouTube embed on donate page loads images in jpg format,
              // thus we need to allow one image.
              'modern-image-formats': [
                'error',
                {maxLength: 1, strategy: 'pessimistic'},
              ],
              // The YouTube embed on donate page uses passive listeners.
              'uses-passive-event-listeners': ['error', {minScore: 0}],
              // TODO(#20286): There is a deprecated API on the /donate page due
              // to the donorbox script, change the minScore to 1 once it is
              // fixed.
              deprecations: ['error', {minScore: 0}],
              redirects: ['error', {minScore: 1}],
              'uses-responsive-images': ['error', {minScore: 0.5}],
            },
            accessibilityMinScore: 0.91,
          },
          {
            matchingUrlPattern: 'http://[^/]+/get-started$',
            pagePerfThresholds: {
              fcp: 2930,
              speedIndex: 2930,
              lcp: 5830,
              tbt: 200,
              cls: 0.38,
            },
            accessibilityMinScore: 0.91,
          },
          {
            matchingUrlPattern: 'http://[^/]+/learner-dashboard$',
            overrides: {
              'categories:accessibility': ['error', {minScore: 0.91}],
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
              fcp: 2940,
              speedIndex: 3120,
              lcp: 6020,
              tbt: 200,
              cls: 0.19,
            },
            overrides: {
              'categories:accessibility': ['error', {minScore: 0.91}],
              'offscreen-images': ['error', {minScore: 0}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/moderator$',
            pagePerfThresholds: {
              fcp: 1860,
              speedIndex: 2940,
              lcp: 6090,
              tbt: 200,
              cls: 0.1,
            },
            accessibilityMinScore: 0.92,
          },
          {
            matchingUrlPattern: 'http://[^/]+/preferences$',
            pagePerfThresholds: {
              fcp: 1970,
              speedIndex: 3050,
              lcp: 6390,
              tbt: 200,
              cls: 0.1,
            },
            overrides: {
              'categories:accessibility': ['error', {minScore: 0.84}],
              'offscreen-images': ['error', {minScore: 0}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/privacy-policy$',
            pagePerfThresholds: {
              fcp: 2960,
              speedIndex: 2960,
              lcp: 5970,
              tbt: 200,
              cls: 0.1,
            },
            accessibilityMinScore: 0.95,
          },
          {
            matchingUrlPattern: 'http://[^/]+/profile/username1$',
            pagePerfThresholds: {
              fcp: 1950,
              speedIndex: 3010,
              lcp: 6270,
              tbt: 200,
              cls: 0.1,
            },
            overrides: {
              'categories:accessibility': ['error', {minScore: 0.95}],
              'offscreen-images': ['error', {minScore: 0}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/signup\\?return_url=%2F$',
            pagePerfThresholds: {
              fcp: 3100,
              speedIndex: 3800,
              lcp: 7200,
              tbt: 200,
              cls: 0.4,
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/teach$',
            pagePerfThresholds: {
              fcp: 1840,
              speedIndex: 3150,
              lcp: 6260,
              tbt: 200,
              cls: 0.1,
            },
            overrides: {
              'categories:accessibility': ['error', {minScore: 0.91}],
              'uses-responsive-images': ['error', {minScore: 0.5}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/terms$',
            pagePerfThresholds: {
              fcp: 2830,
              speedIndex: 3040,
              lcp: 5810,
              tbt: 200,
              cls: 0.1,
            },
            accessibilityMinScore: 0.95,
          },
          {
            matchingUrlPattern: 'http://[^/]+/thanks$',
            pagePerfThresholds: {
              fcp: 3040,
              speedIndex: 3150,
              lcp: 6050,
              tbt: 200,
              cls: 0.1,
            },
            overrides: {
              'categories:accessibility': ['error', {minScore: 0.95}],
              'offscreen-images': ['error', {minScore: 0}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/volunteer$',
            pagePerfThresholds: {
              fcp: 2900,
              speedIndex: 3430,
              lcp: 6410,
              tbt: 200,
              cls: 0.39,
            },
            overrides: {
              'categories:accessibility': ['error', {minScore: 0.88}],
              'uses-responsive-images': ['error', {minScore: 0}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/topics-and-skills-dashboard$',
            pagePerfThresholds: {
              fcp: 1850,
              speedIndex: 3130,
              lcp: 6340,
              tbt: 200,
              cls: 0.1,
            },
            overrides: {
              'offscreen-images': ['error', {minScore: 0}],
            },
            accessibilityMinScore: 0.9,
          },
          {
            matchingUrlPattern:
              '^http://localhost:8181/learn/staging/dummy-topic-one/story$', // pylint: disable=line-too-long
            overrides: {
              'categories:accessibility': ['error', {minScore: 0.91}],
              'offscreen-images': ['error', {minScore: 0}],
            },
          },
          {
            matchingUrlPattern:
              '^http://localhost:8181/learn/staging/dummy-topic-one/story/help-jamie-win-arcade$', // pylint: disable=line-too-long
            overrides: {
              'categories:accessibility': ['error', {minScore: 0.95}],
              'errors-in-console': ['error', {minScore: 0}],
              'offscreen-images': ['error', {minScore: 0}],
            },
          },
          {
            matchingUrlPattern: '^http://localhost:8181/learn/math$',
            overrides: {
              'categories:accessibility': ['error', {minScore: 0.95}],
              // Classroom pages use JPEG images that are not next-gen formats.
              'modern-image-formats': [
                'error',
                {maxLength: 1, strategy: 'pessimistic'},
              ],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/create/.*$',
            overrides: {
              'categories:accessibility': ['error', {minScore: 0.95}],
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
            overrides: {
              'categories:accessibility': ['error', {minScore: 0.91}],
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
            accessibilityMinScore: 0.92,
          },
          {
            matchingUrlPattern: 'http://[^/]+/skill_editor/.*$',
            accessibilityMinScore: 0.91,
          },
          {
            matchingUrlPattern: '^http://[^/]+/story_editor/.*$',
            accessibilityMinScore: 0.84,
          },
        ],
        // Ideal "good" performance thresholds for desktop (web.dev /
        // Lighthouse). Desktop Speed Index threshold is tighter than mobile.
        {
          fcp: 1800,
          speedIndex: 1300,
          lcp: 2500,
          tbt: 200,
          cls: 0.1,
        }
      ),
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
