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
              fcp: 10700,
              speedIndex: 10700,
              lcp: 37700,
              tbt: 1050,
              cls: 0.1,
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/about$',
            pagePerfThresholds: {
              fcp: 16100,
              speedIndex: 16100,
              lcp: 37900,
              tbt: 510,
              cls: 0.4,
            },
            accessibilityMinScore: 0.88,
          },
          {
            matchingUrlPattern: 'http://[^/]+/admin$',
            pagePerfThresholds: {
              fcp: 11100,
              speedIndex: 11100,
              lcp: 33400,
              tbt: 720,
              cls: 0.1,
            },
            accessibilityMinScore: 0.93,
          },
          {
            matchingUrlPattern: '^http://localhost:8181/blog-dashboard$',
            pagePerfThresholds: {
              fcp: 10600,
              speedIndex: 12400,
              lcp: 35100,
              tbt: 860,
              cls: 0.1,
            },
            accessibilityMinScore: 0.92,
          },
          {
            matchingUrlPattern: 'http://[^/]+/community-library$',
            pagePerfThresholds: {
              fcp: 10700,
              speedIndex: 13700,
              lcp: 35600,
              tbt: 870,
              cls: 0.1,
            },
            accessibilityMinScore: 0.91,
          },
          {
            matchingUrlPattern: 'http://[^/]+/contact$',
            pagePerfThresholds: {
              fcp: 16500,
              speedIndex: 16500,
              lcp: 34600,
              tbt: 590,
              cls: 0.1,
            },
            accessibilityMinScore: 0.95,
          },
          {
            matchingUrlPattern: 'http://[^/]+/contributor-dashboard$',
            pagePerfThresholds: {
              fcp: 11100,
              speedIndex: 11300,
              lcp: 42500,
              tbt: 800,
              cls: 0.1,
            },
            accessibilityMinScore: 0.95,
          },
          {
            matchingUrlPattern: 'http://[^/]+/creator-dashboard$',
            pagePerfThresholds: {
              fcp: 10600,
              speedIndex: 12700,
              lcp: 35700,
              tbt: 950,
              cls: 0.1,
            },
            accessibilityMinScore: 0.88,
          },
          {
            matchingUrlPattern: 'http://[^/]+/creator-guidelines$',
            pagePerfThresholds: {
              fcp: 16500,
              speedIndex: 16500,
              lcp: 34300,
              tbt: 580,
              cls: 0.52,
            },
            accessibilityMinScore: 0.91,
          },
          {
            matchingUrlPattern: 'http://[^/]+/delete-account$',
            pagePerfThresholds: {
              fcp: 17000,
              speedIndex: 17000,
              lcp: 34900,
              tbt: 750,
              cls: 0.1,
            },
            accessibilityMinScore: 0.95,
          },
          {
            matchingUrlPattern: 'http://[^/]+/donate$',
            pagePerfThresholds: {
              fcp: 16500,
              speedIndex: 16500,
              lcp: 36100,
              tbt: 1650,
              cls: 0.1,
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
              fcp: 16500,
              speedIndex: 16500,
              lcp: 34200,
              tbt: 630,
              cls: 0.1,
            },
            accessibilityMinScore: 0.91,
          },
          {
            matchingUrlPattern: 'http://[^/]+/learner-dashboard$',
            pagePerfThresholds: {
              fcp: 10710,
              speedIndex: 10710,
              lcp: 37900,
              tbt: 1560,
              cls: 0.1,
            },
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
              fcp: 17030,
              speedIndex: 17030,
              lcp: 34700,
              tbt: 780,
              cls: 0.45,
            },
            overrides: {
              'categories:accessibility': ['error', {minScore: 0.91}],
              'offscreen-images': ['error', {minScore: 0}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/moderator$',
            pagePerfThresholds: {
              fcp: 10310,
              speedIndex: 10310,
              lcp: 34500,
              tbt: 1240,
              cls: 0.1,
            },
            accessibilityMinScore: 0.92,
          },
          {
            matchingUrlPattern: 'http://[^/]+/preferences$',
            pagePerfThresholds: {
              fcp: 10910,
              speedIndex: 10910,
              lcp: 36800,
              tbt: 1360,
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
              fcp: 16210,
              speedIndex: 16210,
              lcp: 33100,
              tbt: 770,
              cls: 0.1,
            },
            accessibilityMinScore: 0.95,
          },
          {
            matchingUrlPattern: 'http://[^/]+/profile/username1$',
            pagePerfThresholds: {
              fcp: 10760,
              speedIndex: 10760,
              lcp: 35600,
              tbt: 1200,
              cls: 0.12,
            },
            overrides: {
              'categories:accessibility': ['error', {minScore: 0.95}],
              'offscreen-images': ['error', {minScore: 0}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/signup\\?return_url=%2F$',
            pagePerfThresholds: {
              fcp: 17000,
              speedIndex: 17000,
              lcp: 38000,
              tbt: 1600,
              cls: 0.1,
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/teach$',
            pagePerfThresholds: {
              fcp: 10300,
              speedIndex: 10300,
              lcp: 35800,
              tbt: 870,
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
              fcp: 16200,
              speedIndex: 16200,
              lcp: 34000,
              tbt: 680,
              cls: 0.1,
            },
            accessibilityMinScore: 0.95,
          },
          {
            matchingUrlPattern: 'http://[^/]+/thanks$',
            pagePerfThresholds: {
              fcp: 15910,
              speedIndex: 15910,
              lcp: 34900,
              tbt: 710,
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
              fcp: 16190,
              speedIndex: 16190,
              lcp: 35500,
              tbt: 930,
              cls: 0.55,
            },
            overrides: {
              'categories:accessibility': ['error', {minScore: 0.88}],
              'uses-responsive-images': ['error', {minScore: 0}],
            },
          },
          {
            matchingUrlPattern: 'http://[^/]+/topics-and-skills-dashboard$',
            pagePerfThresholds: {
              fcp: 10300,
              speedIndex: 10300,
              lcp: 36500,
              tbt: 1260,
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
            pagePerfThresholds: {
              fcp: 10320,
              speedIndex: 14360,
              lcp: 38630,
              tbt: 1510,
              cls: 0.1,
            },
            overrides: {
              'categories:accessibility': ['error', {minScore: 0.91}],
              'offscreen-images': ['error', {minScore: 0}],
            },
          },
          {
            matchingUrlPattern:
              '^http://localhost:8181/learn/staging/dummy-topic-one/story/help-jamie-win-arcade$', // pylint: disable=line-too-long
            pagePerfThresholds: {
              fcp: 10610,
              speedIndex: 10610,
              lcp: 39500,
              tbt: 1420,
              cls: 0.1,
            },
            overrides: {
              'categories:accessibility': ['error', {minScore: 0.95}],
              'errors-in-console': ['error', {minScore: 0}],
              'offscreen-images': ['error', {minScore: 0}],
            },
          },
          {
            matchingUrlPattern: '^http://localhost:8181/learn/math$',
            pagePerfThresholds: {
              fcp: 10630,
              speedIndex: 13500,
              lcp: 36220,
              tbt: 1490,
              cls: 0.1,
            },
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
            pagePerfThresholds: {
              fcp: 10750,
              speedIndex: 20450,
              lcp: 64740,
              tbt: 2580,
              cls: 0.1,
            },
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
            pagePerfThresholds: {
              fcp: 10690,
              speedIndex: 16120,
              lcp: 56460,
              tbt: 2630,
              cls: 0.1,
            },
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
            pagePerfThresholds: {
              fcp: 10610,
              speedIndex: 17150,
              lcp: 45020,
              tbt: 1550,
              cls: 0.1,
            },
            accessibilityMinScore: 0.92,
          },
          {
            matchingUrlPattern: 'http://[^/]+/skill_editor/.*$',
            pagePerfThresholds: {
              fcp: 10600,
              speedIndex: 17010,
              lcp: 45430,
              tbt: 1490,
              cls: 0.1,
            },
            accessibilityMinScore: 0.91,
          },
          {
            matchingUrlPattern: '^http://[^/]+/story_editor/.*$',
            pagePerfThresholds: {
              fcp: 10610,
              speedIndex: 14040,
              lcp: 36780,
              tbt: 1230,
              cls: 0.1,
            },
            accessibilityMinScore: 0.84,
          },
        ],
        // Ideal "good" performance thresholds for mobile (web.dev /
        // Lighthouse). Pages that exceed these produce warn-level violations;
        // override per-page as needed and file cleanup issues.
        {
          fcp: 1800,
          speedIndex: 3400,
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
