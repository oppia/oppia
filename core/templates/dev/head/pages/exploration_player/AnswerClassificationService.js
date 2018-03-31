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

// TODO(bhenning): Find a better place for these constants.

// NOTE TO DEVELOPERS: These constants must be the same (in name and value) as
// the corresponding classification constants defined in core.domain.exp_domain.
oppia.constant('EXPLICIT_CLASSIFICATION', 'explicit');
oppia.constant('TRAINING_DATA_CLASSIFICATION', 'training_data_match');
oppia.constant('STATISTICAL_CLASSIFICATION', 'statistical_classifier');
oppia.constant('DEFAULT_OUTCOME_CLASSIFICATION', 'default_outcome');

oppia.factory('AnswerClassificationService', [
  'AlertsService', 'AnswerClassificationResultObjectFactory',
  'PredictionAlgorithmRegistryService', 'StateClassifierMappingService',
  'INTERACTION_SPECS', 'ENABLE_ML_CLASSIFIERS', 'EXPLICIT_CLASSIFICATION',
  'DEFAULT_OUTCOME_CLASSIFICATION', 'STATISTICAL_CLASSIFICATION',
  'RULE_TYPE_CLASSIFIER',
  function(
      AlertsService, AnswerClassificationResultObjectFactory,
      PredictionAlgorithmRegistryService, StateClassifierMappingService,
      INTERACTION_SPECS, ENABLE_ML_CLASSIFIERS, EXPLICIT_CLASSIFICATION,
      DEFAULT_OUTCOME_CLASSIFICATION, STATISTICAL_CLASSIFICATION,
      RULE_TYPE_CLASSIFIER) {
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
          if (rule.type !== RULE_TYPE_CLASSIFIER &&
              interactionRulesService[rule.type](
                answer, rule.inputs)) {
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

    /**
     * Finds the first rule that contains RULE_TYPE_CLASSIFIER as rule type.
     *
     * @param {object} answerGroup - An answer group of the interaction. Each
     *     answer group containts rule_specs which is a list of rules.
     *
     * @return {integer} The index of the retrieved rule with rule_type
     *     RULE_TYPE_CLASSIFIER.
     */
    var findClassifierRuleIndex = function(answerGroup) {
      for (var i = 0; i < answerGroup.rules.length; i++) {
        var rule = answerGroup.rules[i];
        if (rule.type === RULE_TYPE_CLASSIFIER) {
          return i;
        }
      }
      throw Error('Classifier Rule type is not present in this answer group.');
    };

    return {
      /**
       * Classifies the answer according to the answer groups. and returns the
       * corresponding answer classification result.
       *
       * @param {string} explorationId - The exploration ID.
       * @param {object} oldState - The state where the user submitted the
       *   answer.
       * @param {*} answer - The answer that the user has submitted.
       * @param {function} interactionRulesService - The service which contains
       *   the explicit rules of that interaction.
       *
       * @return {AnswerClassificationResult} The resulting
       *   AnswerClassificationResult domain object.
       */
      getMatchingClassificationResult: function(
          explorationId, stateName, oldState, answer, interactionRulesService) {
        var answerClassificationResult = null;

        var answerGroups = oldState.interaction.answerGroups;
        var defaultOutcome = oldState.interaction.defaultOutcome;
        if (interactionRulesService) {
          answerClassificationResult = classifyAnswer(
            answer, answerGroups, defaultOutcome, interactionRulesService);
        } else {
          AlertsService.addWarning(
            'Something went wrong with the exploration: no ' +
            'interactionRulesService was available.');
          throw Error(
            'No interactionRulesService was available to classify the answer.');
        }

        var ruleBasedOutcomeIsDefault = (
          answerClassificationResult.outcome === defaultOutcome);
        var interactionIsTrainable = INTERACTION_SPECS[
          oldState.interaction.id].is_trainable;

        if (ruleBasedOutcomeIsDefault && interactionIsTrainable &&
            ENABLE_ML_CLASSIFIERS) {
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
              answerClassificationResult = (
                AnswerClassificationResultObjectFactory.createNew(
                  answerGroups[predictedAnswerGroupIndex].outcome,
                  predictedAnswerGroupIndex,
                  findClassifierRuleIndex(
                    answerGroups[predictedAnswerGroupIndex]),
                  STATISTICAL_CLASSIFICATION));
            }
          }
        }

        return answerClassificationResult;
      },
      isClassifiedExplicitlyOrGoesToNewState: function(
          explorationId, stateName, state, answer, interactionRulesService) {
        var result = this.getMatchingClassificationResult(
          explorationId, stateName, state, answer, interactionRulesService);
        return (
          result.outcome.dest !== state.name ||
          result.classificationCategorization !==
            DEFAULT_OUTCOME_CLASSIFICATION);
      }
    };
  }
]);
