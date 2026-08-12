// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for CertificateAssessmentPlayerPageComponent.
 */

import {CommonModule} from '@angular/common';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flushMicrotasks,
} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {MatBottomSheet} from '@angular/material/bottom-sheet';
import {
  NgbModal,
  NgbModalOptions,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import {TimeExpiredModalComponent} from 'components/certificate-assessment-offering-helper/time-expired-modal.component';
import {UnansweredQuestionModalComponent} from 'components/certificate-assessment-offering-helper/unanswered-question-modal.component';
import {
  CertificateAssessmentOfferingBackendApiService,
  CertificateAssessmentQuestionBackendResponse,
} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';
import {CertificateAssessmentAttemptData} from 'domain/certificate-assessment/certificate-assessment-offering.model';
import {OutcomeBackendDict} from 'domain/exploration/outcome.model';
import {StateBackendDict} from 'domain/state/state.model';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {CertificateAssessmentPlayerPageComponent} from './certificate-assessment-player-page.component';

const createOutcomeBackendDict = (): OutcomeBackendDict => ({
  dest: 'final',
  dest_if_really_stuck: null,
  feedback: {content_id: 'feedback_1', html: '<p>Correct!</p>'},
  labelled_as_correct: true,
  param_changes: [],
  refresher_exploration_id: null,
  missing_prerequisite_skill_id: null,
});

const createMultipleChoiceStateData = (): StateBackendDict => ({
  classifier_model_id: null,
  content: {
    content_id: 'content',
    html: '<p>Which number completes the sequence: 2, 4, 6, ?</p>',
  },
  interaction: {
    answer_groups: [
      {
        rule_specs: [{rule_type: 'Equals', inputs: {x: 1}}],
        outcome: createOutcomeBackendDict(),
        training_data: [],
        tagged_skill_misconception_id: null,
      },
    ],
    confirmed_unclassified_answers: [],
    customization_args: {
      choices: {
        value: [
          {html: '<p>7</p>', content_id: 'a'},
          {html: '<p>8</p>', content_id: 'b'},
          {html: '<p>9</p>', content_id: 'c'},
        ],
      },
      showChoicesInShuffledOrder: {value: false},
    },
    default_outcome: createOutcomeBackendDict(),
    hints: [],
    id: 'MultipleChoiceInput',
    solution: null,
  },
  param_changes: [],
  solicit_answer_details: false,
  card_is_checkpoint: false,
  linked_skill_id: null,
  inapplicable_skill_misconception_ids: [],
});

const createItemSelectionStateData = (): StateBackendDict => ({
  classifier_model_id: null,
  content: {
    content_id: 'content',
    html: '<p>Select all prime numbers.</p>',
  },
  interaction: {
    answer_groups: [
      {
        rule_specs: [{rule_type: 'Equals', inputs: {x: ['a', 'b', 'd']}}],
        outcome: createOutcomeBackendDict(),
        training_data: [],
        tagged_skill_misconception_id: null,
      },
    ],
    confirmed_unclassified_answers: [],
    customization_args: {
      choices: {
        value: [
          {html: '<p>2</p>', content_id: 'a'},
          {html: '<p>3</p>', content_id: 'b'},
          {html: '<p>4</p>', content_id: 'c'},
          {html: '<p>5</p>', content_id: 'd'},
        ],
      },
      maxAllowableSelectionCount: {value: 4},
      minAllowableSelectionCount: {value: 1},
    },
    default_outcome: createOutcomeBackendDict(),
    hints: [],
    id: 'ItemSelectionInput',
    solution: null,
  },
  param_changes: [],
  solicit_answer_details: false,
  card_is_checkpoint: false,
  linked_skill_id: null,
  inapplicable_skill_misconception_ids: [],
});

const createTextInputStateData = (): StateBackendDict => ({
  classifier_model_id: null,
  content: {
    content_id: 'content',
    html: '<p>Type the name of the shape with three sides.</p>',
  },
  interaction: {
    answer_groups: [
      {
        rule_specs: [
          {
            rule_type: 'Equals',
            inputs: {x: {normalizedStrSet: ['Triangle']}},
          },
        ],
        outcome: createOutcomeBackendDict(),
        training_data: [],
        tagged_skill_misconception_id: null,
      },
    ],
    confirmed_unclassified_answers: [],
    customization_args: {
      placeholder: {
        value: {
          content_id: 'ca_placeholder_0',
          unicode_str: 'Enter your answer',
        },
      },
      rows: {value: 1},
      catchMisspellings: {value: false},
    },
    default_outcome: createOutcomeBackendDict(),
    hints: [],
    id: 'TextInput',
    solution: null,
  },
  param_changes: [],
  solicit_answer_details: false,
  card_is_checkpoint: false,
  linked_skill_id: null,
  inapplicable_skill_misconception_ids: [],
});

const createQuestionResponse = (
  questionId: string
): CertificateAssessmentQuestionBackendResponse => {
  let stateData: StateBackendDict;
  if (questionId === 'question_1') {
    stateData = createMultipleChoiceStateData();
  } else if (questionId === 'question_2') {
    stateData = createItemSelectionStateData();
  } else {
    stateData = createTextInputStateData();
  }
  return {question_id: questionId, question_state_data: stateData};
};

class MockNgbModal {
  open(component: unknown, options: NgbModalOptions): NgbModalRef {
    return {
      componentInstance: {},
      result: Promise.resolve(null),
      close: () => {},
      dismiss: () => {},
    } as NgbModalRef;
  }
}

describe('CertificateAssessmentPlayerPageComponent', () => {
  let component: CertificateAssessmentPlayerPageComponent;
  let fixture: ComponentFixture<CertificateAssessmentPlayerPageComponent>;

  const configureComponent = async (
    attempt: CertificateAssessmentAttemptData | null
  ): Promise<void> => {
    const bottomSheetSpy = jasmine.createSpyObj('MatBottomSheet', ['open']);
    const windowDimensionsServiceSpy = jasmine.createSpyObj(
      'WindowDimensionsService',
      ['getWidth']
    );
    windowDimensionsServiceSpy.getWidth.and.returnValue(800);
    const certificateAssessmentOfferingBackendApiServiceSpy =
      jasmine.createSpyObj('CertificateAssessmentOfferingBackendApiService', [
        'getCertificateAssessmentQuestionAsync',
      ]);
    certificateAssessmentOfferingBackendApiServiceSpy.getCertificateAssessmentQuestionAsync.and.callFake(
      (_attemptId: string, questionId: string) =>
        Promise.resolve(createQuestionResponse(questionId))
    );

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      declarations: [CertificateAssessmentPlayerPageComponent],
      imports: [CommonModule],
      providers: [
        {
          provide: MatBottomSheet,
          useValue: bottomSheetSpy,
        },
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
        {
          provide: WindowDimensionsService,
          useValue: windowDimensionsServiceSpy,
        },
        {
          provide: CertificateAssessmentOfferingBackendApiService,
          useValue: certificateAssessmentOfferingBackendApiServiceSpy,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CertificateAssessmentPlayerPageComponent);
    component = fixture.componentInstance;
    component.attempt = attempt;
  };

  const createAttempt = (): CertificateAssessmentAttemptData =>
    CertificateAssessmentAttemptData.createFromBackendDict({
      attempt_id: 'attempt-1234',
      questions: [
        {question_id: 'question_1', question_version: 1},
        {question_id: 'question_2', question_version: 2},
        {question_id: 'question_3', question_version: 1},
      ],
    });

  // Loads all three questions by advancing through the player, since
  // questions are fetched lazily. The first change detection also triggers
  // ngOnInit, so this must be called from a fakeAsync test.
  const loadAllQuestions = (): void => {
    fixture.detectChanges();
    flushMicrotasks();
    component.nextQuestion();
    flushMicrotasks();
    component.nextQuestion();
    flushMicrotasks();
  };

  beforeEach(async () => {
    await configureComponent(createAttempt());
  });

  it('should build questions from the attempt using the real question ids', fakeAsync(() => {
    loadAllQuestions();

    expect(component.questions.length).toBe(3);
    expect(component.questions.map(question => question.id)).toEqual([
      'question_1',
      'question_2',
      'question_3',
    ]);
    expect(component.questions[0].prompt).toBe(
      'Which number completes the sequence: 2, 4, 6, ?'
    );
  }));

  it('should build no questions when the attempt is null', async () => {
    await configureComponent(null);

    expect(component.questions.length).toBe(0);
    expect(component.getCurrentQuestion()).toBeNull();
  });

  it('should advance to the next question on nextQuestion when not at the last question', () => {
    expect(component.currentQuestionIndex).toBe(0);

    component.nextQuestion();

    expect(component.currentQuestionIndex).toBe(1);
  });

  it('should not advance past the last question on nextQuestion', fakeAsync(() => {
    loadAllQuestions();
    component.currentQuestionIndex = component.questions.length - 1;

    component.nextQuestion();

    expect(component.currentQuestionIndex).toBe(component.questions.length - 1);
  }));

  it('should go back one question when previousQuestion is called away from the start', () => {
    component.currentQuestionIndex = 2;

    component.previousQuestion();

    expect(component.currentQuestionIndex).toBe(1);
  });

  it('should not go back past the first question', () => {
    component.currentQuestionIndex = 0;

    component.previousQuestion();

    expect(component.currentQuestionIndex).toBe(0);
  });

  it('should compute the progress percentage based on the current question index', fakeAsync(() => {
    loadAllQuestions();
    component.currentQuestionIndex = 0;
    expect(component.getProgressPercentage()).toBe(
      Math.round((1 / component.questions.length) * 100)
    );

    component.currentQuestionIndex = component.questions.length - 1;
    expect(component.getProgressPercentage()).toBe(100);
  }));

  it('should return the question at the current question index', fakeAsync(() => {
    loadAllQuestions();
    component.currentQuestionIndex = 1;

    expect(component.getCurrentQuestion()).toEqual(component.questions[1]);
  }));

  it('should report whether the current question is the last one', fakeAsync(() => {
    loadAllQuestions();
    component.currentQuestionIndex = 0;
    expect(component.isCurrentQuestionLast()).toBeFalse();

    component.currentQuestionIndex = component.questions.length - 1;
    expect(component.isCurrentQuestionLast()).toBeTrue();
  }));

  it('should read and store submitted responses by question id', fakeAsync(() => {
    loadAllQuestions();
    expect(component.getSavedResponse()).toBe('');

    component.updateResponse('b');
    expect(component.getSavedResponse()).toBe('b');
    expect(component.answers.question_1).toBe('b');

    component.currentQuestionIndex = 1;
    expect(component.getSavedResponse()).toBe('');

    component.updateResponse('a,c');
    expect(component.getSavedResponse()).toBe('a,c');
    expect(component.answers.question_2).toBe('a,c');
  }));

  it('should emit answers with correctness on submitAssessment', fakeAsync(() => {
    loadAllQuestions();
    spyOn(component.assessmentSubmitted, 'emit');
    // The first question is multiple choice; the correct option is index 1
    // (the choice with text '8').
    component.answers.question_1 = 'b';
    // The second question is multiple select; the correct options are the
    // choices with content ids 'a', 'b' and 'd'.
    component.answers.question_2 = 'a,b,d';
    // The third question is left unanswered.

    component.submitAssessment();

    expect(component.assessmentSubmitted.emit).toHaveBeenCalledWith([
      {question_id: 'question_1', is_correct: true, selected_answer: '1'},
      {
        question_id: 'question_2',
        is_correct: true,
        selected_answer: 'a,b,d',
      },
      {question_id: 'question_3', is_correct: false},
    ]);
  }));

  it('should emit incorrect answers on submitAssessment when they are wrong', fakeAsync(() => {
    loadAllQuestions();
    spyOn(component.assessmentSubmitted, 'emit');
    component.answers.question_1 = 'a';
    component.answers.question_2 = 'a,c';
    component.answers.question_3 = 'circle';

    component.submitAssessment();

    const answers = (
      component.assessmentSubmitted.emit as jasmine.Spy
    ).calls.mostRecent().args[0];
    expect(answers[0]).toEqual({
      question_id: 'question_1',
      is_correct: false,
      selected_answer: '0',
    });
    expect(answers[1]).toEqual({
      question_id: 'question_2',
      is_correct: false,
      selected_answer: 'a,c',
    });
    expect(answers[2]).toEqual({
      question_id: 'question_3',
      is_correct: false,
      selected_answer: 'circle',
    });
  }));

  it('should not render the time-expired modal inline in the page', () => {
    expect(
      fixture.debugElement.query(By.css('oppia-time-expired-modal'))
    ).toBeNull();
  });

  it('should open the time-expired modal when showTimeExpiredModal is true', () => {
    const ngbModal = TestBed.inject(NgbModal);
    spyOn(ngbModal, 'open').and.callThrough();
    component.showTimeExpiredModal = true;
    component.showUnansweredQuestionModal = false;
    fixture.detectChanges();

    expect(ngbModal.open).toHaveBeenCalledWith(TimeExpiredModalComponent, {
      backdrop: 'static',
      centered: true,
      windowClass: 'oppia-time-expired-modal',
    });
  });

  it('should not open the time-expired modal when showTimeExpiredModal is false', () => {
    const ngbModal = TestBed.inject(NgbModal);
    spyOn(ngbModal, 'open').and.callThrough();
    component.showTimeExpiredModal = false;
    component.showUnansweredQuestionModal = false;
    fixture.detectChanges();

    expect(ngbModal.open).not.toHaveBeenCalled();
  });

  it('should handle the time-expired modal result when it is dismissed', fakeAsync(() => {
    const ngbModal = TestBed.inject(NgbModal);
    const modalRef = {
      componentInstance: {},
      result: Promise.reject('dismissed'),
    } as NgbModalRef;
    spyOn(ngbModal, 'open').and.returnValue(modalRef);
    component.showTimeExpiredModal = true;
    component.showUnansweredQuestionModal = false;

    fixture.detectChanges();
    flushMicrotasks();

    expect(ngbModal.open).toHaveBeenCalledWith(TimeExpiredModalComponent, {
      backdrop: 'static',
      centered: true,
      windowClass: 'oppia-time-expired-modal',
    });
  }));

  it('should open the unanswered-question modal when showUnansweredQuestionModal is true', () => {
    const ngbModal = TestBed.inject(NgbModal);
    spyOn(ngbModal, 'open').and.callThrough();
    component.showTimeExpiredModal = false;
    component.showUnansweredQuestionModal = true;
    fixture.detectChanges();

    const modalRef = (ngbModal.open as jasmine.Spy).calls.mostRecent()
      .returnValue as NgbModalRef;
    expect(ngbModal.open).toHaveBeenCalledWith(
      UnansweredQuestionModalComponent,
      {
        backdrop: 'static',
        centered: true,
        windowClass: 'oppia-unanswered-question-modal',
      }
    );
    expect(modalRef.componentInstance.unansweredQuestionCount).toBe(3);
  });

  it('should handle the unanswered-question modal result when it is dismissed', fakeAsync(() => {
    const ngbModal = TestBed.inject(NgbModal);
    const modalRef = {
      componentInstance: {},
      result: Promise.reject('dismissed'),
    } as NgbModalRef;
    spyOn(ngbModal, 'open').and.returnValue(modalRef);
    component.showTimeExpiredModal = false;
    component.showUnansweredQuestionModal = true;

    fixture.detectChanges();
    flushMicrotasks();

    expect(ngbModal.open).toHaveBeenCalledWith(
      UnansweredQuestionModalComponent,
      {
        backdrop: 'static',
        centered: true,
        windowClass: 'oppia-unanswered-question-modal',
      }
    );
  }));

  it('should not open any modal when both modal flags are false', () => {
    const ngbModal = TestBed.inject(NgbModal);
    spyOn(ngbModal, 'open').and.callThrough();
    component.showTimeExpiredModal = false;
    component.showUnansweredQuestionModal = false;
    fixture.detectChanges();

    expect(ngbModal.open).not.toHaveBeenCalled();
  });

  it('should open the time-expired modal as a bottom sheet on mobile screens', () => {
    const bottomSheet = TestBed.inject(MatBottomSheet);
    const windowDimensionsService = TestBed.inject(
      WindowDimensionsService
    ) as jasmine.SpyObj<WindowDimensionsService>;
    windowDimensionsService.getWidth.and.returnValue(400);
    component.showTimeExpiredModal = true;
    component.showUnansweredQuestionModal = false;
    fixture.detectChanges();

    expect(bottomSheet.open).toHaveBeenCalledWith(TimeExpiredModalComponent);
  });

  it('should open the unanswered-question modal as a bottom sheet on mobile screens', () => {
    const bottomSheet = TestBed.inject(MatBottomSheet);
    const windowDimensionsService = TestBed.inject(
      WindowDimensionsService
    ) as jasmine.SpyObj<WindowDimensionsService>;
    windowDimensionsService.getWidth.and.returnValue(400);
    component.showTimeExpiredModal = false;
    component.showUnansweredQuestionModal = true;
    fixture.detectChanges();

    expect(bottomSheet.open).toHaveBeenCalledWith(
      UnansweredQuestionModalComponent
    );
  });
});
