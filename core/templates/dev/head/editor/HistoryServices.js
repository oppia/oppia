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
    return {
      /**
       * Generate the version tree of an exploration from its snapshots
       * Returns a object whose keys are the version number and value is
       * the parent of each version, where parent points to previous version
       * in general or reverted version if commit is a reversion.
       * The parent of the root (version 1) is -1
       */
      getVersionTree: function(snapshotsData) {
        var treeParents = {};
        var noOfVersions = snapshotsData.length;

        // Populate snapshots so snapshots[i] corresponds to version i
        for (var i = 0; i < noOfVersions; i++) {
          snapshots[i + 1] = snapshotsData[i];
        }

        for (var i = 2; i <= noOfVersions; i++) {
          var versionNumber = snapshots[i].version_number;
          if (snapshots[i].commit_type == 'revert') {
            for (var j = 0; j < snapshots[i].commit_cmds.length; j++) {
              if (snapshots[i].commit_cmds[j] == 'AUTO_revert_version_number') {
                treeParents[versionNumber] = snapshots[i].commit_cmds[j].version_number;
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
       * Finds lowest common ancestor of v1 and v2 in the version tree
       * treeParents is an object whose keys are the version number and values
       * are the parent of each version, where parent points to previous
       * version in general or reverted version if commit is a reversion.
       * The parent of the root (version 1) is -1
       */
      findLCA: function(treeParents, v1, v2) {
        // Find paths from root to v1 and v2, not including 1
        var pathToV1 = [];
        var pathToV2 = [];
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
          break;
        }
        return lca;
      }
    };
  }
]);
