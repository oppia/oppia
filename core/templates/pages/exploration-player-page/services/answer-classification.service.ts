// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Classification service for answer groups.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AlertsService } from 'services/alerts.service';
import { AnswerClassificationResult } from 'domain/classifier/answer-classification-result.model';
import { AnswerGroup } from 'domain/exploration/AnswerGroupObjectFactory';
import { AppService } from 'services/app.service';
import { ExplorationPlayerConstants } from 'pages/exploration-player-page/exploration-player-page.constants';
import { InteractionAnswer, TextInputAnswer } from 'interactions/answer-defs';
import { Interaction } from 'domain/exploration/InteractionObjectFactory';
import { InteractionSpecsService } from 'services/interaction-specs.service';
import { Outcome } from 'domain/exploration/OutcomeObjectFactory';
import { PredictionAlgorithmRegistryService } from 'pages/exploration-player-page/services/prediction-algorithm-registry.service';
import { State } from 'domain/state/StateObjectFactory';
import { StateClassifierMappingService } from 'pages/exploration-player-page/services/state-classifier-mapping.service';
import { InteractionRuleInputs, TranslatableSetOfNormalizedString } from 'interactions/rule-input-defs';


export interface InteractionRulesService {
  [ruleName: string]: (
    answer: InteractionAnswer, ruleInputs: InteractionRuleInputs) => boolean;
}

@Injectable({providedIn: 'root'})
export class AnswerClassificationService {
  constructor(
      private alertsService: AlertsService,
      private appService: AppService,
      private interactionSpecsService: InteractionSpecsService,
      private predictionAlgorithmRegistryService:
        PredictionAlgorithmRegistryService,
      private stateClassifierMappingService: StateClassifierMappingService) {}

  /**
   * Finds the first answer group with a rule that returns true.
   *
   * @param answer - The answer that the user has submitted.
   * @param answerGroups - The answer groups of the interaction. Each answer
   *     group contains rule_specs, which is a list of rules.
   * @param defaultOutcome - The default outcome of the interaction.
   * @param interactionRulesService The service which contains the explicit
   *     rules of that interaction.
   *
   * @return AnswerClassificationResult domain object.
   */
  private classifyAnswer(
      answer: InteractionAnswer,
      answerGroups: AnswerGroup[],
      defaultOutcome: Outcome | null,
      interactionRulesService: InteractionRulesService
  ): AnswerClassificationResult {
    // Find the first group that contains a rule which returns true
    // TODO(bhenning): Implement training data classification.
    for (var i = 0; i < answerGroups.length; ++i) {
      const answerGroup = answerGroups[i];
      for (var j = 0; j < answerGroup.rules.length; ++j) {
        const rule = answerGroup.rules[j];
        if (interactionRulesService[rule.type](answer, rule.inputs)) {
          return new AnswerClassificationResult(
            answerGroup.outcome, i, j,
            ExplorationPlayerConstants.EXPLICIT_CLASSIFICATION);
        }
      }
    }

    // If no rule in any answer group returns true, the default 'group' is
    // returned. Throws an error if the default outcome is not defined.
    if (defaultOutcome) {
      return new AnswerClassificationResult(
        defaultOutcome, answerGroups.length, 0,
        ExplorationPlayerConstants.DEFAULT_OUTCOME_CLASSIFICATION);
    } else {
      this.alertsService.addWarning(
        'Something went wrong with the exploration.');
      throw new Error(
        'No defaultOutcome was available to classify the answer.');
    }
  }

  /**
   * Classifies the answer according to the answer groups. and returns the
   * corresponding answer classification result.
   *
   * @param stateName - The name of the state where the user submitted the
   *     answer.
   * @param interactionInOldState - The interaction present in the state where
   *     the user submitted the answer.
   * @param answer - The answer that the user has submitted.
   * @param interactionRulesService - The service which contains the explicit
   *     rules of that interaction.
   *
   * @return The resulting AnswerClassificationResult domain object.
   */
  getMatchingClassificationResult(
      stateName: string,
      interactionInOldState: Interaction,
      answer: InteractionAnswer,
      interactionRulesService: InteractionRulesService):
      AnswerClassificationResult {
    var answerClassificationResult = null;

    const answerGroups = interactionInOldState.answerGroups;
    const defaultOutcome = interactionInOldState.defaultOutcome;
    if (interactionRulesService) {
      answerClassificationResult = this.classifyAnswer(
        answer, answerGroups, defaultOutcome, interactionRulesService);
    } else {
      this.alertsService.addWarning(
        'Something went wrong with the exploration: no ' +
        'interactionRulesService was available.');
      throw new Error(
        'No interactionRulesService was available to classify the answer.');
    }

    const ruleBasedOutcomeIsDefault = (
      answerClassificationResult.outcome === defaultOutcome);
    let interactionIsTrainable = false;
    if (interactionInOldState.id !== null) {
      interactionIsTrainable = (
        this.interactionSpecsService.isInteractionTrainable(
          interactionInOldState.id));
    }

    if (ruleBasedOutcomeIsDefault && interactionIsTrainable) {
      for (var i = 0; i < answerGroups.length; ++i) {
        const answerGroup = answerGroups[i];
        if (!answerGroup.trainingData) {
          continue;
        }
        for (const trainingDatum of answerGroup.trainingData) {
          if (angular.equals(answer, trainingDatum)) {
            return new AnswerClassificationResult(
              answerGroup.outcome, i, null,
              ExplorationPlayerConstants.TRAINING_DATA_CLASSIFICATION);
          }
        }
      }
      if (this.appService.isMachineLearningClassificationEnabled()) {
        const classifier = (
          this.stateClassifierMappingService.getClassifier(stateName));
        if (classifier && classifier.classifierData &&
            classifier.algorithmId && classifier.algorithmVersion) {
          const predictionService = (
            this.predictionAlgorithmRegistryService.getPredictionService(
              classifier.algorithmId, classifier.algorithmVersion));
          // If prediction service exists, we run classifier. We return the
          // default outcome otherwise.
          if (predictionService) {
            const predictedAnswerGroupIndex = predictionService.predict(
              classifier.classifierData, answer);
            if (predictedAnswerGroupIndex === -1) {
              answerClassificationResult = (
                new AnswerClassificationResult(
                  defaultOutcome as Outcome, answerGroups.length, 0,
                  ExplorationPlayerConstants.DEFAULT_OUTCOME_CLASSIFICATION));
            } else {
              answerClassificationResult = (
                new AnswerClassificationResult(
                  answerGroups[predictedAnswerGroupIndex].outcome,
                  predictedAnswerGroupIndex, null,
                  ExplorationPlayerConstants.STATISTICAL_CLASSIFICATION));
            }
          }
        }
      }
    }

    return answerClassificationResult;
  }

  checkForMisspellings(
      answer: TextInputAnswer, inputStrings: string[]
  ): boolean {
    const normalizedAnswer = answer.toLowerCase();
    const normalizedInput = inputStrings.map(
      input => input.toLowerCase());
    return normalizedInput.some(
      input => this.checkEditDistance(
        input, normalizedAnswer,
        ExplorationPlayerConstants.THRESHOLD_EDIT_DISTANCE_FOR_MISSPELLINGS));
  }

  checkEditDistance(
      inputString: string,
      matchString: string,
      requiredEditDistance: number
  ): boolean {
    if (inputString === matchString) {
      return true;
    }
    var editDistance = [];
    for (var i = 0; i <= inputString.length; i++) {
      editDistance.push([i]);
    }
    for (var j = 1; j <= matchString.length; j++) {
      editDistance[0].push(j);
    }
    for (var i = 1; i <= inputString.length; i++) {
      for (var j = 1; j <= matchString.length; j++) {
        if (inputString.charAt(i - 1) === matchString.charAt(j - 1)) {
          editDistance[i][j] = editDistance[i - 1][j - 1];
        } else {
          editDistance[i][j] = Math.min(
            editDistance[i - 1][j - 1], editDistance[i][j - 1],
            editDistance[i - 1][j]) + 1;
        }
      }
    }
    return (
      editDistance[inputString.length][matchString.length] <=
      requiredEditDistance);
  }

  isAnswerOnlyMisspelled(
      interaction: Interaction,
      answer: string
  ): boolean {
    if (answer.length <
      ExplorationPlayerConstants.MIN_ANSWER_LENGTH_TO_CHECK_MISSPELLINGS) {
      return false;
    }
    var answerIsMisspelled = false;
    const answerGroups = interaction.answerGroups;
    for (var i = 0; i < answerGroups.length; ++i) {
      const answerGroup = answerGroups[i];
      if (answerGroup.outcome.labelledAsCorrect) {
        for (var j = 0; j < answerGroup.rules.length; ++j) {
          let rule = answerGroup.rules[j];
          let inputStrings = (
            rule.inputs.x as TranslatableSetOfNormalizedString)
            .normalizedStrSet;
          if (this.checkForMisspellings(
            answer,
            inputStrings
          )) {
            return true;
          }
        }
      }
    }
    return answerIsMisspelled;
  }

  isClassifiedExplicitlyOrGoesToNewState(
      stateName: string, state: State, answer: InteractionAnswer,
      interactionRulesService: InteractionRulesService): boolean {
    const result = this.getMatchingClassificationResult(
      stateName, state.interaction, answer, interactionRulesService);
    return (
      result.outcome.dest !== state.name ||
      result.classificationCategorization !==
        ExplorationPlayerConstants.DEFAULT_OUTCOME_CLASSIFICATION);
  }
}

angular.module('oppia').factory(
  'AnswerClassificationService',
  downgradeInjectable(AnswerClassificationService));
