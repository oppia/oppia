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
import {of} from 'rxjs';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {CertificateAssessmentOfferingBackendApiService} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';
import {
  CertificateAssessmentAttemptData,
  CertificateAssessmentQuestionData,
} from 'domain/certificate-assessment/certificate-assessment.model';
import {AnswerClassificationResult} from 'domain/classifier/answer-classification-result.model';
import {Outcome, OutcomeBackendDict} from 'domain/exploration/outcome.model';
import {StateBackendDict} from 'domain/state/state.model';
import {InteractionAnswer} from 'interactions/answer-defs';
import {InteractionCustomizationArgsBackendDict} from 'interactions/customization-args-defs';
import {AnswerClassificationService} from 'pages/exploration-player-page/services/answer-classification.service';
import {CurrentInteractionService} from 'pages/exploration-player-page/services/current-interaction.service';
import {ExplorationHtmlFormatterService} from 'services/exploration-html-formatter.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {InteractionRulesRegistryService} from 'services/interaction-rules-registry.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {TimeExpiredModalComponent} from 'components/certificate-assessment-offering-helper/time-expired-modal.component';
import {UnansweredQuestionModalComponent} from 'components/certificate-assessment-offering-helper/unanswered-question-modal.component';
import {CertificateAssessmentPlayerPageComponent} from './certificate-assessment-player-page.component';
import {CertificateAssessmentPlayerPageConstants} from './certificate-assessment-player-page.constants';

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
): InteractionCustomizationArgsBackendDict => {
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
    id: id as StateBackendDict['interaction']['id'],
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

const modalRef = (
  reject = false,
  resolveValue: string | null = null
): NgbModalRef =>
  ({
    componentInstance: {} as Record<string, unknown>,
    result: reject
      ? Promise.reject('dismissed')
      : Promise.resolve(resolveValue),
    close: () => {},
    dismiss: () => {},
  }) as NgbModalRef;

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
  let currentInteractionServiceSpy: jasmine.SpyObj<CurrentInteractionService>;

  const setup = async (
    attempt: CertificateAssessmentAttemptData | null = makeAttempt()
  ): Promise<void> => {
    bottomSheetSpy = jasmine.createSpyObj('MatBottomSheet', ['open']);
    bottomSheetSpy.open.and.returnValue({
      afterDismissed: () => of(null),
    });
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
      Equals: (
        answer: InteractionAnswer,
        ruleInputs: {x: InteractionAnswer}
      ) => {
        if (Array.isArray(answer) && Array.isArray(ruleInputs.x)) {
          const answerArray = answer as InteractionAnswer[];
          const xArray = ruleInputs.x as InteractionAnswer[];
          return (
            answerArray.length === xArray.length &&
            answerArray.every((v, i) => v === xArray[i])
          );
        }
        return answer === ruleInputs.x;
      },
    });
    classificationSpy = jasmine.createSpyObj('Classification', [
      'getMatchingClassificationResult',
    ]);
    classificationSpy.getMatchingClassificationResult.and.returnValue(
      new AnswerClassificationResult(
        Outcome.createFromBackendDict(outcome(false)),
        0,
        0,
        'default_outcome'
      )
    );
    formatterSpy = jasmine.createSpyObj('Formatter', ['getInteractionHtml']);
    formatterSpy.getInteractionHtml.and.returnValue('<div>interaction</div>');
    currentInteractionServiceSpy = jasmine.createSpyObj('CurrentInteraction', [
      'setOnSubmitFn',
      'clearOnSubmitFn',
    ]);

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      declarations: [
        CertificateAssessmentPlayerPageComponent,
        MockTranslatePipe,
      ],
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
          useValue: currentInteractionServiceSpy,
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

  const triggerTimeExpiry = (): void => {
    component.isTimeExpired = true;
    component.ngOnChanges({
      isTimeExpired: {
        currentValue: true,
        previousValue: false,
        firstChange: true,
        isFirstChange: () => true,
      },
    });
  };

  beforeEach(async () => {
    await setup();
  });

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

  it('should register and clear its onSubmit callback on destroy', fakeAsync(() => {
    loadQ1();
    const registeredFn =
      currentInteractionServiceSpy.setOnSubmitFn.calls.mostRecent().args[0];
    expect(typeof registeredFn).toBe('function');

    fixture.destroy();
    expect(currentInteractionServiceSpy.clearOnSubmitFn).toHaveBeenCalledWith(
      registeredFn
    );
  }));

  it('should not load when attempt question index is out of range', fakeAsync(() => {
    loadQ1();
    (
      component as unknown as {loadQuestion: (index: number) => void}
    ).loadQuestion(99);
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
    expect(component.isLoadingQuestion).toBe(true);
    (
      component as unknown as {loadQuestion: (index: number) => void}
    ).loadQuestion(0);
    expect(apiSpy.getCertificateAssessmentQuestionAsync).toHaveBeenCalledTimes(
      1
    );
    resolve(questionResponse('q1'));
    flushMicrotasks();
    expect(component.isLoadingQuestion).toBe(false);
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
    expect(component.loadError).toBe(true);
    apiSpy.getCertificateAssessmentQuestionAsync.and.returnValue(
      Promise.resolve(questionResponse('q1'))
    );
    (
      component as unknown as {loadQuestion: (index: number) => void}
    ).loadQuestion(0);
    flushMicrotasks();
    expect(component.loadError).toBe(false);
  }));

  it('should retry loading the current question after a failure', fakeAsync(() => {
    apiSpy.getCertificateAssessmentQuestionAsync.and.returnValue(
      Promise.reject(new Error('err'))
    );
    loadQ1();
    expect(component.loadError).toBe(true);
    apiSpy.getCertificateAssessmentQuestionAsync.and.returnValue(
      Promise.resolve(questionResponse('q1'))
    );

    component.retryLoadQuestion();
    flushMicrotasks();

    expect(component.loadError).toBe(false);
    expect(component.currentQuestion).not.toBeNull();
    expect(apiSpy.getCertificateAssessmentQuestionAsync).toHaveBeenCalledTimes(
      2
    );
  }));

  it('should not reload already loaded question', fakeAsync(() => {
    load();
    const count = apiSpy.getCertificateAssessmentQuestionAsync.calls.count();
    (
      component as unknown as {loadQuestion: (index: number) => void}
    ).loadQuestion(0);
    expect(apiSpy.getCertificateAssessmentQuestionAsync.calls.count()).toBe(
      count
    );
  }));

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

  it('should recompute derived fields on first load', fakeAsync(() => {
    expect(component.currentQuestion).toBeNull();
    loadQ1();
    expect(component.currentQuestion).toEqual(component.questions[0]);
    expect(component.totalQuestionCount).toBe(3);
    expect(component.progressPercentage).toBe(Math.round((1 / 3) * 100));
    expect(component.isLastQuestion).toBe(false);
  }));

  it('should recompute derived fields when navigating', fakeAsync(() => {
    load();
    component.currentQuestionIndex = 0;
    component.nextQuestion();
    expect(component.isLastQuestion).toBe(false);
    component.nextQuestion();
    expect(component.isLastQuestion).toBe(true);
    expect(component.progressPercentage).toBe(100);
    component.previousQuestion();
    expect(component.isLastQuestion).toBe(false);
  }));

  it('should store answer via handleInteractionSubmit', fakeAsync(() => {
    load();
    component.currentQuestionIndex = 0;
    component.handleInteractionSubmit(1);
    expect(component.answers.q1).toBe(1);
  }));

  it('should not throw when no question loaded', () => {
    expect(() => component.handleInteractionSubmit(1)).not.toThrowError();
  });

  it('should return empty when no question loaded', () => {
    expect(component.getInteractionHtml()).toBe('');
  });

  it('should return html for loaded question', fakeAsync(() => {
    load();
    expect(component.getInteractionHtml()).toBe('<div>interaction</div>');
  }));

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

  it('should report whether current question is last', fakeAsync(() => {
    load();
    component.currentQuestionIndex = 0;
    expect(component.isCurrentQuestionLast()).toBe(false);
    component.currentQuestionIndex = 2;
    expect(component.isCurrentQuestionLast()).toBe(true);
  }));

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

  it('should open time-expired modal on desktop when time expires', fakeAsync(() => {
    loadQ1();
    spyOn(component.assessmentSubmitted, 'emit');
    triggerTimeExpiry();
    expect(modalSpy.open).toHaveBeenCalledWith(TimeExpiredModalComponent, {
      backdrop: 'static',
      centered: true,
      windowClass: 'oppia-time-expired-modal',
    });
  }));

  it('should open time-expired modal as bottom sheet on mobile when time expires', fakeAsync(() => {
    loadQ1();
    dimsSpy.getWidth.and.returnValue(400);
    spyOn(component.assessmentSubmitted, 'emit');
    triggerTimeExpiry();
    expect(bottomSheetSpy.open).toHaveBeenCalledWith(TimeExpiredModalComponent);
  }));

  it('should auto-submit the current answers when time expires', fakeAsync(() => {
    load();
    spyOn(component.assessmentSubmitted, 'emit');
    component.answers.q1 = 1;
    component.answers.q2 = ['a', 'b', 'd'];
    triggerTimeExpiry();
    expect(component.assessmentSubmitted.emit).toHaveBeenCalledWith([
      {question_id: 'q1', is_correct: false, selected_answer: '1'},
      {question_id: 'q2', is_correct: false, selected_answer: '["a","b","d"]'},
      {question_id: 'q3', is_correct: false},
    ]);
  }));

  it('should not handle time expiry more than once', fakeAsync(() => {
    loadQ1();
    spyOn(component.assessmentSubmitted, 'emit');
    triggerTimeExpiry();
    component.isTimeExpired = true;
    component.ngOnInit();
    expect(component.assessmentSubmitted.emit).toHaveBeenCalledTimes(1);
    expect(modalSpy.open).toHaveBeenCalledTimes(1);
  }));

  it('should not handle time expiry when the flag has not become true', fakeAsync(() => {
    loadQ1();
    component.ngOnChanges({});
    expect(modalSpy.open).not.toHaveBeenCalled();
  }));

  it('should not handle time expiry again while the flag stays true', fakeAsync(() => {
    loadQ1();
    triggerTimeExpiry();
    expect(modalSpy.open).toHaveBeenCalledTimes(1);

    component.ngOnChanges({
      isTimeExpired: {
        currentValue: true,
        previousValue: true,
        firstChange: false,
        isFirstChange: () => false,
      },
    });
    expect(modalSpy.open).toHaveBeenCalledTimes(1);
  }));

  it('should take no action when the desktop time-expired modal resolves without view-results', fakeAsync(() => {
    loadQ1();
    spyOn(component.viewResults, 'emit');
    spyOn(component.assessmentEnded, 'emit');
    modalSpy.open.and.returnValue(modalRef(false, null));
    triggerTimeExpiry();
    flushMicrotasks();

    expect(component.viewResults.emit).not.toHaveBeenCalled();
    expect(component.assessmentEnded.emit).not.toHaveBeenCalled();
  }));

  it('should handle time expiry on init when already expired', fakeAsync(() => {
    loadQ1();
    component.isTimeExpired = true;
    spyOn(component.assessmentSubmitted, 'emit');
    component.ngOnInit();
    expect(component.assessmentSubmitted.emit).toHaveBeenCalled();
    expect(modalSpy.open).toHaveBeenCalledWith(TimeExpiredModalComponent, {
      backdrop: 'static',
      centered: true,
      windowClass: 'oppia-time-expired-modal',
    });
  }));

  it('should submit and emit view results when time expires and the modal closes with view-results', fakeAsync(() => {
    loadQ1();
    spyOn(component.assessmentSubmitted, 'emit');
    spyOn(component.viewResults, 'emit');
    modalSpy.open.and.returnValue(
      modalRef(
        false,
        CertificateAssessmentPlayerPageConstants.VIEW_RESULTS_RESULT
      )
    );
    triggerTimeExpiry();
    flushMicrotasks();

    expect(component.assessmentSubmitted.emit).toHaveBeenCalled();
    expect(component.viewResults.emit).toHaveBeenCalled();
  }));

  it('should emit assessment ended when the time-expired modal is dismissed', fakeAsync(() => {
    loadQ1();
    spyOn(component.assessmentEnded, 'emit');
    spyOn(component.viewResults, 'emit');
    modalSpy.open.and.returnValue(modalRef(true));
    triggerTimeExpiry();
    flushMicrotasks();

    expect(component.viewResults.emit).not.toHaveBeenCalled();
    expect(component.assessmentEnded.emit).toHaveBeenCalled();
  }));

  it('should emit view results when the time-expired bottom sheet is dismissed with view-results', fakeAsync(() => {
    loadQ1();
    dimsSpy.getWidth.and.returnValue(400);
    spyOn(component.viewResults, 'emit');
    spyOn(component.assessmentEnded, 'emit');
    bottomSheetSpy.open.and.returnValue({
      afterDismissed: () =>
        of(CertificateAssessmentPlayerPageConstants.VIEW_RESULTS_RESULT),
    });
    triggerTimeExpiry();
    flushMicrotasks();

    expect(component.viewResults.emit).toHaveBeenCalled();
    expect(component.assessmentEnded.emit).not.toHaveBeenCalled();
  }));

  it('should emit assessment ended when the time-expired bottom sheet is dismissed', fakeAsync(() => {
    loadQ1();
    dimsSpy.getWidth.and.returnValue(400);
    spyOn(component.assessmentEnded, 'emit');
    spyOn(component.viewResults, 'emit');
    bottomSheetSpy.open.and.returnValue({
      afterDismissed: () => of(null),
    });
    triggerTimeExpiry();
    flushMicrotasks();

    expect(component.viewResults.emit).not.toHaveBeenCalled();
    expect(component.assessmentEnded.emit).toHaveBeenCalled();
  }));

  it('should not open any modal when the flag is false', fakeAsync(() => {
    loadQ1();
    modalSpy.open.calls.reset();
    component.ngOnInit();
    expect(modalSpy.open).not.toHaveBeenCalled();
  }));

  it('should emit answers directly when all questions are answered', fakeAsync(() => {
    load();
    spyOn(component.assessmentSubmitted, 'emit');
    component.answers.q1 = 1;
    component.answers.q2 = ['a', 'b', 'd'];
    component.answers.q3 = 'circle';
    component.submitAssessment();
    expect(modalSpy.open).not.toHaveBeenCalled();
    expect(component.assessmentSubmitted.emit).toHaveBeenCalledWith([
      {question_id: 'q1', is_correct: false, selected_answer: '1'},
      {question_id: 'q2', is_correct: false, selected_answer: '["a","b","d"]'},
      {question_id: 'q3', is_correct: false, selected_answer: 'circle'},
    ]);
  }));

  it('should open unanswered-question modal with the unanswered count on desktop', fakeAsync(() => {
    load();
    spyOn(component.assessmentSubmitted, 'emit');
    const ref = modalRef();
    modalSpy.open.and.returnValue(ref);
    component.answers.q1 = 1;
    component.submitAssessment();
    expect(modalSpy.open).toHaveBeenCalledWith(
      UnansweredQuestionModalComponent,
      {
        backdrop: 'static',
        centered: true,
        windowClass: 'oppia-unanswered-question-modal',
      }
    );
    expect(ref.componentInstance.unansweredQuestionCount).toBe(2);
    expect(component.assessmentSubmitted.emit).not.toHaveBeenCalled();
  }));

  it('should return to the last unanswered question when the modal is dismissed', fakeAsync(() => {
    load();
    spyOn(component.assessmentSubmitted, 'emit');
    modalSpy.open.and.returnValue(modalRef(true));
    component.currentQuestionIndex = 0;
    component.answers.q1 = 1;
    component.submitAssessment();
    flushMicrotasks();
    expect(component.assessmentSubmitted.emit).not.toHaveBeenCalled();
    expect(component.currentQuestionIndex).toBe(2);
  }));

  it('should return to the correct question when an intermediate question failed to load', fakeAsync(() => {
    apiSpy.getCertificateAssessmentQuestionAsync.and.callFake(
      (_attemptId: string, questionId: string) => {
        if (questionId === 'q2') {
          return Promise.reject(new Error('load failed'));
        }
        return Promise.resolve(questionResponse(questionId));
      }
    );
    load();
    spyOn(component.assessmentSubmitted, 'emit');
    const ref = modalRef();
    modalSpy.open.and.returnValue(ref);
    component.answers.q1 = 1;
    component.submitAssessment();
    flushMicrotasks();
    // Only q3 is loaded but unanswered, and its index within this.questions
    // must be preserved even though it is first in the filtered list.
    expect(ref.componentInstance.unansweredQuestionCount).toBe(1);
    expect(component.currentQuestionIndex).toBe(2);
  }));

  it('should emit answers when submit anyway is confirmed', fakeAsync(() => {
    load();
    spyOn(component.assessmentSubmitted, 'emit');
    modalSpy.open.and.returnValue(modalRef(false, 'submit-anyway'));
    component.answers.q1 = 1;
    component.submitAssessment();
    flushMicrotasks();
    expect(component.assessmentSubmitted.emit).toHaveBeenCalledWith([
      {question_id: 'q1', is_correct: false, selected_answer: '1'},
      {question_id: 'q2', is_correct: false},
      {question_id: 'q3', is_correct: false},
    ]);
  }));

  it('should open unanswered-question modal as bottom sheet on mobile', fakeAsync(() => {
    load();
    dimsSpy.getWidth.and.returnValue(400);
    const ref = {
      instance: {} as Record<string, unknown>,
      afterDismissed: () => of(null),
    };
    bottomSheetSpy.open.and.returnValue(ref);
    component.answers.q1 = 1;
    component.submitAssessment();
    expect(bottomSheetSpy.open).toHaveBeenCalledWith(
      UnansweredQuestionModalComponent
    );
    expect(ref.instance.unansweredQuestionCount).toBe(2);
  }));

  it('should emit answers when the bottom sheet is dismissed with submit-anyway', fakeAsync(() => {
    load();
    spyOn(component.assessmentSubmitted, 'emit');
    dimsSpy.getWidth.and.returnValue(400);
    bottomSheetSpy.open.and.returnValue({
      instance: {} as Record<string, unknown>,
      afterDismissed: () => of('submit-anyway'),
    });
    component.answers.q1 = 1;
    component.submitAssessment();
    flushMicrotasks();
    expect(component.assessmentSubmitted.emit).toHaveBeenCalled();
  }));

  it('should return to the last unanswered question when the bottom sheet is dismissed', fakeAsync(() => {
    load();
    dimsSpy.getWidth.and.returnValue(400);
    bottomSheetSpy.open.and.returnValue({
      instance: {} as Record<string, unknown>,
      afterDismissed: () => of(null),
    });
    component.currentQuestionIndex = 0;
    component.answers.q1 = 1;
    component.submitAssessment();
    flushMicrotasks();
    expect(component.currentQuestionIndex).toBe(2);
  }));

  it('should emit correct answers on submit', fakeAsync(() => {
    load();
    spyOn(component.assessmentSubmitted, 'emit');
    classificationSpy.getMatchingClassificationResult.and.returnValue(
      new AnswerClassificationResult(
        Outcome.createFromBackendDict(outcome(true)),
        0,
        0,
        'explicit'
      )
    );
    component.answers.q1 = 1;
    component.answers.q2 = ['a', 'b', 'd'];
    component.answers.q3 = 'circle';
    component.submitAssessment();
    expect(component.assessmentSubmitted.emit).toHaveBeenCalledWith([
      {question_id: 'q1', is_correct: true, selected_answer: '1'},
      {question_id: 'q2', is_correct: true, selected_answer: '["a","b","d"]'},
      {question_id: 'q3', is_correct: true, selected_answer: 'circle'},
    ]);
  }));

  it('should skip unloaded questions when submitting', fakeAsync(() => {
    apiSpy.getCertificateAssessmentQuestionAsync.and.callFake(
      (_attemptId: string, questionId: string) => {
        if (questionId === 'q2') {
          return Promise.reject(new Error('load failed'));
        }
        return Promise.resolve(questionResponse(questionId));
      }
    );
    load();
    spyOn(component.assessmentSubmitted, 'emit');
    component.answers.q1 = 1;
    component.answers.q3 = 'circle';
    component.submitAssessment();
    expect(component.assessmentSubmitted.emit).toHaveBeenCalledWith([
      {question_id: 'q1', is_correct: false, selected_answer: '1'},
      {question_id: 'q3', is_correct: false, selected_answer: 'circle'},
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
      selected_answer: '["a","c"]',
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
    modalSpy.open.and.returnValue(modalRef(false, 'submit-anyway'));
    component.submitAssessment();
    flushMicrotasks();
    const answers = (
      component.assessmentSubmitted.emit as jasmine.Spy
    ).calls.mostRecent().args[0];
    expect(answers[0]).toEqual({question_id: 'q1', is_correct: false});
    expect(answers[0].selected_answer).toBeUndefined();
  }));

  it('should preserve structured answers when formatting for backend', () => {
    const formatAnswerForBackend = (
      component as unknown as {
        formatAnswerForBackend: (answer: InteractionAnswer) => string;
      }
    ).formatAnswerForBackend;

    expect(
      formatAnswerForBackend({
        isNegative: false,
        wholeNumber: 3,
        numerator: 1,
        denominator: 2,
      })
    ).toBe(
      JSON.stringify({
        isNegative: false,
        wholeNumber: 3,
        numerator: 1,
        denominator: 2,
      })
    );
    expect(
      formatAnswerForBackend({
        type: 'proper',
        real: 4,
        fraction: {
          isNegative: false,
          wholeNumber: 0,
          numerator: 1,
          denominator: 4,
        },
        units: [
          {unit: 'm', exponent: 1},
          {unit: 's', exponent: -1},
        ],
      })
    ).toBe(
      JSON.stringify({
        type: 'proper',
        real: 4,
        fraction: {
          isNegative: false,
          wholeNumber: 0,
          numerator: 1,
          denominator: 4,
        },
        units: [
          {unit: 'm', exponent: 1},
          {unit: 's', exponent: -1},
        ],
      })
    );
    expect(
      formatAnswerForBackend([
        ['left-1', 'right-1'],
        ['left-2', 'right-2'],
      ])
    ).toBe(
      JSON.stringify([
        ['left-1', 'right-1'],
        ['left-2', 'right-2'],
      ])
    );
    expect(
      formatAnswerForBackend({
        clickPosition: [12, 34],
        clickedRegions: ['region-1', 'region-2'],
      })
    ).toBe(
      JSON.stringify({
        clickPosition: [12, 34],
        clickedRegions: ['region-1', 'region-2'],
      })
    );
  });

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
});
