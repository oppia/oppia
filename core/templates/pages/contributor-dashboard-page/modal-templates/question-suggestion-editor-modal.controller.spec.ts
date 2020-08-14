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
 * @fileoverview Unit tests for QuestionSuggestionEditorModalController.
 */

describe('Question Suggestion Editor Modal Controller', function() {
  let $httpBackend = null;
  let $uibModal = null;
  let $uibModalInstance = null;
  let $q = null;
  let $scope = null;
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
      $uibModal = $injector.get('$uibModal');
      $q = $injector.get('$q');
      const $rootScope = $injector.get('$rootScope');
      CsrfTokenService = $injector.get('CsrfTokenService');
      QuestionObjectFactory = $injector.get('QuestionObjectFactory');
      QuestionSuggestionService = $injector.get('QuestionSuggestionService');
      QuestionUndoRedoService = $injector.get('QuestionUndoRedoService');
      SkillObjectFactory = $injector.get('SkillObjectFactory');
      StateEditorService = $injector.get('StateEditorService');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

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
              rule_input_translations: {},
              rule_types_to_inputs: {},
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
      questionId = question.getId();
      questionStateData = question.getStateData();

      spyOn(StateEditorService, 'isCurrentSolutionValid').and.returnValue(true);

      $scope = $rootScope.$new();
      $controller('QuestionSuggestionEditorModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        question: question,
        questionId: questionId,
        questionStateData: questionStateData,
        skill: skill,
        skillDifficulty: skillDifficulty
      });
    }));

    it('should initialize $scope properties after controller is initialized',
      function() {
        expect($scope.canEditQuestion).toBe(true);
        expect($scope.newQuestionIsBeingCreated).toBe(true);
        expect($scope.question).toEqual(question);
        expect($scope.questionId).toBe(questionId);
        expect($scope.questionStateData).toEqual(questionStateData);
        expect($scope.skillDifficulty).toBe(skillDifficulty);
        expect($scope.skillDifficultyString).toBe('Easy');
        expect($scope.skill).toEqual(skill);
      });

    it('should evaluate question validity', function() {
      expect($scope.isQuestionValid()).toBe(true);
    });

    it('should successfully submit a question', function() {
      $httpBackend.expectPOST('/suggestionhandler/').respond(200);
      $scope.done();
      $httpBackend.flush();

      expect($uibModalInstance.close).toHaveBeenCalled();
    });

    it('should dismiss modal if there is no pending changes', function() {
      spyOn(QuestionUndoRedoService, 'hasChanges').and.returnValue(false);
      $scope.cancel();
      expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
    });

    it('should dismiss modal if there is pending changes which won\'t be' +
      ' saved', function() {
      spyOn(QuestionUndoRedoService, 'hasChanges').and.returnValue(true);
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve()
      });
      $scope.cancel();
      $scope.$apply();

      expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
    });

    it('should not dismiss modal if there is pending changes which will be' +
      ' saved', function() {
      spyOn(QuestionUndoRedoService, 'hasChanges').and.returnValue(true);
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.reject()
      });
      $scope.cancel();
      $scope.$apply();

      expect($uibModalInstance.dismiss).not.toHaveBeenCalledWith('cancel');
    });
  });

  describe('when question is not valid', function() {
    beforeEach(angular.mock.inject(function($injector, $controller) {
      $uibModal = $injector.get('$uibModal');
      $q = $injector.get('$q');
      const $rootScope = $injector.get('$rootScope');
      QuestionObjectFactory = $injector.get('QuestionObjectFactory');
      QuestionSuggestionService = $injector.get('QuestionSuggestionService');
      QuestionUndoRedoService = $injector.get('QuestionUndoRedoService');
      SkillObjectFactory = $injector.get('SkillObjectFactory');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

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
        misconceptions: [],
        rubrics: [],
        skill_contents: skillContentsDict,
        language_code: 'en',
        version: 3,
      };
      skill = SkillObjectFactory.createFromBackendDict(skillDict);
      question = QuestionObjectFactory.createDefaultQuestion([skill.getId()]);
      questionId = question.getId();
      questionStateData = question.getStateData();

      $scope = $rootScope.$new();
      $controller('QuestionSuggestionEditorModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        question: question,
        questionId: questionId,
        questionStateData: questionStateData,
        skill: skill,
        skillDifficulty: skillDifficulty
      });
    }));

    it('should evaluate question validity', function() {
      expect($scope.isQuestionValid()).toBe(false);
    });

    it('should not submit question', function() {
      spyOn(QuestionSuggestionService, 'submitSuggestion').and.callThrough();
      $scope.done();

      expect(QuestionSuggestionService.submitSuggestion).not
        .toHaveBeenCalled();
      expect($uibModalInstance.close).not.toHaveBeenCalled();
    });
  });
});
