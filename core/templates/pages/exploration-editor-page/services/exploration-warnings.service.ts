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
 * @fileoverview A service that lists all the exploration warnings.
 */

import { Injectable, Injector } from '@angular/core';
import { AppConstants } from 'app.constants';
import { ImprovementsService } from 'services/improvements.service';
import { StateTopAnswersStatsService } from 'services/state-top-answers-stats.service';
import { SolutionValidityService } from '../editor-tab/services/solution-validity.service';
import { ExplorationEditorPageConstants } from '../exploration-editor-page.constants';
import { ExplorationStatesService } from './exploration-states.service';
import { GraphDataService } from './graph-data.service';
import { ParameterMetadataService } from './parameter-metadata.service';
import { State } from 'domain/state/StateObjectFactory';
import { GraphLink, GraphNodes } from 'services/compute-graph.service';
import { ExplorationInitStateNameService } from './exploration-init-state-name.service';
import { downgradeInjectable } from '@angular/upgrade/static';
import { Warning } from 'interactions/base-interaction-validation.service';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';

export interface WarningsList {
  type: string;
  message: string;
}

interface Results {
  groupIndexes: number[];
  stateName: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExplorationWarningsService {
  constructor(
    private explorationStatesService: ExplorationStatesService,
    private solutionValidityService: SolutionValidityService,
    private parameterMetadataService: ParameterMetadataService,
    private graphDataService: GraphDataService,
    private stateTopAnswersStatsService: StateTopAnswersStatsService,
    private improvementsService: ImprovementsService,
    private explorationInitStateNameService: ExplorationInitStateNameService,
    private injector: Injector
  ) {}

  _warningsList: WarningsList[] = [];
  stateWarnings = {};
  checkpointCountWarning = '';
  hasCriticalStateWarning = false;

  _getStatesWithoutInteractionIds(): string[] {
    let statesWithoutInteractionIds = [];
    let states = this.explorationStatesService.getStates();

    states.getStateNames().forEach((stateName) => {
      if (!states.getState(stateName).interaction.id) {
        statesWithoutInteractionIds.push(stateName);
      }
    });

    return statesWithoutInteractionIds;
  }

  _getStatesWithIncorrectSolution(): string[] {
    let statesWithIncorrectSolution = [];

    let states = this.explorationStatesService.getStates();
    states.getStateNames().forEach((stateName) => {
      if (states.getState(stateName).interaction.solution &&
          !this.solutionValidityService.isSolutionValid(stateName)) {
        statesWithIncorrectSolution.push(stateName);
      }
    });
    return statesWithIncorrectSolution;
  }

  // Returns a list of names of all nodes which are unreachable from the
  // initial node.
  //
  // Args:
  // - initNodeIds: a list of initial node ids
  // - nodes: an object whose keys are node ids, and whose values are node
  //     names
  // - edges: a list of edges, each of which is an object with keys 'source',
  //     and 'target'.
  _getUnreachableNodeNames(
      initNodeIds: string[],
      nodes: GraphNodes,
      edges: GraphLink[]
  ): string[] {
    let queue = initNodeIds;
    let seen = {};
    for (let i = 0; i < initNodeIds.length; i++) {
      seen[initNodeIds[i]] = true;
    }
    while (queue.length > 0) {
      let currNodeId = queue.shift();
      edges.forEach((edge) => {
        if (edge.source === currNodeId && !seen.hasOwnProperty(edge.target)) {
          seen[edge.target] = true;
          queue.push(edge.target);
        }
      });
    }

    let unreachableNodeNames = [];
    for (let nodeId in nodes) {
      if (!(seen.hasOwnProperty(nodes[nodeId]))) {
        unreachableNodeNames.push(nodes[nodeId]);
      }
    }
    return unreachableNodeNames;
  }

  // Given an array of objects with two keys 'source' and 'target', returns
  // an array with the same objects but with the values of 'source' and
  // 'target' switched. (The objects represent edges in a graph, and this
  // operation amounts to reversing all the edges.)
  _getReversedLinks(links: GraphLink[]): GraphLink[] {
    return links.map((link) => {
      return {
        source: link.target,
        target: link.source,
      };
    });
  }

  // Verify that all parameters referred to in a state are guaranteed to
  // have been set beforehand.
  _verifyParameters(initNodeIds: string[]): WarningsList[] {
    let unsetParametersInfo = (
      this.parameterMetadataService.getUnsetParametersInfo(initNodeIds));

    let paramWarningsList = [];
    unsetParametersInfo.forEach((unsetParameterData) => {
      if (!unsetParameterData.stateName) {
        // The parameter value is required in the initial list of parameter
        // changes.
        paramWarningsList.push({
          type: AppConstants.WARNING_TYPES.CRITICAL,
          message: (
            'Please ensure the value of parameter "' +
            unsetParameterData.paramName +
            '" is set before it is referred to in the initial list of ' +
            'parameter changes.')
        });
      } else {
        // The parameter value is required in a subsequent state.
        paramWarningsList.push({
          type: AppConstants.WARNING_TYPES.CRITICAL,
          message: (
            'Please ensure the value of parameter "' +
            unsetParameterData.paramName +
            '" is set before using it in "' + unsetParameterData.stateName +
            '".')
        });
      }
    });

    return paramWarningsList;
  }

  _getAnswerGroupIndexesWithEmptyClassifiers(state: State): number[] {
    let indexes = [];
    let answerGroups = state.interaction.answerGroups;
    for (let i = 0; i < answerGroups.length; i++) {
      let group = answerGroups[i];
      if (group.rules.length === 0 &&
          group.trainingData.length === 0) {
        indexes.push(i);
      }
    }
    return indexes;
  }

  _getStatesAndAnswerGroupsWithEmptyClassifiers(): Results[] {
    let results = [];

    let states = this.explorationStatesService.getStates();

    states.getStateNames().forEach((stateName) => {
      let groupIndexes = this._getAnswerGroupIndexesWithEmptyClassifiers(
        states.getState(stateName));
      if (groupIndexes.length > 0) {
        results.push({
          groupIndexes: groupIndexes,
          stateName: stateName
        });
      }
    });

    return results;
  }

  _getStatesWithAnswersThatMustBeResolved(): string[] {
    let stass = this.stateTopAnswersStatsService;
    let states = this.explorationStatesService.getStates();
    return stass.getStateNamesWithStats().filter((stateName) => {
      let mustResolveState =
        this.improvementsService
          .isStateForcedToResolveOutstandingUnaddressedAnswers(
            states.getState(stateName));
      return mustResolveState &&
        stass.getUnresolvedStateStats(stateName).some((answer) => {
          return (
            answer.frequency >=
            ExplorationEditorPageConstants.UNRESOLVED_ANSWER_FREQUENCY_THRESHOLD
          );
        });
    });
  }

  _extendStateWarnings(
      stateName: string, newWarning: string): void {
    if (this.stateWarnings.hasOwnProperty(stateName)) {
      this.stateWarnings[stateName].push(newWarning);
    } else {
      this.stateWarnings[stateName] = [newWarning];
    }
  }

  _updateWarningsList(): void {
    this.graphDataService.recompute();
    let _graphData = this.graphDataService.getGraphData();

    let _states = this.explorationStatesService.getStates();
    _states.getStateNames().forEach((stateName) => {
      let interaction = _states.getState(stateName).interaction;
      if (interaction.id) {
        let validatorServiceName =
            _states.getState(stateName).interaction.id + 'ValidationService';
        let validatorService = this.injector.get(validatorServiceName);
        let interactionWarnings = validatorService.getAllWarnings(
          stateName, interaction.customizationArgs,
          interaction.answerGroups, interaction.defaultOutcome);

        for (let j = 0; j < interactionWarnings.length; j++) {
          this._extendStateWarnings(stateName, interactionWarnings[j].message);

          if (
            interactionWarnings[j].type === AppConstants.WARNING_TYPES.CRITICAL
          ) {
            this.hasCriticalStateWarning = true;
          }
        }
      }
    });

    let statesWithoutInteractionIds = this._getStatesWithoutInteractionIds();
    angular.forEach(
      statesWithoutInteractionIds, (stateWithoutInteractionIds) => {
        this._extendStateWarnings(
          stateWithoutInteractionIds,
          AppConstants.STATE_ERROR_MESSAGES.ADD_INTERACTION
        );
      });

    let statesWithAnswersThatMustBeResolved =
      this._getStatesWithAnswersThatMustBeResolved();
    angular.forEach(statesWithAnswersThatMustBeResolved, (stateName) => {
      this._extendStateWarnings(
        stateName, AppConstants.STATE_ERROR_MESSAGES.UNRESOLVED_ANSWER
      );
    });

    let statesWithIncorrectSolution = this._getStatesWithIncorrectSolution();
    angular.forEach(statesWithIncorrectSolution, (state) => {
      this._extendStateWarnings(
        state, AppConstants.STATE_ERROR_MESSAGES.INCORRECT_SOLUTION
      );
    });

    if (_graphData) {
      let unreachableStateNames = this._getUnreachableNodeNames(
        [_graphData.initStateId], _graphData.nodes, _graphData.links);

      if (unreachableStateNames.length) {
        angular.forEach(
          unreachableStateNames, (unreachableStateName) => {
            this._extendStateWarnings(
              unreachableStateName,
              AppConstants.STATE_ERROR_MESSAGES.STATE_UNREACHABLE);
          });
      } else {
        // Only perform this check if all states are reachable.
        let deadEndStates = this._getUnreachableNodeNames(
          _graphData.finalStateIds, _graphData.nodes,
          this._getReversedLinks(_graphData.links));
        if (deadEndStates.length) {
          angular.forEach(deadEndStates, (deadEndState) => {
            this._extendStateWarnings(
              deadEndState,
              AppConstants.STATE_ERROR_MESSAGES.UNABLE_TO_END_EXPLORATION);
          });
        }
      }

      this._warningsList = this._warningsList.concat(this._verifyParameters([
        _graphData.initStateId]));
    }

    let initStateName = this.explorationInitStateNameService.displayed;
    let initState = _states.getState(initStateName as string);
    if (initState && !initState.cardIsCheckpoint) {
      this._extendStateWarnings(
        initStateName as string,
        AppConstants.CHECKPOINT_ERROR_MESSAGES.INIT_CARD);
    }

    let nonInitialCheckpointStateNames = [];
    let terminalStateCount = 0;
    _states.getStateNames().forEach(stateName => {
      let state = _states.getState(stateName);
      let interactionId = state.interaction.id;
      if (interactionId && INTERACTION_SPECS[interactionId].is_terminal) {
        if (state.cardIsCheckpoint && stateName !== initStateName) {
          this._extendStateWarnings(
            stateName, AppConstants.CHECKPOINT_ERROR_MESSAGES.TERMINAL_CARD);
        }
        terminalStateCount++;
      }
      if (stateName !== initStateName && state.cardIsCheckpoint) {
        nonInitialCheckpointStateNames.push(stateName);
      }
    });

    let checkpointCount = this.explorationStatesService.getCheckpointCount();
    if (checkpointCount >= 9) {
      this.checkpointCountWarning = (
        AppConstants.CHECKPOINT_ERROR_MESSAGES.CHECKPOINT_COUNT);
      this._warningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        message: ('Checkpoint count has an error.')
      });
    }

    for (let i in nonInitialCheckpointStateNames) {
      let links = _graphData.links;
      let newLinks = [];
      let newNodes = _graphData.nodes;
      delete newNodes[nonInitialCheckpointStateNames[i]];

      links.forEach(edge => {
        if (edge.source !== nonInitialCheckpointStateNames[i]) {
          newLinks.push(edge);
        }
      });

      let unreachableNodeNames = this._getUnreachableNodeNames(
        [_graphData.initStateId], newNodes, newLinks);

      let terminalUnreachableStateCount = 0;
      unreachableNodeNames.forEach(stateName => {
        let interactionId = _states.getState(stateName).interaction.id;
        if (interactionId && INTERACTION_SPECS[interactionId].is_terminal) {
          terminalUnreachableStateCount++;
        }
      });

      if (terminalStateCount !== terminalUnreachableStateCount) {
        this._extendStateWarnings(
          nonInitialCheckpointStateNames[i],
          AppConstants.CHECKPOINT_ERROR_MESSAGES.BYPASSABLE_CARD);
      }
    }

    if (Object.keys(this.stateWarnings).length) {
      let errorString = (
        Object.keys(this.stateWarnings).length > 1 ? 'cards have' : 'card has');
      this._warningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        message: (
          'The following ' + errorString + ' errors: ' +
          Object.keys(this.stateWarnings).join(', ') + '.')
      });
    }

    let statesWithAnswerGroupsWithEmptyClassifiers = (
      this._getStatesAndAnswerGroupsWithEmptyClassifiers());
    statesWithAnswerGroupsWithEmptyClassifiers.forEach((result) => {
      let warningMessage = 'In \'' + result.stateName + '\'';
      if (result.groupIndexes.length !== 1) {
        warningMessage += ', the following answer groups have classifiers ';
        warningMessage += 'with no training data: ';
      } else {
        warningMessage += ', the following answer group has a classifier ';
        warningMessage += 'with no training data: ';
      }
      warningMessage += result.groupIndexes.join(', ');

      this._warningsList.push({
        message: warningMessage,
        type: AppConstants.WARNING_TYPES.ERROR
      });
    });
  }

  countWarnings(): number {
    return this._warningsList.length;
  }

  getAllStateRelatedWarnings(): Record<string, Warning[]> {
    return this.stateWarnings;
  }

  getWarnings(): WarningsList[] {
    return this._warningsList;
  }

  getCheckpointCountWarning(): string {
    return this.checkpointCountWarning;
  }

  hasCriticalWarnings(): boolean {
    return (
      this.hasCriticalStateWarning || this._warningsList.some((warning) => {
        return warning.type === AppConstants.WARNING_TYPES.CRITICAL;
      })
    );
  }

  updateWarnings(): void {
    this._updateWarningsList();
  }
}

angular.module('oppia').factory(
  'ExplorationWarningsService',
  downgradeInjectable(ExplorationWarningsService));
