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
 * @fileoverview Unit tests for QuestionSuggestionService.
 */

describe('Question Suggestion Service', function() {
  let $httpBackend = null;
  let $q = null;
  let CsrfTokenService = null;
  let QuestionObjectFactory = null;
  let QuestionSuggestionService = null;
  let QuestionUndoRedoService = null;
  let SkillObjectFactory = null;
  let StateEditorService = null;

  let question = null;
  let questionId = null;
  let questionStateData = null;
  let skill = null;
  const skillDifficulty = 0.3;

  beforeEach(angular.mock.module('oppia'));

  describe('when question is valid', function() {
    beforeEach(angular.mock.inject(function($injector, $controller) {
      $httpBackend = $injector.get('$httpBackend');
      $q = $injector.get('$q');
      CsrfTokenService = $injector.get('CsrfTokenService');
      QuestionObjectFactory = $injector.get('QuestionObjectFactory');
      QuestionSuggestionService = $injector.get('QuestionSuggestionService');
      SkillObjectFactory = $injector.get('SkillObjectFactory');

      spyOn(CsrfTokenService, 'getTokenAsync')
        .and.returnValue($q.resolve('sample-csrf-token'));

      const skillContentsDict = {
        explanation: {
          html: 'test explanation',
          content_id: 'explanation',
        },
        worked_examples: [],
        recorded_voiceovers: {
          voiceovers_mapping: {}
        }
      };

      const skillDict = {
        id: '1',
        description: 'test description',
        misconceptions: [{
          id: '2',
          name: 'test name',
          notes: 'test notes',
          feedback: 'test feedback',
          must_be_addressed: false
        }],
        rubrics: [],
        skill_contents: skillContentsDict,
        language_code: 'en',
        version: 3,
      };
      skill = SkillObjectFactory.createFromBackendDict(skillDict);
      question = QuestionObjectFactory.createFromBackendDict({
        id: skill.getId(),
        question_state_data: {
          content: {
            html: 'Question 1',
            content_id: 'content_1'
          },
          interaction: {
            answer_groups: [{
              outcome: {
                dest: 'outcome 1',
                feedback: {
                  content_id: 'content_5',
                  html: ''
                },
                labelled_as_correct: true,
                param_changes: [],
                refresher_exploration_id: null
              },
              rule_specs: [],
            }],
            confirmed_unclassified_answers: [],
            customization_args: {
              placeholder: {
                value: {
                  content_id: 'ca_placeholder_0',
                  unicode_str: ''
                }
              },
              rows: { value: 1 }
            },
            default_outcome: {
              dest: null,
              feedback: {
                html: 'Correct Answer',
                content_id: 'content_2'
              },
              param_changes: [],
              labelled_as_correct: true
            },
            hints: [{
              hint_content: {
                html: 'Hint 1',
                content_id: 'content_3'
              }
            }],
            solution: {
              correct_answer: 'This is the correct answer',
              answer_is_exclusive: false,
              explanation: {
                html: 'Solution explanation',
                content_id: 'content_4'
              }
            },
            id: 'TextInput'
          },
          param_changes: [],
          recorded_voiceovers: {
            voiceovers_mapping: {}
          },
          written_translations: {
            translations_mapping: {}
          },
        },
      });
    }));

    it('should successfully submit a question', function() {
      $httpBackend.expectPOST('/suggestionhandler/').respond(200);
      var successHandler = jasmine.createSpy('success');
      let imageBlob = new Blob(
        ['data:image/png;base64,xyz'], {type: 'image/png'});
      let imageData = {
        filename: 'image.png',
        imageBlob: imageBlob
      };
      QuestionSuggestionService.submitSuggestion(
        question, skill, skillDifficulty, [imageData], successHandler);
      $httpBackend.flush();
    });
  });
});
