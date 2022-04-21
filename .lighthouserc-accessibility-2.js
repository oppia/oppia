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
      'settings': {
        'maxWaitForLoad': 120 * 1000,  // Increase timeout for pages to load to 7 minutes.
      },
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
      ]
    },
    'upload': {
      'target': 'temporary-public-storage'
    }
  }
};
