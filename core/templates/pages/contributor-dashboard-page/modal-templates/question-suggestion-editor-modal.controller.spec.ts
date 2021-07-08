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
// TODO(#7222): Remove usage of importAllAngularServices once upgraded to
// Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('Question Suggestion Editor Modal Controller', function() {
  let $uibModal = null;
  let $uibModalInstance = null;
  let $q = null;
  let $scope = null;
  let $flushPendingTasks = null;
  let AlertsService = null;
  let CsrfTokenService = null;
  let QuestionObjectFactory = null;
  let QuestionSuggestionBackendApiService = null;
  let QuestionUndoRedoService = null;
  let SiteAnalyticsService = null;
  let SkillObjectFactory = null;
  let StateEditorService = null;

  let question = null;
  let questionId = null;
  let questionStateData = null;
  let skill = null;
  let skillDifficulty = 0.3;
  importAllAngularServices();

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.service('QuestionSuggestionBackendApiService', function() {
      this.submitSuggestionAsync = function(
          question, associatedSkill, skillDifficulty, imagesData) {
        return {
          then: (successCallback, errorCallback) => {
            successCallback();
          }
        };
      };
    });
  }));

  describe('when question is valid', function() {
    beforeEach(angular.mock.inject(function($injector, $controller) {
      $uibModal = $injector.get('$uibModal');
      $q = $injector.get('$q');
      const $rootScope = $injector.get('$rootScope');
      $flushPendingTasks = $injector.get('$flushPendingTasks');
      AlertsService = $injector.get('AlertsService');
      CsrfTokenService = $injector.get('CsrfTokenService');
      QuestionObjectFactory = $injector.get('QuestionObjectFactory');
      QuestionSuggestionBackendApiService =
      $injector.get('QuestionSuggestionBackendApiService');
      QuestionUndoRedoService = $injector.get('QuestionUndoRedoService');
      SiteAnalyticsService = $injector.get('SiteAnalyticsService');
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
        inapplicable_skill_misconception_ids: ['1-2']
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

    it('should show alert when suggestion is submitted', function() {
      spyOn(AlertsService, 'addSuccessMessage');
      $scope.done();
      expect(AlertsService.addSuccessMessage)
        .toHaveBeenCalledWith('Submitted question for review.');
    });

    it('should register Contributor Dashboard submit suggestion event on' +
      ' submit', function() {
      spyOn(
        SiteAnalyticsService,
        'registerContributorDashboardSubmitSuggestionEvent');
      $scope.done();
      expect(
        SiteAnalyticsService.registerContributorDashboardSubmitSuggestionEvent)
        .toHaveBeenCalledWith('Question');
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

    it('should open skill difficulty selection modal on clicking' +
        ' change difficulty icon', function() {
      var uibSpy = spyOn($uibModal, 'open').and.callThrough();
      $scope.onClickChangeDifficulty();
      $scope.$apply();
      $flushPendingTasks();
      expect(uibSpy).toHaveBeenCalled();
    });

    it('should change skill difficulty when skill difficulty' +
      ' is edited via skill difficulty modal', function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve({
          skillDifficulty: 0.6
        })
      });
      $scope.onClickChangeDifficulty();
      $scope.$apply();
      $flushPendingTasks();
      expect($scope.skillDifficulty).toBe(0.6);
      expect($scope.skillDifficultyString).toBe('Medium');
    });

    it('should set the correct skill difficulty string', function() {
      $scope.setDifficultyString(0.6);
      expect($scope.skillDifficultyString).toBe('Medium');
      $scope.setDifficultyString(0.9);
      expect($scope.skillDifficultyString).toBe('Hard');
      $scope.setDifficultyString(0.3);
      expect($scope.skillDifficultyString).toBe('Easy');
    });

    it('should dismiss modal if cancel button is clicked', function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.reject()
      });
      $scope.onClickChangeDifficulty();
      $scope.cancel();
      $scope.$apply();
      expect($uibModalInstance.dismiss).toHaveBeenCalledWith('cancel');
    });
  });
  describe('when question is not valid', function() {
    beforeEach(angular.mock.inject(function($injector, $controller) {
      $uibModal = $injector.get('$uibModal');
      $q = $injector.get('$q');
      const $rootScope = $injector.get('$rootScope');
      QuestionObjectFactory = $injector.get('QuestionObjectFactory');
      QuestionSuggestionBackendApiService =
      $injector.get('QuestionSuggestionBackendApiService');
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
      spyOn(QuestionSuggestionBackendApiService, 'submitSuggestionAsync')
        .and.callThrough();
      $scope.done();

      expect(QuestionSuggestionBackendApiService.submitSuggestionAsync).not
        .toHaveBeenCalled();
      expect($uibModalInstance.close).not.toHaveBeenCalled();
    });
  });
});
