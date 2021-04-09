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
 * @fileoverview A service that maintains a provisional list of changes to be
 * committed to the server.
 */

import { EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
require(
  'pages/exploration-editor-page/services/autosave-info-modals.service.ts');
require('pages/exploration-editor-page/services/exploration-data.service.ts');
require('services/alerts.service.ts');

angular.module('oppia').factory('ChangeListService', [
  '$log', '$rootScope', 'AlertsService', 'AutosaveInfoModalsService',
  'ExplorationDataService', 'LoaderService',
  function(
      $log, $rootScope, AlertsService, AutosaveInfoModalsService,
      ExplorationDataService, LoaderService) {
    // TODO(sll): Implement undo, redo functionality. Show a message on each
    // step saying what the step is doing.
    // TODO(sll): Allow the user to view the list of changes made so far, as
    // well as the list of changes in the undo stack.

    // Temporary buffer for changes made to the exploration.
    var explorationChangeList = [];
    // Stack for storing undone changes. The last element is the most recently
    // undone change.
    var undoneChangeStack = [];
    var loadingMessage = '';
    LoaderService.onLoadingMessageChange.subscribe(
      (message: string) => loadingMessage = message
    );
    // All these constants should correspond to those in exp_domain.py.
    // TODO(sll): Enforce this in code.
    var CMD_ADD_STATE = 'add_state';
    var CMD_RENAME_STATE = 'rename_state';
    var CMD_DELETE_STATE = 'delete_state';
    var CMD_EDIT_STATE_PROPERTY = 'edit_state_property';
    var CMD_EDIT_EXPLORATION_PROPERTY = 'edit_exploration_property';
    var autosaveInProgressEventEmitter: EventEmitter<boolean> = (
      new EventEmitter<boolean>());
    var ALLOWED_EXPLORATION_BACKEND_NAMES = {
      category: true,
      init_state_name: true,
      language_code: true,
      objective: true,
      param_changes: true,
      param_specs: true,
      tags: true,
      title: true,
      auto_tts_enabled: true,
      correctness_feedback_enabled: true
    };

    var ALLOWED_STATE_BACKEND_NAMES = {
      answer_groups: true,
      confirmed_unclassified_answers: true,
      content: true,
      recorded_voiceovers: true,
      default_outcome: true,
      hints: true,
      next_content_id_index: true,
      param_changes: true,
      param_specs: true,
      solicit_answer_details: true,
      solution: true,
      state_name: true,
      widget_customization_args: true,
      widget_id: true,
      written_translations: true
    };
    var changeListAddedTimeoutId = null;
    var DEFAULT_WAIT_FOR_AUTOSAVE_MSEC = 200;

    var autosaveChangeListOnChange = function(explorationChangeList) {
      // Asynchronously send an autosave request, and check for errors in the
      // response:
      // If error is present -> Check for the type of error occurred
      // (Display the corresponding modals in both cases, if not already
      // opened):
      // - Version Mismatch.
      // - Non-strict Validation Fail.
      ExplorationDataService.autosaveChangeList(
        explorationChangeList,
        function(response) {
          if (!response.is_version_of_draft_valid) {
            if (!AutosaveInfoModalsService.isModalOpen()) {
              AutosaveInfoModalsService.showVersionMismatchModal(
                explorationChangeList);
            }
          }
          autosaveInProgressEventEmitter.emit(false);
          $rootScope.$applyAsync();
        },
        function() {
          AlertsService.clearWarnings();
          $log.error(
            'nonStrictValidationFailure: ' +
            JSON.stringify(explorationChangeList));
          if (!AutosaveInfoModalsService.isModalOpen()) {
            AutosaveInfoModalsService.showNonStrictValidationFailModal();
          }
          autosaveInProgressEventEmitter.emit(false);
          $rootScope.$applyAsync();
        }
      );
    };

    var addChange = function(changeDict) {
      if (loadingMessage) {
        return;
      }
      explorationChangeList.push(changeDict);
      undoneChangeStack = [];
      autosaveInProgressEventEmitter.emit(true);
      if (changeListAddedTimeoutId) {
        clearTimeout(changeListAddedTimeoutId);
      }
      changeListAddedTimeoutId = setTimeout(() => {
        autosaveChangeListOnChange(explorationChangeList);
      }, DEFAULT_WAIT_FOR_AUTOSAVE_MSEC);
    };

    return {
      /**
       * Saves a change dict that represents adding a new state. It is the
       * responsbility of the caller to check that the new state name is valid.
       *
       * @param {string} stateName - The name of the newly-added state
       */
      addState: function(stateName) {
        addChange({
          cmd: CMD_ADD_STATE,
          state_name: stateName
        });
      },
      /**
       * Saves a change dict that represents deleting a new state. It is the
       * responsbility of the caller to check that the deleted state name
       * corresponds to an existing state.
       *
       * @param {string} stateName - The name of the deleted state.
       */
      deleteState: function(stateName) {
        addChange({
          cmd: CMD_DELETE_STATE,
          state_name: stateName
        });
      },
      discardAllChanges: function() {
        explorationChangeList = [];
        undoneChangeStack = [];
        return ExplorationDataService.discardDraft();
      },
      /**
       * Saves a change dict that represents a change to an exploration
       * property (such as its title, category, ...). It is the responsibility
       * of the caller to check that the old and new values are not equal.
       *
       * @param {string} backendName - The backend name of the property
       *   (e.g. title, category)
       * @param {string} newValue - The new value of the property
       * @param {string} oldValue - The previous value of the property
       */
      editExplorationProperty: function(backendName, newValue, oldValue) {
        if (!ALLOWED_EXPLORATION_BACKEND_NAMES.hasOwnProperty(backendName)) {
          AlertsService.addWarning(
            'Invalid exploration property: ' + backendName);
          return;
        }
        addChange({
          cmd: CMD_EDIT_EXPLORATION_PROPERTY,
          new_value: angular.copy(newValue),
          old_value: angular.copy(oldValue),
          property_name: backendName
        });
      },
      /**
       * Saves a change dict that represents a change to a state property. It
       * is the responsibility of the caller to check that the old and new
       * values are not equal.
       *
       * @param {string} stateName - The name of the state that is being edited
       * @param {string} backendName - The backend name of the edited property
       * @param {string} newValue - The new value of the property
       * @param {string} oldValue - The previous value of the property
       */
      editStateProperty: function(stateName, backendName, newValue, oldValue) {
        if (!ALLOWED_STATE_BACKEND_NAMES.hasOwnProperty(backendName)) {
          AlertsService.addWarning('Invalid state property: ' + backendName);
          return;
        }
        addChange({
          cmd: CMD_EDIT_STATE_PROPERTY,
          new_value: angular.copy(newValue),
          old_value: angular.copy(oldValue),
          property_name: backendName,
          state_name: stateName
        });
      },
      getChangeList: function() {
        return angular.copy(explorationChangeList);
      },
      isExplorationLockedForEditing: function() {
        return explorationChangeList.length > 0;
      },
      /**
       * Initializes the current changeList with the one received from backend.
       * This behavior exists only in case of an autosave.
       *
       * @param {object} changeList - Autosaved changeList data
       */
      loadAutosavedChangeList: function(changeList) {
        explorationChangeList = changeList;
      },
      /**
       * Saves a change dict that represents the renaming of a state. This
       * is also intended to change the initial state name if necessary
       * (that is, the latter change is implied and does not have to be
       * recorded separately in another change dict). It is the responsibility
       * of the caller to check that the two names are not equal.
       *
       * @param {string} newStateName - The new name of the state
       * @param {string} oldStateName - The previous name of the state
       */
      renameState: function(newStateName, oldStateName) {
        addChange({
          cmd: CMD_RENAME_STATE,
          new_state_name: newStateName,
          old_state_name: oldStateName
        });
      },
      undoLastChange: function() {
        if (explorationChangeList.length === 0) {
          AlertsService.addWarning('There are no changes to undo.');
          return;
        }
        var lastChange = explorationChangeList.pop();
        undoneChangeStack.push(lastChange);
        autosaveChangeListOnChange(explorationChangeList);
      },

      get autosaveIsInProgress$(): Observable<boolean> {
        return autosaveInProgressEventEmitter.asObservable();
      }
    };
  }
]);
