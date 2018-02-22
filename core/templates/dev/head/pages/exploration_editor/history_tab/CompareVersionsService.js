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
 * @fileoverview Service to compare versions of explorations.
 */

oppia.factory('CompareVersionsService', [
  '$http', '$q', 'VersionTreeService', 'ExplorationDataService',
  'ExplorationDiffService', 'StateObjectFactory', 'StatesObjectFactory',
  'ReadOnlyExplorationBackendApiService',
  function(
      $http, $q, VersionTreeService, ExplorationDataService,
      ExplorationDiffService, StateObjectFactory, StatesObjectFactory,
      ReadOnlyExplorationBackendApiService) {
    /**
     * Constructs the combined list of changes needed to get from v1 to v2.
     *
     * v1, v2 are version numbers. v1 must be an ancestor of v2.
     * directionForwards is true if changes are compared in increasing version
     * number, and false if changes are compared in decreasing version number.
     */
    var _getCombinedChangeList = function(v1, v2, directionForwards) {
      var _treeParents = VersionTreeService.getVersionTree();

      // Stores the path of version numbers from v1 to v2.
      var versionPath = [];
      while (v2 !== v1) {
        versionPath.push(v2);
        v2 = _treeParents[v2];
      }
      if (directionForwards) {
        versionPath.reverse();
      }

      // The full changelist that is applied to go from v1 to v2.
      var combinedChangeList = [];
      versionPath.forEach(function(version) {
        var changeListForVersion = VersionTreeService.getChangeList(version);
        if (!directionForwards) {
          changeListForVersion.reverse();
        }
        combinedChangeList = combinedChangeList.concat(changeListForVersion);
      });

      return combinedChangeList;
    };

    return {
      /**
       * Summarize changes to states and rules between v1 and v2.
       * Returns a promise for an object whose keys are 'initStateName',
       * 'v2InitStateName', 'finalStateName', 'nodes', 'nodeList' and 'links'.
       *
       * 'initStateName' and 'v2InitStateName' are the IDs of the initial states
       * of v1 and v2 respectively. 'finalStateName' is the ID of the final
       * state.
       *
       * 'nodes' is an object whose keys are state IDs (assigned
       * within the function) and whose value is an object with these keys:
       *  - 'newestStateName': the latest name of the state
       *  - 'originalStateName': the first encountered name for the state
       *  - 'stateProperty': 'changed', 'unchanged', 'added' or 'deleted'
       *
       * 'links' is a list of objects representing rules. The objects have keys:
       *  - 'source': source state of link
       *  - 'target': target state of link
       *  - 'linkProperty': 'added', 'deleted' or 'unchanged'
       *
       * Should be called after VersionTreeService.init() is called.
       * Should satisfy v1 < v2.
       */
      getDiffGraphData: function(v1, v2) {
        if (v1 > v2) {
          throw new Error('Tried to compare v1 > v2.');
        }
        return $q.all({
          v1Data: ReadOnlyExplorationBackendApiService.loadExploration(
            ExplorationDataService.explorationId, v1),
          v2Data: ReadOnlyExplorationBackendApiService.loadExploration(
            ExplorationDataService.explorationId, v2)
        }).then(function(response) {
          var v1StatesDict = response.v1Data.exploration.states;
          var v2StatesDict = response.v2Data.exploration.states;

          // Track changes from v1 to LCA, and then from LCA to v2.
          var lca = VersionTreeService.findLCA(v1, v2);

          var v1States = StatesObjectFactory.createFromBackendDict(
            v1StatesDict).getStateObjects();
          var v2States = StatesObjectFactory.createFromBackendDict(
            v2StatesDict).getStateObjects();

          var diffGraphData = ExplorationDiffService.getDiffGraphData(
            v1States, v2States, [{
              changeList: _getCombinedChangeList(lca, v1, false),
              directionForwards: false
            }, {
              changeList: _getCombinedChangeList(lca, v2, true),
              directionForwards: true
            }]
          );
          return {
            nodes: diffGraphData.nodes,
            links: diffGraphData.links,
            finalStateIds: diffGraphData.finalStateIds,
            v1InitStateId: diffGraphData.originalStateIds[
              response.v1Data.exploration.init_state_name],
            v2InitStateId: diffGraphData.stateIds[
              response.v2Data.exploration.init_state_name],
            v1States: v1States,
            v2States: v2States
          };
        });
      }
    };
  }
]);
