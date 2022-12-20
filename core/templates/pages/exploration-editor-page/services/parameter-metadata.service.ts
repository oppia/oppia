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
 * @fileoverview Service for computing parameter metadata.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { ParamMetadata } from 'domain/exploration/param-metadata.model';
import { ExpressionInterpolationService } from 'expressions/expression-interpolation.service';
import { ExplorationParamChangesService } from 'pages/exploration-editor-page/services/exploration-param-changes.service';
import { ExplorationStatesService } from 'pages/exploration-editor-page/services/exploration-states.service';
import { GraphDataService } from 'pages/exploration-editor-page/services/graph-data.service';
import { ExplorationEditorPageConstants } from 'pages/exploration-editor-page/exploration-editor-page.constants';
import { State } from 'domain/state/StateObjectFactory';
import { ParamChange } from 'domain/exploration/ParamChangeObjectFactory';
import cloneDeep from 'lodash/cloneDeep';

interface GetUnsetParametersInfoResult {
  paramName: string;
  stateName: null | string;
}

@Injectable({
  providedIn: 'root'
})
export class ParameterMetadataService {
  constructor(
    private expressionInterpolationService: ExpressionInterpolationService,
    private explorationParamChangesService: ExplorationParamChangesService,
    private explorationStatesService: ExplorationStatesService,
    private graphDataService: GraphDataService,
  ) { }

  PARAM_SOURCE_ANSWER = 'answer';
  PARAM_SOURCE_CONTENT = 'content';
  PARAM_SOURCE_FEEDBACK = 'feedback';
  PARAM_SOURCE_PARAM_CHANGES = 'param_changes';

  getMetadataFromParamChanges(paramChanges: ParamChange[]): ParamMetadata[] {
    let result = [];
    for (let i = 0; i < paramChanges.length; i++) {
      let pc = paramChanges[i];
      if (pc.generatorId === 'Copier') {
        if (!pc.customizationArgs.parse_with_jinja) {
          result.push(ParamMetadata.createWithSetAction(
            pc.name, this.PARAM_SOURCE_PARAM_CHANGES, String(i)));
        } else {
          const customizationArgsValue = pc.customizationArgs.value;
          if (customizationArgsValue) {
            let paramsReferenced = (
              this.expressionInterpolationService.getParamsFromString(
                customizationArgsValue));
            for (let j = 0; j < paramsReferenced.length; j++) {
              result.push(ParamMetadata.createWithGetAction(
                paramsReferenced[j],
                this.PARAM_SOURCE_PARAM_CHANGES, String(i)));
            }
            result.push(ParamMetadata.createWithSetAction(
              pc.name, this.PARAM_SOURCE_PARAM_CHANGES, String(i)));
          }
        }
      } else {
        // RandomSelector. Elements in the list of possibilities are treated
        // as raw unicode strings, not expressions.
        result.push(ParamMetadata.createWithSetAction(
          pc.name, this.PARAM_SOURCE_PARAM_CHANGES, String(i)));
      }
    }

    return result;
  }

  // Returns a list of set/get actions for parameters in the given state, in
  // the order that they occur.
  // TODO(sll): Add trace data (so that it's easy to figure out in which rule
  // an issue occurred, say).
  getStateParamMetadata(state: State): ParamMetadata[] {
    // First, the state param changes are applied: we get their values
    // and set the params.
    let result = this.getMetadataFromParamChanges(state.paramChanges);

    // Next, the content is evaluated.
    this.expressionInterpolationService.getParamsFromString(
      state.content.html).forEach((paramName, index) => {
      result.push(ParamMetadata.createWithGetAction(
        paramName, this.PARAM_SOURCE_CONTENT, '0'));
    });

    // Next, the answer is received.
    result.push(ParamMetadata.createWithSetAction(
      'answer', this.PARAM_SOURCE_ANSWER, '0'));

    // Finally, the rule feedback strings are evaluated.
    state.interaction.answerGroups.forEach((group) => {
      this.expressionInterpolationService.getParamsFromString(
        group.outcome.feedback.html).forEach((paramName, index) => {
        result.push(ParamMetadata.createWithGetAction(
          paramName, this.PARAM_SOURCE_FEEDBACK, String(index)));
      });
    });

    return result;
  }

  // Returns one of null, PARAM_ACTION_SET, PARAM_ACTION_GET depending on
  // whether this parameter is not used at all in this state, or
  // whether its first occurrence is a 'set' or 'get'.
  getParamStatus(
      stateParamMetadata: ParamMetadata[], paramName: string): null | string {
    for (let i = 0; i < stateParamMetadata.length; i++) {
      if (stateParamMetadata[i].paramName === paramName) {
        return stateParamMetadata[i].action;
      }
    }
    return null;
  }

  // Returns a list of objects, each indicating a parameter for which it is
  // possible to arrive at a state with that parameter required but unset.
  // Each object in this list has two keys:
  // - paramName: the name of the parameter that may be unset
  // - stateName: the name of one of the states it is possible to reach
  //     with the parameter being unset, or null if the place where the
  //     parameter is required is in the initial list of parameter changes
  //     (e.g. one parameter may be set based on the value assigned to
  //     another parameter).
  getUnsetParametersInfo(
      initNodeIds: string[]): GetUnsetParametersInfoResult[] {
    let graphData = this.graphDataService.getGraphData();

    let states = this.explorationStatesService.getStates();

    // Determine all parameter names that are used within this exploration.
    let allParamNames: string[] = [];
    let expParamChangesMetadata = this.getMetadataFromParamChanges(
      this.explorationParamChangesService.savedMemento as ParamChange[]);
    let stateParamMetadatas: Record<string, ParamMetadata[]> = {};

    expParamChangesMetadata.forEach((expParamMetadataItem) => {
      if (allParamNames.indexOf(expParamMetadataItem.paramName) === -1) {
        allParamNames.push(expParamMetadataItem.paramName);
      }
    });

    states.getStateNames().forEach((stateName) => {
      stateParamMetadatas[stateName] = this.getStateParamMetadata(
        states.getState(stateName));
      for (let i = 0; i < stateParamMetadatas[stateName].length; i++) {
        let pName = stateParamMetadatas[stateName][i].paramName;
        if (allParamNames.indexOf(pName) === -1) {
          allParamNames.push(pName);
        }
      }
    });

    // For each parameter, do a BFS to see if it's possible to get from
    // the start node to a node requiring this parameter, without passing
    // through any nodes that set this parameter.
    let unsetParametersInfo = [];

    for (let paramInd = 0; paramInd < allParamNames.length; paramInd++) {
      let paramName = allParamNames[paramInd];
      let tmpUnsetParameter = null;

      let paramStatusAtOutset = this.getParamStatus(
        expParamChangesMetadata, paramName);
      if (paramStatusAtOutset ===
        ExplorationEditorPageConstants.PARAM_ACTION_GET) {
        unsetParametersInfo.push({
          paramName: paramName,
          stateName: null
        });
        continue;
      } else if (paramStatusAtOutset ===
        ExplorationEditorPageConstants.PARAM_ACTION_SET) {
        // This parameter will remain set for the entirety of the
        // exploration.
        continue;
      }

      let queue = [];
      let seen: Record<string, boolean> = {};
      for (let i = 0; i < initNodeIds.length; i++) {
        seen[initNodeIds[i]] = true;
        let paramStatus = this.getParamStatus(
          stateParamMetadatas[initNodeIds[i]], paramName);
        if (paramStatus ===
          ExplorationEditorPageConstants.PARAM_ACTION_GET) {
          tmpUnsetParameter = {
            paramName: paramName,
            stateName: initNodeIds[i]
          };
          break;
        } else if (!paramStatus) {
          queue.push(initNodeIds[i]);
        }
      }

      if (tmpUnsetParameter) {
        unsetParametersInfo.push(cloneDeep(tmpUnsetParameter));
        continue;
      }

      while (queue.length > 0) {
        let currNodeId = queue.shift();
        for (let edgeInd = 0; edgeInd < graphData.links.length; edgeInd++) {
          let edge = graphData.links[edgeInd];
          if (edge.source === currNodeId &&
            !seen.hasOwnProperty(edge.target)) {
            seen[edge.target] = true;
            let paramStatus = this.getParamStatus(
              stateParamMetadatas[edge.target], paramName);
            if (paramStatus ===
              ExplorationEditorPageConstants.PARAM_ACTION_GET) {
              tmpUnsetParameter = {
                paramName: paramName,
                stateName: edge.target
              };
              break;
            } else if (!paramStatus) {
              queue.push(edge.target);
            }
          }
        }
      }

      if (tmpUnsetParameter) {
        unsetParametersInfo.push(cloneDeep(tmpUnsetParameter));
      }
    }

    return unsetParametersInfo;
  }
}

angular.module('oppia').factory(
  'ParameterMetadataService',
  downgradeInjectable(ParameterMetadataService));
