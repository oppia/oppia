// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utility service for the diagnostic test player.
 */

import {Injectable} from '@angular/core';

import cloneDeep from 'lodash/cloneDeep';
import {AppConstants} from 'app.constants';
import {BindableVoiceovers} from 'domain/exploration/recorded-voiceovers.model';
import {Question} from 'domain/question/QuestionObjectFactory';
import {State} from 'domain/state/StateObjectFactory';
import {StateCard} from 'domain/state_card/state-card.model';
import {ExpressionInterpolationService} from 'expressions/expression-interpolation.service';
import {InteractionAnswer} from 'interactions/answer-defs';
import {
  AnswerClassificationService,
  InteractionRulesService,
} from 'pages/exploration-player-page/services/answer-classification.service';
import {AlertsService} from 'services/alerts.service';
import {ContextService} from 'services/context.service';
import {ExplorationHtmlFormatterService} from 'services/exploration-html-formatter.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {AudioTranslationLanguageService} from 'pages/exploration-player-page/services/audio-translation-language.service';
import {DiagnosticTestCurrentTopicStatusModel} from 'pages/diagnostic-test-player-page/diagnostic-test-current-topic-status.model';
import {DiagnosticTestTopicTrackerModel} from 'pages/diagnostic-test-player-page/diagnostic-test-topic-tracker.model';
import {QuestionBackendApiService} from 'domain/question/question-backend-api.service';
import {DiagnosticTestPlayerStatusService} from 'pages/diagnostic-test-player-page/diagnostic-test-player-status.service';
import {AnswerClassificationResult} from 'domain/classifier/answer-classification-result.model';

@Injectable({
  providedIn: 'root',
})
export class DiagnosticTestPlayerEngineService {
  private _answerIsBeingProcessed: boolean = false;
  private _diagnosticTestTopicTrackerModel!: DiagnosticTestTopicTrackerModel;
  private _initialCopyOfTopicTrackerModel!: DiagnosticTestTopicTrackerModel;
  private _diagnosticTestCurrentTopicStatusModel!: DiagnosticTestCurrentTopicStatusModel;

  private _currentQuestion!: Question;
  private _currentTopicId!: string;
  private _currentSkillId!: string;
  private _numberOfAttemptedQuestions!: number;
  private _focusLabel!: string;
  private _encounteredQuestionIds!: string[];

  constructor(
    private alertsService: AlertsService,
    private answerClassificationService: AnswerClassificationService,
    private audioTranslationLanguageService: AudioTranslationLanguageService,
    private contextService: ContextService,
    private explorationHtmlFormatterService: ExplorationHtmlFormatterService,
    private expressionInterpolationService: ExpressionInterpolationService,
    private focusManagerService: FocusManagerService,
    private questionBackendApiService: QuestionBackendApiService,
    private diagnosticTestPlayerStatusService: DiagnosticTestPlayerStatusService
  ) {
    this._numberOfAttemptedQuestions = 0;
    this._encounteredQuestionIds = [];
  }

  init(
    diagnosticTestTopicTrackerModel: DiagnosticTestTopicTrackerModel,
    successCallback: (initialCard: StateCard, nextFocusLabel: string) => void
  ): void {
    this._diagnosticTestTopicTrackerModel = diagnosticTestTopicTrackerModel;
    this._initialCopyOfTopicTrackerModel = cloneDeep(
      diagnosticTestTopicTrackerModel
    );
    this._currentTopicId =
      this._diagnosticTestTopicTrackerModel.selectNextTopicIdToTest();

    this.questionBackendApiService
      .fetchDiagnosticTestQuestionsAsync(
        this._currentTopicId,
        this._encounteredQuestionIds
      )
      .then(
        response => {
          this._diagnosticTestCurrentTopicStatusModel =
            new DiagnosticTestCurrentTopicStatusModel(response);

          // The diagnostic test current topic status model is initialized in the
          // above step, so there will always be at least one skill ID in the
          // pending list. Hence accessing the first element from the pending list
          // in the below line is safe.
          this._currentSkillId =
            this._diagnosticTestCurrentTopicStatusModel.getPendingSkillIds()[0];
          this._currentQuestion =
            this._diagnosticTestCurrentTopicStatusModel.getNextQuestion(
              this._currentSkillId
            );
          const stateCard = this.createCard(this._currentQuestion);
          successCallback(stateCard, this._focusLabel);
        },
        () => {
          this.alertsService.addWarning('Failed to load the questions.');
        }
      );
  }

  private _getNextQuestion(
    successCallback: (value: Question) => void,
    errorCallback: () => void
  ): void {
    let currentTopicIsCompletelyTested =
      this._diagnosticTestCurrentTopicStatusModel.isTopicCompletelyTested();

    if (currentTopicIsCompletelyTested) {
      let topicIsPassed =
        this._diagnosticTestCurrentTopicStatusModel.isTopicPassed();

      if (topicIsPassed) {
        this._diagnosticTestTopicTrackerModel.recordTopicPassed(
          this._currentTopicId
        );
      } else {
        this._diagnosticTestTopicTrackerModel.recordTopicFailed(
          this._currentTopicId
        );
      }

      if (this.isDiagnosticTestFinished()) {
        errorCallback();
      }

      this._currentTopicId =
        this._diagnosticTestTopicTrackerModel.selectNextTopicIdToTest();

      this.questionBackendApiService
        .fetchDiagnosticTestQuestionsAsync(
          this._currentTopicId,
          this._encounteredQuestionIds
        )
        .then(
          skillIdToQuestionsModel => {
            this._diagnosticTestCurrentTopicStatusModel =
              new DiagnosticTestCurrentTopicStatusModel(
                skillIdToQuestionsModel
              );
            // The diagnostic test current topic status model is initialized in
            // the above step, so there will always be at least one skill ID in
            // the pending list. Hence accessing the first element from the
            // pending list in the below line is safe.
            this._currentSkillId =
              this._diagnosticTestCurrentTopicStatusModel.getPendingSkillIds()[0];

            this._currentQuestion =
              this._diagnosticTestCurrentTopicStatusModel.getNextQuestion(
                this._currentSkillId
              );
            return successCallback(this._currentQuestion);
          },
          () => {
            this.alertsService.addWarning('Failed to load the questions.');
          }
        );
    } else {
      if (!this._diagnosticTestCurrentTopicStatusModel.isLifelineConsumed()) {
        // The topic completion is checked in the above step, so there will
        // always be at least one skill ID left for checking. Hence accessing
        // the first element from the pending list in the below line is safe.
        this._currentSkillId =
          this._diagnosticTestCurrentTopicStatusModel.getPendingSkillIds()[0];
      }

      this._currentQuestion =
        this._diagnosticTestCurrentTopicStatusModel.getNextQuestion(
          this._currentSkillId
        );
      return successCallback(this._currentQuestion);
    }
  }

  async getNextQuestionAsync(): Promise<Question> {
    return new Promise((resolve, reject) => {
      this._getNextQuestion(resolve, reject);
    });
  }

  submitAnswer(
    answer: InteractionAnswer,
    interactionRulesService: InteractionRulesService,
    successCallback: (
      nextCard: StateCard,
      refreshInteraction: boolean,
      feedbackHtml: string,
      feedbackAudioTranslations: BindableVoiceovers,
      refresherExplorationId: string,
      missingPrerequisiteSkillId: string,
      remainOnCurrentCard: boolean,
      taggedSkillMisconceptionId: string,
      wasOldStateInitial: boolean,
      isFirstHit: boolean,
      isFinalQuestion: boolean,
      nextCardIfReallyStuck: StateCard,
      focusLabel: string
    ) => void
  ): boolean {
    const oldState: State = this._currentQuestion.getStateData();
    const classificationResult: AnswerClassificationResult =
      this.answerClassificationService.getMatchingClassificationResult(
        oldState.name as string,
        oldState.interaction,
        answer,
        interactionRulesService
      );
    const answerIsCorrect = classificationResult.outcome.labelledAsCorrect;

    let stateCard: StateCard;
    let refreshInteraction: boolean = false;
    let feedbackHtml: string = '';
    let feedbackAudioTranslations: BindableVoiceovers = {};
    let refresherExplorationId: string = '';
    let missingPrerequisiteSkillId: string = '';
    let remainOnCurrentCard: boolean = false;
    let taggedSkillMisconceptionId: string = '';
    let wasOldStateInitial: boolean = false;
    let isFirstHit: boolean = true;
    let isFinalQuestion: boolean = false;
    let focusLabel: string;

    this._numberOfAttemptedQuestions += 1;

    if (answerIsCorrect) {
      this._diagnosticTestCurrentTopicStatusModel.recordCorrectAttempt(
        this._currentSkillId
      );
    } else {
      this._diagnosticTestCurrentTopicStatusModel.recordIncorrectAttempt(
        this._currentSkillId
      );
    }

    this.getNextQuestionAsync().then(
      (question: Question) => {
        stateCard = this.createCard(question);
        focusLabel = this._focusLabel;

        successCallback(
          stateCard,
          refreshInteraction,
          feedbackHtml,
          feedbackAudioTranslations,
          refresherExplorationId,
          missingPrerequisiteSkillId,
          remainOnCurrentCard,
          taggedSkillMisconceptionId,
          wasOldStateInitial,
          isFirstHit,
          isFinalQuestion,
          stateCard,
          focusLabel
        );
        this.diagnosticTestPlayerStatusService.onDiagnosticTestSessionProgressChange.emit(
          this.computeProgressPercentage()
        );
      },
      () => {
        // Test is finished.
        const recommendedTopicIds: string[] = this.getRecommendedTopicIds();
        this.diagnosticTestPlayerStatusService.onDiagnosticTestSessionCompleted.emit(
          recommendedTopicIds
        );
      }
    );
    return answerIsCorrect;
  }

  skipCurrentQuestion(successCallback: (stateCard: StateCard) => void): void {
    this._diagnosticTestCurrentTopicStatusModel.recordIncorrectAttempt(
      this._currentSkillId
    );

    this.getNextQuestionAsync().then(
      (question: Question) => {
        let stateCard = this.createCard(question);

        successCallback(stateCard);
        this.diagnosticTestPlayerStatusService.onDiagnosticTestSessionProgressChange.emit(
          this.computeProgressPercentage()
        );
      },
      () => {
        // Test is finished.
        const recommendedTopicIds: string[] = this.getRecommendedTopicIds();
        this.diagnosticTestPlayerStatusService.onDiagnosticTestSessionCompleted.emit(
          recommendedTopicIds
        );
      }
    );
  }

  getRecommendedTopicIds(): string[] {
    // The method used to recommend topics to the learner based on their
    // performance in the diagnostic test.
    let recommendedTopicIds: string[] = [];
    let failedTopicIds: string[] = this.getFailedTopicIds();
    // The topics which do not contain any prerequisites are referred to as
    // root topics.
    let rootTopicIds: string[] = this.getRootTopicIds();
    let failedRootTopicIds: string[] = rootTopicIds.filter(
      topicId => failedTopicIds.indexOf(topicId) !== -1
    );

    if (failedRootTopicIds.length >= 2) {
      // If the learner failed in two or more root topics, then we recommend
      // any two root topics, so that the learner can start with any
      // one of them.
      recommendedTopicIds.push(failedRootTopicIds[0]);
      recommendedTopicIds.push(failedRootTopicIds[1]);
    } else if (failedRootTopicIds.length === 1) {
      // Among the failed topics, if any of the topics is a root topic, then
      // it must be recommended.
      recommendedTopicIds.push(failedRootTopicIds[0]);
    } else {
      // If none of the failed topics is a root topic, then we sort the failed
      // topics topologically and recommend the first topic from the
      // sorted list.
      let sortedTopicIds = this.getTopologicallySortedTopicIds();
      for (let topicId of sortedTopicIds) {
        if (failedTopicIds.indexOf(topicId) !== -1) {
          recommendedTopicIds.push(topicId);
          break;
        }
      }
    }
    return recommendedTopicIds;
  }

  getRootTopicIds(): string[] {
    let topicIdToPrerequisiteTopicId =
      this._initialCopyOfTopicTrackerModel.getTopicIdToPrerequisiteTopicIds();
    // The topics which do not contain any prerequisites are referred to as
    // root topics.
    let rootTopicIds: string[] = [];

    for (let topicId in topicIdToPrerequisiteTopicId) {
      if (topicIdToPrerequisiteTopicId[topicId].length === 0) {
        rootTopicIds.push(topicId);
      }
    }
    return rootTopicIds;
  }

  getTopologicallySortedTopicIds(): string[] {
    let visitedTopicIds: string[] = [];
    let topicIdToPrerequisiteTopicId =
      this._initialCopyOfTopicTrackerModel.getTopicIdToPrerequisiteTopicIds();

    for (let currentTopicId in topicIdToPrerequisiteTopicId) {
      if (visitedTopicIds.indexOf(currentTopicId) !== -1) {
        continue;
      }

      let tempStack = [];
      tempStack.push(currentTopicId);

      while (tempStack.length > 0) {
        // '.shift()' here can return an undefined value, but we're already
        // checking for length > 0, so this is safe.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        let topicId: string = tempStack.shift()!;
        let prerequisites: string[] = topicIdToPrerequisiteTopicId[topicId];
        let nonVisitedPrerequisites: string[] = prerequisites.filter(
          (prerequisiteTopicId: string) => {
            return visitedTopicIds.indexOf(prerequisiteTopicId) === -1;
          }
        );

        if (nonVisitedPrerequisites.length > 0) {
          tempStack.unshift(topicId);
          tempStack = nonVisitedPrerequisites.concat(tempStack);
        } else {
          visitedTopicIds.push(topicId);
        }
      }
    }
    return visitedTopicIds;
  }

  computeProgressPercentage(): number {
    let numberOfAttemptedQuestionsInCurrentTopic =
      this._diagnosticTestCurrentTopicStatusModel.numberOfAttemptedQuestions;
    let initialTopicIdsList =
      this._initialCopyOfTopicTrackerModel.getPendingTopicIdsToTest();
    let pendingTopicIdsToTest =
      this._diagnosticTestTopicTrackerModel.getPendingTopicIdsToTest();

    // Each topic can contain a maximum of 3 diagnostic test skills and at most
    // 2 questions [main question & backup question] can be presented from each
    // skill. Thus, the maximum number of questions that can be asked from a
    // topic is 6.
    let completionMetric =
      ((initialTopicIdsList.length - pendingTopicIdsToTest.length) * 6 +
        numberOfAttemptedQuestionsInCurrentTopic) /
      (initialTopicIdsList.length * 6);

    return Math.round(completionMetric * 100);
  }

  getLanguageCode(): string {
    return this._diagnosticTestCurrentTopicStatusModel
      .getNextQuestion(this._currentSkillId)
      .getLanguageCode();
  }

  recordNewCardAdded(): void {
    this.contextService.setCustomEntityContext(
      AppConstants.ENTITY_TYPE.QUESTION,
      this._currentQuestion.getId() as string
    );
  }

  createCard(question: Question): StateCard {
    this._encounteredQuestionIds.push(question.getId() as string);

    const stateData: State = question.getStateData();
    const questionHtml: string =
      this.expressionInterpolationService.processHtml(
        stateData.content.html,
        []
      );

    if (questionHtml === '') {
      this.alertsService.addWarning('Question name should not be empty.');
    }

    this._focusLabel = this.focusManagerService.generateFocusLabel();
    const interaction = stateData.interaction;
    const interactionId = interaction.id;
    let interactionHtml: string = '';

    if (interactionId) {
      interactionHtml = this.explorationHtmlFormatterService.getInteractionHtml(
        interactionId,
        interaction.customizationArgs,
        true,
        this._focusLabel,
        null
      );
    }

    return StateCard.createNewCard(
      stateData.name as string,
      questionHtml,
      interactionHtml as string,
      interaction,
      stateData.recordedVoiceovers,
      stateData.content.contentId as string,
      this.audioTranslationLanguageService
    );
  }

  static get MAX_ALLOWED_QUESTIONS_IN_THE_DIAGNOSTIC_TEST(): number {
    return AppConstants.MAX_ALLOWED_QUESTIONS_IN_THE_DIAGNOSTIC_TEST;
  }

  isDiagnosticTestFinished(): boolean {
    const pendingTopicIdsToTest =
      this._diagnosticTestTopicTrackerModel.getPendingTopicIdsToTest().length;

    if (pendingTopicIdsToTest === 0) {
      return true;
    } else if (
      this._numberOfAttemptedQuestions >=
      DiagnosticTestPlayerEngineService.MAX_ALLOWED_QUESTIONS_IN_THE_DIAGNOSTIC_TEST
    ) {
      return true;
    } else {
      return false;
    }
  }

  getCurrentQuestion(): Question {
    return this._currentQuestion;
  }

  getCurrentSkillId(): string {
    return this._currentSkillId;
  }

  getCurrentTopicId(): string {
    return this._currentTopicId;
  }

  getTotalNumberOfAttemptedQuestions(): number {
    return this._numberOfAttemptedQuestions;
  }

  getFailedTopicIds(): string[] {
    return this._diagnosticTestTopicTrackerModel.getFailedTopicIds();
  }
}
