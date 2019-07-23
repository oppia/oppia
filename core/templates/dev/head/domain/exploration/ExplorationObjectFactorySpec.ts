// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Exploration object factory.
 */

// TODO(YashJipkate): Remove the following block of unnnecessary imports once
// ExplorationObjectFactory.ts is upgraded to Angular 8.
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory.ts';
import { WrittenTranslationObjectFactory } from
  'domain/exploration/WrittenTranslationObjectFactory.ts';
// ^^^ This block is to be removed.

require('domain/exploration/ExplorationObjectFactory.ts');
require('domain/exploration/VoiceoverObjectFactory.ts');
require('domain/state/StateObjectFactory.ts');

describe('Exploration object factory', function() {
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('RuleObjectFactory', new RuleObjectFactory());
    $provide.value(
      'WrittenTranslationObjectFactory',
      new WrittenTranslationObjectFactory());
  }));
  describe('ExplorationObjectFactory', function() {
    var scope, eof, atof, sof, explorationDict, exploration, vof;
    beforeEach(angular.mock.inject(function($injector, $rootScope) {
      scope = $rootScope.$new();
      eof = $injector.get('ExplorationObjectFactory');
      sof = $injector.get('StateObjectFactory');
      vof = $injector.get('VoiceoverObjectFactory');

      var statesDict = {
        'first state': {
          content: {
            content_id: 'content',
            html: 'content'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {
                en: {
                  filename: 'myfile1.mp3',
                  file_size_bytes: 210000,
                  needs_update: false
                },
                'hi-en': {
                  filename: 'myfile3.mp3',
                  file_size_bytes: 430000,
                  needs_update: false
                }
              },
              default_outcome: {}
            }
          },
          interaction: {
            answer_groups: [],
            confirmed_unclassified_answers: [],
            customization_args: {},
            default_outcome: {
              dest: 'new state',
              feedback: [],
              param_changes: []
            },
            hints: [],
            id: 'TextInput'
          },
          param_changes: [],
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {}
            }
          },
        },
        'second state': {
          content: {
            content_id: 'content',
            html: 'more content'
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {
                'hi-en': {
                  filename: 'myfile2.mp3',
                  file_size_bytes: 120000,
                  needs_update: false
                }
              },
              default_outcome: {}
            }
          },
          interaction: {
            answer_groups: [],
            confirmed_unclassified_answers: [],
            customization_args: {},
            default_outcome: {
              dest: 'new state',
              feedback: [],
              param_changes: []
            },
            hints: [],
            id: 'TextInput'
          },
          param_changes: [],
          solicit_answer_details: false,
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {}
            }
          },
        }
      };

      explorationDict = {
        id: 1,
        title: 'My Title',
        category: 'Art',
        objective: 'Your objective',
        tags: [],
        blurb: '',
        author_notes: '',
        states_schema_version: 15,
        init_state_name: 'Introduction',
        states: statesDict,
        param_specs: {},
        param_changes: [],
        version: 1
      };

      exploration = eof.createFromBackendDict(explorationDict);
      exploration.setInitialStateName('first state');
    }));

    it('should get all language codes of an exploration', function() {
      expect(exploration.getAllVoiceoverLanguageCodes())
        .toEqual(['en', 'hi-en']);
    });

    it('should correctly get the content html', function() {
      expect(exploration.getUninterpolatedContentHtml('first state'))
        .toEqual('content');
    });

    it('should correctly get audio translations from an exploration',
      function() {
        expect(exploration.getAllVoiceovers('hi-en')).toEqual({
          'first state': [vof.createFromBackendDict({
            filename: 'myfile3.mp3',
            file_size_bytes: 430000,
            needs_update: false
          })],
          'second state': [vof.createFromBackendDict({
            filename: 'myfile2.mp3',
            file_size_bytes: 120000,
            needs_update: false
          })]
        });
        expect(exploration.getAllVoiceovers('en')).toEqual({
          'first state': [vof.createFromBackendDict({
            filename: 'myfile1.mp3',
            file_size_bytes: 210000,
            needs_update: false
          })],
          'second state': []
        });
      });
  });
});
