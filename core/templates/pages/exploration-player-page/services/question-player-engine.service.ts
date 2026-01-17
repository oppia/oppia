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
import {Question, QuestionBackendDict} from 'domain/question/question.model';
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
  taggedSkillMisconceptionId: string | null;
}

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
  private nextIndex: number = 0;
  currentIndex: number = 0;
  questionPlayerState: QuestionPlayerState = {};

  constructor(
    private alertsService: AlertsService,
    private answerClassificationService: AnswerClassificationService,
    private pageContextService: PageContextService,
    private questionBackendApiService: QuestionBackendApiService,
    private explorationHtmlFormatterService: ExplorationHtmlFormatterService,
    private expressionInterpolationService: ExpressionInterpolationService,
    private focusManagerService: FocusManagerService,
    private playerTranscriptService: PlayerTranscriptService
  ) {}

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

  initializePretestServices(
    pretestQuestionObjects: Question[],
    callback: (initialCard: StateCard, nextFocusLabel: string) => void
  ): void {
    this.init(pretestQuestionObjects, callback, () => {});
  }

  init(
    questionObjects: Question[],
    successCallback: (initialCard: StateCard, nextFocusLabel: string) => void,
    errorCallback: () => void = () => {}
  ): void {
    this.pageContextService.setQuestionPlayerIsOpen();
    this.setAnswerIsBeingProcessed(false);
    this.clearQuestions();
    this.questionPlayerState = {};

    let tempArray = [...questionObjects];
    let currentIndex = tempArray.length;
    let randomIndex;

    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      [tempArray[currentIndex], tempArray[randomIndex]] = [
        tempArray[randomIndex],
        tempArray[currentIndex],
      ];
    }
    for (let i = 0; i < tempArray.length; i++) {
      this.addQuestion(tempArray[i]);
    }
    if (!this.questions || this.questions.length === 0) {
      this.alertsService.addWarning('There are no questions to display.');
      if (errorCallback) {
        errorCallback();
      }
      return;
    }
    this.loadInitialQuestion(successCallback, errorCallback);
  }

  recordNewCardAdded(): void {
    this.currentIndex = this.nextIndex;
    this.pageContextService.setCustomEntityContext(
      AppConstants.ENTITY_TYPE.QUESTION,
      this.getCurrentQuestionId()
    );
  }

  getCurrentQuestion(): Question {
    return this.questions[this.currentIndex];
  }

  getCurrentQuestionId(): string {
    return this.questions[this.currentIndex].getId() as string;
  }

  getQuestionCount(): number {
    return this.questions.length;
  }

  clearQuestions(): void {
    this.questions = [];
  }

  getLanguageCode(): string {
    return this.questions[this.currentIndex].getLanguageCode();
  }

  setAnswerIsBeingProcessed(value: boolean): void {
    this.answerIsBeingProcessed = value;
  }

  addQuestion(question: Question): void {
    this.questions.push(question);
  }

  submitAnswer(
    answer: InteractionAnswer,
    interactionRulesService: InteractionRulesService,
    successCallback: (
      nextCard: StateCard | null,
      refreshInteraction: boolean,
      feedbackHtml: string,
      refresherExplorationId: string | null,
      missingPrerequisiteSkillId: string | null,
      remainOnCurrentCard: boolean,
      taggedSkillMisconceptionId: string | null,
      wasOldStateInitial: boolean | null,
      isFirstHit: boolean | null,
      isFinalQuestion: boolean,
      nextCardIfReallyStuck: StateCard | null,
      focusLabel: string
    ) => void
  ): boolean {
    if (this.answerIsBeingProcessed) {
      return false;
    }

    if (this.questions.length === 0) {
      this.alertsService.addWarning('Question data is missing.');
      return false;
    }

    const answerString = answer as string;
    this.setAnswerIsBeingProcessed(true);
    const oldState = this.getCurrentStateData();

    if (!oldState) {
      this.setAnswerIsBeingProcessed(false);
      return false;
    }

    const classificationResult =
      this.answerClassificationService.getMatchingClassificationResult(
        '',
        oldState.interaction,
        answer,
        interactionRulesService
      );
    const answerGroupIndex = classificationResult.answerGroupIndex;
    const answerIsCorrect = classificationResult.outcome.labelledAsCorrect;
    let taggedSkillMisconceptionId: string | null = null;
    if (
      answerGroupIndex !== null &&
      oldState.interaction.answerGroups[answerGroupIndex]
    ) {
      taggedSkillMisconceptionId =
        oldState.interaction.answerGroups[answerGroupIndex]
          .taggedSkillMisconceptionId;
    }

    const outcome = cloneDeep(classificationResult.outcome);
    const oldParams = {
      answer: answerString,
    };
    const feedbackHtml = this.makeFeedback(outcome.feedback.html, [oldParams]);

    if (feedbackHtml === null || feedbackHtml === '') {
      this.setAnswerIsBeingProcessed(false);
      this.alertsService.addWarning('Feedback content should not be empty.');
      return false;
    }

    let newState: State;
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
      return false;
    }
    this.setAnswerIsBeingProcessed(false);

    const interactionId = oldState.interaction.id as string;
    const interactionSpecs = (
      InteractionSpecsConstants as unknown as {
        INTERACTION_SPECS: Record<string, {display_mode: string}>;
      }
    ).INTERACTION_SPECS;
    const interactionIsInline =
      !interactionId ||
      interactionSpecs[interactionId].display_mode ===
        AppConstants.INTERACTION_DISPLAY_MODE_INLINE;
    const refreshInteraction = answerIsCorrect || interactionIsInline;

    this.nextIndex = this.currentIndex + 1;
    const isFinalQuestion = this.nextIndex === this.questions.length;
    const onSameCard = !answerIsCorrect;

    const _nextFocusLabel = this.focusManagerService.generateFocusLabel();
    let nextCard: StateCard | null = null;
    let nextCardIfReallyStuck: StateCard | null = null;

    if (!isFinalQuestion) {
      let nextInteractionHtml = this.getNextInteractionHtml(_nextFocusLabel);

      questionHtml = questionHtml + this.getRandomSuffix();
      nextInteractionHtml = nextInteractionHtml + this.getRandomSuffix();
      const nextStateData = this.getNextStateData();

      if (nextStateData) {
        const contentId = nextStateData.content.contentId;
        if (contentId === null) {
          this.alertsService.addWarning('Content id cannot be null.');
          return false;
        }

        nextCard = StateCard.createNewCard(
          'true',
          questionHtml,
          nextInteractionHtml ?? '',
          nextStateData.interaction,
          contentId
        );
      }
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

  recordHintUsed(question: Question): void {
    const questionId = question.getId() as string;
    if (!this.questionPlayerState[questionId]) {
      this._createNewQuestionPlayerState(
        questionId,
        question.getLinkedSkillIds() as string[]
      );
    }
    this.questionPlayerState[questionId].usedHints.push({
      timestamp: this._getCurrentTime(),
    });
  }

  recordSolutionViewed(question: Question): void {
    const questionId = question.getId() as string;
    if (!this.questionPlayerState[questionId]) {
      this._createNewQuestionPlayerState(
        questionId,
        question.getLinkedSkillIds() as string[]
      );
    }
    this.questionPlayerState[questionId].viewedSolution = {
      timestamp: this._getCurrentTime(),
    };
  }

  recordAnswerSubmitted(
    question: Question,
    isCorrect: boolean,
    taggedSkillMisconceptionId: string | null
  ): void {
    const questionId = question.getId() as string;
    if (!this.questionPlayerState[questionId]) {
      this._createNewQuestionPlayerState(
        questionId,
        question.getLinkedSkillIds() as string[]
      );
    }
    if (isCorrect && this.questionPlayerState[questionId].viewedSolution) {
      return;
    }
    this.questionPlayerState[questionId].answers.push({
      isCorrect: isCorrect,
      timestamp: this._getCurrentTime(),
      taggedSkillMisconceptionId: taggedSkillMisconceptionId,
    });
  }

  getQuestionPlayerStateData(): object {
    return this.questionPlayerState;
  }

  private makeFeedback(
    feedbackHtml: string,
    envs: Record<string, string>[]
  ): string {
    return this.expressionInterpolationService.processHtml(feedbackHtml, envs);
  }

  private makeQuestion(
    newState: State,
    envs: Record<string, string>[]
  ): string {
    return this.expressionInterpolationService.processHtml(
      newState.content.html,
      envs
    );
  }

  private getRandomSuffix(): string {
    let randomSuffix = '';
    const N = Math.round(Math.random() * 1000);
    for (let i = 0; i < N; i++) {
      randomSuffix += ' ';
    }
    return randomSuffix;
  }

  private _getCurrentTime(): number {
    return new Date().getTime();
  }

  private loadInitialQuestion(
    successCallback: (initialCard: StateCard, nextFocusLabel: string) => void,
    errorCallback: () => void
  ): void {
    if (this.questions.length === 0) {
      return;
    }
    const questionId = this.questions[0].getId() as string;
    this.pageContextService.setCustomEntityContext(
      AppConstants.ENTITY_TYPE.QUESTION,
      questionId
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
    let interactionHtml: string | null = null;

    if (interactionId) {
      interactionHtml = this.explorationHtmlFormatterService.getInteractionHtml(
        interactionId,
        interaction.customizationArgs,
        true,
        nextFocusLabel,
        null
      );
    }

    const contentId = initialState.content.contentId;
    if (contentId === null) {
      this.alertsService.addWarning('Content id cannot be null.');
      errorCallback();
      return;
    }

    const initialCard = StateCard.createNewCard(
      '',
      questionHtml,
      interactionHtml ?? '',
      interaction,
      contentId
    );
    successCallback(initialCard, nextFocusLabel);
  }

  private getCurrentStateData(): State | null {
    if (!this.questions[this.currentIndex]) {
      return null;
    }
    return this.questions[this.currentIndex].getStateData();
  }

  private getNextStateData(): State | null {
    if (!this.questions[this.nextIndex]) {
      return null;
    }
    return this.questions[this.nextIndex].getStateData();
  }

  private getNextInteractionHtml(labelForFocusTarget: string): string {
    const nextStateData = this.getNextStateData();
    if (!nextStateData) {
      return '';
    }
    const interaction = nextStateData.interaction;
    return this.explorationHtmlFormatterService.getInteractionHtml(
      interaction.id as string,
      interaction.customizationArgs,
      true,
      labelForFocusTarget,
      null
    );
  }

  private initializeQuestionPlayerServices(
    questionDicts: QuestionBackendDict[],
    successCallback: (initialCard: StateCard, nextFocusLabel: string) => void,
    errorCallback: () => void
  ): void {
    let questionObjects = questionDicts.map(questionDict => {
      return Question.createFromBackendDict(questionDict);
    });
    this.init(questionObjects, successCallback, errorCallback);
  }

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
