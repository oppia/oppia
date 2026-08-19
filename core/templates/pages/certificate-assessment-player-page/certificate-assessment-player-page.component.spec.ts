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
import {MatBottomSheet} from '@angular/material/bottom-sheet';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {CertificateAssessmentOfferingBackendApiService} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';
import {
  AssessmentQuestionTypes,
  CertificateAssessmentAttemptData,
  CertificateAssessmentQuestionData,
} from 'domain/certificate-assessment/certificate-assessment.model';
import {OutcomeBackendDict} from 'domain/exploration/outcome.model';
import {StateBackendDict} from 'domain/state/state.model';
import {AnswerClassificationService} from 'pages/exploration-player-page/services/answer-classification.service';
import {CurrentInteractionService} from 'pages/exploration-player-page/services/current-interaction.service';
import {ExplorationHtmlFormatterService} from 'services/exploration-html-formatter.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {InteractionRulesRegistryService} from 'services/interaction-rules-registry.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {TimeExpiredModalComponent} from 'components/certificate-assessment-offering-helper/time-expired-modal.component';
import {UnansweredQuestionModalComponent} from 'components/certificate-assessment-offering-helper/unanswered-question-modal.component';
import {CertificateAssessmentPlayerPageComponent} from './certificate-assessment-player-page.component';

const outcome = (labelledAsCorrect: boolean): OutcomeBackendDict => ({
  dest: 'final',
  dest_if_really_stuck: null,
  feedback: {content_id: 'f', html: '<p>f</p>'},
  labelled_as_correct: labelledAsCorrect,
  param_changes: [],
  refresher_exploration_id: null,
  missing_prerequisite_skill_id: null,
});

const customizationArgsFor = (
  interactionId: string
): Record<string, unknown> => {
  switch (interactionId) {
    case 'TextInput':
      return {
        rows: {value: 1},
        placeholder: {
          value: {content_id: 'ca_placeholder_0', unicode_str: 'Type here'},
        },
        catchMisspellings: {value: false},
      };
    case 'MultipleChoiceInput':
      return {
        choices: {
          value: [
            {html: '<p>3</p>', content_id: 'a'},
            {html: '<p>4</p>', content_id: 'b'},
          ],
        },
        showChoicesInShuffledOrder: {value: false},
      };
    case 'ItemSelectionInput':
      return {
        choices: {
          value: [
            {html: '<p>2</p>', content_id: 'a'},
            {html: '<p>3</p>', content_id: 'b'},
            {html: '<p>4</p>', content_id: 'c'},
          ],
        },
        maxAllowableSelectionCount: {value: 3},
        minAllowableSelectionCount: {value: 1},
      };
    case 'NumericInput':
      return {requireNonnegativeInput: {value: true}};
    case 'FractionInput':
      return {
        requireSimplestForm: {value: true},
        allowImproperFraction: {value: true},
        allowNonzeroIntegerPart: {value: true},
        customPlaceholder: {
          value: {
            content_id: 'ca_placeholder_0',
            unicode_str: 'Enter fraction',
          },
        },
      };
    case 'DragAndDropSortInput':
      return {
        choices: {
          value: [
            {html: '<p>Item A</p>', content_id: 'a'},
            {html: '<p>Item B</p>', content_id: 'b'},
          ],
        },
        allowMultipleItemsInSamePosition: {value: false},
      };
    case 'NumberWithUnits':
    case 'ImageClickInput':
      return {};
    default:
      return {};
  }
};

const stateDataFor = (
  id: string,
  answerGroups: StateBackendDict['interaction']['answer_groups'] = []
): StateBackendDict => ({
  classifier_model_id: null,
  content: {content_id: 'c', html: '<p>prompt</p>'},
  interaction: {
    answer_groups: answerGroups,
    confirmed_unclassified_answers: [],
    customization_args: customizationArgsFor(id),
    default_outcome: outcome(false),
    hints: [],
    id,
    solution: null,
  },
  param_changes: [],
  solicit_answer_details: false,
  card_is_checkpoint: false,
  linked_skill_id: null,
  inapplicable_skill_misconception_ids: [],
});

const questionResponse = (
  questionId: string
): CertificateAssessmentQuestionData => {
  const interactionId =
    questionId === 'q1'
      ? 'MultipleChoiceInput'
      : questionId === 'q2'
        ? 'ItemSelectionInput'
        : 'TextInput';
  return CertificateAssessmentQuestionData.createFromBackendDict({
    question_id: questionId,
    question_state_data: stateDataFor(interactionId),
  });
};

const makeAttempt = (
  ids: string[] = ['q1', 'q2', 'q3']
): CertificateAssessmentAttemptData =>
  CertificateAssessmentAttemptData.createFromBackendDict({
    attempt_id: 'att-1',
    questions: ids.map(questionId => ({
      question_id: questionId,
      question_version: 1,
    })),
  });

const modalRef = (reject = false): NgbModalRef =>
  ({
    componentInstance: {} as Record<string, unknown>,
    result: reject ? Promise.reject('dismissed') : Promise.resolve(null),
    close: () => {},
    dismiss: () => {},
  }) as unknown as NgbModalRef;

describe('CertificateAssessmentPlayerPageComponent', () => {
  let component: CertificateAssessmentPlayerPageComponent;
  let fixture: ComponentFixture<CertificateAssessmentPlayerPageComponent>;
  let bottomSheetSpy: jasmine.SpyObj<MatBottomSheet>;
  let modalSpy: jasmine.SpyObj<NgbModal>;
  let dimsSpy: jasmine.SpyObj<WindowDimensionsService>;
  let apiSpy: jasmine.SpyObj<CertificateAssessmentOfferingBackendApiService>;
  let registrySpy: jasmine.SpyObj<InteractionRulesRegistryService>;
  let classificationSpy: jasmine.SpyObj<AnswerClassificationService>;
  let formatterSpy: jasmine.SpyObj<ExplorationHtmlFormatterService>;

  const setup = async (
    attempt: CertificateAssessmentAttemptData | null = makeAttempt()
  ): Promise<void> => {
    bottomSheetSpy = jasmine.createSpyObj('MatBottomSheet', ['open']);
    modalSpy = jasmine.createSpyObj('NgbModal', ['open']);
    modalSpy.open.and.returnValue(modalRef());
    dimsSpy = jasmine.createSpyObj('WindowDimensionsService', ['getWidth']);
    dimsSpy.getWidth.and.returnValue(800);
    apiSpy = jasmine.createSpyObj('Api', [
      'getCertificateAssessmentQuestionAsync',
    ]);
    apiSpy.getCertificateAssessmentQuestionAsync.and.callFake(
      (_a: string, qId: string) => Promise.resolve(questionResponse(qId))
    );
    registrySpy = jasmine.createSpyObj('Registry', [
      'getRulesServiceByInteractionId',
    ]);
    registrySpy.getRulesServiceByInteractionId.and.returnValue({
      Equals: (answer: unknown, ruleInputs: {x: unknown}) => {
        if (Array.isArray(answer) && Array.isArray(ruleInputs.x)) {
          return (
            answer.length === ruleInputs.x.length &&
            answer.every((v, i) => v === (ruleInputs.x as unknown[])[i])
          );
        }
        return answer === ruleInputs.x;
      },
    });
    classificationSpy = jasmine.createSpyObj('Classification', [
      'getMatchingClassificationResult',
    ]);
    classificationSpy.getMatchingClassificationResult.and.returnValue({
      outcome: {labelledAsCorrect: false},
      answerGroupIndex: 0,
      ruleIndex: 0,
      classificationCategorization: 'default_outcome',
    } as never);
    formatterSpy = jasmine.createSpyObj('Formatter', ['getInteractionHtml']);
    formatterSpy.getInteractionHtml.and.returnValue('<div>interaction</div>');

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      declarations: [CertificateAssessmentPlayerPageComponent],
      imports: [CommonModule],
      providers: [
        {provide: MatBottomSheet, useValue: bottomSheetSpy},
        {provide: NgbModal, useValue: modalSpy},
        {provide: WindowDimensionsService, useValue: dimsSpy},
        {
          provide: CertificateAssessmentOfferingBackendApiService,
          useValue: apiSpy,
        },
        {provide: InteractionRulesRegistryService, useValue: registrySpy},
        {provide: AnswerClassificationService, useValue: classificationSpy},
        {provide: ExplorationHtmlFormatterService, useValue: formatterSpy},
        {
          provide: CurrentInteractionService,
          useValue: jasmine.createSpyObj('CurrentInteraction', [
            'setOnSubmitFn',
          ]),
        },
        {
          provide: FocusManagerService,
          useValue: jasmine.createSpyObj('Focus', ['generateFocusLabel']),
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CertificateAssessmentPlayerPageComponent);
    component = fixture.componentInstance;
    component.attempt = attempt;
  };

  const load = (): void => {
    fixture.detectChanges();
    flushMicrotasks();
    component.nextQuestion();
    flushMicrotasks();
    component.nextQuestion();
    flushMicrotasks();
  };

  const loadQ1 = (): void => {
    fixture.detectChanges();
    flushMicrotasks();
  };

  beforeEach(async () => {
    await setup();
  });

  // ---- loadQuestion ----

  it('should load questions from the attempt', fakeAsync(() => {
    load();
    expect(component.questions.length).toBe(3);
    expect(component.questions.map(q => q.id)).toEqual(['q1', 'q2', 'q3']);
  }));

  it('should not load when attempt is null', async () => {
    await setup(null);
    fixture.detectChanges();
    expect(component.questions.length).toBe(0);
    expect(apiSpy.getCertificateAssessmentQuestionAsync).not.toHaveBeenCalled();
  });

  it('should not load when attempt question index is out of range', fakeAsync(() => {
    loadQ1();
    // eslint-disable-next-line dot-notation
    (component as Record<string, unknown>)['loadQuestion'](99);
    flushMicrotasks();
    expect(component.questions.length).toBe(1);
  }));

  it('should not fire second request for in-flight index', fakeAsync(() => {
    let resolve!: (v: CertificateAssessmentQuestionData) => void;
    apiSpy.getCertificateAssessmentQuestionAsync.and.returnValue(
      new Promise(r => {
        resolve = r;
      })
    );
    loadQ1();
    expect(apiSpy.getCertificateAssessmentQuestionAsync).toHaveBeenCalledTimes(
      1
    );
    expect(component.isLoadingQuestion).toBeTrue();
    // eslint-disable-next-line dot-notation
    (component as Record<string, unknown>)['loadQuestion'](0);
    expect(apiSpy.getCertificateAssessmentQuestionAsync).toHaveBeenCalledTimes(
      1
    );
    resolve(questionResponse('q1'));
    flushMicrotasks();
    expect(component.isLoadingQuestion).toBeFalse();
  }));

  it('should store questions at correct index for sparse loading', fakeAsync(() => {
    const deferreds: ((v: CertificateAssessmentQuestionData) => void)[] = [];
    apiSpy.getCertificateAssessmentQuestionAsync.and.callFake(
      () =>
        new Promise(r => {
          deferreds.push(r);
        })
    );
    loadQ1();
    component.nextQuestion();
    flushMicrotasks();
    deferreds[1](questionResponse('q2'));
    flushMicrotasks();
    expect(component.questions[1]).toBeDefined();
    expect(component.questions[0]).toBeUndefined();
    deferreds[0](questionResponse('q1'));
    flushMicrotasks();
    expect(component.questions[0]).toBeDefined();
  }));

  it('should set loadError on failure and clear on success', fakeAsync(() => {
    apiSpy.getCertificateAssessmentQuestionAsync.and.returnValue(
      Promise.reject(new Error('err'))
    );
    loadQ1();
    expect(component.loadError).toBeTrue();
    apiSpy.getCertificateAssessmentQuestionAsync.and.returnValue(
      Promise.resolve(questionResponse('q1'))
    );
    // eslint-disable-next-line dot-notation
    (component as Record<string, unknown>)['loadQuestion'](0);
    flushMicrotasks();
    expect(component.loadError).toBeFalse();
  }));

  it('should not reload already loaded question', fakeAsync(() => {
    load();
    const count = apiSpy.getCertificateAssessmentQuestionAsync.calls.count();
    // eslint-disable-next-line dot-notation
    (component as Record<string, unknown>)['loadQuestion'](0);
    expect(apiSpy.getCertificateAssessmentQuestionAsync.calls.count()).toBe(
      count
    );
  }));

  // ---- navigation ----

  it('should advance to next question', () => {
    component.nextQuestion();
    expect(component.currentQuestionIndex).toBe(1);
  });

  it('should not advance past last question', fakeAsync(() => {
    load();
    component.nextQuestion();
    expect(component.currentQuestionIndex).toBe(2);
  }));

  it('should go back one question', () => {
    component.currentQuestionIndex = 2;
    component.previousQuestion();
    expect(component.currentQuestionIndex).toBe(1);
  });

  it('should not go back past first question', () => {
    component.previousQuestion();
    expect(component.currentQuestionIndex).toBe(0);
  });

  // ---- derived fields ----

  it('should recompute derived fields on first load', fakeAsync(() => {
    expect(component.currentQuestion).toBeNull();
    loadQ1();
    expect(component.currentQuestion).toEqual(component.questions[0]);
    expect(component.totalQuestionCount).toBe(3);
    expect(component.progressPercentage).toBe(Math.round((1 / 3) * 100));
    expect(component.isLastQuestion).toBeFalse();
  }));

  it('should recompute derived fields when navigating', fakeAsync(() => {
    load();
    component.currentQuestionIndex = 0;
    component.nextQuestion();
    expect(component.isLastQuestion).toBeFalse();
    component.nextQuestion();
    expect(component.isLastQuestion).toBeTrue();
    expect(component.progressPercentage).toBe(100);
    component.previousQuestion();
    expect(component.isLastQuestion).toBeFalse();
  }));

  // ---- handleInteractionSubmit ----

  it('should store answer via handleInteractionSubmit', fakeAsync(() => {
    load();
    component.currentQuestionIndex = 0;
    component.handleInteractionSubmit(1);
    expect(component.answers.q1).toBe(1);
  }));

  it('should not throw when no question loaded', () => {
    expect(() => component.handleInteractionSubmit(1)).not.toThrowError();
  });

  // ---- getLastAnswer ----

  it('should return null when no question loaded', () => {
    expect(component.getLastAnswer()).toBeNull();
  });

  it('should return null when no answer set', fakeAsync(() => {
    load();
    expect(component.getLastAnswer()).toBeNull();
  }));

  it('should return last answer', fakeAsync(() => {
    load();
    component.answers.q3 = 'hello';
    expect(component.getLastAnswer()).toBe('hello');
  }));

  // ---- getInteractionHtml ----

  it('should return empty when no question loaded', () => {
    expect(component.getInteractionHtml()).toBe('');
  });

  it('should return html for loaded question', fakeAsync(() => {
    load();
    expect(component.getInteractionHtml()).toBe('<div>interaction</div>');
  }));

  // ---- getCurrentQuestion ----

  it('should return null when no questions loaded', () => {
    expect(component.getCurrentQuestion()).toBeNull();
  });

  it('should return null when question at index not loaded', fakeAsync(() => {
    loadQ1();
    component.currentQuestionIndex = 1;
    expect(component.getCurrentQuestion()).toBeNull();
  }));

  it('should return question at current index', fakeAsync(() => {
    load();
    component.currentQuestionIndex = 1;
    expect(component.getCurrentQuestion()).toEqual(component.questions[1]);
  }));

  // ---- isCurrentQuestionLast ----

  it('should report whether current question is last', fakeAsync(() => {
    load();
    component.currentQuestionIndex = 0;
    expect(component.isCurrentQuestionLast()).toBeFalse();
    component.currentQuestionIndex = 2;
    expect(component.isCurrentQuestionLast()).toBeTrue();
  }));

  // ---- getProgressPercentage ----

  it('should return 0 when no questions', async () => {
    await setup(null);
    fixture.detectChanges();
    expect(component.getProgressPercentage()).toBe(0);
  });

  it('should compute progress percentage', fakeAsync(() => {
    load();
    component.currentQuestionIndex = 0;
    expect(component.getProgressPercentage()).toBe(Math.round((1 / 3) * 100));
    component.currentQuestionIndex = 2;
    expect(component.getProgressPercentage()).toBe(100);
  }));

  // ---- modals ----

  it('should open time-expired modal on desktop', fakeAsync(() => {
    loadQ1();
    component.showTimeExpiredModal = true;
    component.showUnansweredQuestionModal = false;
    component.ngOnInit();
    expect(modalSpy.open).toHaveBeenCalledWith(TimeExpiredModalComponent, {
      backdrop: 'static',
      centered: true,
      windowClass: 'oppia-time-expired-modal',
    });
  }));

  it('should open time-expired modal as bottom sheet on mobile', fakeAsync(() => {
    loadQ1();
    dimsSpy.getWidth.and.returnValue(400);
    component.showTimeExpiredModal = true;
    component.showUnansweredQuestionModal = false;
    component.ngOnInit();
    expect(bottomSheetSpy.open).toHaveBeenCalledWith(TimeExpiredModalComponent);
  }));

  it('should handle time-expired modal dismiss', fakeAsync(() => {
    loadQ1();
    modalSpy.open.and.returnValue(modalRef(true));
    component.showTimeExpiredModal = true;
    component.showUnansweredQuestionModal = false;
    component.ngOnInit();
    flushMicrotasks();
  }));

  it('should open unanswered-question modal on desktop', fakeAsync(() => {
    loadQ1();
    component.showTimeExpiredModal = false;
    component.showUnansweredQuestionModal = true;
    component.ngOnInit();
    expect(modalSpy.open).toHaveBeenCalledWith(
      UnansweredQuestionModalComponent,
      {
        backdrop: 'static',
        centered: true,
        windowClass: 'oppia-unanswered-question-modal',
      }
    );
  }));

  it('should open unanswered-question modal as bottom sheet on mobile', fakeAsync(() => {
    loadQ1();
    dimsSpy.getWidth.and.returnValue(400);
    component.showTimeExpiredModal = false;
    component.showUnansweredQuestionModal = true;
    component.ngOnInit();
    expect(bottomSheetSpy.open).toHaveBeenCalledWith(
      UnansweredQuestionModalComponent
    );
  }));

  it('should handle unanswered-question modal dismiss', fakeAsync(() => {
    loadQ1();
    modalSpy.open.and.returnValue(modalRef(true));
    component.showTimeExpiredModal = false;
    component.showUnansweredQuestionModal = true;
    component.ngOnInit();
    flushMicrotasks();
  }));

  it('should not open any modal when both flags are false', fakeAsync(() => {
    loadQ1();
    modalSpy.open.calls.reset();
    component.showTimeExpiredModal = false;
    component.showUnansweredQuestionModal = false;
    component.ngOnInit();
    expect(modalSpy.open).not.toHaveBeenCalled();
  }));

  // ---- submitAssessment ----

  it('should emit correct answers on submit', fakeAsync(() => {
    load();
    spyOn(component.assessmentSubmitted, 'emit');
    classificationSpy.getMatchingClassificationResult.and.returnValue({
      outcome: {labelledAsCorrect: true},
      answerGroupIndex: 0,
      ruleIndex: 0,
      classificationCategorization: 'explicit',
    } as never);
    component.answers.q1 = 1;
    component.answers.q2 = ['a', 'b', 'd'];
    component.submitAssessment();
    expect(component.assessmentSubmitted.emit).toHaveBeenCalledWith([
      {question_id: 'q1', is_correct: true, selected_answer: '1'},
      {question_id: 'q2', is_correct: true, selected_answer: 'a,b,d'},
      {question_id: 'q3', is_correct: false},
    ]);
  }));

  it('should emit incorrect answers on submit', fakeAsync(() => {
    load();
    spyOn(component.assessmentSubmitted, 'emit');
    component.answers.q1 = 0;
    component.answers.q2 = ['a', 'c'];
    component.answers.q3 = 'circle';
    component.submitAssessment();
    const answers = (
      component.assessmentSubmitted.emit as jasmine.Spy
    ).calls.mostRecent().args[0];
    expect(answers[0]).toEqual({
      question_id: 'q1',
      is_correct: false,
      selected_answer: '0',
    });
    expect(answers[1]).toEqual({
      question_id: 'q2',
      is_correct: false,
      selected_answer: 'a,c',
    });
    expect(answers[2]).toEqual({
      question_id: 'q3',
      is_correct: false,
      selected_answer: 'circle',
    });
  }));

  it('should omit selected_answer when answer is null', fakeAsync(() => {
    load();
    spyOn(component.assessmentSubmitted, 'emit');
    component.submitAssessment();
    const answers = (
      component.assessmentSubmitted.emit as jasmine.Spy
    ).calls.mostRecent().args[0];
    expect(answers[0]).toEqual({question_id: 'q1', is_correct: false});
    expect(answers[0].selected_answer).toBeUndefined();
  }));

  it('should use registry to resolve rules service', fakeAsync(() => {
    load();
    spyOn(component.assessmentSubmitted, 'emit');
    component.answers.q1 = 1;
    component.answers.q2 = ['a'];
    component.answers.q3 = 'x';
    component.submitAssessment();
    expect(registrySpy.getRulesServiceByInteractionId).toHaveBeenCalledWith(
      'MultipleChoiceInput'
    );
    expect(registrySpy.getRulesServiceByInteractionId).toHaveBeenCalledWith(
      'ItemSelectionInput'
    );
    expect(registrySpy.getRulesServiceByInteractionId).toHaveBeenCalledWith(
      'TextInput'
    );
  }));

  // ---- getAssessmentQuestionType ----

  it('should map all interaction types and default', async () => {
    const allTypes: [string, string][] = [
      ['MultipleChoiceInput', AssessmentQuestionTypes.MULTIPLE_CHOICE],
      ['ItemSelectionInput', AssessmentQuestionTypes.MULTIPLE_SELECT],
      ['TextInput', AssessmentQuestionTypes.TEXT_INPUT],
      ['NumericInput', AssessmentQuestionTypes.NUMERIC_INPUT],
      ['FractionInput', AssessmentQuestionTypes.FRACTION_INPUT],
      ['NumberWithUnits', AssessmentQuestionTypes.NUMBER_WITH_UNITS],
      ['DragAndDropSortInput', AssessmentQuestionTypes.DRAG_AND_DROP_SORT],
      ['ImageClickInput', AssessmentQuestionTypes.IMAGE_CLICK],
      ['UnknownType', AssessmentQuestionTypes.TEXT_INPUT],
    ];
    const ids = allTypes.map((_, i) => `t${i}`);
    await setup(makeAttempt(ids));
    apiSpy.getCertificateAssessmentQuestionAsync.and.callFake(
      (_a: string, qId: string) => {
        const idx = parseInt(qId.substring(1));
        return Promise.resolve(
          CertificateAssessmentQuestionData.createFromBackendDict({
            question_id: qId,
            question_state_data: stateDataFor(allTypes[idx][0]),
          })
        );
      }
    );
    fixture.detectChanges();
    await fixture.whenStable();
    for (let i = 1; i < allTypes.length; i++) {
      component.nextQuestion();
      await fixture.whenStable();
    }
    for (let i = 0; i < allTypes.length; i++) {
      expect(component.questions[i].type).toBe(allTypes[i][1]);
    }
  });
});
