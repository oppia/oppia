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
        'http://127.0.0.1:8181/',
        'http://127.0.0.1:8181/about',
        'http://127.0.0.1:8181/admin',
        'http://127.0.0.1:8181/community-library',
        'http://127.0.0.1:8181/contact',
        'http://127.0.0.1:8181/contributor-dashboard',
        'http://127.0.0.1:8181/creator-dashboard',
        'http://127.0.0.1:8181/delete-account',
        'http://127.0.0.1:8181/donate',
        "http://127.0.0.1:8181/emaildashboard",
        'http://127.0.0.1:8181/get-started',
        'http://127.0.0.1:8181/learner-dashboard',
        'http://127.0.0.1:8181/nonprofits',
        "http://127.0.0.1:8181/moderator",
        'http://127.0.0.1:8181/parents',
        'http://127.0.0.1:8181/partners',
        'http://127.0.0.1:8181/preferences',
        'http://127.0.0.1:8181/privacy-policy',
        'http://127.0.0.1:8181/profile/username1',
        'http://127.0.0.1:8181/signup?return_url=%2F',
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
        `http://127.0.0.1:8181/story_editor/${process.env.story_editor}`,
      ]
    },
    'assert': {
      'assertMatrix': [
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.99}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/about$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 1}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/admin$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 1}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/community-library$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.97}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/contact$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 1}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/contributor-dashboard$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.96}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/creator-dashboard$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.83}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/delete-account$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.99}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/donate$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.98}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/emailDashboard$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 1}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/get-started$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.99}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/learner-dashboard$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.93}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/nonprofits$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 1}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/moderator$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 1}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/parents$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 1}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/partners$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 1}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/preferences$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.85}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/privacy-policy$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.99}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/profile/username1$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.99}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/signup?return_url=%2F$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 1}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/teach$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.99}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/teachers$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 1}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/topics-and-skills-dashboard$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.89}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/terms$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.99}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/thanks$',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 0.99}]
          }
        },
        {
          'matchingUrlPattern': '^http://127.0.0.1:8181/volunteers$',
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
