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

// @ts-nocheck

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
import {CertificateAssessmentAttemptData} from 'domain/certificate-assessment/certificate-assessment.model';
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
import {UnansweredQuestionModalComponent} from 'components/certificate-assessment-offering-helper/unanswered-question-modal.component';
import {CertificateAssessmentPlayerPageComponent} from './certificate-assessment-player-page.component';
import {AlertsService} from 'services/alerts.service';
import {InternetConnectivityService} from 'services/internet-connectivity.service';
import {TranslateService} from '@ngx-translate/core';

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

const stateForQuestion = (questionId: string): StateBackendDict => {
  const interactionId =
    questionId === 'q1'
      ? 'MultipleChoiceInput'
      : questionId === 'q2'
        ? 'ItemSelectionInput'
        : 'TextInput';
  return stateDataFor(interactionId);
};

const makeAttempt = (
  ids: string[] = ['q1', 'q2', 'q3']
): CertificateAssessmentAttemptData =>
  CertificateAssessmentAttemptData.createFromBackendDict({
    attempt_id: 'att-1',
    questions: ids.map(questionId => ({
      question_id: questionId,
      question_version: 1,
      question_state_data: stateForQuestion(questionId),
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
        {
          provide: AlertsService,
          useValue: jasmine.createSpyObj('AlertsService', [
            'addWarning',
            'addInfoMessage',
          ]),
        },
        {
          provide: InternetConnectivityService,
          useValue: jasmine.createSpyObj('InternetConnectivityService', [
            'isOnline',
          ]),
        },
        {
          provide: TranslateService,
          useValue: jasmine.createSpyObj('TranslateService', ['instant']),
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
  });

  it('should register and clear its onSubmit callback on destroy', fakeAsync(() => {
    load();
    const registeredFn =
      currentInteractionServiceSpy.setOnSubmitFn.calls.mostRecent().args[0];
    expect(typeof registeredFn).toBe('function');

    fixture.destroy();
    expect(currentInteractionServiceSpy.clearOnSubmitFn).toHaveBeenCalledWith(
      registeredFn
    );
  }));

  it('should advance to next question', () => {
    component.nextQuestion();
    expect(component.currentQuestionIndex).toBe(1);
  });

  it('should not advance past last question', fakeAsync(() => {
    load();
    component.currentQuestionIndex = 2;
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

  it('should navigate directly to a specific question', fakeAsync(() => {
    load();
    component.navigateToQuestion(2);
    expect(component.currentQuestionIndex).toBe(2);
    expect(component.questionStatuses[2]).toBe('visited');
  }));

  it('should not navigate to invalid question index', fakeAsync(() => {
    load();
    component.navigateToQuestion(-1);
    expect(component.currentQuestionIndex).toBe(0);
    component.navigateToQuestion(10);
    expect(component.currentQuestionIndex).toBe(0);
  }));

  it('should return correct question indexes', fakeAsync(() => {
    load();
    expect(component.getQuestionIndexes()).toEqual([0, 1, 2]);
  }));

  it('should initialize all question statuses as unvisited', fakeAsync(() => {
    load();
    expect(component.questionStatuses[0]).toBe('visited');
    expect(component.questionStatuses[1]).toBe('unvisited');
    expect(component.questionStatuses[2]).toBe('unvisited');
  }));

  it('should mark question as attempted on answer submit', fakeAsync(() => {
    load();
    component.currentQuestionIndex = 0;
    component.handleInteractionSubmit(1);
    expect(component.questionStatuses[0]).toBe('attempted');
  }));

  it('should recompute derived fields on first load', fakeAsync(() => {
    expect(component.currentQuestion).toBeNull();
    load();
    expect(component.currentQuestion).toEqual(component.questions[0]);
    expect(component.totalQuestionCount).toBe(3);
    expect(component.questionStatuses[0]).toBe('visited');
    expect(component.isLastQuestion).toBe(false);
  }));

  it('should recompute derived fields when navigating', fakeAsync(() => {
    load();
    component.currentQuestionIndex = 0;
    component.nextQuestion();
    expect(component.isLastQuestion).toBe(false);
    expect(component.questionStatuses[0]).toBe('visited');
    expect(component.questionStatuses[1]).toBe('visited');
    component.nextQuestion();
    expect(component.isLastQuestion).toBe(true);
    expect(component.questionStatuses[2]).toBe('visited');
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

  it('should return question at current index', fakeAsync(() => {
    load();
    component.currentQuestionIndex = 1;
    expect(component.getCurrentQuestion()).toEqual(component.questions[1]);
  }));

  it('should open the unanswered-question modal as a bottom sheet on mobile screens', fakeAsync(() => {
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
  }));

  it('should report whether current question is last', fakeAsync(() => {
    load();
    component.currentQuestionIndex = 0;
    expect(component.isCurrentQuestionLast()).toBe(false);
    component.currentQuestionIndex = 2;
    expect(component.isCurrentQuestionLast()).toBe(true);
  }));

  it('should return empty indexes when no questions', async () => {
    await setup(null);
    fixture.detectChanges();
    expect(component.getQuestionIndexes()).toEqual([]);
  });

  it('should return indexes matching question count', fakeAsync(() => {
    load();
    expect(component.getQuestionIndexes()).toEqual([0, 1, 2]);
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
