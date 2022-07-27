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
// TODO(#7222): Remove usage of importAllAngularServices once upgraded to
// Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('Question Suggestion Review Modal Controller', function() {
  let $scope = null;
  let $http = null;
  var $q = null;
  var $uibModal = null;
  let $uibModalInstance = null;
  let QuestionObjectFactory = null;
  let SiteAnalyticsService = null;
  let SuggestionModalService = null;
  let acceptSuggestionSpy = null;
  let rejectSuggestionSpy = null;
  let cancelSuggestionSpy = null;
  let skillBackendApiService = null;
  let skillObjectFactory = null;

  const authorName = 'Username 1';
  const contentHtml = 'Content html';
  const misconceptionsBySkill = [];
  let question = null;
  const questionHeader = 'Question header';
  const reviewable = true;
  const skillDifficulty = 0.3;
  const suggestionId = '123';
  let suggestion = null;
  importAllAngularServices();

  beforeEach(angular.mock.module('oppia', function($provide) {
    const ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector) {
    SuggestionModalService = $injector.get('SuggestionModalService');
    acceptSuggestionSpy = spyOn(SuggestionModalService, 'acceptSuggestion');
    rejectSuggestionSpy = spyOn(SuggestionModalService, 'rejectSuggestion');
    cancelSuggestionSpy = spyOn(SuggestionModalService, 'cancelSuggestion');
  }));

  describe('when skill rubrics is specified', function() {
    const skillRubrics = [{
      explanations: ['explanation'],
      difficulty: 'Easy'
    }];

    beforeEach(angular.mock.inject(function($injector, $controller) {
      const $rootScope = $injector.get('$rootScope');
      const $http = $injector.get('$http');
      $q = $injector.get('$q');
      $uibModal = $injector.get('$uibModal');
      skillBackendApiService = $injector.get('SkillBackendApiService');
      skillObjectFactory = $injector.get('SkillObjectFactory');
      QuestionObjectFactory = $injector.get('QuestionObjectFactory');
      SiteAnalyticsService = $injector.get('SiteAnalyticsService');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

      spyOn(
        SiteAnalyticsService,
        'registerContributorDashboardViewSuggestionForReview');

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
                dest_if_really_stuck: null,
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
              dest_if_really_stuck: null,
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
      spyOn(skillBackendApiService, 'fetchSkillAsync').and.returnValue(
        $q.resolve({
          skill: skillObjectFactory.createFromBackendDict({
            id: 'skill1',
            description: 'test description 1',
            misconceptions: [{
              id: '2',
              name: 'test name',
              notes: 'test notes',
              feedback: 'test feedback',
              must_be_addressed: true
            }],
            rubrics: [{
              difficulty: 'Easy',
              explanations: ['explanation']
            }],
            skill_contents: {
              explanation: {
                html: 'test explanation',
                content_id: 'explanation',
              },
              worked_examples: [],
              recorded_voiceovers: {
                voiceovers_mapping: {}
              }
            },
            language_code: 'en',
            version: 3,
            prerequisite_skill_ids: ['skill_1']
          })
        }));

      suggestion = {
        status: 'accepted',
        change: {
          skill_id: 'skill_1'
        }
      };

      $scope = $rootScope.$new();
      $controller('QuestionSuggestionReviewModalController', {
        $http: $http,
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        authorName: authorName,
        contentHtml: contentHtml,
        misconceptionsBySkill: misconceptionsBySkill,
        question: question,
        questionHeader: questionHeader,
        reviewable: reviewable,
        skillDifficulty: skillDifficulty,
        skillRubrics: skillRubrics,
        suggestion: suggestion,
        suggestionId: suggestionId,
        editSuggestionCallback: () => {}
      });
    }));

    it('should open edit question modal when clicking on' +
      ' edit button', function() {
      spyOn($uibModal, 'open').and.callThrough();

      $scope.edit();
      $scope.$apply();

      expect($uibModal.open).toHaveBeenCalled();
    });

    it('should return nothing when edit question modal is' +
      ' resolved', function() {
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve({})
      });

      $scope.edit();
      $scope.$apply();

      expect($uibModal.open).toHaveBeenCalled();
    });

    it('should initialize $scope properties after controller is initialized',
      function() {
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

    it('should register Contributor Dashboard view suggestion for review' +
      ' event after controller is initialized', function() {
      expect(
        // eslint-disable-next-line max-len
        SiteAnalyticsService.registerContributorDashboardViewSuggestionForReview)
        .toHaveBeenCalledWith('Question');
    });

    it('should reset validation error message when user updates question',
      function() {
        $scope.validationError = 'This is an error message';
        $scope.questionChanged();
        expect($scope.validationError).toBe(null);
      });

    it('should accept suggestion in suggestion modal when clicking accept' +
      ' suggestion', function() {
      spyOn(
        SiteAnalyticsService,
        'registerContributorDashboardAcceptSuggestion');
      $scope.reviewMessage = 'Review message example';

      $scope.accept();

      expect(
        SiteAnalyticsService.registerContributorDashboardAcceptSuggestion)
        .toHaveBeenCalledWith('Question');
      expect(acceptSuggestionSpy).toHaveBeenCalledWith(
        $uibModalInstance, {
          action: 'accept',
          reviewMessage: 'Review message example',
          skillDifficulty: 0.3
        });
    });

    it('should reject suggestion in suggestion modal when clicking reject' +
    ' suggestion button', function() {
      spyOn(
        SiteAnalyticsService,
        'registerContributorDashboardRejectSuggestion');
      $scope.reviewMessage = 'Review message example';

      $scope.reject();

      expect(
        SiteAnalyticsService.registerContributorDashboardRejectSuggestion)
        .toHaveBeenCalledWith('Question');
      expect(rejectSuggestionSpy).toHaveBeenCalledWith(
        $uibModalInstance, {
          action: 'reject',
          reviewMessage: 'Review message example'
        });
    });

    it('should cancel suggestion in suggestion modal when clicking cancel' +
    ' suggestion button', function() {
      $scope.cancel();

      expect(cancelSuggestionSpy).toHaveBeenCalledWith(
        $uibModalInstance);
    });
  });

  describe('when skill rubrics is not specified', function() {
    const skillRubrics = [];

    beforeEach(angular.mock.inject(function($injector, $controller) {
      const $rootScope = $injector.get('$rootScope');
      QuestionObjectFactory = $injector.get('QuestionObjectFactory');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

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
                dest_if_really_stuck: null,
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
              dest_if_really_stuck: null,
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
      suggestion = { status: 'accepted' };
      $controller('QuestionSuggestionReviewModalController', {
        $http: $http,
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        authorName: authorName,
        contentHtml: contentHtml,
        misconceptionsBySkill: misconceptionsBySkill,
        question: question,
        questionHeader: questionHeader,
        reviewable: reviewable,
        skillDifficulty: skillDifficulty,
        skillRubrics: skillRubrics,
        suggestion: suggestion,
        suggestionId: suggestionId,
        editSuggestionCallback: () => {}
      });
    }));

    it('should initialize $scope properties after controller is initialized',
      function() {
        expect($scope.skillRubricExplanations).toBe(
          'This rubric has not yet been specified.');
      });
  });

  describe('when a suggestion is rejected', function() {
    let $rootScope = null;
    let $q = null;
    let ThreadDataBackendApiService = null;

    beforeEach(angular.mock.inject(function($injector, $controller) {
      $rootScope = $injector.get('$rootScope');
      $q = $injector.get('$q');
      ThreadDataBackendApiService = $injector.get(
        'ThreadDataBackendApiService');

      const skillRubrics = [{
        explanations: ['explanation'],
        difficulty: 'Easy'
      }];

      QuestionObjectFactory = $injector.get('QuestionObjectFactory');

      $uibModalInstance = jasmine.createSpyObj(
        '$uibModalInstance', ['close', 'dismiss']);

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
                dest_if_really_stuck: null,
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
              dest_if_really_stuck: null,
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
      suggestion = { status: 'rejected' };
      $controller('QuestionSuggestionReviewModalController', {
        $scope: $scope,
        $uibModalInstance: $uibModalInstance,
        authorName: authorName,
        contentHtml: contentHtml,
        misconceptionsBySkill: misconceptionsBySkill,
        question: question,
        questionHeader: questionHeader,
        reviewable: false,
        skillDifficulty: skillDifficulty,
        skillRubrics: skillRubrics,
        suggestion: suggestion,
        suggestionId: suggestionId,
        editSuggestionCallback: () => {}
      });
    }));

    it('should fetch the rejection message', function() {
      const messages = [
        { text: 'Question submitted.' },
        { text: 'This is a rejection.' }
      ];

      const fetchMessagesAsyncSpy = spyOn(
        ThreadDataBackendApiService, 'fetchMessagesAsync')
        .and.returnValue($q.resolve({
          messages: messages
        }));

      $scope.init();
      $rootScope.$apply();

      expect(fetchMessagesAsyncSpy).toHaveBeenCalledWith('123');
      expect($scope.reviewMessage).toBe('This is a rejection.');
    });
  });
});
