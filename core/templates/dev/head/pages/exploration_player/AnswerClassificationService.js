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
oppia.constant('EXPLICIT_CLASSIFICATION', 'explicit')
oppia.constant('TRAINING_DATA_CLASSIFICATION', 'training_data_match')
oppia.constant('STATISTICAL_CLASSIFICATION', 'statistical_classifier')
oppia.constant('DEFAULT_OUTCOME_CLASSIFICATION', 'default_outcome')

oppia.factory('AnswerClassificationService', [
  '$http', '$q', 'LearnerParamsService', 'alertsService', 'INTERACTION_SPECS',
  'ENABLE_STRING_CLASSIFIER', 'EXPLICIT_CLASSIFICATION',
  'DEFAULT_OUTCOME_CLASSIFICATION', 'CLASSIFIER_RULESPEC_STR',
  function($http, $q, LearnerParamsService, alertsService, INTERACTION_SPECS,
      ENABLE_STRING_CLASSIFIER, EXPLICIT_CLASSIFICATION,
      DEFAULT_OUTCOME_CLASSIFICATION, CLASSIFIER_RULESPEC_STR) {
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
     * @return {object} An object representing the answer group with the
     *     following properties:
     * <ul>
     *   <li> **outcome**: the outcome of the answer group
     *   <li> **answerGroupIndex**: the index of the matched answer group
     *   <li> **ruleSpecIndex**: the index of the rule in the matched answer
     *     group.
     * </ul>
     */
    var classifyAnswer = function(
        answer, answerGroups, defaultOutcome, interactionRulesService) {
      // Find the first group that contains a rule which returns true
      // TODO(bhenning): Implement training data classification.
      for (var i = 0; i < answerGroups.length; i++) {
        for (var j = 0; j < answerGroups[i].rule_specs.length; j++) {
          var ruleSpec = answerGroups[i].rule_specs[j];
          if (ruleSpec.rule_type !== CLASSIFIER_RULESPEC_STR &&
              interactionRulesService[ruleSpec.rule_type](
                answer, ruleSpec.inputs)) {
            return {
              outcome: answerGroups[i].outcome,
              answerGroupIndex: i,
              ruleSpecIndex: j,
              classificationCategorization: EXPLICIT_CLASSIFICATION
            };
          }
        }
      }

      // If no rule in any answer group returns true, the default 'group' is
      // returned. Throws an error if the default outcome is not defined.
      if (defaultOutcome) {
        return {
          outcome: defaultOutcome,
          answerGroupIndex: answerGroups.length,
          ruleSpecIndex: 0,
          classificationCategorization: DEFAULT_OUTCOME_CLASSIFICATION
        };
      } else {
        alertsService.addWarning('Something went wrong with the exploration.');
      }
    };

    return {
      /**
       * Gets a promise to the matching answer group.
       *
       * @param {string} explorationId - The exploration ID.
       * @param {object} oldState - The state where the user submitted the
       *   answer.
       * @param {*} answer - The answer that the user has submitted.
       * @param {boolean} isInEditorMode - Whether the function is being called
       *   in editor mode.
       * @param {function} interactionRulesService - The service which contains
       *   the explicit rules of that interaction.
       *
       * @return {promise} A promise for an object representing the answer group
       *     with the following properties:
       * <ul>
       *   <li> **outcome**: the outcome of the answer group
       *   <li> **answerGroupIndex**: the index of the matched answer group
       *   <li> **ruleSpecIndex**: the index of the rule in the matched answer
       *            group
       * </ul>
       */
      getMatchingClassificationResult: function(
          explorationId, oldState, answer, isInEditorMode,
          interactionRulesService) {
        var deferred = $q.defer();
        var result = null;
        var answerGroups = oldState.interaction.answer_groups;
        var defaultOutcome = oldState.interaction.default_outcome;

        if (interactionRulesService) {
          result = classifyAnswer(
            answer, answerGroups, defaultOutcome, interactionRulesService);
        } else {
          alertsService.addWarning(
            'Something went wrong with the exploration: no ' +
            'interactionRulesService was available.');
          deferred.reject();
          return deferred.promise;
        }

        if (result.outcome === defaultOutcome &&
            INTERACTION_SPECS[oldState.interaction.id]
              .is_string_classifier_trainable &&
            ENABLE_STRING_CLASSIFIER) {
          var classifyUrl = '/explorehandler/classify/' + explorationId;
          var params = (
            isInEditorMode ? {} : LearnerParamsService.getAllParams());

          $http.post(classifyUrl, {
            old_state: oldState.toBackendDict(),
            params: params,
            answer: answer
          }).then(function(response) {
            var result = response.data;
            deferred.resolve({
              outcome: result.outcome,
              ruleSpecIndex: result.rule_spec_index,
              answerGroupIndex: result.answer_group_index,
              classificationCategorization: result.classification_categorization
            });
          });
        } else {
          deferred.resolve(result);
        }
        return deferred.promise;
      }
    };
  }
]);
