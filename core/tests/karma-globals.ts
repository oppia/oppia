// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Globals for the Karma test environment.
 */

var GLOBALS = {
  ALLOWED_INTERACTION_CATEGORIES: [],
  can_edit: true,
  can_publish: true,
  CAN_SEND_EMAILS: true,
  can_voiceover: true,
  canDelete: true,
  canEdit: true,
  canModifyRoles: true,
  canReleaseOwnership: true,
  canUnpublish: true,
  collectionId: '',
  collectionTitle: '',
  CONTINUOUS_COMPUTATIONS_DATA: [],
  csrf_token: '',
  DEFAULT_OBJECT_VALUES: {},
  DEFAULT_TWITTER_SHARE_MESSAGE_DASHBOARD: '',
  DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR: '',
  DEFAULT_TWITTER_SHARE_MESSAGE_PLAYER: '',
  DEMO_COLLECTIONS: {},
  DEMO_EXPLORATION_IDS: [],
  DEMO_EXPLORATIONS: {},
  DEV_MODE: true,
  explorationVersion: 1,
  GCS_RESOURCE_BUCKET_NAME: '',
  HUMAN_READABLE_CURRENT_TIME: '',
  iframed: false,
  INTERACTION_SPECS: {
    TextInput: {
      is_terminal: false,
      description: 'Allows learners to enter arbitrary text strings.',
      display_mode: 'inline',
      name: 'Text Input',
      is_linear: false,
      customization_arg_specs: [
        {
          default_value: '',
          name: 'placeholder',
          schema: {
            type: 'unicode'
          },
          description: 'Placeholder text (optional)'
        },
        {
          default_value: 1,
          name: 'rows',
          schema: {
            validators: [
              {
                id: 'is_at_least',
                min_value: 1
              },
              {
                id: 'is_at_most',
                max_value: 200
              }
            ],
            type: 'int'
          },
          description: 'Height (in rows)'
        }
      ],
      id: 'TextInput',
      default_outcome_heading: null,
      instructions: null,
      needs_summary: false,
      rule_descriptions: {
        StartsWith: 'starts with {{x|NormalizedString}}',
        FuzzyMatches: 'is similar to {{training_data|SetOfNormalizedString}}',
        FuzzyEquals:
          'is equal to {{x|NormalizedString}}, ' +
          'misspelled by at most one character',
        Contains: 'contains {{x|NormalizedString}}',
        CaseSensitiveEquals:
          'is equal to {{x|NormalizedString}}, taking case into account',
        Equals: 'is equal to {{x|NormalizedString}}'
      },
      is_trainable: true,
      narrow_instructions: null
    }
  },
  INVALID_PARAMETER_NAMES: [],
  isLoggedIn: true,
  LANGUAGE_CODES_AND_NAMES: [{
    code: 'en',
    name: 'English'
  }, {
    code: 'es',
    name: 'español'
  }, {
    code: 'hr',
    name: 'hrvatski'
  }],
  LOGOUT_URL: '',
  logoutUrl: '',
  ONE_OFF_JOB_SPECS: [],
  AUDIT_JOB_SPECS: [],
  PAGE_MODE: '',
  PROFILE_USERNAME: '',
  RECENT_JOB_DATA: [],
  ROLE_GRAPH_DATA: {},
  SEARCH_DROPDOWN_CATEGORIES: [],
  SHOW_TRAINABLE_UNRESOLVED_ANSWERS: '',
  SITE_FEEDBACK_FORM_URL: '',
  status_code: '',
  SUPPORTED_SITE_LANGUAGES: [{
    id: 'id',
    text: 'Bahasa Indonesia'
  }, {
    id: 'en',
    text: 'English'
  }],
  TAG_REGEX: '^[a-z ]+$',
  TOPIC_SUMMARIES: [],
  TRANSLATOR_PROVIDER_FOR_TESTS: null,
  UNFINISHED_JOB_DATA: [],
  UPDATABLE_ROLES: [],
  USER_EMAIL: 'user@example.com',
  VIEWABLE_ROLES: [],

};

/* hashes for UrlInterpolationService tests */
var hashes = {
  '/hash_test.html': 'ijklmopq',
  '/path_test/hash_test.html': '123456789',
  '/hash_test.min.js': 'zyx12345',
  '/assets_test/hash_test.json': '987654321',
  '/pages_test/hash_test.html': 'abcd12345',
  '/images/hash_test.png': '98765fghij',
  '/videos/hash_test.mp4': '12345cxz',
  '/interactions/interTest/static/interTest.png': '123654789'
};

/* This function overwrites the translationProvider for a dummy function
 * (customLoader). This is necessary to prevent the js test warnings about an
 * 'unexpected GET request' when the translationProvider tries to load the
 * translation files.
 * More info in the angular-translate documentation:
 *   http://angular-translate.github.io/docs/#/guide
 * (see the 'Unit Testing' section).
 */
GLOBALS.TRANSLATOR_PROVIDER_FOR_TESTS = function($provide, $translateProvider) {
  $provide.factory('customLoader', ['$q', function($q) {
    return function() {
      return $q.resolve({});
    };
  }]);
  $translateProvider.useLoader('customLoader');
};
