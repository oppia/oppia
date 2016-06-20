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
 * @fileoverview Services for the exploration history tab.
 */

// Service for handling all interactions with the version history tree.
oppia.factory('versionsTreeService', [function() {
  var _snapshots = null;
  var _treeParents = null;
  return {
    init: function(snapshotsData) {
      _treeParents = {};
      _snapshots = {};
      var numberOfVersions = snapshotsData.length;

      // Populate _snapshots so _snapshots[i] corresponds to version i
      for (var i = 0; i < numberOfVersions; i++) {
        _snapshots[i + 1] = snapshotsData[i];
      }

      // Generate the version tree of an exploration from its snapshots
      for (var versionNum = 2; versionNum <= numberOfVersions; versionNum++) {
        if (_snapshots[versionNum].commit_type === 'revert') {
          for (var i = 0; i < _snapshots[versionNum].commit_cmds.length; i++) {
            if (_snapshots[versionNum].commit_cmds[i].cmd ==
                'AUTO_revert_version_number') {
              _treeParents[versionNum] =
                  _snapshots[versionNum].commit_cmds[i].version_number;
            }
          }
        } else {
          _treeParents[versionNum] = versionNum - 1;
        }
      }
      _treeParents[1] = -1;
    },
    /**
     * Returns a object whose keys are the version number and whose value is
     * the parent of each version, where parent points to previous version
     * in general or reverted version if commit is a reversion.
     * The parent of the root (version 1) is -1.
     */
    getVersionTree: function() {
      if (_treeParents === null) {
        throw new Error('version tree not initialized.');
      }
      return _treeParents;
    },
    // Finds lowest common ancestor of v1 and v2 in the version tree.
    findLCA: function(v1, v2) {
      // Find paths from root to v1 and v2
      var pathToV1 = [];
      var pathToV2 = [];
      while (_treeParents[v1] !== -1) {
        pathToV1.push(v1);
        if (_treeParents[v1] === undefined) {
          throw new Error('Could not find parent of ' + v1);
        }
        v1 = _treeParents[v1];
      }
      pathToV1.push(1);
      pathToV1.reverse();

      while (_treeParents[v2] !== -1) {
        pathToV2.push(v2);
        if (_treeParents[v2] === undefined) {
          throw new Error('Could not find parent of ' + v2);
        }
        v2 = _treeParents[v2];
      }
      pathToV2.push(1);
      pathToV2.reverse();

      // Compare paths
      var maxIndex = Math.min(pathToV1.length, pathToV2.length) - 1;
      var lca = null;
      for (var i = maxIndex; i >= 0; i--) {
        if (pathToV1[i] === pathToV2[i]) {
          lca = pathToV1[i];
          break;
        }
      }
      return lca;
    },
    /**
     * Returns the change list of a version of the exploration.
     * Should be called only after getVersionTree is called to initialize
     * _snapshots. Should not be called to retrieve change list of version 1.
     * Returns a list of objects with keys depending on type of commit:
     *  - 'cmd': type of commit; 'add_state', 'rename_state', 'delete_state',
     *           'edit_state_property' or 'revert'
     * for 'add_state' and 'delete_state':
     *  - 'state_name': added or deleted state name
     * for 'rename_state':
     *  - 'new_state_name': new state name
     *  - 'old_state_name': old state name
     * for 'edit_state_property': (edits to state content or rules)
     *  - 'new_value': object which represents new version of state
     *  - 'old_value': object which represents old version of state
     *  - 'state_name': name of state which was changed
     * for 'revert':
     *  - 'version_number': version number reverted to
     */
    getChangeList: function(version) {
      if (_snapshots === null) {
        throw new Error('snapshots is not initialized');
      } else if (version === 1) {
        throw new Error('Tried to retrieve change list of version 1');
      }
      return angular.copy(_snapshots[version].commit_cmds);
    }
  };
}]);

oppia.factory('compareVersionsService', [
  '$http', '$q', 'versionsTreeService', 'explorationData',
  'ExplorationDiffService',
  function(
      $http, $q, versionsTreeService, explorationData,
      ExplorationDiffService) {
    /**
     * Constructs the combined list of changes needed to get from v1 to v2.
     *
     * v1, v2 are version numbers. v1 must be an ancestor of v2.
     * directionForwards is true if changes are compared in increasing version
     * number, and false if changes are compared in decreasing version number.
     */
    var _getCombinedChangeList = function(v1, v2, directionForwards) {
      var _treeParents = versionsTreeService.getVersionTree();

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
        var changeListForVersion = versionsTreeService.getChangeList(version);
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
       * Should be called after versionsTreeService.init() is called.
       * Should satisfy v1 < v2.
       */
      getDiffGraphData: function(v1, v2) {
        if (v1 > v2) {
          throw new Error('Tried to compare v1 > v2.');
        }
        var explorationDataUrl = (
          '/createhandler/data/' + explorationData.explorationId + '?v=');
        return $q.all({
          v1Data: $http.get(explorationDataUrl + v1),
          v2Data: $http.get(explorationDataUrl + v2)
        }).then(function(response) {
          var v1States = response.v1Data.data.states;
          var v2States = response.v2Data.data.states;

          // Track changes from v1 to LCA, and then from LCA to v2.
          var lca = versionsTreeService.findLCA(v1, v2);

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
              response.v1Data.data.init_state_name],
            v2InitStateId: diffGraphData.stateIds[
              response.v2Data.data.init_state_name]
          };
        });
      }
    };
  }
]);
