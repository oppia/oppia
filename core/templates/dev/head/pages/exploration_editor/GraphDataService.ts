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

oppia.factory('GraphDataService', [
  'ComputeGraphService', 'ExplorationInitStateNameService',
  'ExplorationStatesService',
  function(
      ComputeGraphService, ExplorationInitStateNameService,
      ExplorationStatesService) {
    var _graphData = null;

    // Returns an object which can be treated as the input to a visualization
    // for a directed graph. The returned object has the following keys:
    //   - nodes: an object whose keys are node ids (equal to node names) and
    //       whose values are node names
    //   - links: a list of objects. Each object represents a directed link
    //       between two nodes, and has keys 'source' and 'target', the values
    //       of which are the names of the corresponding nodes.
    //   - initStateName: the name of the initial state.
    //   - finalStateName: the name of the final state.
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
      getGraphData: function() {
        return angular.copy(_graphData);
      }
    };
  }
]);
