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

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { fakeAsync, tick } from '@angular/core/testing';
import { EventEmitter } from '@angular/core';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
// ^^^ This block is to be removed.

import { ExplorationOpportunitySummary } from 'domain/opportunity/exploration-opportunity-summary.model';
import { ContributorDashboardConstants } from 'pages/contributor-dashboard-page/contributor-dashboard-page.constants';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

class MockNgbModalRef {
  componentInstance: {
    suggestionIdToContribution: null;
    initialSuggestionId: null;
    reviewable: null;
    subheading: null;
  };
}

describe('Contributions and review component', function() {
  var ctrl = null;
  var $httpBackend = null;
  var $q = null;
  var $scope = null;
  var $uibModal = null;
  let ngbModal: NgbModal = null;
  var contextService = null;
  var contributionAndReviewService = null;
  var contributionOpportunitiesService = null;
  var csrfTokenService = null;
  var misconceptionObjectFactory = null;
  var skillBackendApiService = null;
  var skillObjectFactory = null;
  var translationTopicService = null;
  var userService = null;
  var getUserCreatedTranslationSuggestionsAsyncSpy = null;

  const mockActiveTopicEventEmitter = new EventEmitter();

  beforeEach(angular.mock.module('oppia'));

  importAllAngularServices();

  describe('when user is allowed to review questions', function() {
    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.value('NgbModal', {
        open: () => {
          return {
            result: Promise.resolve()
          };
        }
      });
    }));

    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $q = $injector.get('$q');
      var $rootScope = $injector.get('$rootScope');
      $uibModal = $injector.get('$uibModal');
      ngbModal = $injector.get('NgbModal');
      contributionAndReviewService = $injector.get(
        'ContributionAndReviewService');
      userService = $injector.get('UserService');
      contextService = $injector.get('ContextService');
      skillBackendApiService = $injector.get('SkillBackendApiService');
      contributionOpportunitiesService = $injector.get(
        'ContributionOpportunitiesService');
      translationTopicService = $injector.get('TranslationTopicService');
      spyOn(contextService, 'getExplorationId').and.returnValue('exp1');
      misconceptionObjectFactory = $injector.get('MisconceptionObjectFactory');

      spyOn(userService, 'getUserInfoAsync')
        .and.returnValue($q.resolve({
          isLoggedIn: () => true
        }));
      spyOn(userService, 'getUserContributionRightsDataAsync')
        .and.returnValue($q.resolve({
          can_review_translation_for_language_codes: [{}],
          can_review_questions: true
        }));
      spyOn(
        contributionOpportunitiesService,
        'getReviewableTranslationOpportunitiesAsync'
      ).and.returnValue(
        Promise.resolve({
          opportunities: [
            ExplorationOpportunitySummary.createFromBackendDict({
              id: '1',
              topic_name: 'Topic 1',
              story_title: 'Story 1',
              chapter_title: 'Chapter 1',
              content_count: 1,
              translation_counts: {
                en: 2
              },
              translation_in_review_counts: {
                en: 2
              }
            }),
            ExplorationOpportunitySummary.createFromBackendDict({
              id: '2',
              topic_name: 'Topic 2',
              story_title: 'Story 2',
              chapter_title: 'Chapter 2',
              content_count: 2,
              translation_counts: {
                en: 4
              },
              translation_in_review_counts: {
                en: 4
              }
            })
          ],
          more: false
        }));
      spyOn(
        contributionAndReviewService,
        'getUserCreatedTranslationSuggestionsAsync').and.returnValue(
        Promise.resolve({
          suggestionIdToDetails: {
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
          },
          more: false
        }));
      getUserCreatedTranslationSuggestionsAsyncSpy = spyOn(
        contributionAndReviewService, 'getReviewableQuestionSuggestionsAsync')
        .and.returnValue(Promise.resolve({
          suggestionIdToDetails: {
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
                  }
                },
                status: 'review'
              },
              details: {
                skill_description: 'Skill description'
              }
            }
          },
          more: false
        }));
      spyOnProperty(translationTopicService, 'onActiveTopicChanged')
        .and.returnValue(mockActiveTopicEventEmitter);

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
      expect(ctrl.activeTabType).toBe('reviews');
      expect(ctrl.activeSuggestionType).toBe('add_question');
      expect(ctrl.activeDropdownTabChoice).toBe('Review Questions');
      expect(ctrl.userIsLoggedIn).toBe(true);
      expect(ctrl.userDetailsLoading).toBe(false);
      expect(ctrl.reviewTabs.length).toEqual(2);
      expect(ctrl.activeExplorationId).toBeNull();
    });

    it('should clear activeExplorationId when active topic changes',
      fakeAsync(function() {
        ctrl.onClickReviewableTranslations('explorationId');
        expect(ctrl.activeExplorationId).toBe('explorationId');

        mockActiveTopicEventEmitter.emit();
        tick();

        expect(ctrl.activeExplorationId).toBeNull();
      }));

    describe('ctrl.isReviewTranslationsTab', () => {
      it('should return true on Review Translations tab', function() {
        ctrl.switchToTab(ctrl.TAB_TYPE_REVIEWS, 'translate_content');
        expect(ctrl.isReviewTranslationsTab()).toBeTrue();
      });

      it('should return false on Review Questions tab', function() {
        ctrl.switchToTab(ctrl.TAB_TYPE_REVIEWS, 'add_question');
        expect(ctrl.isReviewTranslationsTab()).toBeFalse();
      });

      it('should return false on Translation Contributions tab', function() {
        ctrl.switchToTab(ctrl.TAB_TYPE_CONTRIBUTIONS, 'translate_content');
        expect(ctrl.isReviewTranslationsTab()).toBeFalse();
      });

      it('should return false on Question Contributions tab', function() {
        ctrl.switchToTab(ctrl.TAB_TYPE_CONTRIBUTIONS, 'add_question');
        expect(ctrl.isReviewTranslationsTab()).toBeFalse();
      });
    });

    describe('ctrl.onClickReviewableTranslations', () => {
      it('should set activeExplorationId', function() {
        expect(ctrl.activeExplorationId).toBeNull();
        ctrl.onClickReviewableTranslations('explorationId');
        expect(ctrl.activeExplorationId).toBe('explorationId');
      });
    });

    describe('ctrl.onClickBackToReviewableLessons', () => {
      it('should clear activeExplorationId', function() {
        ctrl.onClickReviewableTranslations('explorationId');
        expect(ctrl.activeExplorationId).toBe('explorationId');
        ctrl.onClickBackToReviewableLessons();
        expect(ctrl.activeExplorationId).toBeNull();
      });
    });

    describe('ctrl.loadContributions', () => {
      it('should load contributions correctly', () => {
        ctrl.loadContributions().then(({opportunitiesDicts, more}) => {
          expect(Object.keys(ctrl.contributions)).toContain('suggestion_1');
          expect(opportunitiesDicts).toEqual([{
            id: 'suggestion_1',
            heading: 'Question 1',
            subheading: 'Skill description',
            labelText: 'Awaiting review',
            labelColor: '#eeeeee',
            actionButtonTitle: 'Review'
          }]);
          expect(more).toEqual(false);
        });
      });

      it('should return empty list if tab is not initialized', () => {
        ctrl.activeTabType = null;
        ctrl.loadContributions().then(({opportunitiesDicts, more}) => {
          expect(ctrl.contributions).toEqual({});
          expect(opportunitiesDicts).toEqual([]);
          expect(more).toEqual(false);
        });
      });

      it('should return empty list if suggestion type is not initialized',
        () => {
          ctrl.activeTabType = null;
          ctrl.loadContributions().then(({opportunitiesDicts, more}) => {
            expect(ctrl.contributions).toEqual({});
            expect(opportunitiesDicts).toEqual([]);
            expect(more).toEqual(false);
          });
        });
    });

    describe('ctrl.loadReviewableTranslationOpportunities', () => {
      it('should load opportunities correctly', () => {
        ctrl.loadReviewableTranslationOpportunities().then(
          ({opportunitiesDicts, more}) => {
            expect(opportunitiesDicts).toEqual([
              {
                id: '1',
                heading: 'Chapter 1',
                subheading: 'Topic 1 - Story 1',
                actionButtonTitle: 'Translations'
              },
              {
                id: '2',
                heading: 'Chapter 2',
                subheading: 'Topic 2 - Story 2',
                actionButtonTitle: 'Translations'
              }
            ]);
            expect(more).toEqual(false);
          });
      });
    });

    describe('ctrl.loadOpportunities', () => {
      it('should load contributions correctly', () => {
        ctrl.loadOpportunities().then(({opportunitiesDicts, more}) => {
          expect(Object.keys(ctrl.contributions)).toContain('suggestion_1');
          expect(opportunitiesDicts).toEqual([{
            id: 'suggestion_1',
            heading: 'Question 1',
            subheading: 'Skill description',
            labelText: 'Awaiting review',
            labelColor: '#eeeeee',
            actionButtonTitle: 'Review'
          }]);
          expect(more).toEqual(false);
        });

        // Repeated calls should return the same results.
        ctrl.loadOpportunities().then(({opportunitiesDicts, more}) => {
          expect(Object.keys(ctrl.contributions)).toContain('suggestion_1');
          expect(opportunitiesDicts).toEqual([{
            id: 'suggestion_1',
            heading: 'Question 1',
            subheading: 'Skill description',
            labelText: 'Awaiting review',
            labelColor: '#eeeeee',
            actionButtonTitle: 'Review'
          }]);
          expect(more).toEqual(false);
        });
      });
    });

    describe('ctrl.loadMoreOpportunities', () => {
      it('should load contributions correctly', () => {
        ctrl.loadMoreOpportunities().then(({opportunitiesDicts, more}) => {
          expect(Object.keys(ctrl.contributions)).toContain('suggestion_1');
          expect(opportunitiesDicts).toEqual([{
            id: 'suggestion_1',
            heading: 'Question 1',
            subheading: 'Skill description',
            labelText: 'Awaiting review',
            labelColor: '#eeeeee',
            actionButtonTitle: 'Review'
          }]);
          expect(more).toEqual(false);
        });

        getUserCreatedTranslationSuggestionsAsyncSpy
          .and.returnValue(Promise.resolve({}));

        // Subsequent calls should return the next batch of results.
        ctrl.loadMoreOpportunities().then(({opportunitiesDicts, more}) => {
          expect(Object.keys(ctrl.contributions).length).toBe(0);
          expect(opportunitiesDicts.length).toBe(0);
          expect(more).toEqual(false);
        });
      });
    });

    it('should open show translation suggestion modal when clicking on' +
      ' suggestion', function() {
      contributionOpportunitiesService
        .reloadOpportunitiesEventEmitter.subscribe(() => {
          ctrl.loadContributions().then(() => {
            spyOn($uibModal, 'open').and.callThrough();
            ctrl.onClickViewSuggestion('suggestion_1');

            expect($uibModal.open).toHaveBeenCalled();
          });
        });

      ctrl.switchToTab(ctrl.TAB_TYPE_CONTRIBUTIONS, 'translate_content');
      $scope.$apply();
    });

    it('should remove resolved suggestions when suggestion ' +
      'modal is opened and remove button is clicked', fakeAsync(function() {
      spyOn(ngbModal, 'open').and.returnValue(
        {
          componentInstance: MockNgbModalRef,
          result: Promise.resolve(['id1', 'id2'])
        } as NgbModalRef
      );
      const removeSpy = spyOn(
        contributionOpportunitiesService.removeOpportunitiesEventEmitter,
        'emit').and.returnValue(null);
      ctrl.contributions = {
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
      };

      ctrl.onClickViewSuggestion('suggestion_1');
      // Here '$scope.$apply' is used multiple times
      // in order to traverse through nested promises.
      $scope.$apply();
      tick();
      $scope.$apply();
      tick();
      $scope.$apply();

      expect(removeSpy).toHaveBeenCalled();
    }));

    it('should resolve suggestion when closing show suggestion modal',
      function() {
        contributionOpportunitiesService
          .reloadOpportunitiesEventEmitter.subscribe(() => {
            ctrl.loadContributions().then(() => {
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
            });
          });
        ctrl.switchToTab(ctrl.TAB_TYPE_CONTRIBUTIONS, 'translate_content');
        $scope.$apply();
      });

    it('should not resolve suggestion when dismissing show suggestion modal',
      function() {
        contributionOpportunitiesService
          .reloadOpportunitiesEventEmitter.subscribe(() => {
            ctrl.loadContributions().then(() => {
              spyOn($uibModal, 'open').and.returnValue({
                result: $q.reject()
              });
              ctrl.onClickViewSuggestion('suggestion_1');
              $scope.$apply();

              expect($uibModal.open).toHaveBeenCalled();
            });
          });
        ctrl.switchToTab(ctrl.TAB_TYPE_CONTRIBUTIONS, 'translate_content');
        $scope.$apply();
      });
  });

  describe('for the suggestion related to deleted opportunity', function() {
    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.value('NgbModal', {
        open: () => {
          return {
            result: Promise.resolve()
          };
        }
      });
    }));

    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $httpBackend = $injector.get('$httpBackend');
      $q = $injector.get('$q');
      var $rootScope = $injector.get('$rootScope');
      $uibModal = $injector.get('$uibModal');
      ngbModal = $injector.get('NgbModal');
      contributionAndReviewService = $injector.get(
        'ContributionAndReviewService');
      contributionOpportunitiesService = $injector.get(
        'ContributionOpportunitiesService');
      csrfTokenService = $injector.get('CsrfTokenService');
      userService = $injector.get('UserService');
      contextService = $injector.get('ContextService');
      skillBackendApiService = $injector.get('SkillBackendApiService');
      skillObjectFactory = $injector.get('SkillObjectFactory');
      spyOn(contextService, 'getExplorationId').and.returnValue('exp1');
      misconceptionObjectFactory = $injector.get('MisconceptionObjectFactory');

      spyOn(csrfTokenService, 'getTokenAsync').and.returnValue(
        $q.resolve('sample-csrf-token'));

      spyOn(userService, 'getUserInfoAsync')
        .and.returnValue($q.resolve({
          isLoggedIn: () => true
        }));
      spyOn(userService, 'getUserContributionRightsDataAsync')
        .and.returnValue(
          $q.resolve({
            can_review_translation_for_language_codes: [],
            can_review_questions: false
          }));
      spyOn(
        contributionAndReviewService, 'getUserCreatedQuestionSuggestionsAsync')
        .and.returnValue($q.resolve({
          suggestionIdToDetails: {
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
                  }
                },
                status: 'accepted'
              },
              details: null
            }
          },
          more: false
        }));
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
      spyOn(
        contributionAndReviewService,
        'getUserCreatedTranslationSuggestionsAsync')
        .and.returnValue($q.resolve({
          suggestionIdToDetails: {
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
              details: null
            }
          },
          more: false
        }));
      spyOn(
        contributionOpportunitiesService.reloadOpportunitiesEventEmitter,
        'emit').and.callThrough();
      spyOn(
        contributionOpportunitiesService.reloadOpportunitiesEventEmitter,
        'subscribe').and.callThrough();
      $scope = $rootScope.$new();
      ctrl = $componentController('contributionsAndReview', {
        $scope: $scope,
        ContextService: contextService,
        MisconceptionObjectFactory: misconceptionObjectFactory
      });
      ctrl.$onInit();
      $scope.$apply();
    }));

    it('should show correct heading for translation suggestions', function() {
      contributionOpportunitiesService
        .reloadOpportunitiesEventEmitter.subscribe(() => {
          ctrl.loadContributions().then(({opportunitiesDicts, more}) => {
            expect(opportunitiesDicts).toEqual([{
              id: 'suggestion_1',
              heading: 'Tradução',
              subheading: (
                ContributorDashboardConstants
                  .CORRESPONDING_DELETED_OPPORTUNITY_TEXT),
              labelText: 'Awaiting review',
              labelColor: '#eeeeee',
              actionButtonTitle: 'View'
            }]);
          });
        });

      ctrl.switchToTab(ctrl.TAB_TYPE_CONTRIBUTIONS, 'translate_content');
      expect(
        contributionOpportunitiesService.reloadOpportunitiesEventEmitter
          .subscribe).toHaveBeenCalled();
      expect(
        contributionOpportunitiesService.reloadOpportunitiesEventEmitter
          .emit).toHaveBeenCalled();
    });

    it('should show correct heading for question suggestions', function() {
      contributionOpportunitiesService
        .reloadOpportunitiesEventEmitter.subscribe(() => {
          ctrl.loadContributions();
        });

      ctrl.switchToTab(ctrl.TAB_TYPE_CONTRIBUTIONS, 'add_question');
      $scope.$apply();

      ctrl.loadContributions().then(({opportunitiesDicts, more}) => {
        expect(opportunitiesDicts).toEqual([{
          id: 'suggestion_1',
          heading: 'Question 1',
          subheading: (
            ContributorDashboardConstants
              .CORRESPONDING_DELETED_OPPORTUNITY_TEXT),
          labelText: 'Accepted',
          labelColor: '#8ed274',
          actionButtonTitle: 'View'
        }]);
      });
    });
  });

  describe('when user is not allowed to review questions', function() {
    let fetchSkillSpy = null;
    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.value('NgbModal', {
        open: () => {
          return {
            result: Promise.resolve()
          };
        }
      });
    }));

    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $httpBackend = $injector.get('$httpBackend');
      $q = $injector.get('$q');
      var $rootScope = $injector.get('$rootScope');
      $uibModal = $injector.get('$uibModal');
      ngbModal = $injector.get('NgbModal');
      contributionOpportunitiesService = $injector.get(
        'ContributionOpportunitiesService');
      contributionAndReviewService = $injector.get(
        'ContributionAndReviewService');
      csrfTokenService = $injector.get('CsrfTokenService');
      userService = $injector.get('UserService');
      contextService = $injector.get('ContextService');
      skillBackendApiService = $injector.get('SkillBackendApiService');
      skillObjectFactory = $injector.get('SkillObjectFactory');
      spyOn(contextService, 'getExplorationId').and.returnValue('exp1');
      misconceptionObjectFactory = $injector.get('MisconceptionObjectFactory');

      spyOn(csrfTokenService, 'getTokenAsync').and.returnValue(
        $q.resolve('sample-csrf-token'));

      spyOn(userService, 'getUserInfoAsync')
        .and.returnValue($q.resolve({
          isLoggedIn: () => true
        }));
      spyOn(userService, 'getUserContributionRightsDataAsync')
        .and.returnValue(
          $q.resolve({
            can_review_translation_for_language_codes: [],
            can_review_questions: false,
            can_suggest_questions: true
          }));
      spyOn(
        contributionAndReviewService, 'getUserCreatedQuestionSuggestionsAsync')
        .and.returnValue($q.resolve({
          suggestionIdToDetails: {
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
                  }
                },
                status: 'accepted'
              },
              details: 'skill_1'
            }
          },
          more: false
        }));
      fetchSkillSpy = spyOn(skillBackendApiService, 'fetchSkillAsync')
        .and.returnValue(
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

      spyOn(
        contributionAndReviewService,
        'getReviewableTranslationSuggestionsAsync')
        .and.returnValue($q.resolve({
          suggestionIdToDetails: {
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
          },
          more: false
        }));

      $scope = $rootScope.$new();
      ctrl = $componentController('contributionsAndReview', {
        $scope: $scope,
        ContextService: contextService,
        MisconceptionObjectFactory: misconceptionObjectFactory
      });

      contributionOpportunitiesService
        .reloadOpportunitiesEventEmitter.subscribe(() => {
          ctrl.loadContributions();
        });
      ctrl.$onInit();
      $scope.$apply();
    }));

    it('should initialize $scope properties after controller is' +
      ' initialized', function() {
      expect(ctrl.activeTabType).toBe('contributions');
      expect(ctrl.activeSuggestionType).toBe('add_question');
      expect(ctrl.activeDropdownTabChoice).toBe('Questions');
      expect(ctrl.userIsLoggedIn).toBe(true);
      expect(ctrl.userDetailsLoading).toBe(false);
      expect(ctrl.reviewTabs.length).toEqual(0);
    });

    it('should emit reload even when when switching to translation' +
      ' in review tab', function() {
      spyOn(
        contributionOpportunitiesService.reloadOpportunitiesEventEmitter,
        'emit').and.callThrough();

      ctrl.switchToTab(ctrl.TAB_TYPE_REVIEWS, 'translate_content');
      $scope.$apply();

      expect(
        contributionOpportunitiesService.reloadOpportunitiesEventEmitter.emit)
        .toHaveBeenCalled();
    });

    it('should open show view question modal when clicking on' +
      ' question suggestion', function() {
      spyOn($uibModal, 'open').and.callThrough();
      ctrl.switchToTab(ctrl.TAB_TYPE_REVIEWS, 'add_question');
      ctrl.loadContributions().then(function() {
        ctrl.onClickViewSuggestion('suggestion_1');
        $scope.$apply();

        expect($uibModal.open).toHaveBeenCalled();
      });
    });

    it('should resolve suggestion to skill when closing show question' +
      ' suggestion modal', function() {
      $httpBackend.expectPUT(
        '/suggestionactionhandler/skill/1/suggestion_1').respond(200);
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve({})
      });

      ctrl.switchToTab(ctrl.TAB_TYPE_REVIEWS, 'add_question');
      ctrl.loadContributions().then(function() {
        expect(Object.keys(ctrl.contributions).length).toBe(1);
        ctrl.onClickViewSuggestion('suggestion_1');
        $scope.$apply();
        $httpBackend.flush();

        expect($uibModal.open).toHaveBeenCalled();
      });
    });

    it('should not resolve suggestion to skill when dismissing show question' +
      ' suggestion modal', function() {
      ctrl.switchToTab(ctrl.TAB_TYPE_REVIEWS, 'add_question');
      spyOn(contributionAndReviewService, 'reviewSkillSuggestion');
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.reject({})
      });

      ctrl.loadContributions().then(function() {
        ctrl.onClickViewSuggestion('suggestion_1');
        $scope.$apply();

        expect($uibModal.open).toHaveBeenCalled();
      });
    });

    it('should fetch skill when user clicks on view suggestion',
      fakeAsync(function() {
        spyOn($uibModal, 'open').and.returnValue({
          result: Promise.resolve([])
        });
        spyOn(contributionAndReviewService, 'reviewSkillSuggestion')
          .and.callFake((
              targetId, suggestionId, action, reviewMessage,
              skillDifficulty, resolveSuggestion, cb) => {
            resolveSuggestion();
            cb();
          });

        ctrl.onClickViewSuggestion('suggestion_1');
        // Here '$scope.$apply' is used multiple times
        // in order to traverse through nested promises.
        $scope.$apply();
        tick();
        $scope.$apply();
        tick();
        $scope.$apply();

        expect(fetchSkillSpy).toHaveBeenCalled();
      }));

    it('should open suggestion modal when user clicks on view suggestion',
      fakeAsync(function() {
        const modalSpy = spyOn($uibModal, 'open').and.callThrough();

        ctrl.onClickViewSuggestion('suggestion_1');
        $scope.$apply();
        tick();

        expect(modalSpy).toHaveBeenCalled();
      }));

    it('should return correctly check the active tab', function() {
      ctrl.switchToTab(ctrl.TAB_TYPE_REVIEWS, 'translate_content');
      ctrl.isActiveTab(ctrl.TAB_TYPE_REVIEWS, 'translate_content');

      ctrl.switchToTab(ctrl.TAB_TYPE_CONTRIBUTIONS, 'add_question');
      ctrl.isActiveTab(ctrl.TAB_TYPE_CONTRIBUTIONS, 'add_question');
    });

    it('should toggle dropdown when it is clicked', function() {
      ctrl.dropdownShown = false;

      ctrl.toggleDropdown();
      expect(ctrl.dropdownShown).toBe(true);

      ctrl.toggleDropdown();
      expect(ctrl.dropdownShown).toBe(false);
    });

    it('should set active dropdown choice correctly', function() {
      ctrl.activeTabType = ctrl.TAB_TYPE_REVIEWS;
      ctrl.activeSuggestionType = 'add_question';

      expect(ctrl.getActiveDropdownTabChoice()).toBe('Review Questions');

      ctrl.activeTabType = ctrl.TAB_TYPE_REVIEWS;
      ctrl.activeSuggestionType = 'translate_content';

      expect(ctrl.getActiveDropdownTabChoice()).toBe('Review Translations');

      ctrl.activeTabType = ctrl.TAB_TYPE_CONTRIBUTIONS;
      ctrl.activeSuggestionType = 'add_question';

      expect(ctrl.getActiveDropdownTabChoice()).toBe('Questions');

      ctrl.activeTabType = ctrl.TAB_TYPE_CONTRIBUTIONS;
      ctrl.activeSuggestionType = 'translate_content';

      expect(ctrl.getActiveDropdownTabChoice()).toBe('Translations');
    });

    it('should close dropdown when a click is made outside', function() {
      const element = {
        contains: function() {
          return true;
        }
      };
      const clickEvent = {
        target: {}
      };
      const querySelectorSpy = spyOn(document, 'querySelector').and
        .returnValue(null);
      const elementContainsSpy = spyOn(element, 'contains').and
        .returnValue(true);
      ctrl.dropdownShown = true;

      ctrl.closeDropdownWhenClickedOutside();
      expect(querySelectorSpy).toHaveBeenCalled();
      expect(elementContainsSpy).not.toHaveBeenCalled();
      expect(ctrl.dropdownShown).toBe(true);

      // This throws "Argument of type '{ contains: () => boolean; }' is not
      // assignable to parameter of type 'Element'. Type '{ contains:
      // () => boolean; }' is missing the following properties from type
      // 'Element': attributes, classList, className, clientHeight, and 159
      // more.". We need to suppress this error because only the properties
      // provided in the element object are required for testing.
      // @ts-expect-error
      querySelectorSpy.and.returnValue(element);

      ctrl.closeDropdownWhenClickedOutside(clickEvent);
      expect(querySelectorSpy).toHaveBeenCalled();
      expect(elementContainsSpy).toHaveBeenCalled();
      expect(ctrl.dropdownShown).toBe(true);

      elementContainsSpy.and.returnValue(false);

      ctrl.closeDropdownWhenClickedOutside(clickEvent);
      expect(ctrl.dropdownShown).toBe(false);
    });

    it('should return back when user click is made outside', function() {
      const clickEvent = {
        target: {}
      };
      spyOn(document, 'querySelector').and.returnValue(null);

      ctrl.closeDropdownWhenClickedOutside(clickEvent);
      expect(document.querySelector).toHaveBeenCalled();
    });

    it('should unbind event listener when onDestroy is called', function() {
      const unbindSpy = spyOn($.fn, 'off');

      ctrl.$onDestroy();
      expect(unbindSpy).toHaveBeenCalled();
    });
  });

  describe('when user is allowed to review questions and ' +
    'skill details are empty', function() {
    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.value('NgbModal', {
        open: () => {
          return {
            result: Promise.resolve()
          };
        }
      });
    }));

    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $q = $injector.get('$q');
      var $rootScope = $injector.get('$rootScope');
      $uibModal = $injector.get('$uibModal');
      ngbModal = $injector.get('NgbModal');
      contributionAndReviewService = $injector.get(
        'ContributionAndReviewService');
      userService = $injector.get('UserService');
      contextService = $injector.get('ContextService');
      skillBackendApiService = $injector.get('SkillBackendApiService');
      contributionOpportunitiesService = $injector.get(
        'ContributionOpportunitiesService');
      spyOn(contextService, 'getExplorationId').and.returnValue('exp1');
      misconceptionObjectFactory = $injector.get('MisconceptionObjectFactory');

      spyOn(userService, 'getUserInfoAsync')
        .and.returnValue($q.resolve({
          isLoggedIn: () => true
        }));
      spyOn(userService, 'getUserContributionRightsDataAsync')
        .and.returnValue($q.resolve({
          can_review_translation_for_language_codes: [{}],
          can_review_questions: true
        }));
      spyOn(
        contributionAndReviewService,
        'getUserCreatedTranslationSuggestionsAsync').and.returnValue(
        Promise.resolve({
          suggestionIdToDetails: {
            suggestion_1: {
              suggestion: {
                suggestion_id: 'suggestion_1',
                target_id: '1',
                suggestion_type: 'translate_content',
                change: {
                  content_html: 'Translation',
                  translation_html: ['Tradução']
                },
                status: 'review'
              },
              details: null
            }
          },
          more: false
        }));
      spyOn(
        contributionAndReviewService, 'getReviewableQuestionSuggestionsAsync')
        .and.returnValue(Promise.resolve({
          suggestionIdToDetails: {
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
                  }
                },
                status: 'review'
              },
              details: {
                skill_description: 'Skill description'
              }
            }
          },
          more: false
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

    it('should open suggestion modal when user clicks on ' +
      'view suggestion', function() {
      contributionOpportunitiesService
        .reloadOpportunitiesEventEmitter.subscribe(() => {
          ctrl.loadContributions().then(() => {
            spyOn($uibModal, 'open').and.returnValue({
              result: $q.reject()
            });
            ctrl.onClickViewSuggestion('suggestion_1');
            $scope.$apply();

            expect($uibModal.open).toHaveBeenCalled();
          });
        });
      ctrl.switchToTab(ctrl.TAB_TYPE_CONTRIBUTIONS, 'translate_content');
      $scope.$apply();
    });
  });
});
