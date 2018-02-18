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

describe('Exploration object factory', function() {
  beforeEach(module('oppia'));

  describe('ExplorationObjectFactory', function() {
    var scope, eof, atof, explorationDict, exploration;
    beforeEach(inject(function($rootScope, $injector) {
      scope = $rootScope.$new();
      eof = $injector.get('ExplorationObjectFactory');
      sof = $injector.get('StateObjectFactory');
      atof = $injector.get('AudioTranslationObjectFactory');

      var statesDict = {
        'first state': {
          content: {
            html: 'content',
            audio_translations: {
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
          hints: [],
          param_changes: []
        },
        'second state': {
          content: {
            html: 'more content',
            audio_translations: {
              'hi-en': {
                filename: 'myfile2.mp3',
                file_size_bytes: 120000,
                needs_update: false
              }
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
          hints: [],
          param_changes: []
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
      expect(exploration.getAllAudioLanguageCodes())
        .toEqual(['en', 'hi-en']);
    });

    it('should correctly get the content html', function() {
      expect(exploration.getUninterpolatedContentHtml('first state'))
        .toEqual('content');
    });

    it('should correctly get audio translations from an exploration',
    function() {
      expect(exploration.getAllAudioTranslations('hi-en')).toEqual({
        'first state': [atof.createFromBackendDict({
          filename: 'myfile3.mp3',
          file_size_bytes: 430000,
          needs_update: false
        })],
        'second state': [atof.createFromBackendDict({
          filename: 'myfile2.mp3',
          file_size_bytes: 120000,
          needs_update: false
        })]
      });
      expect(exploration.getAllAudioTranslations('en')).toEqual({
        'first state': [atof.createFromBackendDict({
          filename: 'myfile1.mp3',
          file_size_bytes: 210000,
          needs_update: false
        })],
        'second state': []
      });
    });
  });
});
