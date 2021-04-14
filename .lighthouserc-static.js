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

module.exports = {
  'ci': {
    'collect': {
      'numberOfRuns': 3,
      'puppeteerScript': 'puppeteer-login-script.js',
      'url': [
        'http://127.0.0.1:8181/',
        'http://127.0.0.1:8181/about',
        'http://127.0.0.1:8181/community-library',
        'http://127.0.0.1:8181/contact',
        'http://127.0.0.1:8181/contributor-dashboard',
        'http://127.0.0.1:8181/creator-dashboard',
        'http://127.0.0.1:8181/creator-guidelines',
        'http://127.0.0.1:8181/delete-account',
        'http://127.0.0.1:8181/donate',
        'http://127.0.0.1:8181/get-started',
        'http://127.0.0.1:8181/learner-dashboard',
        'http://127.0.0.1:8181/nonprofits',
        'http://127.0.0.1:8181/moderator',
        'http://127.0.0.1:8181/parents',
      ]
    },
    'assert': {
      'assertMatrix': [
        {
          'matchingUrlPattern': '.*',
          'assertions': {
            // Performance category.
            'first-contentful-paint': [ 'warn', {'maxNumericValue': 1230000}],
            'first-meaningful-paint': ['warn', {'maxNumericValue': 1280000}],
            'first-cpu-idle': ['warn', {'maxNumericValue': 1460000}],
            'speed-index': ['warn', {'maxNumericValue': 1230000}],
            'interactive': ['warn', {'maxNumericValue': 1540000}],
            'max-potential-fid': ['warn', {'maxNumericValue': 130000}],
            'uses-responsive-images': ['error', {'minScore': 1}],
            'uses-optimized-images': ['error', {'minScore': 1}],
            'uses-rel-preconnect': ['error', {'minScore': 0.5}],
            'redirects': ['error', {'minScore': 1}],
            'uses-rel-preload': ['error', {'minScore': 1}],
            'efficient-animated-content': ['error',{'minScore': 1}],
            'offscreen-images': ['error', {'minScore': 0.45}],
            'time-to-first-byte': ['off', {}],
            // Best practices category.
            'appcache-manifest': ['error', {'minScore': 1}],
            'errors-in-console': ['error', {'minScore': 1}],
            'no-document-write': ['error', {'minScore': 1}],
            'external-anchors-use-rel-noopener': ['error', {'minScore': 1}],
            'geolocation-on-start': ['error', {'minScore': 1}],
            'doctype': ['error', {'minScore': 1}],
            'no-vulnerable-libraries': ['off', {'minScore': 1}],
            'js-libraries': ['error', {'minScore': 1}],
            'notification-on-start': ['error', {'minScore': 1}],
            'password-inputs-can-be-pasted-into': ['error', {'minScore': 1}],
            'image-aspect-ratio': ['error', {'minScore': 1}],
            'is-on-https': ['off', {}],
            'uses-http2': ['off', {}],
          }
        },
        {
          'matchingUrlPattern': 'http://[^/]+/$',
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
          'matchingUrlPattern': 'http://[^/]+/admin$',
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
          'matchingUrlPattern': 'http://[^/]+/about$',
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
          'matchingUrlPattern': 'http://[^/]+/community-library$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.97}],
            'uses-webp-images': [
              'error', {'maxLength': 0, 'strategy': 'pessimistic'}
            ],
            'uses-passive-event-listeners': ['error', {'minScore': 1}],
            'deprecations': ['error', {'minScore': 1}]
          }
        },
        {
          'matchingUrlPattern': 'http://[^/]+/contact$',
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
          'matchingUrlPattern': 'http://[^/]+/contributor-dashboard$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.96}],
            'uses-webp-images': [
              'error', {'maxLength': 0, 'strategy': 'pessimistic'}
            ],
            'uses-passive-event-listeners': ['error', {'minScore': 1}],
            'deprecations': ['error', {'minScore': 1}]
          }
        },
        {
          'matchingUrlPattern': 'http://[^/]+/creator-dashboard$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.83}],
            'uses-webp-images': [
              'error', {'maxLength': 0, 'strategy': 'pessimistic'}
            ],
            'uses-passive-event-listeners': ['error', {'minScore': 1}],
            'deprecations': ['error', {'minScore': 1}]
          }
        },
        {
          'matchingUrlPattern': 'http://[^/]+/creator-guidelines$',
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
          'matchingUrlPattern': 'http://[^/]+/delete-account$',
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
          'matchingUrlPattern': 'http://[^/]+/donate$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.98}],
            // The YouTube embed on donate page loads images in jpg format, thus
            // we need to allow one image.
            'uses-webp-images': [
              'error', {'maxLength': 1, 'strategy': 'pessimistic'}
            ],
            'uses-passive-event-listeners': ['error', {'minScore': 1}],
            'deprecations': ['error', {'minScore': 1}]
          }
        },
        {
          'matchingUrlPattern': 'http://[^/]+/get-started$',
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
          'matchingUrlPattern': 'http://[^/]+/learner-dashboard$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.93}],
            'uses-webp-images': [
              'error', {'maxLength': 0, 'strategy': 'pessimistic'}
            ],
            // We need to use passive event listeners on this page so that
            // the page works correctly.
            'uses-passive-event-listeners': ['error', {'minScore': 0}],
            'deprecations': ['error', {'minScore': 1}]
          }
        },
        {
          'matchingUrlPattern': 'http://[^/]+/nonprofits$',
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
          'matchingUrlPattern': 'http://[^/]+/moderator$',
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
          'matchingUrlPattern': 'http://[^/]+/parents$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 1}],
            'uses-webp-images': [
              'error', {'maxLength': 0, 'strategy': 'pessimistic'}
            ],
            'uses-passive-event-listeners': ['error', {'minScore': 1}],
            'deprecations': ['error', {'minScore': 1}]
          }
        },
      ]
    },
    'upload': {
      'target': 'temporary-public-storage'
    }
  }
};
