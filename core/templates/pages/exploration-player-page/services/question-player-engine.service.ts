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
import { BindableVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { Question, QuestionObjectFactory } from 'domain/question/QuestionObjectFactory';
import { State } from 'domain/state/StateObjectFactory';
import { StateCard } from 'domain/state_card/state-card.model';
import { ExpressionInterpolationService } from 'expressions/expression-interpolation.service';
import { InteractionAnswer } from 'interactions/answer-defs';
import { AnswerClassificationService, InteractionRulesService } from 'pages/exploration-player-page/services/answer-classification.service';
import { InteractionSpecsConstants, InteractionSpecsKey } from 'pages/interaction-specs.constants';
import { AlertsService } from 'services/alerts.service';
import { ContextService } from 'services/context.service';
import { ExplorationHtmlFormatterService } from 'services/exploration-html-formatter.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { AudioTranslationLanguageService } from
  'pages/exploration-player-page/services/audio-translation-language.service';

@Injectable({
  providedIn: 'root'
})
export class QuestionPlayerEngineService {
  private answerIsBeingProcessed: boolean = false;
  private questions: Question[] = [];
  private currentIndex!: number;
  private nextIndex!: number;

  constructor(
      private alertsService: AlertsService,
      private answerClassificationService: AnswerClassificationService,
      private audioTranslationLanguageService: AudioTranslationLanguageService,
      private contextService: ContextService,
      private explorationHtmlFormatterService: ExplorationHtmlFormatterService,
      private expressionInterpolationService: ExpressionInterpolationService,
      private focusManagerService: FocusManagerService,
      private questionObjectFactory: QuestionObjectFactory) {
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
    let randomSuffix = '';
    const N = Math.round(Math.random() * 1000);
    for (let i = 0; i < N; i++) {
      randomSuffix += ' ';
    }
    return randomSuffix;
  }

  // This should only be called when 'exploration' is non-null.
  private loadInitialQuestion(
      successCallback: (initialCard: StateCard, nextFocusLabel: string) => void,
      errorCallback: () => void): void {
    const questionId = this.questions[0].getId();
    if (questionId === null) {
      throw new Error('The first question should have a valid id.');
    }
    this.contextService.setCustomEntityContext(
      AppConstants.ENTITY_TYPE.QUESTION, questionId);
    const initialState = this.questions[0].getStateData();

    const questionHtml = this.makeQuestion(initialState, []);
    if (questionHtml === null) {
      this.alertsService.addWarning('Question name should not be empty.');
      errorCallback();
      return;
    }

    this.setCurrentIndex(0);
    this.nextIndex = 0;

    const interaction = initialState.interaction;
    const nextFocusLabel = this.focusManagerService.generateFocusLabel();

    const interactionId = interaction.id;
    if (interactionId === null) {
      throw new Error('Interaction ID cannot be null.');
    }

    let interactionHtml = (
      this.explorationHtmlFormatterService.getInteractionHtml(
        interactionId, interaction.customizationArgs, true, nextFocusLabel,
        null));

    const stateName = initialState.name;
    if (stateName === null) {
      throw new Error('Expected state to have a name.');
    }

    const contentId = initialState.content.contentId;
    if (contentId === null) {
      throw new Error('Expected state content to have a content id.');
    }

    const initialCard =
      StateCard.createNewCard(
        stateName, questionHtml, interactionHtml, interaction,
        initialState.recordedVoiceovers, initialState.writtenTranslations,
        contentId, this.audioTranslationLanguageService);
    successCallback(initialCard, nextFocusLabel);
  }

  private getCurrentStateData() {
    return this.questions[this.currentIndex].getStateData();
  }

  private getNextStateData() {
    return this.questions[this.nextIndex].getStateData();
  }

  private getNextInteractionHtml(labelForFocusTarget: string): string {
    const interactionId = this.getNextStateData().interaction.id;
    if (interactionId === null) {
      throw new Error('Interaction ID cannot be null.');
    }
    return this.explorationHtmlFormatterService.getInteractionHtml(
      interactionId,
      this.getNextStateData().interaction.customizationArgs,
      true,
      labelForFocusTarget,
      null);
  }

  init(
      questionObjects: Question[],
      successCallback: (initialCard: StateCard, nextFocusLabel: string) => void,
      errorCallback: () => void): void {
    this.contextService.setQuestionPlayerIsOpen();
    this.setAnswerIsBeingProcessed(false);
    let currentIndex = questionObjects.length;
    let randomIndex;

    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      [questionObjects[currentIndex], questionObjects[randomIndex]] = [
        questionObjects[randomIndex], questionObjects[currentIndex]];
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

  recordNewCardAdded(): void {
    this.currentIndex = this.nextIndex;
    const questionId = this.getCurrentQuestionId();
    if (questionId === null) {
      throw new Error('The current question should have a valid id.');
    }
    this.contextService.setCustomEntityContext(
      AppConstants.ENTITY_TYPE.QUESTION, questionId);
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  setCurrentIndex(value: number): void {
    this.currentIndex = value;
  }

  getCurrentQuestion(): Question {
    return this.questions[this.currentIndex];
  }

  getCurrentQuestionId(): string | null {
    return this.questions[this.currentIndex].getId();
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

  isInPreviewMode(): boolean {
    return false;
  }

  isAnswerBeingProcessed(): boolean {
    return this.answerIsBeingProcessed;
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
          feedbackAudioTranslations: BindableVoiceovers,
          refresherExplorationId: string | null,
          missingPrerequisiteSkillId: string | null,
          remainOnCurrentCard: boolean,
          taggedSkillMisconceptionId: string | null,
          wasOldStateInitial: boolean,
          isFirstHit: boolean,
          isFinalQuestion: boolean,
          focusLabel: string) => void): boolean {
    if (this.answerIsBeingProcessed) {
      return false;
    }

    const answerString = answer as string;
    this.setAnswerIsBeingProcessed(true);
    const oldState = this.getCurrentStateData();
    const recordedVoiceovers = oldState.recordedVoiceovers;
    const oldStateName = oldState.name;
    if (oldStateName === null) {
      throw new Error('Expected state to have a name.');
    }
    const classificationResult = (
      this.answerClassificationService.getMatchingClassificationResult(
        oldStateName, oldState.interaction, answer,
        interactionRulesService));
    const answerGroupIndex = classificationResult.answerGroupIndex;
    const answerIsCorrect = classificationResult.outcome.labelledAsCorrect;
    let taggedSkillMisconceptionId = null;
    if (oldState.interaction.answerGroups[answerGroupIndex]) {
      taggedSkillMisconceptionId =
        oldState.interaction.answerGroups[answerGroupIndex]
          .taggedSkillMisconceptionId;
    }

    // Use angular.copy() to clone the object
    // since classificationResult.outcome points
    // at oldState.interaction.default_outcome.
    const outcome = angular.copy(classificationResult.outcome);
    // Compute the data for the next state.
    const oldParams = {
      answer: answerString
    };
    const feedbackHtml =
      this.makeFeedback(outcome.feedback.html, [oldParams]);
    const feedbackContentId = outcome.feedback.contentId;
    if (feedbackContentId === null) {
      throw new Error('Expected feedback content id to be defined.');
    }
    const feedbackAudioTranslations = (
      recordedVoiceovers.getBindableVoiceovers(feedbackContentId));
    if (feedbackHtml === null) {
      this.setAnswerIsBeingProcessed(false);
      this.alertsService.addWarning('Feedback content should not be empty.');
      return false;
    }

    let newState = null;
    if (answerIsCorrect && (this.currentIndex < this.questions.length - 1)) {
      newState = this.questions[this.currentIndex + 1].getStateData();
    } else {
      newState = oldState;
    }

    let questionHtml = this.makeQuestion(newState, [oldParams, {
      answer: 'answer'
    }]);
    if (questionHtml === null) {
      this.setAnswerIsBeingProcessed(false);
      this.alertsService.addWarning('Question name should not be empty.');
      return false;
    }
    this.setAnswerIsBeingProcessed(false);

    const interactionId = oldState.interaction.id;
    const interactionIsInline = (
      !interactionId ||
      InteractionSpecsConstants.
        INTERACTION_SPECS[interactionId as InteractionSpecsKey].display_mode ===
        AppConstants.INTERACTION_DISPLAY_MODE_INLINE);
    const refreshInteraction = (
      answerIsCorrect || interactionIsInline);

    this.nextIndex = this.currentIndex + 1;
    const isFinalQuestion = (this.nextIndex === this.questions.length);
    const onSameCard = !answerIsCorrect;

    const _nextFocusLabel = this.focusManagerService.generateFocusLabel();
    let nextCard = null;
    if (!isFinalQuestion) {
      let nextInteractionHtml = this.getNextInteractionHtml(_nextFocusLabel);

      questionHtml = questionHtml + this.getRandomSuffix();
      nextInteractionHtml = nextInteractionHtml + this.getRandomSuffix();
      const contentId = this.getNextStateData().content.contentId;
      if (contentId === null) {
        throw new Error('Expected content id to be defined.');
      }
      nextCard = StateCard.createNewCard(
        'true', questionHtml, nextInteractionHtml,
        this.getNextStateData().interaction,
        this.getNextStateData().recordedVoiceovers,
        this.getNextStateData().writtenTranslations,
        contentId, this.audioTranslationLanguageService
      );
    }
    successCallback(
      nextCard, refreshInteraction, feedbackHtml,
      feedbackAudioTranslations,
      null, null, onSameCard, taggedSkillMisconceptionId,
      false, false, isFinalQuestion, _nextFocusLabel);
    return answerIsCorrect;
  }
}

angular.module('oppia').factory(
  'QuestionPlayerEngineService',
  downgradeInjectable(QuestionPlayerEngineService));
