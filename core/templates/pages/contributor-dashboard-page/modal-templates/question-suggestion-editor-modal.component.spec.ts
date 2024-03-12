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
 * @fileoverview Unit tests for QuestionSuggestionEditorModalComponent.
 */

import {fakeAsync, tick} from '@angular/core/testing';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, waitForAsync, TestBed} from '@angular/core/testing';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {ContextService} from 'services/context.service';
import {QuestionSuggestionEditorModalComponent} from './question-suggestion-editor-modal.component';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ContributionAndReviewService} from '../services/contribution-and-review.service';
import {QuestionSuggestionBackendApiService} from '../services/question-suggestion-backend-api.service';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {QuestionUndoRedoService} from 'domain/editor/undo_redo/question-undo-redo.service';
import {
  Question,
  QuestionObjectFactory,
} from 'domain/question/QuestionObjectFactory';
import {Skill, SkillObjectFactory} from 'domain/skill/SkillObjectFactory';
import {AlertsService} from 'services/alerts.service';
import {CsrfTokenService} from 'services/csrf-token.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {State} from 'domain/state/StateObjectFactory';

class MockNgbModalRef {
  componentInstance!: {
    skillId: null;
  };
}

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
      result: Promise.resolve(),
    };
  }
}

class MockContributionAndReviewService {
  updateQuestionSuggestionAsync(
    suggestionId: string,
    skillDifficulty: string,
    questionStateData: string,
    imagesData: File[]
  ) {
    return {
      then: (successCallback: () => void, errorCallback: () => void) => {
        successCallback();
      },
    };
  }
}

class MockQuestionSuggestionBackendApiService {
  submitSuggestionAsync(
    question: Question,
    associatedSkill: string,
    skillDifficulty: string,
    imagesData: File[]
  ) {
    return {
      then: (successCallback: () => void, errorCallback: () => void) => {
        successCallback();
      },
    };
  }
}

class MockAlertsService {
  warnings = [];

  addInfoMessage(value1: string, value2: string) {}

  addSuccessMessage(value: string) {}
}

describe('Question Suggestion Editor Modal Component', () => {
  let component: QuestionSuggestionEditorModalComponent;
  let fixture: ComponentFixture<QuestionSuggestionEditorModalComponent>;
  let ngbActiveModal: NgbActiveModal;
  let alertsService: AlertsService;
  let contributionAndReviewService: ContributionAndReviewService;
  let csrfTokenService: CsrfTokenService;
  let ngbModal: NgbModal;
  let questionObjectFactory: QuestionObjectFactory;
  let questionUndoRedoService: QuestionUndoRedoService;
  let siteAnalyticsService: SiteAnalyticsService;
  let skillObjectFactory: SkillObjectFactory;
  let stateEditorService: StateEditorService;
  let question: Question;
  let questionId: string;
  let questionStateData: State;
  let skill: Skill;
  let skillDifficulty = 0.3;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [QuestionSuggestionEditorModalComponent],
      providers: [
        ContextService,
        UrlInterpolationService,
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal,
        },
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
        {
          provide: ContributionAndReviewService,
          useClass: MockContributionAndReviewService,
        },
        {
          provide: QuestionSuggestionBackendApiService,
          useClass: MockQuestionSuggestionBackendApiService,
        },
        {
          provide: AlertsService,
          useClass: MockAlertsService,
        },
        CsrfTokenService,
        QuestionObjectFactory,
        QuestionUndoRedoService,
        SiteAnalyticsService,
        SkillObjectFactory,
        StateEditorService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuestionSuggestionEditorModalComponent);
    component = fixture.componentInstance;

    alertsService = TestBed.inject(AlertsService);
    csrfTokenService = TestBed.inject(CsrfTokenService);
    questionObjectFactory = TestBed.inject(QuestionObjectFactory);
    contributionAndReviewService = TestBed.inject(ContributionAndReviewService);
    questionUndoRedoService = TestBed.inject(QuestionUndoRedoService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    skillObjectFactory = TestBed.inject(SkillObjectFactory);
    stateEditorService = TestBed.inject(StateEditorService);
    ngbModal = TestBed.inject(NgbModal);
    ngbActiveModal = TestBed.inject(NgbActiveModal);

    spyOn(csrfTokenService, 'getTokenAsync').and.returnValue(
      Promise.resolve('sample-csrf-token')
    );

    const skillContentsDict = {
      explanation: {
        html: 'test explanation',
        content_id: 'explanation',
      },
      worked_examples: [],
      recorded_voiceovers: {
        voiceovers_mapping: {},
      },
    };

    const skillDict = {
      id: '1',
      description: 'test description',
      misconceptions: [
        {
          id: 2,
          name: 'test name',
          notes: 'test notes',
          feedback: 'test feedback',
          must_be_addressed: false,
        },
      ],
      next_misconception_id: 3,
      prerequisite_skill_ids: [],
      rubrics: [],
      skill_contents: skillContentsDict,
      superseding_skill_id: 'id',
      language_code: 'en',
      version: 3,
      all_questions_merged: false,
    };
    skill = skillObjectFactory.createFromBackendDict(skillDict);
    component.skill = skill;
    question = questionObjectFactory.createFromBackendDict({
      id: skill.getId(),
      question_state_data: {
        classifier_model_id: null,
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
                missing_prerequisite_skill_id: null,
              },
              rule_specs: [],
              training_data: [],
              tagged_skill_misconception_id: null,
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
            dest: 'dest',
            dest_if_really_stuck: null,
            feedback: {
              html: 'Correct Answer',
              content_id: 'content_2',
            },
            param_changes: [],
            labelled_as_correct: true,
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
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
        solicit_answer_details: false,
        card_is_checkpoint: false,
        linked_skill_id: null,
      },
      next_content_id_index: 6,
      question_state_data_schema_version: 0,
      language_code: 'en',
      version: 1,
      linked_skill_ids: [],
      inapplicable_skill_misconception_ids: ['1-2'],
    });
    component.question = question;
    questionId = question.getId() as string;
    component.questionId = question.getId() as string;
    questionStateData = question.getStateData();
    component.questionStateData = question.getStateData();
    component.suggestionId = '1';

    spyOn(stateEditorService, 'isCurrentSolutionValid').and.returnValue(true);
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should initialize component properties after component is initialized', () => {
    spyOn(component, 'isQuestionValid').and.returnValue(false);
    spyOn(component, 'setDifficultyString').and.stub();

    component.ngOnInit();
    component.done();

    expect(component.canEditQuestion).toBe(true);
    expect(component.newQuestionIsBeingCreated).toBe(true);
    expect(component.question).toEqual(question);
    expect(component.questionId).toEqual(questionId);
    expect(component.questionStateData).toEqual(questionStateData);
    expect(component.skill).toEqual(skill);
  });

  it('should evaluate question validity', () => {
    expect(component.isQuestionValid()).toBe(true);
    expect(component.getQuestionValidationErrorMessage()).toBeNull();
  });

  it('should update the question', () => {
    spyOn(
      contributionAndReviewService,
      'updateQuestionSuggestionAsync'
    ).and.callFake(
      // This throws "Argument of type 'null' is not assignable to parameter of
      // type 'string'." We need to suppress this error
      // because of the need to test validations. This rule will be removed
      // when the codeowners file is updated.
      // @ts-ignore
      (
        suggestionId,
        skillDifficulty,
        questionStateData,
        nextContentIdIndex,
        imagesData,
        successCallback,
        errorCallback
      ) => {
        // This throws "Argument of type 'null' is not assignable to parameter
        // of type 'string'." We need to suppress
        // this error because of the need to test validations. This rule will be
        // removed when the codeowners file is updated.
        // @ts-ignore
        successCallback(null);
        return null;
      }
    );
    spyOn(questionUndoRedoService, 'hasChanges').and.returnValue(true);
    component.question = question;
    component.skillDifficulty = skillDifficulty;
    component.isEditing = true;

    component.done();

    expect(
      contributionAndReviewService.updateQuestionSuggestionAsync
    ).toHaveBeenCalled();
  });

  it('should fail to update the question when no changes are made', () => {
    spyOn(
      contributionAndReviewService,
      'updateQuestionSuggestionAsync'
    ).and.callFake(
      // This throws "Argument of type 'null' is not assignable to parameter
      // of type 'string'." We need to suppress this error
      // because of the need to test validations. This rule will be removed
      // when the codeowners file is updated.
      // @ts-ignore
      (
        suggestionId,
        skillDifficulty,
        questionStateData,
        nextContentIdIndex,
        imagesData,
        successCallback,
        errorCallback
      ) => {
        // This throws "Argument of type 'null' is not assignable to parameter
        // of type 'string'." We need to suppress
        // this error because of the need to test validations. This rule will
        // be removed when the codeowners file is updated.
        // @ts-ignore
        successCallback(null);
        return null;
      }
    );
    spyOn(questionUndoRedoService, 'hasChanges').and.returnValue(false);
    spyOn(alertsService, 'addInfoMessage');

    component.done();

    expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
      'No changes detected.',
      5000
    );
  });

  it('should show alert when suggestion is submitted', () => {
    spyOn(questionUndoRedoService, 'hasChanges').and.returnValue(true);
    spyOn(alertsService, 'addSuccessMessage');
    component.isEditing = false;
    component.done();
    expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
      'Submitted question for review.'
    );
  });

  it(
    'should register Contributor Dashboard submit suggestion event on' +
      ' submit',
    () => {
      spyOn(
        siteAnalyticsService,
        'registerContributorDashboardSubmitSuggestionEvent'
      );
      component.isEditing = false;
      spyOn(questionUndoRedoService, 'hasChanges').and.returnValue(true);
      component.done();
      expect(
        siteAnalyticsService.registerContributorDashboardSubmitSuggestionEvent
      ).toHaveBeenCalledWith('Question');
    }
  );

  it('should dismiss modal if there is no pending changes', () => {
    spyOn(questionUndoRedoService, 'hasChanges').and.returnValue(false);
    component.cancel();
  });

  it(
    "should dismiss modal if there is pending changes which won't be" +
      ' saved',
    fakeAsync(() => {
      let ngbSpy = spyOn(ngbActiveModal, 'dismiss').and.stub();
      spyOn(questionUndoRedoService, 'hasChanges').and.returnValue(true);
      spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: MockNgbModalRef,
        result: Promise.resolve(),
      } as NgbModalRef);

      component.cancel();
      tick();

      expect(ngbSpy).toHaveBeenCalledWith('cancel');
    })
  );

  it(
    'should not dismiss modal if there is pending changes which will be' +
      ' saved',
    () => {
      let ngbSpy = spyOn(ngbActiveModal, 'dismiss').and.stub();
      spyOn(questionUndoRedoService, 'hasChanges').and.returnValue(true);
      spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.reject(),
      } as NgbModalRef);
      component.cancel();

      expect(ngbSpy).not.toHaveBeenCalledWith('cancel');
    }
  );

  it(
    'should change skill difficulty when skill difficulty' +
      ' is edited via skill difficulty modal',
    fakeAsync(() => {
      spyOn(component, 'setDifficultyString').and.stub();
      spyOn(ngbActiveModal, 'dismiss').and.stub();
      spyOn(questionUndoRedoService, 'hasChanges').and.returnValue(true);
      spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: MockNgbModalRef,
        result: Promise.resolve({
          skillDifficulty: '0.6',
        }),
      } as NgbModalRef);

      component.onClickChangeDifficulty();
      tick();

      expect(component.skillDifficulty).toBe('0.6');
    })
  );

  it('should set the correct skill difficulty string', () => {
    component.setDifficultyString(0.6);
    expect(component.skillDifficultyString).toBe('Medium');
    component.setDifficultyString(0.9);
    expect(component.skillDifficultyString).toBe('Hard');
    component.setDifficultyString(0.3);
    expect(component.skillDifficultyString).toBe('Easy');
  });

  it('should dismiss modal if cancel button is clicked', fakeAsync(() => {
    let ngbSpy = spyOn(ngbActiveModal, 'dismiss').and.stub();
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: MockNgbModalRef,
      result: Promise.reject(),
    } as NgbModalRef);

    component.onClickChangeDifficulty();
    component.cancel();
    tick();

    expect(ngbSpy).toHaveBeenCalledWith('cancel');
  }));
});
