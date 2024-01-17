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
 * @fileoverview Unit tests for QuestionSuggestionReviewModalcomponent.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, waitForAsync, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { FetchSkillResponse, SkillBackendApiService } from 'domain/skill/skill-backend-api.service';
import { SkillObjectFactory } from 'domain/skill/SkillObjectFactory';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { SuggestionModalService } from 'services/suggestion-modal.service';
import { QuestionSuggestionReviewModalComponent } from './question-suggestion-review-modal.component';
import { ThreadDataBackendApiService, ThreadMessages } from 'pages/exploration-editor-page/feedback-tab/services/thread-data-backend-api.service';
import { ContextService } from 'services/context.service';
import { Question } from 'domain/question/QuestionObjectFactory';
import { MisconceptionSkillMap } from 'domain/skill/MisconceptionObjectFactory';
import cloneDeep from 'lodash/cloneDeep';

class MockActiveModal {
  close(): void {
    return;
  }

  dismiss(): void {
    return;
  }
}

class MockNgbModal {
  open() {
    return {
      result: Promise.resolve()
    };
  }
}

describe('Question Suggestion Review Modal component', () => {
  let component: QuestionSuggestionReviewModalComponent;
  let fixture: ComponentFixture<QuestionSuggestionReviewModalComponent>;
  let ngbModal: NgbModal;
  let siteAnalyticsService: SiteAnalyticsService;
  let suggestionModalService: SuggestionModalService;
  let skillBackendApiService: SkillBackendApiService;
  let skillObjectFactory: SkillObjectFactory;
  let contextService: ContextService;
  let cancelSuggestionSpy: jasmine.Spy;
  let threadDataBackendApiService: ThreadDataBackendApiService;
  const authorName = 'Username 1';
  const contentHtml = 'Content html';
  let question: Question;
  const questionHeader = 'Question header';
  const reviewable = true;
  const skillDifficulty = 0.3;
  const suggestionId = '1';
  let misconceptionsBySkill: MisconceptionSkillMap;
  let suggestionIdToContribution = {
    1: {
      details: {
        id: '1',
        chapter_title: null,
        story_title: null,
        topic_name: null,
        question_count: 1,
        skill_description: questionHeader,
        skill_rubrics: [{
          explanations: ['explanation'],
          difficulty: 'Easy'
        }]
      },
      suggestion: {
        suggestion_type: null,
        target_id: null,
        target_type: null,
        exploration_content_html: null,
        language_code: null,
        last_updated_msecs: null,
        suggestion_id: null,
        status: '',
        author_name: authorName,
        change_cmd: {
          data_format: null,
          language_code: null,
          state_name: null,
          translation_html: null,
          new_value: null,
          old_value: null,
          content_html: contentHtml,
          content_id: null,
          cmd: 'create_new_fully_specified_question',
          question_dict: {
            id: '1',
            question_state_data_schema_version: null,
            language_code: null,
            version: null,
            linked_skill_ids: null,
            inapplicable_skill_misconception_ids: null,
            question_state_data: {
              content: {
                html: contentHtml,
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
              }
            },
          },
          skill_difficulty: skillDifficulty,
          skill_id: 'skill_1'
        }
      }
    },
    2: {
      details: {
        id: '2',
        topic_name: null,
        chapter_title: null,
        story_title: null,
        question_count: 1,
        skill_description: questionHeader,
        skill_rubrics: [{
          explanations: ['explanation'],
          difficulty: 'Easy'
        }]
      },
      suggestion: {
        suggestion_id: null,
        suggestion_type: null,
        target_id: null,
        target_type: null,
        exploration_content_html: null,
        language_code: null,
        last_updated_msecs: null,
        status: 'rejected',
        author_name: authorName,
        change_cmd: {
          data_format: null,
          language_code: null,
          state_name: null,
          translation_html: null,
          new_value: null,
          old_value: null,
          content_html: null,
          content_id: null,
          cmd: 'create_new_fully_specified_question',
          question_dict: {
            id: '2',
            question_state_data_schema_version: null,
            language_code: null,
            version: null,
            linked_skill_ids: null,
            inapplicable_skill_misconception_ids: null,
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
                  correct_answer: 'component is the correct answer',
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
              }
            },
          },
          skill_difficulty: skillDifficulty,
          skill_id: 'skill_1'
        }
      }
    },
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        QuestionSuggestionReviewModalComponent
      ],
      providers: [
        {
          provide: NgbModal,
          useClass: MockNgbModal
        },
        ThreadDataBackendApiService,
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        },
        ContextService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));


  beforeEach(() => {
    fixture = TestBed.createComponent(QuestionSuggestionReviewModalComponent);
    component = fixture.componentInstance;

    suggestionModalService = TestBed.inject(SuggestionModalService);
    cancelSuggestionSpy = spyOn(suggestionModalService, 'cancelSuggestion');

    component.reviewable = true;
    component.suggestionId = suggestionId;
    component.misconceptionsBySkill = misconceptionsBySkill;
    // This throws "TS2322". We need to suppress this error because
    // not all of the data is needed to run these tests. This is because
    // the component is initialized with the data from the backend.
    // @ts-ignore
    component.suggestionIdToContribution = suggestionIdToContribution;

    ngbModal = TestBed.inject(NgbModal);
    skillBackendApiService = TestBed.inject(SkillBackendApiService);
    skillObjectFactory = TestBed.inject(SkillObjectFactory);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    threadDataBackendApiService = TestBed.inject(
      ThreadDataBackendApiService);
    contextService = TestBed.inject(
      ContextService);
    spyOn(
      siteAnalyticsService,
      'registerContributorDashboardViewSuggestionForReview');

    spyOn(skillBackendApiService, 'fetchSkillAsync').and.returnValue(
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
        })
      } as FetchSkillResponse));

    component.skillRubrics = [{
      explanations: ['explanation'],
      difficulty: 'Easy'
    }];

    component.ngOnInit();
  });


  describe('when skill rubrics is specified', () => {
    it('should open edit question modal when clicking on' +
      ' edit button', fakeAsync(() => {
      class MockNgbModalRef {
        componentInstance = {
          suggestionId: suggestionId,
          question: question,
          questionId: '',
          questionStateData: question.getStateData(),
          skill: null,
          skillDifficulty: 0.3
        };
      }

      const questionDict = cloneDeep(
        component.suggestionIdToContribution[suggestionId]
          .suggestion.change_cmd.question_dict
      );

      spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return (
            { componentInstance: MockNgbModalRef,
              result: Promise.resolve(
                {questionDict: questionDict, skillDifficulty: 0.3}
              )
            }) as NgbModalRef;
      });

      component.suggestion.change_cmd.skill_id = 'skill_1';
      component.edit();
      tick();

      expect(ngbModal.open).toHaveBeenCalled();
    }));

    it('should throw error edit if skill id is null', fakeAsync(() => {
      class MockNgbModalRef {
        componentInstance = {
          suggestionId: suggestionId,
          question: question,
          questionId: '',
          questionStateData: question.getStateData(),
          skill: null,
          skillDifficulty: 0.3
        };
      }

      spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return (
            { componentInstance: MockNgbModalRef,
              result: Promise.resolve()
            }) as NgbModalRef;
      });

      component.suggestion.change_cmd.skill_id = undefined;
      expect(() => {
        component.edit();
        tick();
      }).toThrowError();
    }));

    it('should open edit question modal when clicking on' +
      ' edit button', fakeAsync(() => {
      spyOn(contextService, 'resetImageSaveDestination').and.stub();
      class MockNgbModalRef {
        componentInstance = {
          suggestionId: suggestionId,
          question: question,
          questionId: '',
          questionStateData: question.getStateData(),
          skill: null,
          skillDifficulty: 0.3
        };
      }

      spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return (
            { componentInstance: MockNgbModalRef,
              result: Promise.reject()
            }) as NgbModalRef;
      });

      component.suggestion.change_cmd.skill_id = 'skill_1';
      component.edit();
      tick();

      expect(contextService.resetImageSaveDestination).toHaveBeenCalled();
      expect(ngbModal.open).toHaveBeenCalled();
    }));

    it('should update review question modal when edit question modal is' +
      ' resolved', fakeAsync(() => {
      class MockNgbModalRef {
        componentInstance = {
          suggestionId: suggestionId,
          question: question,
          questionId: '',
          questionStateData: question.getStateData(),
          skill: null,
          skillDifficulty: 0.3
        };
      }

      const newContentHtml = 'new html';
      const newSkillDifficulty = 1;

      const suggestionChange = (
        component.suggestionIdToContribution[suggestionId].suggestion.
          change_cmd);
      const newQuestionDict = cloneDeep(suggestionChange.question_dict);
      newQuestionDict.question_state_data.content.html = newContentHtml;

      expect(
        component.question.getStateData().content.html
      ).toEqual(contentHtml);
      expect(
        suggestionChange.question_dict.question_state_data.content.html
      ).toEqual(contentHtml);
      expect(component.skillDifficulty).toBe(skillDifficulty);
      expect(suggestionChange.skill_difficulty).toEqual(skillDifficulty);

      spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return (
            { componentInstance: MockNgbModalRef,
              result: Promise.resolve({
                questionDict: newQuestionDict,
                skillDifficulty: newSkillDifficulty
              })
            }) as NgbModalRef;
      });

      component.suggestion.change_cmd.skill_id = 'skill_1';
      component.edit();
      tick();

      expect(ngbModal.open).toHaveBeenCalled();
      expect(
        component.question.getStateData().content.html
      ).toEqual(newContentHtml);
      expect(
        suggestionChange.question_dict.question_state_data.content.html
      ).toEqual(newContentHtml);
      expect(component.skillDifficulty).toBe(newSkillDifficulty);
      expect(suggestionChange.skill_difficulty).toEqual(newSkillDifficulty);

      suggestionChange.question_dict.question_state_data.content.html = (
        contentHtml);
      suggestionChange.skill_difficulty = skillDifficulty;
    }));

    it('should initialize properties after component is initialized',
      () => {
        expect(component.authorName).toBe(authorName);
        expect(component.contentHtml).toBe(contentHtml);
        expect(component.reviewable).toBe(reviewable);
        expect(component.reviewMessage).toBe('');
        expect(component.questionHeader).toBe(questionHeader);
        expect(component.canEditQuestion).toBe(false);
        expect(component.skillDifficultyLabel).toBe('Easy');
        expect(component.skillRubricExplanations).toEqual(['explanation']);
      });

    it('should register Contributor Dashboard view suggestion for review' +
      ' event after component is initialized', () => {
      expect(
        siteAnalyticsService
          .registerContributorDashboardViewSuggestionForReview)
        .toHaveBeenCalledWith('Question');
    });

    it('should reset validation error message when user updates question',
      () => {
        component.validationError = 'component is an error message';
        component.questionChanged();
        expect(component.validationError).toBeNull();
      });

    it('should accept suggestion in suggestion modal when clicking accept' +
      ' suggestion', fakeAsync(() => {
      spyOn(
        siteAnalyticsService,
        'registerContributorDashboardAcceptSuggestion');
      component.reviewMessage = 'Review message example';

      component.accept();
      tick();

      expect(
        siteAnalyticsService.registerContributorDashboardAcceptSuggestion)
        .toHaveBeenCalledWith('Question');
    }));

    it('should reject suggestion in suggestion modal when clicking reject' +
    ' suggestion button', fakeAsync(() => {
      spyOn(
        siteAnalyticsService,
        'registerContributorDashboardRejectSuggestion');
      component.reviewMessage = 'Review message example';

      component.reject();
      tick();

      expect(
        siteAnalyticsService.registerContributorDashboardRejectSuggestion)
        .toHaveBeenCalledWith('Question');
    }));

    it('should cancel suggestion in suggestion modal when clicking cancel' +
    ' suggestion button', () => {
      component.cancel();

      expect(cancelSuggestionSpy).toHaveBeenCalled();
    });
  });

  it('should initialize properties after component is initialized',
    () => {
      component.skillRubrics = [];

      expect(component.getRubricExplanation('nothing')).toBe(
        'This rubric has not yet been specified.');
    });

  it('should fetch the rejection message', fakeAsync(() => {
    component.currentSuggestionId = '2';

    component.skillRubrics = [{
      explanations: ['explanation'],
      difficulty: 'Easy'
    }];

    const messages = [
      { text: 'Question submitted.', author_username: 'Contributor' },
      { text: 'This is a rejection.', author_username: 'Reviewer' }
    ];
    component.reviewable = false;
    component.suggestionIsRejected = true;

    spyOn(component, '_getThreadMessagesAsync').and.callThrough();
    const fetchMessagesAsyncSpy = spyOn(
      threadDataBackendApiService, 'fetchMessagesAsync')
      .and.returnValue(Promise.resolve({
        messages: messages
      } as ThreadMessages));

    component.refreshContributionState();
    tick(1000);

    expect(component._getThreadMessagesAsync).toHaveBeenCalled();
    expect(fetchMessagesAsyncSpy).toHaveBeenCalledWith('2');
    expect(component.reviewMessage).toBe('This is a rejection.');
    expect(component.reviewer).toBe('Reviewer');
  }));

  it('should allow users to navigate between suggestions', fakeAsync(()=>{
    spyOn(component, 'refreshActiveContributionState').and.callThrough();

    expect(component.currentSuggestionId).toEqual('1');
    expect(component.skippedContributionIds.length).toEqual(0);
    expect(component.remainingContributionIdStack.length).toEqual(1);
    expect(component.isLastItem).toBeFalse();
    expect(component.isFirstItem).toBeTrue();

    component.goToNextItem();
    tick(0);

    expect(component.refreshActiveContributionState).toHaveBeenCalled();
    expect(component.currentSuggestionId).toEqual('2');
    expect(component.skippedContributionIds.length).toEqual(1);
    expect(component.remainingContributionIdStack.length).toEqual(0);
    expect(component.isLastItem).toBeTrue();
    expect(component.isFirstItem).toBeFalse();

    component.goToNextItem();
    tick(0);

    expect(component.currentSuggestionId).toEqual('2');
    expect(component.skippedContributionIds.length).toEqual(1);
    expect(component.remainingContributionIdStack.length).toEqual(0);
    expect(component.isLastItem).toBeTrue();
    expect(component.isFirstItem).toBeFalse();

    component.goToPreviousItem();
    tick(0);

    expect(component.refreshActiveContributionState).toHaveBeenCalled();
    expect(component.currentSuggestionId).toEqual('1');
    expect(component.skippedContributionIds.length).toEqual(0);
    expect(component.remainingContributionIdStack.length).toEqual(1);
    expect(component.isLastItem).toBeFalse();
    expect(component.isFirstItem).toBeTrue();

    component.goToPreviousItem();
    tick(0);

    expect(component.currentSuggestionId).toEqual('1');
    expect(component.skippedContributionIds.length).toEqual(0);
    expect(component.remainingContributionIdStack.length).toEqual(1);
    expect(component.isLastItem).toBeFalse();
    expect(component.isFirstItem).toBeTrue();
  }));

  it('should throw Error if selection is null', fakeAsync(() => {
    component.remainingContributionIdStack = [];
    expect(() => {
      component.goToNextItem();
    }).toThrowError();
  }));

  it('should throw Error if skip contribution id is null', fakeAsync(() => {
    component.isFirstItem = false;
    component.skippedContributionIds = [];
    expect(() => {
      component.goToPreviousItem();
    }).toThrowError();
  }));

  it('should not navigate if the corresponding opportunity is deleted',
    function() {
      spyOn(component, 'cancel');
      let details1 = component.allContributions['1'].details;
      let details2 = component.allContributions['2'].details;
      // This throws "Type 'null' is not assignable to type
      // 'ActiveContributionDetailsDict'." We need to suppress this error
      // because of the need to test validations. This error is thrown
      // because the details are null.
      // @ts-ignore
      component.allContributions['2'].details = null;

      component.goToNextItem();
      expect(component.cancel).toHaveBeenCalled();
      component.allContributions['2'].details = details2;
      component.goToNextItem();
      // This throws "Type 'null' is not assignable to type
      // 'ActiveContributionDetailsDict'." We need to suppress this error
      // because of the need to test validations. This error is thrown
      // because the details are null.
      // @ts-ignore
      component.allContributions['1'].details = null;

      component.goToPreviousItem();
      expect(component.cancel).toHaveBeenCalledWith();

      component.allContributions['1'].details = details1;
      component.allContributions['2'].details = details2;
    });
});
