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

import {Injectable, Injector} from '@angular/core';
import {ExplorationStatesService} from 'pages/exploration-editor-page/services/exploration-states.service';
import {GraphDataService} from 'pages/exploration-editor-page/services/graph-data.service';
import {SolutionValidityService} from 'pages/exploration-editor-page/editor-tab/services/solution-validity.service';
import {ImprovementsService} from 'services/improvements.service';
import {StateTopAnswersStatsService} from 'services/state-top-answers-stats.service';
import {ExplorationEditorPageConstants} from 'pages/exploration-editor-page/exploration-editor-page.constants';
import {ExplorationInitStateNameService} from './exploration-init-state-name.service';
import {ParameterMetadataService} from 'pages/exploration-editor-page/services/parameter-metadata.service';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import {AppConstants} from 'app.constants';
import {State} from 'domain/state/StateObjectFactory';
import {
  ComputeGraphService,
  GraphLink,
  GraphNodes,
} from 'services/compute-graph.service';
import {AlgebraicExpressionInputValidationService} from 'interactions/AlgebraicExpressionInput/directives/algebraic-expression-input-validation.service';
import {CodeReplValidationService} from 'interactions/CodeRepl/directives/code-repl-validation.service';
import {ContinueValidationService} from 'interactions/Continue/directives/continue-validation.service';
import {DragAndDropSortInputValidationService} from 'interactions/DragAndDropSortInput/directives/drag-and-drop-sort-input-validation.service';
import {EndExplorationValidationService} from 'interactions/EndExploration/directives/end-exploration-validation.service';
import {FractionInputValidationService} from 'interactions/FractionInput/directives/fraction-input-validation.service';
import {GraphInputValidationService} from 'interactions/GraphInput/directives/graph-input-validation.service';
import {InteractiveMapValidationService} from 'interactions/InteractiveMap/directives/interactive-map-validation.service';
import {ImageClickInputValidationService} from 'interactions/ImageClickInput/directives/image-click-input-validation.service';
import {MathEquationInputValidationService} from 'interactions/MathEquationInput/directives/math-equation-input-validation.service';
import {ItemSelectionInputValidationService} from 'interactions/ItemSelectionInput/directives/item-selection-input-validation.service';
import {MultipleChoiceInputValidationService} from 'interactions/MultipleChoiceInput/directives/multiple-choice-input-validation.service';
import {NumberWithUnitsValidationService} from 'interactions/NumberWithUnits/directives/number-with-units-validation.service';
import {MusicNotesInputValidationService} from 'interactions/MusicNotesInput/directives/music-notes-input-validation.service';
import {NumericExpressionInputValidationService} from 'interactions/NumericExpressionInput/directives/numeric-expression-input-validation.service';
import {NumericInputValidationService} from 'interactions/NumericInput/directives/numeric-input-validation.service';
import {PencilCodeEditorValidationService} from 'interactions/PencilCodeEditor/directives/pencil-code-editor-validation.service';
import {RatioExpressionInputValidationService} from 'interactions/RatioExpressionInput/directives/ratio-expression-input-validation.service';
import {SetInputValidationService} from 'interactions/SetInput/directives/set-input-validation.service';
import {TextInputValidationService} from 'interactions/TextInput/directives/text-input-validation.service';
import {States} from 'domain/exploration/StatesObjectFactory';
import {InteractionSpecsKey} from 'pages/interaction-specs.constants';

var Dequeue = require('dequeue');
interface _getStatesAndAnswerGroupsWithEmptyClassifiersResult {
  groupIndexes: number[];
  stateName: string;
}
interface _verifyParametersResult {
  type: string;
  message: string;
}
interface _getReversedLinksResult {
  source: string;
  target: string;
  linkProperty: string | null;
  connectsDestIfStuck: boolean;
}

const INTERACTION_SERVICE_MAPPING = {
  AlgebraicExpressionInputValidationService:
    AlgebraicExpressionInputValidationService,
  CodeReplValidationService: CodeReplValidationService,
  ContinueValidationService: ContinueValidationService,
  DragAndDropSortInputValidationService: DragAndDropSortInputValidationService,
  EndExplorationValidationService: EndExplorationValidationService,
  FractionInputValidationService: FractionInputValidationService,
  GraphInputValidationService: GraphInputValidationService,
  ImageClickInputValidationService: ImageClickInputValidationService,
  InteractiveMapValidationService: InteractiveMapValidationService,
  ItemSelectionInputValidationService: ItemSelectionInputValidationService,
  MathEquationInputValidationService: MathEquationInputValidationService,
  MultipleChoiceInputValidationService: MultipleChoiceInputValidationService,
  MusicNotesInputValidationService: MusicNotesInputValidationService,
  NumberWithUnitsValidationService: NumberWithUnitsValidationService,
  NumericExpressionInputValidationService:
    NumericExpressionInputValidationService,
  NumericInputValidationService: NumericInputValidationService,
  PencilCodeEditorValidationService: PencilCodeEditorValidationService,
  RatioExpressionInputValidationService: RatioExpressionInputValidationService,
  SetInputValidationService: SetInputValidationService,
  TextInputValidationService: TextInputValidationService,
};

@Injectable({
  providedIn: 'root',
})
export class ExplorationWarningsService {
  constructor(
    private injector: Injector,
    private explorationInitStateNameService: ExplorationInitStateNameService,
    private explorationStatesService: ExplorationStatesService,
    private graphDataService: GraphDataService,
    private improvementsService: ImprovementsService,
    private solutionValidityService: SolutionValidityService,
    private stateTopAnswersStatsService: StateTopAnswersStatsService,
    private parameterMetadataService: ParameterMetadataService,
    private computeGraphService: ComputeGraphService
  ) {
    this.stateWarnings = {};
  }

  _warningsList: _verifyParametersResult[] = [];
  stateWarnings: Record<string, string[]> = {};
  checkpointCountWarning: string = '';
  hasCriticalStateWarning: boolean = false;
  statesWithInvalidRedirection: string[] = [];

  _getStatesWithoutInteractionIds(): string[] {
    let statesWithoutInteractionIds: string[] = [];

    let states = this.explorationStatesService.getStates();

    states.getStateNames().forEach(stateName => {
      if (!states.getState(stateName).interaction.id) {
        statesWithoutInteractionIds.push(stateName);
      }
    });

    return statesWithoutInteractionIds;
  }

  _getStatesWithIncorrectSolution(): string[] {
    let statesWithIncorrectSolution: string[] = [];

    let states = this.explorationStatesService.getStates();
    states.getStateNames().forEach(stateName => {
      if (
        states.getState(stateName).interaction.solution &&
        !this.solutionValidityService.isSolutionValid(stateName)
      ) {
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
    let seen: Record<string, boolean> = {};
    for (let i = 0; i < initNodeIds.length; i++) {
      seen[initNodeIds[i]] = true;
    }
    while (queue.length > 0) {
      let currNodeId = queue.shift();
      edges.forEach(edge => {
        if (edge.source === currNodeId && !seen.hasOwnProperty(edge.target)) {
          seen[edge.target] = true;
          queue.push(edge.target);
        }
      });
    }

    let unreachableNodeNames = [];
    for (let nodeId in nodes) {
      if (!seen.hasOwnProperty(nodes[nodeId])) {
        unreachableNodeNames.push(nodes[nodeId]);
      }
    }
    return unreachableNodeNames;
  }

  // Given an array of objects with two keys 'source' and 'target', returns
  // an array with the same objects but with the values of 'source' and
  // 'target' switched. (The objects represent edges in a graph, and this
  // operation amounts to reversing all the edges.)
  _getReversedLinks(links: GraphLink[]): _getReversedLinksResult[] {
    return links.map(link => {
      return {
        source: link.target,
        target: link.source,
        linkProperty: null,
        connectsDestIfStuck: false,
      };
    });
  }

  // Verify that all parameters referred to in a state are guaranteed to
  // have been set beforehand.
  _verifyParameters(initNodeIds: string[]): _verifyParametersResult[] {
    let unsetParametersInfo =
      this.parameterMetadataService.getUnsetParametersInfo(initNodeIds);

    let paramWarningsList: _verifyParametersResult[] = [];
    unsetParametersInfo.forEach(unsetParameterData => {
      if (!unsetParameterData.stateName) {
        // The parameter value is required in the initial list of parameter
        // changes.
        paramWarningsList.push({
          type: AppConstants.WARNING_TYPES.CRITICAL,
          message:
            'Please ensure the value of parameter "' +
            unsetParameterData.paramName +
            '" is set before it is referred to in the initial list of ' +
            'parameter changes.',
        });
      } else {
        // The parameter value is required in a subsequent state.
        paramWarningsList.push({
          type: AppConstants.WARNING_TYPES.CRITICAL,
          message:
            'Please ensure the value of parameter "' +
            unsetParameterData.paramName +
            '" is set before using it in "' +
            unsetParameterData.stateName +
            '".',
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
      if (group.rules.length === 0 && group.trainingData.length === 0) {
        indexes.push(i);
      }
    }
    return indexes;
  }

  _getStatesWithInvalidRedirection(
    initStateId: string,
    links: GraphLink[]
  ): string[] {
    let results: string[] = [];
    let states = this.explorationStatesService.getStates();
    let bfsStateList = this.computeGraphService.computeBfsTraversalOfStates(
      initStateId,
      states,
      initStateId
    );
    let visited: Record<string, boolean> = {};
    bfsStateList.forEach(stateName => {
      // Go through all states, taking in the dest and source
      // calculate distance for each, if invalid push in results.
      visited[stateName] = true;
      let state = states.getState(stateName);
      if (state && state.interaction) {
        if (state.interaction.defaultOutcome) {
          let defaultDest = state.interaction.defaultOutcome.dest;
          if (
            defaultDest !== stateName &&
            visited[defaultDest] &&
            !this.redirectionIsValid(defaultDest, stateName, links)
          ) {
            results.push(stateName);
          }
        }
        let answerGroups = state.interaction.answerGroups;
        for (let i = 0; i < answerGroups.length; i++) {
          let dest = answerGroups[i].outcome.dest;
          if (
            visited[dest] &&
            !this.redirectionIsValid(dest, stateName, links)
          ) {
            results.push(stateName);
          }
        }
      }
    });
    return results;
  }

  _getStatesAndAnswerGroupsWithEmptyClassifiers(): _getStatesAndAnswerGroupsWithEmptyClassifiersResult[] {
    let results: {groupIndexes: number[]; stateName: string}[] = [];
    let states: States = this.explorationStatesService.getStates();

    states.getStateNames().forEach(stateName => {
      let groupIndexes = this._getAnswerGroupIndexesWithEmptyClassifiers(
        states.getState(stateName)
      );
      if (groupIndexes.length > 0) {
        results.push({
          groupIndexes: groupIndexes,
          stateName: stateName,
        });
      }
    });

    return results;
  }

  _getStatesWithAnswersThatMustBeResolved(): string[] {
    let states: States = this.explorationStatesService.getStates();
    return this.stateTopAnswersStatsService
      .getStateNamesWithStats()
      .filter(stateName => {
        let mustResolveState =
          this.improvementsService.isStateForcedToResolveOutstandingUnaddressedAnswers(
            states.getState(stateName)
          );

        return (
          mustResolveState &&
          this.stateTopAnswersStatsService
            .getUnresolvedStateStats(stateName)
            .some(answer => {
              return (
                answer.frequency >=
                ExplorationEditorPageConstants.UNRESOLVED_ANSWER_FREQUENCY_THRESHOLD
              );
            })
        );
      });
  }

  _updateWarningsList(): void {
    this._warningsList = [];
    this.stateWarnings = {};
    this.checkpointCountWarning = '';
    this.hasCriticalStateWarning = false;

    let _extendStateWarnings = (stateName: string, newWarning: string) => {
      if (this.stateWarnings.hasOwnProperty(stateName)) {
        this.stateWarnings[stateName].push(newWarning);
      } else {
        this.stateWarnings[stateName] = [newWarning];
      }
    };

    this.graphDataService.recompute();

    let _graphData = this.graphDataService.getGraphData();

    let _states = this.explorationStatesService.getStates();
    _states.getStateNames().forEach(stateName => {
      let interaction = _states.getState(stateName).interaction;
      if (interaction.id) {
        let validatorServiceName =
          _states.getState(stateName).interaction.id + 'ValidationService';

        let validatorService = this.injector.get(
          INTERACTION_SERVICE_MAPPING[
            validatorServiceName as keyof typeof INTERACTION_SERVICE_MAPPING
          ]
        );

        let interactionWarnings = validatorService.getAllWarnings(
          stateName,
          interaction.customizationArgs,
          interaction.answerGroups,
          interaction.defaultOutcome
        );

        for (let j = 0; j < interactionWarnings.length; j++) {
          _extendStateWarnings(stateName, interactionWarnings[j].message);

          if (
            interactionWarnings[j].type === AppConstants.WARNING_TYPES.CRITICAL
          ) {
            this.hasCriticalStateWarning = true;
          }
        }
      }
    });

    let statesWithoutInteractionIds = this._getStatesWithoutInteractionIds();
    statesWithoutInteractionIds.forEach(stateWithoutInteractionIds => {
      _extendStateWarnings(
        stateWithoutInteractionIds,
        AppConstants.STATE_ERROR_MESSAGES.ADD_INTERACTION
      );
    });

    let statesWithInvalidRedirection = this._getStatesWithInvalidRedirection(
      _graphData.initStateId,
      _graphData.links
    );
    statesWithInvalidRedirection.forEach(stateName => {
      _extendStateWarnings(
        stateName,
        AppConstants.STATE_ERROR_MESSAGES.INVALID_REDIRECTION
      );
    });

    let statesWithAnswersThatMustBeResolved =
      this._getStatesWithAnswersThatMustBeResolved();
    statesWithAnswersThatMustBeResolved.forEach(stateName => {
      _extendStateWarnings(
        stateName,
        AppConstants.STATE_ERROR_MESSAGES.UNRESOLVED_ANSWER
      );
    });

    let statesWithIncorrectSolution = this._getStatesWithIncorrectSolution();
    statesWithIncorrectSolution.forEach(state => {
      _extendStateWarnings(
        state,
        AppConstants.STATE_ERROR_MESSAGES.INCORRECT_SOLUTION
      );
    });

    if (_graphData) {
      let unreachableStateNames = this._getUnreachableNodeNames(
        [_graphData.initStateId],
        _graphData.nodes,
        _graphData.links
      );

      if (unreachableStateNames.length) {
        unreachableStateNames.forEach(unreachableStateName => {
          _extendStateWarnings(
            unreachableStateName,
            AppConstants.STATE_ERROR_MESSAGES.STATE_UNREACHABLE
          );
        });
      } else {
        // Only perform this check if all states are reachable.
        let deadEndStates = this._getUnreachableNodeNames(
          _graphData.finalStateIds,
          _graphData.nodes,
          this._getReversedLinks(_graphData.links)
        );
        if (deadEndStates.length) {
          deadEndStates.forEach(deadEndState => {
            _extendStateWarnings(
              deadEndState,
              AppConstants.STATE_ERROR_MESSAGES.UNABLE_TO_END_EXPLORATION
            );
          });
        }
      }

      this._warningsList = this._warningsList.concat(
        this._verifyParameters([_graphData.initStateId])
      );
    }

    let initStateName = this.explorationInitStateNameService.displayed;
    let initState = _states.getState(initStateName as string);
    if (initState && !initState.cardIsCheckpoint) {
      _extendStateWarnings(
        initStateName as string,
        AppConstants.CHECKPOINT_ERROR_MESSAGES.INIT_CARD
      );
    }

    let nonInitialCheckpointStateNames: string[] = [];
    let terminalStateCount = 0;
    _states.getStateNames().forEach(stateName => {
      let state = _states.getState(stateName);
      let interactionId = state.interaction.id;
      if (
        Boolean(interactionId) &&
        INTERACTION_SPECS[interactionId as InteractionSpecsKey].is_terminal
      ) {
        if (state.cardIsCheckpoint && stateName !== initStateName) {
          _extendStateWarnings(
            stateName,
            AppConstants.CHECKPOINT_ERROR_MESSAGES.TERMINAL_CARD
          );
        }
        terminalStateCount++;
      }
      if (stateName !== initStateName && state.cardIsCheckpoint) {
        nonInitialCheckpointStateNames.push(stateName);
      }
    });

    let checkpointCount = this.explorationStatesService.getCheckpointCount();
    if (checkpointCount >= 9) {
      this.checkpointCountWarning =
        AppConstants.CHECKPOINT_ERROR_MESSAGES.CHECKPOINT_COUNT;
      this._warningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        message: 'Checkpoint count has an error.',
      });
    }

    for (let i in nonInitialCheckpointStateNames) {
      let links: GraphLink[] = _graphData.links;
      let newLinks: GraphLink[] = [];
      let newNodes: GraphNodes = _graphData.nodes;
      delete newNodes[nonInitialCheckpointStateNames[i]];

      links.forEach(edge => {
        if (edge.source !== nonInitialCheckpointStateNames[i]) {
          newLinks.push(edge);
        }
      });

      let unreachableNodeNames = this._getUnreachableNodeNames(
        [_graphData.initStateId],
        newNodes,
        newLinks
      );

      let terminalUnreachableStateCount = 0;
      unreachableNodeNames.forEach(stateName => {
        let interactionId = _states.getState(stateName).interaction.id;
        if (
          Boolean(interactionId) &&
          INTERACTION_SPECS[interactionId as InteractionSpecsKey].is_terminal
        ) {
          terminalUnreachableStateCount++;
        }
      });

      if (terminalStateCount !== terminalUnreachableStateCount) {
        _extendStateWarnings(
          nonInitialCheckpointStateNames[i],
          AppConstants.CHECKPOINT_ERROR_MESSAGES.BYPASSABLE_CARD
        );
      }
    }

    if (Object.keys(this.stateWarnings).length) {
      let errorString =
        Object.keys(this.stateWarnings).length > 1 ? 'cards have' : 'card has';
      this._warningsList.push({
        type: AppConstants.WARNING_TYPES.ERROR,
        message:
          'The following ' +
          errorString +
          ' errors: ' +
          Object.keys(this.stateWarnings).join(', ') +
          '.',
      });
    }

    let statesWithAnswerGroupsWithEmptyClassifiers =
      this._getStatesAndAnswerGroupsWithEmptyClassifiers();
    statesWithAnswerGroupsWithEmptyClassifiers.forEach(result => {
      let warningMessage = "In '" + result.stateName + "'";
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
        type: AppConstants.WARNING_TYPES.ERROR,
      });
    });
  }

  countWarnings(): number {
    return this._warningsList.length;
  }

  getAllStateRelatedWarnings(): Record<string, string[]> {
    return this.stateWarnings;
  }

  getWarnings(): object[] | string[] {
    return this._warningsList;
  }

  getCheckpointCountWarning(): string {
    return this.checkpointCountWarning;
  }

  hasCriticalWarnings(): boolean {
    return (
      this.hasCriticalStateWarning ||
      this._warningsList.some(warning => {
        return warning.type === AppConstants.WARNING_TYPES.CRITICAL;
      })
    );
  }

  updateWarnings(): void {
    this._updateWarningsList();
  }

  redirectionIsValid(
    sourceStateName: string,
    destStateName: string,
    links: GraphLink[]
  ): boolean {
    let distance = this.getDistanceToDestState(
      sourceStateName,
      destStateName,
      links
    );
    // Raise validation error if the creator redirects the learner
    // back by more than MAX_CARD_COUNT_FOR_VALID_REDIRECTION cards.
    return distance <= AppConstants.MAX_CARD_COUNT_FOR_VALID_REDIRECTION;
  }

  getDistanceToDestState(
    sourceStateName: string,
    destStateName: string,
    links: GraphLink[]
  ): number {
    let distanceToDestState = -1;
    let stateFound = false;
    let dequeue = new Dequeue();
    let visited: Record<string, boolean> = {};
    visited[sourceStateName] = true;
    dequeue.push(sourceStateName);
    while (dequeue.length > 0 && !stateFound) {
      let dequeueSize = dequeue.length;
      distanceToDestState++;
      while (dequeueSize > 0) {
        // '.shift()' here can return an undefined value, but we're already
        // checking for queue.length > 0, so this is safe.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        let currStateName = dequeue.shift()!;
        if (currStateName === destStateName) {
          stateFound = true;
        }
        dequeueSize--;
        for (let e = 0; e < links.length; e++) {
          let edge = links[e];
          let dest = edge.target;
          if (edge.source === currStateName && !visited.hasOwnProperty(dest)) {
            visited[dest] = true;
            dequeue.push(dest);
          }
        }
      }
    }
    if (distanceToDestState !== -1 && !stateFound) {
      distanceToDestState = -1;
    }
    return distanceToDestState;
  }
}
