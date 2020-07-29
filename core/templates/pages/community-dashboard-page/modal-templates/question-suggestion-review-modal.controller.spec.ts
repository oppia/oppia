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
 * @fileoverview Unit tests for QuestionSuggestionReviewModalController.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

describe('Question Suggestion Review Modal Controller', function() {
  let $scope = null;
  let $uibModalInstance = null;
  let QuestionObjectFactory = null;
  let SuggestionModalService = null;

  const authorName = 'Username 1';
  const contentHtml = 'Content html';
  const misconceptionsBySkill = [];
  let question = null;
  const questionHeader = 'Question header';
  const reviewable = true;
  const skillDifficulty = 0.3;

  beforeEach(angular.mock.module('oppia', function($provide) {
    const ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  describe('when skill rubrics is specified', function() {
    const skillRubrics = [{
      explanations: ['explanation'],
      difficulty: 'Easy'
    }];

    beforeEach(angular.mock.inject(function($injector, $controller) {
      const $rootScope = $injector.get('$rootScope');
      QuestionObjectFactory = $injector.get('QuestionObjectFactory');
      SuggestionModalService = $injector.get('SuggestionModalService');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      spyOnAllFunctions(SuggestionModalService);

      question = QuestionObjectFactory.createFromBackendDict({
        id: '1',
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
            customization_args: {},
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

      $scope = $rootScope.$new();
      $controller('QuestionSuggestionReviewModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        authorName: authorName,
        contentHtml: contentHtml,
        misconceptionsBySkill: misconceptionsBySkill,
        question: question,
        questionHeader: questionHeader,
        reviewable: reviewable,
        skillDifficulty: skillDifficulty,
        skillRubrics: skillRubrics
      });
    }));

    it('should initialize correctly $scope properties after controller' +
      ' initialization', function() {
      expect($scope.authorName).toBe(authorName);
      expect($scope.contentHtml).toBe(contentHtml);
      expect($scope.reviewable).toBe(reviewable);
      expect($scope.reviewMessage).toBe('');
      expect($scope.question).toEqual(question);
      expect($scope.questionHeader).toBe(questionHeader);
      expect($scope.questionStateData).toEqual(question.getStateData());
      expect($scope.questionId).toEqual(question.getId());
      expect($scope.canEditQuestion).toBe(false);
      expect($scope.misconceptionsBySkill).toEqual(misconceptionsBySkill);
      expect($scope.skillDifficultyLabel).toBe('Easy');
      expect($scope.skillRubricExplanations).toEqual(['explanation']);
    });

    it('should define validation error as null when question changes',
      function() {
        expect($scope.validationError).toBe(undefined);
        $scope.questionChanged();
        expect($scope.validationError).toBe(null);
      });

    it('should accept suggestion in suggestion modal when clicking accept' +
      ' suggestion', function() {
      $scope.reviewMessage = 'Review message example';
      $scope.accept();

      expect(SuggestionModalService.acceptSuggestion).toHaveBeenCalledWith(
        $uibModalInstance, {
          action: 'accept',
          reviewMessage: 'Review message example',
          skillDifficulty: 0.3
        });
    });

    it('should reject suggestion in suggestion modal when clicking reject' +
    ' suggestion', function() {
      $scope.reviewMessage = 'Review message example';
      $scope.reject();

      expect(SuggestionModalService.rejectSuggestion).toHaveBeenCalledWith(
        $uibModalInstance, {
          action: 'reject',
          reviewMessage: 'Review message example'
        });
    });

    it('should cancel suggestion in suggestion modal when clicking cancel' +
    ' suggestion', function() {
      $scope.cancel();

      expect(SuggestionModalService.cancelSuggestion).toHaveBeenCalledWith(
        $uibModalInstance);
    });
  });

  describe('when skill rubrics is not specified', function() {
    const skillRubrics = [];

    beforeEach(angular.mock.inject(function($injector, $controller) {
      const $rootScope = $injector.get('$rootScope');
      QuestionObjectFactory = $injector.get('QuestionObjectFactory');
      SuggestionModalService = $injector.get('SuggestionModalService');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      spyOnAllFunctions(SuggestionModalService);

      question = QuestionObjectFactory.createFromBackendDict({
        id: '1',
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
            customization_args: {},
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

      $scope = $rootScope.$new();
      $controller('QuestionSuggestionReviewModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        authorName: authorName,
        contentHtml: contentHtml,
        misconceptionsBySkill: misconceptionsBySkill,
        question: question,
        questionHeader: questionHeader,
        reviewable: reviewable,
        skillDifficulty: skillDifficulty,
        skillRubrics: skillRubrics
      });
    }));

    it('should initialize correctly $scope properties after controller' +
      ' initialization', function() {
      expect($scope.skillRubricExplanations).toBe(
        'This rubric has not yet been specified.');
    });
  });
});
