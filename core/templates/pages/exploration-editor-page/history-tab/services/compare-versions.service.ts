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

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { ExplorationChange } from 'domain/exploration/exploration-draft.model';
import { ExplorationMetadata, ExplorationMetadataObjectFactory } from 'domain/exploration/ExplorationMetadataObjectFactory';
import { ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { StateObjectsDict, StatesObjectFactory } from 'domain/exploration/StatesObjectFactory';
import { ExplorationDataService } from 'pages/exploration-editor-page/services/exploration-data.service';
import { ExplorationDiffService, StateData, StateLink } from 'pages/exploration-editor-page/services/exploration-diff.service';
import { VersionTreeService } from './version-tree.service';

export interface CompareVersionData {
  nodes: StateData;
  links: StateLink[];
  finalStateIds: string[];
  v1InitStateId: number;
  v2InitStateId: number;
  v1States: StateObjectsDict;
  v2States: StateObjectsDict;
  v1Metadata: ExplorationMetadata;
  v2Metadata: ExplorationMetadata;
}

@Injectable({
  providedIn: 'root'
})
export class CompareVersionsService {
  constructor(
    private explorationDataService: ExplorationDataService,
    private explorationDiffService: ExplorationDiffService,
    private explorationMetadataObjectFactory: ExplorationMetadataObjectFactory,
    private readOnlyExplorationBackendApiService:
      ReadOnlyExplorationBackendApiService,
    private statesObjectFactory: StatesObjectFactory,
    private versionTreeService: VersionTreeService,
  ) { }

  /**
     * Constructs the combined list of changes needed to get from v1 to v2.
     *
     * v1, v2 are version numbers. v1 must be an ancestor of v2.
     * directionForwards is true if changes are compared in increasing version
     * number, and false if changes are compared in decreasing version number.
     */
  _getCombinedChangeList(
      v1: number,
      v2: number,
      directionForwards: boolean
  ): ExplorationChange[] {
    let _treeParents = this.versionTreeService.getVersionTree();

    // Stores the path of version numbers from v1 to v2.
    let versionPath = [];
    while (v2 !== v1) {
      versionPath.push(v2);
      v2 = _treeParents[v2];
    }
    if (directionForwards) {
      versionPath.reverse();
    }

    // The full changelist that is applied to go from v1 to v2.
    let combinedChangeList: ExplorationChange[] = [];
    versionPath.forEach((version) => {
      let changeListForVersion = this.versionTreeService.getChangeList(version);
      if (!directionForwards) {
        changeListForVersion.reverse();
      }
      combinedChangeList = combinedChangeList.concat(changeListForVersion);
    });

    return combinedChangeList;
  }

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
   * Should be called after this.versionTreeService.init() is called.
   * Should satisfy v1 < v2.
   */
  getDiffGraphData(
      v1: number,
      v2: number
  ): Promise<CompareVersionData> {
    if (v1 > v2) {
      throw new Error('Tried to compare v1 > v2.');
    }
    return Promise.all([{
      v1Data: this.readOnlyExplorationBackendApiService.loadExplorationAsync(
        this.explorationDataService.explorationId, v1),
      v2Data: this.readOnlyExplorationBackendApiService.loadExplorationAsync(
        this.explorationDataService.explorationId, v2)
    }]).then(async(response) => {
      let v1StatesDict = (await response[0].v1Data).exploration.states;
      let v2StatesDict = (await response[0].v2Data).exploration.states;
      let v1MetadataDict = (await response[0].v1Data).exploration_metadata;
      let v2MetadataDict = (await response[0].v2Data).exploration_metadata;

      // Track changes from v1 to LCA, and then from LCA to v2.
      let lca = this.versionTreeService.findLCA(v1, v2);

      let v1States = this.statesObjectFactory.createFromBackendDict(
        v1StatesDict).getStateObjects();
      let v2States = this.statesObjectFactory.createFromBackendDict(
        v2StatesDict).getStateObjects();

      let diffGraphData = this.explorationDiffService.getDiffGraphData(
        v1States, v2States, [{
          changeList: this._getCombinedChangeList(lca, v1, false),
          directionForwards: false
        }, {
          changeList: this._getCombinedChangeList(lca, v2, true),
          directionForwards: true
        }]
      );

      let v1Metadata = (
        this.explorationMetadataObjectFactory.createFromBackendDict(
          v1MetadataDict
        )
      );
      let v2Metadata = (
        this.explorationMetadataObjectFactory.createFromBackendDict(
          v2MetadataDict
        )
      );

      return {
        nodes: diffGraphData.nodes,
        links: diffGraphData.links,
        finalStateIds: diffGraphData.finalStateIds,
        v1InitStateId: diffGraphData.originalStateIds[
          (await response[0].v1Data).exploration.init_state_name],
        v2InitStateId: diffGraphData.stateIds[
          (await response[0].v2Data).exploration.init_state_name],
        v1States: v1States,
        v2States: v2States,
        v1Metadata: v1Metadata,
        v2Metadata: v2Metadata
      };
    });
  }
}

angular.module('oppia').factory(
  'CompareVersionsService',
  downgradeInjectable(CompareVersionsService));
