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
 *
 * @author wxyxinyu@gmail.com (Xinyu Wu)
 */

// Service for handling all interactions with the version history tree
oppia.factory('versionsTreeService', [function() {
    var snapshots = {};
    var treeParents = null;
  return {
    /**
     * Returns a object whose keys are the version number and whose value is
     * the parent of each version, where parent points to previous version
     * in general or reverted version if commit is a reversion.
     * The parent of the root (version 1) is -1.
     */
    getVersionTree: function() {
      if (treeParents === null) {
        throw new Error('version tree not initialized.');
      }
      return treeParents;
    },
    // Generate the version tree of an exploration from its snapshots
    generateVersionTree: function(snapshotsData) {
      treeParents = {};
      var numberOfVersions = snapshotsData.length;

      // Populate snapshots so snapshots[i] corresponds to version i
      for (var i = 0; i < numberOfVersions; i++) {
        snapshots[i + 1] = snapshotsData[i];
      }

      for (var versionNumber = 2; versionNumber <= numberOfVersions; versionNumber++) {
        if (snapshots[versionNumber].commit_type == 'revert') {
          for (var i = 0; i < snapshots[versionNumber].commit_cmds.length; i++) {
            if (snapshots[versionNumber].commit_cmds[i].cmd == 'AUTO_revert_version_number') {
              treeParents[versionNumber] =
                  snapshots[versionNumber].commit_cmds[i].version_number;
            }
          }
        } else {
          treeParents[versionNumber] = versionNumber - 1;
        }
      }
      treeParents[1] = -1;
      return treeParents;
    },
    /**
     * Finds lowest common ancestor of v1 and v2 in the version tree.
     * treeParents is an object whose keys are the version number and whose
     * values are the parent of each version, where parent points to previous
     * version in general or reverted version if commit is a reversion.
     * The parent of the root (version 1) is -1.
     */
    findLCA: function(v1, v2) {
      // Find paths from root to v1 and v2
      var pathToV1 = [];
      var pathToV2 = [];
      while (treeParents[v1] != -1) {
        pathToV1.push(v1);
        if (treeParents[v1] === undefined) {
          throw new Error('Could not find parent of ' + v1);
        }
        v1 = treeParents[v1];
      }
      pathToV1.push(1);
      pathToV1.reverse();

      while (treeParents[v2] != -1) {
        pathToV2.push(v2);
        if (treeParents[v2] === undefined) {
          throw new Error('Could not find parent of ' + v2);
        }
        v2 = treeParents[v2];
      }
      pathToV2.push(1);
      pathToV2.reverse();

      // Compare paths
      var maxIndex = Math.min(pathToV1.length, pathToV2.length) - 1;
      var lca = null;
      for (var i = maxIndex; i >= 0; i--) {
        if (pathToV1[i] == pathToV2[i]) {
          lca = pathToV1[i];
          break;
        }
      }
      return lca;
    },
    /**
     * Returns the change list of a version of the exploration.
     * Should be called only after getVersionTree is called to initialize
     * snapshots. Should not be called to retrieve change list of version 1
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
      if (snapshots == {}) {
        throw new Error('snapshots is not initialized');
      }
      else if (version == 1) {
        throw new Error('Tried to retrieve change list of version 1');
      }
      return snapshots[version].commit_cmds;
    }
  };
}]);


oppia.factory('compareVersionsService', ['$http', '$q', 'versionsTreeService',
    'explorationData', function(
    $http, $q, versionsTreeService, explorationData) {
  return {
    /**
     * Summarize changes to each state between v1 and v2.
     * Returns a promise for an object whose keys are state IDs (assigned
     * within the function) and whose value is an object with these keys:
     *  - 'newestStateName': the latest name of the state
     *  - 'originalStateName': the first encountered name for the state
     *  - 'stateProperty': 'changed', 'unchanged', 'added' or 'deleted'
     *
     * Should be called after versionsTreeService.generateVersionTree is called.
     * Should satisfy v1 < v2.
     */
    getStatesData: function(v1, v2) {
      if (v1 > v2) throw new Error('Tried to compare v1 > v2.');
      var explorationDataUrl = '/createhandler/data/' +
          explorationData.explorationId + '?v=';
      var self = this;
      return $q.all({
        'v1Data': $http.get(explorationDataUrl + v1),
        'v2Data': $http.get(explorationDataUrl + v2)
      }).then(function(response) {
        var v1States = response.v1Data.data.states,
            v2States = response.v2Data.data.states;

        // Find initial stateIds and originalStateNames
        var maxId = 0;
        var statesData = {};
        var stateIds = {};
        for (var stateName in v1States) {
          maxId++;
          statesData[maxId] = {
            'newestStateName': stateName,
            'originalStateName': stateName,
            'stateProperty': 'unchanged'
          };
          stateIds[stateName] = maxId;
        }

        // Find changes from v1 to LCA and from LCA to v2
        var lca = versionsTreeService.findLCA(v1, v2);
        maxId = self._trackBackwardChanges(v1, lca, stateIds, statesData, maxId);
        self._trackForwardChanges(lca, v2, stateIds, statesData, maxId);

        // Remove changes back to original
        for (var stateId in statesData) {
          if (statesData[stateId].stateProperty == 'changed' &&
              v1States.hasOwnProperty(statesData[stateId].originalStateName) &&
              v2States.hasOwnProperty(statesData[stateId].newestStateName) &&
              angular.equals(v1States[statesData[stateId].originalStateName],
                  v2States[statesData[stateId].newestStateName])) {
            statesData[stateId].stateProperty = 'unchanged';
          }
        }

        return statesData;
      });
    },
    /**
     * A helper function for getStatesData. Tracks changes forwards from v1
     * to v2 and modifies stateIds and stateData accordingly. stateIds is an
     * object whose keys are the newest state name and whose values are the
     * assigned state id.
     * v1 must be an ancestor of v2.
     */
    _trackForwardChanges: function(v1, v2, stateIds, stateData, maxId) {
      var treeParents = versionsTreeService.getVersionTree();

      var nodeList = [];
      while (v2 != v1) {
        nodeList.push(v2);
        v2 = treeParents[v2];
      }
      nodeList.reverse();

      for (var i = 0; i < nodeList.length; i++) {
        var changeList = versionsTreeService.getChangeList(nodeList[i]);
        for (var j = 0; j < changeList.length; j++) {
          var change = changeList[j];
          if (change.cmd == 'add_state') {
            if (!stateIds.hasOwnProperty(change.state_name)) {
              maxId++;
              stateIds[change.state_name] = maxId;
            }
            var currentStateId = stateIds[change.state_name];
            if (stateData.hasOwnProperty(currentStateId) &&
                stateData[currentStateId].stateProperty == 'deleted') {
              stateData[currentStateId].stateProperty = 'changed';
              stateData[currentStateId].newestStateName = change.state_name;
            } else {
              stateData[stateIds[change.state_name]] = {
                'newestStateName': change.state_name,
                'originalStateName': change.state_name,
                'stateProperty': 'added'
              };
            }
          } else if (change.cmd == 'delete_state') {
            if (stateData[stateIds[change.state_name]].stateProperty == 'added') {
              stateData[stateIds[change.state_name]].stateProperty = 'changed';
            } else {
              stateData[stateIds[change.state_name]].stateProperty = 'deleted';
            }
          } else if (change.cmd == 'rename_state') {
            stateIds[change.new_state_name] = stateIds[change.old_state_name];
            delete stateIds[change.old_state_name];
            stateData[stateIds[change.new_state_name]].newestStateName = change.new_state_name;
          } else if (change.cmd == 'edit_state_property') {
            if (stateData[stateIds[change.state_name]].stateProperty == 'unchanged') {
              stateData[stateIds[change.state_name]].stateProperty = 'changed';
            }
          }
        }
      }
    },
    /**
     * A helper function for getStatesData. Tracks changes backwards from v1
     * to v2 and modifies stateIds and stateData accordingly. stateIds is an
     * object whose keys are the newest state name and whose values are the
     * assigned state id. maxId is the maximum state id assigned so far
     * v2 must be an ancestor of v1.
     * Returns maxId which is the maximum state id so far.
     */
    _trackBackwardChanges: function(v1, v2, stateIds, stateData, maxId) {
      var treeParents = versionsTreeService.getVersionTree();

      var nodeList = [];
      while (v1 != v2) {
        nodeList.push(v1);
        v1 = treeParents[v1];
      }

      for (var i = 0; i < nodeList.length; i++) {
        var changeList = versionsTreeService.getChangeList(nodeList[i]);
        for (var j = 0; j < changeList.length; j++) {
          var change = changeList[j];
          if (change.cmd == 'delete_state') {
            if (!stateIds.hasOwnProperty(change.state_name)) {
              maxId++;
              stateIds[change.state_name] = maxId;
            }
            var currentStateId = stateIds[change.state_name];
            if (stateData.hasOwnProperty(currentStateId) &&
                stateData[currentStateId].stateProperty == 'deleted') {
              stateData[currentStateId].stateProperty = 'changed';
              stateData[currentStateId].newestStateName = change.state_name;
            } else {
              stateData[stateIds[change.state_name]] = {
                'newestStateName': change.state_name,
                'originalStateName': change.state_name,
                'stateProperty': 'added'
              };
            }
          } else if (change.cmd == 'add_state') {
            if (stateData[stateIds[change.state_name]].stateProperty == 'added') {
              stateData[stateIds[change.state_name]].stateProperty = 'changed';
            } else {
              stateData[stateIds[change.state_name]].stateProperty = 'deleted';
            }
          } else if (change.cmd == 'rename_state') {
            stateIds[change.old_state_name] = stateIds[change.new_state_name];
            delete stateIds[change.new_state_name];
            stateData[stateIds[change.old_state_name]].newestStateName = change.old_state_name;
          } else if (change.cmd == 'edit_state_property') {
            if (stateData[stateIds[change.state_name]].stateProperty == 'unchanged') {
              stateData[stateIds[change.state_name]].stateProperty = 'changed';
            }
          }
        }
      }
      return maxId;
    }
  };
}]);
