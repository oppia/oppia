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

oppia.factory('ExplorationDiffService', [
  'INTERACTION_SPECS', function(INTERACTION_SPECS) {
    var STATE_PROPERTY_ADDED = 'added';
    var STATE_PROPERTY_DELETED = 'deleted';
    var STATE_PROPERTY_CHANGED = 'changed';
    var STATE_PROPERTY_UNCHANGED = 'unchanged';
    var _maxId = 0;

    // Functions to assign ids to states
    var _resetMaxId = function() {
      _maxId = 0;
    };
    var _generateNewId = function() {
      _maxId++;
      return _maxId;
    };

    var _generateInitialStateIdsAndData = function(statesDict) {
      var result = {
        stateIds: {},
        stateData: {}
      };

      _resetMaxId();

      for (var stateName in statesDict) {
        var stateId = _generateNewId();
        result.stateData[stateId] = {
          newestStateName: stateName,
          originalStateName: stateName,
          stateProperty: STATE_PROPERTY_UNCHANGED
        };
        result.stateIds[stateName] = stateId;
      }
      return result;
    };

    var _postprocessStateIdsAndData = function(
        originalStateIds, stateIds, stateData, v1States, v2States) {
      // Ignore changes that were canceled out by later changes
      for (var stateId in stateData) {
        if (stateData[stateId].stateProperty === STATE_PROPERTY_CHANGED &&
            v1States.hasOwnProperty(stateData[stateId].originalStateName) &&
            v2States.hasOwnProperty(stateData[stateId].newestStateName) &&
            angular.equals(v1States[stateData[stateId].originalStateName],
              v2States[stateData[stateId].newestStateName])) {
          stateData[stateId].stateProperty = STATE_PROPERTY_UNCHANGED;
        }
      }

      // Delete states not present in both v1 and v2
      for (var stateId in stateData) {
        if (!v1States.hasOwnProperty(
          stateData[stateId].originalStateName) &&
            !v2States.hasOwnProperty(stateData[stateId].newestStateName)) {
          delete stateData[stateId];
        }
      }

      // Track whether terminal nodes in v1 or v2
      // TODO(bhenning): could show changes to terminal nodes in diff
      var finalStateIds = [];
      for (var stateId in stateData) {
        var oldState = v1States[stateData[stateId].originalStateName];
        var newState = v2States[stateData[stateId].newestStateName];
        var oldStateIsTerminal = false;
        var newStateIsTerminal = false;
        if (oldState) {
          oldStateIsTerminal = (
            oldState.interaction.id &&
            INTERACTION_SPECS[oldState.interaction.id].is_terminal);
        }
        if (newState) {
          newStateIsTerminal = (
            newState.interaction.id &&
            INTERACTION_SPECS[newState.interaction.id].is_terminal);
        }
        if (oldStateIsTerminal || newStateIsTerminal) {
          finalStateIds.push(stateId);
        }
      }

      var links = _compareLinks(
        v1States, originalStateIds, v2States, stateIds);

      return {
        nodes: stateData,
        links: links,
        originalStateIds: originalStateIds,
        stateIds: stateIds,
        finalStateIds: finalStateIds
      };
    };

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
    var _getDiffGraphData = function(v1States, v2States, changeListData) {
      var v1Info = _generateInitialStateIdsAndData(v1States);
      var stateData = v1Info.stateData;
      var stateIds = v1Info.stateIds;
      var originalStateIds = angular.copy(stateIds);

      changeListData.forEach(function(changeListDatum) {
        var changeList = changeListDatum.changeList;
        var directionForwards = changeListDatum.directionForwards;

        changeList.forEach(function(change) {
          if ((directionForwards && change.cmd === 'add_state') ||
              (!directionForwards && change.cmd === 'delete_state')) {
            if (!stateIds.hasOwnProperty(change.state_name)) {
              var newId = _generateNewId();
              stateIds[change.state_name] = newId;
            }
            var currentStateId = stateIds[change.state_name];
            if (stateData.hasOwnProperty(currentStateId) &&
                stateData[currentStateId].stateProperty ===
                  STATE_PROPERTY_DELETED) {
              stateData[currentStateId].stateProperty = STATE_PROPERTY_CHANGED;
              stateData[currentStateId].newestStateName = change.state_name;
            } else {
              stateData[currentStateId] = {
                newestStateName: change.state_name,
                originalStateName: change.state_name,
                stateProperty: STATE_PROPERTY_ADDED
              };
            }
          } else if ((directionForwards && change.cmd === 'delete_state') ||
              (!directionForwards && change.cmd === 'add_state')) {
            if (stateData[stateIds[change.state_name]].stateProperty ===
                STATE_PROPERTY_ADDED) {
              stateData[stateIds[change.state_name]].stateProperty = (
                STATE_PROPERTY_CHANGED);
            } else {
              stateData[stateIds[change.state_name]].stateProperty = (
                STATE_PROPERTY_DELETED);
            }
          } else if (change.cmd === 'rename_state') {
            var newStateName = null;
            var oldStateName = null;
            if (directionForwards) {
              newStateName = change.new_state_name;
              oldStateName = change.old_state_name;
            } else {
              newStateName = change.old_state_name;
              oldStateName = change.new_state_name;
            }
            stateIds[newStateName] = stateIds[oldStateName];
            delete stateIds[oldStateName];
            stateData[stateIds[newStateName]].newestStateName = newStateName;
          } else if (change.cmd === 'edit_state_property') {
            if (stateData[stateIds[change.state_name]].stateProperty ===
                STATE_PROPERTY_UNCHANGED) {
              stateData[stateIds[change.state_name]].stateProperty = (
                STATE_PROPERTY_CHANGED);
            }
          } else if (
            change.cmd !== 'migrate_states_schema_to_latest_version' &&
              change.cmd !== 'AUTO_revert_version_number' &&
              change.cmd !== 'edit_exploration_property') {
            throw new Error('Invalid change command: ' + change.cmd);
          }
        });
      });

      return _postprocessStateIdsAndData(
        originalStateIds, stateIds, stateData, v1States, v2States);
    };

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
    var _getAdjMatrix = function(states, stateIds, maxId) {
      adjMatrix = {};
      for (var stateId = 1; stateId <= maxId; stateId++) {
        adjMatrix[stateId] = {};
      }
      for (var state1Id = 1; state1Id <= maxId; state1Id++) {
        for (var state2Id = 1; state2Id <= maxId; state2Id++) {
          adjMatrix[state1Id][state2Id] = false;
        }
      }
      for (var stateName in states) {
        var interaction = states[stateName].interaction;
        var groups = interaction.answerGroups;
        for (var h = 0; h < groups.length; h++) {
          var dest = groups[h].outcome.dest;
          adjMatrix[stateIds[stateName]][stateIds[dest]] = true;
        }
        if (interaction.defaultOutcome) {
          var defaultDest = interaction.defaultOutcome.dest;
          adjMatrix[stateIds[stateName]][stateIds[defaultDest]] = true;
        }
      }
      return adjMatrix;
    };

    /**
     * Returns a list of objects representing links in the diff graph.
     * Each object represents one link, and has keys:
     *  - 'source': source state of link
     *  - 'target': target state of link
     *  - 'linkProperty': 'added', 'deleted' or 'unchanged'
     */
    var _compareLinks = function(
        v1States, originalStateIds, v2States, newestStateIds) {
      links = [];
      var adjMatrixV1 = _getAdjMatrix(v1States, originalStateIds, _maxId);
      var adjMatrixV2 = _getAdjMatrix(v2States, newestStateIds, _maxId);

      for (var i = 1; i <= _maxId; i++) {
        for (var j = 1; j <= _maxId; j++) {
          if (i !== j && (adjMatrixV1[i][j] || adjMatrixV2[i][j])) {
            links.push({
              source: i,
              target: j,
              linkProperty: (
                adjMatrixV1[i][j] && adjMatrixV2[i][j] ? 'unchanged' :
                !adjMatrixV1[i][j] && adjMatrixV2[i][j] ? 'added' : 'deleted')
            });
          }
        }
      }

      return links;
    };

    return {
      getDiffGraphData: function(oldStates, newStates, changeListData) {
        return _getDiffGraphData(
          oldStates,
          newStates,
          changeListData);
      }
    };
  }
]);
