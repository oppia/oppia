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

import { ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ExplorationOpportunitySummary } from 'domain/opportunity/exploration-opportunity-summary.model';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ContributionDetails, ContributionsAndReview, Opportunity, Suggestion, SuggestionDetails } from './contributions-and-review.component';
import { SkillBackendApiService } from 'domain/skill/skill-backend-api.service';
import { TranslationTopicService } from 'pages/exploration-editor-page/translation-tab/services/translation-topic.service';
import { MisconceptionObjectFactory } from 'domain/skill/MisconceptionObjectFactory';
import { SkillObjectFactory } from 'domain/skill/SkillObjectFactory';
import { ContextService } from 'services/context.service';
import { UserService } from 'services/user.service';
import { ContributionAndReviewService } from '../services/contribution-and-review.service';
import { ContributionOpportunitiesService } from '../services/contribution-opportunities.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UserInfo } from 'domain/user/user-info.model';
import { CsrfTokenService } from 'services/csrf-token.service';
import { AlertsService } from 'services/alerts.service';
import { QuestionObjectFactory } from 'domain/question/QuestionObjectFactory';
import { FormatRtePreviewPipe } from 'filters/format-rte-preview.pipe';


class MockNgbModalRef {
  componentInstance: {
    suggestionIdToContribution: null;
    initialSuggestionId: null;
    reviewable: null;
    subheading: null;
  };
}

class MockNgbModal {
  open() {
    return {
      result: Promise.resolve()
    };
  }
}

describe('Contributions and review component', () => {
  let component: ContributionsAndReview;
  let fixture: ComponentFixture<ContributionsAndReview>;
  let ngbModal: NgbModal = null;
  var contextService: ContextService;
  var contributionAndReviewService: ContributionAndReviewService;
  var contributionOpportunitiesService: ContributionOpportunitiesService;
  var skillBackendApiService: SkillBackendApiService;
  var skillObjectFactory: SkillObjectFactory;
  var translationTopicService: TranslationTopicService;
  var userService: UserService;
  let alertsService: AlertsService;
  let questionObjectFactory: QuestionObjectFactory;
  var getUserCreatedTranslationSuggestionsAsyncSpy = null;
  let getUserContributionRightsDataAsyncSpy = null;
  let formatRtePreviewPipe: FormatRtePreviewPipe;
  const mockActiveTopicEventEmitter = new EventEmitter();

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        ContributionsAndReview
      ],
      providers: [
        {
          provide: NgbModal,
          useClass: MockNgbModal
        },
        ContextService,
        ContributionAndReviewService,
        ContributionOpportunitiesService,
        MisconceptionObjectFactory,
        SkillBackendApiService,
        FormatRtePreviewPipe,
        QuestionObjectFactory,
        SkillObjectFactory,
        CsrfTokenService,
        AlertsService,
        TranslationTopicService,
        UserService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(ContributionsAndReview);
    component = fixture.componentInstance;

    ngbModal = TestBed.inject(NgbModal);
    questionObjectFactory = TestBed.inject(QuestionObjectFactory);
    alertsService = TestBed.inject(AlertsService);
    skillObjectFactory = TestBed.inject(SkillObjectFactory);
    contributionAndReviewService = TestBed.inject(ContributionAndReviewService);
    userService = TestBed.inject(UserService);
    contextService = TestBed.inject(ContextService);
    skillBackendApiService = TestBed.inject(SkillBackendApiService);
    contributionOpportunitiesService = TestBed.inject(
      ContributionOpportunitiesService);
    formatRtePreviewPipe = TestBed.inject(
      FormatRtePreviewPipe);
    translationTopicService = TestBed.inject(TranslationTopicService);

    spyOn(
      contributionOpportunitiesService.reloadOpportunitiesEventEmitter,
      'emit').and.callThrough();
    spyOn(
      contributionOpportunitiesService.reloadOpportunitiesEventEmitter,
      'subscribe').and.callThrough();
    spyOn(contextService, 'getExplorationId').and.returnValue('exp1');
    spyOn(userService, 'getUserInfoAsync')
      .and.returnValue(Promise.resolve({
        isLoggedIn: () => true
      } as UserInfo));
    getUserContributionRightsDataAsyncSpy =
      spyOn(userService, 'getUserContributionRightsDataAsync');

    getUserContributionRightsDataAsyncSpy.and.returnValue(Promise.resolve({
      can_review_translation_for_language_codes: [],
      can_review_questions: true,
      can_review_voiceover_for_language_codes: [],
      can_suggest_questions: false,
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
              target_type: null,
              author_name: null,
              last_updated_msecs: null,
              suggestion_id: 'suggestion_1',
              target_id: '1',
              suggestion_type: 'translate_content',
              change: {
                state_name: null,
                new_value: null,
                old_value: null,
                content_html: 'Translation',
                translation_html: 'Tradução',
                skill_id: 'skill_id'
              },
              status: 'review'
            },
            details: {
              skill_id: 'skill_1',
              skill_description: 'skill_1'
            }
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
              target_type: null,
              author_name: null,
              last_updated_msecs: null,
              suggestion_id: 'suggestion_1',
              target_id: '1',
              suggestion_type: 'translate_content',
              change: {
                state_name: null,
                new_value: null,
                old_value: null,
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
                        rows: { value: 1 },
                        catchMisspellings: {
                          value: false
                        }
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
              skill_description: 'Skill description',
              skill_id: null,
            }
          }
        },
        more: false,
      }));
    spyOn(
      contributionAndReviewService, 'getUserCreatedQuestionSuggestionsAsync')
      .and.returnValue(Promise.resolve({
        suggestionIdToDetails: {
          suggestion_1: {
            suggestion: {
              target_type: null,
              author_name: null,
              last_updated_msecs: null,
              suggestion_id: 'suggestion_1',
              target_id: '1',
              suggestion_type: 'add_question',
              change: {
                state_name: null,
                new_value: null,
                old_value: null,
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
                        rows: { value: 1 },
                        catchMisspellings: {
                          value: false
                        }
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
            details: {
              skill_id: 'skill_1',
              skill_description: 'skill_1'
            }
          }
        },
        more: false
      }));
    spyOnProperty(translationTopicService, 'onActiveTopicChanged')
      .and.returnValue(mockActiveTopicEventEmitter);
    spyOn(skillBackendApiService, 'fetchSkillAsync')
      .and.returnValue(
        Promise.resolve({
          skill: skillObjectFactory.createFromBackendDict({
            id: 'skill1',
            description: 'test description 1',
            misconceptions: [{
              id: 2,
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
            prerequisite_skill_ids: ['skill_1'],
            all_questions_merged: false,
            next_misconception_id: 0,
            superseding_skill_id: ''
          }),
          assignedSkillTopicData: null,
          groupedSkillSummaries: null
        }));
    spyOn(
      contributionAndReviewService,
      'getReviewableTranslationSuggestionsAsync')
      .and.returnValue(Promise.resolve({
        suggestionIdToDetails: {
          suggestion_1: {
            suggestion: {
              target_type: null,
              author_name: null,
              last_updated_msecs: null,
              suggestion_id: 'suggestion_1',
              target_id: '1',
              suggestion_type: 'translate_content',
              change: {
                state_name: null,
                new_value: null,
                old_value: null,
                content_html: 'Translation',
                translation_html: 'Tradução',
                skill_id: 'skill_id'
              },
              status: 'review'
            },
            details: {
              skill_id: 'skill_1',
              skill_description: 'skill_1'
            }
          }
        },
        more: false
      }));

    fixture.detectChanges();

    component.ngOnInit();
  }));

  afterEach(() => {
    fixture.destroy();
  });

  describe('when user is allowed to review questions ', () => {
    it('should open call openQuestionSuggestionModal', fakeAsync(() => {
      let eventEmitter = new EventEmitter();

      spyOn(contributionAndReviewService, 'reviewSkillSuggestion').and.callFake(
        (_one, _two, _thre, _four, _five, _six, callBackfunction) => {
          callBackfunction();
          tick();
          return null;
        }
      );
      spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: {
          authorName: null,
          contentHtml: null,
          reviewable: null,
          question: null,
          questionHeader: null,
          suggestion: null,
          skillRubrics: null,
          suggestionId: null,
          skillDifficulty: null,
          misconceptionsBySkill: null,
          editSuggestionEmitter: eventEmitter,
        },
        result: Promise.resolve({
          action: null,
          reviewMessage: null,
          skillDifficulty: null,
        })
      } as NgbModalRef);

      let suggestion = {
        change: {
          skill_id: 'skill1',
          question_dict: null,
          skill_difficulty: null,
          translation_html: ['suggestion_1', 'suggestion_2']
        },
        target_id: 'string;,',
        suggestion_id: 'suggestion_id',
        author_name: 'string;',
      };
      let contributionDetails = {
        skill_description: 'string',
        skill_rubrics: []
      };
      let question = questionObjectFactory.createFromBackendDict(
        {
          question_state_data_schema_version: null,
          id: 'question_1',
          question_state_data: {
            classifier_model_id: null,
            card_is_checkpoint: null,
            linked_skill_id: null,
            next_content_id_index: null,
            content: {
              html: 'Question 1',
              content_id: 'content_1'
            },
            interaction: {
              answer_groups: [{
                outcome: {
                  missing_prerequisite_skill_id: null,
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
                training_data: null,
                rule_specs: [{
                  rule_type: 'Equals',
                  inputs: {x: 10}
                }],
                tagged_skill_misconception_id: null
              },
              {
                training_data: null,
                outcome: {
                  missing_prerequisite_skill_id: null,
                  dest: 'outcome 1',
                  dest_if_really_stuck: null,
                  feedback: {
                    content_id: 'content_5',
                    html: ''
                  },
                  labelled_as_correct: false,
                  param_changes: [],
                  refresher_exploration_id: null
                },
                rule_specs: [{
                  rule_type: 'Equals',
                  inputs: {x: 10}
                }],
                tagged_skill_misconception_id: 'abc-1'
              }],
              confirmed_unclassified_answers: [],
              customization_args: {
                placeholder: {
                  value: {
                    content_id: 'ca_placeholder_0',
                    unicode_str: ''
                  }
                },
                rows: { value: 1 },
                catchMisspellings: {
                  value: false
                }
              },
              default_outcome: {
                dest: null,
                refresher_exploration_id: null,
                missing_prerequisite_skill_id: null,
                dest_if_really_stuck: null,
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
                content_1: {},
                content_2: {},
                content_3: {},
                content_4: {},
                content_5: {}
              }
            },
            written_translations: {
              translations_mapping: {
                content_1: {},
                content_2: {},
                content_3: {},
                content_4: {},
                content_5: {}
              }
            },
            solicit_answer_details: false
          },
          language_code: 'en',
          version: 1,
          linked_skill_ids: ['abc'],
          inapplicable_skill_misconception_ids: ['abc-2']
        });
      spyOn(contextService, 'setCustomEntityContext').and.stub();

      component.contributions = {
        suggestion_id: {
          details: contributionDetails as ContributionDetails,
          suggestion: null,
        }
      };
      component.openQuestionSuggestionModal(
        'suggestion_id', suggestion as Suggestion,
        false,
        question);

      let value = {
        suggestionId: null,
        suggestion: null,
        reviewable: null,
        question: null,
      };
      eventEmitter.emit(value);
      tick();
      tick();

      expect(contributionAndReviewService.reviewSkillSuggestion)
        .toHaveBeenCalled();
      expect(ngbModal.open).toHaveBeenCalled();
    }));

    it('should clear activeExplorationId when active topic changes',
      fakeAsync(() => {
        component.onClickReviewableTranslations('explorationId');
        expect(component.activeExplorationId).toBe('explorationId');

        mockActiveTopicEventEmitter.emit();
        tick();

        expect(component.activeExplorationId).toBeNull();
      }));

    it('should return true on Review Translations tab', fakeAsync(() => {
      component.switchToTab(component.TAB_TYPE_REVIEWS, 'translate_content');
      spyOn(alertsService, 'addSuccessMessage').and.stub();

      let suggestion = {
        change: {
          skill_id: 'string',
          question_dict: null,
          skill_difficulty: null,
          translation_html: ['suggestion_1', 'suggestion_2']
        },
        target_id: 'string;,',
        suggestion_id: 'string;',
        author_name: 'string;',
      };

      component.getTranslationSuggestionHeading(suggestion as Suggestion);
      component.resolveSuggestionSuccess('suggestion_id');
      tick();

      expect(component.isReviewTranslationsTab()).toBeTrue();
      expect(alertsService.addSuccessMessage)
        .toHaveBeenCalledWith('Submitted suggestion review.');
    }));

    it('should return false on Review Questions tab', () => {
      spyOn(component, 'openQuestionSuggestionModal').and.callFake(() => {
        return;
      });

      component.switchToTab(component.TAB_TYPE_REVIEWS, 'add_question');
      expect(component.isReviewTranslationsTab()).toBeFalse();

      component.SUGGESTION_TYPE_QUESTION = 'SUGGESTION';
      component.contributions = {
        SUGGESTION: {
          details: null,
          suggestion: {
            suggestion_type: 'SUGGESTION',
            suggestion_id: '',
            target_id: 'target_id',
            change: {
              content_html: '',
              translation_html: '',
            },
            status: '',
          }
        }
      };

      component.onClickViewSuggestion('SUGGESTION');
    });

    it('should open question suggestion modal', fakeAsync(() => {
      let eventEmitter = new EventEmitter();

      spyOn(contributionAndReviewService, 'reviewSkillSuggestion').and.callFake(
        (_one, _two, _thre, _four, _five, _six, callBackfunction) => {
          callBackfunction();
          tick();
          return null;
        }
      );
      spyOn(component, 'openQuestionSuggestionModal').and.stub();
      spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: {
          authorName: null,
          contentHtml: null,
          reviewable: null,
          question: null,
          questionHeader: null,
          suggestion: null,
          skillRubrics: null,
          suggestionId: null,
          skillDifficulty: null,
          misconceptionsBySkill: null,
          editSuggestionEmitter: eventEmitter,
        },
        result: Promise.resolve({
          action: null,
          reviewMessage: null,
          skillDifficulty: null,
        })
      } as NgbModalRef);

      let questionDict = {
        question_state_data_schema_version: null,
        id: 'question_1',
        question_state_data: {
          classifier_model_id: null,
          card_is_checkpoint: null,
          linked_skill_id: null,
          next_content_id_index: null,
          content: {
            html: 'Question 1',
            content_id: 'content_1'
          },
          interaction: {
            answer_groups: [{
              outcome: {
                missing_prerequisite_skill_id: null,
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
              training_data: null,
              rule_specs: [{
                rule_type: 'Equals',
                inputs: {x: 10}
              }],
              tagged_skill_misconception_id: null
            },
            {
              training_data: null,
              outcome: {
                missing_prerequisite_skill_id: null,
                dest: 'outcome 1',
                dest_if_really_stuck: null,
                feedback: {
                  content_id: 'content_5',
                  html: ''
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null
              },
              rule_specs: [{
                rule_type: 'Equals',
                inputs: {x: 10}
              }],
              tagged_skill_misconception_id: 'abc-1'
            }],
            confirmed_unclassified_answers: [],
            customization_args: {
              placeholder: {
                value: {
                  content_id: 'ca_placeholder_0',
                  unicode_str: ''
                }
              },
              rows: { value: 1 },
              catchMisspellings: {
                value: false
              }
            },
            default_outcome: {
              dest: null,
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest_if_really_stuck: null,
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
              content_1: {},
              content_2: {},
              content_3: {},
              content_4: {},
              content_5: {}
            }
          },
          written_translations: {
            translations_mapping: {
              content_1: {},
              content_2: {},
              content_3: {},
              content_4: {},
              content_5: {}
            }
          },
          solicit_answer_details: false
        },
        language_code: 'en',
        version: 1,
        linked_skill_ids: ['abc'],
        inapplicable_skill_misconception_ids: ['abc-2']
      };

      let suggestion = {
        change: {
          skill_id: 'string',
          question_dict: questionDict,
          skill_difficulty: null,
          translation_html: ['suggestion_1', 'suggestion_2'],
          content_html: null,
        },
        status: null,
        target_id: 'string;,',
        suggestion_id: 'string;',
        author_name: 'string;',
        suggestion_type: 'question'
      };

      let suggestionIdToContribution = {
        suggestion_1: {
          suggestion: {
            exploration_content_html: null,
            language_code: null,
            target_type: null,
            author_name: null,
            last_updated_msecs: null,
            suggestion_id: 'suggestion_1',
            target_id: '1',
            suggestion_type: 'translate_content',
            change: {
              cmd: null,
              content_html: null,
              content_id: null,
              data_format: null,
              language_code: 'en',
              translation_html: null,
              state_name: null,
              new_value: null,
              old_value: null,
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
                      rows: { value: 1 },
                      catchMisspellings: {
                        value: false
                      }
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
            skill_description: 'Skill description',
            skill_id: null,
            chapter_title: null,
            story_title: null,
            topic_name: null
          }
        }
      };

      component._showQuestionSuggestionModal(
        suggestion,
        suggestionIdToContribution,
        false,
        null,
        null);

      let value = {
        suggestionId: null,
        suggestion: null,
        reviewable: null,
        question: null,
      };
      eventEmitter.emit(value);
      tick();

      expect(contributionAndReviewService.reviewSkillSuggestion)
        .toHaveBeenCalled();
      expect(component.openQuestionSuggestionModal).toHaveBeenCalled();
      expect(ngbModal.open).toHaveBeenCalled();
    }));

    it('should return false on Translation Contributions tab', () => {
      component.switchToTab(
        component.TAB_TYPE_CONTRIBUTIONS, 'translate_content');
      expect(component.isReviewTranslationsTab()).toBeFalse();
    });

    it('should return false on Question Contributions tab', () => {
      component.switchToTab(component.TAB_TYPE_CONTRIBUTIONS, 'add_question');
      expect(component.isReviewTranslationsTab()).toBeFalse();
    });

    it('should set activeExplorationId', () => {
      expect(component.activeExplorationId).toBeNull();
      component.onClickReviewableTranslations('explorationId');
      expect(component.activeExplorationId).toBe('explorationId');
    });

    it('should clear activeExplorationId', () => {
      component.onClickReviewableTranslations('explorationId');
      expect(component.activeExplorationId).toBe('explorationId');
      component.onClickBackToReviewableLessons();
      expect(component.activeExplorationId).toBeNull();
    });

    it('should load contributions correctly', () => {
      component.loadContributions(null).then(({opportunitiesDicts, more}) => {
        expect(Object.keys(component.contributions)).toContain('suggestion_1');
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
      component.activeTabType = null;
      component.loadContributions(null).then(({opportunitiesDicts, more}) => {
        expect(opportunitiesDicts).toEqual([]);
        expect(more).toEqual(false);
      });
    });

    it('should return empty list if suggestion type is not initialized',
      () => {
        component.activeTabType = null;
        component.loadContributions(null).then(({opportunitiesDicts, more}) => {
          expect(opportunitiesDicts).toEqual([]);
          expect(more).toEqual(false);
        });
      });

    it('should load opportunities correctly', () => {
      component.loadReviewableTranslationOpportunities().then(
        ({opportunitiesDicts, more}) => {
          expect(opportunitiesDicts).toEqual([
            {
              id: '1',
              heading: 'Chapter 1',
              subheading: 'Topic 1 - Story 1',
              actionButtonTitle: 'Translations'
            } as Opportunity,
            {
              id: '2',
              heading: 'Chapter 2',
              subheading: 'Topic 2 - Story 2',
              actionButtonTitle: 'Translations'
            } as Opportunity
          ]);
          expect(more).toEqual(false);
        });
    });

    it('should cover other code too', fakeAsync(() => {
      jasmine.createSpy('userReviewableSuggestionTypes.length')
        .and.returnValue(0);
      component.SUGGESTION_TYPE_TRANSLATE = null;
      component.SUGGESTION_TYPE_QUESTION = null;
      getUserContributionRightsDataAsyncSpy.and.returnValue(Promise.resolve({
        can_review_translation_for_language_codes: ['something', 'cool'],
        can_review_questions: false,
        can_review_voiceover_for_language_codes: ['something', 'cool'],
        can_suggest_questions: true,
      }));

      tick();
      component.ngOnInit();
      tick();

      expect(getUserContributionRightsDataAsyncSpy).toHaveBeenCalled();
    }));

    it('should cover other code too', fakeAsync(() => {
      jasmine.createSpy('userReviewableSuggestionTypes.length')
        .and.returnValue(0);
      component.SUGGESTION_TYPE_TRANSLATE = null;
      component.SUGGESTION_TYPE_QUESTION = null;
      getUserContributionRightsDataAsyncSpy.and.returnValue(Promise.resolve({
        can_review_translation_for_language_codes: [],
        can_review_questions: false,
        can_review_voiceover_for_language_codes: ['something', 'cool'],
        can_suggest_questions: true,
      }));

      tick();
      component.ngOnInit();
      tick();

      expect(getUserContributionRightsDataAsyncSpy).toHaveBeenCalled();
    }));

    it('should completely test onInIt', fakeAsync(() => {
      jasmine.createSpy('userReviewableSuggestionTypes.length')
        .and.returnValue(0);
      component.SUGGESTION_TYPE_TRANSLATE = null;
      component.SUGGESTION_TYPE_QUESTION = null;
      getUserContributionRightsDataAsyncSpy.and.returnValue(Promise.resolve({
        can_review_translation_for_language_codes: [],
        can_review_questions: false,
        can_review_voiceover_for_language_codes: ['something', 'cool'],
        can_suggest_questions: false,
      }));

      tick();
      component.ngOnInit();
      tick();

      component
        .tabNameToOpportunityFetchFunction[
          component.SUGGESTION_TYPE_QUESTION][
          component.TAB_TYPE_CONTRIBUTIONS]();

      component
        .tabNameToOpportunityFetchFunction[
          component.SUGGESTION_TYPE_TRANSLATE][
          component.TAB_TYPE_REVIEWS]();

      expect(
        contributionAndReviewService.getUserCreatedQuestionSuggestionsAsync)
        .toHaveBeenCalled();
      expect(
        contributionAndReviewService.getReviewableTranslationSuggestionsAsync)
        .toHaveBeenCalled();
    }));

    it('should get Translation Suggestion Heading', () => {
      spyOn(formatRtePreviewPipe, 'transform').and.stub();
      let value = {
        change: {
          translation_html: 'string'
        }
      };

      component.getTranslationSuggestionHeading(value as Suggestion);

      expect(formatRtePreviewPipe.transform).toHaveBeenCalled();
    });

    it('should load contributions correctly', () => {
      component.loadOpportunities().then(({opportunitiesDicts, more}) => {
        expect(Object.keys(component.contributions)).toContain('suggestion_1');
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
      component.loadOpportunities().then(({opportunitiesDicts, more}) => {
        expect(Object.keys(component.contributions)).toContain('suggestion_1');
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

    it('should load contributions correctly', () => {
      component.loadMoreOpportunities().then(({opportunitiesDicts, more}) => {
        expect(Object.keys(component.contributions)).toContain('suggestion_1');
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
      component.loadMoreOpportunities().then(({opportunitiesDicts, more}) => {
        expect(Object.keys(component.contributions).length).toBe(0);
        expect(more).toEqual(false);
      });
    });

    it('should set getQuestionContributionsSummary summary', () => {
      let suggestion = {
        key: {
          suggestion: {
            change: {
              skill_id: 'string',
              content_html: 'string',
              translation_html: 'html',
              question_dict: {
                question_state_data: {
                  content: {
                    html: 'html'
                  }
                }
              },
              skill_difficulty: null,
            },
            target_id: 'string;,',
            suggestion_id: 'suggestion_id',
            author_name: 'string;',
            status: 'review',
            suggestion_type: 'string'
          } as Suggestion,
          details: null,
        }
      };

      spyOn(formatRtePreviewPipe, 'transform').and.returnValue('heading');
      component.getQuestionContributionsSummary(suggestion);

      component.getTranslationContributionsSummary(suggestion);
    });

    it('should open show translation suggestion modal when clicking on' +
      ' suggestion', () => {
      contributionOpportunitiesService
        .reloadOpportunitiesEventEmitter.subscribe(() => {
          component.loadContributions(null).then(() => {
            spyOn(ngbModal, 'open').and.callThrough();
            component.onClickViewSuggestion('suggestion_1');

            expect(ngbModal.open).toHaveBeenCalled();
          });
        });

      component.switchToTab(
        component.TAB_TYPE_CONTRIBUTIONS, 'translate_content');
    });

    it('should load new loadContributions', fakeAsync(() => {
      spyOn(component, 'getContributionSummaries').and.returnValue(null);

      component.activeTabType = 'activeTabType';
      component.activeSuggestionType = 'activeSuggestionType';
      component.contributions = {
        1: null,
        2: null,
      };

      component.tabNameToOpportunityFetchFunction = {
        activeSuggestionType: {
          activeTabType: (shouldResetOffset) => {
            return Promise.resolve({
              suggestionIdToDetails: {
                1: {},
                2: {}
              },
              more: false
            });
          }
        }
      };

      component.loadContributions(true).then((value) => {
        tick();
        expect(value).toEqual({
          opportunitiesDicts: null,
          more: false
        });
      });
    }));

    it('should get Translation Contributions Summary', fakeAsync(() => {
      spyOn(component, 'getTranslationSuggestionHeading')
        .and.returnValue('heading');
      let suggestionIdToSuggestions = {
        suggestion: {
          suggestion: {
            suggestion_id: 'id',
            status: 'review'
          } as Suggestion,
          details: {
            skill_description: 'skill_description',
            topic_name: 'topic_name',
            story_title: 'story_title',
            chapter_title: 'chapter_title'
          } as ContributionDetails
        }
      } as Record<string, SuggestionDetails>;
      component.activeTabType = component.TAB_TYPE_REVIEWS;
      tick();

      expect(component.getTranslationContributionsSummary(
        suggestionIdToSuggestions)).toEqual([{
        id: 'id',
        heading: 'heading',
        subheading: 'topic_name / story_title / chapter_title',
        labelText: 'Awaiting review',
        labelColor: '#eeeeee',
        actionButtonTitle: 'Review'
      }]);
    }));

    it('should get Question Contributions Summary', fakeAsync(() => {
      spyOn(component, 'getTranslationSuggestionHeading')
        .and.returnValue('heading');
      spyOn(formatRtePreviewPipe, 'transform').and.returnValue('heading');
      let suggestionIdToSuggestions = {
        suggestion: {
          suggestion: {
            suggestion_type: null,
            target_id: null,
            suggestion_id: 'id',
            status: 'review',
            change: {
              question_dict: {
                question_state_data: {
                  content: {
                    html: 'html'
                  }
                }
              }
            }
          } as Suggestion,
          details: {
            skill_description: 'skill_description',
            topic_name: 'topic_name',
            story_title: 'story_title',
            chapter_title: 'chapter_title'
          } as ContributionDetails
        }
      };

      component.activeTabType = component.TAB_TYPE_REVIEWS;
      tick();

      expect(component.getQuestionContributionsSummary(
        suggestionIdToSuggestions as Record<string, SuggestionDetails>)
      ).toEqual([{
        id: 'id',
        heading: 'heading',
        subheading: 'skill_description',
        labelText: 'Awaiting review',
        labelColor: '#eeeeee',
        actionButtonTitle: 'Review'
      }]);
    }));

    it('should get Contribution Summaries', fakeAsync(() => {
      spyOn(component, 'getTranslationContributionsSummary').and.stub();
      spyOn(component, 'getQuestionContributionsSummary').and.stub();

      component.activeSuggestionType = component.SUGGESTION_TYPE_TRANSLATE;
      component.getContributionSummaries(null);
      tick();

      component.activeSuggestionType = component.SUGGESTION_TYPE_QUESTION;
      component.getContributionSummaries(null);
      tick();

      expect(component.getTranslationContributionsSummary)
        .toHaveBeenCalledWith(null);
      expect(component.getTranslationContributionsSummary)
        .toHaveBeenCalledWith(null);
    }));

    it('should remove resolved suggestions when suggestion ' +
      'modal is opened and remove button is clicked', fakeAsync(() => {
      spyOn(ngbModal, 'open').and.returnValue(
        {
          componentInstance: MockNgbModalRef,
          result: Promise.resolve(['id1', 'id2'])
        } as NgbModalRef
      );
      const removeSpy = spyOn(
        contributionOpportunitiesService.removeOpportunitiesEventEmitter,
        'emit').and.returnValue(null);
      component.contributions = {
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
            skill_description: 'skill_description',
            skill_rubrics: [],
            chapter_title: 'skill_1',
            story_title: 'skill_1',
            topic_name: 'skill_1',
          }
        }
      };

      component.onClickViewSuggestion('suggestion_1');
      tick();
      tick();

      expect(removeSpy).toHaveBeenCalled();
    }));

    it('should resolve suggestion when closing show suggestion modal',
      () => {
        contributionOpportunitiesService
          .reloadOpportunitiesEventEmitter.subscribe(() => {
            component.loadContributions(null).then(() => {
              spyOn(ngbModal, 'open').and.returnValue({
                result: Promise.resolve({
                  action: 'add',
                  reviewMessage: 'Review message',
                  skillDifficulty: 'Easy'
                })
              } as NgbModalRef);
              component.onClickViewSuggestion('suggestion_1');

              expect(ngbModal.open).toHaveBeenCalled();
            });
          });
        component.switchToTab(
          component.TAB_TYPE_CONTRIBUTIONS, 'translate_content');
      });

    it('should not resolve suggestion when dismissing show suggestion modal',
      () => {
        contributionOpportunitiesService
          .reloadOpportunitiesEventEmitter.subscribe(() => {
            component.loadContributions(null).then(() => {
              spyOn(ngbModal, 'open').and.returnValue({
                result: Promise.reject()
              } as NgbModalRef);
              component.onClickViewSuggestion('suggestion_1');

              expect(ngbModal.open).toHaveBeenCalled();
            });
          });
        component.switchToTab(
          component.TAB_TYPE_CONTRIBUTIONS, 'translate_content');
      });
  });


  describe('when user is allowed to review questions and ' +
  'skill details are empty', () => {
    it('should open suggestion modal when user clicks on ' +
    'view suggestion', () => {
      contributionOpportunitiesService
        .reloadOpportunitiesEventEmitter.subscribe(() => {
          component.loadContributions(null).then(() => {
            spyOn(ngbModal, 'open').and.returnValue({
              result: Promise.reject()
            } as NgbModalRef);
            component.onClickViewSuggestion('suggestion_1');

            expect(ngbModal.open).toHaveBeenCalled();
          });
        });
      component.switchToTab(
        component.TAB_TYPE_CONTRIBUTIONS, 'translate_content');
    });
  });

  describe('when user is not allowed to review questions', () => {
    it('should initialize $scope properties after controller is' +
    ' initialized', () => {
      expect(component.activeTabType).toBe('reviews');
      expect(component.activeSuggestionType).toBe('add_question');
      expect(component.activeDropdownTabChoice).toBe('Review Questions');
      expect(component.userIsLoggedIn).toBe(true);
      expect(component.userDetailsLoading).toBe(false);
      expect(component.reviewTabs.length).toEqual(2);
    });

    it('should open show view question modal when clicking on' +
    ' question suggestion', () => {
      spyOn(ngbModal, 'open').and.callThrough();
      component.switchToTab(component.TAB_TYPE_REVIEWS, 'add_question');
      component.loadContributions(null).then(() => {
        component.onClickViewSuggestion('suggestion_1');

        expect(ngbModal.open).toHaveBeenCalled();
      });
    });

    it('should resolve suggestion to skill when closing show question' +
    ' suggestion modal', () => {
      spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.resolve({})
      } as NgbModalRef);

      component.switchToTab(component.TAB_TYPE_REVIEWS, 'add_question');
      component.loadContributions(null).then(() => {
        expect(Object.keys(component.contributions).length).toBe(1);
        component.onClickViewSuggestion('suggestion_1');
        flush();

        expect(ngbModal.open).toHaveBeenCalled();
      });
    });

    it('should not resolve suggestion to skill when dismissing show question' +
    ' suggestion modal', () => {
      component.switchToTab(component.TAB_TYPE_REVIEWS, 'add_question');
      spyOn(contributionAndReviewService, 'reviewSkillSuggestion');
      spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.reject({})
      } as NgbModalRef);

      component.loadContributions(null).then(() => {
        component.onClickViewSuggestion('suggestion_1');

        expect(ngbModal.open).toHaveBeenCalled();
      });
    });

    it('should return correctly check the active tab', () => {
      component.switchToTab(component.TAB_TYPE_REVIEWS, 'translate_content');
      component.isActiveTab(component.TAB_TYPE_REVIEWS, 'translate_content');

      component.switchToTab(component.TAB_TYPE_CONTRIBUTIONS, 'add_question');
      component.isActiveTab(component.TAB_TYPE_CONTRIBUTIONS, 'add_question');
    });

    it('should toggle dropdown when it is clicked', () => {
      component.dropdownShown = false;

      component.toggleDropdown();
      expect(component.dropdownShown).toBe(true);

      component.toggleDropdown();
      expect(component.dropdownShown).toBe(false);
    });

    it('should set active dropdown choice correctly', () => {
      component.activeTabType = component.TAB_TYPE_REVIEWS;
      component.activeSuggestionType = 'add_question';

      expect(component.getActiveDropdownTabChoice()).toBe('Review Questions');

      component.activeTabType = component.TAB_TYPE_REVIEWS;
      component.activeSuggestionType = 'translate_content';

      expect(component.getActiveDropdownTabChoice())
        .toBe('Review Translations');

      component.activeTabType = component.TAB_TYPE_CONTRIBUTIONS;
      component.activeSuggestionType = 'add_question';

      expect(component.getActiveDropdownTabChoice()).toBe('Questions');

      component.activeTabType = component.TAB_TYPE_CONTRIBUTIONS;
      component.activeSuggestionType = 'translate_content';

      expect(component.getActiveDropdownTabChoice()).toBe('Translations');
    });

    it('should close dropdown when a click is made outside', () => {
      const element = {
        contains: () => {
          return true;
        }
      };
      const clickEvent = {
        target: null
      };
      const querySelectorSpy = spyOn(document, 'querySelector').and
        .returnValue(null);
      const elementContainsSpy = spyOn(element, 'contains').and
        .returnValue(true);
      component.dropdownShown = true;

      component.closeDropdownWhenClickedOutside(null);
      expect(querySelectorSpy).toHaveBeenCalled();
      expect(elementContainsSpy).not.toHaveBeenCalled();
      expect(component.dropdownShown).toBe(true);

      // This throws "Argument of type '{ contains: () => boolean; }' is not
      // assignable to parameter of type 'Element'. Type '{ contains:
      // () => boolean; }' is missing the following properties from type
      // 'Element': attributes, classList, className, clientHeight, and 159
      // more.". We need to suppress this error because only the properties
      // provided in the element object are required for testing.
      // @ts-expect-error
      querySelectorSpy.and.returnValue(element);

      component.closeDropdownWhenClickedOutside(clickEvent);
      expect(querySelectorSpy).toHaveBeenCalled();
      expect(elementContainsSpy).toHaveBeenCalled();
      expect(component.dropdownShown).toBe(true);

      elementContainsSpy.and.returnValue(false);

      component.closeDropdownWhenClickedOutside(clickEvent);
      expect(component.dropdownShown).toBe(false);
    });

    it('should return back when user click is made outside', () => {
      const clickEvent = {
        target: null
      };
      spyOn(document, 'querySelector').and.returnValue(null);

      component.closeDropdownWhenClickedOutside(clickEvent);
      expect(document.querySelector).toHaveBeenCalled();
    });

    it('should unbind event listener when onDestroy is called', () => {
      const unbindSpy = spyOn($.fn, 'off');

      component.ngOnDestroy();
      expect(unbindSpy).toHaveBeenCalled();
    });
  });
});
