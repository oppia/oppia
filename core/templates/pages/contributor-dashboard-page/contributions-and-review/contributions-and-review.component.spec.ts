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

import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {ExplorationOpportunitySummary} from '../../../domain/opportunity/exploration-opportunity-summary.model';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {AppConstants} from '../../../app.constants';
import {
  ContributionDetails,
  ContributionsAndReview,
  CustomMatSnackBarRef,
  Opportunity,
  Suggestion,
  SuggestionDetails,
} from './contributions-and-review.component';
import {SkillBackendApiService} from '../../../domain/skill/skill-backend-api.service';
import {TranslationTopicService} from '../../../pages/exploration-editor-page/translation-tab/services/translation-topic.service';
import {Skill} from '../../../domain/skill/skill.model';
import {PageContextService} from '../../../services/page-context.service';
import {UserService} from '../../../services/user.service';
import {ContributionAndReviewService} from '../services/contribution-and-review.service';
import {ContributionOpportunitiesService} from '../services/contribution-opportunities.service';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {UserInfo} from '../../../domain/user/user-info.model';
import {CsrfTokenService} from '../../../services/csrf-token.service';
import {AlertsService} from '../../../services/alerts.service';
import {
  Question,
  QuestionBackendDict,
} from '../../../domain/question/question.model';
import {FormatRtePreviewPipe} from '../../../filters/format-rte-preview.pipe';
import {PlatformFeatureService} from '../../../services/platform-feature.service';
import {OpportunitiesListComponent} from '../opportunities-list/opportunities-list.component';
import {HtmlEscaperService} from '../../../services/html-escaper.service';
import {MatIconModule} from '@angular/material/icon';
import {
  MatSnackBarConfig,
  MatSnackBarModule,
} from '@angular/material/snack-bar';
import {
  MatSnackBar,
  MatSnackBarRef,
  MAT_SNACK_BAR_DATA,
} from '@angular/material/snack-bar';
import {of, Subject} from 'rxjs';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {delay} from 'rxjs/operators';
import {WindowRef} from '../../../services/contextual/window-ref.service';
import {PendingSuggestionDict} from '../modal-templates/translation-suggestion-review-modal.component';

class MockNgbModal {
  open() {
    return {
      result: Promise.resolve(),
    };
  }
}

class MockWindowRef {
  nativeWindow = {
    scrollTo: (x: number, y: number) => {},
  };
}

class MockPlatformFeatureService {
  status = {
    ContributorDashboardAccomplishments: {
      isEnabled: false,
    },
  };
}

describe('Contributions and review component', () => {
  let component: ContributionsAndReview;
  let fixture: ComponentFixture<ContributionsAndReview>;
  let ngbModal: NgbModal;
  let mockPlatformFeatureService = new MockPlatformFeatureService();
  var pageContextService: PageContextService;
  var contributionAndReviewService: ContributionAndReviewService;
  var contributionOpportunitiesService: ContributionOpportunitiesService;
  var skillBackendApiService: SkillBackendApiService;
  var translationTopicService: TranslationTopicService;
  var userService: UserService;
  let alertsService: AlertsService;
  let getUserCreatedTranslationSuggestionsAsyncSpy: jasmine.Spy;
  let getReviewableQuestionSuggestionsAsyncSpy: jasmine.Spy;

  let getUserCreatedQuestionSuggestionsAsyncSpy: jasmine.Spy;
  let getUserContributionRightsDataAsyncSpy: jasmine.Spy;
  let formatRtePreviewPipe: FormatRtePreviewPipe;
  let htmlEscaperService: HtmlEscaperService;
  const mockActiveTopicEventEmitter = new EventEmitter();
  let snackBar: MatSnackBar;
  let snackBarRefMock: MatSnackBarRef<unknown>;
  let snackBarSpy: jasmine.Spy;

  class MockMatSnackBarRef {
    instance = {message: ''};
    afterDismissed = () => of({action: '', dismissedByAction: false});
    onAction = () => new Subject<void>();
    dismissWithAction = (a: string, b: string, c: string) => {
      contributionOpportunitiesService.pinReviewableTranslationOpportunityAsync(
        a,
        b,
        c
      );
    };
  }
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        MatIconModule,
        HttpClientTestingModule,
        MatSnackBarModule,
        BrowserAnimationsModule,
      ],
      declarations: [ContributionsAndReview],
      providers: [
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
        {
          provide: MatSnackBarRef,
          useClass: MockMatSnackBarRef,
        },
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
        PageContextService,
        ContributionAndReviewService,
        ContributionOpportunitiesService,
        SkillBackendApiService,
        FormatRtePreviewPipe,
        HtmlEscaperService,
        CsrfTokenService,
        TranslationTopicService,
        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService,
        },
        UserService,
        OpportunitiesListComponent,
        MatSnackBar,
        {provide: MAT_SNACK_BAR_DATA, useValue: {}},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(ContributionsAndReview);
    component = fixture.componentInstance;

    ngbModal = TestBed.inject(NgbModal);
    alertsService = TestBed.inject(AlertsService);
    contributionAndReviewService = TestBed.inject(ContributionAndReviewService);
    userService = TestBed.inject(UserService);
    pageContextService = TestBed.inject(PageContextService);
    skillBackendApiService = TestBed.inject(SkillBackendApiService);
    contributionOpportunitiesService = TestBed.inject(
      ContributionOpportunitiesService
    );
    formatRtePreviewPipe = TestBed.inject(FormatRtePreviewPipe);
    htmlEscaperService = TestBed.inject(HtmlEscaperService);
    translationTopicService = TestBed.inject(TranslationTopicService);
    snackBar = TestBed.inject(MatSnackBar);
    snackBarRefMock = TestBed.inject(MatSnackBarRef);
    spyOn(snackBarRefMock, 'onAction').and.returnValue(of({}).pipe(delay(1)));

    snackBarSpy = spyOn(snackBar, 'openFromComponent').and.returnValue(
      new MockMatSnackBarRef() as unknown as MatSnackBarRef<unknown>
    );

    spyOn(
      contributionOpportunitiesService.reloadOpportunitiesEventEmitter,
      'emit'
    ).and.callThrough();
    spyOn(
      contributionOpportunitiesService.reloadOpportunitiesEventEmitter,
      'subscribe'
    ).and.callThrough();
    spyOn(pageContextService, 'getExplorationId').and.returnValue('exp1');
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve({
        isLoggedIn: () => true,
      } as UserInfo)
    );
    getUserContributionRightsDataAsyncSpy = spyOn(
      userService,
      'getUserContributionRightsDataAsync'
    );

    getUserContributionRightsDataAsyncSpy.and.returnValue(
      Promise.resolve({
        can_review_translation_for_language_codes: ['hi'],
        can_review_questions: true,
        can_review_voiceover_for_language_codes: [],
        can_suggest_questions: false,
      })
    );
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
              en: 2,
            },
            translation_in_review_counts: {
              en: 2,
            },
            is_pinned: false,
            language_code: 'en',
          }),
          ExplorationOpportunitySummary.createFromBackendDict({
            id: '2',
            topic_name: 'Topic 2',
            story_title: 'Story 2',
            chapter_title: 'Chapter 2',
            content_count: 2,
            translation_counts: {
              en: 4,
            },
            translation_in_review_counts: {
              en: 4,
            },
            is_pinned: false,
            language_code: 'en',
          }),
        ],
        more: false,
      })
    );
    getUserCreatedTranslationSuggestionsAsyncSpy = spyOn(
      contributionAndReviewService,
      'getUserCreatedTranslationSuggestionsAsync'
    ).and.returnValue(
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
              exploration_content_html: 'html',
              change_cmd: {
                state_name: null,
                new_value: null,
                old_value: null,
                content_html: 'Translation',
                translation_html: 'Tradução',
                skill_id: 'skill_id',
              },
              status: 'review',
            },
            details: {
              skill_id: 'skill_1',
              skill_description: 'skill_1',
            },
          },
        },
        more: false,
      })
    );
    getReviewableQuestionSuggestionsAsyncSpy = spyOn(
      contributionAndReviewService,
      'getReviewableQuestionSuggestionsAsync'
    ).and.returnValue(
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
              exploration_content_html: 'html',
              change_cmd: {
                state_name: null,
                new_value: null,
                old_value: null,
                skill_id: 'skill1',
                question_dict: {
                  id: '1',
                  question_state_data: {
                    content: {
                      html: 'Question 1',
                      content_id: 'content_1',
                    },
                    interaction: {
                      answer_groups: [
                        {
                          outcome: {
                            dest: 'outcome 1',
                            dest_if_really_stuck: null,
                            feedback: {
                              content_id: 'content_5',
                              html: '',
                            },
                            labelled_as_correct: true,
                            param_changes: [],
                            refresher_exploration_id: null,
                          },
                          rule_specs: [],
                        },
                      ],
                      confirmed_unclassified_answers: [],
                      customization_args: {
                        placeholder: {
                          value: {
                            content_id: 'ca_placeholder_0',
                            unicode_str: '',
                          },
                        },
                        rows: {value: 1},
                        catchMisspellings: {
                          value: false,
                        },
                      },
                      default_outcome: {
                        dest: '',
                        dest_if_really_stuck: null,
                        feedback: {
                          html: 'Correct Answer',
                          content_id: 'content_2',
                        },
                        param_changes: [],
                        labelled_as_correct: true,
                      },
                      hints: [
                        {
                          hint_content: {
                            html: 'Hint 1',
                            content_id: 'content_3',
                          },
                        },
                      ],
                      solution: {
                        correct_answer: 'This is the correct answer',
                        answer_is_exclusive: false,
                        explanation: {
                          html: 'Solution explanation',
                          content_id: 'content_4',
                        },
                      },
                      id: 'TextInput',
                    },
                    param_changes: [],
                    recorded_voiceovers: {
                      voiceovers_mapping: {},
                    },
                  },
                },
              },
              status: 'review',
            },
            details: {
              skill_description: 'Skill description',
              skill_id: null,
            },
          },
        },
        more: false,
      })
    );
    getUserCreatedQuestionSuggestionsAsyncSpy = spyOn(
      contributionAndReviewService,
      'getUserCreatedQuestionSuggestionsAsync'
    ).and.returnValue(
      Promise.resolve({
        suggestionIdToDetails: {
          suggestion_1: {
            suggestion: {
              target_type: null,
              author_name: null,
              last_updated_msecs: null,
              suggestion_id: 'suggestion_1',
              target_id: '1',
              suggestion_type: 'add_question',
              exploration_content_html: 'html',
              change_cmd: {
                state_name: null,
                new_value: null,
                old_value: null,
                skill_id: 'skill1',
                question_dict: {
                  id: '1',
                  question_state_data: {
                    content: {
                      html: 'Question 1',
                      content_id: 'content_1',
                    },
                    interaction: {
                      answer_groups: [
                        {
                          outcome: {
                            dest: 'outcome 1',
                            dest_if_really_stuck: null,
                            feedback: {
                              content_id: 'content_5',
                              html: '',
                            },
                            labelled_as_correct: true,
                            param_changes: [],
                            refresher_exploration_id: null,
                          },
                          rule_specs: [],
                        },
                      ],
                      confirmed_unclassified_answers: [],
                      customization_args: {
                        placeholder: {
                          value: {
                            content_id: 'ca_placeholder_0',
                            unicode_str: '',
                          },
                        },
                        rows: {value: 1},
                        catchMisspellings: {
                          value: false,
                        },
                      },
                      default_outcome: {
                        dest: '',
                        dest_if_really_stuck: null,
                        feedback: {
                          html: 'Correct Answer',
                          content_id: 'content_2',
                        },
                        param_changes: [],
                        labelled_as_correct: true,
                      },
                      hints: [
                        {
                          hint_content: {
                            html: 'Hint 1',
                            content_id: 'content_3',
                          },
                        },
                      ],
                      solution: {
                        correct_answer: 'This is the correct answer',
                        answer_is_exclusive: false,
                        explanation: {
                          html: 'Solution explanation',
                          content_id: 'content_4',
                        },
                      },
                      id: 'TextInput',
                    },
                    param_changes: [],
                    recorded_voiceovers: {
                      voiceovers_mapping: {},
                    },
                  },
                },
              },
              status: 'accepted',
            },
            details: {
              skill_id: 'skill_1',
              skill_description: 'skill_1',
            },
          },
        },
        more: false,
      })
    );
    spyOnProperty(
      translationTopicService,
      'onActiveTopicChanged'
    ).and.returnValue(mockActiveTopicEventEmitter);
    spyOn(skillBackendApiService, 'fetchSkillAsync').and.returnValue(
      Promise.resolve({
        skill: Skill.createFromBackendDict({
          id: 'skill1',
          description: 'test description 1',
          misconceptions: [
            {
              id: 2,
              name: 'test name',
              notes: 'test notes',
              feedback: 'test feedback',
              must_be_addressed: true,
            },
          ],
          rubrics: [
            {
              difficulty: 'Easy',
              explanations: ['explanation'],
            },
          ],
          skill_contents: {
            explanation: {
              html: 'test explanation',
              content_id: 'explanation',
            },
            recorded_voiceovers: {
              voiceovers_mapping: {},
            },
          },
          language_code: 'en',
          version: 3,
          prerequisite_skill_ids: ['skill_1'],
          all_questions_merged: false,
          next_misconception_id: 0,
          superseding_skill_id: '',
        }),
        assignedSkillTopicData: null,
        groupedSkillSummaries: null,
      })
    );
    spyOn(
      contributionAndReviewService,
      'getReviewableTranslationSuggestionsAsync'
    ).and.returnValue(
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
              exploration_content_html: 'html',
              change_cmd: {
                state_name: null,
                new_value: null,
                old_value: null,
                content_html: 'Translation',
                translation_html: 'Tradução',
              },
              status: 'review',
            },
            details: {
              skill_id: 'skill_1',
              skill_description: 'skill_1',
            },
          },
        },
        more: false,
      })
    );
    mockPlatformFeatureService.status.ContributorDashboardAccomplishments.isEnabled =
      true;

    fixture.detectChanges();
  }));

  afterEach(() => {
    fixture.destroy();
  });

  describe('when user is allowed to review questions', () => {
    it('should open call openQuestionSuggestionModal', fakeAsync(() => {
      let eventEmitter = new EventEmitter();

      spyOn(contributionAndReviewService, 'reviewSkillSuggestion').and.callFake(
        (
          _one: string,
          _two: string,
          _thre: string,
          _four: string,
          _five: string,
          _six: string,
          callBackfunction: () => void
        ) => {
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
        }),
      } as NgbModalRef);

      let suggestion = {
        change_cmd: {
          skill_id: 'skill1',
          question_dict: {} as QuestionBackendDict,
          skill_difficulty: [],
          translation_html: ['suggestion_1', 'suggestion_2'],
          content_html: '',
        },
        target_id: 'string;,',
        suggestion_id: 'suggestion_id',
        author_name: 'string;',
        status: 'review',
        suggestion_type: 'add_question',
        exploration_content_html: null,
      };
      let question = Question.createFromBackendDict({
        question_state_data_schema_version: 0,
        id: 'question_1',
        question_state_data: {
          inapplicable_skill_misconception_ids: [],
          classifier_model_id: '',
          card_is_checkpoint: false,
          linked_skill_id: '',
          content: {
            html: 'Question 1',
            content_id: 'content_1',
          },
          interaction: {
            answer_groups: [
              {
                outcome: {
                  missing_prerequisite_skill_id: null,
                  dest: 'outcome 1',
                  dest_if_really_stuck: null,
                  feedback: {
                    content_id: 'content_5',
                    html: '',
                  },
                  labelled_as_correct: true,
                  param_changes: [],
                  refresher_exploration_id: null,
                },
                training_data: [],
                rule_specs: [
                  {
                    rule_type: 'Equals',
                    inputs: {x: 10},
                  },
                ],
                tagged_skill_misconception_id: null,
              },
              {
                training_data: [],
                outcome: {
                  missing_prerequisite_skill_id: null,
                  dest: 'outcome 1',
                  dest_if_really_stuck: null,
                  feedback: {
                    content_id: 'content_5',
                    html: '',
                  },
                  labelled_as_correct: false,
                  param_changes: [],
                  refresher_exploration_id: null,
                },
                rule_specs: [
                  {
                    rule_type: 'Equals',
                    inputs: {x: 10},
                  },
                ],
                tagged_skill_misconception_id: 'abc-1',
              },
            ],
            confirmed_unclassified_answers: [],
            customization_args: {
              placeholder: {
                value: {
                  content_id: 'ca_placeholder_0',
                  unicode_str: '',
                },
              },
              rows: {value: 1},
              catchMisspellings: {
                value: false,
              },
            },
            default_outcome: {
              dest: '',
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest_if_really_stuck: null,
              feedback: {
                html: 'Correct Answer',
                content_id: 'content_2',
              },
              param_changes: [],
              labelled_as_correct: false,
            },
            hints: [
              {
                hint_content: {
                  html: 'Hint 1',
                  content_id: 'content_3',
                },
              },
            ],
            solution: {
              correct_answer: 'This is the correct answer',
              answer_is_exclusive: false,
              explanation: {
                html: 'Solution explanation',
                content_id: 'content_4',
              },
            },
            id: 'TextInput',
          },
          param_changes: [],

          solicit_answer_details: false,
        },
        language_code: 'en',
        version: 1,
        linked_skill_ids: ['abc'],
        next_content_id_index: 1,
        inapplicable_skill_misconception_ids: ['abc-2'],
      });
      spyOn(pageContextService, 'setCustomEntityContext').and.stub();

      component.contributions = {
        suggestion_id: {
          details: {
            skill_description: 'string',
            skill_rubrics: [],
            chapter_title: '',
            story_title: '',
            topic_name: '',
          } as ContributionDetails,
          suggestion: {
            suggestion_type: 'add_question',
            suggestion_id: 'suggestion_id',
            target_id: 'string;,',
            change_cmd: {
              skill_id: 'skill1',
              question_dict: {} as QuestionBackendDict,
              skill_difficulty: [],
              content_html: '',
              translation_html: ['suggestion_1', 'suggestion_2'],
            },
            status: 'review',
            author_name: 'string;',
            exploration_content_html: '',
          } as Suggestion,
        },
      };
      component.openQuestionSuggestionModal(
        'suggestion_id',
        suggestion as Suggestion,
        false,
        question
      );

      let value = {
        suggestionId: null,
        suggestion: null,
        reviewable: null,
        question: null,
      };
      eventEmitter.emit(value);
      tick();
      tick();

      expect(
        contributionAndReviewService.reviewSkillSuggestion
      ).toHaveBeenCalled();
      expect(ngbModal.open).toHaveBeenCalled();
    }));

    it('should clear activeExplorationId when active topic changes', fakeAsync(() => {
      component.onClickReviewableTranslations('explorationId');
      expect(component.activeExplorationId).toBe('explorationId');

      mockActiveTopicEventEmitter.emit();
      tick();

      expect(component.activeExplorationId).toBeNull();
    }));

    it('should be able to change language', fakeAsync(() => {
      component.opportunitiesListRef = TestBed.inject(
        OpportunitiesListComponent
      );
      spyOn(component.opportunitiesListRef, 'onChangeLanguage').and.callFake(
        () => {
          return;
        }
      );

      expect(component.languageCode).toBeUndefined();

      component.onChangeLanguage('es');

      expect(component.languageCode).toBe('es');
      expect(
        component.opportunitiesListRef.onChangeLanguage
      ).toHaveBeenCalledWith('es');
    }));

    describe('isReviewTranslationsTab()', () => {
      it('should return true on Review Translations tab', fakeAsync(() => {
        component.switchToTab(component.TAB_TYPE_REVIEWS, 'translate_content');
        expect(component.isReviewTranslationsTab()).toBe(true);
        expect(component.isReviewQuestionsTab()).toBe(false);

        // TODO(#9749): Move out of this test. The following only exists to
        // satisfy code coverage for resolveSuggestionSuccess().
        spyOn(alertsService, 'addSuccessMessage').and.stub();

        component.resolveSuggestionSuccess('suggestion_id');
        tick();

        expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
          'Submitted suggestion review.'
        );
      }));

      it('should return false on Review Questions tab', () => {
        component.switchToTab(component.TAB_TYPE_REVIEWS, 'add_question');
        expect(component.isReviewQuestionsTab()).toBe(true);
        expect(component.isReviewTranslationsTab()).toBe(false);

        // TODO(#9749): Factor into separate test. Currently, the below test
        // logic only exists to satisfy code coverage for
        // onClickViewSuggestion().
        spyOn(component, 'openQuestionSuggestionModal').and.callFake(() => {
          return;
        });
        component.SUGGESTION_TYPE_QUESTION = 'SUGGESTION';
        component.contributions = {
          SUGGESTION: {
            details: {
              chapter_title: '',
              story_title: '',
              topic_name: '',
            } as ContributionDetails,
            suggestion: {
              suggestion_type: 'SUGGESTION',
              suggestion_id: '',
              target_id: 'target_id',
              change_cmd: {
                content_html: '',
                translation_html: '',
              },
              status: '',
              author_name: '',
              exploration_content_html: '',
            } as Suggestion,
          },
        };
        component.onClickViewSuggestion('SUGGESTION');
      });

      it('should return false on Translation Contributions tab', () => {
        component.switchToTab(
          component.TAB_TYPE_CONTRIBUTIONS,
          'translate_content'
        );
        expect(component.isReviewTranslationsTab()).toBe(false);
      });

      it('should return false on Question Contributions tab', () => {
        component.switchToTab(component.TAB_TYPE_CONTRIBUTIONS, 'add_question');
        expect(component.isReviewTranslationsTab()).toBe(false);
      });
    });

    it('should change the sort key of reviewable questions', () => {
      expect(component.reviewableQuestionsSortKey).toBe('Date');

      component.setReviewableQuestionsSortKey('Name');

      expect(component.reviewableQuestionsSortKey).toBe('Name');
    });

    it('should open question suggestion modal', fakeAsync(() => {
      let eventEmitter = new EventEmitter();

      spyOn(contributionAndReviewService, 'reviewSkillSuggestion').and.callFake(
        (
          _one: string,
          _two: string,
          _thre: string,
          _four: string,
          _five: string,
          _six: string,
          callBackfunction: () => void
        ) => {
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
        }),
      } as NgbModalRef);

      let questionDict = {
        question_state_data_schema_version: 0,
        id: 'question_1',
        question_state_data: {
          classifier_model_id: '',
          card_is_checkpoint: false,
          linked_skill_id: '',
          content: {
            html: 'Question 1',
            content_id: 'content_1',
          },
          interaction: {
            answer_groups: [
              {
                outcome: {
                  missing_prerequisite_skill_id: null,
                  dest: 'outcome 1',
                  dest_if_really_stuck: null,
                  feedback: {
                    content_id: 'content_5',
                    html: '',
                  },
                  labelled_as_correct: true,
                  param_changes: [],
                  refresher_exploration_id: null,
                },
                training_data: [],
                rule_specs: [
                  {
                    rule_type: 'Equals',
                    inputs: {x: 10},
                  },
                ],
                tagged_skill_misconception_id: null,
              },
              {
                training_data: [],
                outcome: {
                  missing_prerequisite_skill_id: null,
                  dest: 'outcome 1',
                  dest_if_really_stuck: null,
                  feedback: {
                    content_id: 'content_5',
                    html: '',
                  },
                  labelled_as_correct: false,
                  param_changes: [],
                  refresher_exploration_id: null,
                },
                rule_specs: [
                  {
                    rule_type: 'Equals',
                    inputs: {x: 10},
                  },
                ],
                tagged_skill_misconception_id: 'abc-1',
              },
            ],
            confirmed_unclassified_answers: [],
            customization_args: {
              placeholder: {
                value: {
                  content_id: 'ca_placeholder_0',
                  unicode_str: '',
                },
              },
              rows: {value: 1},
              catchMisspellings: {
                value: false,
              },
            },
            default_outcome: {
              dest: '',
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              dest_if_really_stuck: null,
              feedback: {
                html: 'Correct Answer',
                content_id: 'content_2',
              },
              param_changes: [],
              labelled_as_correct: false,
            },
            hints: [
              {
                hint_content: {
                  html: 'Hint 1',
                  content_id: 'content_3',
                },
              },
            ],
            solution: {
              correct_answer: 'This is the correct answer',
              answer_is_exclusive: false,
              explanation: {
                html: 'Solution explanation',
                content_id: 'content_4',
              },
            },
            id: 'TextInput',
          },
          param_changes: [],
          recorded_voiceovers: {
            voiceovers_mapping: {
              content_1: {},
              content_2: {},
              content_3: {},
              content_4: {},
              content_5: {},
            },
          },
          solicit_answer_details: false,
          inapplicable_skill_misconception_ids: [],
        },
        language_code: 'en',
        version: 1,
        linked_skill_ids: ['abc'],
        next_content_id_index: 6,
        inapplicable_skill_misconception_ids: ['abc-2'],
      };

      let suggestion = {
        change_cmd: {
          skill_id: 'string',
          question_dict: questionDict,
          skill_difficulty: [],
          translation_html: ['suggestion_1', 'suggestion_2'],
          content_html: '',
        },
        status: 'review',
        target_id: 'string;,',
        suggestion_id: 'string;',
        author_name: 'string;',
        suggestion_type: 'question',
        exploration_content_html: '',
      };

      let suggestionIdToContribution = {
        suggestion_1: {
          suggestion: {
            exploration_content_html: 'html',
            language_code: 'en',
            target_type: 'exploration',
            author_name: 'author',
            last_updated_msecs: 1000,
            suggestion_id: 'suggestion_1',
            target_id: '1',
            suggestion_type: 'translate_content',
            change_cmd: {
              cmd: 'add_translation',
              content_html: 'content',
              content_id: 'content_id',
              data_format: 'html',
              language_code: 'en',
              translation_html: 'translation',
              state_name: 'State Name',
              new_value: null,
              old_value: null,
              skill_id: 'skill1',
              question_dict: {
                id: '1',
                question_state_data: {
                  content: {
                    html: 'Question 1',
                    content_id: 'content_1',
                  },
                  interaction: {
                    answer_groups: [
                      {
                        outcome: {
                          dest: 'outcome 1',
                          dest_if_really_stuck: null,
                          feedback: {
                            content_id: 'content_5',
                            html: '',
                          },
                          labelled_as_correct: true,
                          param_changes: [],
                          refresher_exploration_id: null,
                        },
                        rule_specs: [],
                      },
                    ],
                    confirmed_unclassified_answers: [],
                    customization_args: {
                      placeholder: {
                        value: {
                          content_id: 'ca_placeholder_0',
                          unicode_str: '',
                        },
                      },
                      rows: {value: 1},
                      catchMisspellings: {
                        value: false,
                      },
                    },
                    default_outcome: {
                      dest: '',
                      dest_if_really_stuck: null,
                      feedback: {
                        html: 'Correct Answer',
                        content_id: 'content_2',
                      },
                      param_changes: [],
                      labelled_as_correct: true,
                    },
                    hints: [
                      {
                        hint_content: {
                          html: 'Hint 1',
                          content_id: 'content_3',
                        },
                      },
                    ],
                    solution: {
                      correct_answer: 'This is the correct answer',
                      answer_is_exclusive: false,
                      explanation: {
                        html: 'Solution explanation',
                        content_id: 'content_4',
                      },
                    },
                    id: 'TextInput',
                  },
                  param_changes: [],
                  recorded_voiceovers: {
                    voiceovers_mapping: {},
                  },
                },
              },
            },
            status: 'review',
          },
          details: {
            skill_description: 'Skill description',
            skill_id: 'skill_id',
            chapter_title: 'chapter_title',
            story_title: 'story_title',
            topic_name: 'topic_name',
          },
        },
      };

      component._showQuestionSuggestionModal(
        suggestion,
        suggestionIdToContribution,
        false,
        {} as unknown as Question,
        {}
      );

      let value = {
        suggestionId: null,
        suggestion: null,
        reviewable: null,
        question: null,
      };
      eventEmitter.emit(value);
      tick();

      expect(
        contributionAndReviewService.reviewSkillSuggestion
      ).toHaveBeenCalled();
      expect(component.openQuestionSuggestionModal).toHaveBeenCalled();
      expect(ngbModal.open).toHaveBeenCalled();
    }));

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

    describe('loadContributions', () => {
      it('should load reviewable questions', () => {
        component
          .loadContributions(false)
          .then(({opportunitiesDicts, more}) => {
            expect(Object.keys(component.contributions)).toContain(
              'suggestion_1'
            );
            expect(opportunitiesDicts).toEqual([
              {
                id: 'suggestion_1',
                heading: 'Question 1',
                subheading: 'Skill description',
                labelText: 'Awaiting review',
                labelColor: '#eeeeee',
                actionButtonTitle: 'Review',
              },
            ]);
            expect(more).toEqual(false);
          });
      });

      it('should load translation contributions', () => {
        getUserCreatedTranslationSuggestionsAsyncSpy.and.returnValue(
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
                  exploration_content_html: 'html',
                  change_cmd: {
                    state_name: null,
                    new_value: null,
                    old_value: null,
                    content_html: 'Translation',
                    translation_html: 'Tradução',
                    skill_id: 'skill_id',
                  },
                  status: 'rejected',
                },
                details: {
                  topic_name: 'topic_name',
                  story_title: 'story_title',
                  chapter_title: 'chapter_title',
                },
              },
            },
            more: false,
          })
        );

        component.switchToTab(
          component.TAB_TYPE_CONTRIBUTIONS,
          'translate_content'
        );

        component
          .loadContributions(false)
          .then(({opportunitiesDicts, more}) => {
            expect(Object.keys(component.contributions)).toContain(
              'suggestion_1'
            );
            expect(opportunitiesDicts).toEqual([
              {
                id: 'suggestion_1',
                heading: 'Tradução',
                subheading: 'topic_name / story_title / chapter_title',
                labelText: 'Revisions Requested',
                labelColor: '#e76c8c',
                actionButtonTitle: 'View',
                translationWordCount: undefined,
              },
            ]);
            expect(more).toEqual(false);
          });
      });

      it('should show only selected type when switching tabs', fakeAsync(() => {
        const suggestion1 = {
          suggestion_1: {
            suggestion: {
              target_type: 'state',
              author_name: 'rod newt',
              last_updated_msecs: '66778',
              suggestion_id: 'suggestion_1',
              target_id: '1',
              suggestion_type: 'translate_content',
              exploration_content_html: 'html',
              change_cmd: {
                state_name: 'state',
                new_value: 'new',
                old_value: 'old',
                content_html: 'Translation',
                translation_html: 'Tradução',
              },
              status: 'rejected',
            },
            details: {
              topic_name: 'topic_name',
              story_title: 'story_title',
              chapter_title: 'chapter_title',
            },
          },
        };
        const contributionTranslation = Promise.resolve({
          suggestionIdToDetails: suggestion1,
          more: false,
        });
        getUserCreatedTranslationSuggestionsAsyncSpy.and.returnValue(
          contributionTranslation
        );

        // Go to the contribution translations tab, to ensure that
        // getUserCreatedTranslationSuggestionsAsyncSpy is
        // called by loadContributions.
        component.switchToTab(
          component.TAB_TYPE_CONTRIBUTIONS,
          'translate_content'
        );

        // Set up contributions with a translation.
        component
          .loadContributions(false)
          .then(({opportunitiesDicts, more}) => {
            expect(Object.keys(component.contributions)).toContain(
              'suggestion_1'
            );
            expect(opportunitiesDicts).toEqual([
              {
                id: 'suggestion_1',
                heading: 'Tradução',
                subheading: 'topic_name / story_title / chapter_title',
                labelText: 'Revisions Requested',
                labelColor: '#e76c8c',
                actionButtonTitle: 'View',
                translationWordCount: undefined,
              },
            ]);
            expect(more).toEqual(false);

            // When opening the contribution modal for translations,
            // only translations should be shown.
            spyOn(component, '_showTranslationSuggestionModal');
            component.onClickViewSuggestion('suggestion_1');
            expect(
              component._showTranslationSuggestionModal
            ).toHaveBeenCalledWith(suggestion1, 'suggestion_1', false);
          });
        // Wait for the first test to complete.
        tick();

        const suggestion2 = {
          target_type: 'state',
          author_name: 'eddie name',
          last_updated_msecs: '345435',
          suggestion_id: 'suggestion_2',
          target_id: '1',
          suggestion_type: 'add_question',
          change_cmd: {
            state_name: 'state',
            new_value: 'new',
            old_value: 'old',
            skill_id: 'skill1',
            question_dict: {
              id: '1',
              question_state_data: {
                content: {
                  html: 'Question 2',
                  content_id: 'content_2',
                },
                interaction: {
                  answer_groups: [
                    {
                      outcome: {
                        dest: 'outcome 1',
                        dest_if_really_stuck: null,
                        feedback: {
                          content_id: 'content_1',
                          html: '',
                        },
                        labelled_as_correct: true,
                        param_changes: [],
                        refresher_exploration_id: null,
                      },
                      rule_specs: [],
                    },
                  ],
                  confirmed_unclassified_answers: [],
                  customization_args: {
                    placeholder: {
                      value: {
                        content_id: 'ca_placeholder_0',
                        unicode_str: '',
                      },
                    },
                    rows: {value: 1},
                    catchMisspellings: {
                      value: false,
                    },
                  },
                  default_outcome: {
                    dest: '',
                    dest_if_really_stuck: null,
                    feedback: {
                      html: 'Correct Answer',
                      content_id: 'content_2',
                    },
                    param_changes: [],
                    labelled_as_correct: true,
                  },
                  hints: [
                    {
                      hint_content: {
                        html: 'Hint 1',
                        content_id: 'content_3',
                      },
                    },
                  ],
                  solution: {
                    correct_answer: 'This is the correct answer',
                    answer_is_exclusive: false,
                    explanation: {
                      html: 'Solution explanation',
                      content_id: 'content_4',
                    },
                  },
                  id: 'TextInput',
                },
                param_changes: [],
                recorded_voiceovers: {
                  voiceovers_mapping: {},
                },
              },
            },
          },
          status: 'accepted',
        };
        getUserCreatedQuestionSuggestionsAsyncSpy.and.returnValue(
          Promise.resolve({
            suggestionIdToDetails: {
              suggestion_2: {
                suggestion: suggestion2,
                details: {
                  skill_id: 'skill_1',
                  skill_description: 'skill_1',
                },
              },
            },
            more: false,
          })
        );

        // Go to the add questions tab, to ensure that
        // getUserCreatedQuestionSuggestionsAsyncSpy is
        // called by loadContributions.
        component.switchToTab(component.TAB_TYPE_CONTRIBUTIONS, 'add_question');

        // Load contributions object with a question. This should also remove
        // any data created in the previous call to loadContributions
        // from the component.contributions object.
        component
          .loadContributions(false)
          .then(({opportunitiesDicts, more}) => {
            expect(Object.keys(component.contributions)).toContain(
              'suggestion_2'
            );
            expect(opportunitiesDicts).toEqual([
              {
                id: 'suggestion_2',
                heading: 'Question 2',
                subheading: 'skill_1',
                labelText: 'Accepted',
                labelColor: '#8ed274',
                actionButtonTitle: 'View',
              },
            ]);
            expect(more).toEqual(false);

            // When opening the contribution modal for questions,
            // only contribution questions should be shown.
            spyOn(component, 'openQuestionSuggestionModal');
            component.onClickViewSuggestion('suggestion_2');

            expect(component.openQuestionSuggestionModal).toHaveBeenCalledWith(
              'suggestion_2',
              suggestion2,
              false
            );
          });
      }));

      it('should return empty list if tab is not initialized', () => {
        component.activeTabType = '';
        component
          .loadContributions(false)
          .then(({opportunitiesDicts, more}) => {
            expect(opportunitiesDicts).toEqual([]);
            expect(more).toEqual(false);
          });
      });

      it('should return empty list if suggestion type is not initialized', () => {
        component.activeTabType = '';
        component
          .loadContributions(false)
          .then(({opportunitiesDicts, more}) => {
            expect(opportunitiesDicts).toEqual([]);
            expect(more).toEqual(false);
          });
      });

      it('should not overwrite previously fetched data', fakeAsync(() => {
        const mockSuggestions: Record<
          string,
          {suggestion: Suggestion; details: ContributionDetails}
        > = {};
        const totalOpportunitiesToBeFetched =
          AppConstants.OPPORTUNITIES_PAGE_SIZE + 2;
        for (let i = 1; i <= totalOpportunitiesToBeFetched; i++) {
          mockSuggestions[`suggestion_${i}`] = {
            suggestion: {
              change_cmd: {
                skill_id: 'string',
                content_html: 'string',
                translation_html: 'html',
                question_dict: {
                  question_state_data: {
                    content: {
                      html: 'html',
                      content_id: 'content_id',
                    },
                    classifier_model_id: '',
                    interaction: {
                      answer_groups: [],
                      confirmed_unclassified_answers: [],
                      customization_args: {},
                      default_outcome: {
                        dest: '',
                        dest_if_really_stuck: null,
                        feedback: {
                          content_id: 'content_id',
                          html: 'html',
                        },
                        labelled_as_correct: false,
                        param_changes: [],
                        refresher_exploration_id: null,
                        missing_prerequisite_skill_id: null,
                      },
                      hints: [],
                      solution: null,
                      id: 'TextInput',
                    },
                    param_changes: [],
                    solicit_answer_details: false,
                    card_is_checkpoint: false,
                    linked_skill_id: null,
                    inapplicable_skill_misconception_ids: [],
                  },
                  id: 'question_id',
                  question_state_data_schema_version: 1,
                  language_code: 'en',
                  version: 1,
                  linked_skill_ids: [],
                  inapplicable_skill_misconception_ids: [],
                  next_content_id_index: 0,
                },
                skill_difficulty: ['Medium'],
              },
              target_id: 'string;,',
              suggestion_id: 'suggestion_id',
              author_name: 'string;',
              status: 'review',
              suggestion_type: 'string',
              exploration_content_html: 'html',
            },
            details: {
              skill_description: 'skill_description',
              topic_name: 'topic_name',
              story_title: 'story_title',
              chapter_title: 'chapter_title',
              skill_rubrics: [],
            },
          };
        }

        getReviewableQuestionSuggestionsAsyncSpy.and.returnValues(
          Promise.resolve({
            suggestionIdToDetails: Object.fromEntries(
              Object.entries(mockSuggestions).slice(
                0,
                AppConstants.OPPORTUNITIES_PAGE_SIZE
              ) // First AppConstants.OPPORTUNITIES_PAGE_SIZE suggestions.
            ),
            more: true,
          }),
          Promise.resolve({
            suggestionIdToDetails: Object.fromEntries(
              Object.entries(mockSuggestions).slice(
                AppConstants.OPPORTUNITIES_PAGE_SIZE,
                totalOpportunitiesToBeFetched
              ) // Remaining suggestions.
            ),
            more: false,
          })
        );

        component.switchToTab(component.TAB_TYPE_REVIEWS, 'add_question');

        // First call to loadContributions, should get AppConstants.OPPORTUNITIES_PAGE_SIZE questions and "more" flag true.
        component.loadContributions(true).then(({opportunitiesDicts, more}) => {
          const availableQuestionSuggestions = Object.keys(
            component.contributions
          ).length;
          const expectedQuestionSuggestions =
            AppConstants.OPPORTUNITIES_PAGE_SIZE;
          const fetchedQuestionSuggestions = opportunitiesDicts.length;
          expect(availableQuestionSuggestions).toBe(
            expectedQuestionSuggestions
          );
          expect(fetchedQuestionSuggestions).toBe(expectedQuestionSuggestions);
          expect(more).toBe(true);

          component
            .loadContributions(false)
            .then(({opportunitiesDicts, more}) => {
              const updatedAvailableQuestionSuggestions = Object.keys(
                component.contributions
              ).length;
              const newlyFetchedQuestionSuggestions = opportunitiesDicts.length;
              expect(updatedAvailableQuestionSuggestions).toBe(
                totalOpportunitiesToBeFetched
              );
              expect(newlyFetchedQuestionSuggestions).toBe(
                totalOpportunitiesToBeFetched - availableQuestionSuggestions
              );
              expect(more).toBe(false);
            });
        });
      }));
    });

    it('should load reviewable translation opportunities correctly', () => {
      component
        .loadReviewableTranslationOpportunities()
        .then(({opportunitiesDicts, more}) => {
          expect(opportunitiesDicts).toEqual([
            {
              id: '1',
              heading: 'Chapter 1',
              subheading: 'Topic 1 - Story 1',
              actionButtonTitle: 'Translations',
              translationWordCount: 0,
              labelText: '',
              labelColor: '',
              isPinned: false,
              topicName: 'Topic 1',
            } as unknown as Opportunity,
            {
              id: '2',
              heading: 'Chapter 2',
              subheading: 'Topic 2 - Story 2',
              actionButtonTitle: 'Translations',
              translationWordCount: 0,
              labelText: '',
              labelColor: '',
              isPinned: false,
              topicName: 'Topic 2',
            } as unknown as Opportunity,
          ]);
          expect(more).toEqual(false);
        });
    });

    it('should open a snackbar if a pinned opportunity already exists', () => {
      const openSnackbarSpy = spyOn(component, 'openSnackbarWithAction');

      const dict = {
        topic_name: 'Topic 1',
        exploration_id: '1',
      };
      component.opportunities = [
        {
          id: '1',
          topicName: 'Topic 1',
          storyTitle: 'Story 1',
          chapterTitle: 'Chapter 1',
          contentCount: 10,
          translationCounts: {},
          translationInReviewCount: {},
          languageCode: 'en',
          isPinned: true,
        } as ExplorationOpportunitySummary,
        {
          id: '2',
          topicName: 'Topic 1',
          storyTitle: 'Story 1',
          chapterTitle: 'Chapter 1',
          contentCount: 10,
          translationCounts: {},
          translationInReviewCount: {},
          languageCode: 'en',
          isPinned: false,
        } as ExplorationOpportunitySummary,
        {
          id: '3',
          topicName: 'Topic 1',
          storyTitle: 'Story 1',
          chapterTitle: 'Chapter 1',
          contentCount: 10,
          translationCounts: {},
          translationInReviewCount: {},
          languageCode: 'en',
          isPinned: false,
        } as ExplorationOpportunitySummary,
      ];
      component.languageCode = 'en';

      component.pinReviewableTranslationOpportunity(dict);

      expect(openSnackbarSpy).toHaveBeenCalledWith(
        'Topic 1',
        '1',
        'A pinned opportunity already exists for this topic and language.',
        'Pin Anyway'
      );
    });

    it(
      'should call pinReviewableTranslationOpportunityAsync if no pinned' +
        ' opportunity exists',
      fakeAsync(() => {
        const pinReviewableTranslationOpportunityAsyncSpy = spyOn(
          contributionOpportunitiesService,
          'pinReviewableTranslationOpportunityAsync'
        ).and.returnValue(Promise.resolve({}));

        const dict = {
          topic_name: 'Topic 3',
          exploration_id: '8',
        };
        component.opportunities = [
          {
            id: '1',
            topicName: 'Topic 1',
            storyTitle: 'Story 1',
            chapterTitle: 'Chapter 1',
            contentCount: 10,
            translationCounts: {},
            translationInReviewCount: {},
            languageCode: 'en',
            isPinned: true,
          } as ExplorationOpportunitySummary,
          {
            id: '2',
            topicName: 'Topic 1',
            storyTitle: 'Story 1',
            chapterTitle: 'Chapter 1',
            contentCount: 10,
            translationCounts: {},
            translationInReviewCount: {},
            languageCode: 'en',
            isPinned: false,
          } as ExplorationOpportunitySummary,
          {
            id: '3',
            topicName: 'Topic 1',
            storyTitle: 'Story 1',
            chapterTitle: 'Chapter 1',
            contentCount: 10,
            translationCounts: {},
            translationInReviewCount: {},
            languageCode: 'en',
            isPinned: false,
          } as ExplorationOpportunitySummary,
        ];
        component.languageCode = 'en';

        component.pinReviewableTranslationOpportunity(dict);
        tick();

        expect(
          pinReviewableTranslationOpportunityAsyncSpy
        ).toHaveBeenCalledWith('Topic 3', component.languageCode, '8');
      })
    );

    it('should call unpinReviewableTranslationOpportunityAsync', fakeAsync(() => {
      const unpinReviewableTranslationOpportunityAsyncSpy = spyOn(
        contributionOpportunitiesService,
        'unpinReviewableTranslationOpportunityAsync'
      ).and.returnValue(Promise.resolve({}));

      component.languageCode = 'en';

      component.unpinReviewableTranslationOpportunity({
        topic_name: 'Dummy Topic 1',
        exploration_id: '1',
      });
      tick();

      expect(
        unpinReviewableTranslationOpportunityAsyncSpy
      ).toHaveBeenCalledWith('Dummy Topic 1', component.languageCode, '1');
    }));

    it('should open snackbar and handle action', fakeAsync(() => {
      spyOn(snackBar, 'open').and.callFake(
        (message: string, actionText: string, config: MatSnackBarConfig) => {
          const data = TestBed.inject(MAT_SNACK_BAR_DATA);
          data.onAction = of(null);
          return {
            onAction: () => data.onAction,
            dismiss: () => {},
          };
        }
      );
      spyOn(
        contributionOpportunitiesService,
        'pinReviewableTranslationOpportunityAsync'
      ).and.returnValue(Promise.resolve());

      component.openSnackbarWithAction(
        'testTopic',
        'testExploration',
        'Test message',
        'Action text'
      );

      tick();
      fixture.detectChanges();
      tick();
    }));

    // TODO(#9749): Rename and actually assert on something. This test currently
    // only exists to satisfy code coverage.
    it('should cover other code too', fakeAsync(() => {
      jasmine
        .createSpy('userReviewableSuggestionTypes.length')
        .and.returnValue(0);
      component.SUGGESTION_TYPE_TRANSLATE = '';
      component.SUGGESTION_TYPE_QUESTION = '';
      getUserContributionRightsDataAsyncSpy.and.returnValue(
        Promise.resolve({
          can_review_translation_for_language_codes: ['something', 'cool'],
          can_review_questions: false,
          can_review_voiceover_for_language_codes: ['something', 'cool'],
          can_suggest_questions: true,
        })
      );

      tick();
      component.ngOnInit();
      tick();

      expect(getUserContributionRightsDataAsyncSpy).toHaveBeenCalled();
    }));

    // TODO(#9749): Rename and actually assert on something. This test currently
    // only exists to satisfy code coverage.
    it('should cover other code too', fakeAsync(() => {
      jasmine
        .createSpy('userReviewableSuggestionTypes.length')
        .and.returnValue(0);
      component.SUGGESTION_TYPE_TRANSLATE = '';
      component.SUGGESTION_TYPE_QUESTION = '';
      getUserContributionRightsDataAsyncSpy.and.returnValue(
        Promise.resolve({
          can_review_translation_for_language_codes: [],
          can_review_questions: false,
          can_review_voiceover_for_language_codes: ['something', 'cool'],
          can_suggest_questions: true,
        })
      );

      tick();
      component.ngOnInit();
      tick();

      expect(getUserContributionRightsDataAsyncSpy).toHaveBeenCalled();
    }));

    // TODO(#9749): Split into multiple tests. Currently, this test only exists
    // to satisfy code coverage for ngOnInit() and
    // tabNameToOpportunityFetchFunction.
    it('should completely test onInIt', fakeAsync(() => {
      jasmine
        .createSpy('userReviewableSuggestionTypes.length')
        .and.returnValue(0);
      component.SUGGESTION_TYPE_TRANSLATE = '';
      component.SUGGESTION_TYPE_QUESTION = '';
      getUserContributionRightsDataAsyncSpy.and.returnValue(
        Promise.resolve({
          can_review_translation_for_language_codes: [],
          can_review_questions: false,
          can_review_voiceover_for_language_codes: ['something', 'cool'],
          can_suggest_questions: false,
        })
      );

      tick();
      component.ngOnInit();
      tick();

      component.tabNameToOpportunityFetchFunction[
        component.SUGGESTION_TYPE_QUESTION
      ][component.TAB_TYPE_CONTRIBUTIONS](false);

      component.tabNameToOpportunityFetchFunction[
        component.SUGGESTION_TYPE_TRANSLATE
      ][component.TAB_TYPE_REVIEWS](false);

      expect(
        contributionAndReviewService.getUserCreatedQuestionSuggestionsAsync
      ).toHaveBeenCalled();
      expect(
        contributionOpportunitiesService.getReviewableTranslationOpportunitiesAsync
      ).toHaveBeenCalled();
    }));

    it('should load opportunities correctly', () => {
      component.loadOpportunities().then(({opportunitiesDicts, more}) => {
        expect(Object.keys(component.contributions)).toContain('suggestion_1');
        expect(opportunitiesDicts).toEqual([
          {
            id: 'suggestion_1',
            heading: 'Question 1',
            subheading: 'Skill description',
            labelText: 'Awaiting review',
            labelColor: '#eeeeee',
            actionButtonTitle: 'Review',
          },
        ]);
        expect(more).toEqual(false);
      });

      // Repeated calls should return the same results.
      component.loadOpportunities().then(({opportunitiesDicts, more}) => {
        expect(Object.keys(component.contributions)).toContain('suggestion_1');
        expect(opportunitiesDicts).toEqual([
          {
            id: 'suggestion_1',
            heading: 'Question 1',
            subheading: 'Skill description',
            labelText: 'Awaiting review',
            labelColor: '#eeeeee',
            actionButtonTitle: 'Review',
          },
        ]);
        expect(more).toEqual(false);
      });
    });

    it('should load more opportunities correctly', () => {
      spyOn(translationTopicService, 'getActiveTopicName').and.returnValue(
        'activeTopicName'
      );
      component.loadMoreOpportunities().then(({opportunitiesDicts, more}) => {
        expect(Object.keys(component.contributions)).toContain('suggestion_1');
        expect(opportunitiesDicts).toEqual([
          {
            id: 'suggestion_1',
            heading: 'Question 1',
            subheading: 'Skill description',
            labelText: 'Awaiting review',
            labelColor: '#eeeeee',
            actionButtonTitle: 'Review',
          },
        ]);
        expect(more).toEqual(false);
      });
      expect(getReviewableQuestionSuggestionsAsyncSpy).toHaveBeenCalledWith(
        false,
        'Date',
        'activeTopicName'
      );

      getReviewableQuestionSuggestionsAsyncSpy.and.returnValue(
        Promise.resolve({})
      );

      // Subsequent calls should return the next batch of results.
      component.loadMoreOpportunities().then(({opportunitiesDicts, more}) => {
        expect(Object.keys(component.contributions).length).toBe(0);
        expect(more).toEqual(false);
      });
    });

    // TODO(#9749): Actually check that returned subeadings are null when
    // suggestion details are null. Currently, this test does not assert on
    // anything and is only here to satisfy code coverage.
    it('should set getQuestionContributionsSummary summary', () => {
      let suggestion = {
        key: {
          suggestion: {
            change_cmd: {
              skill_id: 'string',
              content_html: 'string',
              translation_html: 'html',
              question_dict: {
                question_state_data: {
                  content: {
                    html: 'html',
                    content_id: 'content_id',
                  },
                },
              } as QuestionBackendDict,
              skill_difficulty: [],
            },
            target_id: 'string;,',
            suggestion_id: 'suggestion_id',
            author_name: 'string;',
            status: 'review',
            suggestion_type: 'string',
            exploration_content_html: '',
          } as Suggestion,
          details: {
            skill_description: '',
            skill_rubrics: [],
            chapter_title: '',
            story_title: '',
            topic_name: '',
          } as ContributionDetails,
        },
      };

      spyOn(formatRtePreviewPipe, 'transform').and.returnValue('heading');
      component.getQuestionContributionsSummary(suggestion);
      component.getTranslationContributionsSummary(suggestion);
    });

    it(
      'should open show translation suggestion modal when clicking on' +
        ' suggestion',
      () => {
        contributionOpportunitiesService.reloadOpportunitiesEventEmitter.subscribe(
          () => {
            component.loadContributions(false).then(() => {
              spyOn(ngbModal, 'open').and.callThrough();
              component.onClickViewSuggestion('suggestion_1');

              expect(ngbModal.open).toHaveBeenCalled();
            });
          }
        );

        component.switchToTab(
          component.TAB_TYPE_CONTRIBUTIONS,
          'translate_content'
        );
      }
    );

    describe('when navigating to review tab', () => {
      it('should get in-review translation suggestions', fakeAsync(() => {
        spyOn(formatRtePreviewPipe, 'transform').and.returnValue(
          'Traducáú &amp;'
        );
        spyOn(htmlEscaperService, 'escapedStrToUnescapedStr').and.returnValue(
          'Traducáú &'
        );
        let suggestionIdToSuggestions = {
          suggestion: {
            suggestion: {
              author_name: 'a',
              target_id: '1',
              suggestion_id: 'id',
              suggestion_type: 'translate_content',
              exploration_content_html: 'html',
              status: 'review',
              change_cmd: {
                content_html: ['<p>This is test para</p>'],
                translation_html: '<p>Traducáú &amp;</p>',
              },
            } as Suggestion,
            details: {
              skill_description: 'skill_description',
              topic_name: 'topic_name',
              story_title: 'story_title',
              chapter_title: 'chapter_title',
            } as ContributionDetails,
          },
        } as Record<string, SuggestionDetails>;

        component.activeTabType = component.TAB_TYPE_REVIEWS;
        component.activeTabSubtype = component.SUGGESTION_TYPE_TRANSLATE;
        component.activeExplorationId = 'id';
        tick();

        expect(
          component.getTranslationContributionsSummary(
            suggestionIdToSuggestions
          )
        ).toEqual([
          {
            id: 'id',
            heading: 'Traducáú &',
            subheading: 'topic_name / story_title / chapter_title',
            labelText: 'Awaiting review',
            labelColor: '#eeeeee',
            actionButtonTitle: 'Review',
            translationWordCount: 4,
          },
        ]);
      }));

      it(
        'should get in-review translation suggestions with' +
          'correct translation word count',
        fakeAsync(() => {
          spyOn(formatRtePreviewPipe, 'transform').and.returnValue(
            'Traducáú &amp;'
          );
          spyOn(htmlEscaperService, 'escapedStrToUnescapedStr').and.returnValue(
            'Traducáú &'
          );
          let suggestionIdToSuggestions = {
            suggestion: {
              suggestion: {
                author_name: 'a',
                target_id: '1',
                suggestion_id: 'id',
                suggestion_type: 'translate_content',
                exploration_content_html: 'html',
                status: 'review',
                change_cmd: {
                  content_html: '<p>This is test para</p>',
                  translation_html: '<p>Traducáú &amp;</p>',
                },
              } as Suggestion,
              details: {
                skill_description: 'skill_description',
                topic_name: 'topic_name',
                story_title: 'story_title',
                chapter_title: 'chapter_title',
              } as ContributionDetails,
            },
          } as Record<string, SuggestionDetails>;

          component.activeTabType = component.TAB_TYPE_REVIEWS;
          component.activeTabSubtype = component.SUGGESTION_TYPE_TRANSLATE;
          component.activeExplorationId = 'id';
          tick();

          expect(
            component.getTranslationContributionsSummary(
              suggestionIdToSuggestions
            )
          ).toEqual([
            {
              id: 'id',
              heading: 'Traducáú &',
              subheading: 'topic_name / story_title / chapter_title',
              labelText: 'Awaiting review',
              labelColor: '#eeeeee',
              actionButtonTitle: 'Review',
              translationWordCount: 4,
            },
          ]);

          suggestionIdToSuggestions = {
            suggestion: {
              suggestion: {
                author_name: 'a',
                target_id: '1',
                suggestion_id: 'id',
                suggestion_type: 'translate_content',
                exploration_content_html: 'html',
                status: 'review',
                change_cmd: {
                  content_html: [
                    '<p>This is test para</p>',
                    '<p>This is test para 2</p>',
                    '<p>Test para 3</p>',
                  ],
                  translation_html: '<p>Traducáú &amp;</p>',
                },
              } as Suggestion,
              details: {
                skill_description: 'skill_description',
                topic_name: 'topic_name',
                story_title: 'story_title',
                chapter_title: 'chapter_title',
              } as ContributionDetails,
            },
          } as Record<string, SuggestionDetails>;

          expect(
            component.getTranslationContributionsSummary(
              suggestionIdToSuggestions
            )
          ).toEqual([
            {
              id: 'id',
              heading: 'Traducáú &',
              subheading: 'topic_name / story_title / chapter_title',
              labelText: 'Awaiting review',
              labelColor: '#eeeeee',
              actionButtonTitle: 'Review',
              translationWordCount: 12,
            },
          ]);

          suggestionIdToSuggestions = {
            suggestion: {
              suggestion: {
                author_name: 'a',
                target_id: '1',
                suggestion_id: 'id',
                suggestion_type: 'translate_content',
                exploration_content_html: 'html',
                status: 'review',
                change_cmd: {
                  content_html: 1 as unknown,
                  translation_html: '<p>Traducáú &amp;</p>',
                },
              } as Suggestion,
              details: {
                skill_description: 'skill_description',
                topic_name: 'topic_name',
                story_title: 'story_title',
                chapter_title: 'chapter_title',
              } as ContributionDetails,
            },
          } as Record<string, SuggestionDetails>;

          expect(() => {
            component.getTranslationContributionsSummary(
              suggestionIdToSuggestions
            );
          }).toThrowError(
            'Invalid input: contentHtml must be a string or an array of ' +
              'strings.'
          );
        })
      );

      it('should get in-review question suggestions', fakeAsync(() => {
        spyOn(formatRtePreviewPipe, 'transform').and.returnValue('heading');
        let suggestionIdToSuggestions = {
          suggestion_1: {
            suggestion: {
              suggestion_type: 'add_question',
              target_id: 'target_id',
              suggestion_id: 'id',
              status: 'review',
              author_name: '',
              exploration_content_html: '',
              change_cmd: {
                skill_id: 'skill_id',
                question_dict: {
                  question_state_data: {
                    content: {
                      html: 'html',
                    },
                  },
                } as QuestionBackendDict,
                skill_difficulty: [],
                content_html: '',
                translation_html: '',
              },
            },
            details: {
              skill_description: 'skill_description',
              topic_name: 'topic_name',
              story_title: 'story_title',
              chapter_title: 'chapter_title',
              skill_rubrics: [],
            },
          },
        };

        component.activeTabType = component.TAB_TYPE_REVIEWS;
        tick();

        expect(
          component.getQuestionContributionsSummary(
            suggestionIdToSuggestions as Record<string, SuggestionDetails>
          )
        ).toEqual([
          {
            id: 'id',
            heading: 'heading',
            subheading: 'skill_description',
            labelText: 'Awaiting review',
            labelColor: '#eeeeee',
            actionButtonTitle: 'Review',
          },
        ]);
      }));

      it('should resolve suggestion when closing show suggestion modal', () => {
        contributionOpportunitiesService.reloadOpportunitiesEventEmitter.subscribe(
          () => {
            component.loadContributions(false).then(() => {
              spyOn(ngbModal, 'open').and.returnValue({
                result: Promise.resolve({
                  action: 'add',
                  reviewMessage: 'Review message',
                  skillDifficulty: 'Easy',
                }),
              } as NgbModalRef);
              component.onClickViewSuggestion('suggestion_1');

              expect(ngbModal.open).toHaveBeenCalled();
            });
          }
        );
        component.switchToTab(
          component.TAB_TYPE_CONTRIBUTIONS,
          'translate_content'
        );
      });

      it('should not resolve suggestion when dismissing show suggestion modal', () => {
        contributionOpportunitiesService.reloadOpportunitiesEventEmitter.subscribe(
          () => {
            component.loadContributions(false).then(() => {
              spyOn(ngbModal, 'open').and.returnValue({
                result: Promise.reject(),
              } as NgbModalRef);
              component.onClickViewSuggestion('suggestion_1');

              expect(ngbModal.open).toHaveBeenCalled();
            });
          }
        );
        component.switchToTab(
          component.TAB_TYPE_CONTRIBUTIONS,
          'translate_content'
        );
      });
      it('should update topicReady when active topic changes', fakeAsync(() => {
        const getActiveTopicNameSpy = spyOn(
          translationTopicService,
          'getActiveTopicName'
        );

        getActiveTopicNameSpy.and.returnValue(null);
        mockActiveTopicEventEmitter.emit();
        tick();

        expect(component.topicReady).toBe(false);

        getActiveTopicNameSpy.and.returnValue('Math');
        mockActiveTopicEventEmitter.emit();
        tick();

        expect(component.topicReady).toBe(true);
      }));

      describe(
        'when user is allowed to review questions and ' +
          'skill details are empty',
        () => {
          it(
            'should open suggestion modal when user clicks on ' +
              'view suggestion',
            () => {
              contributionOpportunitiesService.reloadOpportunitiesEventEmitter.subscribe(
                () => {
                  component.loadContributions(false).then(() => {
                    spyOn(ngbModal, 'open').and.returnValue({
                      result: Promise.reject(),
                    } as NgbModalRef);
                    component.onClickViewSuggestion('suggestion_1');

                    expect(ngbModal.open).toHaveBeenCalled();
                  });
                }
              );
              component.switchToTab(
                component.TAB_TYPE_CONTRIBUTIONS,
                'translate_content'
              );
            }
          );
        }
      );

      // TODO(#9749): Refactor describe block, since the user *is* allowed to
      // review questions here.
      describe('when user is not allowed to review questions', () => {
        it(
          'should initialize component properties after component is' +
            ' initialized',
          () => {
            expect(component.activeTabType).toBe('reviews');
            expect(component.activeTabSubtype).toBe('add_question');
            expect(component.activeDropdownTabChoice).toBe('Review Questions');
            expect(component.userIsLoggedIn).toBe(true);
            expect(component.userDetailsLoading).toBe(false);
            expect(component.reviewTabs.length).toEqual(2);
          }
        );

        it(
          'should open show view question modal when clicking on' +
            ' question suggestion',
          () => {
            spyOn(ngbModal, 'open').and.callThrough();
            component.switchToTab(component.TAB_TYPE_REVIEWS, 'add_question');
            component.loadContributions(false).then(() => {
              component.onClickViewSuggestion('suggestion_1');

              expect(ngbModal.open).toHaveBeenCalled();
            });
          }
        );

        it(
          'should resolve suggestion to skill when closing show question' +
            ' suggestion modal',
          () => {
            spyOn(ngbModal, 'open').and.returnValue({
              result: Promise.resolve({}),
            } as NgbModalRef);

            component.switchToTab(component.TAB_TYPE_REVIEWS, 'add_question');
            component.loadContributions(false).then(() => {
              expect(Object.keys(component.contributions).length).toBe(1);
              component.onClickViewSuggestion('suggestion_1');
              flush();

              expect(ngbModal.open).toHaveBeenCalled();
            });
          }
        );

        it(
          'should not resolve suggestion to skill when dismissing show question' +
            ' suggestion modal',
          () => {
            component.switchToTab(component.TAB_TYPE_REVIEWS, 'add_question');
            spyOn(contributionAndReviewService, 'reviewSkillSuggestion');
            spyOn(ngbModal, 'open').and.returnValue({
              result: Promise.reject({}),
            } as NgbModalRef);

            component.loadContributions(false).then(() => {
              component.onClickViewSuggestion('suggestion_1');

              expect(ngbModal.open).toHaveBeenCalled();
            });
          }
        );

        it('should return correctly check the active tab', () => {
          component.contributionTabs = [
            {
              tabType: 'contributions',
              tabSubType: 'translate_content',
              text: 'Questions',
              enabled: false,
            },
            {
              tabType: 'contributions',
              tabSubType: 'add_question',
              text: 'Translations',
              enabled: true,
            },
          ];
          component.reviewTabs = [
            {
              tabType: 'reviews',
              tabSubType: 'add_question',
              text: 'Review Questions',
              enabled: false,
            },
            {
              tabType: 'reviews',
              tabSubType: 'translate_content',
              text: 'Review Translations',
              enabled: false,
            },
          ];

          component.switchToTab('reviews', 'translate_content');
          component.isActiveTab('reviews', 'translate_content');

          component.switchToTab('contributions', 'add_question');
          component.isActiveTab('contributions', 'add_question');
        });

        it('should toggle dropdown when it is clicked', () => {
          component.dropdownShown = false;

          component.toggleDropdown();
          expect(component.dropdownShown).toBe(true);

          component.toggleDropdown();
          expect(component.dropdownShown).toBe(false);
        });

        it('should set active dropdown choice correctly', () => {
          component.contributionTabs = [
            {
              tabType: 'contributions',
              tabSubType: 'translate_content',
              text: 'Translations',
              enabled: false,
            },
            {
              tabType: 'contributions',
              tabSubType: 'add_question',
              text: 'Questions',
              enabled: true,
            },
          ];
          component.accomplishmentsTabs = [
            {
              tabSubType: 'stats',
              tabType: 'accomplishments',
              text: 'Contribution Stats',
              enabled: true,
            },
            {
              tabSubType: 'badges',
              tabType: 'accomplishments',
              text: 'Badges',
              enabled: true,
            },
          ];
          component.reviewTabs = [
            {
              tabType: 'reviews',
              tabSubType: 'add_question',
              text: 'Review Questions',
              enabled: false,
            },
            {
              tabType: 'reviews',
              tabSubType: 'translate_content',
              text: 'Review Translations',
              enabled: false,
            },
          ];

          expect(
            component.getActiveDropdownTabText('reviews', 'add_question')
          ).toBe('Review Questions');
          expect(
            component.getActiveDropdownTabText('reviews', 'translate_content')
          ).toBe('Review Translations');

          expect(
            component.getActiveDropdownTabText('contributions', 'add_question')
          ).toBe('Questions');
          expect(
            component.getActiveDropdownTabText(
              'contributions',
              'translate_content'
            )
          ).toBe('Translations');

          expect(
            component.getActiveDropdownTabText('accomplishments', 'stats')
          ).toBe('Contribution Stats');
          expect(
            component.getActiveDropdownTabText('accomplishments', 'badges')
          ).toBe('Badges');
        });

        it('should throw an error when invalid tab names given', () => {
          component.contributionTabs = [
            {
              tabType: 'contributions',
              tabSubType: 'translate_content',
              text: 'Translations',
              enabled: false,
            },
            {
              tabType: 'contributions',
              tabSubType: 'add_question',
              text: 'Questions',
              enabled: true,
            },
          ];
          component.accomplishmentsTabs = [
            {
              tabSubType: 'stats',
              tabType: 'accomplishments',
              text: 'Contribution Stats',
              enabled: true,
            },
            {
              tabSubType: 'badges',
              tabType: 'accomplishments',
              text: 'Badges',
              enabled: true,
            },
          ];
          component.reviewTabs = [
            {
              tabType: 'reviews',
              tabSubType: 'add_question',
              text: 'Review Questions',
              enabled: false,
            },
            {
              tabType: 'reviews',
              tabSubType: 'translate_content',
              text: 'Review Translations',
              enabled: false,
            },
          ];

          expect(() => {
            component.getActiveDropdownTabText('xxx', 'xxx');
            tick();
          }).toThrowError();
        });

        it('should close dropdown when a click is made outside', () => {
          const element = {
            contains: () => {
              return true;
            },
          };
          const clickEvent = {
            target: null as unknown as Node,
          };
          const querySelectorSpy = spyOn(
            document,
            'querySelector'
          ).and.returnValue(null);
          const elementContainsSpy = spyOn(element, 'contains').and.returnValue(
            true
          );
          component.dropdownShown = true;

          component.closeDropdownWhenClickedOutside(
            null as unknown as {target: Node}
          );
          expect(querySelectorSpy).toHaveBeenCalled();
          expect(elementContainsSpy).not.toHaveBeenCalled();
          expect(component.dropdownShown).toBe(true);

          // This throws "Argument of type '{ contains: () => boolean; }' is not
          // assignable to parameter of type 'Element'. Type '{ contains:
          // () => boolean; }' is missing the following properties from type
          // 'Element': attributes, classList, className, clientHeight, and 159
          // more.". We need to suppress this error because only the properties
          // provided in the element object are required for testing.
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
            target: null as unknown as Node,
          };
          spyOn(document, 'querySelector').and.returnValue(null);

          component.closeDropdownWhenClickedOutside(clickEvent);
          expect(document.querySelector).toHaveBeenCalled();
        });
      });

      describe('when user is allowed to review translations', () => {
        it('should handle queued suggestions correctly when a new suggestion is emitted', fakeAsync(() => {
          let eventEmitter = new EventEmitter();
          spyOn(ngbModal, 'open').and.returnValue({
            componentInstance: {
              authorName: null,
              contentHtml: null,
              reviewable: true,
              suggestionIdToContribution: {},
              initialSuggestionId: 'suggestion_1',
              subheading: 'Sub heading',
              editSuggestionEmitter: eventEmitter,
              queuedSuggestionSummaryEmit: eventEmitter,
              queuedSuggestionEmit: eventEmitter,
            },
            result: Promise.resolve(['id1', 'id2']),
          } as NgbModalRef);

          const removeSpy = spyOn(
            contributionOpportunitiesService.removeOpportunitiesEventEmitter,
            'emit'
          ).and.returnValue(null);
          const commitTimeoutSpy = spyOn(component, 'startCommitTimeout');
          const undoSnackbarSpy = spyOn(component, 'showUndoSnackbar');

          component.contributions = {
            suggestion_1: {
              suggestion: {
                suggestion_id: 'suggestion_1',
                target_id: '1',
                suggestion_type: 'translate_content',
                change_cmd: {
                  skill_id: '',
                  content_html: 'Translation',
                  translation_html: 'Tradução',
                  question_dict: {} as QuestionBackendDict,
                  skill_difficulty: [],
                },
                status: 'review',
                author_name: '',
                exploration_content_html: null,
              },
              details: {
                skill_description: 'skill_description',
                skill_rubrics: [],
                chapter_title: 'skill_1',
                story_title: 'skill_1',
                topic_name: 'skill_1',
              },
            },
          };

          component.queuedSuggestionSummary = {
            target_id: 'id_1',
            suggestion_id: 'suggestion_1',
            action_status: 'accepted',
            reviewer_message: 'test',
          };

          // Simulate opening the modal and the user actions.
          component.onClickViewSuggestion('suggestion_1');
          tick(); // Simulate any asynchronous effects of opening the view.

          // Now emit a new queued suggestion which should trigger the subscription logic.
          eventEmitter.emit({
            target_id: 'id_1',
            suggestion_id: 'suggestion_2',
            action_status: 'accepted',
            reviewer_message: 'test',
          });
          tick();

          expect(commitTimeoutSpy).toHaveBeenCalled();
          expect(undoSnackbarSpy).toHaveBeenCalled();
          expect(removeSpy).toHaveBeenCalled();
        }));

        it('should commit queued suggestion when the commit timeout expires', fakeAsync(() => {
          spyOn(component, 'commitQueuedSuggestion');
          const COMMIT_TIMEOUT_DURATION = 32000;
          component.queuedSuggestionSummary = {
            target_id: 'id_1',
            suggestion_id: 'suggestion_1',
            action_status: 'accepted',
            reviewer_message: 'test',
          };

          component.startCommitTimeout();
          expect(component.commitQueuedSuggestion).not.toHaveBeenCalled();

          tick(COMMIT_TIMEOUT_DURATION);
          expect(component.commitQueuedSuggestion).toHaveBeenCalled();
        }));

        it('should commit the queued Suggestion when commit function is called', function () {
          component.queuedSuggestionSummary = {
            target_id: 'id_1',
            suggestion_id: 'suggestion_1',
            action_status: 'accepted',
            reviewer_message: 'test',
          };
          spyOn(
            contributionAndReviewService,
            'reviewExplorationSuggestion'
          ).and.callFake(
            (
              targetId: string,
              suggestionId: string,
              action: string,
              reviewMessage: string,
              commitMessage: string | null,
              successCallback: (suggestionId: string) => void,
              errorCallback: (errorMessage: string) => void
            ) => {
              return Promise.resolve(successCallback(suggestionId));
            }
          );
          component.contributions = {};
          spyOn(alertsService, 'addSuccessMessage');
          spyOn(alertsService, 'clearMessages');
          const removeSpy = spyOn(
            contributionOpportunitiesService.removeOpportunitiesEventEmitter,
            'emit'
          ).and.returnValue(null);

          component.commitQueuedSuggestion();
          expect(component.queuedSuggestionSummary).toBeNull();
          expect(removeSpy).toHaveBeenCalled();
        });

        it('should not commit the queued Suggestion when there is no queued Suggestion', function () {
          component.queuedSuggestionSummary = null;
          spyOn(
            contributionAndReviewService,
            'reviewExplorationSuggestion'
          ).and.callFake(
            (
              targetId: string,
              suggestionId: string,
              action: string,
              reviewMessage: string,
              commitMessage: string | null,
              successCallback: (suggestionId: string) => void,
              errorCallback: (errorMessage: string) => void
            ) => {
              return Promise.resolve(successCallback(suggestionId));
            }
          );
          component.contributions = {};
          spyOn(alertsService, 'addSuccessMessage');
          spyOn(alertsService, 'clearMessages');
          spyOn(
            contributionOpportunitiesService.removeOpportunitiesEventEmitter,
            'emit'
          ).and.returnValue(null);

          component.commitQueuedSuggestion();
          expect(
            contributionAndReviewService.reviewExplorationSuggestion
          ).not.toHaveBeenCalled();
        });

        it('should not call remove suggestion emitter if network call fails', function () {
          component.queuedSuggestionSummary = {
            target_id: 'id_1',
            suggestion_id: 'suggestion_1',
            action_status: 'accepted',
            reviewer_message: 'test',
          };
          spyOn(
            contributionAndReviewService,
            'reviewExplorationSuggestion'
          ).and.callFake(
            (
              targetId: string,
              suggestionId: string,
              action: string,
              reviewMessage: string,
              commitMessage: string | null,
              successCallback: (suggestionId: string) => void,
              errorCallback: (errorMessage: string) => void
            ) => {
              return Promise.reject(errorCallback(suggestionId));
            }
          );
          component.contributions = {};
          spyOn(alertsService, 'addWarning');
          spyOn(alertsService, 'clearWarnings');
          const removeSpy = spyOn(
            contributionOpportunitiesService.removeOpportunitiesEventEmitter,
            'emit'
          ).and.returnValue(null);

          component.commitQueuedSuggestion();
          expect(component.queuedSuggestionSummary).toBeNull();
          expect(removeSpy).not.toHaveBeenCalled();
        });

        it('should not call remove suggestion emitter if network call fails', function () {
          component.queuedSuggestionSummary = {
            target_id: 'id_1',
            suggestion_id: 'suggestion_1',
            action_status: 'accepted',
            reviewer_message: 'test',
          };

          component.undoReviewAction();
          expect(component.queuedSuggestionSummary).toBeNull();
        });

        it('should show the pop up bar when suggestion is queued', () => {
          spyOn(component, 'commitQueuedSuggestion').and.callThrough();
          component.showUndoSnackbar();

          expect(
            snackBarSpy.calls.mostRecent().returnValue.instance.message
          ).toBe('Suggestion queued');
        });

        it('should commit the queued suggestion when the snackbar is dismissed', () => {
          const commitQueuedSuggestionSpy = spyOn(
            component,
            'commitQueuedSuggestion'
          ).and.callThrough();

          let afterDismissedObservable = new Subject<void>();
          let snackBarRefMock = {
            instance: {message: ''},
            afterDismissed: () => afterDismissedObservable.asObservable(),
            onAction: () => of(null),
          };

          snackBarSpy.and.returnValue(snackBarRefMock);

          component.showUndoSnackbar();

          afterDismissedObservable.next();
          afterDismissedObservable.complete();

          expect(commitQueuedSuggestionSpy).toHaveBeenCalled();
        });

        it('should undo review action and clear commit timeout when undoReviewAction is called', () => {
          component.queuedSuggestionSummary = {
            target_id: 'id_1',
            suggestion_id: 'suggestion_1',
            action_status: 'accepted',
            reviewer_message: 'test',
          };
          component.commitTimeout = setTimeout(() => {}, 1000);

          component.undoReviewAction();

          expect(component.queuedSuggestionSummary).toBeNull();
        });

        it('should call undoReviewAction when snackbar action is triggered', () => {
          const undoReviewActionSpy = spyOn(component, 'undoReviewAction');

          let onActionObservable = new Subject<void>();
          let snackBarRefMock = {
            instance: {message: ''},
            afterDismissed: () => of(null),
            onAction: () => onActionObservable.asObservable(),
          };

          snackBarSpy.and.returnValue(snackBarRefMock);

          component.showUndoSnackbar();

          onActionObservable.next();
          onActionObservable.complete();

          expect(undoReviewActionSpy).toHaveBeenCalled();
        });

        it('should not commit queued suggestion when isCommitting is true', () => {
          component.queuedSuggestionSummary = {
            target_id: 'id_1',
            suggestion_id: 'suggestion_1',
            action_status: 'accepted',
            reviewer_message: 'test',
          };
          component.isCommitting = true;

          spyOn(
            contributionAndReviewService,
            'reviewExplorationSuggestion'
          ).and.stub();

          component.commitQueuedSuggestion();

          expect(
            contributionAndReviewService.reviewExplorationSuggestion
          ).not.toHaveBeenCalled();
        });

        it('should handle commit message for accepted suggestions', () => {
          component.queuedSuggestionSummary = {
            target_id: 'id_1',
            suggestion_id: 'suggestion_1',
            action_status: 'accept',
            reviewer_message: 'test',
            commit_message: 'commit message',
          };

          const reviewSpy = spyOn(
            contributionAndReviewService,
            'reviewExplorationSuggestion'
          ).and.callFake(
            (
              targetId: string,
              suggestionId: string,
              action: string,
              reviewMessage: string,
              commitMessage: string | null,
              successCallback: (suggestionId: string) => void,
              errorCallback: (errorMessage: string) => void
            ) => {
              successCallback(suggestionId);
              return Promise.resolve();
            }
          );

          component.commitQueuedSuggestion();

          expect(reviewSpy).toHaveBeenCalledWith(
            'id_1',
            'suggestion_1',
            'accept',
            'test',
            'commit message',
            jasmine.any(Function),
            jasmine.any(Function)
          );
        });

        it('should handle commit message as null for rejected suggestions', () => {
          component.queuedSuggestionSummary = {
            target_id: 'id_1',
            suggestion_id: 'suggestion_1',
            action_status: 'reject',
            reviewer_message: 'test',
            commit_message: 'commit message',
          };

          const reviewSpy = spyOn(
            contributionAndReviewService,
            'reviewExplorationSuggestion'
          ).and.callFake(
            (
              targetId: string,
              suggestionId: string,
              action: string,
              reviewMessage: string,
              commitMessage: string | null,
              successCallback: (suggestionId: string) => void,
              errorCallback: (errorMessage: string) => void
            ) => {
              successCallback(suggestionId);
              return Promise.resolve();
            }
          );

          component.commitQueuedSuggestion();

          expect(reviewSpy).toHaveBeenCalledWith(
            'id_1',
            'suggestion_1',
            'reject',
            'test',
            null,
            jasmine.any(Function),
            jasmine.any(Function)
          );
        });
      });

      describe('getQuestionContributionsSummary', () => {
        it('should handle null details correctly', () => {
          const suggestionIdToSuggestions = {
            suggestion_1: {
              suggestion: {
                suggestion_id: 'suggestion_1',
                target_id: '1',
                suggestion_type: 'add_question',
                change_cmd: {
                  skill_id: 'skill1',
                  question_dict: {
                    id: '1',
                    question_state_data: {
                      content: {
                        html: 'Question 1',
                        content_id: 'content_1',
                      },
                      interaction: {
                        answer_groups: [],
                        confirmed_unclassified_answers: [],
                        customization_args: {},
                        default_outcome: {
                          dest: '',
                          dest_if_really_stuck: null,
                          feedback: {
                            html: 'Correct Answer',
                            content_id: 'content_2',
                          },
                          param_changes: [],
                          labelled_as_correct: true,
                        },
                        hints: [],
                        solution: null,
                        id: 'TextInput',
                      },
                      param_changes: [],
                      recorded_voiceovers: {
                        voiceovers_mapping: {},
                      },
                    },
                  },
                  skill_difficulty: [],
                  content_html: '',
                  translation_html: '',
                },
                status: 'review',
                author_name: 'author',
                exploration_content_html: null,
              },
              details: null,
            },
          };

          component.activeTabType = component.TAB_TYPE_REVIEWS;
          const result = component.getQuestionContributionsSummary(
            suggestionIdToSuggestions as unknown as Record<
              string,
              SuggestionDetails
            >
          );

          expect(result.length).toBe(1);
          expect(result[0].subheading).toBe(
            '[The corresponding opportunity has been deleted.]'
          );
        });
      });

      describe('getTranslationContributionsSummary', () => {
        it('should handle null details correctly', () => {
          const suggestionIdToSuggestions = {
            suggestion_1: {
              suggestion: {
                suggestion_id: 'suggestion_1',
                target_id: '1',
                suggestion_type: 'translate_content',
                change_cmd: {
                  skill_id: '',
                  content_html: 'Content',
                  translation_html: 'Translation',
                  question_dict: {} as QuestionBackendDict,
                  skill_difficulty: [],
                },
                status: 'review',
                author_name: 'author',
                exploration_content_html: 'html',
              },
              details: null,
            },
          };

          component.activeTabType = component.TAB_TYPE_REVIEWS;
          const result = component.getTranslationContributionsSummary(
            suggestionIdToSuggestions as unknown as Record<
              string,
              SuggestionDetails
            >
          );

          expect(result.length).toBe(1);
          expect(result[0].subheading).toBe(
            '[The corresponding opportunity has been deleted.]'
          );
        });

        it('should mark suggestion as obsolete when exploration_content_html is null', () => {
          const suggestionIdToSuggestions = {
            suggestion_1: {
              suggestion: {
                suggestion_id: 'suggestion_1',
                target_id: '1',
                suggestion_type: 'translate_content',
                change_cmd: {
                  skill_id: '',
                  content_html: 'Content',
                  translation_html: 'Translation',
                  question_dict: {} as QuestionBackendDict,
                  skill_difficulty: [],
                },
                status: 'review',
                author_name: 'author',
                exploration_content_html: null,
              },
              details: {
                skill_description: 'skill_1',
                skill_rubrics: [],
                chapter_title: 'Chapter 1',
                story_title: 'Story 1',
                topic_name: 'Topic 1',
              },
            },
          };

          component.activeTabType = component.TAB_TYPE_REVIEWS;
          const result = component.getTranslationContributionsSummary(
            suggestionIdToSuggestions
          );

          expect(result.length).toBe(1);
          expect(result[0].labelText).toBe('Obsolete');
        });

        it('should include translation word count when in review translations tab with active exploration', () => {
          const suggestionIdToSuggestions = {
            suggestion_1: {
              suggestion: {
                suggestion_id: 'suggestion_1',
                target_id: '1',
                suggestion_type: 'translate_content',
                change_cmd: {
                  skill_id: '',
                  content_html: 'Content to translate',
                  translation_html: 'Translation',
                  question_dict: {} as QuestionBackendDict,
                  skill_difficulty: [],
                },
                status: 'review',
                author_name: 'author',
                exploration_content_html: 'html',
              },
              details: {
                skill_description: 'skill_1',
                skill_rubrics: [],
                chapter_title: 'Chapter 1',
                story_title: 'Story 1',
                topic_name: 'Topic 1',
              },
            },
          };

          component.activeTabType = component.TAB_TYPE_REVIEWS;
          component.activeTabSubtype = component.SUGGESTION_TYPE_TRANSLATE;
          component.activeExplorationId = 'exp1';

          const result = component.getTranslationContributionsSummary(
            suggestionIdToSuggestions
          );

          expect(result.length).toBe(1);
          expect(result[0].translationWordCount).toBeDefined();
        });
      });

      describe('getTranslationContentLength', () => {
        it('should calculate length for array of strings', () => {
          const contentHtml = ['First string', 'Second string', 'Third string'];

          const result = component.getTranslationContentLength(contentHtml);

          expect(result).toBeGreaterThan(0);
        });

        it('should throw error for invalid input type', () => {
          const invalidInput = 123 as unknown as string | string[];

          expect(() => {
            component.getTranslationContentLength(invalidInput);
          }).toThrowError(
            'Invalid input: contentHtml must be a string or an array of strings.'
          );
        });
      });

      describe('getActiveDropdownTabText', () => {
        it('should throw error when tab is not found', () => {
          expect(() => {
            component.getActiveDropdownTabText(
              'invalid_type',
              'invalid_subtype'
            );
          }).toThrowError('Cannot find the tab');
        });
      });

      describe('pinReviewableTranslationOpportunity', () => {
        it('should show snackbar when pinned opportunity already exists', () => {
          component.opportunities = [
            {
              topicName: 'Topic 1',
              isPinned: true,
            } as ExplorationOpportunitySummary,
          ];

          const snackBarOpenSpy = spyOn(snackBar, 'open').and.returnValue({
            instance: {message: ''},
            onAction: () => of(null),
          } as unknown as MatSnackBarRef<unknown>);

          component.pinReviewableTranslationOpportunity({
            topic_name: 'Topic 1',
            exploration_id: 'exp1',
          });

          expect(snackBarOpenSpy).toHaveBeenCalledWith(
            'A pinned opportunity already exists for this topic and language.',
            'Pin Anyway',
            {duration: 3000}
          );
        });

        it('should pin opportunity directly when no pinned opportunity exists', () => {
          component.opportunities = [
            {
              topicName: 'Topic 1',
              isPinned: false,
            } as ExplorationOpportunitySummary,
          ];

          const pinSpy = spyOn(
            contributionOpportunitiesService,
            'pinReviewableTranslationOpportunityAsync'
          ).and.stub();

          component.languageCode = 'en';
          component.pinReviewableTranslationOpportunity({
            topic_name: 'Topic 2',
            exploration_id: 'exp1',
          });

          expect(pinSpy).toHaveBeenCalledWith('Topic 2', 'en', 'exp1');
        });
      });

      describe('openSnackbarWithAction', () => {
        it('should open snackbar and pin opportunity on action', () => {
          const onActionSubject = new Subject<void>();
          const snackBarOpenSpy = spyOn(snackBar, 'open').and.returnValue({
            instance: {message: ''},
            onAction: () => onActionSubject.asObservable(),
          } as unknown as MatSnackBarRef<unknown>);

          const pinSpy = spyOn(
            contributionOpportunitiesService,
            'pinReviewableTranslationOpportunityAsync'
          ).and.stub();

          component.languageCode = 'en';
          component.openSnackbarWithAction(
            'Topic 1',
            'exp1',
            'Test message',
            'Test action'
          );

          onActionSubject.next();
          onActionSubject.complete();

          expect(snackBarOpenSpy).toHaveBeenCalledWith(
            'Test message',
            'Test action',
            {duration: 3000}
          );
          expect(pinSpy).toHaveBeenCalledWith('Topic 1', 'en', 'exp1');
        });
      });

      describe('loadContributions', () => {
        it('should return empty opportunities when activeTabType is not set', fakeAsync(() => {
          component.activeTabType = '';
          component.activeTabSubtype = 'translate_content';

          component.loadContributions(true).then(result => {
            expect(result.opportunitiesDicts).toEqual([]);
            expect(result.more).toBe(false);
          });

          tick();
        }));

        it('should return empty opportunities when activeTabSubtype is not set', fakeAsync(() => {
          component.activeTabType = component.TAB_TYPE_REVIEWS;
          component.activeTabSubtype = '';

          component.loadContributions(true).then(result => {
            expect(result.opportunitiesDicts).toEqual([]);
            expect(result.more).toBe(false);
          });

          tick();
        }));
      });

      describe('closeDropdownWhenClickedOutside', () => {
        it('should not close dropdown when click occurs inside dropdown', () => {
          component.dropdownShown = true;
          const dropdownElement = document.createElement('div');
          dropdownElement.className = 'oppia-contributions-dropdown-container';
          const clickTarget = document.createElement('span');
          dropdownElement.appendChild(clickTarget);

          spyOn(document, 'querySelector').and.returnValue(dropdownElement);

          component.closeDropdownWhenClickedOutside({target: clickTarget});

          expect(component.dropdownShown).toBe(true);
        });

        it('should close dropdown when click occurs outside dropdown', () => {
          component.dropdownShown = true;
          const dropdownElement = document.createElement('div');
          dropdownElement.className = 'oppia-contributions-dropdown-container';
          const clickTarget = document.createElement('span');

          spyOn(document, 'querySelector').and.returnValue(dropdownElement);

          component.closeDropdownWhenClickedOutside({target: clickTarget});

          expect(component.dropdownShown).toBe(false);
        });
      });

      describe('getTranslationSuggestionHeading', () => {
        it('should handle array translation_html correctly', () => {
          const suggestion = {
            change_cmd: {
              skill_id: '',
              content_html: '',
              translation_html: ['Translation 1', 'Translation 2'],
              question_dict: {} as QuestionBackendDict,
              skill_difficulty: [],
            },
            status: 'review',
            target_id: '1',
            suggestion_id: 'suggestion_1',
            author_name: 'author',
            suggestion_type: 'translate_content',
            exploration_content_html: 'html',
          };

          spyOn(formatRtePreviewPipe, 'transform').and.returnValue(
            'Formatted translation'
          );
          spyOn(htmlEscaperService, 'escapedStrToUnescapedStr').and.returnValue(
            'Unescaped translation'
          );

          const result = component.getTranslationSuggestionHeading(suggestion);

          expect(formatRtePreviewPipe.transform).toHaveBeenCalledWith(', ');
          expect(result).toBe('Unescaped translation');
        });
      });

      describe('additional coverage for uncovered branches', () => {
        it('should commit previous queued suggestion when queuing a new one', fakeAsync(() => {
          let eventEmitter = new EventEmitter();
          const commitQueuedSuggestionSpy = spyOn(
            component,
            'commitQueuedSuggestion'
          );

          spyOn(ngbModal, 'open').and.returnValue({
            componentInstance: {
              authorName: null,
              contentHtml: null,
              reviewable: true,
              suggestionIdToContribution: {},
              initialSuggestionId: 'suggestion_1',
              subheading: 'Sub heading',
              editSuggestionEmitter: eventEmitter,
              queuedSuggestionSummaryEmit: eventEmitter,
              queuedSuggestionEmit: eventEmitter,
            },
            result: Promise.resolve(['id1']),
          } as NgbModalRef);

          component.contributions = {
            suggestion_1: {
              suggestion: {
                suggestion_id: 'suggestion_1',
                target_id: '1',
                suggestion_type: 'translate_content',
                change_cmd: {
                  skill_id: '',
                  content_html: 'Translation',
                  translation_html: 'Tradução',
                  question_dict: {} as QuestionBackendDict,
                  skill_difficulty: [],
                },
                status: 'review',
                author_name: '',
                exploration_content_html: null,
              },
              details: {
                skill_description: 'skill_description',
                skill_rubrics: [],
                chapter_title: 'skill_1',
                story_title: 'skill_1',
                topic_name: 'skill_1',
              },
            },
          };

          // Set an existing queued suggestion.
          component.queuedSuggestionSummary = {
            target_id: 'id_1',
            suggestion_id: 'suggestion_old',
            action_status: 'accepted',
            reviewer_message: 'old test',
          };

          component.onClickViewSuggestion('suggestion_1');
          tick();

          // Emit a new queued suggestion which should commit the previous one.
          eventEmitter.emit({
            target_id: 'id_2',
            suggestion_id: 'suggestion_new',
            action_status: 'accepted',
            reviewer_message: 'new test',
          });
          tick();

          expect(commitQueuedSuggestionSpy).toHaveBeenCalled();
          flush(); // Clear any pending timers.
        }));

        it('should emit filtered resolved suggestions when length > 0', fakeAsync(() => {
          let eventEmitter = new EventEmitter();
          const removeSpy = spyOn(
            contributionOpportunitiesService.removeOpportunitiesEventEmitter,
            'emit'
          );

          spyOn(ngbModal, 'open').and.returnValue({
            componentInstance: {
              authorName: null,
              contentHtml: null,
              reviewable: true,
              suggestionIdToContribution: {},
              initialSuggestionId: 'suggestion_1',
              subheading: 'Sub heading',
              editSuggestionEmitter: eventEmitter,
              queuedSuggestionSummaryEmit: eventEmitter,
              queuedSuggestionEmit: eventEmitter,
            },
            result: Promise.resolve(['id1', 'id2', 'id3']),
          } as NgbModalRef);

          component.contributions = {
            suggestion_1: {
              suggestion: {
                suggestion_id: 'suggestion_1',
                target_id: '1',
                suggestion_type: 'translate_content',
                change_cmd: {
                  skill_id: '',
                  content_html: 'Translation',
                  translation_html: 'Tradução',
                  question_dict: {} as QuestionBackendDict,
                  skill_difficulty: [],
                },
                status: 'review',
                author_name: '',
                exploration_content_html: null,
              },
              details: {
                skill_description: 'skill_description',
                skill_rubrics: [],
                chapter_title: 'skill_1',
                story_title: 'skill_1',
                topic_name: 'skill_1',
              },
            },
            id1: {
              suggestion: {
                suggestion_id: 'id1',
                target_id: '1',
                suggestion_type: 'translate_content',
                change_cmd: {
                  skill_id: '',
                  content_html: 'Translation',
                  translation_html: 'Tradução',
                  question_dict: {} as QuestionBackendDict,
                  skill_difficulty: [],
                },
                status: 'review',
                author_name: '',
                exploration_content_html: null,
              },
              details: {
                skill_description: 'skill_description',
                skill_rubrics: [],
                chapter_title: 'skill_1',
                story_title: 'skill_1',
                topic_name: 'skill_1',
              },
            },
          };

          // Set queued suggestion to one of the resolved IDs.
          component.queuedSuggestion = {
            target_id: 'id_1',
            suggestion_id: 'id3',
            action_status: 'accepted',
            reviewer_message: 'test',
          };

          component.onClickViewSuggestion('suggestion_1');
          tick();

          // The modal resolves with ['id1', 'id2', 'id3'].
          // Id3 is queued, so only ['id1', 'id2'] should be emitted.
          expect(removeSpy).toHaveBeenCalledWith(['id1', 'id2']);
        }));

        it('should clear existing commit timeout when starting new timeout', fakeAsync(() => {
          const clearTimeoutSpy = spyOn(window, 'clearTimeout');
          component.commitTimeout = setTimeout(() => {}, 1000);

          component.startCommitTimeout();

          expect(clearTimeoutSpy).toHaveBeenCalled();
          flush(); // Clear any pending timers.
        }));

        it('should clear commit timeout in success callback', () => {
          const clearTimeoutSpy = spyOn(window, 'clearTimeout');
          component.commitTimeout = setTimeout(() => {}, 1000);
          component.queuedSuggestionSummary = {
            target_id: 'id_1',
            suggestion_id: 'suggestion_1',
            action_status: 'accepted',
            reviewer_message: 'test',
          };

          spyOn(
            contributionAndReviewService,
            'reviewExplorationSuggestion'
          ).and.callFake(
            (
              targetId: string,
              suggestionId: string,
              action: string,
              reviewMessage: string,
              commitMessage: string | null,
              successCallback: (suggestionId: string) => void,
              errorCallback: (errorMessage: string) => void
            ) => {
              successCallback(suggestionId);
              return Promise.resolve();
            }
          );

          component.commitQueuedSuggestion();

          expect(clearTimeoutSpy).toHaveBeenCalled();
        });

        it('should return question contributions summary for question tab', () => {
          component.activeTabSubtype = 'add_question';
          const suggestionIdToSuggestions = {
            suggestion_1: {
              suggestion: {
                suggestion_id: 'suggestion_1',
                target_id: '1',
                suggestion_type: 'add_question',
                change_cmd: {
                  skill_id: 'skill1',
                  question_dict: {
                    id: '1',
                    question_state_data: {
                      content: {
                        html: 'Question 1',
                        content_id: 'content_1',
                      },
                    },
                  } as QuestionBackendDict,
                  skill_difficulty: [],
                  content_html: '',
                  translation_html: '',
                },
                status: 'review',
                author_name: 'author',
                exploration_content_html: null,
              },
              details: {
                skill_description: 'Skill description',
                skill_rubrics: [],
                chapter_title: '',
                story_title: '',
                topic_name: '',
              },
            },
          };

          spyOn(formatRtePreviewPipe, 'transform').and.returnValue(
            'Question 1'
          );

          const result = component.getContributionSummaries(
            suggestionIdToSuggestions
          );

          expect(result.length).toBe(1);
          expect(result[0].heading).toBe('Question 1');
        });

        it('should reset activeExplorationId when switching to non-accomplishments tab', () => {
          component.activeExplorationId = 'exp123';
          component.activeTabType = 'reviews';

          spyOn(component, 'isAccomplishmentsTabActive').and.returnValue(false);

          component.switchToTab('contributions', 'translate_content');

          expect(component.activeExplorationId).toBeNull();
        });

        it('should not reset activeExplorationId when switching to accomplishments tab', () => {
          component.activeExplorationId = 'exp123';

          spyOn(component, 'isAccomplishmentsTabActive').and.returnValue(true);

          component.switchToTab('accomplishments', 'stats');

          expect(component.activeExplorationId).toBe('exp123');
        });

        it('should not commit previous suggestion when queuedSuggestionSummary is null', fakeAsync(() => {
          let eventEmitter = new EventEmitter();

          const commitQueuedSuggestionSpy = spyOn(
            component,
            'commitQueuedSuggestion'
          ).and.stub();

          component.contributions = {
            suggestion_1: {
              suggestion: {
                suggestion_id: 'suggestion_1',
                target_id: '1',
                suggestion_type: 'translate_content',
                change_cmd: {
                  skill_id: '',
                  content_html: 'Translation',
                  translation_html: 'Tradução',
                  question_dict: {} as QuestionBackendDict,
                  skill_difficulty: [],
                },
                status: 'review',
                author_name: '',
                exploration_content_html: null,
              },
              details: {
                skill_description: 'skill_description',
                skill_rubrics: [],
                chapter_title: 'skill_1',
                story_title: 'skill_1',
                topic_name: 'skill_1',
              },
            },
          };

          // Ensure queuedSuggestionSummary is null.
          component.queuedSuggestionSummary = null;

          spyOn(ngbModal, 'open').and.returnValue({
            componentInstance: {
              authorName: null,
              contentHtml: null,
              reviewable: true,
              suggestionIdToContribution: {},
              initialSuggestionId: 'suggestion_1',
              subheading: 'Sub heading',
              editSuggestionEmitter: eventEmitter,
              queuedSuggestionSummaryEmit: eventEmitter,
              queuedSuggestionEmit: eventEmitter,
            },
            result: Promise.resolve(['id1']),
          } as NgbModalRef);

          component.onClickViewSuggestion('suggestion_1');
          tick();

          // Reset the spy call count after modal setup.
          commitQueuedSuggestionSpy.calls.reset();

          // Emit a new queued suggestion.
          eventEmitter.emit({
            target_id: 'id_2',
            suggestion_id: 'suggestion_new',
            action_status: 'accepted',
            reviewer_message: 'new test',
          });
          tick();

          // Should be called ONCE by the snackbar's afterDismissed because
          // MockMatSnackBarRef's afterDismissed emits immediately.
          // It should NOT be called for a previous suggestion because
          // queuedSuggestionSummary was null.
          expect(commitQueuedSuggestionSpy).toHaveBeenCalledTimes(1);
          flush();
        }));

        it('should not emit when all resolved suggestions are queued', fakeAsync(() => {
          let eventEmitter = new EventEmitter();

          component.contributions = {
            suggestion_1: {
              suggestion: {
                suggestion_id: 'id1',
                target_id: '1',
                suggestion_type: 'translate_content',
                change_cmd: {
                  skill_id: '',
                  content_html: 'Translation',
                  translation_html: 'Tradução',
                  question_dict: {} as QuestionBackendDict,
                  skill_difficulty: [],
                },
                status: 'review',
                author_name: '',
                exploration_content_html: null,
              },
              details: {
                skill_description: 'skill_description',
                skill_rubrics: [],
                chapter_title: 'skill_1',
                story_title: 'skill_1',
                topic_name: 'skill_1',
              },
            },
          };

          // Set queued suggestion BEFORE opening modal.
          component.queuedSuggestion = {
            target_id: 'id_1',
            suggestion_id: 'id1',
            action_status: 'accepted',
            reviewer_message: 'test',
          };

          const modalRef = {
            componentInstance: {
              authorName: null,
              contentHtml: null,
              reviewable: true,
              suggestionIdToContribution: {},
              initialSuggestionId: 'suggestion_1',
              subheading: 'Sub heading',
              editSuggestionEmitter: eventEmitter,
              queuedSuggestionSummaryEmit: eventEmitter,
              queuedSuggestionEmit: eventEmitter,
            },
            result: Promise.resolve(['id1']),
          } as NgbModalRef;

          spyOn(ngbModal, 'open').and.returnValue(modalRef);

          const removeSpy = spyOn(
            contributionOpportunitiesService.removeOpportunitiesEventEmitter,
            'emit'
          );

          component.onClickViewSuggestion('suggestion_1');
          tick();

          // Manually trigger the modal result.
          modalRef.result.then(resolvedIds => {
            // Filter should remove id1 since it matches queued suggestion.
            const filtered = resolvedIds.filter(
              (id: string) => component.queuedSuggestion?.suggestion_id !== id
            );
            expect(filtered.length).toBe(0);
          });
          tick();

          // Since all suggestions are queued, emit should not be called.
          expect(removeSpy).not.toHaveBeenCalled();
          flush();
        }));

        it('should not delete contribution when suggestionId matches queued suggestion', fakeAsync(() => {
          let eventEmitter = new EventEmitter();

          spyOn(ngbModal, 'open').and.returnValue({
            componentInstance: {
              authorName: null,
              contentHtml: null,
              reviewable: true,
              suggestionIdToContribution: {},
              initialSuggestionId: 'suggestion_1',
              subheading: 'Sub heading',
              editSuggestionEmitter: eventEmitter,
              queuedSuggestionSummaryEmit: eventEmitter,
              queuedSuggestionEmit: eventEmitter,
            },
            result: Promise.resolve(['id1', 'id2']),
          } as NgbModalRef);

          component.contributions = {
            suggestion_1: {
              suggestion: {
                suggestion_id: 'id1',
                target_id: '1',
                suggestion_type: 'translate_content',
                change_cmd: {
                  skill_id: '',
                  content_html: 'Translation',
                  translation_html: 'Tradução',
                  question_dict: {} as QuestionBackendDict,
                  skill_difficulty: [],
                },
                status: 'review',
                author_name: '',
                exploration_content_html: null,
              },
              details: {
                skill_description: 'skill_description',
                skill_rubrics: [],
                chapter_title: 'skill_1',
                story_title: 'skill_1',
                topic_name: 'skill_1',
              },
            },
            id2: {
              suggestion: {
                suggestion_id: 'id2',
                target_id: '2',
                suggestion_type: 'translate_content',
                change_cmd: {
                  skill_id: '',
                  content_html: 'Content',
                  translation_html: 'Conteúdo',
                  question_dict: {} as QuestionBackendDict,
                  skill_difficulty: [],
                },
                status: 'review',
                author_name: '',
                exploration_content_html: null,
              },
              details: {
                skill_description: 'skill_description',
                skill_rubrics: [],
                chapter_title: 'skill_2',
                story_title: 'skill_2',
                topic_name: 'skill_2',
              },
            },
          };

          // Set queued suggestion to match id1.
          component.queuedSuggestion = {
            target_id: 'id_1',
            suggestion_id: 'id1',
            action_status: 'accepted',
            reviewer_message: 'test',
          };

          component.onClickViewSuggestion('suggestion_1');
          tick();

          // Id1 should NOT be deleted because it matches queued suggestion.
          expect(component.contributions.suggestion_1).toBeDefined();
          // Id2 should be deleted.
          expect(component.contributions.id2).toBeUndefined();
          flush();
        }));

        it('should return empty array when activeTabSubtype is invalid', () => {
          const suggestionIdToSuggestions = {
            suggestion_1: {
              suggestion: {
                suggestion_id: 'suggestion_1',
                target_id: '1',
                suggestion_type: 'invalid_type',
                change_cmd: {
                  skill_id: '',
                  content_html: 'Content',
                  translation_html: 'Translation',
                  question_dict: {} as QuestionBackendDict,
                  skill_difficulty: [],
                },
                status: 'review',
                author_name: 'author',
                exploration_content_html: 'html',
              },
              details: {
                skill_description: 'skill_1',
                skill_rubrics: [],
                chapter_title: 'Chapter 1',
                story_title: 'Story 1',
                topic_name: 'Topic 1',
              },
            },
          };

          component.activeTabSubtype = 'invalid_subtype';
          const result = component.getContributionSummaries(
            suggestionIdToSuggestions
          );

          expect(result).toEqual([]);
        });

        it('should handle user with no review or suggest permissions', fakeAsync(() => {
          (userService.getUserInfoAsync as jasmine.Spy).and.returnValue(
            Promise.resolve({
              isLoggedIn: () => true,
            } as UserInfo)
          );

          getUserContributionRightsDataAsyncSpy.and.returnValue(
            Promise.resolve({
              can_review_translation_for_language_codes: [],
              can_review_questions: false,
              can_suggest_questions: false,
            })
          );

          const switchToTabSpy = spyOn(component, 'switchToTab');

          component.ngOnInit();
          tick();

          // Should switch to contributions tab with translate subtype.
          expect(switchToTabSpy).toHaveBeenCalledWith(
            component.TAB_TYPE_CONTRIBUTIONS,
            component.SUGGESTION_TYPE_TRANSLATE
          );
        }));

        it('should handle user with only translation review permissions', fakeAsync(() => {
          (userService.getUserInfoAsync as jasmine.Spy).and.returnValue(
            Promise.resolve({
              isLoggedIn: () => true,
            } as UserInfo)
          );

          getUserContributionRightsDataAsyncSpy.and.returnValue(
            Promise.resolve({
              can_review_translation_for_language_codes: ['en', 'es'],
              can_review_questions: false,
              can_suggest_questions: false,
            })
          );

          (
            contributionAndReviewService.getReviewableTranslationSuggestionsAsync as jasmine.Spy
          ).and.stub();

          const switchToTabSpy = spyOn(component, 'switchToTab');

          component.ngOnInit();
          tick();

          // Should add review translation tab.
          expect(component.reviewTabs.length).toBeGreaterThan(0);
          expect(component.reviewTabs[0].tabSubType).toBe(
            component.SUGGESTION_TYPE_TRANSLATE
          );
          // Should switch to reviews tab.
          expect(switchToTabSpy).toHaveBeenCalledWith(
            component.TAB_TYPE_REVIEWS,
            component.SUGGESTION_TYPE_TRANSLATE
          );
        }));

        it('should handle user with both question and translation review permissions', fakeAsync(() => {
          (userService.getUserInfoAsync as jasmine.Spy).and.returnValue(
            Promise.resolve({
              isLoggedIn: () => true,
            } as UserInfo)
          );

          getUserContributionRightsDataAsyncSpy.and.returnValue(
            Promise.resolve({
              can_review_translation_for_language_codes: ['en'],
              can_review_questions: true,
              can_suggest_questions: true,
            })
          );

          const switchToTabSpy = spyOn(component, 'switchToTab');

          component.ngOnInit();
          tick();

          // Should have both review tabs.
          expect(component.reviewTabs.length).toBe(2);
          // Should switch to first reviewable type (questions).
          expect(switchToTabSpy).toHaveBeenCalledWith(
            component.TAB_TYPE_REVIEWS,
            component.SUGGESTION_TYPE_QUESTION
          );
        }));

        it('should handle user with only question suggest permissions', fakeAsync(() => {
          (userService.getUserInfoAsync as jasmine.Spy).and.returnValue(
            Promise.resolve({
              isLoggedIn: () => true,
            } as UserInfo)
          );

          getUserContributionRightsDataAsyncSpy.and.returnValue(
            Promise.resolve({
              can_review_translation_for_language_codes: [],
              can_review_questions: false,
              can_suggest_questions: true,
            })
          );

          const switchToTabSpy = spyOn(component, 'switchToTab');

          component.ngOnInit();
          tick();

          // Should enable question contribution tab.
          expect(component.contributionTabs[0].enabled).toBe(true);
          // Should switch to contributions tab with question subtype.
          expect(switchToTabSpy).toHaveBeenCalledWith(
            component.TAB_TYPE_CONTRIBUTIONS,
            component.SUGGESTION_TYPE_QUESTION
          );
        }));

        it('should call handleSnackbarAction correctly', () => {
          const onActionSubject = new Subject<void>();
          const mockSnackBarRef = {
            onAction: () => onActionSubject.asObservable(),
          } as unknown as CustomMatSnackBarRef;

          const pinSpy = spyOn(
            contributionOpportunitiesService,
            'pinReviewableTranslationOpportunityAsync'
          ).and.stub();

          component.languageCode = 'en';
          (
            component as unknown as {
              handleSnackbarAction: (
                snackBarRef: CustomMatSnackBarRef,
                topicName: string,
                explorationId: string
              ) => void;
            }
          ).handleSnackbarAction(mockSnackBarRef, 'Topic 1', 'exp1');

          onActionSubject.next();
          onActionSubject.complete();

          expect(pinSpy).toHaveBeenCalledWith('Topic 1', 'en', 'exp1');
        });

        it('should handle closeDropdownWhenClickedOutside when dropdown is null', () => {
          component.dropdownShown = true;
          spyOn(document, 'querySelector').and.returnValue(null);

          const clickTarget = document.createElement('span');
          component.closeDropdownWhenClickedOutside({
            target: clickTarget as unknown as Node,
          });

          // Should remain true since dropdown is null.
          expect(component.dropdownShown).toBe(true);
        });

        it('should handle user not logged in in ngOnInit', fakeAsync(() => {
          (userService.getUserInfoAsync as jasmine.Spy).and.returnValue(
            Promise.resolve({
              isLoggedIn: () => false,
            } as UserInfo)
          );

          component.ngOnInit();
          tick();

          expect(component.userIsLoggedIn).toBe(false);
          expect(component.userDetailsLoading).toBe(false);
        }));

        it('should throw error in getTranslationContentLength with invalid input', () => {
          expect(() => {
            component.getTranslationContentLength(null as unknown as string);
          }).toThrowError(
            'Invalid input: contentHtml must be a string or an array of strings.'
          );
        });

        it('should handle array input in getTranslationSuggestionHeading', () => {
          const suggestion = {
            change_cmd: {
              translation_html: ['Tradução 1', 'Tradução 2'],
            },
          } as unknown as Suggestion;

          spyOn(formatRtePreviewPipe, 'transform').and.callThrough();
          const result = component.getTranslationSuggestionHeading(suggestion);

          // According to code: Array.isArray(changeTranslation) ? ', ' : changeTranslation.
          // So it transforms ', '.
          expect(result).toBe(',');
        });

        it('should handle error callback in commitQueuedSuggestion', fakeAsync(() => {
          component.queuedSuggestionSummary = {
            target_id: '1',
            suggestion_id: 'suggestion_1',
            action_status: 'accept',
            reviewer_message: 'message',
            commit_message: 'commit',
          } as PendingSuggestionDict;

          spyOn(
            contributionAndReviewService,
            'reviewExplorationSuggestion'
          ).and.callFake(
            (
              targetId: string,
              suggestionId: string,
              action: string,
              message: string,
              commitMessage: string | null,
              resolve: (suggestionId: string) => void,
              reject: (errorMessage: string) => void
            ) => {
              reject('Error message');
            }
          );
          const addWarningSpy = spyOn(alertsService, 'addWarning');

          component.commitQueuedSuggestion();
          tick();

          expect(addWarningSpy).toHaveBeenCalledWith(
            'Invalid Suggestion: Error message'
          );
          expect(
            (
              component as unknown as {
                isCommitting: boolean;
              }
            ).isCommitting
          ).toBe(false);
        }));

        it('should return early in commitQueuedSuggestion if isCommitting is true', () => {
          (
            component as unknown as {
              isCommitting: boolean;
            }
          ).isCommitting = true;
          const reviewSpy = spyOn(
            contributionAndReviewService,
            'reviewExplorationSuggestion'
          );

          component.commitQueuedSuggestion();

          expect(reviewSpy).not.toHaveBeenCalled();
        });

        it('should handle null userContributionRights in ngOnInit', fakeAsync(() => {
          (userService.getUserInfoAsync as jasmine.Spy).and.returnValue(
            Promise.resolve({
              isLoggedIn: () => true,
            } as UserInfo)
          );

          getUserContributionRightsDataAsyncSpy.and.returnValue(
            Promise.resolve(null)
          );

          const switchToTabSpy = spyOn(component, 'switchToTab');

          component.ngOnInit();
          tick();

          // Should default to translations contribution tab.
          expect(switchToTabSpy).toHaveBeenCalledWith(
            component.TAB_TYPE_CONTRIBUTIONS,
            component.SUGGESTION_TYPE_TRANSLATE
          );
        }));
      });
    });
  });
});
