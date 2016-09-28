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
 */

// Service for handling all interactions with the exploration editor backend.
oppia.factory('explorationData', [
  '$http', '$log', 'alertsService', '$q',
  function($http, $log, alertsService, $q) {
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
      $log.error(
        'Unexpected call to explorationData for pathname ', pathnameArray[i]);
      // Note: if we do not return anything, Karma unit tests fail.
      return {};
    }

    var explorationDataUrl = '/createhandler/data/' + explorationId;
    var resolvedAnswersUrlPrefix = (
      '/createhandler/resolved_answers/' + explorationId);
    var explorationDraftAutosaveUrl = (
      '/createhandler/autosave_draft/' + explorationId);

    // Put exploration variables here.
    var explorationData = {
      explorationId: explorationId,
      autosaveChangeList: function(changeList, successCallback, errorCallback) {
        $http.put(explorationDraftAutosaveUrl, {
          change_list: changeList,
          version: explorationData.data.version
        }).then(function(response) {
          if (successCallback) {
            successCallback(response);
          }
        }, function() {
          if (errorCallback) {
            errorCallback();
          }
        });
      },
      discardDraft: function(successCallback, errorCallback) {
        $http.post(explorationDraftAutosaveUrl, {}).then(function() {
          if (successCallback) {
            successCallback();
          }
        }, function() {
          if (errorCallback) {
            errorCallback();
          }
        });
      },
      // Returns a promise that supplies the data for the current exploration.
      getData: function() {
        if (explorationData.data) {
          $log.info('Found exploration data in cache.');

          var deferred = $q.defer();
          deferred.resolve(explorationData.data);
          return deferred.promise;
        } else {
          // Retrieve data from the server.
          // WARNING: Note that this is a version of the exploration with draft
          // changes applied. This makes a force-refresh necessary when changes
          // are discarded, otherwise the exploration-with-draft-changes
          // (which is cached here) will be reused.
          return $http.get(explorationDataUrl, {
            params: {
              apply_draft: true
            }
          }).then(function(response) {
            $log.info('Retrieved exploration data.');
            $log.info(response.data);

            explorationData.data = response.data;

            return response.data;
          });
        }
      },
      // Returns a promise supplying the last saved version for the current
      // exploration.
      getLastSavedData: function() {
        return $http.get(explorationDataUrl).then(function(response) {
          $log.info('Retrieved saved exploration data.');
          $log.info(response.data);

          return response.data;
        });
      },
      resolveAnswers: function(stateName, resolvedAnswersList) {
        alertsService.clearWarnings();
        $http.put(
            resolvedAnswersUrlPrefix + '/' + encodeURIComponent(stateName), {
          resolved_answers: resolvedAnswersList
        });
      },
      /**
       * Saves the exploration to the backend, and, on a success callback,
       * updates the local copy of the exploration data.
       * @param {object} changeList - Represents the change list for
       *   this save. Each element of the list is a command representing an
       *   editing action (such as add state, delete state, etc.). See the
       *  _'Change' class in exp_services.py for full documentation.
       * @param {string} commitMessage - The user-entered commit message for
       *   this save operation.
       */
      save: function(
          changeList, commitMessage, successCallback, errorCallback) {
        $http.put(explorationDataUrl, {
          change_list: changeList,
          commit_message: commitMessage,
          version: explorationData.data.version
        }).then(function(response) {
          alertsService.clearWarnings();
          explorationData.data = response.data;
          if (successCallback) {
            successCallback(
              response.data.is_version_of_draft_valid,
              response.data.draft_changes);
          }
        }, function() {
          if (errorCallback) {
            errorCallback();
          }
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
  var inTutorialMode = false;

  return {
    isEditable: function() {
      return isEditable && !inTutorialMode;
    },
    isEditableOutsideTutorialMode: function() {
      return isEditable;
    },
    markEditable: function() {
      isEditable = true;
    },
    markNotEditable: function() {
      isEditable = false;
    },
    onEndTutorial: function() {
      inTutorialMode = false;
    },
    onStartTutorial: function() {
      inTutorialMode = true;
    }
  };
}]);

// A service that maintains a provisional list of changes to be committed to
// the server.
oppia.factory('changeListService', [
  '$rootScope', '$log', 'alertsService', 'explorationData',
  'autosaveInfoModalsService',
  function(
      $rootScope, $log, alertsService, explorationData,
      autosaveInfoModalsService) {
    // TODO(sll): Implement undo, redo functionality. Show a message on each
    // step saying what the step is doing.
    // TODO(sll): Allow the user to view the list of changes made so far, as
    // well as the list of changes in the undo stack.

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
    // All gadget commands
    var CMD_ADD_GADGET = 'add_gadget';
    var CMD_RENAME_GADGET = 'rename_gadget';
    var CMD_DELETE_GADGET = 'delete_gadget';
    var CMD_EDIT_GADGET_PROPERTY = 'edit_gadget_property';

    var ALLOWED_EXPLORATION_BACKEND_NAMES = {
      category: true,
      init_state_name: true,
      language_code: true,
      objective: true,
      param_changes: true,
      param_specs: true,
      tags: true,
      title: true
    };

    var ALLOWED_STATE_BACKEND_NAMES = {
      answer_groups: true,
      confirmed_unclassified_answers: true,
      content: true,
      default_outcome: true,
      fallbacks: true,
      param_changes: true,
      state_name: true,
      widget_customization_args: true,
      widget_id: true
    };

    var ALLOWED_GADGET_BACKEND_NAMES = {
      gadget_customization_args: true,
      gadget_visibility: true
    };

    var autosaveChangeListOnChange = function(explorationChangeList) {
      // Asynchronously send an autosave request, and check for errors in the
      // response:
      // If error is present -> Check for the type of error occurred
      // (Display the corresponding modals in both cases, if not already
      // opened):
      // - Version Mismatch.
      // - Non-strict Validation Fail.
      explorationData.autosaveChangeList(
        explorationChangeList,
        function(response) {
          if (!response.data.is_version_of_draft_valid) {
            if (!autosaveInfoModalsService.isModalOpen()) {
              autosaveInfoModalsService.showVersionMismatchModal(
                explorationChangeList);
            }
          }
        },
        function() {
          alertsService.clearWarnings();
          $log.error(
            'nonStrictValidationFailure: ' +
            JSON.stringify(explorationChangeList));
          if (!autosaveInfoModalsService.isModalOpen()) {
            autosaveInfoModalsService.showNonStrictValidationFailModal();
          }
        }
      );
    };

    var addChange = function(changeDict) {
      if ($rootScope.loadingMessage) {
        return;
      }
      explorationChangeList.push(changeDict);
      undoneChangeStack = [];
      autosaveChangeListOnChange(explorationChangeList);
    };

    return {
      /**
       * Saves a gadget dict that represents a new gadget.
       *
       * It is the responsbility of the caller to check that the gadget dict
       * is correctly formed
       *
       * @param {object} gadgetData - The dict containing new gadget info.
       */
      addGadget: function(gadgetData) {
        addChange({
          cmd: CMD_ADD_GADGET,
          gadget_dict: gadgetData,
          panel: gadgetData.panel
        });
      },
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
       * Deletes the gadget with the specified name.
       *
       * @param {string} gadgetName - Unique name of the gadget to delete.
       */
      deleteGadget: function(gadgetName) {
        addChange({
          cmd: CMD_DELETE_GADGET,
          gadget_name: gadgetName
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
        explorationData.discardDraft();
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
          alertsService.addWarning(
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
       * Saves a change dict that represents a change to a gadget property.
       *
       * It is the responsibility of the caller to check that the old and new
       * values are not equal.
       *
       * @param {string} gadgetName - The name of the gadget being edited
       * @param {string} backendName - The backend name of the edited property
       * @param {string} newValue - The new value of the property
       * @param {string} oldValue - The previous value of the property
       */
      editGadgetProperty: function(
          gadgetName, backendName, newValue, oldValue) {
        if (!ALLOWED_GADGET_BACKEND_NAMES.hasOwnProperty(backendName)) {
          alertsService.addWarning('Invalid gadget property: ' + backendName);
          return;
        }
        addChange({
          cmd: CMD_EDIT_GADGET_PROPERTY,
          gadget_name: gadgetName,
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
          alertsService.addWarning('Invalid state property: ' + backendName);
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
       * Saves a change dict that represents the renaming of a gadget.
       *
       * It is the responsibility of the caller to check that the two names
       * are not equal.
       *
       * @param {string} oldGadgetName - The previous name of the gadget
       * @param {string} newGadgetName - The new name of the gadget
       */
      renameGadget: function(oldGadgetName, newGadgetName) {
        addChange({
          cmd: CMD_RENAME_GADGET,
          new_gadget_name: newGadgetName,
          old_gadget_name: oldGadgetName
        });
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
          alertsService.addWarning('There are no changes to undo.');
          return;
        }
        var lastChange = explorationChangeList.pop();
        undoneChangeStack.push(lastChange);
        autosaveChangeListOnChange(explorationChangeList);
      }
    };
  }
]);

// A data service that stores data about the rights for this exploration.
oppia.factory('explorationRightsService', [
    '$http', 'explorationData', 'alertsService',
    function($http, explorationData, alertsService) {
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
      return this._status === GLOBALS.ACTIVITY_STATUS_PRIVATE;
    },
    isPublic: function() {
      return this._status === GLOBALS.ACTIVITY_STATUS_PUBLIC;
    },
    isPublicized: function() {
      return this._status === GLOBALS.ACTIVITY_STATUS_PUBLICIZED;
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
    saveChangeToBackend: function(requestParams) {
      var that = this;

      requestParams.version = explorationData.data.version;
      var explorationRightsUrl = (
        '/createhandler/rights/' + explorationData.explorationId);
      $http.put(explorationRightsUrl, requestParams).then(function(response) {
        var data = response.data;
        alertsService.clearWarnings();
        that.init(
          data.rights.owner_names, data.rights.editor_names,
          data.rights.viewer_names, data.rights.status,
          data.rights.cloned_from, data.rights.community_owned,
          data.rights.viewable_if_private);
      });
    },
    saveModeratorChangeToBackend: function(action, emailBody) {
      var that = this;

      var explorationModeratorRightsUrl = (
        '/createhandler/moderatorrights/' + explorationData.explorationId);
      $http.put(explorationModeratorRightsUrl, {
        action: action,
        email_body: emailBody,
        version: explorationData.data.version
      }).then(function(response) {
        var data = response.data;
        alertsService.clearWarnings();
        that.init(
          data.rights.owner_names, data.rights.editor_names,
          data.rights.viewer_names, data.rights.status,
          data.rights.cloned_from, data.rights.community_owned,
          data.rights.viewable_if_private);
      });
    }
  };
}]);

oppia.factory('explorationPropertyService', [
    '$rootScope', '$log', 'changeListService', 'alertsService',
    function($rootScope, $log, changeListService, alertsService) {
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
      // The previous (saved-in-the-frontend) value of the property. Here,
      // 'saved' means that this is the latest value of the property as
      // determined by the frontend change list.
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
    _isValid: function(value) { // jscs:ignore disallowUnusedParams
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

      alertsService.clearWarnings();
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
  'explorationRightsService',
  function(
    explorationPropertyService, $filter, validatorsService,
    explorationRightsService) {
    var child = Object.create(explorationPropertyService);
    child.propertyName = 'title';
    child._normalize = $filter('normalizeWhitespace');
    child._isValid = function(value) {
      return validatorsService.isValidEntityName(
        value, true, explorationRightsService.isPrivate());
    };
    return child;
  }
]);

// A data service that stores the current exploration category so that it can be
// displayed and edited in multiple places in the UI.
oppia.factory('explorationCategoryService', [
  'explorationPropertyService', '$filter', 'validatorsService',
  'explorationRightsService',
  function(
    explorationPropertyService, $filter, validatorsService,
    explorationRightsService) {
    var child = Object.create(explorationPropertyService);
    child.propertyName = 'category';
    child._normalize = $filter('normalizeWhitespace');
    child._isValid = function(value) {
      return validatorsService.isValidEntityName(
        value, true, explorationRightsService.isPrivate());
    };
    return child;
  }
]);

// A data service that stores the current exploration objective so that it can
// be displayed and edited in multiple places in the UI.
oppia.factory('explorationObjectiveService', [
  'explorationPropertyService', '$filter', 'validatorsService',
  'explorationRightsService',
  function(
    explorationPropertyService, $filter, validatorsService,
    explorationRightsService) {
    var child = Object.create(explorationPropertyService);
    child.propertyName = 'objective';
    child._normalize = $filter('normalizeWhitespace');
    child._isValid = function(value) {
      return (
        explorationRightsService.isPrivate() ||
        validatorsService.isNonempty(value, false));
    };
    return child;
  }
]);

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
  return child;
}]);

// A data service that stores tags for the exploration.
oppia.factory('explorationTagsService', [
    'explorationPropertyService',
    function(explorationPropertyService) {
  var child = Object.create(explorationPropertyService);
  child.propertyName = 'tags';
  child._normalize = function(value) {
    for (var i = 0; i < value.length; i++) {
      value[i] = value[i].trim().replace(/\s+/g, ' ');
    }
    // TODO(sll): Prevent duplicate tags from being added.
    return value;
  };
  child._isValid = function(value) {
    // Every tag should match the TAG_REGEX.
    for (var i = 0; i < value.length; i++) {
      var tagRegex = new RegExp(GLOBALS.TAG_REGEX);
      if (!value[i].match(tagRegex)) {
        return false;
      }
    }

    return true;
  };
  return child;
}]);

oppia.factory('explorationParamSpecsService', [
    'explorationPropertyService', function(explorationPropertyService) {
  var child = Object.create(explorationPropertyService);
  child.propertyName = 'param_specs';
  return child;
}]);

oppia.factory('explorationParamChangesService', [
    'explorationPropertyService', function(explorationPropertyService) {
  var child = Object.create(explorationPropertyService);
  child.propertyName = 'param_changes';
  return child;
}]);

// Data service for keeping track of the exploration's states. Note that this
// is unlike the other exploration property services, in that it keeps no
// mementos.
oppia.factory('explorationStatesService', [
  '$log', '$modal', '$filter', '$location', '$rootScope',
  'explorationInitStateNameService', 'alertsService', 'changeListService',
  'editorContextService', 'validatorsService', 'newStateTemplateService',
  'explorationGadgetsService',
  function(
      $log, $modal, $filter, $location, $rootScope,
      explorationInitStateNameService, alertsService, changeListService,
      editorContextService, validatorsService, newStateTemplateService,
      explorationGadgetsService) {
    var _states = null;

    // Maps backend names to the corresponding frontend dict accessor lists.
    var PROPERTY_REF_DATA = {
      answer_groups: ['interaction', 'answer_groups'],
      confirmed_unclassified_answers: [
        'interaction', 'confirmed_unclassified_answers'],
      content: ['content'],
      default_outcome: ['interaction', 'default_outcome'],
      param_changes: ['param_changes'],
      fallbacks: ['interaction', 'fallbacks'],
      widget_id: ['interaction', 'id'],
      widget_customization_args: ['interaction', 'customization_args']
    };

    var _setState = function(stateName, stateData, refreshGraph) {
      _states[stateName] = angular.copy(stateData);
      if (refreshGraph) {
        $rootScope.$broadcast('refreshGraph');
      }
    };

    var getStatePropertyMemento = function(stateName, backendName) {
      var accessorList = PROPERTY_REF_DATA[backendName];

      var propertyRef = _states[stateName];
      accessorList.forEach(function(key) {
        propertyRef = propertyRef[key];
      });

      return angular.copy(propertyRef);
    };

    var saveStateProperty = function(stateName, backendName, newValue) {
      var oldValue = getStatePropertyMemento(stateName, backendName);

      if (!angular.equals(oldValue, newValue)) {
        changeListService.editStateProperty(
          stateName, backendName, newValue, oldValue);

        var newStateData = angular.copy(_states[stateName]);
        var accessorList = PROPERTY_REF_DATA[backendName];

        var propertyRef = newStateData;
        for (var i = 0; i < accessorList.length - 1; i++) {
          propertyRef = propertyRef[accessorList[i]];
        }
        propertyRef[accessorList[accessorList.length - 1]] = angular.copy(
          newValue);

        // We do not refresh the state editor immediately after the interaction
        // id alone is saved, because the customization args dict will be
        // temporarily invalid. A change in interaction id will always entail
        // a change in the customization args dict anyway, so the graph will
        // get refreshed after both properties have been updated.
        var refreshGraph = (backendName !== 'widget_id');
        _setState(stateName, newStateData, refreshGraph);
      }
    };

    // TODO(sll): Add unit tests for all get/save methods.
    return {
      init: function(value) {
        _states = angular.copy(value);
      },
      getStates: function() {
        return angular.copy(_states);
      },
      hasState: function(stateName) {
        return _states.hasOwnProperty(stateName);
      },
      getState: function(stateName) {
        return angular.copy(_states[stateName]);
      },
      setState: function(stateName, stateData) {
        _setState(stateName, stateData, true);
      },
      isNewStateNameValid: function(newStateName, showWarnings) {
        if (_states.hasOwnProperty(newStateName)) {
          if (showWarnings) {
            alertsService.addWarning('A state with this name already exists.');
          }
          return false;
        }
        return (
          validatorsService.isValidStateName(newStateName, showWarnings));
      },
      getStateContentMemento: function(stateName) {
        return getStatePropertyMemento(stateName, 'content');
      },
      saveStateContent: function(stateName, newContent) {
        saveStateProperty(stateName, 'content', newContent);
      },
      getStateParamChangesMemento: function(stateName) {
        return getStatePropertyMemento(stateName, 'param_changes');
      },
      saveStateParamChanges: function(stateName, newParamChanges) {
        saveStateProperty(stateName, 'param_changes', newParamChanges);
      },
      getInteractionIdMemento: function(stateName) {
        return getStatePropertyMemento(stateName, 'widget_id');
      },
      saveInteractionId: function(stateName, newInteractionId) {
        saveStateProperty(stateName, 'widget_id', newInteractionId);
      },
      getInteractionCustomizationArgsMemento: function(stateName) {
        return getStatePropertyMemento(stateName, 'widget_customization_args');
      },
      saveInteractionCustomizationArgs: function(
          stateName, newCustomizationArgs) {
        saveStateProperty(
          stateName, 'widget_customization_args', newCustomizationArgs);
      },
      getInteractionAnswerGroupsMemento: function(stateName) {
        return getStatePropertyMemento(stateName, 'answer_groups');
      },
      saveInteractionAnswerGroups: function(stateName, newAnswerGroups) {
        saveStateProperty(stateName, 'answer_groups', newAnswerGroups);
      },
      getConfirmedUnclassifiedAnswersMemento: function(stateName) {
        return getStatePropertyMemento(
          stateName, 'confirmed_unclassified_answers');
      },
      saveConfirmedUnclassifiedAnswers: function(stateName, newAnswers) {
        saveStateProperty(
          stateName, 'confirmed_unclassified_answers', newAnswers);
      },
      getInteractionDefaultOutcomeMemento: function(stateName) {
        return getStatePropertyMemento(stateName, 'default_outcome');
      },
      saveInteractionDefaultOutcome: function(stateName, newDefaultOutcome) {
        saveStateProperty(stateName, 'default_outcome', newDefaultOutcome);
      },
      getFallbacksMemento: function(stateName) {
        return getStatePropertyMemento(stateName, 'fallbacks');
      },
      saveFallbacks: function(stateName, newFallbacks) {
        saveStateProperty(stateName, 'fallbacks', newFallbacks);
      },
      addState: function(newStateName, successCallback) {
        newStateName = $filter('normalizeWhitespace')(newStateName);
        if (!validatorsService.isValidStateName(newStateName, true)) {
          return;
        }
        if (_states.hasOwnProperty(newStateName)) {
          alertsService.addWarning('A state with this name already exists.');
          return;
        }
        alertsService.clearWarnings();

        _states[newStateName] = newStateTemplateService.getNewStateTemplate(
          newStateName);
        changeListService.addState(newStateName);
        $rootScope.$broadcast('refreshGraph');
        if (successCallback) {
          successCallback(newStateName);
        }
      },
      deleteState: function(deleteStateName) {
        alertsService.clearWarnings();

        var initStateName = explorationInitStateNameService.displayed;
        if (deleteStateName === initStateName) {
          return;
        }
        if (!_states[deleteStateName]) {
          alertsService.addWarning(
            'No state with name ' + deleteStateName + ' exists.');
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
            '$scope', '$modalInstance', 'explorationGadgetsService',
            'deleteStateName',
            function(
                $scope, $modalInstance, explorationGadgetsService,
                deleteStateName) {
              $scope.deleteStateWarningText = (
                'Are you sure you want to delete the card "' +
                deleteStateName + '"?');

              // Get all the gadgets that are only visible in this state.
              var gadgetNamesUniqueToThisState = (
                explorationGadgetsService.getGadgetNamesUniqueToState(
                  deleteStateName));
              if (gadgetNamesUniqueToThisState.length) {
                // Update message to show that the gadgets unique to this state
                // will be deleted too.
                $scope.deleteStateWarningText = $scope.deleteStateWarningText +
                  ' This will also delete the following gadget' +
                  (gadgetNamesUniqueToThisState.length > 1 ? 's: ' : ': ') +
                  gadgetNamesUniqueToThisState.join(', ') + '.';
              }

              $scope.reallyDelete = function() {
                $modalInstance.close(deleteStateName);
                // Delete the gadgets without additional dialog when confirmed.
                for (var i = 0; i < gadgetNamesUniqueToThisState.length; i++) {
                  // Note that explorationGadgetsService will update the data
                  // and add additional 'delete gadget' cmds to
                  // changeListService.
                  explorationGadgetsService.deleteGadget(
                    gadgetNamesUniqueToThisState[i], false);
                }
              };

              $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
                alertsService.clearWarnings();
              };
            }
          ]
        }).result.then(function(deleteStateName) {
          delete _states[deleteStateName];
          for (var otherStateName in _states) {
            var interaction = _states[otherStateName].interaction;
            var groups = interaction.answer_groups;
            for (var i = 0; i < groups.length; i++) {
              if (groups[i].outcome.dest === deleteStateName) {
                groups[i].outcome.dest = otherStateName;
              }
            }
            if (interaction.default_outcome) {
              if (interaction.default_outcome.dest === deleteStateName) {
                interaction.default_outcome.dest = otherStateName;
              }
            }

            var fallbacks = interaction.fallbacks;
            for (var i = 0; i < fallbacks.length; i++) {
              if (fallbacks[i].outcome.dest === deleteStateName) {
                fallbacks[i].outcome.dest = otherStateName;
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
          // This state name is removed from gadget's visibilty settings.
          explorationGadgetsService.handleStateDeletion(deleteStateName);
        });
      },
      renameState: function(oldStateName, newStateName) {
        newStateName = $filter('normalizeWhitespace')(newStateName);
        if (!validatorsService.isValidStateName(newStateName, true)) {
          return;
        }
        if (!!_states[newStateName]) {
          alertsService.addWarning('A state with this name already exists.');
          return;
        }
        alertsService.clearWarnings();

        _states[newStateName] = angular.copy(_states[oldStateName]);
        delete _states[oldStateName];

        for (var otherStateName in _states) {
          var interaction = _states[otherStateName].interaction;
          var groups = interaction.answer_groups;
          for (var i = 0; i < groups.length; i++) {
            if (groups[i].outcome.dest === oldStateName) {
              groups[i].outcome.dest = newStateName;
            }
          }
          if (interaction.default_outcome) {
            if (interaction.default_outcome.dest === oldStateName) {
              interaction.default_outcome.dest = newStateName;
            }
          }

          var fallbacks = interaction.fallbacks;
          for (var i = 0; i < fallbacks.length; i++) {
            if (fallbacks[i].outcome.dest === oldStateName) {
              fallbacks[i].outcome.dest = newStateName;
            }
          }
        }

        editorContextService.setActiveStateName(newStateName);
        // The 'rename state' command must come before the 'change
        // init_state_name' command in the change list, otherwise the backend
        // will raise an error because the new initial state name does not
        // exist.
        changeListService.renameState(newStateName, oldStateName);
        // Amend initStateName appropriately, if necessary. Note that this
        // must come after the state renaming, otherwise saving will lead to
        // a complaint that the new name is not a valid state name.
        if (explorationInitStateNameService.displayed === oldStateName) {
          explorationInitStateNameService.displayed = newStateName;
          explorationInitStateNameService.saveDisplayedValue(newStateName);
        }
        $rootScope.$broadcast('refreshGraph');
        // The state name is updated in gadget's visibilty settings to the new
        // name.
        explorationGadgetsService.handleStateRenaming(
          oldStateName, newStateName);
      }
    };
  }
]);

oppia.factory('statePropertyService', [
  '$log', 'changeListService', 'alertsService', 'explorationStatesService',
  function($log, changeListService, alertsService, explorationStatesService) {
    // Public base API for data services corresponding to state properties
    // (interaction id, content, etc.)
    // WARNING: This should be initialized only in the context of the state
    // editor, and every time the state is loaded, so that proper behavior is
    // maintained if e.g. the state is renamed.
    // TODO(sll): Remove this service and its descendants, in favour of using
    // explorationStatesService directly.
    return {
      init: function(stateName, value) {
        if (this.setterMethodKey === null) {
          throw 'State property setter method key cannot be null.';
        }

        // The name of the state.
        this.stateName = stateName;
        // The current value of the property (which may not have been saved to
        // the frontend yet). In general, this will be bound directly to the UI.
        this.displayed = angular.copy(value);
        // The previous (saved-in-the-frontend) value of the property. Here,
        // 'saved' means that this is the latest value of the property as
        // determined by the frontend change list.
        this.savedMemento = angular.copy(value);
      },
      // Returns whether the current value has changed from the memento.
      hasChanged: function() {
        return !angular.equals(this.savedMemento, this.displayed);
      },
      // The name of the setter method in explorationStatesService for this
      // property. THIS MUST BE SPECIFIED BY SUBCLASSES.
      setterMethodKey: null,
      // Transforms the given value into a normalized form. THIS CAN BE
      // OVERRIDDEN BY SUBCLASSES. The default behavior is to do nothing.
      _normalize: function(value) {
        return value;
      },
      // Validates the given value and returns a boolean stating whether it
      // is valid or not. THIS CAN BE OVERRIDDEN BY SUBCLASSES. The default
      // behavior is to always return true.
      _isValid: function(value) { // jscs:ignore disallowUnusedParams
        return true;
      },
      // Creates a new entry in the change list, and updates the memento to the
      // displayed value.
      saveDisplayedValue: function() {
        if (this.setterMethodKey === null) {
          throw 'State property setter method key cannot be null.';
        }

        this.displayed = this._normalize(this.displayed);
        if (!this._isValid(this.displayed) || !this.hasChanged()) {
          this.restoreFromMemento();
          return;
        }

        if (angular.equals(this.displayed, this.savedMemento)) {
          return;
        }

        alertsService.clearWarnings();

        var setterFunc = explorationStatesService[this.setterMethodKey];
        setterFunc(this.stateName, angular.copy(this.displayed));

        this.savedMemento = angular.copy(this.displayed);
      },
      // Reverts the displayed value to the saved memento.
      restoreFromMemento: function() {
        this.displayed = angular.copy(this.savedMemento);
      }
    };
  }
]);

// A data service that stores the current list of state parameter changes.
// TODO(sll): Add validation.
oppia.factory('stateParamChangesService', [
    'statePropertyService', function(statePropertyService) {
  var child = Object.create(statePropertyService);
  child.setterMethodKey = 'saveStateParamChanges';
  return child;
}]);

// A data service that stores the current interaction id.
// TODO(sll): Add validation.
oppia.factory('stateInteractionIdService', [
    'statePropertyService', function(statePropertyService) {
  var child = Object.create(statePropertyService);
  child.setterMethodKey = 'saveInteractionId';
  return child;
}]);

// A data service that stores the current state customization args for the
// interaction. This is a dict mapping customization arg names to dicts of the
// form {value: customization_arg_value}.
// TODO(sll): Add validation.
oppia.factory('stateCustomizationArgsService', [
    'statePropertyService', function(statePropertyService) {
  var child = Object.create(statePropertyService);
  child.setterMethodKey = 'saveInteractionCustomizationArgs';
  return child;
}]);

// A data service that stores the current interaction fallbacks.
oppia.factory('stateFallbacksService', [
    'statePropertyService', function(statePropertyService) {
  var child = Object.create(statePropertyService);
  child.setterMethodKey = 'saveFallbacks';
  return child;
}]);

// Data service for keeping track of gadget data and location across panels.
oppia.factory('explorationGadgetsService', [
  '$log', '$modal', '$filter', '$location', '$rootScope',
  'changeListService', 'editorContextService', 'alertsService',
  'gadgetValidationService', 'GADGET_SPECS',
  function($log, $modal, $filter, $location, $rootScope,
           changeListService, editorContextService, alertsService,
           gadgetValidationService, GADGET_SPECS) {
    // _gadgets is a JS object with gadget_instance.name strings as keys
    // and each gadget_instance's data as values.
    var _gadgets = null;
    // _panels is a JS object with skin panel names as keys and lists of
    // gadget_instance.name strings as values. Lists are sorted in order
    // that gadgets are displayed in panels that contain multiple gadgets.
    var _panels = null;

    var _getPanelNameFromGadgetName = function(gadgetName) {
      for (var panel in _panels) {
        if (_panels[panel].indexOf(gadgetName) !== -1) {
          return panel;
        }
      }
      $log.info(gadgetName + ' gadget does not exist in any panel.');
    };

    var _generateUniqueGadgetName = function(gadgetType) {
      var baseGadgetName = GADGET_SPECS[gadgetType].short_description;
      if (!_gadgets.hasOwnProperty(baseGadgetName)) {
        return baseGadgetName;
      } else {
        var uniqueInteger = 2;
        var generatedGadgetName = baseGadgetName + uniqueInteger;
        while (_gadgets.hasOwnProperty(generatedGadgetName)) {
          uniqueInteger++;
          generatedGadgetName = baseGadgetName + uniqueInteger;
        }
        return generatedGadgetName;
      }
    };

    var _getAllGadgetsInstancesForPanel = function(panel) {
      var panelGadgets = [];
      var gadgetsInCurrentPanel = _panels[panel];
      for (var i = 0; i < gadgetsInCurrentPanel.length; i++) {
        panelGadgets.push(_gadgets[gadgetsInCurrentPanel[i]]);
      }
      return panelGadgets;
    };

    /**
     * Returns a JS object whose keys are state names, and whose corresponding
     * values are lists of gadget instances representing the gadgets visible in
     * that state for the given panel.
     */
    var _getGadgetsVisibilityMap = function(panel) {
      var gadgetInstanceList = _getAllGadgetsInstancesForPanel(panel);
      var visibilityMap = {};
      for (var i = 0; i < gadgetInstanceList.length; i++) {
        var gadgetInstance = angular.copy(gadgetInstanceList[i]);
        for (var j = 0; j < gadgetInstance.visible_in_states.length; j++) {
          var stateName = gadgetInstance.visible_in_states[j];
          if (visibilityMap[stateName]) {
            visibilityMap[stateName].push(gadgetInstance);
          } else {
            visibilityMap[stateName] = [gadgetInstance];
          }
        }
      }
      return visibilityMap;
    };

    var _isNewGadgetNameValid = function(newGadgetName) {
      if (_gadgets.hasOwnProperty(newGadgetName)) {
        alertsService.addWarning('A gadget with this name already exists.');
        return false;
      }
      return (
        gadgetValidationService.isValidGadgetName(newGadgetName));
    };

    /**
     * Convert the backend representation of the skin's panel contents to a
     * panel and a gadget dict. The panel dict has keys that are panel names
     * and the values are list of gadget names present in that panel. The
     * gadget dict has keys that are gadget names and the values are dicts
     * representing the data for the gadget.
     */
    var _initGadgetsAndPanelsData = function(panelsContents) {
      _panels = {};
      _gadgets = {};
      for (var panel in panelsContents) {
        _panels[panel] = [];
        // Append the name of each gadget instance in the panel.
        for (var i = 0; i < panelsContents[panel].length; i++) {
          _panels[panel].push(
            panelsContents[panel][i].gadget_name
          );
          var gadgetName = panelsContents[panel][i].gadget_name;
          _gadgets[gadgetName] = angular.copy(panelsContents[panel][i]);
        }
      }
    };

    return {
      init: function(skinCustomizationsData) {
        // Data structure initialization.
        if (!skinCustomizationsData.hasOwnProperty('panels_contents')) {
          alertsService.addWarning(
            'Gadget Initialization failed. Panel contents were not provided');
          return;
        }
        _initGadgetsAndPanelsData(skinCustomizationsData.panels_contents);
        var isValid = false;
        for (var panel in _panels) {
          var visibilityMap = _getGadgetsVisibilityMap(panel);
          isValid = gadgetValidationService.validatePanel(
            panel, visibilityMap);
          // The validatePanel(...) method should have added the warning to
          // alertsService.
          if (!isValid) {
            return;
          }
        }
        $rootScope.$broadcast('gadgetsChangedOrInitialized');
      },
      /**
       * Confirms if a panel can accept a new gadget considering its capacity
       * and the gadget's size requirements given its customization arguments.
       */
      canAddGadgetToItsPanel: function(gadgetData) {
        var visibilityMap = _getGadgetsVisibilityMap(gadgetData.panel);
        return (
          _isNewGadgetNameValid(gadgetData.gadget_name) &&
          gadgetValidationService.canAddGadget(gadgetData, visibilityMap));
      },
      getNewUniqueGadgetName: function(gadgetType) {
        return _generateUniqueGadgetName(gadgetType);
      },
      getGadgets: function() {
        return angular.copy(_gadgets);
      },
      // Returns a JS object mapping panel names to lists of gadget names.
      getPanels: function() {
        return angular.copy(_panels);
      },
      getPanelsContents: function() {
        var panelsContents = {};
        for (var panel in _panels) {
          panelsContents[panel] = _panels[panel].map(function(gadgetName) {
            return angular.copy(_gadgets[gadgetName]);
          });
        }
        return panelsContents;
      },
      /**
       * Function that returns list of gadget names only visible in the state
       * name provided. Gadgets visible in multiple states would not be
       * included.
       */
      getGadgetNamesUniqueToState: function(stateName) {
        var gadgetNameList = [];
        for (var gadgetName in _gadgets) {
          var gadgetStateVisibilityList = (
            _gadgets[gadgetName].visible_in_states);
          if (gadgetStateVisibilityList.length === 1 &&
              gadgetStateVisibilityList[0] === stateName) {
            gadgetNameList.push(gadgetName);
          }
        }
        return gadgetNameList;
      },
      /**
       * Function that updates the old state name to the new state name in
       * gadget's visibility settings.
       */
      handleStateRenaming: function(oldStateName, newStateName) {
        for (var gadgetName in _gadgets) {
          var gadgetStateVisibilityList = angular.copy(
            _gadgets[gadgetName].visible_in_states);
          var stateNameIndex = gadgetStateVisibilityList.indexOf(oldStateName);
          if (stateNameIndex > -1) {
            gadgetStateVisibilityList[stateNameIndex] = newStateName;
            changeListService.editGadgetProperty(
              gadgetName,
              'gadget_visibility',
              gadgetStateVisibilityList,
              _gadgets[gadgetName].visible_in_states
            );
            _gadgets[gadgetName].visible_in_states = gadgetStateVisibilityList;
            $rootScope.$broadcast('gadgetsChangedOrInitialized');
          }
        }
      },
      /**
       * Function that deletes the state name in gadget's visibility settings.
       */
      handleStateDeletion: function(stateName) {
        for (var gadgetName in _gadgets) {
          var gadgetStateVisibilityList = angular.copy(
            _gadgets[gadgetName].visible_in_states);
          var stateNameIndex = gadgetStateVisibilityList.indexOf(stateName);
          if (stateNameIndex > -1) {
            gadgetStateVisibilityList.splice(stateNameIndex, 1);
            changeListService.editGadgetProperty(
              gadgetName,
              'gadget_visibility',
              gadgetStateVisibilityList,
              _gadgets[gadgetName].visible_in_states
            );
            _gadgets[gadgetName].visible_in_states = gadgetStateVisibilityList;
            $rootScope.$broadcast('gadgetsChangedOrInitialized');
          }
        }
      },
      /**
       * Updates a gadget's visibility and/or customization args using
       * the new data provided.
       *
       * This method does not update a gadget's name or panel position.
       * Use this method in conjunction with renameGadget and
       * moveGadgetBetweenPanels if those aspects need to be changed as well.
       *
       * @param {string} gadgetName - The name of gadget being updated.
       * @param {object} newCustomizationArgs - New customization data for the
       *   gadget.
       * @param {array} newVisibleInStates - New state visibility list for the
       *   gadget.
       */
      updateGadget: function(
          gadgetName, newCustomizationArgs, newVisibleInStates) {
        if (!_gadgets.hasOwnProperty(gadgetName)) {
          alertsService.addWarning(
            'Attempted to update a non-existent gadget: ' + gadgetName);
          return;
        }

        // Check if new gadget data is valid.
        // Warning will be displayed by isGadgetDataValid(...)
        if (!gadgetValidationService.isGadgetDataValid(
          gadgetName, newCustomizationArgs, newVisibleInStates)) {
          return;
        }

        var currentGadgetData = _gadgets[gadgetName];

        if (!angular.equals(currentGadgetData.customization_args,
            newCustomizationArgs)) {
          $log.info('Updating customization args for gadget: ' + gadgetName);
          changeListService.editGadgetProperty(
            gadgetName,
            'gadget_customization_args',
            newCustomizationArgs,
            currentGadgetData.customization_args
          );
        }
        if (!angular.equals(currentGadgetData.visible_in_states,
            newVisibleInStates)) {
          $log.info('Updating visibility for gadget: ' + gadgetName);
          changeListService.editGadgetProperty(
            gadgetName,
            'gadget_visibility',
            newVisibleInStates,
            currentGadgetData.visible_in_states
          );
        }

        // Updating the _gadgets dict.
        currentGadgetData.customization_args = angular.copy(
          newCustomizationArgs);
        currentGadgetData.visible_in_states = angular.copy(newVisibleInStates);
        $rootScope.$broadcast('gadgetsChangedOrInitialized');
      },
      addGadget: function(gadgetData) {
        // Defense-in-depth: This warning should never happen with panel names
        // hard coded and validated on the backend.
        if (!_panels.hasOwnProperty(gadgetData.panel)) {
          alertsService.addWarning(
            'Attempted add to a non-existent panel: ' + gadgetData.panel);
          return;
        }

        if (_gadgets.hasOwnProperty(gadgetData.gadget_name)) {
          alertsService.addWarning('A gadget with this name already exists.');
          return;
        }

        _gadgets[gadgetData.gadget_name] = gadgetData;
        _panels[gadgetData.panel].push(gadgetData.gadget_name);
        $rootScope.$broadcast('gadgetsChangedOrInitialized');
        changeListService.addGadget(gadgetData);
      },
      /**
       * Function that opens a modal to confirm gadget delete.
       * @param {string} deleteGadgetName - The name of the gadget to be
       *   deleted.
       * @param {bool} showConfirmationDialog - To disable the confirmation
       *   dialog, pass false, true otherwise.
       */
      deleteGadget: function(deleteGadgetName, showConfirmationDialog) {
        alertsService.clearWarnings();

        if (showConfirmationDialog === null ||
            showConfirmationDialog === undefined) {
          alertsService.addWarning(
            'Missing param: No info was passed to show or hide the dialog.');
          return;
        }

        if (!_gadgets.hasOwnProperty(deleteGadgetName)) {
          // This warning can't be triggered in current UI.
          // Keeping as defense-in-depth for future UI changes.
          alertsService.addWarning(
            'No gadget with name ' + deleteGadgetName + ' exists.'
          );
          return;
        }

        var _actuallyDeleteGadget = function(deleteGadgetName) {
          // Update _gadgets.
          delete _gadgets[deleteGadgetName];
          // Update _panels.
          var hostPanel = _getPanelNameFromGadgetName(deleteGadgetName);
          var gadgetIndex = _panels[hostPanel].indexOf(deleteGadgetName);
          _panels[hostPanel].splice(gadgetIndex, 1);

          $rootScope.$broadcast('gadgetsChangedOrInitialized');
          // Update changeListService
          changeListService.deleteGadget(deleteGadgetName);
        };

        if (!showConfirmationDialog) {
          _actuallyDeleteGadget(deleteGadgetName);
          return;
        }

        $modal.open({
          templateUrl: 'modals/deleteGadget',
          backdrop: true,
          resolve: {
            deleteGadgetName: function() {
              return deleteGadgetName;
            }
          },
          controller: [
            '$scope', '$modalInstance', 'deleteGadgetName',
            function($scope, $modalInstance, deleteGadgetName) {
              $scope.deleteGadgetName = deleteGadgetName;

              $scope.reallyDelete = function() {
                $modalInstance.close(deleteGadgetName);
              };

              $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
                alertsService.clearWarnings();
              };
            }
          ]
        }).result.then(function(deleteGadgetName) {
          _actuallyDeleteGadget(deleteGadgetName);
        });
      },
      renameGadget: function(oldGadgetName, newGadgetName) {
        newGadgetName = $filter('normalizeWhitespace')(newGadgetName);
        if (!_isNewGadgetNameValid(newGadgetName)) {
          return;
        }
        if (_gadgets.hasOwnProperty(newGadgetName)) {
          alertsService.addWarning('A gadget with this name already exists.');
          return;
        }
        alertsService.clearWarnings();

        // Update _gadgets
        gadgetData = angular.copy(_gadgets[oldGadgetName]);
        gadgetData.gadget_name = newGadgetName;
        _gadgets[newGadgetName] = gadgetData;
        delete _gadgets[oldGadgetName];

        // Update _panels
        var hostPanel = _getPanelNameFromGadgetName(oldGadgetName);
        var gadgetIndex = _panels[hostPanel].indexOf(oldGadgetName);
        _panels[hostPanel].splice(gadgetIndex, 1, newGadgetName);
        $rootScope.$broadcast('gadgetsChangedOrInitialized');

        changeListService.renameGadget(oldGadgetName, newGadgetName);
      }
    };
  }
]);

// A service that returns the frontend representation of a newly-added state.
oppia.factory('newStateTemplateService', [function() {
  return {
    // Returns a template for the new state with the given state name, changing
    // the default rule destination to the new state name in the process.
    // NB: clients should ensure that the desired state name is valid.
    getNewStateTemplate: function(newStateName) {
      var newStateTemplate = angular.copy(GLOBALS.NEW_STATE_TEMPLATE);
      newStateTemplate.interaction.default_outcome.dest = newStateName;
      return newStateTemplate;
    }
  };
}]);

oppia.factory('computeGraphService', [
  'INTERACTION_SPECS', function(INTERACTION_SPECS) {
    var _computeGraphData = function(initStateId, states) {
      var nodes = {};
      var links = [];
      var finalStateIds = [];
      for (var stateName in states) {
        var interaction = states[stateName].interaction;
        if (interaction.id && INTERACTION_SPECS[interaction.id].is_terminal) {
          finalStateIds.push(stateName);
        }

        nodes[stateName] = stateName;

        if (interaction.id) {
          var groups = interaction.answer_groups;
          for (var h = 0; h < groups.length; h++) {
            links.push({
              source: stateName,
              target: groups[h].outcome.dest,
              isFallback: false
            });
          }

          if (interaction.default_outcome) {
            links.push({
              source: stateName,
              target: interaction.default_outcome.dest,
              isFallback: false
            });
          }

          var fallbacks = interaction.fallbacks;
          for (var h = 0; h < fallbacks.length; h++) {
            links.push({
              source: stateName,
              target: fallbacks[h].outcome.dest,
              isFallback: true
            });
          }
        }
      }

      return {
        finalStateIds: finalStateIds,
        initStateId: initStateId,
        links: links,
        nodes: nodes
      };
    };

    return {
      compute: function(initStateId, states) {
        return _computeGraphData(initStateId, states);
      }
    };
  }
]);

// Service for computing graph data.
oppia.factory('graphDataService', [
  'explorationStatesService', 'explorationInitStateNameService',
  'computeGraphService',
  function(
      explorationStatesService, explorationInitStateNameService,
      computeGraphService) {
    var _graphData = null;

    // Returns an object which can be treated as the input to a visualization
    // for a directed graph. The returned object has the following keys:
    //   - nodes: an object whose keys are node ids (equal to node names) and
    //       whose values are node names
    //   - links: a list of objects. Each object represents a directed link
    //       between two nodes, and has keys 'source' and 'target', the values
    //       of which are the names of the corresponding nodes.
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
  }
]);

// Service for the state editor tutorial.
oppia.factory('stateEditorTutorialFirstTimeService', [
  '$http', '$rootScope', 'editorFirstTimeEventsService',
  function($http, $rootScope, editorFirstTimeEventsService) {
    // Whether this is the first time the tutorial has been seen by this user.
    var _currentlyInFirstVisit = true;

    var STARTED_TUTORIAL_EVENT_URL = '/createhandler/started_tutorial_event';

    return {
      // After the first call to it in a client session, this does nothing.
      init: function(firstTime, expId) {
        if (!firstTime || !_currentlyInFirstVisit) {
          _currentlyInFirstVisit = false;
        }

        if (_currentlyInFirstVisit) {
          $rootScope.$broadcast('enterEditorForTheFirstTime');
          editorFirstTimeEventsService.initRegisterEvents(expId);
          $http.post(STARTED_TUTORIAL_EVENT_URL).error(function() {
            console.error('Warning: could not record tutorial start event.');
          });
        }
      },
      markTutorialFinished: function() {
        if (_currentlyInFirstVisit) {
          $rootScope.$broadcast('openPostTutorialHelpPopover');
          editorFirstTimeEventsService.registerEditorFirstEntryEvent();
        }

        _currentlyInFirstVisit = false;
      }
    };
  }
]);

oppia.constant('WARNING_TYPES', {
  // These must be fixed before the exploration can be saved.
  CRITICAL: 'critical',
  // These must be fixed before publishing an exploration to the public
  // library.
  ERROR: 'error'
});

oppia.constant('STATE_ERROR_MESSAGES', {
  ADD_INTERACTION: 'Please add an interaction to this card.',
  STATE_UNREACHABLE: 'This card is unreachable.',
  UNABLE_TO_END_EXPLORATION: (
    'There\'s no way to complete the exploration starting from this card.')
});

// Service for the list of exploration warnings.
oppia.factory('explorationWarningsService', [
  '$filter', 'graphDataService', 'explorationStatesService',
  'expressionInterpolationService', 'explorationParamChangesService',
  'parameterMetadataService', 'INTERACTION_SPECS', 'WARNING_TYPES',
  'STATE_ERROR_MESSAGES', 'CLASSIFIER_RULESPEC_STR',
  function(
      $filter, graphDataService, explorationStatesService,
      expressionInterpolationService, explorationParamChangesService,
      parameterMetadataService, INTERACTION_SPECS, WARNING_TYPES,
      STATE_ERROR_MESSAGES, CLASSIFIER_RULESPEC_STR) {
    var _warningsList = [];
    var stateWarnings = {};
    var hasCriticalStateWarning = false;

    var _getStatesWithoutInteractionIds = function() {
      var statesWithoutInteractionIds = [];

      var states = explorationStatesService.getStates();
      for (var stateName in states) {
        if (!states[stateName].interaction.id) {
          statesWithoutInteractionIds.push(stateName);
        }
      }

      return statesWithoutInteractionIds;
    };

    // Returns a list of names of all nodes which are unreachable from the
    // initial node.
    //
    // Args:
    // - initNodeIds: a list of initial node ids
    // - nodes: an object whose keys are node ids, and whose values are node
    //     names
    // - edges: a list of edges, each of which is an object with keys 'source',
    //     'target', and 'isFallback'
    // - allowFallbackEdges: a boolean specifying whether to treat fallback
    //     edges as valid edges for the purposes of this computation.
    var _getUnreachableNodeNames = function(
        initNodeIds, nodes, edges, allowFallbackEdges) {
      var queue = initNodeIds;
      var seen = {};
      for (var i = 0; i < initNodeIds.length; i++) {
        seen[initNodeIds[i]] = true;
      }
      while (queue.length > 0) {
        var currNodeId = queue.shift();
        edges.forEach(function(edge) {
          if (edge.source === currNodeId && !seen.hasOwnProperty(edge.target) &&
              (allowFallbackEdges || !edge.isFallback)) {
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
    // an array with the same objects but with the values of 'source' and
    // 'target' switched. (The objects represent edges in a graph, and this
    // operation amounts to reversing all the edges.)
    var _getReversedLinks = function(links) {
      return links.map(function(link) {
        return {
          source: link.target,
          target: link.source,
          isFallback: link.isFallback
        };
      });
    };

    // Verify that all parameters referred to in a state are guaranteed to
    // have been set beforehand.
    var _verifyParameters = function(initNodeIds) {
      var unsetParametersInfo = (
        parameterMetadataService.getUnsetParametersInfo(initNodeIds));

      var paramWarningsList = [];
      unsetParametersInfo.forEach(function(unsetParameterData) {
        if (!unsetParameterData.stateName) {
          // The parameter value is required in the initial list of parameter
          // changes.
          paramWarningsList.push({
            type: WARNING_TYPES.CRITICAL,
            message: (
              'Please ensure the value of parameter "' +
              unsetParameterData.paramName +
              '" is set before it is referred to in the initial list of ' +
              'parameter changes.')
          });
        } else {
          // The parameter value is required in a subsequent state.
          paramWarningsList.push({
            type: WARNING_TYPES.CRITICAL,
            message: (
              'Please ensure the value of parameter "' +
              unsetParameterData.paramName +
              '" is set before using it in "' + unsetParameterData.stateName +
              '".')
          });
        }
      });

      return paramWarningsList;
    };

    var _getAnswerGroupIndexesWithEmptyClassifiers = function(state) {
      var indexes = [];
      var answerGroups = state.interaction.answer_groups;
      for (var i = 0; i < answerGroups.length; i++) {
        var group = answerGroups[i];
        if (group.rule_specs.length === 1 &&
            group.rule_specs[0].rule_type === CLASSIFIER_RULESPEC_STR &&
            group.rule_specs[0].inputs.training_data.length === 0) {
          indexes.push(i);
        }
      }
      return indexes;
    };

    var _getStatesAndAnswerGroupsWithEmptyClassifiers = function() {
      var results = [];

      var states = explorationStatesService.getStates();
      for (var stateName in states) {
        var groupIndexes = _getAnswerGroupIndexesWithEmptyClassifiers(
          states[stateName]);
        if (groupIndexes.length > 0) {
          results.push({
            groupIndexes: groupIndexes,
            stateName: stateName
          });
        }
      }

      return results;
    };

    var _updateWarningsList = function() {
      _warningsList = [];
      stateWarnings = {};
      hasCriticalStateWarning = false;

      graphDataService.recompute();
      var _graphData = graphDataService.getGraphData();

      var _states = explorationStatesService.getStates();
      for (var stateName in _states) {
        var interaction = _states[stateName].interaction;
        if (interaction.id) {
          var validatorName = (
            'oppiaInteractive' + _states[stateName].interaction.id +
            'Validator');
          var interactionWarnings = $filter(validatorName)(
            stateName, interaction.customization_args,
            interaction.answer_groups, interaction.default_outcome);

          for (var j = 0; j < interactionWarnings.length; j++) {
            if (stateWarnings.hasOwnProperty(stateName)) {
              stateWarnings[stateName].push(interactionWarnings[j].message);
            } else {
              stateWarnings[stateName] = [interactionWarnings[j].message];
            }

            if (interactionWarnings[j].type === WARNING_TYPES.CRITICAL) {
              hasCriticalStateWarning = true;
            }
          }
        }
      }

      var statesWithoutInteractionIds = _getStatesWithoutInteractionIds();
      angular.forEach(statesWithoutInteractionIds, function(
        stateWithoutInteractionIds) {
        if (stateWarnings.hasOwnProperty(stateWithoutInteractionIds)) {
          stateWarnings[stateWithoutInteractionIds].push(
            STATE_ERROR_MESSAGES.ADD_INTERACTION);
        } else {
          stateWarnings[stateWithoutInteractionIds] = [
            STATE_ERROR_MESSAGES.ADD_INTERACTION];
        }
      });

      if (_graphData) {
        // Note that it is fine for states to be reachable by means of fallback
        // edges only.
        var unreachableStateNames = _getUnreachableNodeNames(
          [_graphData.initStateId], _graphData.nodes, _graphData.links, true);

        if (unreachableStateNames.length) {
          angular.forEach(unreachableStateNames, function(
            unreachableStateName) {
            if (stateWarnings.hasOwnProperty(unreachableStateName)) {
              stateWarnings[unreachableStateName].push(
                STATE_ERROR_MESSAGES.STATE_UNREACHABLE);
            } else {
              stateWarnings[unreachableStateName] =
                [STATE_ERROR_MESSAGES.STATE_UNREACHABLE];
            }
          });
        } else {
          // Only perform this check if all states are reachable. There must be
          // a non-fallback path from each state to the END state.
          var deadEndStates = _getUnreachableNodeNames(
            _graphData.finalStateIds, _graphData.nodes,
            _getReversedLinks(_graphData.links), false);
          if (deadEndStates.length) {
            angular.forEach(deadEndStates, function(deadEndState) {
              if (stateWarnings.hasOwnProperty(deadEndState)) {
                stateWarnings[deadEndState].push(
                  STATE_ERROR_MESSAGES.UNABLE_TO_END_EXPLORATION);
              } else {
                stateWarnings[deadEndState] = [
                  STATE_ERROR_MESSAGES.UNABLE_TO_END_EXPLORATION];
              }
            });
          }
        }

        _warningsList = _warningsList.concat(_verifyParameters([
          _graphData.initStateId]));
      }

      if (Object.keys(stateWarnings).length) {
        _warningsList.push({
          type: WARNING_TYPES.ERROR,
          message: (
            'The following states have errors: ' +
            Object.keys(stateWarnings).join(', ') + '.')
        });
      };

      var statesWithAnswerGroupsWithEmptyClassifiers = (
        _getStatesAndAnswerGroupsWithEmptyClassifiers());
      statesWithAnswerGroupsWithEmptyClassifiers.forEach(function(result) {
        var warningMessage = 'In \'' + result.stateName + '\'';
        if (result.groupIndexes.length !== 1) {
          warningMessage += ', the following answer groups have classifiers ';
          warningMessage += 'with no training data: ';
        } else {
          warningMessage += ', the following answer group has a classifier ';
          warningMessage += 'with no training data: ';
        }
        warningMessage += result.groupIndexes.join(', ');

        _warningsList.push({
          message: warningMessage,
          type: WARNING_TYPES.ERROR
        });
      });
    };

    return {
      countWarnings: function() {
        return _warningsList.length;
      },
      getAllStateRelatedWarnings: function() {
        return stateWarnings;
      },
      getWarnings: function() {
        return _warningsList;
      },
      hasCriticalWarnings: function() {
        return hasCriticalStateWarning || _warningsList.some(function(warning) {
          return warning.type === WARNING_TYPES.CRITICAL;
        });
      },
      updateWarnings: function() {
        _updateWarningsList();
      }
    };
  }
]);

oppia.factory('lostChangesService', ['utilsService', function(utilsService) {
  var CMD_ADD_STATE = 'add_state';
  var CMD_RENAME_STATE = 'rename_state';
  var CMD_DELETE_STATE = 'delete_state';
  var CMD_EDIT_STATE_PROPERTY = 'edit_state_property';

  var makeRulesListHumanReadable = function(answerGroupValue) {
    var rulesList = [];
    answerGroupValue.rule_specs.forEach(function(ruleSpec) {
      var ruleElm = angular.element('<li></li>');
      ruleElm.html('<p>Type: ' + ruleSpec.rule_type + '</p>');
      ruleElm.append(
        '<p>Value: ' + (
          Object.keys(ruleSpec.inputs).map(function(input) {
            return ruleSpec.inputs[input];
          })
        ).toString() + '</p>');
      rulesList.push(ruleElm);
    });

    return rulesList;
  };

  // An edit is represented either as an object or an array. If it's an object,
  // then simply return that object. In case of an array, return the last item.
  var getStatePropertyValue = function(statePropertyValue) {
    return angular.isArray(statePropertyValue) ?
      statePropertyValue[statePropertyValue.length - 1] : statePropertyValue;
  };

  // Detects whether an object of the type 'answer_group' or 'default_outcome'
  // has been added, edited or deleted. Returns - 'addded', 'edited' or
  // 'deleted' accordingly.
  var getRelativeChangeToGroups = function(changeObject) {
    var newValue = changeObject.new_value;
    var oldValue = changeObject.old_value;
    var result = '';

    if (angular.isArray(newValue) && angular.isArray(oldValue)) {
      result = (newValue.length > oldValue.length) ?
        'added' : (newValue.length === oldValue.length) ?
        'edited' : 'deleted';
    } else {
      if (!utilsService.isEmpty(oldValue)) {
        if (!utilsService.isEmpty(newValue)) {
          result = 'edited';
        } else {
          result = 'deleted';
        }
      } else if (!utilsService.isEmpty(newValue)) {
        result = 'added';
      }
    }
    return result;
  };

  var makeHumanReadable = function(lostChanges) {
    var outerHtml = angular.element('<ul></ul>');
    var stateWiseEditsMapping = {};
    // The variable stateWiseEditsMapping stores the edits grouped by state.
    // For instance, you made the following edits:
    // 1. Changed content to 'Welcome!' instead of '' in 'Introduction'.
    // 2. Added an interaction in this state.
    // 2. Added a new state 'End'.
    // 3. Ended Exporation from state 'End'.
    // stateWiseEditsMapping will look something like this:
    // - 'Introduction': [
    //   - 'Edited Content: Welcome!',:
    //   - 'Added Interaction: Continue',
    //   - 'Added interaction customizations']
    // - 'End': ['Ended exploration']

    lostChanges.forEach(function(lostChange) {
      switch (lostChange.cmd) {
        case CMD_ADD_STATE:
          outerHtml.append(
            angular.element('<li></li>').html(
              'Added state: ' + lostChange.state_name));
          break;
        case CMD_RENAME_STATE:
          outerHtml.append(
            angular.element('<li></li>').html(
              'Renamed state: ' + lostChange.old_state_name + ' to ' +
                lostChange.new_state_name));
          break;
        case CMD_DELETE_STATE:
          outerHtml.append(
            angular.element('<li></li>').html(
              'Deleted state: ' + lostChange.state_name));
          break;
        case CMD_EDIT_STATE_PROPERTY:
          var newValue = getStatePropertyValue(lostChange.new_value);
          var oldValue = getStatePropertyValue(lostChange.old_value);
          var stateName = lostChange.state_name;
          if (!stateWiseEditsMapping[stateName]) {
            stateWiseEditsMapping[stateName] = [];
          }

          switch (lostChange.property_name) {
            case 'content':
              if (newValue !== null) {
                stateWiseEditsMapping[stateName].push(
                  angular.element('<div></div>').html(
                    '<strong>Edited content: </strong><div class="content">' +
                      newValue.value + '</div>')
                    .addClass('state-edit-desc'));
              }
              break;

            case 'widget_id':
              var lostChangeValue = '';
              if (oldValue === null) {
                if (newValue !== 'EndExploration') {
                  lostChangeValue = ('<strong>Added Interaction: </strong>' +
                                     newValue);
                } else {
                  lostChangeValue = 'Ended Exploration';
                }
              } else {
                lostChangeValue = ('<strong>Deleted Interaction: </strong>' +
                                   oldValue);
              }
              stateWiseEditsMapping[stateName].push(
                angular.element('<div></div>').html(lostChangeValue)
                  .addClass('state-edit-desc'));
              break;

            case 'widget_customization_args':
              var lostChangeValue = '';
              if (utilsService.isEmpty(oldValue)) {
                lostChangeValue = 'Added Interaction Customizations';
              } else if (utilsService.isEmpty(newValue)) {
                lostChangeValue = 'Removed Interaction Customizations';
              } else {
                lostChangeValue = 'Edited Interaction Customizations';
              }
              stateWiseEditsMapping[stateName].push(
                angular.element('<div></div>').html(lostChangeValue)
                  .addClass('state-edit-desc'));
              break;

            case 'answer_groups':
              var answerGroupChanges = getRelativeChangeToGroups(lostChange);
              var answerGroupHtml = '';
              if (answerGroupChanges === 'added') {
                answerGroupHtml += (
                  '<p class="sub-edit"><i>Destination: </i>' +
                    newValue.outcome.dest + '</p>');
                answerGroupHtml += (
                  '<div class="sub-edit"><i>Feedback: </i>' +
                    '<div class="feedback">' +
                    newValue.outcome.feedback + '</div></div>');
                var rulesList = makeRulesListHumanReadable(newValue);
                if (rulesList.length > 0) {
                  answerGroupHtml += '<p class="sub-edit"><i>Rules: </i></p>';
                  var rulesListHtml = (angular.element('<ol></ol>')
                                       .addClass('rules-list'));
                  for (var rule in rulesList) {
                    rulesListHtml.html(rulesList[rule][0].outerHTML);
                  }
                  answerGroupHtml += rulesListHtml[0].outerHTML;
                }
                stateWiseEditsMapping[stateName].push(
                  angular.element('<div><strong>Added answer group: ' +
                                  '</strong></div>')
                    .append(answerGroupHtml)
                    .addClass('state-edit-desc answer-group'));
              } else if (answerGroupChanges === 'edited') {
                if (newValue.outcome.dest !== oldValue.outcome.dest) {
                  answerGroupHtml += (
                    '<p class="sub-edit"><i>Destination: </i>' +
                      newValue.outcome.dest + '</p>');
                }
                if (!angular.equals(
                    newValue.outcome.feedback, oldValue.outcome.feedback)) {
                  answerGroupHtml += (
                    '<div class="sub-edit"><i>Feedback: </i>' +
                      '<div class="feedback">' + newValue.outcome.feedback +
                      '</div></div>');
                }
                if (!angular.equals(newValue.rule_specs, oldValue.rule_specs)) {
                  var rulesList = makeRulesListHumanReadable(newValue);
                  if (rulesList.length > 0) {
                    answerGroupHtml += '<p class="sub-edit"><i>Rules: </i></p>';
                    var rulesListHtml = (angular.element('<ol></ol>')
                                         .addClass('rules-list'));
                    for (var rule in rulesList) {
                      rulesListHtml.html(rulesList[rule][0].outerHTML);
                    }
                    answerGroupChanges = rulesListHtml[0].outerHTML;
                  }
                }
                stateWiseEditsMapping[stateName].push(
                  angular.element('<div><strong>Edited answer group: <strong>' +
                                  '</div>')
                    .append(answerGroupHtml)
                    .addClass('state-edit-desc answer-group'));
              } else if (answerGroupChanges === 'deleted') {
                stateWiseEditsMapping[stateName].push(
                  angular.element('<div>Deleted answer group</div>')
                    .addClass('state-edit-desc'));
              }
              break;

            case 'default_outcome':
              var defaultOutcomeChanges = getRelativeChangeToGroups(lostChange);
              var defaultOutcomeHtml = '';
              if (defaultOutcomeChanges === 'added') {
                defaultOutcomeHtml += (
                  '<p class="sub-edit"><i>Destination: </i>' +
                    newValue.dest + '</p>');
                defaultOutcomeHtml += (
                  '<div class="sub-edit"><i>Feedback: </i>' +
                    '<div class="feedback">' + newValue.feedback +
                    '</div></div>');
                stateWiseEditsMapping[stateName].push(
                  angular.element('<div>Added default outcome: </div>')
                    .append(defaultOutcomeHtml)
                    .addClass('state-edit-desc default-outcome'));
              } else if (defaultOutcomeChanges === 'edited') {
                if (newValue.dest !== oldValue.dest) {
                  defaultOutcomeHtml += (
                    '<p class="sub-edit"><i>Destination: </i>' + newValue.dest +
                      '</p>');
                }
                if (!angular.equals(newValue.feedback, oldValue.feedback)) {
                  defaultOutcomeHtml += (
                    '<div class="sub-edit"><i>Feedback: </i>' +
                      '<div class="feedback">' + newValue.feedback +
                      '</div></div>');
                }
                stateWiseEditsMapping[stateName].push(
                  angular.element('<div>Edited default outcome: </div>')
                    .append(defaultOutcomeHtml)
                    .addClass('state-edit-desc default-outcome'));
              } else if (defaultOutcomeChanges === 'deleted') {
                stateWiseEditsMapping[stateName].push(
                  angular.element('<div>Deleted default outcome</div>')
                    .addClass('state-edit-desc'));
              }
          };
      }
    });

    for (var stateName in stateWiseEditsMapping) {
      var stateChangesEl = angular.element(
        '<li>Edits to state: ' + stateName + '</li>');
      for (var stateEdit in stateWiseEditsMapping[stateName]) {
        stateChangesEl.append(stateWiseEditsMapping[stateName][stateEdit]);
      }
      outerHtml.append(stateChangesEl);
    }

    return outerHtml;
  };

  return {
    makeHumanReadable: makeHumanReadable
  };
}]);

// Service for displaying different types of modals depending on the type of
// response received as a result of the autosaving request.
oppia.factory('autosaveInfoModalsService', [
  '$log', '$modal', '$timeout', '$window', 'lostChangesService',
  'explorationData',
  function(
      $log, $modal, $timeout, $window, lostChangesService,
      explorationData) {
    var _isModalOpen = false;
    var _refreshPage = function(delay) {
      $timeout(function() {
        $window.location.reload();
      }, delay);
    };

    return {
      showNonStrictValidationFailModal: function() {
        $modal.open({
          templateUrl: 'modals/saveValidationFail',
          // Prevent modal from closing when the user clicks outside it.
          backdrop: 'static',
          controller: [
            '$scope', '$modalInstance', function($scope, $modalInstance) {
              $scope.closeAndRefresh = function() {
                $modalInstance.dismiss('cancel');
                _refreshPage(20);
              };
            }
          ]
        }).result.then(function() {
          _isModalOpen = false;
        }, function() {
          _isModalOpen = false;
        });

        _isModalOpen = true;
      },
      isModalOpen: function() {
        return _isModalOpen;
      },
      showVersionMismatchModal: function(lostChanges) {
        $modal.open({
          templateUrl: 'modals/saveVersionMismatch',
          // Prevent modal from closing when the user clicks outside it.
          backdrop: 'static',
          controller: ['$scope', function($scope) {
            // When the user clicks on discard changes button, signal backend
            // to discard the draft and reload the page thereafter.
            $scope.discardChanges = function() {
              explorationData.discardDraft(function() {
                _refreshPage(20);
              });
            };

            $scope.hasLostChanges = (lostChanges && lostChanges.length > 0);
            if ($scope.hasLostChanges) {
              // TODO(sll): This should also include changes to exploration
              // properties (such as the exploration title, category, etc.).
              $scope.lostChangesHtml = (
                lostChangesService.makeHumanReadable(lostChanges).html());
              $log.error('Lost changes: ' + JSON.stringify(lostChanges));
            }
          }],
          windowClass: 'oppia-autosave-version-mismatch-modal'
        }).result.then(function() {
          _isModalOpen = false;
        }, function() {
          _isModalOpen = false;
        });

        _isModalOpen = true;
      }
    };
  }
]);

// Service registering analytics events for the editor for events which are
// only logged when they happen after the editor is opened for the first time
// for an exploration.
oppia.factory('editorFirstTimeEventsService', ['siteAnalyticsService',
  function(siteAnalyticsService) {
    var explorationId = null;
    var shouldRegisterEvents = false;
    var alreadyRegisteredEvents = {};
    return {
      initRegisterEvents: function(expId) {
        shouldRegisterEvents = true;
        explorationId = expId;
      },
      registerEditorFirstEntryEvent: function() {
        if (shouldRegisterEvents &&
            !alreadyRegisteredEvents.hasOwnProperty('EditorFirstEntryEvent')) {
          siteAnalyticsService.registerEditorFirstEntryEvent(explorationId);
          alreadyRegisteredEvents.EditorFirstEntryEvent = true;
        }
      },
      registerFirstOpenContentBoxEvent: function() {
        if (shouldRegisterEvents &&
            !alreadyRegisteredEvents.hasOwnProperty(
              'FirstOpenContentBoxEvent')) {
          siteAnalyticsService.registerFirstOpenContentBoxEvent(explorationId);
          alreadyRegisteredEvents.FirstOpenContentBoxEvent = true;
        }
      },
      registerFirstSaveContentEvent: function() {
        if (shouldRegisterEvents &&
            !alreadyRegisteredEvents.hasOwnProperty('FirstSaveContentEvent')) {
          siteAnalyticsService.registerFirstSaveContentEvent(explorationId);
          alreadyRegisteredEvents.FirstSaveContentEvent = true;
        }
      },
      registerFirstClickAddInteractionEvent: function() {
        if (shouldRegisterEvents &&
            !alreadyRegisteredEvents.hasOwnProperty(
              'FirstClickAddInteractionEvent')) {
          siteAnalyticsService.registerFirstClickAddInteractionEvent(
            explorationId);
          alreadyRegisteredEvents.FirstClickAddInteractionEvent = true;
        }
      },
      registerFirstSelectInteractionTypeEvent: function() {
        if (shouldRegisterEvents &&
            !alreadyRegisteredEvents.hasOwnProperty(
              'FirstSelectInteractionTypeEvent')) {
          siteAnalyticsService.registerFirstSelectInteractionTypeEvent(
            explorationId);
          alreadyRegisteredEvents.FirstSelectInteractionTypeEvent = true;
        }
      },
      registerFirstSaveInteractionEvent: function() {
        if (shouldRegisterEvents &&
            !alreadyRegisteredEvents.hasOwnProperty(
              'FirstSaveInteractionEvent')) {
          siteAnalyticsService.registerFirstSaveInteractionEvent(explorationId);
          alreadyRegisteredEvents.FirstSaveInteractionEvent = true;
        }
      },
      registerFirstSaveRuleEvent: function() {
        if (shouldRegisterEvents &&
            !alreadyRegisteredEvents.hasOwnProperty('FirstSaveRuleEvent')) {
          siteAnalyticsService.registerFirstSaveRuleEvent(explorationId);
          alreadyRegisteredEvents.FirstSaveRuleEvent = true;
        }
      },
      registerFirstCreateSecondStateEvent: function() {
        if (shouldRegisterEvents &&
            !alreadyRegisteredEvents.hasOwnProperty(
              'FirstCreateSecondStateEvent')) {
          siteAnalyticsService.registerFirstCreateSecondStateEvent(
            explorationId);
          alreadyRegisteredEvents.FirstCreateSecondStateEvent = true;
        }
      }
    };
  }
]);
