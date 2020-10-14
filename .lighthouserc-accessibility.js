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
      'numberOfRuns': 1,
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
          'matchingUrlPattern': '.*',
          'assertions': {
            'categories:accessibility': ['error', {'minScore': 1}]
          }
        }
      ]
    },
    'upload': {
      'target': 'temporary-public-storage'
    }
  }
};
