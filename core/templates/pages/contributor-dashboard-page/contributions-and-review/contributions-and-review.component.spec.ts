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
 * @fileoverview Unit tests for contributionsAndReview.
 */

import { TestBed } from '@angular/core/testing';
import { ContextService } from 'services/context.service';
import { MisconceptionObjectFactory } from
  'domain/skill/MisconceptionObjectFactory';

describe('Contributions and review component', function() {
  var ctrl = null;
  var $httpBackend = null;
  var $q = null;
  var $scope = null;
  var $uibModal = null;
  var contextService = null;
  var contributionAndReviewService = null;
  var csrfTokenService = null;
  var misconceptionObjectFactory = null;
  var skillBackendApiService = null;
  var userService = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(function() {
    contextService = TestBed.get(ContextService);
    spyOn(contextService, 'getExplorationId').and.returnValue('exp1');
    misconceptionObjectFactory = TestBed.get(MisconceptionObjectFactory);
  });

  describe('when user is allowed to review questions', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $q = $injector.get('$q');
      var $rootScope = $injector.get('$rootScope');
      $uibModal = $injector.get('$uibModal');
      contributionAndReviewService = $injector.get(
        'ContributionAndReviewService');
      userService = $injector.get('UserService');

      spyOn(userService, 'getUserInfoAsync').and.returnValue($q.resolve({
        isLoggedIn: () => true
      }));
      spyOn(userService, 'getUserContributionRightsData').and.returnValue(
        $q.resolve({
          can_review_translation_for_language_codes: [{}],
          can_review_questions: true
        }));
      spyOn(
        contributionAndReviewService, 'getUserCreatedTranslationSuggestions')
        .and.callFake(callback => callback({
          suggestion_1: {
            suggestion: {
              suggestion_id: 'suggestion_1',
              target_id: '1',
              suggestion_type: 'translate_content',
              change: {
                content_html: 'Translation',
                translation_html: 'Tradução'
              },
              status: 'review'
            },
            details: 'skill_1'
          }
        }));
      spyOn(
        contributionAndReviewService, 'getReviewableQuestionSuggestions')
        .and.callFake(callback => callback({
          suggestion_1: {
            suggestion: {
              suggestion_id: 'suggestion_1',
              target_id: '1',
              suggestion_type: 'translate_content',
              change: {
                skill_id: 'skill1',
                question_dict: {
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
                        rule_input_translations: {},
                        rule_types_to_inputs: {}
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
                }
              },
              status: 'review'
            },
            details: {
              skill_description: 'Skill description'
            }
          }
        }));

      $scope = $rootScope.$new();
      ctrl = $componentController('contributionsAndReview', {
        $scope: $scope,
        ContextService: contextService,
        MisconceptionObjectFactory: misconceptionObjectFactory
      });
      ctrl.$onInit();
      $scope.$apply();
      $scope.$apply();
    }));

    it('should initialize $scope properties after controller is' +
      ' initialized', function() {
      expect(ctrl.activeReviewTab).toBe('add_question');
      expect(ctrl.activeContributionTab).toBe('');
      expect(ctrl.userIsLoggedIn).toBe(true);
      expect(ctrl.userDetailsLoading).toBe(false);
      expect(ctrl.reviewTabs.length).toEqual(2);
      expect(Object.keys(ctrl.contributions)).toContain('suggestion_1');
      expect(ctrl.contributionSummaries).toEqual([{
        id: 'suggestion_1',
        heading: 'Question 1',
        subheading: 'Skill description',
        labelText: 'Awaiting review',
        labelColor: '#eeeeee',
        actionButtonTitle: 'Review'
      }]);
      expect(ctrl.contributionsDataLoading).toBe(false);
    });

    it('should open show translation suggestion modal when clicking on' +
      ' suggestion', function() {
      ctrl.switchToContributionsTab('translate_content');
      $scope.$apply();

      spyOn($uibModal, 'open').and.callThrough();
      ctrl.onClickViewSuggestion('suggestion_1');

      expect($uibModal.open).toHaveBeenCalled();
    });

    it('should resolve suggestion when closing show suggestion modal',
      function() {
        ctrl.switchToContributionsTab('translate_content');
        $scope.$apply();

        spyOn(contributionAndReviewService, 'resolveSuggestiontoExploration');
        spyOn($uibModal, 'open').and.returnValue({
          result: $q.resolve({
            action: 'add',
            reviewMessage: 'Review message',
            skillDifficulty: 'Easy'
          })
        });
        ctrl.onClickViewSuggestion('suggestion_1');
        $scope.$apply();

        expect($uibModal.open).toHaveBeenCalled();
        expect(contributionAndReviewService.resolveSuggestiontoExploration)
          .toHaveBeenCalled();
      });

    it('should not resolve suggestion when dismissing show suggestion modal',
      function() {
        ctrl.switchToContributionsTab('translate_content');
        $scope.$apply();

        spyOn(contributionAndReviewService, 'resolveSuggestiontoExploration');
        spyOn($uibModal, 'open').and.returnValue({
          result: $q.reject()
        });
        ctrl.onClickViewSuggestion('suggestion_1');
        $scope.$apply();

        expect($uibModal.open).toHaveBeenCalled();
        expect(contributionAndReviewService.resolveSuggestiontoExploration)
          .not.toHaveBeenCalled();
      });
  });

  describe('when user is not allowed to review questions', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $httpBackend = $injector.get('$httpBackend');
      $q = $injector.get('$q');
      var $rootScope = $injector.get('$rootScope');
      $uibModal = $injector.get('$uibModal');
      contributionAndReviewService = $injector.get(
        'ContributionAndReviewService');
      csrfTokenService = $injector.get('CsrfTokenService');
      skillBackendApiService = $injector.get('SkillBackendApiService');
      userService = $injector.get('UserService');

      spyOn(csrfTokenService, 'getTokenAsync').and.returnValue(
        $q.resolve('sample-csrf-token'));

      spyOn(userService, 'getUserInfoAsync').and.returnValue($q.resolve({
        isLoggedIn: () => true
      }));
      spyOn(userService, 'getUserContributionRightsData').and.returnValue(
        $q.resolve({
          can_review_translation_for_language_codes: [],
          can_review_questions: false
        }));
      spyOn(
        contributionAndReviewService, 'getUserCreatedQuestionSuggestions')
        .and.callFake(callback => callback({
          suggestion_1: {
            suggestion: {
              suggestion_id: 'suggestion_1',
              target_id: '1',
              suggestion_type: 'add_question',
              change: {
                skill_id: 'skill1',
                question_dict: {
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
                        rule_input_translations: {},
                        rule_types_to_inputs: {}
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
                }
              },
              status: 'accepted'
            },
            details: 'skill_1'
          }
        }));
      spyOn(skillBackendApiService, 'fetchSkill').and.returnValue(
        $q.resolve({
          skill: {
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
          }
        }));

      $scope = $rootScope.$new();
      ctrl = $componentController('contributionsAndReview', {
        $scope: $scope,
        ContextService: contextService,
        MisconceptionObjectFactory: misconceptionObjectFactory
      });
      ctrl.$onInit();
      $scope.$apply();
    }));

    it('should initialize $scope properties after controller is' +
      ' initialized', function() {
      expect(ctrl.activeReviewTab).toBe('');
      expect(ctrl.activeContributionTab).toBe('add_question');
      expect(ctrl.userIsLoggedIn).toBe(true);
      expect(ctrl.userDetailsLoading).toBe(false);
      expect(ctrl.reviewTabs.length).toEqual(0);
      expect(Object.keys(ctrl.contributions)).toContain('suggestion_1');
      expect(ctrl.contributionSummaries).toEqual([{
        id: 'suggestion_1',
        heading: 'Question 1',
        subheading: undefined,
        labelText: 'Accepted',
        labelColor: '#8ed274',
        actionButtonTitle: 'View'
      }]);
      expect(ctrl.contributionsDataLoading).toBe(false);
    });

    it('should get translate contributions when switching to translation' +
      ' in review tab', function() {
      spyOn(
        contributionAndReviewService, 'getReviewableTranslationSuggestions')
        .and.callFake(callback => callback({
          suggestion_1: {
            suggestion: {
              suggestion_id: 'suggestion_1',
              target_id: '1',
              suggestion_type: 'translate_content',
              change: {
                content_html: 'Translation',
                translation_html: 'Tradução'
              },
              status: 'review'
            },
            details: {
              topic_name: 'Topic 1',
              story_title: 'Story title',
              chapter_title: 'Chapter title'
            }
          }
        }));
      ctrl.switchToReviewTab('translate_content');
      $scope.$apply();

      expect(Object.keys(ctrl.contributions)).toContain('suggestion_1');
      expect(ctrl.contributionSummaries).toEqual([{
        id: 'suggestion_1',
        heading: 'Tradução',
        subheading: 'Topic 1 / Story title / Chapter title',
        labelText: 'Awaiting review',
        labelColor: '#eeeeee',
        actionButtonTitle: 'Review'
      }]);
      expect(ctrl.contributionsDataLoading).toBe(false);
    });

    it('should open show view question modal when clicking on' +
      ' question suggestion', function() {
      spyOn($uibModal, 'open').and.callThrough();
      ctrl.onClickViewSuggestion('suggestion_1');
      $scope.$apply();

      expect($uibModal.open).toHaveBeenCalled();
    });

    it('should resolve suggestion to skill when closing show question' +
      ' suggestion modal', function() {
      expect(ctrl.contributionSummaries.length).toBe(1);

      $httpBackend.expectPUT(
        '/suggestionactionhandler/skill/1/suggestion_1').respond(200);
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve({})
      });
      ctrl.onClickViewSuggestion('suggestion_1');
      $scope.$apply();
      $httpBackend.flush();

      expect($uibModal.open).toHaveBeenCalled();
      expect(ctrl.contributionSummaries.length).toBe(0);
    });

    it('should not resolve suggestion to skill when dismissing show question' +
      ' suggestion modal', function() {
      spyOn(contributionAndReviewService, 'resolveSuggestiontoSkill');
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.reject({})
      });
      ctrl.onClickViewSuggestion('suggestion_1');
      $scope.$apply();

      expect($uibModal.open).toHaveBeenCalled();
    });
  });
});
