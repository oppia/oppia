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
 * @fileoverview Service for computing diffs of explorations.
 */

import {Injectable} from '@angular/core';

import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';

import {
  InteractionSpecsConstants,
  InteractionSpecsKey,
} from 'pages/interaction-specs.constants';

import {
  ExplorationChangeAddState,
  ExplorationChange,
  ExplorationChangeRenameState,
  ExplorationChangeEditStateProperty,
} from 'domain/exploration/exploration-draft.model';
import {StateObjectsDict} from 'domain/exploration/StatesObjectFactory';

export interface ExplorationGraphChangeList {
  changeList: ExplorationChange[];
  directionForwards: boolean;
}

export interface StateData {
  [stateName: string]: {
    newestStateName: string;
    originalStateName: string;
    stateProperty: string;
  };
}

export interface StateIds {
  [stateName: string]: number;
}

interface StateIdsAndData {
  stateIds: StateIds;
  stateData: StateData;
}

export interface ProcessedStateIdsAndData {
  nodes: StateData;
  links: StateLink[];
  originalStateIds: StateIds;
  stateIds: StateIds;
  finalStateIds: string[];
}

interface AdjMatrix {
  [state1: number]: {
    [state2: number]: boolean;
  };
}

interface ResultInterface {
  stateIds: StateIds;
  stateData: StateData;
}

export interface StateLink {
  source: number;
  target: number;
  linkProperty: string;
}

@Injectable({
  providedIn: 'root',
})
export class ExplorationDiffService {
  STATE_PROPERTY_ADDED = 'added';
  STATE_PROPERTY_DELETED = 'deleted';
  STATE_PROPERTY_CHANGED = 'changed';
  STATE_PROPERTY_UNCHANGED = 'unchanged';
  _maxId = 0;

  // Functions to assign ids to states.
  _resetMaxId(): void {
    this._maxId = 0;
  }

  _generateNewId(): number {
    this._maxId++;
    return this._maxId;
  }

  _generateInitialStateIdsAndData(
    statesDict: StateObjectsDict
  ): StateIdsAndData {
    let result: ResultInterface = {
      stateIds: {},
      stateData: {},
    };

    this._resetMaxId();

    for (let stateName in statesDict) {
      let stateId = this._generateNewId();
      result.stateData[stateId] = {
        newestStateName: stateName,
        originalStateName: stateName,
        stateProperty: this.STATE_PROPERTY_UNCHANGED,
      };
      result.stateIds[stateName] = stateId;
    }
    return result;
  }

  _postprocessStateIdsAndData(
    originalStateIds: StateIds,
    stateIds: StateIds,
    stateData: StateData,
    v1States: StateObjectsDict,
    v2States: StateObjectsDict
  ): ProcessedStateIdsAndData {
    // Ignore changes that were canceled out by later changes.
    for (let stateId in stateData) {
      if (
        stateData[stateId].stateProperty === this.STATE_PROPERTY_CHANGED &&
        v1States.hasOwnProperty(stateData[stateId].originalStateName) &&
        v2States.hasOwnProperty(stateData[stateId].newestStateName) &&
        isEqual(
          v1States[stateData[stateId].originalStateName],
          v2States[stateData[stateId].newestStateName]
        )
      ) {
        stateData[stateId].stateProperty = this.STATE_PROPERTY_UNCHANGED;
      }
    }

    // Delete states not present in both v1 and v2.
    for (let stateId in stateData) {
      if (
        !v1States.hasOwnProperty(stateData[stateId].originalStateName) &&
        !v2States.hasOwnProperty(stateData[stateId].newestStateName)
      ) {
        delete stateData[stateId];
      }
    }

    // Track whether terminal nodes in v1 or v2
    // TODO(bhenning): Could show changes to terminal nodes in diff.
    let finalStateIds = [];
    for (let stateId in stateData) {
      let oldState = v1States[stateData[stateId].originalStateName];
      let newState = v2States[stateData[stateId].newestStateName];
      let oldStateIsTerminal = false;
      let newStateIsTerminal = false;
      if (oldState) {
        let interactionId = oldState.interaction.id as InteractionSpecsKey;
        const interactionSpec =
          InteractionSpecsConstants.INTERACTION_SPECS[interactionId];
        oldStateIsTerminal = Boolean(
          oldState.interaction.id && interactionSpec.is_terminal
        );
      }
      if (newState) {
        let interactionId = newState.interaction.id as InteractionSpecsKey;
        const interactionSpec =
          InteractionSpecsConstants.INTERACTION_SPECS[interactionId];
        newStateIsTerminal = Boolean(
          newState.interaction.id && interactionSpec.is_terminal
        );
      }
      if (oldStateIsTerminal || newStateIsTerminal) {
        finalStateIds.push(stateId);
      }
    }

    let links = this._compareLinks(
      v1States,
      originalStateIds,
      v2States,
      stateIds
    );

    return {
      nodes: stateData,
      links: links,
      originalStateIds: originalStateIds,
      stateIds: stateIds,
      finalStateIds: finalStateIds,
    };
  }

  /**
   * A helper function that takes a list of changes and uses them to modify
   * stateIds and stateData accordingly.
   *
   * stateIds is an object whose keys are the newest state name and whose
   * values are the assigned state id.
   * stateData an object whose keys are state IDs and whose value is an object
   * with these keys:
   *  - 'newestStateName': the latest name of the state
   *  - 'originalStateName': the first encountered name for the state
   *  - 'stateProperty': 'changed', 'unchanged', 'added' or 'deleted'
   * changeListData is a list of objects, each with two keys:
   * - changeList: the change list to apply.
   * - directionForwards: true if changes are compared in increasing version
   * number, and false if changes are compared in decreasing version number.
   */
  _getDiffGraphData(
    v1States: StateObjectsDict,
    v2States: StateObjectsDict,
    changeListData: ExplorationGraphChangeList[]
  ): ProcessedStateIdsAndData {
    let v1Info = this._generateInitialStateIdsAndData(v1States);
    let stateData = v1Info.stateData;
    let stateIds = v1Info.stateIds;
    let originalStateIds = cloneDeep(stateIds);

    changeListData.forEach(changeListDatum => {
      let changeList = changeListDatum.changeList;
      let directionForwards = changeListDatum.directionForwards;
      changeList.forEach(change => {
        let explorationChangeAddState = change as ExplorationChangeAddState;

        if (
          (directionForwards && change.cmd === 'add_state') ||
          (!directionForwards && change.cmd === 'delete_state')
        ) {
          if (!stateIds.hasOwnProperty(explorationChangeAddState.state_name)) {
            let newId = this._generateNewId();
            stateIds[(change as ExplorationChangeAddState).state_name] = newId;
          }
          let currentStateId = stateIds[explorationChangeAddState.state_name];
          if (
            stateData.hasOwnProperty(currentStateId) &&
            stateData[currentStateId].stateProperty ===
              this.STATE_PROPERTY_DELETED
          ) {
            stateData[currentStateId].stateProperty =
              this.STATE_PROPERTY_CHANGED;
            stateData[currentStateId].newestStateName =
              explorationChangeAddState.state_name;
          } else {
            stateData[currentStateId] = {
              newestStateName: (change as ExplorationChangeAddState).state_name,
              originalStateName: explorationChangeAddState.state_name,
              stateProperty: this.STATE_PROPERTY_ADDED,
            };
          }
        } else if (
          (directionForwards && change.cmd === 'delete_state') ||
          (!directionForwards && change.cmd === 'add_state')
        ) {
          if (
            stateData[stateIds[explorationChangeAddState.state_name]]
              .stateProperty === this.STATE_PROPERTY_ADDED
          ) {
            stateData[
              stateIds[explorationChangeAddState.state_name]
            ].stateProperty = this.STATE_PROPERTY_CHANGED;
          } else {
            stateData[
              stateIds[explorationChangeAddState.state_name]
            ].stateProperty = this.STATE_PROPERTY_DELETED;
          }
        } else if (change.cmd === 'rename_state') {
          let newStateName = null;
          let oldStateName = null;
          if (directionForwards) {
            newStateName = (change as ExplorationChangeRenameState)
              .new_state_name;
            oldStateName = (change as ExplorationChangeRenameState)
              .old_state_name;
          } else {
            newStateName = (change as ExplorationChangeRenameState)
              .old_state_name;
            oldStateName = (change as ExplorationChangeRenameState)
              .new_state_name;
          }
          stateIds[newStateName] = stateIds[oldStateName];
          delete stateIds[oldStateName];
          stateData[stateIds[newStateName]].newestStateName = newStateName;
        } else if (change.cmd === 'edit_state_property') {
          if (
            stateData[
              stateIds[
                (change as ExplorationChangeEditStateProperty).state_name
              ]
            ].stateProperty === this.STATE_PROPERTY_UNCHANGED
          ) {
            stateData[
              stateIds[
                (change as ExplorationChangeEditStateProperty).state_name
              ]
            ].stateProperty = this.STATE_PROPERTY_CHANGED;
          }
        } else if (
          change.cmd !== 'migrate_states_schema_to_latest_version' &&
          change.cmd !== 'AUTO_revert_version_number' &&
          change.cmd !== 'edit_exploration_property' &&
          change.cmd !== 'add_written_translation' &&
          change.cmd !== 'mark_translations_needs_update' &&
          change.cmd !== 'mark_translation_needs_update_for_language' &&
          change.cmd !== 'remove_translations' &&
          change.cmd !== 'edit_translation' &&
          change.cmd !== 'update_voiceovers'
        ) {
          throw new Error('Invalid change command: ' + change.cmd);
        }
      });
    });

    return this._postprocessStateIdsAndData(
      originalStateIds,
      stateIds,
      stateData,
      v1States,
      v2States
    );
  }

  /**
   * Returns an adjacency matrix, adjMatrix, of links between states
   * (represented by ids). adjMatrix[state1Id][state2Id] is true if there
   * is a link from state 1 to state 2 and false otherwise.
   *
   * Args:
   * - states: an object whose keys are state names and values are objects
   *     representing the state.
   * - stateIds: an object whose keys are state names and values are state
   *     ids.
   * - maxId: the maximum id in states and stateIds.
   */
  _getAdjMatrix(
    states: StateObjectsDict,
    stateIds: StateIds,
    maxId: number
  ): AdjMatrix {
    let adjMatrix: AdjMatrix = {};
    for (let stateId = 1; stateId <= maxId; stateId++) {
      adjMatrix[stateId] = {};
    }
    for (let state1Id = 1; state1Id <= maxId; state1Id++) {
      for (let state2Id = 1; state2Id <= maxId; state2Id++) {
        adjMatrix[state1Id][state2Id] = false;
      }
    }
    for (let stateName in states) {
      let interaction = states[stateName].interaction;
      let groups = interaction.answerGroups;
      for (let h = 0; h < groups.length; h++) {
        let dest = groups[h].outcome.dest;
        adjMatrix[stateIds[stateName]][stateIds[dest]] = true;
      }
      if (interaction.defaultOutcome) {
        let defaultDest = interaction.defaultOutcome.dest;
        adjMatrix[stateIds[stateName]][stateIds[defaultDest]] = true;
      }
    }
    return adjMatrix;
  }

  /**
   * Returns a list of objects representing links in the diff graph.
   * Each object represents one link, and has keys:
   *  - 'source': source state of link
   *  - 'target': target state of link
   *  - 'linkProperty': 'added', 'deleted' or 'unchanged'
   */
  _compareLinks(
    v1States: StateObjectsDict,
    originalStateIds: StateIds,
    v2States: StateObjectsDict,
    newestStateIds: StateIds
  ): StateLink[] {
    let links = [];
    let adjMatrixV1 = this._getAdjMatrix(
      v1States,
      originalStateIds,
      this._maxId
    );
    let adjMatrixV2 = this._getAdjMatrix(v2States, newestStateIds, this._maxId);

    for (let i = 1; i <= this._maxId; i++) {
      for (let j = 1; j <= this._maxId; j++) {
        if (i !== j && (adjMatrixV1[i][j] || adjMatrixV2[i][j])) {
          links.push({
            source: i,
            target: j,
            linkProperty:
              adjMatrixV1[i][j] && adjMatrixV2[i][j]
                ? 'unchanged'
                : !adjMatrixV1[i][j] && adjMatrixV2[i][j]
                  ? 'added'
                  : 'deleted',
          });
        }
      }
    }

    return links;
  }

  getDiffGraphData(
    oldStates: StateObjectsDict,
    newStates: StateObjectsDict,
    changeListData: ExplorationGraphChangeList[]
  ): ProcessedStateIdsAndData {
    return this._getDiffGraphData(oldStates, newStates, changeListData);
  }
}
