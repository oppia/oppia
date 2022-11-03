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
 * @fileoverview Utility service for the diagnostic test player.
 */

import { Injectable } from '@angular/core';

import { AppConstants } from 'app.constants';
import { BindableVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { Question } from 'domain/question/QuestionObjectFactory';
import { State } from 'domain/state/StateObjectFactory';
import { StateCard } from 'domain/state_card/state-card.model';
import { ExpressionInterpolationService } from 'expressions/expression-interpolation.service';
import { InteractionAnswer } from 'interactions/answer-defs';
import { AnswerClassificationService, InteractionRulesService } from 'pages/exploration-player-page/services/answer-classification.service';
import { AlertsService } from 'services/alerts.service';
import { ContextService } from 'services/context.service';
import { ExplorationHtmlFormatterService } from 'services/exploration-html-formatter.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { AudioTranslationLanguageService } from
  'pages/exploration-player-page/services/audio-translation-language.service';
import { DiagnosticTestCurrentTopicStatusModel } from 'pages/diagnostic-test-player-page/diagnostic-test-current-topic-status.model';
import { DiagnosticTestTopicTrackerModel } from 'pages/diagnostic-test-player-page/diagnostic-test-topic-tracker.model';
import { QuestionBackendApiService } from 'domain/question/question-backend-api.service';
import { DiagnosticTestPlayerStatusService } from 'pages/diagnostic-test-player-page/diagnostic-test-player-status.service';
import { AnswerClassificationResult } from 'domain/classifier/answer-classification-result.model';


@Injectable({
  providedIn: 'root'
})
export class DiagnosticTestPlayerEngineService {
  private answerIsBeingProcessed: boolean = false;
  private diagnosticTestTopicTrackerModel!: DiagnosticTestTopicTrackerModel;
  private diagnosticTestCurrentTopicStatusModel!:
    DiagnosticTestCurrentTopicStatusModel;

  private currentQuestion!: Question;
  private currentTopicId!: string;
  private currentSkillId!: string;
  private numberOfAttemptedQuestions!: number;
  private focusLabel!: string;

  constructor(
    private alertsService: AlertsService,
    private answerClassificationService: AnswerClassificationService,
    private audioTranslationLanguageService: AudioTranslationLanguageService,
    private contextService: ContextService,
    private explorationHtmlFormatterService: ExplorationHtmlFormatterService,
    private expressionInterpolationService: ExpressionInterpolationService,
    private focusManagerService: FocusManagerService,
    private questionBackendApiService: QuestionBackendApiService,
    private diagnosticTestPlayerStatusService:
      DiagnosticTestPlayerStatusService) {
  }

  init(
      diagnosticTestTopicTrackerModel: DiagnosticTestTopicTrackerModel,
      successCallback: (initialCard: StateCard, nextFocusLabel: string) => void
  ): void {
    this.diagnosticTestTopicTrackerModel = diagnosticTestTopicTrackerModel;
    this.currentTopicId = (
      this.diagnosticTestTopicTrackerModel.selectNextTopicIdToTest());

    this.questionBackendApiService.fetchDiagnosticTestQuestionsAsync(
      this.currentTopicId).then((response) => {
      this.diagnosticTestCurrentTopicStatusModel = (
        new DiagnosticTestCurrentTopicStatusModel(response));

      const stateCard = this.createCard();
      this.numberOfAttemptedQuestions = 0;

      successCallback(stateCard, this.focusLabel);
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
        focusLabel: string
      ) => void
  ): boolean|undefined {
    const oldState: State = this.currentQuestion.getStateData();
    const classificationResult: AnswerClassificationResult = (
      this.answerClassificationService.getMatchingClassificationResult(
        oldState.name as string, oldState.interaction, answer,
        interactionRulesService));
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

    this.numberOfAttemptedQuestions += 1;

    if (answerIsCorrect) {
      this.diagnosticTestCurrentTopicStatusModel.recordCorrectAttempt(
        this.currentSkillId);
    } else {
      this.diagnosticTestCurrentTopicStatusModel.recordIncorrectAttempt(
        this.currentSkillId);
    }

    let currentTopicIsCompletelyTested = (
      this.diagnosticTestCurrentTopicStatusModel.isTopicCompletelyTested());

    if (currentTopicIsCompletelyTested) {
      let topicIsPassed = (
        this.diagnosticTestCurrentTopicStatusModel.isTopicPassed());

      if (topicIsPassed) {
        this.diagnosticTestTopicTrackerModel.recordTopicPassed(
          this.currentTopicId);
      } else {
        this.diagnosticTestTopicTrackerModel.recordTopicFailed(
          this.currentTopicId);
      }

      if (this.isDiagnosticTestFinished()) {
        this.diagnosticTestPlayerStatusService
          .onDiagnosticTestSessionCompleted.emit(true);
        return;
      }

      this.currentTopicId = (
        this.diagnosticTestTopicTrackerModel.selectNextTopicIdToTest());

      this.questionBackendApiService.fetchDiagnosticTestQuestionsAsync(
        this.currentTopicId
      ).then((response) => {
        this.diagnosticTestCurrentTopicStatusModel = (
          new DiagnosticTestCurrentTopicStatusModel(response));

        stateCard = this.createCard();
        focusLabel = this.focusLabel;

        successCallback(
          stateCard, refreshInteraction, feedbackHtml,
          feedbackAudioTranslations, refresherExplorationId,
          missingPrerequisiteSkillId, remainOnCurrentCard,
          taggedSkillMisconceptionId, wasOldStateInitial, isFirstHit,
          isFinalQuestion, focusLabel
        );
        return answerIsCorrect;
      });
    } else {
      stateCard = this.createCard();
      focusLabel = this.focusLabel;

      successCallback(
        stateCard, refreshInteraction, feedbackHtml,
        feedbackAudioTranslations, refresherExplorationId,
        missingPrerequisiteSkillId, remainOnCurrentCard,
        taggedSkillMisconceptionId, wasOldStateInitial, isFirstHit,
        isFinalQuestion, focusLabel
      );
      return answerIsCorrect;
    }
  }

  getLanguageCode(): string {
    return (
      this.diagnosticTestCurrentTopicStatusModel.getNextQuestion(
        this.currentSkillId).getLanguageCode());
  }

  recordNewCardAdded(): void {
    this.contextService.setCustomEntityContext(
      AppConstants.ENTITY_TYPE.QUESTION, this.currentQuestion.getId() as string
    );
  }

  makeQuestion(
      newState: State, envs: Record<string, string>[]): string {
    return this.expressionInterpolationService.processHtml(
      newState.content.html, envs);
  }

  createCard(): StateCard {
    if (!this.diagnosticTestCurrentTopicStatusModel.isLifelineConsumeed()) {
      this.currentSkillId = (
        this.diagnosticTestCurrentTopicStatusModel.getNextSkill());
    }
    this.currentQuestion = (
      this.diagnosticTestCurrentTopicStatusModel.getNextQuestion(
        this.currentSkillId));
    const stateData: State = this.currentQuestion.getStateData();
    const questionHtml: string = this.makeQuestion(stateData, []);

    if (questionHtml === '') {
      this.alertsService.addWarning('Question name should not be empty.');
    }

    this.focusLabel = this.focusManagerService.generateFocusLabel();
    const interaction = stateData.interaction;
    const interactionId = interaction.id;
    let interactionHtml: string = '';

    if (interactionId) {
      interactionHtml = (
        this.explorationHtmlFormatterService.getInteractionHtml(
          interactionId, interaction.customizationArgs,
          true, this.focusLabel, null)
      );
    }

    return StateCard.createNewCard(
      stateData.name as string, questionHtml, interactionHtml as string,
      interaction, stateData.recordedVoiceovers, stateData.writtenTranslations,
      stateData.content.contentId as string,
      this.audioTranslationLanguageService
    );
  }

  static get MAX_ALLOWED_QUESTIONS_IN_THE_DIAGNOSTIC_TEST(): number {
    return AppConstants.MAX_ALLOWED_QUESTIONS_IN_THE_DIAGNOSTIC_TEST;
  }

  isDiagnosticTestFinished(): boolean {
    const lengthOfEligibleTopicIds = (
      this.diagnosticTestTopicTrackerModel.getEligibleTopicIds().length
    );

    if (lengthOfEligibleTopicIds === 0) {
      return true;
    }
    if (
      lengthOfEligibleTopicIds > 0 &&
        this.numberOfAttemptedQuestions >= DiagnosticTestPlayerEngineService
          .MAX_ALLOWED_QUESTIONS_IN_THE_DIAGNOSTIC_TEST
    ) {
      return true;
    }

    return false;
  }

  getCurrentQuestion(): Question {
    return this.currentQuestion;
  }

  getCurrentSkillId(): string {
    return this.currentSkillId;
  }

  getCurrentTopicId(): string {
    return this.currentTopicId;
  }

  getTotalNumberOfAttemptedQuestions(): number {
    return this.numberOfAttemptedQuestions;
  }

  getFailedTopicIds(): string[] {
    return this.diagnosticTestTopicTrackerModel.getFailedTopicIds();
  }
}
