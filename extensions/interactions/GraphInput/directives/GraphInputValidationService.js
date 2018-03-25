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
 * @fileoverview Validator service for the interaction.
 */

oppia.factory('GraphInputValidationService', [
  'WARNING_TYPES', 'baseInteractionValidationService',
  function(WARNING_TYPES, baseInteractionValidationService) {
    var VERTICES_LIMIT = 50;
    return {
      getCustomizationArgsWarnings: function(customizationArgs) {
        var warningsList = [];
        baseInteractionValidationService.requireCustomizationArguments(
          customizationArgs,
          ['graph', 'canEditEdgeWeight', 'canEditVertexLabel']);

        if (customizationArgs.graph.value.vertices.length > VERTICES_LIMIT) {
          warningsList.push({
            type: WARNING_TYPES.CRITICAL,
            message: (
              'The graph used in customization exceeds supported ' +
              'maximum number of vertices of ' + VERTICES_LIMIT + '.')
          });
        }

        if (!customizationArgs.graph.value.isWeighted &&
            customizationArgs.canEditEdgeWeight.value) {
          warningsList.push({
            type: WARNING_TYPES.CRITICAL,
            message: (
              'The learner cannot edit edge weights for an unweighted graph.')
          });
        }

        if (!customizationArgs.graph.value.isLabeled &&
            customizationArgs.canEditVertexLabel.value) {
          warningsList.push({
            type: WARNING_TYPES.CRITICAL,
            message: (
              'The learner cannot edit vertex labels for an unlabeled graph.')
          });
        }
        return warningsList;
      },
      getAllWarnings: function(
          stateName, customizationArgs, answerGroups, defaultOutcome) {
        var ISOMORPHISM_VERTICES_LIMIT = 10;

        var warningsList = [];

        warningsList = warningsList.concat(
          this.getCustomizationArgsWarnings(customizationArgs));

        warningsList = warningsList.concat(
          baseInteractionValidationService.getAllOutcomeWarnings(
            answerGroups, defaultOutcome, stateName));

        for (var i = 0; i < answerGroups.length; i++) {
          var rules = answerGroups[i].rules;
          for (var j = 0; j < rules.length; j++) {
            var rule = rules[j];
            try {
              if (rule.type === 'HasGraphProperty') {
                continue;
              } else if (rule.type === 'IsIsomorphicTo' &&
                  rule.inputs.g.vertices.length > ISOMORPHISM_VERTICES_LIMIT) {
                warningsList.push({
                  type: WARNING_TYPES.CRITICAL,
                  message: (
                    'The graph used in the rule ' + (j + 1) + ' in group ' +
                    (i + 1) + ' exceeds supported maximum number of vertices ' +
                    'of ' + ISOMORPHISM_VERTICES_LIMIT +
                    ' for isomorphism check.')
                });
              } else if (rule.inputs.g.vertices.length > VERTICES_LIMIT) {
                warningsList.push({
                  type: WARNING_TYPES.CRITICAL,
                  message: (
                    'The graph used in the rule ' + (j + 1) + ' in group ' +
                    (i + 1) + ' exceeds supported maximum number of vertices ' +
                    'of ' + VERTICES_LIMIT + '.')
                });
              }
            } catch (e) {
              warningsList.push({
                type: WARNING_TYPES.CRITICAL,
                message: (
                  'The rule ' + (j + 1) + ' in group ' + (i + 1) +
                  ' is invalid.')
              });
            }
          }
        }
        return warningsList;
      }
    };
  }]);
