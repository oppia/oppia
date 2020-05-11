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

import { AppConstants } from 'app.constants';
import { ExplorationPlayerConstants } from
  'pages/exploration-player-page/exploration-player-page.constants';
import { InteractionSpecsConstants } from 'pages/interaction-specs.constants';

import { AlertsService } from 'services/alerts.service';
import {
  AnswerClassificationResult, AnswerClassificationResultObjectFactory
} from 'domain/classifier/AnswerClassificationResultObjectFactory';
import { AnswerGroup } from 'domain/exploration/AnswerGroupObjectFactory';
import { Interaction } from 'domain/exploration/InteractionObjectFactory';
import { Outcome } from 'domain/exploration/OutcomeObjectFactory';
import { PredictionAlgorithmRegistryService }
  // eslint-disable-next-line max-len
  from 'pages/exploration-player-page/services/prediction-algorithm-registry.service';
import { State } from 'domain/state/StateObjectFactory';
import { StateClassifierMappingService } from
  'pages/exploration-player-page/services/state-classifier-mapping.service';

type IRulesService = {[name: string]: (answer, inputs) => boolean};

@Injectable({providedIn: 'root'})
export class AnswerClassificationService {
  constructor(
      private alertsService: AlertsService,
      private answerClassificationResultObjectFactory:
        AnswerClassificationResultObjectFactory,
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
      answer, answerGroups: AnswerGroup[], defaultOutcome: Outcome,
      interactionRulesService: IRulesService): AnswerClassificationResult {
    // Find the first group that contains a rule which returns true
    // TODO(bhenning): Implement training data classification.
    for (var i = 0; i < answerGroups.length; i++) {
      for (var j = 0; j < answerGroups[i].rules.length; j++) {
        var rule = answerGroups[i].rules[j];
        if (interactionRulesService[rule.type](answer, rule.inputs)) {
          return this.answerClassificationResultObjectFactory.createNew(
            answerGroups[i].outcome, i, j,
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
      stateName: string, interactionInOldState: Interaction, answer: object,
      interactionRulesService: IRulesService): AnswerClassificationResult {
    var answerClassificationResult = null;

    var answerGroups = interactionInOldState.answerGroups;
    var defaultOutcome = interactionInOldState.defaultOutcome;
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

    var ruleBasedOutcomeIsDefault = (
      answerClassificationResult.outcome === defaultOutcome);
    var interactionIsTrainable = InteractionSpecsConstants.INTERACTION_SPECS[
      interactionInOldState.id].is_trainable;

    if (ruleBasedOutcomeIsDefault && interactionIsTrainable) {
      for (var i = 0; i < answerGroups.length; i++) {
        if (answerGroups[i].trainingData) {
          for (var j = 0; j < answerGroups[i].trainingData.length; j++) {
            if (angular.equals(answer, answerGroups[i].trainingData[j])) {
              return this.answerClassificationResultObjectFactory.createNew(
                answerGroups[i].outcome, i, null,
                ExplorationPlayerConstants.TRAINING_DATA_CLASSIFICATION);
            }
          }
        }
      }
      if (AppConstants.ENABLE_ML_CLASSIFIERS) {
        var classifier = this.stateClassifierMappingService.getClassifier(
          stateName);
        if (classifier && classifier.classifierData &&
            classifier.algorithmId && classifier.dataSchemaVersion) {
          var predictionService = (
            this.predictionAlgorithmRegistryService.getPredictionService(
              classifier.algorithmId, classifier.dataSchemaVersion));
          // If prediction service exists, we run classifier. We return the
          // default outcome otherwise.
          if (predictionService) {
            var predictedAnswerGroupIndex = predictionService.predict(
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
      stateName: string, state: State, answer: object,
      interactionRulesService: IRulesService): boolean {
    var result = this.getMatchingClassificationResult(
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
