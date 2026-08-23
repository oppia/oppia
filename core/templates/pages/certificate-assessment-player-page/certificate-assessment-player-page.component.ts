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
  OnChanges,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  SimpleChanges,
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
import {CertificateAssessmentPlayerPageConstants} from './certificate-assessment-player-page.constants';
import './certificate-assessment-player-page.component.css';

const MOBILE_SCREEN_BREAKPOINT = 480;

@Component({
  selector: 'certificate-assessment-player-page',
  templateUrl: './certificate-assessment-player-page.component.html',
  styleUrls: ['./certificate-assessment-player-page.component.css'],
})
export class CertificateAssessmentPlayerPageComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input() attempt: CertificateAssessmentAttemptData | null = null;
  @Input() classroomUrlFragment = '';
  @Input() isTimeExpired = false;
  @Output() assessmentSubmitted = new EventEmitter<
    SubmitCertificateAssessmentAnswerBackendDict[]
  >();
  @Output() viewResults = new EventEmitter<void>();
  @Output() assessmentEnded = new EventEmitter<void>();

  bannerTitleI18nKey = 'I18N_CERTIFICATE_ASSESSMENT';
  bannerButtonI18nKey = 'I18N_CERTIFICATE_ASSESSMENT_EXIT_BUTTON';

  // TODO(#24717-m2.18-m2.19): The showUnansweredQuestionModal flag is
  // currently initialized with a default value. Update this flag based on the
  // appropriate condition once the logic for determining when the modal should
  // be shown is implemented.
  showUnansweredQuestionModal = false;

  currentQuestionIndex = 0;
  questions: AssessmentQuestion[] = [];
  isLoadingQuestion = false;
  loadError = false;
  private inflightIndexes = new Set<number>();
  answers: {[questionId: string]: InteractionAnswer | null} = {};
  interactions: {[questionId: string]: Interaction} = {};
  interactionHtmls: {[questionId: string]: string} = {};
  focusLabel = '';
  currentQuestion: AssessmentQuestion | null = null;
  totalQuestionCount = 0;
  progressPercentage = 0;
  isLastQuestion = false;
  hasHandledTimeExpiry = false;
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
    this.handleSubmitFn = this.handleInteractionSubmit.bind(this);
  }

  ngOnInit(): void {
    this.currentInteractionService.setOnSubmitFn(this.handleSubmitFn);
    this.loadQuestion(0);
    this.refreshComputedFields();
    if (this.showUnansweredQuestionModal) {
      this.openUnansweredQuestionModal();
    }
    if (this.isTimeExpired) {
      this.handleTimeExpiry();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.isTimeExpired?.currentValue === true &&
      !changes.isTimeExpired?.previousValue
    ) {
      this.handleTimeExpiry();
    }
  }

  ngOnDestroy(): void {
    this.currentInteractionService.clearOnSubmitFn(this.handleSubmitFn);
  }

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
      const bottomSheetRef = this.bottomSheet.open(TimeExpiredModalComponent);
      bottomSheetRef.afterDismissed().subscribe(result => {
        if (
          result ===
          CertificateAssessmentPlayerPageConstants.VIEW_RESULTS_RESULT
        ) {
          this.viewResults.emit();
        } else {
          this.assessmentEnded.emit();
        }
      });
      return;
    }
    const modalRef = this.ngbModal.open(TimeExpiredModalComponent, {
      backdrop: 'static',
      centered: true,
      windowClass: 'oppia-time-expired-modal',
    });
    modalRef.result
      .then(result => {
        if (
          result ===
          CertificateAssessmentPlayerPageConstants.VIEW_RESULTS_RESULT
        ) {
          this.viewResults.emit();
        }
      })
      .catch(() => {
        this.assessmentEnded.emit();
      });
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

  private handleTimeExpiry(): void {
    if (this.hasHandledTimeExpiry) {
      return;
    }
    this.hasHandledTimeExpiry = true;
    this.openTimeExpiredModal();
    this.submitAssessment();
  }

  handleInteractionSubmit(answer: InteractionAnswer): void {
    const question = this.getCurrentQuestion();
    if (question === null) {
      return;
    }
    this.answers[question.id] = answer;
    this.refreshComputedFields();
  }

  getInteractionHtml(): string {
    const question = this.getCurrentQuestion();
    if (question === null) {
      return '';
    }
    return this.interactionHtmls[question.id] ?? '';
  }

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

  retryLoadQuestion(): void {
    this.loadQuestion(this.currentQuestionIndex);
  }

  private refreshComputedFields(): void {
    this.currentQuestion = this.getCurrentQuestion();
    this.totalQuestionCount = this.getTotalQuestionCount();
    this.progressPercentage = this.getProgressPercentage();
    this.isLastQuestion = this.isCurrentQuestionLast();
  }
}
