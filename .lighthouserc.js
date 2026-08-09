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

const baseConfig = require('./.lighthouserc-base.js');

const buildPageAssertions = (overrides = {}, accessibilityMinScore = 1) => ({
  ...baseConfig['basePerformanceAssertions'],
  'categories:accessibility': ['error', {minScore: accessibilityMinScore}],
  // TODO(#17560): Change the SEO category assertion from warn to error once
  // real CI runs confirm which pages score 1.0. Some pages currently fail
  // audits like meta-description and crawlable-anchors.
  'categories:seo': ['warn', {minScore: 1}],
  ...overrides,
});

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
      assertMatrix: [
        baseConfig['basePerformanceAssertMatrix'],
        {
          matchingUrlPattern: 'http://[^/]+/$',
          assertions: buildPageAssertions(),
        },
        {
          matchingUrlPattern: 'http://[^/]+/about$',
          assertions: buildPageAssertions(),
        },
        {
          matchingUrlPattern: 'http://[^/]+/admin$',
          assertions: buildPageAssertions(),
        },
        {
          matchingUrlPattern: '^http://localhost:8181/blog-dashboard$',
          assertions: buildPageAssertions({}, 0.98),
        },
        {
          matchingUrlPattern: 'http://[^/]+/community-library$',
          assertions: buildPageAssertions(),
        },
        {
          matchingUrlPattern: 'http://[^/]+/contact$',
          assertions: buildPageAssertions(),
        },
        {
          matchingUrlPattern: 'http://[^/]+/contributor-dashboard$',
          assertions: buildPageAssertions(),
        },
        {
          matchingUrlPattern: 'http://[^/]+/creator-dashboard$',
          assertions: buildPageAssertions(),
        },
        {
          matchingUrlPattern: 'http://[^/]+/creator-guidelines$',
          assertions: buildPageAssertions(),
        },
        {
          matchingUrlPattern: 'http://[^/]+/delete-account$',
          assertions: buildPageAssertions({}, 0.98),
        },
        {
          matchingUrlPattern: 'http://[^/]+/donate$',
          assertions: buildPageAssertions(
            {
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
              'uses-responsive-images': ['error', {minScore: 0.8}],
            },
            0.98
          ),
        },
        {
          matchingUrlPattern: 'http://[^/]+/get-started$',
          assertions: buildPageAssertions({}, 0.98),
        },
        {
          matchingUrlPattern: 'http://[^/]+/learner-dashboard$',
          assertions: buildPageAssertions({
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
          }),
        },
        {
          matchingUrlPattern: 'http://[^/]+/license$',
          assertions: buildPageAssertions(),
        },
        {
          matchingUrlPattern: 'http://[^/]+/moderator$',
          assertions: buildPageAssertions({}, 0.98),
        },
        {
          matchingUrlPattern: 'http://[^/]+/preferences$',
          assertions: buildPageAssertions(),
        },
        {
          matchingUrlPattern: 'http://[^/]+/privacy-policy$',
          assertions: buildPageAssertions(),
        },
        {
          matchingUrlPattern: 'http://[^/]+/profile/username1$',
          assertions: buildPageAssertions(),
        },
        {
          matchingUrlPattern: 'http://[^/]+/signup\\?return_url=%2F$',
          assertions: buildPageAssertions(),
        },
        {
          matchingUrlPattern: 'http://[^/]+/teach$',
          assertions: buildPageAssertions(),
        },
        {
          matchingUrlPattern: 'http://[^/]+/terms$',
          assertions: buildPageAssertions(),
        },
        {
          matchingUrlPattern: 'http://[^/]+/thanks$',
          assertions: buildPageAssertions(),
        },
        {
          matchingUrlPattern: 'http://[^/]+/volunteer$',
          assertions: buildPageAssertions(),
        },
        {
          matchingUrlPattern: 'http://[^/]+/topics-and-skills-dashboard$',
          assertions: buildPageAssertions({}, 0.9),
        },
        {
          matchingUrlPattern:
            '^http://localhost:8181/learn/staging/dummy-topic-one/story$', // pylint: disable=line-too-long
          assertions: buildPageAssertions(),
        },
        {
          matchingUrlPattern:
            '^http://localhost:8181/learn/staging/dummy-topic-one/story/help-jamie-win-arcade$', // pylint: disable=line-too-long
          assertions: buildPageAssertions(),
        },
        {
          matchingUrlPattern: '^http://localhost:8181/learn/math$',
          assertions: buildPageAssertions(),
        },
        {
          matchingUrlPattern: 'http://[^/]+/create/.*$',
          assertions: buildPageAssertions({
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
          }),
        },
        {
          matchingUrlPattern: '^http://localhost:8181/explore/.*$',
          assertions: buildPageAssertions(),
        },
        {
          matchingUrlPattern: 'http://[^/]+/topic_editor/.*$',
          assertions: buildPageAssertions(),
        },
        {
          matchingUrlPattern: 'http://[^/]+/skill_editor/.*$',
          assertions: buildPageAssertions({}, 0.91),
        },
        {
          matchingUrlPattern: '^http://[^/]+/story_editor/.*$',
          assertions: buildPageAssertions({}, 0.84),
        },
      ],
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
