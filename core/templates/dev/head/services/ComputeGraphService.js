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

oppia.factory('ComputeGraphService', [
  'INTERACTION_SPECS', function(INTERACTION_SPECS) {
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

    return {
      compute: function(initStateId, states) {
        return _computeGraphData(initStateId, states);
      }
    };
  }
]);