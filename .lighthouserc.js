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
 * @fileoverview Configuration for lighthouse-ci (mobile).
 */

const baseConfig = require('./.lighthouserc-base.js');

module.exports = {
  ci: {
    collect: {
      numberOfRuns: baseConfig['numberOfRuns'],
      puppeteerScript: baseConfig['puppeteerScript'],
      url: baseConfig['urls'],
      settings: {
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
              fcp: 16050,
              speedIndex: 16050,
              lcp: 56550,
              tbt: 1575,
              cls: 0.15,
            },
            overrides: {
              // The hero images use media queries and are intentionally
              // larger than the viewport on smaller screens.
              'uses-responsive-images': ['error', {minScore: 0.5}],
              // The overall Lighthouse performance category score is highly
              // variable on the constrained mobile emulation, so it is not a
              // meaningful gate here. The per-audit thresholds (FCP, LCP, TBT,
              // CLS, speed index) above remain the actual performance guard.
              // The desktop config similarly relaxes the marketing hero images.
              'categories:performance': ['error', {minScore: 0}],
              'uses-optimized-images': ['error', {minScore: 0.6}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/about$',
            pagePerfThresholds: {
              fcp: 30750,
              speedIndex: 30750,
              lcp: 63000,
              tbt: 1245,
              cls: 0.6,
            },
            accessibilityMinScore: 0.88,
            overrides: {
              'categories:performance': ['error', {minScore: 0}],
              'uses-optimized-images': ['error', {minScore: 0.6}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/admin$',
            pagePerfThresholds: {
              fcp: 16125,
              speedIndex: 16125,
              lcp: 63000,
              tbt: 1815,
              cls: 0.15,
            },
            accessibilityMinScore: 0.93,
          },
          {
            matchingUrlPattern: 'http://[^/]+/android$',
            pagePerfThresholds: {
              fcp: 31000,
              speedIndex: 31000,
              lcp: 65000,
              tbt: 4800,
              cls: 1.5,
            },
            accessibilityMinScore: 0.84,
            overrides: {
              'categories:performance': ['error', {minScore: 0}],
              'uses-optimized-images': ['error', {minScore: 0.6}],
            },
          },
          {
            matchingUrlPattern: '^http://localhost:8181/blog-dashboard$',
            pagePerfThresholds: {
              fcp: 15900,
              speedIndex: 18600,
              lcp: 52650,
              tbt: 2085,
              cls: 0.15,
            },
            accessibilityMinScore: 0.87,
          },
          {
            matchingUrlPattern: '^http://localhost:8181/blog$',
            pagePerfThresholds: {
              fcp: 31000,
              speedIndex: 31000,
              lcp: 70000,
              tbt: 4800,
              cls: 1.5,
            },
            accessibilityMinScore: 0.9,
            overrides: {
              'image-aspect-ratio': ['error', {minScore: 0}],
              'uses-responsive-images': ['error', {minScore: 0}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/community-library$',
            pagePerfThresholds: {
              fcp: 16125,
              speedIndex: 21750,
              lcp: 67500,
              tbt: 2070,
              cls: 0.15,
            },
            accessibilityMinScore: 0.91,
          },
          {
            matchingUrlPattern: 'http://[^/]+/contact$',
            pagePerfThresholds: {
              fcp: 24750,
              speedIndex: 24750,
              lcp: 51900,
              tbt: 1463,
              cls: 1.11,
            },
            accessibilityMinScore: 0.95,
            overrides: {
              'categories:performance': ['error', {minScore: 0}],
              'uses-optimized-images': ['error', {minScore: 0.6}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/contributor-dashboard$',
            pagePerfThresholds: {
              fcp: 16650,
              speedIndex: 24750,
              lcp: 63750,
              tbt: 1935,
              cls: 0.23,
            },
            accessibilityMinScore: 0.95,
          },
          {
            matchingUrlPattern: 'http://[^/]+/creator-dashboard$',
            pagePerfThresholds: {
              fcp: 15900,
              speedIndex: 19050,
              lcp: 53550,
              tbt: 2175,
              cls: 0.15,
            },
            accessibilityMinScore: 0.88,
          },
          {
            matchingUrlPattern: 'http://[^/]+/creator-guidelines$',
            pagePerfThresholds: {
              fcp: 24750,
              speedIndex: 24750,
              lcp: 57750,
              tbt: 1463,
              cls: 0.78,
            },
            accessibilityMinScore: 0.91,
            overrides: {
              'categories:performance': ['error', {minScore: 0}],
              'uses-optimized-images': ['error', {minScore: 0.6}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/delete-account$',
            pagePerfThresholds: {
              fcp: 25500,
              speedIndex: 25500,
              lcp: 52350,
              tbt: 1785,
              cls: 0.15,
            },
            accessibilityMinScore: 0.95,
          },
          {
            matchingUrlPattern: 'http://[^/]+/donate$',
            pagePerfThresholds: {
              fcp: 24750,
              speedIndex: 24750,
              lcp: 63000,
              tbt: 4800,
              cls: 1.5,
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
              // The YouTube embed can trigger a redirect, so allow it.
              redirects: ['error', {minScore: 0}],
              'uses-responsive-images': ['error', {minScore: 0.5}],
              'categories:performance': ['error', {minScore: 0}],
              'uses-optimized-images': ['error', {minScore: 0.6}],
              // The YouTube embed can log browser issues to the Issues panel.
              'inspector-issues': ['error', {minScore: 0}],
            },
            accessibilityMinScore: 0.91,
          },
          {
            matchingUrlPattern: 'http://[^/]+/get-started$',
            pagePerfThresholds: {
              fcp: 24750,
              speedIndex: 24750,
              lcp: 51300,
              tbt: 1440,
              cls: 0.98,
            },
            accessibilityMinScore: 0.91,
            overrides: {
              'categories:performance': ['error', {minScore: 0}],
              'uses-optimized-images': ['error', {minScore: 0.6}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/learner-dashboard$',
            pagePerfThresholds: {
              fcp: 16065,
              speedIndex: 16065,
              lcp: 56850,
              tbt: 2340,
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
              fcp: 25545,
              speedIndex: 25545,
              lcp: 52050,
              tbt: 1170,
              cls: 0.68,
            },
            accessibilityMinScore: 0.91,
            overrides: {
              'offscreen-images': ['error', {minScore: 0}],
              'categories:performance': ['error', {minScore: 0}],
              'uses-optimized-images': ['error', {minScore: 0.6}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/moderator$',
            pagePerfThresholds: {
              fcp: 15465,
              speedIndex: 15465,
              lcp: 57750,
              tbt: 2625,
              cls: 0.15,
            },
            accessibilityMinScore: 0.92,
          },
          {
            matchingUrlPattern: 'http://[^/]+/partnerships$',
            pagePerfThresholds: {
              fcp: 31000,
              speedIndex: 31000,
              lcp: 60000,
              tbt: 4800,
              cls: 1.5,
            },
            accessibilityMinScore: 0.88,
            overrides: {
              'errors-in-console': ['error', {minScore: 0}],
              'modern-image-formats': [
                'error',
                {maxLength: 15, strategy: 'pessimistic'},
              ],
              'uses-passive-event-listeners': ['error', {minScore: 0}],
              'uses-responsive-images': ['error', {minScore: 0.5}],
              'categories:performance': ['error', {minScore: 0}],
              'uses-optimized-images': ['error', {minScore: 0.6}],
              // The many partner logos can log browser issues to the Issues
              // panel.
              'inspector-issues': ['error', {minScore: 0}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/preferences$',
            pagePerfThresholds: {
              fcp: 16365,
              speedIndex: 16365,
              lcp: 55200,
              tbt: 2925,
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
              fcp: 24315,
              speedIndex: 24315,
              lcp: 63000,
              tbt: 1155,
              cls: 0.15,
            },
            accessibilityMinScore: 0.95,
            overrides: {
              'categories:performance': ['error', {minScore: 0}],
              'uses-optimized-images': ['error', {minScore: 0.6}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/profile/username1$',
            pagePerfThresholds: {
              fcp: 16140,
              speedIndex: 16140,
              lcp: 53400,
              tbt: 2700,
              cls: 0.18,
            },
            accessibilityMinScore: 0.95,
            overrides: {
              'offscreen-images': ['error', {minScore: 0}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/signup\\?return_url=%2F$',
            pagePerfThresholds: {
              fcp: 25500,
              speedIndex: 25500,
              lcp: 57000,
              tbt: 2400,
              cls: 0.15,
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/teach$',
            pagePerfThresholds: {
              fcp: 15450,
              speedIndex: 15450,
              lcp: 53700,
              tbt: 1815,
              cls: 0.15,
            },
            accessibilityMinScore: 0.91,
            overrides: {
              'uses-responsive-images': ['error', {minScore: 0.5}],
              'categories:performance': ['error', {minScore: 0}],
              'uses-optimized-images': ['error', {minScore: 0.6}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/terms$',
            pagePerfThresholds: {
              fcp: 24300,
              speedIndex: 24300,
              lcp: 51000,
              tbt: 1020,
              cls: 0.15,
            },
            accessibilityMinScore: 0.95,
            overrides: {
              'categories:performance': ['error', {minScore: 0}],
              'uses-optimized-images': ['error', {minScore: 0.6}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/thanks$',
            pagePerfThresholds: {
              fcp: 30900,
              speedIndex: 30900,
              lcp: 52350,
              tbt: 1380,
              cls: 0.15,
            },
            accessibilityMinScore: 0.95,
            overrides: {
              'offscreen-images': ['error', {minScore: 0}],
              'categories:performance': ['error', {minScore: 0}],
              'uses-optimized-images': ['error', {minScore: 0.6}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/volunteer$',
            pagePerfThresholds: {
              fcp: 30750,
              speedIndex: 30750,
              lcp: 53250,
              tbt: 1755,
              cls: 1.13,
            },
            accessibilityMinScore: 0.88,
            overrides: {
              'uses-responsive-images': ['error', {minScore: 0}],
              'categories:performance': ['error', {minScore: 0}],
              'uses-optimized-images': ['error', {minScore: 0.6}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/topics-and-skills-dashboard$',
            pagePerfThresholds: {
              fcp: 19800,
              speedIndex: 19800,
              lcp: 60750,
              tbt: 2595,
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
              fcp: 15480,
              speedIndex: 21540,
              lcp: 57945,
              tbt: 2265,
              cls: 0.15,
            },
            accessibilityMinScore: 0.91,
            overrides: {
              'offscreen-images': ['error', {minScore: 0}],
            },
          },
          {
            matchingUrlPattern:
              '^http://localhost:8181/learn/staging/dummy-topic-one/story/help-jamie-win-arcade$',
            pagePerfThresholds: {
              fcp: 15915,
              speedIndex: 15915,
              lcp: 59250,
              tbt: 2130,
              cls: 0.15,
            },
            accessibilityMinScore: 0.95,
            overrides: {
              'errors-in-console': ['error', {minScore: 0}],
              'offscreen-images': ['error', {minScore: 0}],
            },
          },
          {
            matchingUrlPattern: '^http://localhost:8181/classroom-admin$',
            pagePerfThresholds: {
              fcp: 31000,
              speedIndex: 31000,
              lcp: 60000,
              tbt: 4800,
              cls: 1.5,
            },
            accessibilityMinScore: 0.9,
          },
          {
            matchingUrlPattern: '^http://localhost:8181/learn$',
            pagePerfThresholds: {
              fcp: 31000,
              speedIndex: 31000,
              lcp: 60000,
              tbt: 4800,
              cls: 1.5,
            },
            accessibilityMinScore: 0.9,
          },
          {
            matchingUrlPattern: '^http://localhost:8181/learn/math$',
            pagePerfThresholds: {
              fcp: 15945,
              speedIndex: 20250,
              lcp: 54330,
              tbt: 2235,
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
              fcp: 16125,
              speedIndex: 30675,
              lcp: 97110,
              tbt: 3870,
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
              fcp: 16035,
              speedIndex: 24180,
              lcp: 84690,
              tbt: 3945,
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
              fcp: 15915,
              speedIndex: 25725,
              lcp: 67530,
              tbt: 2325,
              cls: 0.15,
            },
            accessibilityMinScore: 0.92,
          },
          {
            matchingUrlPattern: 'http://[^/]+/skill_editor/.*$',
            pagePerfThresholds: {
              fcp: 15900,
              speedIndex: 25515,
              lcp: 68145,
              tbt: 2235,
              cls: 0.15,
            },
            accessibilityMinScore: 0.91,
          },
          {
            matchingUrlPattern: '^http://[^/]+/story_editor/.*$',
            pagePerfThresholds: {
              fcp: 15915,
              speedIndex: 21060,
              lcp: 55170,
              tbt: 1845,
              cls: 0.15,
            },
            accessibilityMinScore: 0.84,
          },
          {
            matchingUrlPattern: '^http://[^/]+/blog-admin$',
            accessibilityMinScore: 0.9,
          },
          {
            matchingUrlPattern: '^http://[^/]+/blog/.+$',
            accessibilityMinScore: 0.9,
            overrides: {
              'errors-in-console': ['error', {minScore: 0}],
              'image-aspect-ratio': ['error', {minScore: 0}],
            },
          },
          {
            matchingUrlPattern: '^http://[^/]+/certificate-assessment/.+$',
            accessibilityMinScore: 0.9,
          },
          {
            matchingUrlPattern:
              '^http://[^/]+/certificate-assessment-result/.+$',
            accessibilityMinScore: 0.9,
          },
          {
            matchingUrlPattern: '^http://[^/]+/certificate-creator-dashboard$',
            accessibilityMinScore: 0.9,
          },
          {
            matchingUrlPattern:
              '^http://[^/]+/learn/.+/certificate-offering-available$',
            accessibilityMinScore: 0.9,
          },
          {
            matchingUrlPattern: '^http://[^/]+/contributor-admin-dashboard$',
            accessibilityMinScore: 0.9,
          },
          {
            matchingUrlPattern:
              '^http://[^/]+/create-certificate-assessment-offering$',
            accessibilityMinScore: 0.9,
          },
          {
            matchingUrlPattern: '^http://[^/]+/diagnostic-test-player$',
            accessibilityMinScore: 0.9,
          },
          {
            matchingUrlPattern:
              '^http://[^/]+/edit-certificate-assessment-offering/.+$',
            accessibilityMinScore: 0.9,
          },
          {
            matchingUrlPattern: '^http://[^/]+/learn/.+/test/arc/.+$',
            accessibilityMinScore: 0.9,
          },
          {
            matchingUrlPattern: '^http://[^/]+/facilitator-dashboard$',
            accessibilityMinScore: 0.9,
          },
          {
            matchingUrlPattern: '^http://[^/]+/feedback-updates$',
            accessibilityMinScore: 0.9,
          },
          {
            matchingUrlPattern: '^http://[^/]+/create-learner-group$',
            accessibilityMinScore: 0.9,
          },
          {
            matchingUrlPattern: '^http://[^/]+/edit-learner-group/.+$',
            accessibilityMinScore: 0.9,
          },
          {
            matchingUrlPattern: '^http://[^/]+/learner-group/.+$',
            accessibilityMinScore: 0.9,
          },
          {
            matchingUrlPattern: '^http://[^/]+/learn/.+/mastery-challenge$',
            accessibilityMinScore: 0.9,
          },
          {
            matchingUrlPattern: '^http://[^/]+/lesson/.+$',
            accessibilityMinScore: 0.9,
          },
          {
            matchingUrlPattern: '^http://[^/]+/learn/.+/practice/.+$',
            accessibilityMinScore: 0.9,
          },
          {
            matchingUrlPattern: '^http://[^/]+/pending-account-deletion$',
            accessibilityMinScore: 0.9,
          },
          {
            matchingUrlPattern: '^http://[^/]+/release-coordinator$',
            accessibilityMinScore: 0.9,
          },
          {
            matchingUrlPattern: '^http://[^/]+/learn/.+/studyguide/.+$',
            accessibilityMinScore: 0.9,
          },
          {
            matchingUrlPattern: '^http://[^/]+/technical-feedback-dashboard$',
            accessibilityMinScore: 0.9,
          },
          {
            matchingUrlPattern:
              '^http://[^/]+/technical-feedback-dashboard/.+$',
            accessibilityMinScore: 0.9,
          },
          {
            matchingUrlPattern: '^http://[^/]+/voiceover-admin$',
            accessibilityMinScore: 0.9,
          },
        ],
        // Error-level safety-net thresholds for mobile. Per-page entries
        // override these at tighter values.
        {
          fcp: 31000,
          speedIndex: 31000,
          lcp: 105000,
          tbt: 4800,
          cls: 1.5,
        }
      ),
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
