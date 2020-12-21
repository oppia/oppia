// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for computing graph data.
 */

require(
  'pages/exploration-editor-page/services/' +
  'exploration-init-state-name.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require('services/compute-graph.service.ts');

angular.module('oppia').factory('GraphDataService', [
  'ComputeGraphService', 'ExplorationInitStateNameService',
  'ExplorationStatesService',
  function(
      ComputeGraphService, ExplorationInitStateNameService,
      ExplorationStatesService) {
    var _graphData = null;
    
    var _recomputeGraphData = function() {
      if (!ExplorationInitStateNameService.savedMemento) {
        return;
      }

      var states = ExplorationStatesService.getStates();
      var initStateId = ExplorationInitStateNameService.savedMemento;
      _graphData = ComputeGraphService.compute(initStateId, states);
    };

    return {
      recompute: function() {
        _recomputeGraphData();
      },

    /**
     * @return graphData - Direct graph visuapization input.
     * @return graphData.nodes - A nodes object.
     * @return graphData.links - List of direct links two of nodes.
     * @return graphData.finalStateIds - An array of state names.
     * @return graphData.initStateId - The name of initial state.
     * @return graphData.nodes.<stateName> - The name of the state.
     * @return graphData.links[i].source - The source node.
     * @return graphData.links[i].target - The target node.
     */
    
      getGraphData: function() {
        return angular.copy(_graphData);
      }
    };
  }
]);
