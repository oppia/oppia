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
import { QuestionObjectFactory } from 'domain/question/QuestionObjectFactory';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { SuggestionModalService } from 'services/suggestion-modal.service';
import { QuestionSuggestionReviewModalComponent } from './question-suggestion-review-modal.component';
import { ThreadDataBackendApiService, ThreadMessages } from 'pages/exploration-editor-page/feedback-tab/services/thread-data-backend-api.service';
import { SuggestionBackendDict } from 'domain/suggestion/suggestion.model';
import { ContextService } from 'services/context.service';

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
  let questionObjectFactory: QuestionObjectFactory;
  let siteAnalyticsService: SiteAnalyticsService;
  let suggestionModalService: SuggestionModalService;
  let skillBackendApiService: SkillBackendApiService;
  let skillObjectFactory: SkillObjectFactory;
  let contextService: ContextService;
  let cancelSuggestionSpy = null;
  let threadDataBackendApiService: ThreadDataBackendApiService;
  const authorName = 'Username 1';
  const contentHtml = 'Content html';
  let question = null;
  const questionHeader = 'Question header';
  const reviewable = true;
  const skillDifficulty = 0.3;
  const suggestionId = '123';
  let suggestion = null;

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

    component.authorName = 'Username 1';
    component.contentHtml = 'Content html';
    component.question = null;
    component.questionHeader = 'Question header';
    component.reviewable = true;
    component.skillDifficulty = 0.3;
    component.suggestionId = '123';
    component.suggestion = null;
    component.skillDifficulty = skillDifficulty;
    component.suggestionId = suggestionId;
    component.suggestion = suggestion;

    ngbModal = TestBed.inject(NgbModal);
    skillBackendApiService = TestBed.inject(SkillBackendApiService);
    skillObjectFactory = TestBed.inject(SkillObjectFactory);
    questionObjectFactory = TestBed.inject(QuestionObjectFactory);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    threadDataBackendApiService = TestBed.inject(
      ThreadDataBackendApiService);
    contextService = TestBed.inject(
      ContextService);
    spyOn(
      siteAnalyticsService,
      'registerContributorDashboardViewSuggestionForReview');

    component.question = questionObjectFactory.createFromBackendDict({
      id: '1',
      question_state_data_schema_version: null,
      language_code: null,
      version: null,
      linked_skill_ids: null,
      inapplicable_skill_misconception_ids: null,
      question_state_data: {
        classifier_model_id: null,
        solicit_answer_details: null,
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
              dest: 'outcome 1',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'content_5',
                html: ''
              },
              labelled_as_correct: true,
              param_changes: [],
              missing_prerequisite_skill_id: null,
              refresher_exploration_id: null
            },
            rule_specs: [],
            training_data: null,
            tagged_skill_misconception_id: null,
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
            labelled_as_correct: true,
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
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

    component.suggestion = {
      status: 'accepted',
      change: {
        skill_id: 'skill_1'
      }
    } as SuggestionBackendDict;

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

      spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return (
            { componentInstance: MockNgbModalRef,
              result: Promise.resolve()
            }) as NgbModalRef;
      });

      component.edit();
      tick();

      expect(ngbModal.open).toHaveBeenCalled();
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

      component.edit();
      tick();

      expect(contextService.resetImageSaveDestination).toHaveBeenCalled();
      expect(ngbModal.open).toHaveBeenCalled();
    }));

    it('should return nothing when edit question modal is' +
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

      spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return (
            { componentInstance: MockNgbModalRef,
              result: Promise.resolve()
            }) as NgbModalRef;
      });

      component.edit();
      tick();

      expect(ngbModal.open).toHaveBeenCalled();
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
        component.validationError = 'This is an error message';
        component.questionChanged();
        expect(component.validationError).toBe(null);
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
    component.skillRubrics = [{
      explanations: ['explanation'],
      difficulty: 'Easy'
    }];

    const messages = [
      { text: 'Question submitted.' },
      { text: 'This is a rejection.' }
    ];
    component.reviewable = false;
    component.suggestionIsRejected = true;

    const fetchMessagesAsyncSpy = spyOn(
      threadDataBackendApiService, 'fetchMessagesAsync')
      .and.returnValue(Promise.resolve({
        messages: messages
      } as ThreadMessages));

    component.init();
    tick();

    expect(fetchMessagesAsyncSpy).toHaveBeenCalledWith('123');
    expect(component.reviewMessage).toBe('This is a rejection.');
  }));
});
