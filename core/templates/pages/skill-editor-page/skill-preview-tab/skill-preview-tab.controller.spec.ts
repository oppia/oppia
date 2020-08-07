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
 * @fileoverview Unit tests for skill preview tab controller.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// skill-preview-tab.component.ts is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Skill preview tab', function() {
  var $scope = null;
  var ctrl = null;
  var UrlService = null;
  var QuestionBackendApiService = null;
  var questionDict1 = {
    question_state_data: {
      content: {
        html: 'question1'
      }, interaction: {
        id: 'TextInput'
      }
    }
  };
  var questionDict2 = {
    question_state_data: {
      content: {
        html: 'question2'
      }, interaction: {
        id: 'ItemSelectionInput'
      }
    }
  };
  var questionDict3 = {
    question_state_data: {
      content: {
        html: 'question3'
      }, interaction: {
        id: 'NumericInput'
      }
    }
  };
  var questionDict4 = {
    question_state_data: {
      content: {
        html: 'question4'
      }, interaction: {
        id: 'MultipleChoiceInput'
      }
    }
  };
  var questionDict = {
    id: 'question_id',
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
          rule_input_translations_mapping: {},
          rule_inputs: {
            Equals: [
              {
                x: 10
              }
            ]
          }
        }],
        confirmed_unclassified_answers: [],
        customization_args: {},
        default_outcome: {
          dest: null,
          feedback: {
            html: 'Correct Answer',
            content_id: 'content_2'
          },
          param_changes: [],
          labelled_as_correct: false
        },
        hints: [
          {
            hint_content: {
              html: 'Hint 1',
              content_id: 'content_3'
            }
          }
        ],
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
        voiceovers_mapping: {
          content_1: {}
        }
      },
      written_translations: {
        translations_mapping: {
          content_1: {}
        }
      },
      solicit_answer_details: false
    },
    language_code: 'en',
  };


  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    var $rootScope = $injector.get('$rootScope');
    UrlService = $injector.get('UrlService');
    QuestionBackendApiService = $injector.get('QuestionBackendApiService');
    var skillId = 'df432fe';
    $scope = $rootScope.$new();
    var MockQuestionBackendApiService = {
      fetchQuestions: () => Promise.resolve([questionDict])
    };
    spyOn(UrlService, 'getSkillIdFromUrl').and.returnValue(skillId);

    ctrl = $componentController('skillPreviewTab', {
      $scope: $scope,
      QuestionBackendApiService: MockQuestionBackendApiService
    });
    ctrl.$onInit();
  }));

  it('should initialize the variables', function() {
    expect(ctrl.questionTextFilter).toEqual('');
    expect(ctrl.displayCardIsInitialized).toEqual(false);
    expect(ctrl.questionsFetched).toEqual(false);
    expect(ctrl.ALLOWED_QUESTION_INTERACTIONS).toEqual([
      'All', 'Text Input', 'Multiple Choice', 'Numeric Input',
      'Item Selection']);
  });

  it('should initialize the question card', function() {
    expect(ctrl.displayCardIsInitialized).toEqual(false);
    ctrl.initializeQuestionCard(null);
    expect(ctrl.displayCardIsInitialized).toEqual(true);
  });

  it('should filter the questions', function() {
    ctrl.questionDicts = [questionDict1, questionDict2,
      questionDict3, questionDict4];

    ctrl.questionTextFilter = 'question1';
    ctrl.applyFilters();
    expect(ctrl.displayedQuestions).toEqual([questionDict1]);

    ctrl.questionTextFilter = 'question3';
    ctrl.applyFilters();
    expect(ctrl.displayedQuestions).toEqual([questionDict3]);

    ctrl.questionTextFilter = '';
    ctrl.interactionFilter = 'Item Selection';
    ctrl.applyFilters();
    expect(ctrl.displayedQuestions).toEqual([questionDict2]);

    ctrl.interactionFilter = 'Numeric Input';
    ctrl.applyFilters();
    expect(ctrl.displayedQuestions).toEqual([questionDict3]);

    ctrl.interactionFilter = 'Multiple Choice';
    ctrl.applyFilters();
    expect(ctrl.displayedQuestions).toEqual([questionDict4]);

    ctrl.interactionFilter = 'Text Input';
    ctrl.applyFilters();
    expect(ctrl.displayedQuestions).toEqual([questionDict1]);
  });
});
