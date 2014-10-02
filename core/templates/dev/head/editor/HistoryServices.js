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
oppia.factory('versionsTreeService', [
  '$http', '$log', 'explorationData', 'warningsData',
  function($http, $log, explorationData, warningsData) {
    var snapshots = [];
    return {
      getVersionTree: function(snapshotsData) {
        /**
         * Generate the version tree of an exploration from its snapshots
         * Returns a (1-indexed) dict of parent of each version,
         * where parent points to previous version in general or reverted
         * version if commit is a reversion.
         * The parent of the root (version 1) is -1
         */
        var treeParents = [];

        // reverse snapshots so snapshots[i] corresponds to version i + 1
        for (var i = 0; i < snapshotsData.length; i++) {
          snapshots[i] = snapshotsData[i];
        }
        snapshots.reverse();

        for (var i = 0; i < snapshots.length; i++) {
          if (snapshots[i].version_number != (i + 1)) {
            // warningsData.addWarning('Could not find version ' + i + 1);
            throw new Error('Could not find version ' + (i + 1));
          }
        }
        for (var i = 1; i < snapshots.length; i++) {
          var versionNumber = snapshots[i].version_number;
          if (snapshots[i].commit_type == 'revert') {
            treeParents[versionNumber] = snapshots[i].commit_cmds[0].version_number;
          } else {
            treeParents[versionNumber] = i;
          }
        }
        treeParents[1] = -1;
        return treeParents;
      },
      findLCA: function(treeParents, v1, v2) {
        // Finds lowest common ancestor of v1 and v2 in the version tree

        // Find paths from root to v1 and v2
        pathToV1 = [];
        pathToV2 = [];
        while (treeParents[v1] != -1) {
          pathToV1.push(v1);
          if (treeParents[v1] === undefined) {
            throw new Error('Could not find parent of ' + v1);
          }
          v1 = treeParents[v1];
        }
        pathToV1.reverse();
        while (treeParents[v2] != -1) {
          pathToV2.push(v2);
          if (treeParents[v2] === undefined) {
            throw new Error('Could not find parent of ' + v2);
          }
          v2 = treeParents[v2];
        }
        pathToV2.reverse();

        // Compare paths
        var lca = 1;
        var index = 0;
        var maxIndex = Math.min(pathToV1.length, pathToV2.length);
        while (pathToV1[index] == pathToV2[index] && index < maxIndex) {
          lca = pathToV1[index];
          index++;
        }
        return lca;
      }
    };
  }
]);
