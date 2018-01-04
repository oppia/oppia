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
  '$rootScope', '$log', 'AlertsService', 'ExplorationDataService',
  'autosaveInfoModalsService',
  function(
      $rootScope, $log, AlertsService, ExplorationDataService,
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
      default_outcome: true,
      hints: true,
      param_changes: true,
      param_specs: true,
      solution: true,
      state_name: true,
      widget_customization_args: true,
      widget_id: true
    };

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
          if (!response.data.is_version_of_draft_valid) {
            if (!autosaveInfoModalsService.isModalOpen()) {
              autosaveInfoModalsService.showVersionMismatchModal(
                explorationChangeList);
            }
          }
        },
        function() {
          AlertsService.clearWarnings();
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
        ExplorationDataService.discardDraft();
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
      }
    };
  }
]);

oppia.factory('explorationPropertyService', [
  '$rootScope', '$log', 'changeListService', 'AlertsService',
  function($rootScope, $log, changeListService, AlertsService) {
    // Public base API for data services corresponding to exploration properties
    // (title, category, etc.)

    var BACKEND_CONVERSIONS = {
      param_changes: function(paramChanges) {
        return paramChanges.map(function(paramChange) {
          return paramChange.toBackendDict();
        });
      },
      param_specs: function(paramSpecs) {
        return paramSpecs.toBackendDict();
      },
    }

    return {
      init: function(value) {
        if (this.propertyName === null) {
          throw 'Exploration property name cannot be null.';
        }

        $log.info('Initializing exploration ' + this.propertyName + ':', value);

        // The current value of the property (which may not have been saved to
        // the frontend yet). In general, this will be bound directly to the UI.
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
      // The backend name for this property. THIS MUST BE SPECIFIED BY
      // SUBCLASSES.
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

        AlertsService.clearWarnings();

        var newBackendValue = angular.copy(this.displayed);
        var oldBackendValue = angular.copy(this.savedMemento);

        if (BACKEND_CONVERSIONS.hasOwnProperty(this.propertyName)) {
          newBackendValue =
            BACKEND_CONVERSIONS[this.propertyName](this.displayed);
          oldBackendValue =
            BACKEND_CONVERSIONS[this.propertyName](this.savedMemento);
        }

        changeListService.editExplorationProperty(
          this.propertyName, newBackendValue, oldBackendValue);
        this.savedMemento = angular.copy(this.displayed);

        $rootScope.$broadcast('explorationPropertyChanged');
      },
      // Reverts the displayed value to the saved memento.
      restoreFromMemento: function() {
        this.displayed = angular.copy(this.savedMemento);
      }
    };
  }
]);

// A data service that stores the current exploration title so that it can be
// displayed and edited in multiple places in the UI.
oppia.factory('explorationTitleService', [
  'explorationPropertyService', '$filter', 'ValidatorsService',
  'ExplorationRightsService',
  function(
    explorationPropertyService, $filter, ValidatorsService,
    ExplorationRightsService) {
    var child = Object.create(explorationPropertyService);
    child.propertyName = 'title';
    child._normalize = $filter('normalizeWhitespace');
    child._isValid = function(value) {
      return ValidatorsService.isValidEntityName(
        value, true, ExplorationRightsService.isPrivate());
    };
    return child;
  }
]);

// A data service that stores the current exploration category so that it can be
// displayed and edited in multiple places in the UI.
oppia.factory('explorationCategoryService', [
  'explorationPropertyService', '$filter', 'ValidatorsService',
  'ExplorationRightsService',
  function(
    explorationPropertyService, $filter, ValidatorsService,
    ExplorationRightsService) {
    var child = Object.create(explorationPropertyService);
    child.propertyName = 'category';
    child._normalize = $filter('normalizeWhitespace');
    child._isValid = function(value) {
      return ValidatorsService.isValidEntityName(
        value, true, ExplorationRightsService.isPrivate());
    };
    return child;
  }
]);

// A data service that stores the current exploration objective so that it can
// be displayed and edited in multiple places in the UI.
oppia.factory('explorationObjectiveService', [
  'explorationPropertyService', '$filter', 'ValidatorsService',
  'ExplorationRightsService',
  function(
    explorationPropertyService, $filter, ValidatorsService,
    ExplorationRightsService) {
    var child = Object.create(explorationPropertyService);
    child.propertyName = 'objective';
    child._normalize = $filter('normalizeWhitespace');
    child._isValid = function(value) {
      return (
        ExplorationRightsService.isPrivate() ||
        ValidatorsService.isNonempty(value, false));
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
      // TODO(sll): Update this once the App Engine search service supports
      // 3-letter language codes.
      return constants.ALL_LANGUAGE_CODES.filter(function(languageCodeDict) {
        return languageCodeDict.code.length === 2;
      });
    };
    child.getCurrentLanguageDescription = function() {
      for (var i = 0; i < constants.ALL_LANGUAGE_CODES.length; i++) {
        if (constants.ALL_LANGUAGE_CODES[i].code === child.displayed) {
          return constants.ALL_LANGUAGE_CODES[i].description;
        }
      }
    };
    child._isValid = function(value) {
      return constants.ALL_LANGUAGE_CODES.some(function(elt) {
        // TODO(sll): Remove the second clause once the App Engine search
        // service supports 3-letter language codes.
        return elt.code === value && elt.code.length === 2;
      });
    };
    return child;
  }
]);

// A data service that stores the name of the exploration's initial state.
// NOTE: This service does not perform validation. Users of this service
// should ensure that new initial state names passed to the service are
// valid.
oppia.factory('explorationInitStateNameService', [
  'explorationPropertyService', function(explorationPropertyService) {
    var child = Object.create(explorationPropertyService);
    child.propertyName = 'init_state_name';
    return child;
  }
]);

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
  }
]);

oppia.factory('explorationParamSpecsService', [
  'explorationPropertyService', function(explorationPropertyService) {
    var child = Object.create(explorationPropertyService);
    child.propertyName = 'param_specs';
    return child;
  }
]);

oppia.factory('explorationParamChangesService', [
  'explorationPropertyService', function(explorationPropertyService) {
    var child = Object.create(explorationPropertyService);
    child.propertyName = 'param_changes';
    return child;
  }
]);

oppia.factory('explorationAutomaticTextToSpeechService', [
  'explorationPropertyService', function(explorationPropertyService) {
    var child = Object.create(explorationPropertyService);
    child.propertyName = 'auto_tts_enabled';

    child._isValid = function(value) {
      return (typeof value === 'boolean');
    };

    child.isAutomaticTextToSpeechEnabled = function() {
      return child.savedMemento;
    };

    child.toggleAutomaticTextToSpeech = function() {
      child.displayed = !child.displayed;
      child.saveDisplayedValue();
    };

    return child;
  }
]);

oppia.factory('explorationCorrectnessFeedbackService', [
  'explorationPropertyService', function(explorationPropertyService) {
    var child = Object.create(explorationPropertyService);
    child.propertyName = 'correctness_feedback_enabled';

    child._isValid = function(value) {
      return (typeof value === 'boolean');
    };

    child.isEnabled = function() {
      return child.savedMemento;
    };

    child.toggleCorrectnessFeedback = function() {
      child.displayed = !child.displayed;
      child.saveDisplayedValue();
    };

    return child;
  }
]);

// Data service for keeping track of the exploration's states. Note that this
// is unlike the other exploration property services, in that it keeps no
// mementos.
oppia.factory('explorationStatesService', [
  '$log', '$uibModal', '$filter', '$location', '$rootScope', '$injector', '$q',
  'explorationInitStateNameService', 'AlertsService', 'changeListService',
  'EditorStateService', 'ValidatorsService', 'StatesObjectFactory',
  'SolutionValidityService', 'AngularNameService',
  'AnswerClassificationService', 'ExplorationContextService',
  'UrlInterpolationService',
  function(
      $log, $uibModal, $filter, $location, $rootScope, $injector, $q,
      explorationInitStateNameService, AlertsService, changeListService,
      EditorStateService, ValidatorsService, StatesObjectFactory,
      SolutionValidityService, AngularNameService,
      AnswerClassificationService, ExplorationContextService,
      UrlInterpolationService) {
    var _states = null;
    // Properties that have a different backend representation from the
    // frontend and must be converted.

    var BACKEND_CONVERSIONS = {
      answer_groups: function(answerGroups) {
        return answerGroups.map(function(answerGroup) {
          return answerGroup.toBackendDict();
        });
      },
      content: function(content) {
        return content.toBackendDict()
      },
      default_outcome: function(defaultOutcome) {
        if (defaultOutcome) {
          return defaultOutcome.toBackendDict();
        } else {
          return null;
        }
      },
      hints: function(hints) {
        return hints.map(function(hint) {
          return hint.toBackendDict();
        });
      },
      param_changes: function(paramChanges) {
        return paramChanges.map(function(paramChange) {
          return paramChange.toBackendDict();
        });
      },
      param_specs: function(paramSpecs) {
        return paramSpecs.toBackendDict();
      },
      solution: function(solution) {
        if (solution) {
          return solution.toBackendDict();
        } else {
          return null;
        }
      }
    };

    // Maps backend names to the corresponding frontend dict accessor lists.
    var PROPERTY_REF_DATA = {
      answer_groups: ['interaction', 'answerGroups'],
      confirmed_unclassified_answers: [
        'interaction', 'confirmedUnclassifiedAnswers'],
      content: ['content'],
      default_outcome: ['interaction', 'defaultOutcome'],
      param_changes: ['paramChanges'],
      param_specs: ['paramSpecs'],
      hints: ['interaction', 'hints'],
      solution: ['interaction', 'solution'],
      widget_id: ['interaction', 'id'],
      widget_customization_args: ['interaction', 'customizationArgs']
    };

    var _setState = function(stateName, stateData, refreshGraph) {
      _states.setState(stateName, angular.copy(stateData));
      if (refreshGraph) {
        $rootScope.$broadcast('refreshGraph');
      }
    };

    var getStatePropertyMemento = function(stateName, backendName) {
      var accessorList = PROPERTY_REF_DATA[backendName];
      var propertyRef = _states.getState(stateName);
      accessorList.forEach(function(key) {
        propertyRef = propertyRef[key];
      });

      return angular.copy(propertyRef);
    };

    var saveStateProperty = function(stateName, backendName, newValue) {
      var oldValue = getStatePropertyMemento(stateName, backendName);
      var newBackendValue = angular.copy(newValue);
      var oldBackendValue = angular.copy(oldValue);

      if (BACKEND_CONVERSIONS.hasOwnProperty(backendName)) {
        newBackendValue = convertToBackendRepresentation(newValue, backendName);
        oldBackendValue = convertToBackendRepresentation(oldValue, backendName);
      }

      if (!angular.equals(oldValue, newValue)) {
        changeListService.editStateProperty(
          stateName, backendName, newBackendValue, oldBackendValue);

        var newStateData = _states.getState(stateName);
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

    var convertToBackendRepresentation = function(frontendValue, backendName) {
      var conversionFunction = BACKEND_CONVERSIONS[backendName];
      return conversionFunction(frontendValue);
    };

    // TODO(sll): Add unit tests for all get/save methods.
    return {
      init: function(statesBackendDict) {
        _states = StatesObjectFactory.createFromBackendDict(statesBackendDict);
        // Initialize the solutionValidityService.
        SolutionValidityService.init(_states.getStateNames());
        _states.getStateNames().forEach(function(stateName) {
          var solution = _states.getState(stateName).interaction.solution;
          if (solution) {
            var result = (
              AnswerClassificationService.getMatchingClassificationResult(
                ExplorationContextService.getExplorationId(),
              stateName,
              _states.getState(stateName),
              solution.correctAnswer,
              $injector.get(
                AngularNameService.getNameOfInteractionRulesService(
                  _states.getState(stateName).interaction.id))));
            var solutionIsValid = stateName !== result.outcome.dest;
            SolutionValidityService.updateValidity(
              stateName, solutionIsValid);
          }
        });
      },
      getStates: function() {
        return angular.copy(_states);
      },
      getStateNames: function() {
        return _states.getStateNames();
      },
      hasState: function(stateName) {
        return _states.hasState(stateName);
      },
      getState: function(stateName) {
        return angular.copy(_states.getState(stateName));
      },
      setState: function(stateName, stateData) {
        _setState(stateName, stateData, true);
      },
      isNewStateNameValid: function(newStateName, showWarnings) {
        if (_states.hasState(newStateName)) {
          if (showWarnings) {
            AlertsService.addWarning('A state with this name already exists.');
          }
          return false;
        }
        return (
          ValidatorsService.isValidStateName(newStateName, showWarnings));
      },
      isSolutionValid: function(stateName) {
        return SolutionValidityService.isSolutionValid(stateName);
      },
      updateSolutionValidity: function(stateName, solutionIsValid) {
        SolutionValidityService.updateValidity(stateName, solutionIsValid);
      },
      deleteSolutionValidity: function(stateName) {
        SolutionValidityService.deleteSolutionValidity(stateName);
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
      getHintsMemento: function(stateName) {
        return getStatePropertyMemento(stateName, 'hints')
      },
      saveHints: function(stateName, newHints) {
        saveStateProperty(stateName, 'hints', newHints);
      },
      getSolutionMemento: function(stateName) {
        return getStatePropertyMemento(stateName, 'solution');
      },
      saveSolution: function(stateName, newSolution) {
        saveStateProperty(stateName, 'solution', newSolution);
      },
      isInitialized: function() {
        return _states != null;
      },
      addState: function(newStateName, successCallback) {
        newStateName = $filter('normalizeWhitespace')(newStateName);
        if (!ValidatorsService.isValidStateName(newStateName, true)) {
          return;
        }
        if (_states.hasState(newStateName)) {
          AlertsService.addWarning('A state with this name already exists.');
          return;
        }
        AlertsService.clearWarnings();

        _states.addState(newStateName);

        changeListService.addState(newStateName);
        $rootScope.$broadcast('refreshGraph');
        if (successCallback) {
          successCallback(newStateName);
        }
      },
      deleteState: function(deleteStateName) {
        AlertsService.clearWarnings();

        var initStateName = explorationInitStateNameService.displayed;
        if (deleteStateName === initStateName) {
          return;
        }
        if (!_states.hasState(deleteStateName)) {
          AlertsService.addWarning(
            'No state with name ' + deleteStateName + ' exists.');
          return;
        }

        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration_editor/editor_tab/' +
            'confirm_delete_state_modal_directive.html'),
          backdrop: true,
          resolve: {
            deleteStateName: function() {
              return deleteStateName;
            }
          },
          controller: [
            '$scope', '$uibModalInstance', 'deleteStateName',
            function($scope, $uibModalInstance, deleteStateName) {
              $scope.deleteStateWarningText = (
                'Are you sure you want to delete the card "' +
                deleteStateName + '"?');

              $scope.reallyDelete = function() {
                $uibModalInstance.close(deleteStateName);
              };

              $scope.cancel = function() {
                $uibModalInstance.dismiss('cancel');
                AlertsService.clearWarnings();
              };
            }
          ]
        }).result.then(function(deleteStateName) {
          _states.deleteState(deleteStateName);

          changeListService.deleteState(deleteStateName);

          if (EditorStateService.getActiveStateName() === deleteStateName) {
            EditorStateService.setActiveStateName(
              explorationInitStateNameService.savedMemento);
          }

          $location.path('/gui/' + EditorStateService.getActiveStateName());
          $rootScope.$broadcast('refreshGraph');
          // This ensures that if the deletion changes rules in the current
          // state, they get updated in the view.
          $rootScope.$broadcast('refreshStateEditor');
        });
      },
      renameState: function(oldStateName, newStateName) {
        newStateName = $filter('normalizeWhitespace')(newStateName);
        if (!ValidatorsService.isValidStateName(newStateName, true)) {
          return;
        }
        if (_states.hasState(newStateName)) {
          AlertsService.addWarning('A state with this name already exists.');
          return;
        }
        AlertsService.clearWarnings();

        _states.renameState(oldStateName, newStateName);

        EditorStateService.setActiveStateName(newStateName);
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
      }
    };
  }
]);

oppia.factory('statePropertyService', [
  '$log', 'changeListService', 'AlertsService', 'explorationStatesService',
  function($log, changeListService, AlertsService, explorationStatesService) {
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
      _isValid: function(value) {
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

        AlertsService.clearWarnings();

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

// A data service that stores the current state content.
// TODO(sll): Add validation.
oppia.factory('stateContentService', [
  'statePropertyService', function(statePropertyService) {
    var child = Object.create(statePropertyService);
    child.setterMethodKey = 'saveStateContent';
    return child;
  }
]);

// A data service that stores the current list of state parameter changes.
// TODO(sll): Add validation.
oppia.factory('stateParamChangesService', [
  'statePropertyService', function(statePropertyService) {
    var child = Object.create(statePropertyService);
    child.setterMethodKey = 'saveStateParamChanges';
    return child;
  }
]);

// A data service that stores the current interaction id.
// TODO(sll): Add validation.
oppia.factory('stateInteractionIdService', [
  'statePropertyService', function(statePropertyService) {
    var child = Object.create(statePropertyService);
    child.setterMethodKey = 'saveInteractionId';
    return child;
  }
]);

// A data service that stores the current state customization args for the
// interaction. This is a dict mapping customization arg names to dicts of the
// form {value: customization_arg_value}.
// TODO(sll): Add validation.
oppia.factory('stateCustomizationArgsService', [
  'statePropertyService', function(statePropertyService) {
    var child = Object.create(statePropertyService);
    child.setterMethodKey = 'saveInteractionCustomizationArgs';
    return child;
  }
]);

// A data service that stores the current interaction hints.
oppia.factory('stateHintsService', [
  'statePropertyService', function(statePropertyService) {
    var child = Object.create(statePropertyService);
    child.setterMethodKey = 'saveHints';
    return child;
  }
]);

// A data service that stores the current interaction solution.
oppia.factory('stateSolutionService', [
  'statePropertyService', function(statePropertyService) {
    var child = Object.create(statePropertyService);
    child.setterMethodKey = 'saveSolution';
    return child;
  }
]);

// Service for computing graph data.
oppia.factory('graphDataService', [
  'explorationStatesService', 'explorationInitStateNameService',
  'ComputeGraphService',
  function(
      explorationStatesService, explorationInitStateNameService,
      ComputeGraphService) {
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
      _graphData = ComputeGraphService.compute(initStateId, states);
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
    'There\'s no way to complete the exploration starting from this card.'),
  INCORRECT_SOLUTION: (
    'The current solution does not lead to another card.')
});

// Service for displaying different types of modals depending on the type of
// response received as a result of the autosaving request.
oppia.factory('autosaveInfoModalsService', [
  '$log', '$uibModal', '$timeout', '$window',
  'ExplorationDataService', 'LocalStorageService', 
  'ChangesInHumanReadableFormService', 'UrlInterpolationService',
  function(
      $log, $uibModal, $timeout, $window,
      ExplorationDataService, LocalStorageService, 
      ChangesInHumanReadableFormService, UrlInterpolationService) {
    var _isModalOpen = false;
    var _refreshPage = function(delay) {
      $timeout(function() {
        $window.location.reload();
      }, delay);
    };

    return {
      showNonStrictValidationFailModal: function() {
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration_editor/' +
            'save_validation_fail_modal_directive.html'),
          // Prevent modal from closing when the user clicks outside it.
          backdrop: 'static',
          controller: [
            '$scope', '$uibModalInstance', function($scope, $uibModalInstance) {
              $scope.closeAndRefresh = function() {
                $uibModalInstance.dismiss('cancel');
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
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration_editor/' +
            'save_version_mismatch_modal_directive.html'),
          // Prevent modal from closing when the user clicks outside it.
          backdrop: 'static',
          controller: ['$scope', function($scope) {
            // When the user clicks on discard changes button, signal backend
            // to discard the draft and reload the page thereafter.
            $scope.discardChanges = function() {
              ExplorationDataService.discardDraft(function() {
                _refreshPage(20);
              });
            };

            $scope.hasLostChanges = (lostChanges && lostChanges.length > 0);
            if ($scope.hasLostChanges) {
              // TODO(sll): This should also include changes to exploration
              // properties (such as the exploration title, category, etc.).
              $scope.lostChangesHtml = (
                ChangesInHumanReadableFormService.makeHumanReadable(
                  lostChanges).html());
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
      },
      showLostChangesModal: function(lostChanges, explorationId) {
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration_editor/lost_changes_modal_directive.html'),
          // Prevent modal from closing when the user clicks outside it.
          backdrop: 'static',
          controller: ['$scope', '$uibModalInstance', function(
            $scope, $uibModalInstance) {
            // When the user clicks on discard changes button, signal backend
            // to discard the draft and reload the page thereafter.
            $scope.close = function() {
              LocalStorageService.removeExplorationDraft(explorationId);
              $uibModalInstance.dismiss('cancel');
            };

            $scope.lostChangesHtml = (
              ChangesInHumanReadableFormService.makeHumanReadable(
                lostChanges).html());
            $log.error('Lost changes: ' + JSON.stringify(lostChanges));
          }],
          windowClass: 'oppia-lost-changes-modal'
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
