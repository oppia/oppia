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
import {
  CertificateAssessmentAttemptData,
  AssessmentQuestion,
  AssessmentQuestionOption,
  AssessmentQuestionType,
} from 'domain/certificate-assessment/certificate-assessment.model';
import {State, StateBackendDict} from 'domain/state/state.model';
import {SubtitledHtmlBackendDict} from 'domain/exploration/subtitled-html.model';
import {InteractionSpecsKey} from 'pages/interaction-specs.constants';
import {
  MultipleChoiceInputCustomizationArgsBackendDict,
  ItemSelectionInputCustomizationArgsBackendDict,
} from 'interactions/customization-args-defs';
import {AnswerClassificationService} from 'pages/exploration-player-page/services/answer-classification.service';
import {InteractionAnswer} from 'interactions/answer-defs';
import {MultipleChoiceInputRulesService} from 'interactions/MultipleChoiceInput/directives/multiple-choice-input-rules.service';
import {ItemSelectionInputRulesService} from 'interactions/ItemSelectionInput/directives/item-selection-input-rules.service';
import {TextInputRulesService} from 'interactions/TextInput/directives/text-input-rules.service';
import {NumericInputRulesService} from 'interactions/NumericInput/directives/numeric-input-rules.service';
import {FractionInputRulesService} from 'interactions/FractionInput/directives/fraction-input-rules.service';
import {NumberWithUnitsRulesService} from 'interactions/NumberWithUnits/directives/number-with-units-rules.service';
import {DragAndDropSortInputRulesService} from 'interactions/DragAndDropSortInput/directives/drag-and-drop-sort-input-rules.service';
import {ImageClickInputRulesService} from 'interactions/ImageClickInput/directives/image-click-input-rules.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {TimeExpiredModalComponent} from 'components/certificate-assessment-offering-helper/time-expired-modal.component';
import {UnansweredQuestionModalComponent} from 'components/certificate-assessment-offering-helper/unanswered-question-modal.component';
import './certificate-assessment-player-page.component.css';

const MOBILE_SCREEN_BREAKPOINT = 480;

const INTERACTION_ID_MULTIPLE_CHOICE =
  'MultipleChoiceInput' as InteractionSpecsKey;
const INTERACTION_ID_ITEM_SELECTION =
  'ItemSelectionInput' as InteractionSpecsKey;
const INTERACTION_ID_TEXT_INPUT = 'TextInput' as InteractionSpecsKey;
const INTERACTION_ID_NUMERIC_INPUT = 'NumericInput' as InteractionSpecsKey;
const INTERACTION_ID_FRACTION_INPUT = 'FractionInput' as InteractionSpecsKey;
const INTERACTION_ID_NUMBER_WITH_UNITS =
  'NumberWithUnits' as InteractionSpecsKey;
const INTERACTION_ID_DRAG_AND_DROP_SORT =
  'DragAndDropSortInput' as InteractionSpecsKey;
const INTERACTION_ID_IMAGE_CLICK = 'ImageClickInput' as InteractionSpecsKey;

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
  loadError = false;
  private inflightIndexes = new Set<number>();
  // Answers keyed by question id; a null or missing value means the question
  // was not answered yet.
  answers: {[questionId: string]: string | null} = {};
  // Derived fields bound by the conversation skin template. They are
  // recomputed whenever the current question index or the answers change.
  currentQuestion: AssessmentQuestion | null = null;
  totalQuestionCount = 0;
  progressPercentage = 0;
  isLastQuestion = false;
  savedResponse = '';

  constructor(
    @Optional() private bottomSheet: MatBottomSheet,
    @Optional() private ngbModal: NgbModal,
    private windowDimensionsService: WindowDimensionsService,
    private certificateAssessmentOfferingBackendApiService: CertificateAssessmentOfferingBackendApiService,
    private answerClassificationService: AnswerClassificationService,
    private multipleChoiceInputRulesService: MultipleChoiceInputRulesService,
    private itemSelectionInputRulesService: ItemSelectionInputRulesService,
    private textInputRulesService: TextInputRulesService,
    private numericInputRulesService: NumericInputRulesService,
    private fractionInputRulesService: FractionInputRulesService,
    private numberWithUnitsRulesService: NumberWithUnitsRulesService,
    private dragAndDropSortInputRulesService: DragAndDropSortInputRulesService,
    private imageClickInputRulesService: ImageClickInputRulesService
  ) {}

  ngOnInit(): void {
    this.loadQuestion(0);
    this.refreshComputedFields();
    if (this.showTimeExpiredModal) {
      this.openTimeExpiredModal();
    }
    if (this.showUnansweredQuestionModal) {
      this.openUnansweredQuestionModal();
    }
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
        this.questions[index] = this.convertStateDataToAssessmentQuestion(
          response.questionId,
          response.questionStateData
        );
        this.isLoadingQuestion = false;
        this.loadError = false;
        this.refreshComputedFields();
      })
      .catch(() => {
        this.isLoadingQuestion = false;
        this.loadError = true;
      })
      .finally(() => {
        this.inflightIndexes.delete(index);
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
      prompt: stateData.content.html,
      hint: '',
      options,
      placeholder: this.extractPlaceholder(interaction.customization_args),
      stateData,
    };
  }

  private getQuestionType(
    interactionId: InteractionSpecsKey | null
  ): AssessmentQuestionType {
    switch (interactionId) {
      case INTERACTION_ID_MULTIPLE_CHOICE:
        return 'multiple_choice';
      case INTERACTION_ID_ITEM_SELECTION:
        return 'multiple_select';
      case INTERACTION_ID_TEXT_INPUT:
        return 'text_input';
      case INTERACTION_ID_NUMERIC_INPUT:
        return 'numeric_input';
      case INTERACTION_ID_FRACTION_INPUT:
        return 'fraction_input';
      case INTERACTION_ID_NUMBER_WITH_UNITS:
        return 'number_with_units';
      case INTERACTION_ID_DRAG_AND_DROP_SORT:
        return 'drag_and_drop_sort';
      case INTERACTION_ID_IMAGE_CLICK:
        return 'image_click';
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
      text: choice.html,
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
    const answers = this.questions.map(question => {
      const selectedAnswer = this.answers[question.id] ?? null;
      const answerToSubmit =
        selectedAnswer === null
          ? ''
          : this.getAnswerToSubmit(question, selectedAnswer);
      let isCorrect = false;
      if (selectedAnswer !== null) {
        const state = State.createFromBackendDict(
          question.id,
          question.stateData
        );
        const interactionId = state.interaction.id as string;
        const rulesService = this.getRulesService(interactionId);
        const classificationAnswer = this.convertAnswerForClassification(
          question,
          selectedAnswer,
          interactionId
        );
        const result =
          this.answerClassificationService.getMatchingClassificationResult(
            question.id,
            state.interaction,
            classificationAnswer,
            rulesService
          );
        isCorrect = result.outcome.labelledAsCorrect;
      }
      return {
        question_id: question.id,
        is_correct: isCorrect,
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
    this.savedResponse = this.getSavedResponse();
  }

  updateResponse(response: string): void {
    const question = this.getCurrentQuestion();
    if (question === null) {
      return;
    }
    this.answers[question.id] = response;
    this.refreshComputedFields();
  }

  /**
   * Converts the raw string answer stored by the player into the typed format
   * expected by the interaction's rules service. Item-selection answers are
   * split into arrays; numeric answers are parsed as numbers; multiple-choice
   * answers are resolved to their option index.
   */
  private convertAnswerForClassification(
    question: AssessmentQuestion,
    rawAnswer: string,
    interactionId: string
  ): InteractionAnswer {
    switch (interactionId) {
      case INTERACTION_ID_MULTIPLE_CHOICE: {
        const option = question.options.find(o => o.id === rawAnswer);
        return option !== undefined ? option.index : rawAnswer;
      }
      case INTERACTION_ID_ITEM_SELECTION:
        return rawAnswer.split(',').filter(Boolean);
      case INTERACTION_ID_NUMERIC_INPUT: {
        const numericValue = Number(rawAnswer);
        return isNaN(numericValue) ? rawAnswer : numericValue;
      }
      case INTERACTION_ID_DRAG_AND_DROP_SORT:
        return rawAnswer
          .split(',')
          .filter(Boolean)
          .map(id => [id]);
      case INTERACTION_ID_IMAGE_CLICK: {
        try {
          const parsed = JSON.parse(rawAnswer) as InteractionAnswer;
          return parsed;
        } catch {
          return rawAnswer;
        }
      }
      default:
        return rawAnswer;
    }
  }

  /**
   * Returns the concrete interaction rules service that corresponds to the
   * given interaction id. Each service is providedIn: 'root' and injected
   * via Angular DI.
   */
  private getRulesService(
    interactionId: string
  ): MultipleChoiceInputRulesService &
    ItemSelectionInputRulesService &
    TextInputRulesService &
    NumericInputRulesService &
    FractionInputRulesService &
    NumberWithUnitsRulesService &
    DragAndDropSortInputRulesService &
    ImageClickInputRulesService {
    switch (interactionId) {
      case INTERACTION_ID_MULTIPLE_CHOICE:
        return this.multipleChoiceInputRulesService;
      case INTERACTION_ID_ITEM_SELECTION:
        return this.itemSelectionInputRulesService;
      case INTERACTION_ID_TEXT_INPUT:
        return this.textInputRulesService;
      case INTERACTION_ID_NUMERIC_INPUT:
        return this.numericInputRulesService;
      case INTERACTION_ID_FRACTION_INPUT:
        return this.fractionInputRulesService;
      case INTERACTION_ID_NUMBER_WITH_UNITS:
        return this.numberWithUnitsRulesService;
      case INTERACTION_ID_DRAG_AND_DROP_SORT:
        return this.dragAndDropSortInputRulesService;
      case INTERACTION_ID_IMAGE_CLICK:
        return this.imageClickInputRulesService;
      default:
        return this.textInputRulesService;
    }
  }
}
