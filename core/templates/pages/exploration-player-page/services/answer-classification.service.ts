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
import {
  AnswerClassificationResult, AnswerClassificationResultObjectFactory
} from 'domain/classifier/AnswerClassificationResultObjectFactory';
import { AnswerGroup } from 'domain/exploration/AnswerGroupObjectFactory';
import { Answer } from 'domain/exploration/AnswerStatsObjectFactory';
import { AppService } from 'services/app.service';
import { ExplorationPlayerConstants } from
  'pages/exploration-player-page/exploration-player-page.constants';
import { Interaction } from 'domain/exploration/InteractionObjectFactory';
import { InteractionSpecsService } from 'services/interaction-specs.service';
import { Outcome } from 'domain/exploration/OutcomeObjectFactory';
import { PredictionAlgorithmRegistryService }
  // eslint-disable-next-line max-len
  from 'pages/exploration-player-page/services/prediction-algorithm-registry.service';
import { State } from 'domain/state/StateObjectFactory';
import { StateClassifierMappingService } from
  'pages/exploration-player-page/services/state-classifier-mapping.service';

@Injectable({providedIn: 'root'})
export class AnswerClassificationService {
  constructor(
      private alertsService: AlertsService,
      private answerClassificationResultObjectFactory:
        AnswerClassificationResultObjectFactory,
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
      answer: Answer, answerGroups: AnswerGroup[], defaultOutcome: Outcome,
      interactionRulesService): AnswerClassificationResult {
    // Find the first group that contains a rule which returns true
    // TODO(bhenning): Implement training data classification.
    for (var i = 0; i < answerGroups.length; ++i) {
      const answerGroup = answerGroups[i];
      for (var j = 0; j < answerGroup.rules.length; ++j) {
        const rule = answerGroup.rules[j];
        if (interactionRulesService[rule.type](answer, rule.inputs)) {
          return this.answerClassificationResultObjectFactory.createNew(
            answerGroup.outcome, i, j,
            ExplorationPlayerConstants.EXPLICIT_CLASSIFICATION);
        }
      }
    }

    // If no rule in any answer group returns true, the default 'group' is
    // returned. Throws an error if the default outcome is not defined.
    if (defaultOutcome) {
      return this.answerClassificationResultObjectFactory.createNew(
        defaultOutcome, answerGroups.length, 0,
        ExplorationPlayerConstants.DEFAULT_OUTCOME_CLASSIFICATION);
    } else {
      this.alertsService.addWarning(
        'Something went wrong with the exploration.');
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
      stateName: string, interactionInOldState: Interaction, answer: Answer,
      interactionRulesService): AnswerClassificationResult {
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
    const interactionIsTrainable =
      this.interactionSpecsService.isInteractionTrainable(
        interactionInOldState.id);

    if (ruleBasedOutcomeIsDefault && interactionIsTrainable) {
      for (var i = 0; i < answerGroups.length; ++i) {
        const answerGroup = answerGroups[i];
        if (!answerGroup.trainingData) {
          continue;
        }
        for (const trainingDatum of answerGroup.trainingData) {
          if (angular.equals(answer, trainingDatum)) {
            return this.answerClassificationResultObjectFactory.createNew(
              answerGroup.outcome, i, null,
              ExplorationPlayerConstants.TRAINING_DATA_CLASSIFICATION);
          }
        }
      }
      if (this.appService.isMachineLearningClassificationEnabled()) {
        const classifier = (
          this.stateClassifierMappingService.getClassifier(stateName));
        if (classifier && classifier.classifierData &&
            classifier.algorithmId && classifier.dataSchemaVersion) {
          const predictionService = (
            this.predictionAlgorithmRegistryService.getPredictionService(
              classifier.algorithmId, classifier.dataSchemaVersion));
          // If prediction service exists, we run classifier. We return the
          // default outcome otherwise.
          if (predictionService) {
            const predictedAnswerGroupIndex = predictionService.predict(
              classifier.classifierData, answer);
            if (predictedAnswerGroupIndex === -1) {
              answerClassificationResult = (
                this.answerClassificationResultObjectFactory.createNew(
                  defaultOutcome, answerGroups.length, 0,
                  ExplorationPlayerConstants.DEFAULT_OUTCOME_CLASSIFICATION));
            }
            answerClassificationResult = (
              this.answerClassificationResultObjectFactory.createNew(
                answerGroups[predictedAnswerGroupIndex].outcome,
                predictedAnswerGroupIndex, null,
                ExplorationPlayerConstants.STATISTICAL_CLASSIFICATION));
          }
        }
      }
    }

    return answerClassificationResult;
  }

  isClassifiedExplicitlyOrGoesToNewState(
      stateName: string, state: State, answer: Answer,
      interactionRulesService): boolean {
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
