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
        'http://127.0.0.1:8181/signup?return_url=%2F',
        'http://127.0.0.1:8181/',
        'http://127.0.0.1:8181/admin',
        'http://127.0.0.1:8181/about',
        'http://127.0.0.1:8181/community-library',
        'http://127.0.0.1:8181/contact',
        'http://127.0.0.1:8181/contributor-dashboard',
        'http://127.0.0.1:8181/creator-dashboard',
        'http://127.0.0.1:8181/delete-account',
        'http://127.0.0.1:8181/donate',
        'http://127.0.0.1:8181/get-started',
        'http://127.0.0.1:8181/learner-dashboard',
        'http://127.0.0.1:8181/nonprofits',
        'http://127.0.0.1:8181/parents',
        'http://127.0.0.1:8181/partners',
        'http://127.0.0.1:8181/preferences',
        'http://127.0.0.1:8181/privacy-policy',
        'http://127.0.0.1:8181/profile/username1',
        'http://127.0.0.1:8181/teach',
        'http://127.0.0.1:8181/teachers',
        'http://127.0.0.1:8181/terms',
        'http://127.0.0.1:8181/thanks',
        'http://127.0.0.1:8181/volunteers'
      ]
    },
    'assert': {
      'assertMatrix': [
        {
          'matchingUrlPattern': '.*',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 1}],
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
            'appcache-manifest': ['error', {'minScore': 1}],
            'errors-in-console': ['error', {'minScore': 1}],
            'uses-passive-event-listeners': ['error', {'minScore': 1}],
            'no-document-write': ['error', {'minScore': 1}],
            'external-anchors-use-rel-noopener': ['error', {'minScore': 1}],
            'geolocation-on-start': ['error', {'minScore': 1}],
            'doctype': ['error', {'minScore': 1}],
            'no-vulnerable-libraries': ['off', {'minScore': 1}],
            'js-libraries': ['error', {'minScore': 1}],
            'notification-on-start': ['error', {'minScore': 1}],
            'deprecations': ['error', {'minScore': 1}],
            'password-inputs-can-be-pasted-into': ['error', {'minScore': 1}],
            'image-aspect-ratio': ['error', {'minScore': 1}],
            'offscreen-images': ['error', {'minScore': 0.5}],
            'is-on-https': ['off', {}],
            'time-to-first-byte': ['off', {}]
          }
        },
        {
          'matchingUrlPattern': 'http://[^/]+/signup?return_url=%2F$',
          'assertions': {
            'uses-webp-images': [
              'error', {'maxLength': 0, 'strategy': 'pessimistic'}
            ]
          }
        },
        {
          'matchingUrlPattern': 'http://[^/]+/$',
          'assertions': {
            'uses-webp-images': [
              'error', {'maxLength': 0, 'strategy': 'pessimistic'}
            ]
          }
        },
        {
          'matchingUrlPattern': 'http://[^/]+/admin$',
          'assertions': {
            'uses-webp-images': [
              'error', {'maxLength': 0, 'strategy': 'pessimistic'}
            ]
          }
        },
        {
          'matchingUrlPattern': 'http://[^/]+/about$',
          'assertions': {
            'uses-webp-images': [
              'error', {'maxLength': 0, 'strategy': 'pessimistic'}
            ]
          }
        },
        {
          'matchingUrlPattern': 'http://[^/]+/community-library$',
          'assertions': {
            'uses-webp-images': [
              'error', {'maxLength': 0, 'strategy': 'pessimistic'}
            ]
          }
        },
        {
          'matchingUrlPattern': 'http://[^/]+/contact$',
          'assertions': {
            'uses-webp-images': [
              'error', {'maxLength': 0, 'strategy': 'pessimistic'}
            ]
          }
        },
        {
          'matchingUrlPattern': 'http://[^/]+/contributor-dashboard$',
          'assertions': {
            'uses-webp-images': [
              'error', {'maxLength': 0, 'strategy': 'pessimistic'}
            ]
          }
        },
        {
          'matchingUrlPattern': 'http://[^/]+/creator-dashboard$',
          'assertions': {
            'uses-webp-images': [
              'error', {'maxLength': 0, 'strategy': 'pessimistic'}
            ]
          }
        },
        {
          'matchingUrlPattern': 'http://[^/]+/delete-account$',
          'assertions': {
            'uses-webp-images': [
              'error', {'maxLength': 0, 'strategy': 'pessimistic'}
            ]
          }
        },
        {
          'matchingUrlPattern': 'http://[^/]+/donate$',
          'assertions': {
            // The YouTube embed on donate page loads images in jpg format, thus
            // we need to allow one image.
            'uses-webp-images': [
              'error', {'maxLength': 1, 'strategy': 'pessimistic'}
            ]
          }
        },
        {
          'matchingUrlPattern': 'http://[^/]+/get-started$',
          'assertions': {
            'uses-webp-images': [
              'error', {'maxLength': 0, 'strategy': 'pessimistic'}
            ]
          }
        },
        {
          'matchingUrlPattern': 'http://[^/]+/learner-dashboard$',
          'assertions': {
            'uses-webp-images': [
              'error', {'maxLength': 0, 'strategy': 'pessimistic'}
            ]
          }
        },
        {
          'matchingUrlPattern': 'http://[^/]+/nonprofits$',
          'assertions': {
            'uses-webp-images': [
              'error', {'maxLength': 0, 'strategy': 'pessimistic'}
            ]
          }
        },
        {
          'matchingUrlPattern': 'http://[^/]+/parents$',
          'assertions': {
            'uses-webp-images': [
              'error', {'maxLength': 0, 'strategy': 'pessimistic'}
            ]
          }
        },
        {
          'matchingUrlPattern': 'http://[^/]+/partners$',
          'assertions': {
            'uses-webp-images': [
              'error', {'maxLength': 0, 'strategy': 'pessimistic'}
            ]
          }
        },
        {
          'matchingUrlPattern': 'http://[^/]+/preferences$',
          'assertions': {
            'uses-webp-images': [
              'error', {'maxLength': 0, 'strategy': 'pessimistic'}
            ]
          }
        },
        {
          'matchingUrlPattern': 'http://[^/]+/privacy-policy$',
          'assertions': {
            'uses-webp-images': [
              'error', {'maxLength': 0, 'strategy': 'pessimistic'}
            ]
          }
        },
        {
          'matchingUrlPattern': 'http://[^/]+/profile/username1$',
          'assertions': {
            'uses-webp-images': [
              'error', {'maxLength': 0, 'strategy': 'pessimistic'}
            ]
          }
        },
        {
          'matchingUrlPattern': 'http://[^/]+/teach$',
          'assertions': {
            'uses-webp-images': [
              'error', {'maxLength': 0, 'strategy': 'pessimistic'}
            ]
          }
        },
        {
          'matchingUrlPattern': 'http://[^/]+/teachers$',
          'assertions': {
            'uses-webp-images': [
              'error', {'maxLength': 0, 'strategy': 'pessimistic'}
            ]
          }
        },
        {
          'matchingUrlPattern': 'http://[^/]+/terms$',
          'assertions': {
            'uses-webp-images': [
              'error', {'maxLength': 0, 'strategy': 'pessimistic'}
            ]
          }
        },
        {
          'matchingUrlPattern': 'http://[^/]+/thanks$',
          'assertions': {
            'uses-webp-images': [
              'error', {'maxLength': 0, 'strategy': 'pessimistic'}
            ]
          }
        },
        {
          'matchingUrlPattern': 'http://[^/]+/volunteers$',
          'assertions': {
            'uses-webp-images': [
              'error', {'maxLength': 0, 'strategy': 'pessimistic'}
            ]
          }
        }
      ]
    },
    'upload': {
      'target': 'temporary-public-storage'
    }
  }
};
