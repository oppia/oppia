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

require('domain/classifier/AnswerClassificationResultObjectFactory.ts');
require(
  'pages/exploration-player-page/services/' +
  'prediction-algorithm-registry.service.ts');
require(
  'pages/exploration-player-page/services/state-classifier-mapping.service.ts');
require('services/alerts.service.ts');

require(
  'pages/exploration-player-page/exploration-player-page.constants.ajs.ts');
require('pages/interaction-specs.constants.ajs.ts');

angular.module('oppia').factory('AnswerClassificationService', [
  'AlertsService', 'AnswerClassificationResultObjectFactory',
  'PredictionAlgorithmRegistryService', 'StateClassifierMappingService',
  'DEFAULT_OUTCOME_CLASSIFICATION', 'ENABLE_ML_CLASSIFIERS',
  'EXPLICIT_CLASSIFICATION',
  'INTERACTION_SPECS', 'STATISTICAL_CLASSIFICATION',
  'TRAINING_DATA_CLASSIFICATION',
  function(
      AlertsService, AnswerClassificationResultObjectFactory,
      PredictionAlgorithmRegistryService, StateClassifierMappingService,
      DEFAULT_OUTCOME_CLASSIFICATION, ENABLE_ML_CLASSIFIERS,
      EXPLICIT_CLASSIFICATION,
      INTERACTION_SPECS, STATISTICAL_CLASSIFICATION,
      TRAINING_DATA_CLASSIFICATION) {
    /**
     * Finds the first answer group with a rule that returns true.
     *
     * @param {*} answer - The answer that the user has submitted.
     * @param {array} answerGroups - The answer groups of the interaction. Each
     *     answer group contains rule_specs, which is a list of rules.
     * @param {object} defaultOutcome - The default outcome of the interaction.
     * @param {function} interactionRulesService The service which contains the
     *     explicit rules of that interaction.
     *
     * @return {object} An AnswerClassificationResult domain object.
     */
    var classifyAnswer = function(
        answer, answerGroups, defaultOutcome, interactionRulesService) {
      // Find the first group that contains a rule which returns true
      // TODO(bhenning): Implement training data classification.
      for (var i = 0; i < answerGroups.length; i++) {
        for (var j = 0; j < answerGroups[i].rules.length; j++) {
          var rule = answerGroups[i].rules[j];
          if (interactionRulesService[rule.type](answer, rule.inputs)) {
            return AnswerClassificationResultObjectFactory.createNew(
              answerGroups[i].outcome, i, j, EXPLICIT_CLASSIFICATION);
          }
        }
      }

      // If no rule in any answer group returns true, the default 'group' is
      // returned. Throws an error if the default outcome is not defined.
      if (defaultOutcome) {
        return AnswerClassificationResultObjectFactory.createNew(
          defaultOutcome, answerGroups.length, 0, DEFAULT_OUTCOME_CLASSIFICATION
        );
      } else {
        AlertsService.addWarning('Something went wrong with the exploration.');
      }
    };

    return {
      /**
       * Classifies the answer according to the answer groups. and returns the
       * corresponding answer classification result.
       *
       * @param {string} stateName - The name of the state where the user
       *   submitted the answer.
       * @param {object} interactionInOldState - The interaction present in the
       *   state where the user submitted the answer.
       * @param {*} answer - The answer that the user has submitted.
       * @param {function} interactionRulesService - The service which contains
       *   the explicit rules of that interaction.
       *
       * @return {AnswerClassificationResult} The resulting
       *   AnswerClassificationResult domain object.
       */
      getMatchingClassificationResult: function(
          stateName, interactionInOldState, answer, interactionRulesService) {
        var answerClassificationResult = null;

        var answerGroups = interactionInOldState.answerGroups;
        var defaultOutcome = interactionInOldState.defaultOutcome;
        if (interactionRulesService) {
          answerClassificationResult = classifyAnswer(
            answer, answerGroups, defaultOutcome, interactionRulesService);
        } else {
          AlertsService.addWarning(
            'Something went wrong with the exploration: no ' +
            'interactionRulesService was available.');
          throw new Error(
            'No interactionRulesService was available to classify the answer.');
        }

        var ruleBasedOutcomeIsDefault = (
          answerClassificationResult.outcome === defaultOutcome);
        var interactionIsTrainable = INTERACTION_SPECS[
          interactionInOldState.id].is_trainable;

        if (ruleBasedOutcomeIsDefault && interactionIsTrainable) {
          for (var i = 0; i < answerGroups.length; i++) {
            if (answerGroups[i].trainingData) {
              for (var j = 0; j < answerGroups[i].trainingData.length; j++) {
                if (angular.equals(answer, answerGroups[i].trainingData[j])) {
                  return AnswerClassificationResultObjectFactory.createNew(
                    answerGroups[i].outcome, i, null,
                    TRAINING_DATA_CLASSIFICATION);
                }
              }
            }
          }
          if (ENABLE_ML_CLASSIFIERS) {
            var classifier = StateClassifierMappingService.getClassifier(
              stateName);
            if (classifier && classifier.classifierData && (
              classifier.algorithmId && classifier.dataSchemaVersion)) {
              var predictionService = (
                PredictionAlgorithmRegistryService.getPredictionService(
                  classifier.algorithmId, classifier.dataSchemaVersion));
              // If prediction service exists, we run classifier. We return the
              // default outcome otherwise.
              if (predictionService) {
                var predictedAnswerGroupIndex = predictionService.predict(
                  classifier.classifierData, answer);
                if (predictedAnswerGroupIndex === -1) {
                  answerClassificationResult = (
                    AnswerClassificationResultObjectFactory.createNew(
                      defaultOutcome, answerGroups.length, 0,
                      DEFAULT_OUTCOME_CLASSIFICATION));
                }
                answerClassificationResult = (
                  AnswerClassificationResultObjectFactory.createNew(
                    answerGroups[predictedAnswerGroupIndex].outcome,
                    predictedAnswerGroupIndex, null,
                    STATISTICAL_CLASSIFICATION));
              }
            }
          }
        }

        return answerClassificationResult;
      },
      isClassifiedExplicitlyOrGoesToNewState: function(
          stateName, state, answer, interactionRulesService) {
        var result = this.getMatchingClassificationResult(
          stateName, state.interaction, answer, interactionRulesService);
        return (
          result.outcome.dest !== state.name ||
          result.classificationCategorization !==
            DEFAULT_OUTCOME_CLASSIFICATION);
      }
    };
  }
]);
