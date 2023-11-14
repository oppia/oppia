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
      'url': baseConfig['urlShards'][1]
    },
    'assert': {
      'assertMatrix': [
        {
          'matchingUrlPattern': '^http://localhost:8181/$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 1}]
          }
        },
        {
          'matchingUrlPattern': '^http://localhost:8181/about$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.98}]
          }
        },
        {
          'matchingUrlPattern': '^http://localhost:8181/admin$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 1}]
          }
        },
        {
          'matchingUrlPattern': '^http://localhost:8181/blog-dashboard$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.98}]
          }
        },
        {
          'matchingUrlPattern': '^http://localhost:8181/community-library$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 1}]
          }
        },
        {
          'matchingUrlPattern': '^http://localhost:8181/contact$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 1}]
          }
        },
        {
          'matchingUrlPattern': '^http://localhost:8181/contributor-dashboard$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 1}]
          }
        },
        {
          'matchingUrlPattern': '^http://localhost:8181/creator-dashboard$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 1}]
          }
        },
        {
          'matchingUrlPattern': '^http://localhost:8181/delete-account$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.98}]
          }
        },
        {
          'matchingUrlPattern': '^http://localhost:8181/donate$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.98}]
          }
        },
        {
          'matchingUrlPattern': '^http://localhost:8181/emailDashboard$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 1}]
          }
        },
        {
          'matchingUrlPattern': '^http://localhost:8181/get-started$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.98}]
          }
        },
        {
          'matchingUrlPattern': '^http://localhost:8181/learner-dashboard$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 1}]
          }
        },
        {
          'matchingUrlPattern': '^http://localhost:8181/moderator$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.98}]
          }
        }
      ]
    },
    'upload': {
      'target': 'temporary-public-storage'
    }
  }
};
