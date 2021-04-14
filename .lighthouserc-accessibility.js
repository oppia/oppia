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
        'http://127.0.0.1:8181/signup?return_url=%2F',
        `http://127.0.0.1:8181/create/${process.env.exploration_editor}`,
        `http://127.0.0.1:8181/collection_editor/create/${process.env.collection_editor}`,
        `http://127.0.0.1:8181/topic_editor/${process.env.topic_editor}`,
        `http://127.0.0.1:8181/skill_editor/${process.env.skill_editor}`,
        `http://127.0.0.1:8181/story_editor/${process.env.story_editor}`,
      ]
    },
    'assert': {
      'assertMatrix': [
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/admin$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 1}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/emaildashboard$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 1}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/create/.*$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 1}]
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
            'categories:accessibility': ['error', {'minScore': 0.86}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/skill_editor/.*$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.92}]
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
