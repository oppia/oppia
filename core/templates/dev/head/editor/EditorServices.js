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
      // Note: if we do not return anything, Karma unit tests fail.
      return {};
    }

    var explorationUrl = '/create/' + explorationId;
    var explorationDataUrl = '/createhandler/data/' + explorationId;
    var resolvedAnswersUrlPrefix = '/createhandler/resolved_answers/' + explorationId;

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
       * updates the local copy of the exploration data.
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
  var _isEditable = false;
  var _inTutorialMode = false;
  return {
    onStartTutorial: function() {
      _inTutorialMode = true;
    },
    onEndTutorial: function() {
      _inTutorialMode = false;
    },
    isEditableOutsideTutorialMode: function() {
      return _isEditable;
    },
    isEditable: function() {
      return _isEditable && !_inTutorialMode;
    },
    markEditable: function() {
      _isEditable = true;
    },
    markNotEditable: function() {
      _isEditable = false;
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

  // All these constants should correspond to those in exp_domain.py.
  // TODO(sll): Enforce this in code.
  var CMD_ADD_STATE = 'add_state';
  var CMD_RENAME_STATE = 'rename_state';
  var CMD_DELETE_STATE = 'delete_state';
  var CMD_EDIT_STATE_PROPERTY = 'edit_state_property';
  var CMD_EDIT_EXPLORATION_PROPERTY = 'edit_exploration_property';

  var ALLOWED_EXPLORATION_BACKEND_NAMES = {
    'title': true,
    'category': true,
    'objective': true,
    'language_code': true,
    'param_specs': true,
    'param_changes': true,
    'default_skin_id': true,
    'init_state_name': true
  };

  var ALLOWED_STATE_BACKEND_NAMES = {
    'widget_customization_args': true,
    'widget_id': true,
    'widget_handlers': true,
    'state_name': true,
    'content': true,
    'param_changes': true
  };

  return {
    _addChange: function(changeDict) {
      if ($rootScope.loadingMessage) {
        return;
      }
      explorationChangeList.push(changeDict);
      undoneChangeStack = [];
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
     * Saves a change dict that represents the renaming of a state. This
     * is also intended to change exploration.initStateName if necessary
     * (i.e., the latter change is implied and does not have to be recorded
     * separately in another change dict).
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
      if (!ALLOWED_EXPLORATION_BACKEND_NAMES.hasOwnProperty(backendName)) {
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
      if (!ALLOWED_STATE_BACKEND_NAMES.hasOwnProperty(backendName)) {
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
    },
    getChangeList: function() {
      return angular.copy(explorationChangeList);
    },
    isExplorationLockedForEditing: function() {
      return explorationChangeList.length > 0;
    },
    undoLastChange: function() {
      if (explorationChangeList.length === 0) {
        warningsData.addWarning('There are no changes to undo.');
        return;
      }
      var lastChange = explorationChangeList.pop();
      undoneChangeStack.push(lastChange);
    }
  };
}]);


// A data service that stores data about the rights for this exploration.
oppia.factory('explorationRightsService', [
    '$http', 'explorationData', 'warningsData',
    function($http, explorationData, warningsData) {
  return {
    init: function(
        ownerNames, editorNames, viewerNames, status, clonedFrom,
        isCommunityOwned, viewableIfPrivate) {
      this.ownerNames = ownerNames;
      this.editorNames = editorNames;
      this.viewerNames = viewerNames;
      this._status = status;
      // This is null if the exploration was not cloned from anything,
      // otherwise it is the exploration ID of the source exploration.
      this._clonedFrom = clonedFrom;
      this._isCommunityOwned = isCommunityOwned;
      this._viewableIfPrivate = viewableIfPrivate;
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
    viewableIfPrivate: function() {
      return this._viewableIfPrivate;
    },
    saveChangeToBackend: function(requestParameters) {
      var that = this;

      requestParameters.version = explorationData.data.version;
      var explorationRightsUrl = '/createhandler/rights/' + explorationData.explorationId;
      $http.put(explorationRightsUrl, requestParameters).success(function(data) {
        warningsData.clear();
        that.init(
          data.rights.owner_names, data.rights.editor_names, data.rights.viewer_names,
          data.rights.status, data.rights.cloned_from, data.rights.community_owned,
          data.rights.viewable_if_private);
      });
    }
  };
}]);


oppia.factory('explorationPropertyService', [
    '$rootScope', '$log', 'changeListService', 'warningsData',
    function($rootScope, $log, changeListService, warningsData) {
  // Public base API for data services corresponding to exploration properties
  // (title, category, etc.)
  return {
    init: function(value) {
      if (this.propertyName === null) {
        throw 'Exploration property name cannot be null.';
      }

      $log.info('Initializing exploration ' + this.propertyName + ':', value);

      // The current value of the property (which may not have been saved to the
      // frontend yet). In general, this will be bound directly to the UI.
      this.displayed = angular.copy(value);
      // The previous (saved-in-the-frontend) value of the property. Here, 'saved'
      // means that this is the latest value of the property as determined by the
      // frontend change list.
      this.savedMemento = angular.copy(value);

      $rootScope.$broadcast('explorationPropertyChanged');
    },
    // Returns whether the current value has changed from the memento.
    hasChanged: function() {
      return !angular.equals(this.savedMemento, this.displayed);
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
    // Normalizes the displayed value. Then, if the memento and the displayed
    // value are the same, does nothing. Otherwise, creates a new entry in the
    // change list, and updates the memento to the displayed value.
    saveDisplayedValue: function() {
      if (this.propertyName === null) {
        throw 'Exploration property name cannot be null.';
      }

      this.displayed = this._normalize(this.displayed);
      if (!this._isValid(this.displayed) || !this.hasChanged()) {
        this.restoreFromMemento();
        return;
      }

      if (angular.equals(this.displayed, this.savedMemento)) {
        return;
      }

      warningsData.clear();
      changeListService.editExplorationProperty(
        this.propertyName, this.displayed, this.savedMemento);
      this.savedMemento = angular.copy(this.displayed);

      $rootScope.$broadcast('explorationPropertyChanged');
    },
    // Reverts the displayed value to the saved memento.
    restoreFromMemento: function() {
      this.displayed = angular.copy(this.savedMemento);
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
    return validatorsService.isNonempty(value, false);
  };
  return child;
}]);

// A data service that stores the exploration language code.
oppia.factory('explorationLanguageCodeService', [
    'explorationPropertyService', function(explorationPropertyService) {
  var child = Object.create(explorationPropertyService);
  child.propertyName = 'language_code';
  child.getAllLanguageCodes = function() {
    return GLOBALS.ALL_LANGUAGE_CODES;
  };
  child.getCurrentLanguageDescription = function() {
    for (var i = 0; i < GLOBALS.ALL_LANGUAGE_CODES.length; i++) {
      if (GLOBALS.ALL_LANGUAGE_CODES[i].code === child.displayed) {
        return GLOBALS.ALL_LANGUAGE_CODES[i].description;
      }
    }
  };
  child._isValid = function(value) {
    return GLOBALS.ALL_LANGUAGE_CODES.some(function(elt) {
      return elt.code === value;
    });
  };
  return child;
}]);

// A data service that stores the name of the exploration's initial state.
// NOTE: This service does not perform validation. Users of this service
// should ensure that new initial state names passed to the service are
// valid.
oppia.factory('explorationInitStateNameService', [
    'explorationPropertyService', function(explorationPropertyService) {
  var child = Object.create(explorationPropertyService);
  child.propertyName = 'init_state_name';
  child._isValid = function(value) {
    return true;
  };
  return child;
}]);

oppia.factory('explorationParamSpecsService', [
    'explorationPropertyService', function(explorationPropertyService) {
  var child = Object.create(explorationPropertyService);
  child.propertyName = 'param_specs';
  child._isValid = function(value) {
    return true;
  };
  return child;
}]);

oppia.factory('explorationParamChangesService', [
    'explorationPropertyService', function(explorationPropertyService) {
  var child = Object.create(explorationPropertyService);
  child.propertyName = 'param_changes';
  child._isValid = function(value) {
    return true;
  };
  return child;
}]);


// Data service for keeping track of the exploration's states. Note that this
// is unlike the other exploration property services, in that it keeps no
// mementos.
oppia.factory('explorationStatesService', [
    '$log', '$modal', '$filter', '$location', '$rootScope', 'explorationInitStateNameService',
    'warningsData', 'changeListService', 'editorContextService', 'validatorsService',
    'newStateTemplateService',
    function($log, $modal, $filter, $location, $rootScope, explorationInitStateNameService,
             warningsData, changeListService, editorContextService, validatorsService,
             newStateTemplateService) {
  var _states = null;
  return {
    setStates: function(value) {
      _states = angular.copy(value);
    },
    getStates: function() {
      return angular.copy(_states);
    },
    getState: function(stateName) {
      return angular.copy(_states[stateName]);
    },
    setState: function(stateName, stateData) {
      _states[stateName] = angular.copy(stateData);
      $rootScope.$broadcast('refreshGraph');
    },
    isNewStateNameValid: function(newStateName, showWarnings) {
      if (_states[newStateName]) {
        if (showWarnings) {
          warningsData.addWarning('A state with this name already exists.');
        }
        return false;
      }
      return (
        validatorsService.isValidStateName(newStateName, showWarnings));
    },
    addState: function(newStateName, successCallback) {
      newStateName = $filter('normalizeWhitespace')(newStateName);
      if (!validatorsService.isValidStateName(newStateName, true)) {
        return;
      }
      if (!!_states[newStateName]) {
        warningsData.addWarning('A state with this name already exists.');
        return;
      }
      warningsData.clear();

      _states[newStateName] = newStateTemplateService.getNewStateTemplate(
        newStateName);
      changeListService.addState(newStateName);
      $rootScope.$broadcast('refreshGraph');
      if (successCallback) {
        successCallback(newStateName);
      }
    },
    deleteState: function(deleteStateName) {
      warningsData.clear();

      var initStateName = explorationInitStateNameService.displayed;
      if (deleteStateName === initStateName || deleteStateName === END_DEST) {
        return;
      }
      if (!_states[deleteStateName]) {
        warningsData.addWarning('No state with name ' + deleteStateName + ' exists.');
        return;
      }

      $modal.open({
        templateUrl: 'modals/deleteState',
        backdrop: true,
        resolve: {
          deleteStateName: function() {
            return deleteStateName;
          }
        },
        controller: [
          '$scope', '$modalInstance', 'deleteStateName',
          function($scope, $modalInstance, deleteStateName) {
            $scope.deleteStateName = deleteStateName;

            $scope.reallyDelete = function() {
              $modalInstance.close(deleteStateName);
            };

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
              warningsData.clear();
            };
          }
        ]
      }).result.then(function(deleteStateName) {
        delete _states[deleteStateName];
        for (var otherStateName in _states) {
          var handlers = _states[otherStateName].interaction.handlers;
          for (var i = 0; i < handlers.length; i++) {
            for (var j = 0; j < handlers[i].rule_specs.length; j++) {
              if (handlers[i].rule_specs[j].dest === deleteStateName) {
                handlers[i].rule_specs[j].dest = otherStateName;
              }
            }
          }
        }
        changeListService.deleteState(deleteStateName);

        if (editorContextService.getActiveStateName() === deleteStateName) {
          editorContextService.setActiveStateName(
            explorationInitStateNameService.savedMemento);
        }

        $location.path('/gui/' + editorContextService.getActiveStateName());
        $rootScope.$broadcast('refreshGraph');
        // This ensures that if the deletion changes rules in the current
        // state, they get updated in the view.
        $rootScope.$broadcast('refreshStateEditor');
      });
    },
    renameState: function(oldStateName, newStateName) {
      newStateName = $filter('normalizeWhitespace')(newStateName);
      if (!validatorsService.isValidStateName(newStateName, true)) {
        return;
      }
      if (!!_states[newStateName]) {
        warningsData.addWarning('A state with this name already exists.');
        return;
      }
      warningsData.clear();

      _states[newStateName] = angular.copy(_states[oldStateName]);
      delete _states[oldStateName];

      for (var otherStateName in _states) {
        var handlers = _states[otherStateName].interaction.handlers;
        for (var i = 0; i < handlers.length; i++) {
          for (var j = 0; j < handlers[i].rule_specs.length; j++) {
            if (handlers[i].rule_specs[j].dest === oldStateName) {
              handlers[i].rule_specs[j].dest = newStateName;
            }
          }
        }
      }

      editorContextService.setActiveStateName(newStateName);
      // The 'rename state' command must come before the 'change init_state_name'
      // command in the change list, otherwise the backend will raise an error
      // because the new initial state name does not exist.
      changeListService.renameState(newStateName, oldStateName);
      // Amend initStateName appropriately, if necessary. Note that this
      // must come after the state renaming, otherwise saving will lead to
      // a complaint that the new name is not a valid state name.
      if (explorationInitStateNameService.displayed === oldStateName) {
        explorationInitStateNameService.displayed = newStateName;
        explorationInitStateNameService.saveDisplayedValue(newStateName);
      }
      $rootScope.$broadcast('refreshGraph');
    }
  };
}]);

oppia.factory('statePropertyService', [
    '$log', 'changeListService', 'warningsData', function($log, changeListService, warningsData) {
  // Public base API for data services corresponding to state properties
  // (interaction id, content, etc.)
  // WARNING: This should be initialized only in the context of the state editor, and
  // every time the state is loaded, so that proper behavior is maintained if e.g.
  // the state is renamed.
  // Note that this does not update explorationStatesService. It is maintained only locally.
  // TODO(sll): Make this update explorationStatesService.
  return {
    init: function(stateName, value, statesAccessorDict, statesAccessorKey) {
      if (!statesAccessorDict || !statesAccessorKey) {
        throw 'Not enough args passed into statePropertyService.init().';
      }

      if (this.propertyName === null) {
        throw 'State property name cannot be null.';
      }

      $log.info('Initializing state ' + this.propertyName + ':', value);

      // A reference to the state dict that should be updated.
      this.statesAccessorDict = statesAccessorDict;
      // The name of the key in statesAccessorDict whose value should be updated.
      this.statesAccessorKey = statesAccessorKey;
      // The name of the state.
      this.stateName = stateName;
      // The current value of the property (which may not have been saved to the
      // frontend yet). In general, this will be bound directly to the UI.
      this.displayed = angular.copy(value);
      // The previous (saved-in-the-frontend) value of the property. Here, 'saved'
      // means that this is the latest value of the property as determined by the
      // frontend change list.
      this.savedMemento = angular.copy(value);
    },
    // Returns whether the current value has changed from the memento.
    hasChanged: function() {
      return !angular.equals(this.savedMemento, this.displayed);
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
        throw 'State property name cannot be null.';
      }

      this.displayed = this._normalize(this.displayed);
      if (!this._isValid(this.displayed) || !this.hasChanged()) {
        this.restoreFromMemento();
        return;
      }

      if (angular.equals(this.displayed, this.savedMemento)) {
        return;
      }

      warningsData.clear();
      changeListService.editStateProperty(
        this.stateName, this.propertyName, this.displayed, this.savedMemento);

      // Update $scope.states.
      this.statesAccessorDict[this.statesAccessorKey] = angular.copy(this.displayed);
      this.savedMemento = angular.copy(this.displayed);
    },
    // Reverts the displayed value to the saved memento.
    restoreFromMemento: function() {
      this.displayed = angular.copy(this.savedMemento);
    }
  };
}]);

// A data service that stores the current interaction id.
// TODO(sll): Add validation.
oppia.factory('stateInteractionIdService', [
    'statePropertyService', function(statePropertyService) {
  var child = Object.create(statePropertyService);
  child.propertyName = 'widget_id';
  return child;
}]);

// A data service that stores the current state customization args for the
// interaction. This is a dict mapping customization arg names to dicts of the
// form {value: customization_arg_value}.
// TODO(sll): Add validation.
oppia.factory('stateCustomizationArgsService', [
    'statePropertyService', function(statePropertyService) {
  var child = Object.create(statePropertyService);
  child.propertyName = 'widget_customization_args';
  return child;
}]);


// A service that returns the frontend representation of a newly-added state.
oppia.factory('newStateTemplateService', [function() {
  return {
    // Returns a template for the new state with the given state name, changing
    // the default rule destination to the new state name in the process.
    // NB: clients should ensure that the desired state name is valid.
    getNewStateTemplate: function(newStateName) {
      var newStateTemplate = angular.copy(GLOBALS.NEW_STATE_TEMPLATE);
      newStateTemplate.interaction.handlers.forEach(function(handler) {
        handler.rule_specs.forEach(function(ruleSpec) {
          ruleSpec.dest = newStateName;
        });
      });
      return newStateTemplate;
    }
  };
}]);


oppia.factory('computeGraphService', ['INTERACTION_SPECS', function(INTERACTION_SPECS) {

  var _computeGraphData = function(initStateId, states) {
    var nodes = {};
    var links = [];
    var finalStateIds = [END_DEST];
    for (var stateName in states) {
      if (states[stateName].interaction.id &&
          INTERACTION_SPECS[states[stateName].interaction.id].is_terminal) {
        finalStateIds.push(stateName);
      }

      nodes[stateName] = stateName;

      if (states[stateName].interaction.id) {
        var handlers = states[stateName].interaction.handlers;
        for (var h = 0; h < handlers.length; h++) {
          var ruleSpecs = handlers[h].rule_specs;
          for (i = 0; i < ruleSpecs.length; i++) {
            links.push({
              source: stateName,
              target: ruleSpecs[i].dest,
            });
          }
        }
      }
    }
    nodes[END_DEST] = END_DEST;

    return {
      nodes: nodes,
      links: links,
      initStateId: initStateId,
      finalStateIds: finalStateIds
    };
  };

  return {
    compute: function(initStateId, states) {
      return _computeGraphData(initStateId, states);
    }
  };
}]);


// Service for computing graph data.
oppia.factory('graphDataService', [
    'explorationStatesService', 'explorationInitStateNameService',
    'computeGraphService', function(explorationStatesService,
    explorationInitStateNameService, computeGraphService) {

  var _graphData = null;

  // Returns an object which can be treated as the input to a visualization
  // for a directed graph. The returned object has the following keys:
  //   - nodes: an object whose keys are node ids (equal to node names) and whose
  //      values are node names
  //   - links: a list of objects. Each object represents a directed link between
  //      two notes, and has keys 'source' and 'target', the values of which are
  //      the names of the corresponding nodes.
  //   - initStateName: the name of the initial state.
  //   - finalStateName: the name of the final state.
  var _recomputeGraphData = function() {
    if (!explorationInitStateNameService.savedMemento) {
      return;
    }

    var states = explorationStatesService.getStates();
    var initStateId = explorationInitStateNameService.savedMemento;
    _graphData = computeGraphService.compute(initStateId, states);
  };

  return {
    recompute: function() {
      _recomputeGraphData();
    },
    getGraphData: function() {
      return angular.copy(_graphData);
    }
  };
}]);


// Service for the state editor tutorial.
oppia.factory('stateEditorTutorialFirstTimeService', ['$http', '$rootScope', function($http, $rootScope) {
  // Whether this is the first time the tutorial has been seen by this user.
  var _currentlyInFirstVisit = true;

  return {
    // After the first call to it in a client session, this does nothing.
    init: function(firstTime, explorationId) {
      if (!firstTime || !_currentlyInFirstVisit) {
        _currentlyInFirstVisit = false;
      }

      if (_currentlyInFirstVisit) {
        $rootScope.$broadcast('openEditorTutorial');
        $http.post('/createhandler/started_tutorial_event/' + explorationId).error(function() {
          console.error('Warning: could not record tutorial start event.');
        });
      }
    },
    markTutorialFinished: function() {
      if (_currentlyInFirstVisit) {
        $rootScope.$broadcast('openPostTutorialHelpPopover');
      }

      _currentlyInFirstVisit = false;
    }
  };
}]);


oppia.constant('WARNING_TYPES', {
  // These must be fixed before the exploration can be saved.
  CRITICAL: 'critical',
  // These must be fixed before publishing an exploration to the gallery.
  ERROR: 'error'
});

// Service for the list of exploration warnings.
oppia.factory('explorationWarningsService', [
    '$filter', 'graphDataService', 'explorationStatesService',
    'expressionInterpolationService', 'explorationParamChangesService',
    'explorationObjectiveService', 'INTERACTION_SPECS', 'WARNING_TYPES',
    function(
      $filter, graphDataService, explorationStatesService,
      expressionInterpolationService, explorationParamChangesService,
      explorationObjectiveService, INTERACTION_SPECS, WARNING_TYPES) {
  var _warningsList = [];

  var _getStatesWithoutInteractionIds = function() {
    var statesWithoutInteractionIds = [];

    var _states = explorationStatesService.getStates();
    for (var stateName in _states) {
      if (!_states[stateName].interaction.id) {
        statesWithoutInteractionIds.push(stateName);
      }
    }

    return statesWithoutInteractionIds;
  };

  // Given a list of initial node ids, a object with keys node ids, and values
  // node names, and a list of edges (each of which is an object with keys
  // 'source' and 'target', and values equal to the respective node names),
  // returns a list of names of all nodes which are unreachable from the
  // initial node.
  var _getUnreachableNodeNames = function(initNodeIds, nodes, edges) {
    var queue = initNodeIds;
    var seen = {};
    for (var i = 0; i < initNodeIds.length; i++) {
      seen[initNodeIds[i]] = true;
    }
    while (queue.length > 0) {
      var currNodeId = queue.shift();
      edges.forEach(function(edge) {
        if (edge.source === currNodeId && !seen.hasOwnProperty(edge.target)) {
          seen[edge.target] = true;
          queue.push(edge.target);
        }
      });
    }

    var unreachableNodeNames = [];
    for (var nodeId in nodes) {
      if (!(seen.hasOwnProperty(nodes[nodeId]))) {
        unreachableNodeNames.push(nodes[nodeId]);
      }
    }

    return unreachableNodeNames;
  };

  // Given an array of objects with two keys 'source' and 'target', returns
  // an array with the same objects but with the values of 'source' and 'target'
  // switched. (The objects represent edges in a graph, and this operation
  // amounts to reversing all the edges.)
  var _getReversedLinks = function(links) {
    return links.map(function(link) {
      return {
        source: link.target,
        target: link.source
      };
    });
  };

  var PARAM_ACTION_GET = 'get';
  var PARAM_ACTION_SET = 'set';

  var PARAM_SOURCE_ANSWER = 'answer';
  var PARAM_SOURCE_CONTENT = 'content';
  var PARAM_SOURCE_FEEDBACK = 'feedback';
  var PARAM_SOURCE_PARAM_CHANGES = 'param_changes';

  var _getMetadataFromParamChanges = function(paramChanges) {
    var result = [];

    for (var i = 0; i < paramChanges.length; i++) {
      var pc = paramChanges[i];

      if (pc.generator_id === 'Copier') {
        if (!pc.customization_args.parse_with_jinja) {
          result.push({
            action: PARAM_ACTION_SET,
            paramName: pc.name,
            source: PARAM_SOURCE_PARAM_CHANGES,
            sourceInd: i
          });
        } else {
          var paramsReferenced = expressionInterpolationService.getParamsFromString(
            pc.customization_args.value);
          for (var j = 0; j < paramsReferenced.length; j++) {
            result.push({
              action: PARAM_ACTION_GET,
              paramName: paramsReferenced[j],
              source: PARAM_SOURCE_PARAM_CHANGES,
              sourceInd: i
            });
          }

          result.push({
            action: PARAM_ACTION_SET,
            paramName: pc.name,
            source: PARAM_SOURCE_PARAM_CHANGES,
            sourceInd: i
          });
        }
      } else {
        // RandomSelector. Elements in the list of possibilities are treated
        // as raw unicode strings, not expressions.
        result.push({
          action: PARAM_ACTION_SET,
          paramName: pc.name,
          source: PARAM_SOURCE_PARAM_CHANGES,
          sourceInd: i
        });
      }
    }

    return result;
  };

  // Returns a list of set/get actions for parameters in the given state, in the
  // order that they occur.
  // TODO(sll): Add trace data (so that it's easy to figure out in which rule
  // an issue occurred, say).
  var _getStateParamMetadata = function(state) {
    // First, the state param changes are applied: we get their values
    // and set the params.
    var result = _getMetadataFromParamChanges(state.param_changes);

    // Next, the content is evaluated.
    expressionInterpolationService.getParamsFromString(
        state.content[0].value).forEach(function(paramName) {
      result.push({
        action: PARAM_ACTION_GET,
        paramName: paramName,
        source: PARAM_SOURCE_CONTENT
      });
    });

    // Next, the answer is received.
    result.push({
      action: PARAM_ACTION_SET,
      paramName: 'answer',
      source: PARAM_SOURCE_ANSWER
    });

    // Finally, the rule feedback strings are evaluated.
    state.interaction.handlers.forEach(function(handler) {
      handler.rule_specs.forEach(function(ruleSpec) {
        for (var k = 0; k < ruleSpec.feedback.length; k++) {
          expressionInterpolationService.getParamsFromString(
              ruleSpec.feedback[k]).forEach(function(paramName) {
            result.push({
              action: PARAM_ACTION_GET,
              paramName: paramName,
              source: PARAM_SOURCE_FEEDBACK,
              sourceInd: k
            });
          });
        }
      });
    });

    return result;
  };

  // Returns one of null, PARAM_ACTION_SET, PARAM_ACTION_GET depending on
  // whether this parameter is not used at all in this state, or
  // whether its first occurrence is a 'set' or 'get'.
  var _getParamStatus = function(stateParamMetadata, paramName) {
    for (var i = 0; i < stateParamMetadata.length; i++) {
      if (stateParamMetadata[i].paramName === paramName) {
        return stateParamMetadata[i].action;
      }
    }
    return null;
  };

  // Verify that all parameters referred to in a state are guaranteed to
  // have been set beforehand.
  var _verifyParameters = function(initNodeIds, nodes, edges) {
    var _states = explorationStatesService.getStates();

    // Determine all parameter names that are used within this exploration.
    var allParamNames = [];
    var explorationParamMetadata = _getMetadataFromParamChanges(
      explorationParamChangesService.savedMemento);
    var stateParamMetadatas = {
      'END': []
    };

    explorationParamMetadata.forEach(function(explorationParamMetadataItem) {
      if (allParamNames.indexOf(explorationParamMetadataItem.paramName) === -1) {
        allParamNames.push(explorationParamMetadataItem.paramName);
      }
    });

    for (var stateName in _states) {
      stateParamMetadatas[stateName] = _getStateParamMetadata(_states[stateName]);
      for (var i = 0; i < stateParamMetadatas[stateName].length; i++) {
        var pName = stateParamMetadatas[stateName][i].paramName;
        if (allParamNames.indexOf(pName) === -1) {
          allParamNames.push(pName);
        }
      }
    }

    // For each parameter, see if it's possible to get from the start node
    // to a node requiring this param, without passing through any nodes
    // that sets this param. Each of these requires a BFS.
    // TODO(sll): Ensure that there is enough trace information provided to make
    // any errors clear.
    var paramWarningsList = [];

    for (var paramInd = 0; paramInd < allParamNames.length; paramInd++) {
      var paramName = allParamNames[paramInd];
      var error = null;

      var paramStatusAtOutset = _getParamStatus(explorationParamMetadata, paramName);
      if (paramStatusAtOutset === PARAM_ACTION_GET) {
        paramWarningsList.push({
          type: WARNING_TYPES.CRITICAL,
          message: (
            'Please ensure the value of parameter "' + paramName + '" is set ' +
            'before it is referred to in the initial list of parameter changes.')
        });
        continue;
      } else if (paramStatusAtOutset === PARAM_ACTION_SET) {
        // This parameter will remain set for the entirety of the exploration.
        continue;
      }

      var queue = [];
      var seen = {};
      for (var i = 0; i < initNodeIds.length; i++) {
        seen[initNodeIds[i]] = true;
        var paramStatus = _getParamStatus(
          stateParamMetadatas[initNodeIds[i]], paramName);
        if (paramStatus === PARAM_ACTION_GET) {
          error = {
            type: WARNING_TYPES.CRITICAL,
            message: (
              'Please ensure the value of parameter "' + paramName +
              '" is set before using it in "' + initNodeIds[i] + '".')
          };
          break;
        } else if (!paramStatus) {
          queue.push(initNodeIds[i]);
        }
      }

      if (error) {
        paramWarningsList.push(error);
        continue;
      }

      while (queue.length > 0) {
        var currNodeId = queue.shift();
        for (var i = 0; i < edges.length; i++) {
          var edge = edges[i];
          if (edge.source === currNodeId && !seen.hasOwnProperty(edge.target)) {
            seen[edge.target] = true;
            paramStatus = _getParamStatus(stateParamMetadatas[edge.target], paramName);
            if (paramStatus === PARAM_ACTION_GET) {
              error = {
                type: WARNING_TYPES.CRITICAL,
                message: (
                  'Please ensure the value of parameter "' + paramName +
                  '" is set before using it in "' + edge.target + '".')
              };
              break;
            } else if (!paramStatus) {
              queue.push(edge.target);
            }
          }
        };
      }

      if (error) {
        paramWarningsList.push(error);
      }
    }

    return paramWarningsList;
  };

  var _updateWarningsList = function() {
    _warningsList = [];

    graphDataService.recompute();
    var _graphData = graphDataService.getGraphData();

    var statesWithoutInteractionIds = _getStatesWithoutInteractionIds();
    if (statesWithoutInteractionIds.length) {
      _warningsList.push({
        type: WARNING_TYPES.CRITICAL,
        message: (
          'Please add interactions for these states: ' +
          statesWithoutInteractionIds.join(', ') + '.')
      });
    }

    if (_graphData) {
      var unreachableStateNames = _getUnreachableNodeNames(
        [_graphData.initStateId], _graphData.nodes, _graphData.links);

      // We do not care if the END state is unreachable.
      var endIndex = unreachableStateNames.indexOf('END');
      if (endIndex !== -1) {
        unreachableStateNames.splice(endIndex, 1);
      }

      if (unreachableStateNames.length) {
        _warningsList.push({
          type: WARNING_TYPES.ERROR,
          message: (
            'The following state(s) are unreachable: ' +
            unreachableStateNames.join(', ') + '.')
        });
      } else {
        // Only perform this check if all states are reachable.
        var deadEndStates = _getUnreachableNodeNames(
          _graphData.finalStateIds, _graphData.nodes,
          _getReversedLinks(_graphData.links));
        if (deadEndStates.length) {
          _warningsList.push({
            type: WARNING_TYPES.ERROR,
            message: (
              'Please make sure there\'s a path to END from each of: ' +
              deadEndStates.join(', ') + '.')
          });
        }
      }

      _warningsList = _warningsList.concat(_verifyParameters(
        [_graphData.initStateId], _graphData.nodes, _graphData.links));
    }

    var _states = explorationStatesService.getStates();
    for (var stateName in _states) {
      if (_states[stateName].interaction.id) {
        var validatorName = 'oppiaInteractive' + _states[stateName].interaction.id + 'Validator';
        var interactionWarnings = $filter(validatorName)(
          stateName,
          _states[stateName].interaction.customization_args,
          _states[stateName].interaction.handlers[0].rule_specs);

        for (var i = 0; i < interactionWarnings.length; i++) {
          _warningsList.push({
            type: interactionWarnings[i].type,
            message: 'In \'' + stateName + '\', ' + interactionWarnings[i].message
          });
        }
      }
    }

    if (!explorationObjectiveService.displayed) {
      _warningsList.push({
        type: WARNING_TYPES.ERROR,
        message: 'Please specify an objective (in the Settings tab).'
      });
    }
  };

  return {
    countWarnings: function() {
      return _warningsList.length;
    },
    getWarnings: function() {
      return _warningsList;
    },
    updateWarnings: function() {
      _updateWarningsList();
    },
    hasCriticalWarnings: function() {
      return _warningsList.some(function(warning) {
        return warning.type === WARNING_TYPES.CRITICAL;
      });
    }
  };
}]);
