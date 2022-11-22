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

import { downgradeInjectable } from '@angular/upgrade/static';
import { EventEmitter, Injectable } from '@angular/core';
import cloneDeep from 'lodash/cloneDeep';
import { ComputeGraphService, GraphData } from 'services/compute-graph.service';
import { ExplorationInitStateNameService } from 'pages/exploration-editor-page/services/exploration-init-state-name.service';
import { ExplorationStatesService } from 'pages/exploration-editor-page/services/exploration-states.service';

@Injectable({
  providedIn: 'root'
})
export class GraphDataService {
  // This property is initialized using int method and we need to do
  // non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  _graphData!: GraphData;
  updateGraphData = new EventEmitter();

  constructor(
    private computeGraphService: ComputeGraphService,
    private explorationInitStateNameService: ExplorationInitStateNameService,
    private explorationStatesService: ExplorationStatesService
  ) {}

  recompute(): void {
    if (!this.explorationInitStateNameService.savedMemento) {
      return;
    }

    let states = this.explorationStatesService.getStates();
    let initStateId = this.explorationInitStateNameService.savedMemento;
    this._graphData = this.computeGraphService.compute(initStateId, states);

    this.updateGraphData.emit(this._graphData);
  }

  /**
   * @return graphData - Directed graph visualization input. This object
   * includes the following keys:
   * - nodes: Objects with keys of nodeids and values of node names.
   * - links: list of objects. Each object represents a directed link
   *    between two nodes, and has keys 'source' and 'target', the values
   *    of which are the names of the corresponding nodes.
   * - initStateName: the name of the initial state.
   * - finalStateName: the name of the final state.
   */
  getGraphData(): GraphData {
    return cloneDeep(this._graphData);
  }
}

angular.module('oppia').factory(
  'GraphDataService', downgradeInjectable(GraphDataService));
