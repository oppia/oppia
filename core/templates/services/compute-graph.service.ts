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

import { States } from 'domain/exploration/StatesObjectFactory';

export interface GraphLink {
  source: string;
  target: string;
  linkProperty: string | null;
  connectsDestIfStuck: boolean;
}

export interface GraphNodes {
  [stateName: string]: string;
}

export interface GraphData {
  finalStateIds: string[];
  initStateId: string;
  links: GraphLink[];
  nodes: GraphNodes;
}

@Injectable({
  providedIn: 'root'
})
export class ComputeGraphService {
  _computeGraphData(initStateId: string, states: States): GraphData {
    let nodes: Record<string, string> = {};
    let links: GraphLink[] = [];
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
            linkProperty: null,
            connectsDestIfStuck: false
          });
          if (groups[h].outcome.destIfReallyStuck) {
            links.push({
              source: stateName,
              // This throws "TS2322: Type 'string | null' is not assignable
              // to type 'string'" We need to suppress this error because the
              // value is explicitly checked above in the if condition. This
              // error is thrown because the type of outcome.destIfReallyStuck
              // is string | null.
              // @ts-ignore
              target: groups[h].outcome.destIfReallyStuck,
              linkProperty: null,
              connectsDestIfStuck: true
            });
          }
        }

        if (interaction.defaultOutcome) {
          links.push({
            source: stateName,
            target: interaction.defaultOutcome.dest,
            linkProperty: null,
            connectsDestIfStuck: false
          });
          if (interaction.defaultOutcome.destIfReallyStuck) {
            links.push({
              source: stateName,
              target: interaction.defaultOutcome.destIfReallyStuck,
              linkProperty: null,
              connectsDestIfStuck: true
            });
          }
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

  _computeBfsTraversalOfStates(
      initStateId: string, states: States, sourceStateName: string): string[] {
    let stateGraph = this._computeGraphData(initStateId, states);
    let stateNamesInBfsOrder: string[] = [];
    let queue: string[] = [];
    let seen: Record<string, boolean> = {};
    seen[sourceStateName] = true;
    queue.push(sourceStateName);
    while (queue.length > 0) {
      // '.shift()' here can return an undefined value, but we're already
      // checking for queue.length > 0, so this is safe.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      let currStateName = queue.shift()!;
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

  compute(initStateId: string, states: States): GraphData {
    return this._computeGraphData(initStateId, states);
  }

  computeBfsTraversalOfStates(
      initStateId: string, states: States, sourceStateName: string): string[] {
    return this._computeBfsTraversalOfStates(
      initStateId, states, sourceStateName);
  }
}

angular.module('oppia').factory(
  'ComputeGraphService', downgradeInjectable(ComputeGraphService));
