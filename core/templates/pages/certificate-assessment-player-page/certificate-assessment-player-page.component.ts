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
 * @fileoverview Certificate assessment player page component.
 */

import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
} from '@angular/core';
import {MatBottomSheet} from '@angular/material/bottom-sheet';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {SubmitCertificateAssessmentAnswerBackendDict} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';
import {CertificateAssessmentOfferingBackendApiService} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';
import {
  AssessmentQuestion,
  CertificateAssessmentAttemptData,
  createAssessmentQuestionFromStateData,
} from 'domain/certificate-assessment/certificate-assessment.model';
import {StateBackendDict} from 'domain/state/state.model';
import {Interaction} from 'domain/exploration/interaction.model';
import {AnswerClassificationService} from 'pages/exploration-player-page/services/answer-classification.service';
import {
  CurrentInteractionService,
  OnSubmitFn,
} from 'pages/exploration-player-page/services/current-interaction.service';
import {InteractionRulesRegistryService} from 'services/interaction-rules-registry.service';
import {InteractionAnswer} from 'interactions/answer-defs';
import {ExplorationHtmlFormatterService} from 'services/exploration-html-formatter.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {TimeExpiredModalComponent} from 'components/certificate-assessment-offering-helper/time-expired-modal.component';
import {UnansweredQuestionModalComponent} from 'components/certificate-assessment-offering-helper/unanswered-question-modal.component';
import './certificate-assessment-player-page.component.css';

const MOBILE_SCREEN_BREAKPOINT = 480;

@Component({
  selector: 'certificate-assessment-player-page',
  templateUrl: './certificate-assessment-player-page.component.html',
  styleUrls: ['./certificate-assessment-player-page.component.css'],
})
export class CertificateAssessmentPlayerPageComponent
  implements OnInit, OnDestroy
{
  @Input() attempt: CertificateAssessmentAttemptData | null = null;
  @Input() classroomUrlFragment = '';
  @Output() assessmentSubmitted = new EventEmitter<
    SubmitCertificateAssessmentAnswerBackendDict[]
  >();

  bannerTitleI18nKey = 'I18N_CERTIFICATE_ASSESSMENT';
  bannerButtonI18nKey = 'I18N_CERTIFICATE_ASSESSMENT_EXIT_BUTTON';

  // TODO(#24717-m2.18-m2.19): The showTimeExpiredModal and
  // showUnansweredQuestionModal flags are currently initialized with default
  // values. Update these flags based on the appropriate conditions once the
  // logic for determining when the modals should be shown or hidden is
  // implemented.
  showUnansweredQuestionModal = false;
  showTimeExpiredModal = false;

  currentQuestionIndex = 0;
  questions: AssessmentQuestion[] = [];
  isLoadingQuestion = false;
  loadError = false;
  private inflightIndexes = new Set<number>();
  /** Answers keyed by question id; a null or missing value means the
   *  question was not answered yet. Values are InteractionAnswer typed to
   *  match what interaction components provide via CurrentInteractionService. */
  answers: {[questionId: string]: InteractionAnswer | null} = {};
  /** Pre-created Interaction objects keyed by question id, built from the
   *  state backend dict during loadQuestion(). */
  interactions: {[questionId: string]: Interaction} = {};
  /** Generated interaction HTML strings keyed by question id, produced by
   *  ExplorationHtmlFormatterService.getInteractionHtml(). */
  interactionHtmls: {[questionId: string]: string} = {};
  focusLabel = '';
  // Derived fields bound by the conversation skin template. They are
  // recomputed whenever the current question index or the answers change.
  currentQuestion: AssessmentQuestion | null = null;
  totalQuestionCount = 0;
  progressPercentage = 0;
  isLastQuestion = false;
  private handleSubmitFn: OnSubmitFn;

  constructor(
    @Optional() private bottomSheet: MatBottomSheet,
    @Optional() private ngbModal: NgbModal,
    private windowDimensionsService: WindowDimensionsService,
    private certificateAssessmentOfferingBackendApiService: CertificateAssessmentOfferingBackendApiService,
    private answerClassificationService: AnswerClassificationService,
    private currentInteractionService: CurrentInteractionService,
    private explorationHtmlFormatterService: ExplorationHtmlFormatterService,
    private focusManagerService: FocusManagerService,
    private interactionRulesRegistryService: InteractionRulesRegistryService
  ) {
    // Stored as a field so that the exact same bound function reference
    // can be cleared on destroy. Calling bind() inline would create a new
    // function each time, defeating identity-safe cleanup.
    this.handleSubmitFn = this.handleInteractionSubmit.bind(this);
  }

  ngOnInit(): void {
    this.currentInteractionService.setOnSubmitFn(this.handleSubmitFn);
    this.loadQuestion(0);
    this.refreshComputedFields();
    if (this.showTimeExpiredModal) {
      this.openTimeExpiredModal();
    }
    if (this.showUnansweredQuestionModal) {
      this.openUnansweredQuestionModal();
    }
  }

  ngOnDestroy(): void {
    this.currentInteractionService.clearOnSubmitFn(this.handleSubmitFn);
  }

  /**
   * Fetches the question at the given index from the certificate question
   * handler and stores it at that index in the questions array. Questions are
   * fetched lazily: only the current question is loaded, and the next question
   * is fetched when the learner advances to it. Duplicate and in-flight
   * requests for the same index are suppressed.
   */
  private loadQuestion(index: number): void {
    if (
      this.attempt === null ||
      this.questions[index] !== undefined ||
      this.inflightIndexes.has(index)
    ) {
      return;
    }
    const attemptQuestion = this.attempt.questions[index];
    if (attemptQuestion === undefined) {
      return;
    }
    this.inflightIndexes.add(index);
    this.isLoadingQuestion = true;
    this.loadError = false;
    this.certificateAssessmentOfferingBackendApiService
      .getCertificateAssessmentQuestionAsync(
        this.attempt.attemptId,
        attemptQuestion.questionId
      )
      .then(response => {
        this.buildQuestionFromStateData(
          index,
          response.questionId,
          response.questionStateData
        );
        this.loadError = false;
        this.refreshComputedFields();
      })
      .catch(() => {
        this.loadError = true;
      })
      .finally(() => {
        this.isLoadingQuestion = false;
        this.inflightIndexes.delete(index);
      });
  }

  /**
   * Builds an AssessmentQuestion from the state data returned by the
   * certificate question handler, and pre-creates the Interaction object
   * and interaction HTML needed for rendering via oppia-interaction-display.
   */
  private buildQuestionFromStateData(
    index: number,
    questionId: string,
    stateData: StateBackendDict
  ): void {
    const interaction = Interaction.createFromBackendDict(
      stateData.interaction
    );
    this.interactions[questionId] = interaction;

    this.focusLabel = this.focusManagerService.generateFocusLabel();
    const interactionId = interaction.id as string;
    this.interactionHtmls[questionId] =
      this.explorationHtmlFormatterService.getInteractionHtml(
        interactionId,
        interaction.customizationArgs,
        true,
        this.focusLabel,
        null
      );

    this.questions[index] = createAssessmentQuestionFromStateData(
      questionId,
      stateData
    );
  }

  private isMobileScreenSize(): boolean {
    return this.windowDimensionsService.getWidth() < MOBILE_SCREEN_BREAKPOINT;
  }

  openTimeExpiredModal(): void {
    if (this.isMobileScreenSize()) {
      this.bottomSheet.open(TimeExpiredModalComponent);
      return;
    }
    const modalRef = this.ngbModal.open(TimeExpiredModalComponent, {
      backdrop: 'static',
      centered: true,
      windowClass: 'oppia-time-expired-modal',
    });
    // TODO(#24717-m2.19): Wire the viewResult and dismiss actions once the
    // backend is integrated.
    modalRef.result.catch(() => null);
  }

  openUnansweredQuestionModal(): void {
    if (this.isMobileScreenSize()) {
      this.bottomSheet.open(UnansweredQuestionModalComponent);
      return;
    }
    const modalRef = this.ngbModal.open(UnansweredQuestionModalComponent, {
      backdrop: 'static',
      centered: true,
      windowClass: 'oppia-unanswered-question-modal',
    });
    // The unanswered-question count is mocked until the backend is integrated.
    modalRef.componentInstance.unansweredQuestionCount = 3;
    // TODO(#24717-m2.19): Wire the submitAnyway and goBackToAssessment actions
    // once the backend is integrated.
    modalRef.result.catch(() => null);
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex >= this.getTotalQuestionCount() - 1) {
      return;
    }
    this.currentQuestionIndex += 1;
    this.loadQuestion(this.currentQuestionIndex);
    this.refreshComputedFields();
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex === 0) {
      return;
    }
    this.currentQuestionIndex -= 1;
    this.refreshComputedFields();
  }

  submitAssessment(): void {
    const loadedQuestions = this.questions.filter(
      (question): question is AssessmentQuestion => question !== undefined
    );
    const answers = loadedQuestions.map(question => {
      const answer = this.answers[question.id] ?? null;
      let isCorrect = false;
      if (answer !== null) {
        const interaction = this.interactions[question.id];
        const rulesService =
          this.interactionRulesRegistryService.getRulesServiceByInteractionId(
            interaction.id as string
          );
        const result =
          this.answerClassificationService.getMatchingClassificationResult(
            question.id,
            interaction,
            answer,
            rulesService
          );
        isCorrect = result.outcome.labelledAsCorrect;
      }
      const selectedAnswer =
        answer !== null ? this.formatAnswerForBackend(answer) : undefined;
      return {
        question_id: question.id,
        is_correct: isCorrect,
        ...(selectedAnswer !== undefined
          ? {selected_answer: selectedAnswer}
          : {}),
      };
    });
    this.assessmentSubmitted.emit(answers);
  }

  /**
   * Called when the interaction component submits an answer via
   * CurrentInteractionService.onSubmit → onSubmitFn. Stores the typed
   * answer only; navigation is triggered separately by the Next / Submit
   * Assessment buttons in the conversation skin.
   */
  handleInteractionSubmit(answer: InteractionAnswer): void {
    const question = this.getCurrentQuestion();
    if (question === null) {
      return;
    }
    this.answers[question.id] = answer;
    this.refreshComputedFields();
  }

  /**
   * Returns the interaction HTML string for the current question, suitable
   * for rendering via oppia-interaction-display.
   */
  getInteractionHtml(): string {
    const question = this.getCurrentQuestion();
    if (question === null) {
      return '';
    }
    return this.interactionHtmls[question.id] ?? '';
  }

  /**
   * Returns the last answer submitted for the current question. This is
   * passed to the interaction component via parentScope so that the
   * interaction can restore the previous answer on re-render (e.g. when
   * the learner navigates back).
   */
  getLastAnswer(): InteractionAnswer | null {
    const question = this.getCurrentQuestion();
    if (question === null) {
      return null;
    }
    return this.answers[question.id] ?? null;
  }

  /**
   * Converts a typed InteractionAnswer into the string format expected by
   * the backend submission payload.
   */
  private formatAnswerForBackend(answer: InteractionAnswer): string {
    if (typeof answer === 'string') {
      return answer;
    }
    return JSON.stringify(answer);
  }

  getProgressPercentage(): number {
    if (this.getTotalQuestionCount() === 0) {
      return 0;
    }
    return Math.round(
      ((this.currentQuestionIndex + 1) / this.getTotalQuestionCount()) * 100
    );
  }

  getCurrentQuestion(): AssessmentQuestion | null {
    if (this.questions.length === 0) {
      return null;
    }
    return this.questions[this.currentQuestionIndex] ?? null;
  }

  isCurrentQuestionLast(): boolean {
    return (
      this.getTotalQuestionCount() > 0 &&
      this.currentQuestionIndex === this.getTotalQuestionCount() - 1
    );
  }

  private getTotalQuestionCount(): number {
    return this.attempt?.questions.length ?? this.questions.length;
  }

  /** Retries loading the question at the current index after a failure.
   *  Guards in loadQuestion prevent duplicate or in-flight requests, so this
   *  is safe to call repeatedly. */
  retryLoadQuestion(): void {
    this.loadQuestion(this.currentQuestionIndex);
  }

  /**
   * Recomputes the derived fields bound by the conversation skin template
   * from the current question, attempt, and answers. This keeps the template
   * bindings in sync whenever the current question index or answers change.
   */
  private refreshComputedFields(): void {
    this.currentQuestion = this.getCurrentQuestion();
    this.totalQuestionCount = this.getTotalQuestionCount();
    this.progressPercentage = this.getProgressPercentage();
    this.isLastQuestion = this.isCurrentQuestionLast();
  }
}
