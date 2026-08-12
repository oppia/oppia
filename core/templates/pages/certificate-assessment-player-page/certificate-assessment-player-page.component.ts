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
  OnInit,
  Optional,
  Output,
} from '@angular/core';
import {MatBottomSheet} from '@angular/material/bottom-sheet';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {SubmitCertificateAssessmentAnswerBackendDict} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';
import {CertificateAssessmentOfferingBackendApiService} from 'domain/certificate-assessment/certificate-assessment-offering-backend-api.service';
import {CertificateAssessmentAttemptData} from 'domain/certificate-assessment/certificate-assessment-offering.model';
import {StateBackendDict} from 'domain/state/state.model';
import {SubtitledHtmlBackendDict} from 'domain/exploration/subtitled-html.model';
import {InteractionSpecsKey} from 'pages/interaction-specs.constants';
import {
  MultipleChoiceInputCustomizationArgsBackendDict,
  ItemSelectionInputCustomizationArgsBackendDict,
} from 'interactions/customization-args-defs';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {TimeExpiredModalComponent} from 'components/certificate-assessment-offering-helper/time-expired-modal.component';
import {UnansweredQuestionModalComponent} from 'components/certificate-assessment-offering-helper/unanswered-question-modal.component';
import './certificate-assessment-player-page.component.css';

const MOBILE_SCREEN_BREAKPOINT = 480;

export type AssessmentQuestionType =
  | 'multiple_choice'
  | 'multiple_select'
  | 'text_input'
  | 'numeric_input';

export interface AssessmentQuestionOption {
  id: string;
  text: string;
  // The index of the option in the question's stored choice list. This is
  // the value submitted for multiple-choice questions, so it is independent
  // of any on-screen reordering of the choices.
  index: number;
}

export interface AssessmentQuestion {
  id: string;
  type: AssessmentQuestionType;
  prompt: string;
  hint: string;
  options: AssessmentQuestionOption[];
  placeholder?: string;
  correctAnswerText: string;
  // The index of the correct choice, taken from the rule inputs. Only set
  // for multiple-choice questions, whose rule inputs store the correct
  // answer as the index of the choice.
  correctAnswerIndex?: number;
  // The content ids of the correct choices, taken from the rule inputs. Only
  // set for multiple-select questions, whose rule inputs store the correct
  // answers as the content ids of the choices.
  correctAnswerOptionIds?: string[];
}

@Component({
  selector: 'certificate-assessment-player-page',
  templateUrl: './certificate-assessment-player-page.component.html',
  styleUrls: ['./certificate-assessment-player-page.component.css'],
})
export class CertificateAssessmentPlayerPageComponent implements OnInit {
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
  // Answers keyed by question id; a null or missing value means the question
  // was not answered yet.
  answers: {[questionId: string]: string | null} = {};

  constructor(
    @Optional() private bottomSheet: MatBottomSheet,
    @Optional() private ngbModal: NgbModal,
    private windowDimensionsService: WindowDimensionsService,
    private certificateAssessmentOfferingBackendApiService: CertificateAssessmentOfferingBackendApiService
  ) {}

  ngOnInit(): void {
    this.loadQuestion(0);
    if (this.showTimeExpiredModal) {
      this.openTimeExpiredModal();
    }
    if (this.showUnansweredQuestionModal) {
      this.openUnansweredQuestionModal();
    }
  }

  /**
   * Fetches the question at the given index from the certificate question
   * handler and appends it to the questions list. Questions are fetched
   * lazily: only the current question is loaded, and the next question is
   * fetched when the learner advances to it.
   */
  private loadQuestion(index: number): void {
    if (this.attempt === null || this.questions.length > index) {
      return;
    }
    const attemptQuestion = this.attempt.questions[index];
    if (attemptQuestion === undefined) {
      return;
    }
    this.isLoadingQuestion = true;
    this.certificateAssessmentOfferingBackendApiService
      .getCertificateAssessmentQuestionAsync(
        this.attempt.attemptId,
        attemptQuestion.questionId
      )
      .then(response => {
        this.questions.push(
          this.convertStateDataToAssessmentQuestion(
            response.question_id,
            response.question_state_data
          )
        );
        this.isLoadingQuestion = false;
      })
      .catch(() => {
        this.isLoadingQuestion = false;
      });
  }

  /**
   * Converts the question state data returned by the certificate question
   * handler into the AssessmentQuestion shape rendered by the conversation
   * skin. The interaction fields and options are rendered based on the
   * interaction type of the question.
   */
  private convertStateDataToAssessmentQuestion(
    questionId: string,
    stateData: StateBackendDict
  ): AssessmentQuestion {
    const interaction = stateData.interaction;
    const type = this.getQuestionType(interaction.id);
    const options = this.extractOptions(interaction.customization_args);
    return {
      id: questionId,
      type,
      prompt: this.stripHtml(stateData.content.html),
      hint: '',
      options,
      placeholder: this.extractPlaceholder(interaction.customization_args),
      correctAnswerText: this.extractCorrectAnswerText(
        interaction.answer_groups,
        type,
        options
      ),
      correctAnswerIndex: this.extractCorrectAnswerIndex(
        interaction.answer_groups,
        type
      ),
      correctAnswerOptionIds: this.extractCorrectAnswerOptionIds(
        interaction.answer_groups,
        type
      ),
    };
  }

  private getQuestionType(
    interactionId: InteractionSpecsKey | null
  ): AssessmentQuestionType {
    switch (interactionId) {
      case 'MultipleChoiceInput':
        return 'multiple_choice';
      case 'ItemSelectionInput':
        return 'multiple_select';
      case 'TextInput':
        return 'text_input';
      case 'NumberWithUnits':
      case 'NumericInput':
        return 'numeric_input';
      default:
        return 'text_input';
    }
  }

  /**
   * Extracts the answer choices from the interaction customization args. The
   * choices are only present for choice-based interactions (multiple choice
   * and item selection).
   */
  private extractOptions(
    customizationArgs: StateBackendDict['interaction']['customization_args']
  ): AssessmentQuestionOption[] {
    const choices = (
      customizationArgs as
        | MultipleChoiceInputCustomizationArgsBackendDict
        | ItemSelectionInputCustomizationArgsBackendDict
    ).choices?.value;
    if (choices === undefined) {
      return [];
    }
    return (choices as SubtitledHtmlBackendDict[]).map((choice, index) => ({
      id: choice.content_id ?? `option_${index}`,
      text: this.stripHtml(choice.html),
      index,
    }));
  }

  /**
   * Extracts the input placeholder from the interaction customization args.
   * Only free-response interactions (text and number input) provide one.
   */
  private extractPlaceholder(
    customizationArgs: StateBackendDict['interaction']['customization_args']
  ): string {
    const placeholder = (
      customizationArgs as {
        placeholder?: {value: {content_id: string | null; unicode_str: string}};
      }
    ).placeholder?.value;
    return placeholder?.unicode_str ?? '';
  }

  /**
   * Derives the correct answer text from the first answer group's rule so the
   * learner's response can be compared against it when the assessment is
   * submitted. Returns an empty string if the correct answer cannot be
   * derived from the rule inputs.
   */
  private extractCorrectAnswerText(
    answerGroups: StateBackendDict['interaction']['answer_groups'],
    type: AssessmentQuestionType,
    options: AssessmentQuestionOption[]
  ): string {
    const firstRule = answerGroups[0]?.rule_specs[0];
    if (firstRule === undefined) {
      return '';
    }
    const xInput = firstRule.inputs.x;
    if (type === 'multiple_choice') {
      if (typeof xInput === 'number') {
        const correctOption = options[xInput];
        return correctOption === undefined ? '' : correctOption.text;
      }
      return '';
    }
    if (type === 'multiple_select') {
      if (Array.isArray(xInput)) {
        return (xInput as string[])
          .map(contentId => {
            const option = options.find(opt => opt.id === contentId);
            return option === undefined ? '' : option.text;
          })
          .join(', ');
      }
      return '';
    }
    if (type === 'text_input') {
      const normalizedStrSet = (xInput as {normalizedStrSet?: string[]})
        ?.normalizedStrSet;
      return normalizedStrSet?.[0] ?? '';
    }
    if (typeof xInput === 'number') {
      return String(xInput);
    }
    const fInput = firstRule.inputs.f as
      | {real?: number; numerator?: number; denominator?: number}
      | undefined;
    if (fInput?.real !== undefined) {
      return String(fInput.real);
    }
    if (fInput?.numerator !== undefined && fInput?.denominator !== undefined) {
      return String(fInput.numerator / fInput.denominator);
    }
    return '';
  }

  /**
   * Extracts the index of the correct choice from the first answer group's
   * rule for multiple-choice questions. Oppia's multiple-choice rule inputs
   * store the correct answer as the index of the choice, so the learner's
   * selected option index is compared directly against this value. Returns
   * undefined for other question types or when the index cannot be derived.
   */
  private extractCorrectAnswerIndex(
    answerGroups: StateBackendDict['interaction']['answer_groups'],
    type: AssessmentQuestionType
  ): number | undefined {
    if (type !== 'multiple_choice') {
      return undefined;
    }
    const xInput = answerGroups[0]?.rule_specs[0]?.inputs.x;
    return typeof xInput === 'number' ? xInput : undefined;
  }

  /**
   * Extracts the content ids of the correct choices from the first answer
   * group's rule for multiple-select questions. Oppia's item-selection rule
   * inputs store the correct answers as the content ids of the choices.
   * Returns undefined for other question types or when the content ids cannot
   * be derived.
   */
  private extractCorrectAnswerOptionIds(
    answerGroups: StateBackendDict['interaction']['answer_groups'],
    type: AssessmentQuestionType
  ): string[] | undefined {
    if (type !== 'multiple_select') {
      return undefined;
    }
    const xInput = answerGroups[0]?.rule_specs[0]?.inputs.x;
    return Array.isArray(xInput) ? (xInput as string[]) : undefined;
  }

  private stripHtml(html: string): string {
    const domParser = new DOMParser();
    const dom = domParser.parseFromString(html, 'text/html');
    return dom.querySelector('body')?.innerText || '';
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
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex === 0) {
      return;
    }
    this.currentQuestionIndex -= 1;
  }

  submitAssessment(): void {
    const answers = this.questions.map(question => {
      const selectedAnswer = this.answers[question.id] ?? null;
      const answerToSubmit =
        selectedAnswer === null
          ? ''
          : this.getAnswerToSubmit(question, selectedAnswer);
      return {
        question_id: question.id,
        is_correct:
          selectedAnswer !== null &&
          this.isResponseCorrect(question, selectedAnswer),
        ...(answerToSubmit !== '' ? {selected_answer: answerToSubmit} : {}),
      };
    });
    this.assessmentSubmitted.emit(answers);
  }

  /**
   * Returns the answer to store for the given question. Multiple-choice
   * answers are submitted as the index of the selected choice, matching
   * Oppia's multiple-choice answer format; all other answers are submitted
   * as-is.
   */
  private getAnswerToSubmit(
    question: AssessmentQuestion,
    selectedAnswer: string
  ): string {
    if (question.type !== 'multiple_choice') {
      return selectedAnswer;
    }
    const selectedOption = question.options.find(
      option => option.id === selectedAnswer
    );
    return selectedOption === undefined ? '' : String(selectedOption.index);
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

  getSavedResponse(): string {
    const question = this.getCurrentQuestion();
    if (question === null) {
      return '';
    }
    return this.answers[question.id] ?? '';
  }

  updateResponse(response: string): void {
    const question = this.getCurrentQuestion();
    if (question === null) {
      return;
    }
    this.answers[question.id] = response;
  }

  private isResponseCorrect(
    question: AssessmentQuestion,
    response: string
  ): boolean {
    if (question.type === 'multiple_choice') {
      const selectedOption = question.options.find(o => o.id === response);
      return (
        selectedOption !== undefined &&
        selectedOption.index === question.correctAnswerIndex
      );
    }
    if (question.type === 'multiple_select') {
      const selectedOptionIds = response.split(',').filter(Boolean);
      const correctOptionIds = question.correctAnswerOptionIds ?? [];
      return (
        selectedOptionIds.length === correctOptionIds.length &&
        selectedOptionIds.every(id => correctOptionIds.includes(id))
      );
    }
    return (
      response.trim().toLowerCase() ===
      question.correctAnswerText.trim().toLowerCase()
    );
  }
}
