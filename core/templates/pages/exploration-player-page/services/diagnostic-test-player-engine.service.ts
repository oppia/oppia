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
import { InteractionSpecsConstants } from 'pages/interaction-specs.constants';
import { AlertsService } from 'services/alerts.service';
import { ContextService } from 'services/context.service';
import { ExplorationHtmlFormatterService } from 'services/exploration-html-formatter.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { AudioTranslationLanguageService } from
  'pages/exploration-player-page/services/audio-translation-language.service';
import { DiagnosticTestModelData } from 'pages/diagnostic-test-player-page/diagnostic-test.model';
import { DiagnosticTestTopicStateData } from 'pages/diagnostic-test-player-page/diagnostic-test-topic-state.model';
import { QuestionBackendApiService } from 'domain/question/question-backend-api.service';
import { TopicsAndSkillsDashboardBackendApiService, TopicIdToDiagnosticTestSkillIdsResponse } from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';

@Injectable({
    providedIn: 'root'
})
export class DiagnosticTestPlayerEngineService {
  private answerIsBeingProcessed: boolean = false;
  private questions: Question[] = [];
  private currentIndex: number = null;
  private nextIndex: number = null;
  private diagnosticTestModelData;
  private diagnosticTestTopicStateData;
  private currentQuestion;

  constructor(
    private alertsService: AlertsService,
    private answerClassificationService: AnswerClassificationService,
    private audioTranslationLanguageService: AudioTranslationLanguageService,
    private contextService: ContextService,
    private explorationHtmlFormatterService: ExplorationHtmlFormatterService,
    private expressionInterpolationService: ExpressionInterpolationService,
    private focusManagerService: FocusManagerService,
    private questionObjectFactory: QuestionObjectFactory,
    private questionBackendApiService: QuestionBackendApiService,
    private topicsAndSkillsDashboardBackendApiService:
    TopicsAndSkillsDashboardBackendApiService) {
  }

  getSkillIdToQuestionsDict(skillIds, questions) {
    let skillIdToQuestions = {};

    for (let skillId of skillIds) {
      skillIdToQuestions[skillId] = [];
    }

    for (let skillId of skillIds) {
      for (let question of questions) {
        let skillIds = question.getLinkedSkillIds();

        if (skillIds.indexOf(skillId)) {
          skillIdToQuestions[skillId].push(question);
        }
      }
    }
    return skillIdToQuestions;
  }

  init(
      config,
      diagnosticTestModelData,
      successCallback: (initialCard: StateCard, nextFocusLabel: string) => void,
      errorCallback?: () => void
  ) {
    let skillIdToQuestions = {};
    this.diagnosticTestModelData = diagnosticTestModelData;

    this.questionBackendApiService.fetchQuestionsAsync(
      config.skillList,
      config.questionCount,
      config.questionsSortedByDifficulty
    ).then((questionData) => {
      let questions = questionData.map(
        function(questionDict) {
          return this.questionObjectFactory.createFromBackendDict(
            questionDict);
      });

      skillIdToQuestions = this.getSkillIdToQuestionsDict(
        config.skillList, questions)

      this.diagnosticTestTopicStateData = new DiagnosticTestTopicStateData(
        skillIdToQuestions);

      this.createCard(successCallback, errorCallback);
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
          refresherExplorationId,
          missingPrerequisiteSkillId,
          remainOnCurrentCard: boolean,
          taggedSkillMisconceptionId: string,
          wasOldStateInitial,
          isFirstHit,
          isFinalQuestion: boolean,
          focusLabel: string) => void
  ): boolean {
    const answerString = answer as string;
    const oldState = this.currentQuestion.getStateData();
    const classificationResult = (
      this.answerClassificationService.getMatchingClassificationResult(
        null, oldState.interaction, answer,
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
      this.alertsService.addWarning('Question name should not be empty.');
      return;
    }

    const interactionId = oldState.interaction.id;
    const interactionIsInline = (
      !interactionId ||
      InteractionSpecsConstants.
        INTERACTION_SPECS[interactionId].display_mode ===
        AppConstants.INTERACTION_DISPLAY_MODE_INLINE);
    const refreshInteraction = (
      answerIsCorrect || interactionIsInline);

    // add comment
    const onSameCard = false;

    const _nextFocusLabel = this.focusManagerService.generateFocusLabel();
    let nextCard = null;
    // if (!isFinalQuestion) {
    //   let nextInteractionHtml = this.getNextInteractionHtml(_nextFocusLabel);

    //   questionHtml = questionHtml + this.getRandomSuffix();
    //   nextInteractionHtml = nextInteractionHtml + this.getRandomSuffix();
    //   nextCard = StateCard.createNewCard(
    //     'true', questionHtml, nextInteractionHtml,
    //     this.getNextStateData().interaction,
    //     this.getNextStateData().recordedVoiceovers,
    //     this.getNextStateData().writtenTranslations,
    //     this.getNextStateData().content.contentId,
    //     this.audioTranslationLanguageService
    //   );
    // }
    successCallback(
      nextCard, refreshInteraction, null,
      null,
      null, null, onSameCard, taggedSkillMisconceptionId,
      null, null, false, _nextFocusLabel);
    return answerIsCorrect;
  }

  createCard(
      successCallback:(initialCard: StateCard, nextFocusLabel: string) => void,
      errorCallback: () => void
  ) {
    const stateData = this.diagnosticTestTopicStateData.getNextQuestion();

    const questionHtml = this.makeQuestion(stateData, []);
    if (questionHtml === null) {
      this.alertsService.addWarning('Question name should not be empty.');
      errorCallback();
      return;
    }
    const interaction = stateData.interaction;
    const nextFocusLabel = this.focusManagerService.generateFocusLabel();

    const interactionId = interaction.id;
    let interactionHtml = null;

    if (interactionId) {
      interactionHtml = this.explorationHtmlFormatterService.getInteractionHtml(
        interactionId, interaction.customizationArgs, true, nextFocusLabel,
        null);
    }
    const initialCard =
      StateCard.createNewCard(
        null, questionHtml, interactionHtml, interaction,
        stateData.recordedVoiceovers,
        stateData.writtenTranslations, stateData.content.contentId,
        this.audioTranslationLanguageService);
    successCallback(initialCard, nextFocusLabel);
  }

  // Evaluate question string.
  private makeQuestion(
      newState: State, envs: Record<string, string>[]): string {
    return this.expressionInterpolationService.processHtml(
      newState.content.html, envs);
  }
}
