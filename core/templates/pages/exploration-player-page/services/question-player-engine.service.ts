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
 * @fileoverview Utility service for the question player for an exploration.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { AppConstants } from 'app.constants';
import { ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { BindableVoiceovers } from 'domain/exploration/RecordedVoiceoversObjectFactory';
import { Question, QuestionBackendDict, QuestionObjectFactory } from 'domain/question/QuestionObjectFactory';
import { State } from 'domain/state/StateObjectFactory';
import { StateCard, StateCardObjectFactory } from 'domain/state_card/StateCardObjectFactory';
import { ExpressionInterpolationService } from 'expressions/expression-interpolation.service';
import { InteractionAnswer } from 'interactions/answer-defs';
import { AnswerClassificationService, InteractionRulesService } from 'pages/exploration-player-page/services/answer-classification.service';
import { InteractionSpecsConstants } from 'pages/interaction-specs.constants';
import { AlertsService } from 'services/alerts.service';
import { ContextService } from 'services/context.service';
import { UrlService } from 'services/contextual/url.service';
import { ExplorationHtmlFormatterService } from 'services/exploration-html-formatter.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';

@Injectable({
  providedIn: 'root'
})
export class QuestionPlayerEngineService {
  private explorationId: string = null;
  private questionPlayerMode: boolean = null;
  private version: number = null;

  private answerIsBeingProcessed: boolean = false;
  private questions: Question[] = [];
  private currentIndex: number = null;
  private nextIndex: number = null;

  constructor(
      private alertsService: AlertsService,
      private answerClassificationService: AnswerClassificationService,
      private contextService: ContextService,
      private explorationHtmlFormatterService: ExplorationHtmlFormatterService,
      private expressionInterpolationService: ExpressionInterpolationService,
      private focusManagerService: FocusManagerService,
      private questionObjectFactory: QuestionObjectFactory,
      private readOnlyExplorationBackendApiService:
        ReadOnlyExplorationBackendApiService,
      private stateCardObjectFactory: StateCardObjectFactory,
      private urlService: UrlService) {

  }

  // Evaluate feedback.
  private makeFeedback(
      feedbackHtml: string, envs: Record<string, string>[]): string {
    return this.expressionInterpolationService.processHtml(feedbackHtml, envs);
  }

  // Evaluate question string.
  private makeQuestion(
      newState: State, envs: Record<string, string>[]): string {
    return this.expressionInterpolationService.processHtml(
      newState.content.html, envs);
  }

  private getRandomSuffix(): string {
    // This is a bit of a hack. When a refresh to a $scope variable
    // happens,
    // AngularJS compares the new value of the variable to its previous
    // value. If they are the same, then the variable is not updated.
    // Appending a random suffix makes the new value different from the
    // previous one, and thus indirectly forces a refresh.
    var randomSuffix = '';
    var N = Math.round(Math.random() * 1000);
    for (var i = 0; i < N; i++) {
      randomSuffix += ' ';
    }
    return randomSuffix;
  }

  // This should only be called when 'exploration' is non-null.
  private loadInitialQuestion(
      successCallback: (initialCard: StateCard, nextFocusLabel: string) => void,
      errorCallback: () => void): void {
    if (!this.questions || this.questions.length === 0) {
      errorCallback();
      return;
    }
    this.contextService.setCustomEntityContext(
      AppConstants.ENTITY_TYPE.QUESTION, this.questions[0].getId());
    var initialState = this.questions[0].getStateData();

    var questionHtml = this.makeQuestion(initialState, []);
    if (questionHtml === null) {
      this.alertsService.addWarning('Expression parsing error.');
      return;
    }

    this.currentIndex = 0;
    this.nextIndex = 0;

    var interaction = initialState.interaction;
    var nextFocusLabel = this.focusManagerService.generateFocusLabel();

    var interactionId = interaction.id;
    var interactionHtml = null;

    if (interactionId) {
      interactionHtml = this.explorationHtmlFormatterService.getInteractionHtml(
        interactionId, interaction.customizationArgs, true, nextFocusLabel);
    }
    var initialCard =
      this.stateCardObjectFactory.createNewCard(
        null, questionHtml, interactionHtml, interaction,
        initialState.recordedVoiceovers,
        initialState.writtenTranslations, initialState.content.contentId);
    successCallback(initialCard, nextFocusLabel);
  }

  private getCurrentStateData() {
    return this.questions[this.currentIndex].getStateData();
  }

  private getNextStateData() {
    return this.questions[this.nextIndex].getStateData();
  }

  private getNextInteractionHtml(labelForFocusTarget: string): string {
    var interactionId = this.getNextStateData().interaction.id;
    return this.explorationHtmlFormatterService.getInteractionHtml(
      interactionId,
      this.getNextStateData().interaction.customizationArgs,
      true,
      labelForFocusTarget);
  }

  init(
      questionDicts: QuestionBackendDict[],
      successCallback: (initialCard: StateCard, nextFocusLabel: string) => void,
      errorCallback: () => void): void {
    this.contextService.setQuestionPlayerIsOpen();
    this.explorationId = this.contextService.getExplorationId();
    this.questionPlayerMode = this.contextService.isInQuestionPlayerMode();
    this.version = this.urlService.getExplorationVersionFromUrl();

    if (!this.questionPlayerMode) {
      this.readOnlyExplorationBackendApiService
        .loadExploration(this.explorationId, this.version)
        .then(function(exploration) {
          this.version = exploration.version;
        });
    }

    this.answerIsBeingProcessed = false;
    for (var i = 0; i < questionDicts.length; i++) {
      this.questions.push(
        this.questionObjectFactory.createFromBackendDict(questionDicts[i])
      );
    }
    this.loadInitialQuestion(successCallback, errorCallback);
  }

  recordNewCardAdded(): void {
    this.currentIndex = this.nextIndex;
  }

  getCurrentQuestion(): Question {
    return this.questions[this.currentIndex];
  }

  getCurrentQuestionId(): string {
    return this.questions[this.currentIndex].getId();
  }

  getQuestionCount(): number {
    return this.questions.length;
  }

  getExplorationId(): string {
    return this.explorationId;
  }

  getExplorationVersion(): number {
    return this.version;
  }

  clearQuestions(): void {
    this.questions = [];
  }

  getLanguageCode(): string {
    return this.questions[this.currentIndex].getLanguageCode();
  }

  isInPreviewMode(): boolean {
    return false;
  }

  isAnswerBeingProcessed(): boolean {
    return this.answerIsBeingProcessed;
  }

  submitAnswer(
      answer: InteractionAnswer,
      interactionRulesService: InteractionRulesService,
      successCallback: (
          nextCard: StateCard,
          refreshInteraction: boolean,
          feedbackHtml: string,
          feedbackAudioTranslations: BindableVoiceovers,
          refresherExplorationId,
          missingPrerequisiteSkillId,
          remainOnCurrentCard: boolean,
          taggedSkillMisconceptionId: string,
          wasOldStateInitial,
          isFirstHit,
          isFinalQuestion: boolean,
          focusLabel: string) => void): boolean {
    if (this.answerIsBeingProcessed) {
      return;
    }

    var answerString = answer as string;
    this.answerIsBeingProcessed = true;
    var oldState = this.getCurrentStateData();
    var recordedVoiceovers = oldState.recordedVoiceovers;
    var classificationResult = (
      this.answerClassificationService.getMatchingClassificationResult(
        null, oldState.interaction, answer,
        interactionRulesService));
    var answerIsCorrect = classificationResult.outcome.labelledAsCorrect;
    var taggedSkillMisconceptionId = null;
    if (oldState.interaction.answerGroups[answerString]) {
      taggedSkillMisconceptionId =
        oldState.interaction.answerGroups[answerString]
          .taggedSkillMisconceptionId;
    }

    // Use angular.copy() to clone the object
    // since classificationResult.outcome points
    // at oldState.interaction.default_outcome.
    var outcome = angular.copy(classificationResult.outcome);
    // Compute the data for the next state.
    var oldParams = {
      answer: answerString
    };
    var feedbackHtml =
      this.makeFeedback(outcome.feedback.html, [oldParams]);
    var feedbackContentId = outcome.feedback.contentId;
    var feedbackAudioTranslations = (
      recordedVoiceovers.getBindableVoiceovers(feedbackContentId));
    if (feedbackHtml === null) {
      this.answerIsBeingProcessed = false;
      this.alertsService.addWarning('Expression parsing error.');
      return;
    }

    var newState = null;
    if (answerIsCorrect && (this.currentIndex < this.questions.length - 1)) {
      newState = this.questions[this.currentIndex + 1].getStateData();
    } else {
      newState = oldState;
    }

    var questionHtml = this.makeQuestion(newState, [oldParams, {
      answer: 'answer'
    }]);
    if (questionHtml === null) {
      this.answerIsBeingProcessed = false;
      this.alertsService.addWarning('Expression parsing error.');
      return;
    }
    this.answerIsBeingProcessed = false;

    var interactionId = oldState.interaction.id;
    var interactionIsInline = (
      !interactionId ||
      InteractionSpecsConstants.
        INTERACTION_SPECS[interactionId].display_mode ===
        AppConstants.INTERACTION_DISPLAY_MODE_INLINE);
    var refreshInteraction = (
      answerIsCorrect || interactionIsInline);

    this.nextIndex = this.currentIndex + 1;
    var isFinalQuestion = (this.nextIndex === this.questions.length);
    var onSameCard = !answerIsCorrect;

    var _nextFocusLabel = this.focusManagerService.generateFocusLabel();
    var nextCard = null;
    if (!isFinalQuestion) {
      var nextInteractionHtml = this.getNextInteractionHtml(_nextFocusLabel);

      questionHtml = questionHtml + this.getRandomSuffix();
      nextInteractionHtml = nextInteractionHtml + this.getRandomSuffix();
      if (!onSameCard) {
        this.contextService.setCustomEntityContext(
          AppConstants.ENTITY_TYPE.QUESTION,
          this.questions[this.nextIndex].getId());
      }
      nextCard = this.stateCardObjectFactory.createNewCard(
        'true', questionHtml, nextInteractionHtml,
        this.getNextStateData().interaction,
        this.getNextStateData().recordedVoiceovers,
        this.getNextStateData().writtenTranslations,
        this.getNextStateData().content.contentId
      );
    } else if (!onSameCard) {
      this.contextService.removeCustomEntityContext();
    }
    successCallback(
      nextCard, refreshInteraction, feedbackHtml,
      feedbackAudioTranslations,
      null, null, onSameCard, taggedSkillMisconceptionId,
      null, null, isFinalQuestion, _nextFocusLabel);
    return answerIsCorrect;
  }
}

angular.module('oppia').factory(
  'QuestionPlayerEngineService',
  downgradeInjectable(QuestionPlayerEngineService));
