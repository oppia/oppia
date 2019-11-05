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
 * @fileoverview Service for computing a graphical representation of an
 * exploration.
 */

angular.module('oppia').factory('ComputeGraphService', [
  function() {
    var _computeGraphData = function(initStateId, states) {
      var nodes = {};
      var links = [];
      var finalStateIds = states.getFinalStateNames();

      states.getStateNames().forEach(function(stateName) {
        var interaction = states.getState(stateName).interaction;
        nodes[stateName] = stateName;
        if (interaction.id) {
          var groups = interaction.answerGroups;
          for (var h = 0; h < groups.length; h++) {
            links.push({
              source: stateName,
              target: groups[h].outcome.dest,
            });
          }

          if (interaction.defaultOutcome) {
            links.push({
              source: stateName,
              target: interaction.defaultOutcome.dest,
            });
          }
        }
      });

      return {
        finalStateIds: finalStateIds,
        initStateId: initStateId,
        links: links,
        nodes: nodes
      };
    };

    var _computeBfsTraversalOfStates = function(
        initStateId, states, sourceStateName) {
      var stateGraph = _computeGraphData(initStateId, states);
      var stateNamesInBfsOrder = [];
      var queue = [];
      var seen = {};
      seen[sourceStateName] = true;
      queue.push(sourceStateName);
      while (queue.length > 0) {
        var currStateName = queue.shift();
        stateNamesInBfsOrder.push(currStateName);
        for (var e = 0; e < stateGraph.links.length; e++) {
          var edge = stateGraph.links[e];
          var dest = edge.target;
          if (edge.source === currStateName && !seen.hasOwnProperty(dest)) {
            seen[dest] = true;
            queue.push(dest);
          }
        }
      }
      return stateNamesInBfsOrder;
    };

    return {
      compute: function(initStateId, states) {
        return _computeGraphData(initStateId, states);
      },
      computeBfsTraversalOfStates: function(
          initStateId, states, sourceStateName) {
        return _computeBfsTraversalOfStates(
          initStateId, states, sourceStateName);
      }
    };
  }
]);
