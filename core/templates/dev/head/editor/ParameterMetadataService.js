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
 * @fileoverview Service for computing parameter metadata.
 */

oppia.factory('parameterMetadataService', [
  'explorationStatesService', 'expressionInterpolationService',
  'explorationParamChangesService', 'graphDataService',
  function(
      explorationStatesService, expressionInterpolationService,
      explorationParamChangesService, graphDataService) {
    var PARAM_ACTION_GET = 'get';
    var PARAM_ACTION_SET = 'set';

    var PARAM_SOURCE_ANSWER = 'answer';
    var PARAM_SOURCE_CONTENT = 'content';
    var PARAM_SOURCE_FEEDBACK = 'feedback';
    var PARAM_SOURCE_PARAM_CHANGES = 'param_changes';

    var getMetadataFromParamChanges = function(paramChanges) {
      var result = [];

      for (var i = 0; i < paramChanges.length; i++) {
        var pc = paramChanges[i];

        if (pc.generator_id === 'Copier') {
          if (!pc.customization_args.parse_with_jinja) {
            result.push({
              action: PARAM_ACTION_SET,
              paramName: pc.name,
              source: PARAM_SOURCE_PARAM_CHANGES,
              sourceInd: i
            });
          } else {
            var paramsReferenced = (
              expressionInterpolationService.getParamsFromString(
                pc.customization_args.value));
            for (var j = 0; j < paramsReferenced.length; j++) {
              result.push({
                action: PARAM_ACTION_GET,
                paramName: paramsReferenced[j],
                source: PARAM_SOURCE_PARAM_CHANGES,
                sourceInd: i
              });
            }

            result.push({
              action: PARAM_ACTION_SET,
              paramName: pc.name,
              source: PARAM_SOURCE_PARAM_CHANGES,
              sourceInd: i
            });
          }
        } else {
          // RandomSelector. Elements in the list of possibilities are treated
          // as raw unicode strings, not expressions.
          result.push({
            action: PARAM_ACTION_SET,
            paramName: pc.name,
            source: PARAM_SOURCE_PARAM_CHANGES,
            sourceInd: i
          });
        }
      }

      return result;
    };

    // Returns a list of set/get actions for parameters in the given state, in
    // the order that they occur.
    // TODO(sll): Add trace data (so that it's easy to figure out in which rule
    // an issue occurred, say).
    var getStateParamMetadata = function(state) {
      // First, the state param changes are applied: we get their values
      // and set the params.
      var result = getMetadataFromParamChanges(state.param_changes);

      // Next, the content is evaluated.
      expressionInterpolationService.getParamsFromString(
          state.content[0].value).forEach(function(paramName) {
        result.push({
          action: PARAM_ACTION_GET,
          paramName: paramName,
          source: PARAM_SOURCE_CONTENT
        });
      });

      // Next, the answer is received.
      result.push({
        action: PARAM_ACTION_SET,
        paramName: 'answer',
        source: PARAM_SOURCE_ANSWER
      });

      // Finally, the rule feedback strings are evaluated.
      state.interaction.answer_groups.forEach(function(group) {
        for (var k = 0; k < group.outcome.feedback.length; k++) {
          expressionInterpolationService.getParamsFromString(
              group.outcome.feedback[k]).forEach(function(paramName) {
            result.push({
              action: PARAM_ACTION_GET,
              paramName: paramName,
              source: PARAM_SOURCE_FEEDBACK,
              sourceInd: k
            });
          });
        }
      });

      return result;
    };

    // Returns one of null, PARAM_ACTION_SET, PARAM_ACTION_GET depending on
    // whether this parameter is not used at all in this state, or
    // whether its first occurrence is a 'set' or 'get'.
    var getParamStatus = function(stateParamMetadata, paramName) {
      for (var i = 0; i < stateParamMetadata.length; i++) {
        if (stateParamMetadata[i].paramName === paramName) {
          return stateParamMetadata[i].action;
        }
      }
      return null;
    };

    return {
      // Returns a list of objects, each indicating a parameter for which it is
      // possible to arrive at a state with that parameter required but unset.
      // Each object in this list has two keys:
      // - paramName: the name of the parameter that may be unset
      // - stateName: the name of one of the states it is possible to reach
      //     with the parameter being unset, or null if the place where the
      //     parameter is required is in the initial list of parameter changes
      //     (e.g. one parameter may be set based on the value assigned to
      //     another parameter).
      getUnsetParametersInfo: function(initNodeIds) {
        var graphData = graphDataService.getGraphData();

        var states = explorationStatesService.getStates();

        // Determine all parameter names that are used within this exploration.
        var allParamNames = [];
        var expParamMetadata = getMetadataFromParamChanges(
          explorationParamChangesService.savedMemento);
        var stateParamMetadatas = {};

        expParamMetadata.forEach(function(expParamMetadataItem) {
          if (allParamNames.indexOf(expParamMetadataItem.paramName) === -1) {
            allParamNames.push(expParamMetadataItem.paramName);
          }
        });

        for (var stateName in states) {
          stateParamMetadatas[stateName] = getStateParamMetadata(
            states[stateName]);
          for (var i = 0; i < stateParamMetadatas[stateName].length; i++) {
            var pName = stateParamMetadatas[stateName][i].paramName;
            if (allParamNames.indexOf(pName) === -1) {
              allParamNames.push(pName);
            }
          }
        }

        // For each parameter, do a BFS to see if it's possible to get from
        // the start node to a node requiring this parameter, without passing
        // through any nodes that set this parameter.
        var unsetParametersInfo = [];

        for (var paramInd = 0; paramInd < allParamNames.length; paramInd++) {
          var paramName = allParamNames[paramInd];
          var tmpUnsetParameter = null;

          var paramStatusAtOutset = getParamStatus(expParamMetadata, paramName);
          if (paramStatusAtOutset === PARAM_ACTION_GET) {
            unsetParametersInfo.push({
              paramName: paramName,
              stateName: null
            });
            continue;
          } else if (paramStatusAtOutset === PARAM_ACTION_SET) {
            // This parameter will remain set for the entirety of the
            // exploration.
            continue;
          }

          var queue = [];
          var seen = {};
          for (var i = 0; i < initNodeIds.length; i++) {
            seen[initNodeIds[i]] = true;
            var paramStatus = getParamStatus(
              stateParamMetadatas[initNodeIds[i]], paramName);
            if (paramStatus === PARAM_ACTION_GET) {
              tmpUnsetParameter = {
                paramName: paramName,
                stateName: initNodeIds[i]
              };
              break;
            } else if (!paramStatus) {
              queue.push(initNodeIds[i]);
            }
          }

          if (tmpUnsetParameter) {
            unsetParametersInfo.push(angular.copy(tmpUnsetParameter));
            continue;
          }

          while (queue.length > 0) {
            var currNodeId = queue.shift();
            for (var edgeInd = 0; edgeInd < graphData.links.length; edgeInd++) {
              var edge = graphData.links[edgeInd];
              if (edge.source === currNodeId &&
                  !seen.hasOwnProperty(edge.target)) {
                seen[edge.target] = true;
                paramStatus = getParamStatus(
                  stateParamMetadatas[edge.target], paramName);
                if (paramStatus === PARAM_ACTION_GET) {
                  tmpUnsetParameter = {
                    paramName: paramName,
                    stateName: edge.target
                  };
                  break;
                } else if (!paramStatus) {
                  queue.push(edge.target);
                }
              }
            }
          }

          if (tmpUnsetParameter) {
            unsetParametersInfo.push(angular.copy(tmpUnsetParameter));
            continue;
          }
        }

        return unsetParametersInfo;
      }
    };
  }
]);
