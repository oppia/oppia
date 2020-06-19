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
 * @fileoverview Service for handling all interactions with the version history
 * tree.
 */

import cloneDeep from 'lodash/cloneDeep';

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { IRevertChangeList, IExplorationChangeList } from
  'domain/exploration/ExplorationDraftObjectFactory';

export interface IExplorationSnapshot {
  'commit_message': string;
  'committer_id': string;
  'commit_type': string;
  'version_number': number;
  'created_on_ms': number;
  'commit_cmds': IExplorationChangeList[];
}

interface IExplorationSnapshots {
  [version: number]: IExplorationSnapshot;
}

@Injectable({
  providedIn: 'root'
})
export class VersionTreeService {
  private _snapshots: IExplorationSnapshots = null;
  private _treeParents: {} = null;

  init(snapshotsData: IExplorationSnapshot[]): void {
    this._treeParents = {};
    this._snapshots = {};
    var numberOfVersions = snapshotsData.length;

    // Populate _snapshots so _snapshots[i] corresponds to version i
    for (var i = 0; i < numberOfVersions; i++) {
      this._snapshots[i + 1] = snapshotsData[i];
    }

    // Generate the version tree of an exploration from its snapshots
    for (var versionNum = 2; versionNum <= numberOfVersions; versionNum++) {
      if (this._snapshots[versionNum].commit_type === 'revert') {
        for (
          var i = 0; i < this._snapshots[versionNum].commit_cmds.length; i++) {
          if (this._snapshots[versionNum].commit_cmds[i].cmd ===
              'AUTO_revert_version_number') {
            this._treeParents[versionNum] =
              (<IRevertChangeList> this._snapshots[versionNum].commit_cmds[i])
                .version_number;
          }
        }
      } else {
        this._treeParents[versionNum] = versionNum - 1;
      }
    }
    this._treeParents[1] = -1;
  }

  /**
   * Returns a object whose keys are the version number and whose value is
   * the parent of each version, where parent points to previous version
   * in general or reverted version if commit is a reversion.
   * The parent of the root (version 1) is -1.
   */
  getVersionTree(): {} {
    if (this._treeParents === null) {
      throw new Error('version tree not initialized.');
    }
    return this._treeParents;
  }

  // Finds lowest common ancestor of v1 and v2 in the version tree.
  findLCA(v1: number, v2: number): number {
    // Find paths from root to v1 and v2
    var pathToV1 = [];
    var pathToV2 = [];
    while (this._treeParents[v1] !== -1) {
      pathToV1.push(v1);
      if (this._treeParents[v1] === undefined) {
        throw new Error('Could not find parent of ' + v1);
      }
      v1 = this._treeParents[v1];
    }
    pathToV1.push(1);
    pathToV1.reverse();

    while (this._treeParents[v2] !== -1) {
      pathToV2.push(v2);
      if (this._treeParents[v2] === undefined) {
        throw new Error('Could not find parent of ' + v2);
      }
      v2 = this._treeParents[v2];
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
  }

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
  getChangeList(version: number): IExplorationChangeList[] {
    if (this._snapshots === null) {
      throw new Error('snapshots is not initialized');
    } else if (version === 1) {
      throw new Error('Tried to retrieve change list of version 1');
    }
    return cloneDeep(this._snapshots[version].commit_cmds);
  }
}

angular.module('oppia').factory(
  'VersionTreeService', downgradeInjectable(VersionTreeService));
