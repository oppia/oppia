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
 * @fileoverview Service for computing a graphical representation of an
 * exploration.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ComputeGraphService {
  // TODO(#7176): Replace 'any' with exact type.As states.getFinalStateNames()
  // is being called hence we can't just set the states type to Object
  // since it will cause the typescript compilation to fail
  _computeGraphData(initStateId: string, states: any): any {
    let nodes = {};
    let links = [];
    let finalStateIds = states.getFinalStateNames();

    states.getStateNames().forEach(function(stateName) {
      let interaction = states.getState(stateName).interaction;
      nodes[stateName] = stateName;
      if (interaction.id) {
        let groups = interaction.answerGroups;
        for (let h = 0; h < groups.length; h++) {
          links.push({
            source: stateName,
            target: groups[h].outcome.dest,
          });
        }

        if (interaction.defaultOutcome) {
          links.push({
            source: stateName,
            target: interaction.defaultOutcome.dest,
          });
        }
      }
    });

    return {
      finalStateIds: finalStateIds,
      initStateId: initStateId,
      links: links,
      nodes: nodes
    };
  }
  // TODO(#7176): Replace 'any' with the exact type.
  _computeBfsTraversalOfStates(initStateId: string, states: any,
      sourceStateName: string): Array<any> {
    let stateGraph = this._computeGraphData(initStateId, states);
    let stateNamesInBfsOrder = [];
    let queue = [];
    let seen = {};
    seen[sourceStateName] = true;
    queue.push(sourceStateName);
    while (queue.length > 0) {
      let currStateName = queue.shift();
      stateNamesInBfsOrder.push(currStateName);
      for (let e = 0; e < stateGraph.links.length; e++) {
        let edge = stateGraph.links[e];
        let dest = edge.target;
        if (edge.source === currStateName && !seen.hasOwnProperty(dest)) {
          seen[dest] = true;
          queue.push(dest);
        }
      }
    }
    return stateNamesInBfsOrder;
  }
  // TODO(#7176): Replace 'any' with the exact type.
  compute(initStateId: string, states: any): Object {
    return this._computeGraphData(initStateId, states);
  }
  // TODO(#7176): Replace 'any' with the exact type.
  computeBfsTraversalOfStates(initStateId: string, states: any,
      sourceStateName: any): Array<any> {
    return this._computeBfsTraversalOfStates(
      initStateId, states, sourceStateName);
  }
}

angular.module('oppia').factory(
  'ComputeGraphService', downgradeInjectable(ComputeGraphService));
