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
 *
 * @author wxyxinyu@gmail.com (Xinyu Wu)
 */

oppia.factory('answerClassificationService', [
    '$http', '$q', 'learnerParamsService', function(
      $http, $q, learnerParamsService) {

  /**
   * Finds the first answer group with a rule that returns true. This should be
   * synced with classify() in reader.py.
   *
   * @param {*} answer The answer that the user has submitted.
   * @param {array} answerGroups The answer groups of the interaction. Each
   *     answer group contains rule_specs, which is a list of rules.
   * @param {object} defaultOutcome The default outcome of the interaction.
   * @param {function} interactionRulesService The service which contains the
   *     rules of that interaction.
   *
   * @return {object} An object representing the answer group with the
   *     following properties:
   * <ul>
   *   <li> **outcome**: the outcome of the answer group
   *   <li> **answerGroupIndex**: the index of the matched answer group
   *   <li> **ruleSpecIndex**: the index of the rule in the matched answer group
   * <ul>
   */
  var classifyAnswer = function(
      answer, answerGroups, defaultOutcome, interactionRulesService) {
    // Find the first group that contains a rule which returns true
    for (var i = 0; i < answerGroups.length; i++) {
      for (var j = 0; j < answerGroups[i].rule_specs.length; j++) {
        var ruleSpec = answerGroups[i].rule_specs[j];
        if (interactionRulesService[ruleSpec.rule_type](answer, ruleSpec.inputs)) {
          return {
            'outcome': answerGroups[i].outcome,
            'answerGroupIndex': i,
            'ruleSpecIndex': j
          };
        }
      }
    }

    // If no rule in any answer group returns true, the default 'group' is
    // returned. Throws an error if the default outcome is not defined.
    if (defaultOutcome) {
      return {
        'outcome': defaultOutcome,
        'answerGroupIndex': answerGroups.length,
        'ruleSpecIndex': 0
      };
    } else {
      warningsData.addWarning('No default outcome found.');
    }
  };

  return {
    /**
     * Gets a promise to the matching answer group.
     *
     * @param {string} explorationId The exploration ID.
     * @param {*} answer The answer that the user has submitted.
     * @param {object} oldState The state where the user submitted the answer.
     * @param {?function} interactionRulesService The service which contains the
     *     rules of that interaction. If this is undefined, then the function
     *     server-side classification.
     *
     * @return {promise} An promise for an object representing the answer group
     *     with the following properties:
     * <ul>
     *   <li> **outcome**: the outcome of the answer group
     *   <li> **answerGroupIndex**: the index of the matched answer group
     *   <li> **ruleSpecIndex**: the index of the rule in the matched answer group
     * <ul>
     */
    getMatchingClassificationResult: function(
        explorationId, oldState, answer, interactionRulesService) {
      var deferred = $q.defer();
      if (interactionRulesService) {
        var answerGroups = oldState.interaction.answer_groups;
        var defaultOutcome = oldState.interaction.default_outcome;

        deferred.resolve(classifyAnswer(
          answer, answerGroups, defaultOutcome, interactionRulesService));
      } else {
        var classifyUrl = '/explorehandler/classify/' + explorationId;
        $http.post(classifyUrl, {
          old_state: oldState,
          params: learnerParamsService.getAllParams(),
          answer: answer
        }).success(function(result) {
          deferred.resolve({
            outcome: result.outcome,
            ruleSpecIndex: result.rule_spec_index,
            answerGroupIndex: result.answer_group_index
          });
        });
      }
      return deferred.promise;
    },
    getMatchingEditorClassificationResult: function(
        explorationId, oldState, answer, interactionRulesService) {
      if (interactionRulesService) {
        var answerGroups = oldState.interaction.answer_groups;
        var defaultOutcome = oldState.interaction.default_outcome;
        return $q(classifyAnswer(
          answer, answerGroups, defaultOutcome, interactionRulesService));
      } else {
        // TODO(bhenning): Figure out a long-term solution for determining what
        // params should be passed to the batch classifier.
        var classifyUrl = '/explorehandler/classify/' + explorationId;
        return $http.post(classifyUrl, {
          old_state: oldState,
          params: {},
          answer: answer
        }).then(function(result) {
          return {
            outcome: result.outcome,
            ruleSpecIndex: result.rule_spec_index,
            answerGroupIndex: result.answer_group_index
          };
        });
      }
    },
  };
}]);
