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
 * @fileoverview Configuration for accessibility.
 */

const baseConfig = require('./.lighthouserc-base.js')

module.exports = {
  'ci': {
    'collect': {
      'numberOfRuns': baseConfig['numberOfRuns'],
      'puppeteerScript': baseConfig['puppeteerScript'],
      'url': baseConfig['urlShards'][2]
    },
    'assert': {
      'assertMatrix': [
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/preferences$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.85}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/privacy-policy$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.98}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/profile/username1$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.98}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/signup?return_url=%2F$',
          'assertions': baseConfig['baseAccessibilityAssertions']
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/teach$',
          'assertions': baseConfig['baseAccessibilityAssertions']
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/topics-and-skills-dashboard$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.9}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/terms$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.98}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/thanks$',
          'assertions': baseConfig['baseAccessibilityAssertions']
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/volunteer$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.9}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/create/.*$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.91}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/collection_editor/create/.*$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.86}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/topic_editor/.*$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.84}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/skill_editor/.*$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.91}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/story_editor/.*$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.84}]
          }
        },
      ]
    },
    'upload': {
      'target': 'temporary-public-storage'
    }
  }
};
