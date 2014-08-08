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
 * @fileoverview Standalone services for the exploration editor page.
 *
 * @author sll@google.com (Sean Lip)
 */

// Service for handling all interactions with the exploration editor backend.
oppia.factory('explorationData', [
  '$http', '$log', 'warningsData', '$q',
  function($http, $log, warningsData, $q) {
    // The pathname (without the hash) should be: .../create/{exploration_id}
    var explorationId = '';
    var pathnameArray = window.location.pathname.split('/');
    for (var i = 0; i < pathnameArray.length; i++) {
      if (pathnameArray[i] === 'create') {
        var explorationId = pathnameArray[i + 1];
        break;
      }
    }

    if (!explorationId) {
      $log.error('Unexpected call to explorationData for pathname ', pathnameArray[i]);
      return;
    }

    var explorationUrl = '/create/' + explorationId;
    var explorationDataUrl = '/createhandler/data/' + explorationId;
    var resolvedAnswersUrlPrefix = '/createhandler/resolved_answers/' + explorationId;

    // TODO(sll): Find a fix for multiple users editing the same exploration
    // concurrently.

    // Put exploration variables here.
    var explorationData = {
      explorationId: explorationId,
      // Returns a promise that supplies the data for the current exploration.
      getData: function() {
        if (explorationData.data) {
          $log.info('Found exploration data in cache.');

          var deferred = $q.defer();
          deferred.resolve(explorationData.data);
          return deferred.promise;
        } else {
          // Retrieve data from the server.
          return $http.get(explorationDataUrl).then(function(response) {
            $log.info('Retrieved exploration data.');
            $log.info(response.data);

            explorationData.data = response.data;
            return response.data;
          });
        }
      },

      /**
       * Saves the exploration to the backend, and, on a success callback,
       * updates the data for the updated states in the frontend.
       * @param {object} explorationChangeList Represents the change list for
       *     this save. Each element of the list is a command representing an
       *     editing action (such as add state, delete state, etc.). See the
       *     _Change class in exp_services.py for full documentation.
       * @param {string} commitMessage The user-entered commit message for this
       *     save operation.
       */
      save: function(
          explorationChangeList, commitMessage, successCallback, errorCallback) {
        $http.put(explorationDataUrl, {
          change_list: explorationChangeList,
          commit_message: commitMessage,
          version: explorationData.data.version,
        }).success(function(data) {
          warningsData.clear();
          $log.info('Changes to this exploration were saved successfully.');
          explorationData.data = data;
          if (successCallback) {
            successCallback();
          }
        }).error(function(data) {
          if (errorCallback) {
            errorCallback();
          }
        });
      },

      resolveAnswers: function(stateName, resolvedAnswersList) {
        warningsData.clear();
        $http.put(resolvedAnswersUrlPrefix + '/' + encodeURIComponent(stateName), {
          resolved_answers: resolvedAnswersList
        });
      }
    };

    return explorationData;
  }
]);


// A service that maintains a record of which state in the exploration is
// currently active.
oppia.factory('editorContextService', ['$log', function($log) {
  var activeStateName = null;

  return {
    getActiveStateName: function() {
      return activeStateName;
    },
    setActiveStateName: function(newActiveStateName) {
      if (newActiveStateName === '' || newActiveStateName === null) {
        $log.error('Invalid active state name: ' + newActiveStateName);
        return;
      }
      activeStateName = newActiveStateName;
    }
  };
}]);


// TODO(sll): Should this depend on a versioning service that keeps track of
// the current active version? Previous versions should not be editable.
oppia.factory('editabilityService', [function() {
  var isEditable = false;
  return {
    isEditable: function() {
      return isEditable;
    },
    markEditable: function() {
      isEditable = true;
    },
    markNotEditable: function() {
      isEditable = false;
    }
  };
}]);


// A service that maintains a provisional list of changes to be committed to
// the server.
oppia.factory('changeListService', [
    '$rootScope', 'warningsData', function($rootScope, warningsData) {
  // TODO(sll): Implement undo, redo functionality. Show a message on each step
  // saying what the step is doing.
  // TODO(sll): Allow the user to view the list of changes made so far, as well
  // as the list of changes in the undo stack.

  // Temporary buffer for changes made to the exploration.
  var explorationChangeList = [];
  // Stack for storing undone changes. The last element is the most recently
  // undone change.
  var undoneChangeStack = [];

  var CMD_ADD_STATE = 'add_state';
  var CMD_RENAME_STATE = 'rename_state';
  var CMD_DELETE_STATE = 'delete_state';
  var CMD_EDIT_STATE_PROPERTY = 'edit_state_property';
  var CMD_EDIT_EXPLORATION_PROPERTY = 'edit_exploration_property';

  var EXPLORATION_BACKEND_NAMES_TO_FRONTEND_NAMES = {
    'title': 'explorationTitle',
    'category': 'explorationCategory',
    'objective': 'explorationObjective',
    'param_specs': 'paramSpecs',
    'param_changes': 'explorationParamChanges',
    'default_skin_id': 'defaultSkinId'
  };

  var STATE_BACKEND_NAMES_TO_FRONTEND_NAMES = {
    'widget_customization_args': 'widgetCustomizationArgs',
    'widget_id': 'widgetId',
    'widget_handlers': 'widgetHandlers',
    'widget_sticky': 'widgetSticky',
    'state_name': 'stateName',
    'content': 'content',
    'param_changes': 'stateParamChanges'
  };

  return {
    _postChangeHook: null,
    _addChange: function(changeDict) {
      if ($rootScope.loadingMessage) {
        return;
      }
      explorationChangeList.push(changeDict);
      undoneChangeStack = [];

      if (this._postChangeHook) {
        this._postChangeHook();
      }
    },
    /**
     * Saves a change dict that represents adding a new state.
     *
     * It is the responsbility of the caller to check that the new state name
     * is valid.
     *
     * @param {string} stateName The name of the newly-added state
     */
    addState: function(stateName) {
      this._addChange({
        cmd: CMD_ADD_STATE,
        state_name: stateName
      });
    },
    /**
     * Saves a change dict that represents the renaming of a state.
     *
     * It is the responsibility of the caller to check that the two names
     * are not equal.
     *
     * @param {string} newStateName The new name of the state
     * @param {string} oldStateName The previous name of the state
     */
    renameState: function(newStateName, oldStateName) {
      this._addChange({
        cmd: CMD_RENAME_STATE,
        old_state_name: oldStateName,
        new_state_name: newStateName
      });
    },
    /**
     * Saves a change dict that represents deleting a new state.
     *
     * It is the responsbility of the caller to check that the deleted state
     * name corresponds to an existing state.
     *
     * @param {string} stateName The name of the deleted state.
     */
    deleteState: function(stateName) {
      this._addChange({
        cmd: CMD_DELETE_STATE,
        state_name: stateName
      });
    },
    /**
     * Saves a change dict that represents a change to an exploration property
     * (e.g. title, category, etc.)
     *
     * It is the responsibility of the caller to check that the old and new
     * values are not equal.
     *
     * @param {string} backendName The backend name of the property
     *   (e.g. title, category)
     * @param {string} newValue The new value of the property
     * @param {string} oldValue The previous value of the property
     */
    editExplorationProperty: function(backendName, newValue, oldValue) {
      if (!EXPLORATION_BACKEND_NAMES_TO_FRONTEND_NAMES.hasOwnProperty(backendName)) {
        warningsData.addWarning('Invalid exploration property: ' + backendName);
        return;
      }
      this._addChange({
        cmd: CMD_EDIT_EXPLORATION_PROPERTY,
        property_name: backendName,
        new_value: angular.copy(newValue),
        old_value: angular.copy(oldValue)
      });
    },
    /**
     * Saves a change dict that represents a change to a state property.
     *
     * It is the responsibility of the caller to check that the old and new
     * values are not equal.
     *
     * @param {string} stateName The name of the state that is being edited
     * @param {string} backendName The backend name of the edited property
     * @param {string} newValue The new value of the property
     * @param {string} oldValue The previous value of the property
     */
    editStateProperty: function(stateName, backendName, newValue, oldValue) {
      if (!STATE_BACKEND_NAMES_TO_FRONTEND_NAMES.hasOwnProperty(backendName)) {
        warningsData.addWarning('Invalid state property: ' + backendName);
        return;
      }
      this._addChange({
        cmd: CMD_EDIT_STATE_PROPERTY,
        state_name: stateName,
        property_name: backendName,
        new_value: angular.copy(newValue),
        old_value: angular.copy(oldValue)
      });
    },
    discardAllChanges: function() {
      explorationChangeList = [];
      undoneChangeStack = [];
      if (this._postChangeHook) {
        this._postChangeHook();
      }
    },
    getChangeList: function() {
      return angular.copy(explorationChangeList);
    },
    undoLastChange: function() {
      if (explorationChangeList.length === 0) {
        warningsData.addWarning('There are no changes to undo.');
        return;
      }
      var lastChange = explorationChangeList.pop();
      undoneChangeStack.push(lastChange);
      if (this._postChangeHook) {
        this._postChangeHook();
      }
    },
    setPostChangeHook: function(postChangeHookFunction) {
      // Sets a function to be called after any edit to the changelist.
      this._postChangeHook = postChangeHookFunction;
    }
  };
}]);


oppia.factory('explorationPropertyService', [
    'changeListService', 'warningsData', function(changeListService, warningsData) {
  // Public base API for data services corresponding to exploration properties
  // (title, category, etc.)
  return {
    init: function(value) {
      // The current value of the property (which may not have been saved to the
      // frontend yet). In general, this will be bound directly to the UI.
      this.displayed = value;
      // The previous (saved-in-the-frontend) value of the property. Here, 'saved'
      // means that this is the latest value of the property as determined by the
      // frontend change list.
      this.savedMemento = value;
    },
    // Returns whether the current value has changed from the memento.
    hasChanged: function() {
      return (this.savedMemento !== this.displayed);
    },
    // The backend name for this property. THIS MUST BE SPECIFIED BY SUBCLASSES.
    propertyName: null,
    // Transforms the given value into a normalized form. THIS CAN BE
    // OVERRIDDEN BY SUBCLASSES. The default behavior is to do nothing.
    _normalize: function(value) {
      return value;
    },
    // Validates the given value and returns a boolean stating whether it
    // is valid or not. THIS CAN BE OVERRIDDEN BY SUBCLASSES. The default
    // behavior is to always return true.
    _isValid: function(value) {
      return true;
    },
    // Creates a new entry in the change list, and updates the memento to the
    // displayed value.
    saveDisplayedValue: function() {
      if (this.propertyName === null) {
        console.error('Property name cannot be null.');
        return;
      }

      this.displayed = this._normalize(this.displayed);
      if (!this._isValid(this.displayed) || !this.hasChanged()) {
        this.restoreFromMemento();
        return;
      }

      warningsData.clear();
      changeListService.editExplorationProperty(
        this.propertyName, this.displayed, this.savedMemento);
      this.savedMemento = this.displayed;
    },
    // Reverts the displayed value to the saved memento.
    restoreFromMemento: function() {
      this.displayed = this.savedMemento;
    }
  };
}]);

// A data service that stores the current exploration title so that it can be
// displayed and edited in multiple places in the UI.
oppia.factory('explorationTitleService', [
    'explorationPropertyService', '$filter', 'validatorsService',
    function(explorationPropertyService, $filter, validatorsService) {
  var child = Object.create(explorationPropertyService);
  child.propertyName = 'title';
  child._normalize = $filter('normalizeWhitespace');
  child._isValid = function(value) {
    return validatorsService.isValidEntityName(value, true);
  };
  return child;
}]);

// A data service that stores the current exploration category so that it can be
// displayed and edited in multiple places in the UI.
oppia.factory('explorationCategoryService', [
    'explorationPropertyService', '$filter', 'validatorsService',
    function(explorationPropertyService, $filter, validatorsService) {
  var child = Object.create(explorationPropertyService);
  child.propertyName = 'category';
  child._normalize = $filter('normalizeWhitespace');
  child._isValid = function(value) {
    return validatorsService.isValidEntityName(value, true);
  };
  return child;
}]);

// A data service that stores the current exploration objective so that it can be
// displayed and edited in multiple places in the UI.
oppia.factory('explorationObjectiveService', [
    'explorationPropertyService', '$filter', 'validatorsService',
    function(explorationPropertyService, $filter, validatorsService) {
  var child = Object.create(explorationPropertyService);
  child.propertyName = 'objective';
  child._normalize = $filter('normalizeWhitespace');
  child._isValid = function(value) {
    return validatorsService.isNonempty(value, true);
  };
  return child;
}]);


// A data service that stores data about the rights for this exploration.
oppia.factory('explorationRightsService', [
    '$http', 'explorationData', 'warningsData',
    function($http, explorationData, warningsData) {
  return {
    init: function(
        ownerNames, editorNames, viewerNames, status, clonedFrom,
        isCommunityOwned) {
      this.ownerNames = ownerNames;
      this.editorNames = editorNames;
      this.viewerNames = viewerNames;
      this._status = status;
      // This is null if the exploration was not cloned from anything,
      // otherwise it is the exploration ID of the source exploration.
      this._clonedFrom = clonedFrom;
      this._isCommunityOwned = isCommunityOwned;
    },
    clonedFrom: function() {
      return this._clonedFrom;
    },
    isPrivate: function() {
      return this._status === GLOBALS.EXPLORATION_STATUS_PRIVATE;
    },
    isPublic: function() {
      return this._status === GLOBALS.EXPLORATION_STATUS_PUBLIC;
    },
    isPublicized: function() {
      return this._status === GLOBALS.EXPLORATION_STATUS_PUBLICIZED;
    },
    isCloned: function() {
      return Boolean(this._clonedFrom);
    },
    isCommunityOwned: function() {
      return this._isCommunityOwned;
    },
    saveChangeToBackend: function(requestParameters) {
      var that = this;

      requestParameters.version = explorationData.data.version;
      var explorationRightsUrl = '/createhandler/rights/' + explorationData.explorationId;
      $http.put(explorationRightsUrl, requestParameters).success(function(data) {
        warningsData.clear();
        that.init(
          data.rights.owner_names, data.rights.editor_names, data.rights.viewer_names,
          data.rights.status, data.rights.cloned_from, data.rights.community_owned);
      });
    }
  };
}]);
