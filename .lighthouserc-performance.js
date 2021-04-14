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

 module.exports = {
    'ci': {
      'collect': {
        'numberOfRuns': 3,
        'puppeteerScript': 'puppeteer-login-script.js',
        'url': [
          'http://127.0.0.1:8181/admin',
          'http://127.0.0.1:8181/emaildashboard',
          'http://127.0.0.1:8181/partners',
          'http://127.0.0.1:8181/preferences',
          'http://127.0.0.1:8181/privacy-policy',
          'http://127.0.0.1:8181/profile/username1',
          'http://127.0.0.1:8181/teach',
          'http://127.0.0.1:8181/teachers',
          'http://127.0.0.1:8181/topics-and-skills-dashboard',
          'http://127.0.0.1:8181/terms',
          'http://127.0.0.1:8181/thanks',
          'http://127.0.0.1:8181/volunteers',
          `http://127.0.0.1:8181/create/${process.env.exploration_editor}`,
          `http://127.0.0.1:8181/collection_editor/create/${process.env.collection_editor}`,
          `http://127.0.0.1:8181/topic_editor/${process.env.topic_editor}`,
          `http://127.0.0.1:8181/skill_editor/${process.env.skill_editor}`,
        ]
      },
      'assert': {
        'assertMatrix': [
          {
            'matchingUrlPattern': '^http://127.0.0.1:8181/admin$',
            'assertions': {
              'categories:accessibility': ['error', {'minScore': 1}],
              'uses-webp-images': [
                'error', {'maxLength': 0, 'strategy': 'pessimistic'}
              ],
              'uses-passive-event-listeners': ['error', {'minScore': 1}],
              'deprecations': ['error', {'minScore': 1}]
            }
          },
          {
            'matchingUrlPattern': '^http://127.0.0.1:8181/emaildashboard$',
            'assertions': {
              'categories:accessibility': ['error', {'minScore': .93}],
              'uses-webp-images': [
                'error', {'maxLength': 0, 'strategy': 'pessimistic'}
              ],
              'uses-passive-event-listeners': ['error', {'minScore': 1}],
              'deprecations': ['error', {'minScore': 1}]
            }
          },
          {
            'matchingUrlPattern': '^http://127.0.0.1:8181/partners$',
            'assertions': {
              'categories:accessibility': ['error', {'minScore': 1}],
              'uses-webp-images': [
                'error', {'maxLength': 0, 'strategy': 'pessimistic'}
              ],
              'uses-passive-event-listeners': ['error', {'minScore': 1}],
              'deprecations': ['error', {'minScore': 1}]
            }
          },
          {
            'matchingUrlPattern': '^http://127.0.0.1:8181/preferences$',
            'assertions': {
              'categories:accessibility': ['error', {'minScore': 0.85}],
              'uses-webp-images': [
                'error', {'maxLength': 0, 'strategy': 'pessimistic'}
              ],
              'uses-passive-event-listeners': ['error', {'minScore': 1}],
              'deprecations': ['error', {'minScore': 1}]
            }
          },
          {
            'matchingUrlPattern': '^http://127.0.0.1:8181/privacy-policy$',
            'assertions': {
              'categories:accessibility': ['error', {'minScore': 0.99}],
              'uses-webp-images': [
                'error', {'maxLength': 0, 'strategy': 'pessimistic'}
              ],
              'uses-passive-event-listeners': ['error', {'minScore': 1}],
              'deprecations': ['error', {'minScore': 1}]
            }
          },
          {
            'matchingUrlPattern': '^http://127.0.0.1:8181/profile/username1$',
            'assertions': {
              'categories:accessibility': ['error', {'minScore': 0.99}],
              'uses-webp-images': [
                'error', {'maxLength': 0, 'strategy': 'pessimistic'}
              ],
              'uses-passive-event-listeners': ['error', {'minScore': 1}],
              'deprecations': ['error', {'minScore': 1}]
            }
          },
          {
            'matchingUrlPattern': '^http://127.0.0.1:8181/signup?return_url=%2F$',
            'assertions': {
              'categories:accessibility': ['error', {'minScore': 1}],
              'uses-webp-images': [
                'error', {'maxLength': 0, 'strategy': 'pessimistic'}
              ],
              'uses-passive-event-listeners': ['error', {'minScore': 1}],
              'deprecations': ['error', {'minScore': 1}]
            }
          },
          {
            'matchingUrlPattern': '^http://127.0.0.1:8181/teach$',
            'assertions': {
              'categories:accessibility': ['error', {'minScore': 0.99}],
              'uses-webp-images': [
                'error', {'maxLength': 0, 'strategy': 'pessimistic'}
              ],
              'uses-passive-event-listeners': ['error', {'minScore': 1}],
              'deprecations': ['error', {'minScore': 1}]
            }
          },
          {
            'matchingUrlPattern': '^http://127.0.0.1:8181/teachers$',
            'assertions': {
              'categories:accessibility': ['error', {'minScore': 1}],
              'uses-webp-images': [
                'error', {'maxLength': 0, 'strategy': 'pessimistic'}
              ],
              'uses-passive-event-listeners': ['error', {'minScore': 1}],
              'deprecations': ['error', {'minScore': 1}]
            }
          },
          {
            'matchingUrlPattern': '^http://127.0.0.1:8181/topics-and-skills-dashboard$',
            'assertions': {
              'categories:accessibility': ['error', {'minScore': 0.89}],
              'uses-webp-images': [
                'error', {'maxLength': 0, 'strategy': 'pessimistic'}
              ],
              'uses-passive-event-listeners': ['error', {'minScore': 1}],
              'deprecations': ['error', {'minScore': 1}]
            }
          },
          {
            'matchingUrlPattern': '^http://127.0.0.1:8181/terms$',
            'assertions': {
              'categories:accessibility': ['error', {'minScore': 0.99}],
              'uses-webp-images': [
                'error', {'maxLength': 0, 'strategy': 'pessimistic'}
              ],
              'uses-passive-event-listeners': ['error', {'minScore': 1}],
              'deprecations': ['error', {'minScore': 1}]
            }
          },
          {
            'matchingUrlPattern': '^http://127.0.0.1:8181/thanks$',
            'assertions': {
              'categories:accessibility': ['error', {'minScore': 0.99}],
              'uses-webp-images': [
                'error', {'maxLength': 0, 'strategy': 'pessimistic'}
              ],
              'uses-passive-event-listeners': ['error', {'minScore': 1}],
              'deprecations': ['error', {'minScore': 1}]
            }
          },
          {
            'matchingUrlPattern': '^http://127.0.0.1:8181/volunteers$',
            'assertions': {
              'categories:accessibility': ['error', {'minScore': 1}],
              'uses-webp-images': [
                'error', {'maxLength': 0, 'strategy': 'pessimistic'}
              ],
              'uses-passive-event-listeners': ['error', {'minScore': 1}],
              'deprecations': ['error', {'minScore': 1}]
            }
          },
          {
            'matchingUrlPattern': '^http://127.0.0.1:8181/create/.*$',
            'assertions': {
              'categories:accessibility': ['error', {'minScore': 1}],
              'uses-webp-images': [
                'error', {'maxLength': 0, 'strategy': 'pessimistic'}
              ],
              // We need to use passive event listeners on this page so that
              // the page works correctly.
              'uses-passive-event-listeners': ['error', {'minScore': 0}],
              // MIDI library uses some deprecated API.
              'deprecations': ['error', {'minScore': 0}]
            }
          },
          {
            'matchingUrlPattern': '^http://127.0.0.1:8181/collection_editor/create/.*$',
            'assertions': {
              'categories:accessibility': ['error', {'minScore': 0.86}],
              'uses-webp-images': [
                'error', {'maxLength': 0, 'strategy': 'pessimistic'}
              ],
              'uses-passive-event-listeners': ['error', {'minScore': 1}],
              'deprecations': ['error', {'minScore': 1}]
            }
          },
          {
            'matchingUrlPattern': '^http://127.0.0.1:8181/topic_editor/.*$',
            'assertions': {
              'categories:accessibility': ['error', {'minScore': 0.86}],
              'uses-webp-images': [
                'error', {'maxLength': 0, 'strategy': 'pessimistic'}
              ],
              'uses-passive-event-listeners': ['error', {'minScore': 1}],
              'deprecations': ['error', {'minScore': 1}]
            }
          },
          {
            'matchingUrlPattern': '^http://127.0.0.1:8181/skill_editor/.*$',
            'assertions': {
              'categories:accessibility': ['error', {'minScore': 0.92}],
              'uses-webp-images': [
                'error', {'maxLength': 0, 'strategy': 'pessimistic'}
              ],
              'uses-passive-event-listeners': ['error', {'minScore': 1}],
              'deprecations': ['error', {'minScore': 1}]
            }
          },
          {
            'matchingUrlPattern': '^http://127.0.0.1:8181/story_editor/.*$',
            'assertions': {
              'categories:accessibility': ['error', {'minScore': 0.86}]
            }
          },
        ]
      },
      'upload': {
        'target': 'temporary-public-storage'
      }
    }
  };
