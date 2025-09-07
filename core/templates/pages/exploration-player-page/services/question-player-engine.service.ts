// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for managing the logic and state of the Question Player.
 *
 * This service is responsible for initializing, managing, and tracking the
 * lifecycle of questions presented to the learner in a question-based
 * interaction environment. It supports both practice question sessions and
 * pretest mode.
 */

import {EventEmitter, Injectable} from '@angular/core';

import {AppConstants} from 'app.constants';
import {State} from 'domain/state/state.model';
import {StateCard} from 'domain/state_card/state-card.model';
import {ExpressionInterpolationService} from 'expressions/expression-interpolation.service';
import {InteractionAnswer} from 'interactions/answer-defs';
import {
  AnswerClassificationService,
  InteractionRulesService,
} from 'pages/exploration-player-page/services/answer-classification.service';
import {InteractionSpecsConstants} from 'pages/interaction-specs.constants';
import {AlertsService} from 'services/alerts.service';
import {PageContextService} from 'services/page-context.service';
import {ExplorationHtmlFormatterService} from 'services/exploration-html-formatter.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import cloneDeep from 'lodash/cloneDeep';
import {
  Question,
  QuestionBackendDict,
  QuestionObjectFactory,
} from 'domain/question/QuestionObjectFactory';
import {QuestionBackendApiService} from 'domain/question/question-backend-api.service';
import {PlayerTranscriptService} from './player-transcript.service';

interface QuestionPlayerConfigDict {
  skillList: string[];
  questionCount: number;
  questionsSortedByDifficulty: boolean;
}

interface UsedHintOrSolution {
  timestamp: number;
}

interface Answer {
  isCorrect: boolean;
  timestamp: number;
  taggedSkillMisconceptionId: string;
}

// Viewed solution being undefined signifies that the solution
// has not yet been viewed.
interface QuestionPlayerState {
  [key: string]: {
    linkedSkillIds: string[];
    answers: Answer[];
    usedHints: UsedHintOrSolution[];
    viewedSolution: UsedHintOrSolution | undefined;
  };
}

@Injectable({
  providedIn: 'root',
})
export class QuestionPlayerEngineService {
  private _totalQuestionsReceivedEventEmitter: EventEmitter<number> =
    new EventEmitter();
  private _questionSessionCompletedEventEmitter = new EventEmitter<object>();
  private _resultsPageIsLoadedEventEmitter = new EventEmitter<boolean>();
  private answerIsBeingProcessed: boolean = false;
  private questions: Question[] = [];
  private nextIndex: number = null;
  currentIndex: number = null;
  questionPlayerState: QuestionPlayerState = {};

  constructor(
    private alertsService: AlertsService,
    private answerClassificationService: AnswerClassificationService,
    private pageContextService: PageContextService,
    private questionBackendApiService: QuestionBackendApiService,
    private explorationHtmlFormatterService: ExplorationHtmlFormatterService,
    private expressionInterpolationService: ExpressionInterpolationService,
    private focusManagerService: FocusManagerService,
    private playerTranscriptService: PlayerTranscriptService,
    private questionObjectFactory: QuestionObjectFactory
  ) {}

  /**
   * Initializes the question player with configuration settings and fetches
   * questions from the backend based on skill list and difficulty.
   *
   * Once questions are fetched, initializes services and loads the first question.
   *
   * @param {QuestionPlayerConfigDict} questionPlayerConfig - The configuration object specifying skills, number of questions, and sorting.
   * @param {(initialCard: StateCard, nextFocusLabel: string) => void} successCallback - Called after loading the first question successfully.
   * @param {() => void} errorCallback - Called if question loading fails or returns no data.
   */
  initQuestionPlayer(
    questionPlayerConfig: QuestionPlayerConfigDict,
    successCallback: (initialCard: StateCard, nextFocusLabel: string) => void,
    errorCallback: () => void
  ): void {
    this.playerTranscriptService.init();
    this.questionBackendApiService
      .fetchQuestionsAsync(
        questionPlayerConfig.skillList,
        questionPlayerConfig.questionCount,
        questionPlayerConfig.questionsSortedByDifficulty
      )
      .then(questionData => {
        this._totalQuestionsReceivedEventEmitter.emit(questionData.length);
        this.initializeQuestionPlayerServices(
          questionData,
          successCallback,
          errorCallback
        );
      });
  }

  /**
   * Initializes the question player in pretest mode using a predefined list of question objects.
   *
   * @param {Question[]} pretestQuestionObjects - An array of pretest questions.
   * @param {(initialCard: StateCard, nextFocusLabel: string) => void} callback - Called after the first question is loaded.
   */
  initializePretestServices(
    pretestQuestionObjects: Question[],
    callback: (initialCard: StateCard, nextFocusLabel: string) => void
  ): void {
    this.init(pretestQuestionObjects, callback, () => {});
  }

  /**
   * Core initialization logic shared between normal and pretest modes.
   *
   * - Marks question player as open.
   * - Shuffles question order randomly.
   * - Adds questions to internal list.
   * - Loads the first question and triggers appropriate callback.
   *
   * @param {Question[]} questionObjects - Array of question objects to initialize.
   * @param {(initialCard: StateCard, nextFocusLabel: string) => void} successCallback - Called after successfully loading the first question.
   * @param {() => void} [errorCallback] - Optional error callback if no questions are found.
   */
  init(
    questionObjects: Question[],
    successCallback: (initialCard: StateCard, nextFocusLabel: string) => void,
    errorCallback?: () => void
  ): void {
    this.pageContextService.setQuestionPlayerIsOpen();
    this.setAnswerIsBeingProcessed(false);
    let currentIndex = questionObjects.length;
    let randomIndex;

    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      [questionObjects[currentIndex], questionObjects[randomIndex]] = [
        questionObjects[randomIndex],
        questionObjects[currentIndex],
      ];
    }
    for (let i = 0; i < questionObjects.length; i++) {
      this.addQuestion(questionObjects[i]);
    }
    if (!this.questions || this.questions.length === 0) {
      this.alertsService.addWarning('There are no questions to display.');
      errorCallback();
      return;
    }
    this.loadInitialQuestion(successCallback, errorCallback);
  }

  /**
   * Updates the current index to reflect that a new question card has been shown,
   * and sets the page context for the active question.
   *
   * This ensures that services relying on entity context (such as logging,
   * analytics, or context-aware components) are aware that the current
   * entity is a QUESTION, and provides its ID for tracking or processing.
   */
  recordNewCardAdded(): void {
    this.currentIndex = this.nextIndex;
    this.pageContextService.setCustomEntityContext(
      AppConstants.ENTITY_TYPE.QUESTION,
      this.getCurrentQuestionId()
    );
  }

  /**
   * Retrieves the currently active question object.
   *
   * @returns {Question} The current question.
   */
  getCurrentQuestion(): Question {
    return this.questions[this.currentIndex];
  }

  /**
   * Retrieves the ID of the currently active question.
   *
   * @returns {string} The ID of the current question.
   */
  getCurrentQuestionId(): string {
    return this.questions[this.currentIndex].getId();
  }

  /**
   * Returns the total number of questions currently loaded.
   *
   * @returns {number} The number of questions in the player.
   */
  getQuestionCount(): number {
    return this.questions.length;
  }

  /**
   * Clears all questions from the question player.
   *
   * Useful for resetting state when the player is being reused.
   */
  clearQuestions(): void {
    this.questions = [];
  }

  /**
   * Returns the language code of the currently active question.
   *
   * This is typically used for localization or accessibility features.
   *
   * @returns {string} The language code of the current question.
   */
  getLanguageCode(): string {
    return this.questions[this.currentIndex].getLanguageCode();
  }

  /**
   * Sets the internal flag that indicates if an answer is currently being processed.
   *
   * Used to prevent multiple answer submissions at the same time.
   *
   * @param {boolean} value - True if an answer is being processed; otherwise, false.
   */
  setAnswerIsBeingProcessed(value: boolean): void {
    this.answerIsBeingProcessed = value;
  }

  /**
   * Adds a new question to the question player.
   *
   * Useful when building the question list dynamically (e.g., from API calls).
   *
   * @param {Question} question - The question object to be added.
   */
  addQuestion(question: Question): void {
    this.questions.push(question);
  }

  /**
   * Submits the learner's answer, classifies it using the provided rules service,
   * generates appropriate feedback, and determines whether to move to the next
   * question or stay on the current one.
   *
   * - If the answer is correct and not the last question, the player advances to the next question.
   * - If the answer is incorrect, the player remains on the same question.
   * - In both cases, feedback is generated and passed to the UI via the success callback.
   *
   * Constructs a new `StateCard` and interaction HTML when transitioning
   * to the next question. Also determines whether the interaction needs to
   * be refreshed (e.g., inline interactions or correct answers).
   *
   * @param {InteractionAnswer} answer - The learner's submitted answer.
   * @param {InteractionRulesService} interactionRulesService - Service used to classify the answer based on rules.
   * @param {Function} successCallback - Callback invoked after answer processing.
   *   @param {Object} successCallback.result
   *   @param {StateCard|null} successCallback.result.nextCard - The next card or null if staying.
   *   @param {boolean} successCallback.result.refreshInteraction - Whether interaction needs redraw.
   *   @param {string} successCallback.result.feedbackHtml - Feedback message to display.
   *   @param {?string} successCallback.result.refresherExplorationId - Reserved.
   *   @param {?string} successCallback.result.missingPrerequisiteSkillId - Reserved.
   *   @param {boolean} successCallback.result.remainOnCurrentCard - Whether to stay on current question.
   *   @param {?string} successCallback.result.taggedSkillMisconceptionId - Known misconception link.
   *   @param {?boolean} successCallback.result.wasOldStateInitial - Reserved.
   *   @param {?boolean} successCallback.result.isFirstHit - Reserved.
   *   @param {boolean} successCallback.result.isFinalQuestion - Whether this is the last question.
   *   @param {?string} successCallback.result.nextCardIfReallyStuck - Reserved.
   *   @param {string} successCallback.result.focusLabel - Label for UI focus management.
   *
   * @returns {boolean} Whether the answer was classified as correct.
   */
  submitAnswer(
    answer: InteractionAnswer,
    interactionRulesService: InteractionRulesService,
    successCallback: (
      nextCard: StateCard,
      refreshInteraction: boolean,
      feedbackHtml: string,
      refresherExplorationId,
      missingPrerequisiteSkillId,
      remainOnCurrentCard: boolean,
      taggedSkillMisconceptionId: string,
      wasOldStateInitial,
      isFirstHit,
      isFinalQuestion: boolean,
      nextCardIfReallyStuck: null,
      focusLabel: string
    ) => void
  ): boolean {
    if (this.answerIsBeingProcessed) {
      return;
    }

    const answerString = answer as string;
    this.setAnswerIsBeingProcessed(true);
    const oldState = this.getCurrentStateData();
    const classificationResult =
      this.answerClassificationService.getMatchingClassificationResult(
        null,
        oldState.interaction,
        answer,
        interactionRulesService
      );
    const answerGroupIndex = classificationResult.answerGroupIndex;
    const answerIsCorrect = classificationResult.outcome.labelledAsCorrect;
    let taggedSkillMisconceptionId = null;
    if (oldState.interaction.answerGroups[answerGroupIndex]) {
      taggedSkillMisconceptionId =
        oldState.interaction.answerGroups[answerGroupIndex]
          .taggedSkillMisconceptionId;
    }

    // Use cloneDeep() to clone the object
    // since classificationResult.outcome points
    // at oldState.interaction.default_outcome.
    const outcome = cloneDeep(classificationResult.outcome);
    // Compute the data for the next state.
    const oldParams = {
      answer: answerString,
    };
    const feedbackHtml = this.makeFeedback(outcome.feedback.html, [oldParams]);
    if (feedbackHtml === null) {
      this.setAnswerIsBeingProcessed(false);
      this.alertsService.addWarning('Feedback content should not be empty.');
      return;
    }

    let newState = null;
    if (answerIsCorrect && this.currentIndex < this.questions.length - 1) {
      newState = this.questions[this.currentIndex + 1].getStateData();
    } else {
      newState = oldState;
    }

    let questionHtml = this.makeQuestion(newState, [
      oldParams,
      {
        answer: 'answer',
      },
    ]);
    if (questionHtml === null) {
      this.setAnswerIsBeingProcessed(false);
      this.alertsService.addWarning('Question name should not be empty.');
      return;
    }
    this.setAnswerIsBeingProcessed(false);

    const interactionId = oldState.interaction.id;
    const interactionIsInline =
      !interactionId ||
      InteractionSpecsConstants.INTERACTION_SPECS[interactionId]
        .display_mode === AppConstants.INTERACTION_DISPLAY_MODE_INLINE;
    const refreshInteraction = answerIsCorrect || interactionIsInline;

    this.nextIndex = this.currentIndex + 1;
    const isFinalQuestion = this.nextIndex === this.questions.length;
    const onSameCard = !answerIsCorrect;

    const _nextFocusLabel = this.focusManagerService.generateFocusLabel();
    let nextCard = null;
    let nextCardIfReallyStuck = null;
    if (!isFinalQuestion) {
      let nextInteractionHtml = this.getNextInteractionHtml(_nextFocusLabel);

      questionHtml = questionHtml + this.getRandomSuffix();
      nextInteractionHtml = nextInteractionHtml + this.getRandomSuffix();
      nextCard = StateCard.createNewCard(
        'true',
        questionHtml,
        nextInteractionHtml,
        this.getNextStateData().interaction,
        this.getNextStateData().content.contentId
      );
    }
    successCallback(
      nextCard,
      refreshInteraction,
      feedbackHtml,
      null,
      null,
      onSameCard,
      taggedSkillMisconceptionId,
      null,
      null,
      isFinalQuestion,
      nextCardIfReallyStuck,
      _nextFocusLabel
    );
    return answerIsCorrect;
  }

  /**
   * Logs that a hint was used for the given question.
   *
   * Creates a new question state entry if it doesn't exist, then records
   * the timestamp at which the hint was accessed.
   *
   * @param {Question} question - The question for which the hint was used.
   */
  recordHintUsed(question: Question): void {
    let questionId = question.getId() as string;
    if (!this.questionPlayerState[questionId]) {
      this._createNewQuestionPlayerState(
        questionId,
        question.getLinkedSkillIds()
      );
    }
    this.questionPlayerState[questionId].usedHints.push({
      timestamp: this._getCurrentTime(),
    });
  }

  /**
   * Records that the learner viewed the solution for a given question.
   *
   * Creates a question state if needed, then logs the current timestamp.
   * This flag can be used to avoid counting future correct answers toward
   * learning progress or mastery if the solution was seen first.
   *
   * @param {Question} question - The question for which the solution was viewed.
   */
  recordSolutionViewed(question: Question): void {
    let questionId = question.getId() as string;
    if (!this.questionPlayerState[questionId]) {
      this._createNewQuestionPlayerState(
        questionId,
        question.getLinkedSkillIds()
      );
    }
    this.questionPlayerState[questionId].viewedSolution = {
      timestamp: this._getCurrentTime(),
    };
  }

  /**
   * Records the submission of an answer for a given question.
   *
   * If the question does not already have a state entry in `questionPlayerState`,
   * one is created. The answer is only stored if it is incorrect, or if the
   * correct answer was submitted without the learner having viewed the solution.
   *
   * @param {Question} question - The question object being answered.
   * @param {boolean} isCorrect - Whether the submitted answer is correct.
   * @param {string} taggedSkillMisconceptionId - The ID of the tagged misconception
   *     (if any) associated with the answer, used for diagnostic or reporting purposes.
   */
  recordAnswerSubmitted(
    question: Question,
    isCorrect: boolean,
    taggedSkillMisconceptionId: string
  ): void {
    let questionId = question.getId() as string;
    if (!this.questionPlayerState[questionId]) {
      this._createNewQuestionPlayerState(
        questionId,
        question.getLinkedSkillIds()
      );
    }
    // Don't store a correct answer in the case where
    // the learner viewed the solution for this question.
    if (isCorrect && this.questionPlayerState[questionId].viewedSolution) {
      return;
    }
    this.questionPlayerState[questionId].answers.push({
      isCorrect: isCorrect,
      timestamp: this._getCurrentTime(),
      taggedSkillMisconceptionId: taggedSkillMisconceptionId,
    });
  }

  /**
   * Retrieves the complete state data for the question player.
   *
   * This includes all answers submitted, hints used, and solutions viewed
   * for each question attempted during the session.
   *
   * @returns {object} An object mapping question IDs to their state data.
   */
  getQuestionPlayerStateData(): object {
    return this.questionPlayerState;
  }

  /**
   * Processes and returns the feedback HTML with any embedded expressions evaluated.
   *
   * This uses the expression interpolation service to replace variables in the
   * feedback HTML with values from the environment context (`envs`), allowing
   * dynamic or personalized feedback messages.
   *
   * @param {string} feedbackHtml - The raw HTML string containing feedback text and expressions.
   * @param {Record<string, string>[]} envs - An array of variable environments for expression evaluation.
   * @returns {string} The processed HTML with interpolated values.
   */
  private makeFeedback(
    feedbackHtml: string,
    envs: Record<string, string>[]
  ): string {
    return this.expressionInterpolationService.processHtml(feedbackHtml, envs);
  }

  /**
   * Processes and returns the question's HTML content with expressions evaluated.
   *
   * Similar to `makeFeedback`, this function dynamically injects contextual
   * values into the question content by evaluating expressions within the
   * HTML against the provided environment variables.
   *
   * @param {State} newState - The state object containing question HTML content.
   * @param {Record<string, string>[]} envs - An array of variable environments for expression evaluation.
   * @returns {string} The processed HTML with evaluated expressions.
   */
  private makeQuestion(
    newState: State,
    envs: Record<string, string>[]
  ): string {
    return this.expressionInterpolationService.processHtml(
      newState.content.html,
      envs
    );
  }

  /**
   * Generates a random whitespace suffix.
   *
   * This method is used as a workaround to force Angular to detect property
   * changes when the actual value remains the same. Angular's change detection
   * compares new values with old ones, and if they are strictly equal,
   * the update is skipped. By appending a random number of spaces,
   * the value becomes different, thereby triggering a refresh.
   *
   * @returns {string} A string of whitespace characters of random length.
   */
  private getRandomSuffix(): string {
    // This is a bit of a hack. When a refresh to a component property
    // happens, Angular compares the new value of the property to its previous
    // value. If they are the same, then the property is not updated.
    // Appending a random suffix makes the new value different from the
    // previous one, and thus indirectly forces a refresh.
    let randomSuffix = '';
    const N = Math.round(Math.random() * 1000);
    for (let i = 0; i < N; i++) {
      randomSuffix += ' ';
    }
    return randomSuffix;
  }

  /**
   * Returns the current timestamp in milliseconds since the UNIX epoch.
   *
   * Useful for tracking time-based events or for performance logging.
   *
   * @returns {number} The current time in milliseconds.
   */
  private _getCurrentTime(): number {
    return new Date().getTime();
  }

  /**
   * Loads and renders the first question in the question player.
   *
   * This function assumes that the 'exploration' context is already set and valid.
   * It prepares the question content, generates the interaction HTML,
   * and constructs the initial StateCard object. If the question is invalid
   * (e.g., missing a name or content), the error callback is invoked.
   *
   * @param {(initialCard: StateCard, nextFocusLabel: string) => void} successCallback
   *    A callback to execute once the initial question is successfully loaded.
   *    It receives the constructed StateCard and a focus label for accessibility.
   * @param {() => void} errorCallback
   *    A callback to execute if the question fails to load (e.g., invalid data).
   */
  private loadInitialQuestion(
    successCallback: (initialCard: StateCard, nextFocusLabel: string) => void,
    errorCallback: () => void
  ): void {
    this.pageContextService.setCustomEntityContext(
      AppConstants.ENTITY_TYPE.QUESTION,
      this.questions[0].getId()
    );
    const initialState = this.questions[0].getStateData();

    const questionHtml = this.makeQuestion(initialState, []);
    if (questionHtml === null) {
      this.alertsService.addWarning('Question name should not be empty.');
      errorCallback();
      return;
    }

    this.currentIndex = 0;
    this.nextIndex = 0;

    const interaction = initialState.interaction;
    const nextFocusLabel = this.focusManagerService.generateFocusLabel();

    const interactionId = interaction.id;
    let interactionHtml = null;

    if (interactionId) {
      interactionHtml = this.explorationHtmlFormatterService.getInteractionHtml(
        interactionId,
        interaction.customizationArgs,
        true,
        nextFocusLabel,
        null
      );
    }
    const initialCard = StateCard.createNewCard(
      null,
      questionHtml,
      interactionHtml,
      interaction,
      initialState.content.contentId
    );
    successCallback(initialCard, nextFocusLabel);
  }

  /**
   * Retrieves the state data for the currently active question.
   *
   * Useful for accessing the current question's content, interaction
   * configuration, and other related metadata.
   *
   * @returns {State} The current question's state data object.
   */
  private getCurrentStateData() {
    return this.questions[this.currentIndex].getStateData();
  }

  /**
   * Retrieves the state data for the next question in the sequence.
   *
   * @returns {State} The state data object of the next question.
   */
  private getNextStateData() {
    return this.questions[this.nextIndex].getStateData();
  }

  /**
   * Generates the HTML string for the interaction of the next question.
   *
   * @param {string} labelForFocusTarget - A label used to set focus for accessibility.
   * @returns {string} The HTML string representing the interaction.
   */
  private getNextInteractionHtml(labelForFocusTarget: string): string {
    const interactionId = this.getNextStateData().interaction.id;
    return this.explorationHtmlFormatterService.getInteractionHtml(
      interactionId,
      this.getNextStateData().interaction.customizationArgs,
      true,
      labelForFocusTarget,
      null
    );
  }

  /**
   * Initializes the question player with a set of questions.
   *
   * @param {QuestionBackendDict[]} questionDicts - An array of question backend dicts to initialize with.
   * @param {(initialCard: StateCard, nextFocusLabel: string) => void} successCallback - Called when initialization succeeds.
   * @param {() => void} errorCallback - Called when initialization fails.
   */
  private initializeQuestionPlayerServices(
    questionDicts: QuestionBackendDict[],
    successCallback: (initialCard: StateCard, nextFocusLabel: string) => void,
    errorCallback: () => void
  ): void {
    let questionObjects = questionDicts.map(questionDict => {
      return this.questionObjectFactory.createFromBackendDict(questionDict);
    });
    this.init(questionObjects, successCallback, errorCallback);
  }

  /**
   * Creates a new state entry for a question in the question player.
   *
   * @param {string} questionId - The unique identifier of the question.
   * @param {string[]} linkedSkillIds - An array of skill IDs linked to the question.
   */
  private _createNewQuestionPlayerState(
    questionId: string,
    linkedSkillIds: string[]
  ): void {
    this.questionPlayerState[questionId] = {
      linkedSkillIds: linkedSkillIds,
      answers: [],
      usedHints: [],
      viewedSolution: undefined,
    };
  }

  get onQuestionSessionCompleted(): EventEmitter<object> {
    return this._questionSessionCompletedEventEmitter;
  }

  get resultsPageIsLoadedEventEmitter(): EventEmitter<boolean> {
    return this._resultsPageIsLoadedEventEmitter;
  }

  get onTotalQuestionsReceived(): EventEmitter<number> {
    return this._totalQuestionsReceivedEventEmitter;
  }
}
