// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for learner answer info.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { AppConstants } from 'app.constants';
import { State } from 'domain/state/StateObjectFactory.ts';
import { LearnerAnswerDetailsBackendApiService } from
  'domain/statistics/learner-answer-details-backend-api.service.ts';
import { AnswerClassificationService, InteractionRulesService } from
  'pages/exploration-player-page/services/answer-classification.service.ts';

@Injectable({
  providedIn: 'root'
})

export class LearnerAnswerInfoService {
  constructor(
    private answerClassificationService: AnswerClassificationService,
    private learnerAnswerDetailsBackendApiService:
      LearnerAnswerDetailsBackendApiService) {}

  private submittedAnswerInfoCount = 0;
  private currentEntityId: string = null;
  private stateName: string = null;
  private interactionId = null;
  private currentAnswer: string = null;
  private currentInteractionRulesService: InteractionRulesService = null;
  private canAskLearnerForAnswerInfo = false;
  private visitedStates: string[] = [];
  private probabilityIndexes = {
    // The probability that a request for explanation of the answer that is
    // submitted by the learner. There are three different probabilities
    // based on the outcome of the answer.
    // The probability index when the outcome is equal to the default outcome
    // for an interaction.
    typeA: 0.25,
    // The probability index when the outcome is marked as correct i.e
    // labelled_as_correct property is true.
    typeB: 0.10,
    // The probability index when the outcome is not the default outcome
    // and it is not marked as correct i.e. it is any general outcome.
    typeC: 0.05
  };

  getRandomProbabilityIndex(): number {
    const min = 0;
    const max = 100;
    return (Math.floor(Math.random() * (max - min + 1)) + min) / 100;
  }

  initLearnerAnswerInfoService(
      entityId: string, state: State, answer: string,
      interactionRulesService: InteractionRulesService,
      alwaysAskLearnerForAnswerInfo: boolean): void {
    this.currentEntityId = entityId;
    this.currentAnswer = answer;
    this.currentInteractionRulesService = interactionRulesService;
    this.stateName = state.name;
    this.interactionId = state.interaction.id;
    const defaultOutcome = state.interaction.defaultOutcome;

    if (this.submittedAnswerInfoCount === 2) {
      return;
    }

    if (!state.solicitAnswerDetails) {
      return;
    }

    if (AppConstants.INTERACTION_IDS_WITHOUT_ANSWER_DETAILS.indexOf(
      this.interactionId) !== -1) {
      return;
    }

    if (this.visitedStates.indexOf(this.stateName) !== -1) {
      return;
    }

    if (alwaysAskLearnerForAnswerInfo === true) {
      this.canAskLearnerForAnswerInfo = true;
      return;
    }

    const classificationResult = (
      this.answerClassificationService.getMatchingClassificationResult(
        this.stateName, state.interaction, answer,
        interactionRulesService));
    const outcome = classificationResult.outcome;
    let thresholdProbabilityIndex = null;
    const randomProbabilityIndex = this.getRandomProbabilityIndex();

    if (outcome === defaultOutcome) {
      thresholdProbabilityIndex = this.probabilityIndexes.typeA;
    } else if (outcome.labelledAsCorrect) {
      thresholdProbabilityIndex = this.probabilityIndexes.typeB;
    } else {
      thresholdProbabilityIndex = this.probabilityIndexes.typeC;
    }

    this.canAskLearnerForAnswerInfo = (
      randomProbabilityIndex <= thresholdProbabilityIndex);
  }

  resetSubmittedAnswerInfoCount(): void {
    this.submittedAnswerInfoCount = 0;
  }

  recordLearnerAnswerInfo(answerDetails: string): void {
    this.learnerAnswerDetailsBackendApiService.recordLearnerAnswerDetailsAsync(
      this.currentEntityId, this.stateName, this.interactionId,
      this.currentAnswer, answerDetails);
    this.submittedAnswerInfoCount++;
    this.visitedStates.push(this.stateName);
    this.canAskLearnerForAnswerInfo = false;
  }

  getCanAskLearnerForAnswerInfo(): boolean {
    return this.canAskLearnerForAnswerInfo;
  }

  getCurrentAnswer(): string {
    return this.currentAnswer;
  }

  getCurrentInteractionRulesService(): InteractionRulesService {
    return this.currentInteractionRulesService;
  }

  getSolicitAnswerDetailsQuestion(): string {
    var el = $('<p>');
    el.attr('translate', 'I18N_SOLICIT_ANSWER_DETAILS_QUESTION');
    return ($('<span>').append(el)).html();
  }

  getSolicitAnswerDetailsFeedback(): string {
    var el = $('<p>');
    el.attr('translate', 'I18N_SOLICIT_ANSWER_DETAILS_FEEDBACK');
    return ($('<span>').append(el)).html();
  }
}

angular.module('oppia').factory(
  'LearnerAnswerInfoService',
  downgradeInjectable(LearnerAnswerInfoService));
