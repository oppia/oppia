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
 * @fileoverview A service that lists all the exploration warnings.
 */

// When an unresolved answer's frequency exceeds this threshold, an exploration
// will be blocked from being published until the answer is resolved.
oppia.constant('UNRESOLVED_ANSWER_FREQUENCY_THRESHOLD', 5);

oppia.factory('ExplorationWarningsService', [
  '$injector', 'ExplorationParamChangesService', 'ExplorationStatesService',
  'ExpressionInterpolationService', 'GraphDataService',
  'ParameterMetadataService', 'StateTopAnswersStatsService',
  'SolutionValidityService', 'INTERACTION_SPECS', 'STATE_ERROR_MESSAGES',
  'UNRESOLVED_ANSWER_FREQUENCY_THRESHOLD', 'WARNING_TYPES',
  function(
      $injector, ExplorationParamChangesService, ExplorationStatesService,
      ExpressionInterpolationService, GraphDataService,
      ParameterMetadataService, StateTopAnswersStatsService,
      SolutionValidityService, INTERACTION_SPECS, STATE_ERROR_MESSAGES,
      UNRESOLVED_ANSWER_FREQUENCY_THRESHOLD, WARNING_TYPES) {
    var _warningsList = [];
    var stateWarnings = {};
    var hasCriticalStateWarning = false;

    var _getStatesWithoutInteractionIds = function() {
      var statesWithoutInteractionIds = [];

      var states = ExplorationStatesService.getStates();

      states.getStateNames().forEach(function(stateName) {
        if (!states.getState(stateName).interaction.id) {
          statesWithoutInteractionIds.push(stateName);
        }
      });

      return statesWithoutInteractionIds;
    };

    var _getStatesWithIncorrectSolution = function() {
      var statesWithIncorrectSolution = [];

      var states = ExplorationStatesService.getStates();
      states.getStateNames().forEach(function(stateName) {
        if (states.getState(stateName).interaction.solution &&
            !SolutionValidityService.isSolutionValid(stateName)) {
          statesWithIncorrectSolution.push(stateName);
        }
      });
      return statesWithIncorrectSolution;
    };

    // Returns a list of names of all nodes which are unreachable from the
    // initial node.
    //
    // Args:
    // - initNodeIds: a list of initial node ids
    // - nodes: an object whose keys are node ids, and whose values are node
    //     names
    // - edges: a list of edges, each of which is an object with keys 'source',
    //     and 'target'.
    var _getUnreachableNodeNames = function(
        initNodeIds, nodes, edges) {
      var queue = initNodeIds;
      var seen = {};
      for (var i = 0; i < initNodeIds.length; i++) {
        seen[initNodeIds[i]] = true;
      }
      while (queue.length > 0) {
        var currNodeId = queue.shift();
        edges.forEach(function(edge) {
          if (edge.source === currNodeId && !seen.hasOwnProperty(edge.target)) {
            seen[edge.target] = true;
            queue.push(edge.target);
          }
        });
      }

      var unreachableNodeNames = [];
      for (var nodeId in nodes) {
        if (!(seen.hasOwnProperty(nodes[nodeId]))) {
          unreachableNodeNames.push(nodes[nodeId]);
        }
      }

      return unreachableNodeNames;
    };

    // Given an array of objects with two keys 'source' and 'target', returns
    // an array with the same objects but with the values of 'source' and
    // 'target' switched. (The objects represent edges in a graph, and this
    // operation amounts to reversing all the edges.)
    var _getReversedLinks = function(links) {
      return links.map(function(link) {
        return {
          source: link.target,
          target: link.source,
        };
      });
    };

    // Verify that all parameters referred to in a state are guaranteed to
    // have been set beforehand.
    var _verifyParameters = function(initNodeIds) {
      var unsetParametersInfo = (
        ParameterMetadataService.getUnsetParametersInfo(initNodeIds));

      var paramWarningsList = [];
      unsetParametersInfo.forEach(function(unsetParameterData) {
        if (!unsetParameterData.stateName) {
          // The parameter value is required in the initial list of parameter
          // changes.
          paramWarningsList.push({
            type: WARNING_TYPES.CRITICAL,
            message: (
              'Please ensure the value of parameter "' +
              unsetParameterData.paramName +
              '" is set before it is referred to in the initial list of ' +
              'parameter changes.')
          });
        } else {
          // The parameter value is required in a subsequent state.
          paramWarningsList.push({
            type: WARNING_TYPES.CRITICAL,
            message: (
              'Please ensure the value of parameter "' +
              unsetParameterData.paramName +
              '" is set before using it in "' + unsetParameterData.stateName +
              '".')
          });
        }
      });

      return paramWarningsList;
    };

    var _getAnswerGroupIndexesWithEmptyClassifiers = function(state) {
      var indexes = [];
      var answerGroups = state.interaction.answerGroups;
      for (var i = 0; i < answerGroups.length; i++) {
        var group = answerGroups[i];
        if (group.rules.length === 0 &&
            group.trainingData.length === 0) {
          indexes.push(i);
        }
      }
      return indexes;
    };

    var _getStatesAndAnswerGroupsWithEmptyClassifiers = function() {
      var results = [];

      var states = ExplorationStatesService.getStates();

      states.getStateNames().forEach(function(stateName) {
        var groupIndexes = _getAnswerGroupIndexesWithEmptyClassifiers(
          states.getState(stateName));
        if (groupIndexes.length > 0) {
          results.push({
            groupIndexes: groupIndexes,
            stateName: stateName
          });
        }
      });

      return results;
    };

    var _getStatesWithUnresolvedAnswers = function() {
      return ExplorationStatesService.getStateNames().filter(
        function(stateName) {
          return StateTopAnswersStatsService.hasStateStats(stateName) &&
            StateTopAnswersStatsService.getUnresolvedStateStats(stateName).some(
              function(answerStats) {
                return answerStats.frequency >=
                  UNRESOLVED_ANSWER_FREQUENCY_THRESHOLD;
              });
        });
    };

    var _updateWarningsList = function() {
      _warningsList = [];
      stateWarnings = {};
      hasCriticalStateWarning = false;

      var _extendStateWarnings = function(stateName, newWarning) {
        if (stateWarnings.hasOwnProperty(stateName)) {
          stateWarnings[stateName].push(newWarning);
        } else {
          stateWarnings[stateName] = [newWarning];
        }
      };

      GraphDataService.recompute();
      var _graphData = GraphDataService.getGraphData();

      var _states = ExplorationStatesService.getStates();
      _states.getStateNames().forEach(function(stateName) {
        var interaction = _states.getState(stateName).interaction;
        if (interaction.id) {
          var validatorServiceName =
            _states.getState(stateName).interaction.id + 'ValidationService';
          var validatorService = $injector.get(validatorServiceName);
          var interactionWarnings = validatorService.getAllWarnings(
            stateName, interaction.customizationArgs,
            interaction.answerGroups, interaction.defaultOutcome);

          for (var j = 0; j < interactionWarnings.length; j++) {
            _extendStateWarnings(stateName, interactionWarnings[j].message);

            if (interactionWarnings[j].type === WARNING_TYPES.CRITICAL) {
              hasCriticalStateWarning = true;
            }
          }
        }
      });

      var statesWithoutInteractionIds = _getStatesWithoutInteractionIds();
      angular.forEach(statesWithoutInteractionIds, function(
          stateWithoutInteractionIds) {
        _extendStateWarnings(
          stateWithoutInteractionIds, STATE_ERROR_MESSAGES.ADD_INTERACTION);
      });

      var statesWithUnresolvedAnswers = _getStatesWithUnresolvedAnswers();
      angular.forEach(statesWithUnresolvedAnswers, function(stateName) {
        _extendStateWarnings(stateName, STATE_ERROR_MESSAGES.UNRESOLVED_ANSWER);
      });

      var statesWithIncorrectSolution = _getStatesWithIncorrectSolution();
      angular.forEach(statesWithIncorrectSolution, function(state) {
        _extendStateWarnings(state, STATE_ERROR_MESSAGES.INCORRECT_SOLUTION);
      });

      if (_graphData) {
        var unreachableStateNames = _getUnreachableNodeNames(
          [_graphData.initStateId], _graphData.nodes, _graphData.links, true);

        if (unreachableStateNames.length) {
          angular.forEach(unreachableStateNames, function(
              unreachableStateName) {
            _extendStateWarnings(
              unreachableStateName, STATE_ERROR_MESSAGES.STATE_UNREACHABLE);
          });
        } else {
          // Only perform this check if all states are reachable.
          var deadEndStates = _getUnreachableNodeNames(
            _graphData.finalStateIds, _graphData.nodes,
            _getReversedLinks(_graphData.links), false);
          if (deadEndStates.length) {
            angular.forEach(deadEndStates, function(deadEndState) {
              _extendStateWarnings(
                deadEndState, STATE_ERROR_MESSAGES.UNABLE_TO_END_EXPLORATION);
            });
          }
        }

        _warningsList = _warningsList.concat(_verifyParameters([
          _graphData.initStateId]));
      }

      if (Object.keys(stateWarnings).length) {
        var errorString = (
          Object.keys(stateWarnings).length > 1 ? 'cards have' : 'card has');
        _warningsList.push({
          type: WARNING_TYPES.ERROR,
          message: (
            'The following ' + errorString + ' errors: ' +
            Object.keys(stateWarnings).join(', ') + '.')
        });
      }

      var statesWithAnswerGroupsWithEmptyClassifiers = (
        _getStatesAndAnswerGroupsWithEmptyClassifiers());
      statesWithAnswerGroupsWithEmptyClassifiers.forEach(function(result) {
        var warningMessage = 'In \'' + result.stateName + '\'';
        if (result.groupIndexes.length !== 1) {
          warningMessage += ', the following answer groups have classifiers ';
          warningMessage += 'with no training data: ';
        } else {
          warningMessage += ', the following answer group has a classifier ';
          warningMessage += 'with no training data: ';
        }
        warningMessage += result.groupIndexes.join(', ');

        _warningsList.push({
          message: warningMessage,
          type: WARNING_TYPES.ERROR
        });
      });
    };

    return {
      countWarnings: function() {
        return _warningsList.length;
      },
      getAllStateRelatedWarnings: function() {
        return stateWarnings;
      },
      getWarnings: function() {
        return _warningsList;
      },
      hasCriticalWarnings: function() {
        return hasCriticalStateWarning || _warningsList.some(function(warning) {
          return warning.type === WARNING_TYPES.CRITICAL;
        });
      },
      updateWarnings: function() {
        _updateWarningsList();
      }
    };
  }
]);
