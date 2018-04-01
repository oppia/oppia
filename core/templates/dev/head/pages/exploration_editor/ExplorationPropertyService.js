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
 * @fileoverview Services for storing exploration properties for
 * displaying and editing them in multiple places in the UI,
 * with base class as ExplorationPropertyService.
 */

oppia.factory('ExplorationPropertyService', [
  '$rootScope', '$log', 'ChangeListService', 'AlertsService',
  function($rootScope, $log, ChangeListService, AlertsService) {
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
    };

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

        ChangeListService.editExplorationProperty(
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
oppia.factory('ExplorationTitleService', [
  'ExplorationPropertyService', '$filter', 'ValidatorsService',
  'ExplorationRightsService',
  function(
      ExplorationPropertyService, $filter, ValidatorsService,
      ExplorationRightsService) {
    var child = Object.create(ExplorationPropertyService);
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
oppia.factory('ExplorationCategoryService', [
  'ExplorationPropertyService', '$filter', 'ValidatorsService',
  'ExplorationRightsService',
  function(
      ExplorationPropertyService, $filter, ValidatorsService,
      ExplorationRightsService) {
    var child = Object.create(ExplorationPropertyService);
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
oppia.factory('ExplorationObjectiveService', [
  'ExplorationPropertyService', '$filter', 'ValidatorsService',
  'ExplorationRightsService',
  function(
      ExplorationPropertyService, $filter, ValidatorsService,
      ExplorationRightsService) {
    var child = Object.create(ExplorationPropertyService);
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
oppia.factory('ExplorationLanguageCodeService', [
  'ExplorationPropertyService', function(ExplorationPropertyService) {
    var child = Object.create(ExplorationPropertyService);
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
oppia.factory('ExplorationInitStateNameService', [
  'ExplorationPropertyService', function(ExplorationPropertyService) {
    var child = Object.create(ExplorationPropertyService);
    child.propertyName = 'init_state_name';
    return child;
  }
]);

// A data service that stores tags for the exploration.
oppia.factory('ExplorationTagsService', [
  'ExplorationPropertyService',
  function(ExplorationPropertyService) {
    var child = Object.create(ExplorationPropertyService);
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

oppia.factory('ExplorationParamSpecsService', [
  'ExplorationPropertyService', function(ExplorationPropertyService) {
    var child = Object.create(ExplorationPropertyService);
    child.propertyName = 'param_specs';
    return child;
  }
]);

oppia.factory('ExplorationParamChangesService', [
  'ExplorationPropertyService', function(ExplorationPropertyService) {
    var child = Object.create(ExplorationPropertyService);
    child.propertyName = 'param_changes';
    return child;
  }
]);

oppia.factory('ExplorationAutomaticTextToSpeechService', [
  'ExplorationPropertyService', function(ExplorationPropertyService) {
    var child = Object.create(ExplorationPropertyService);
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

oppia.factory('ExplorationCorrectnessFeedbackService', [
  'ExplorationPropertyService', function(ExplorationPropertyService) {
    var child = Object.create(ExplorationPropertyService);
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
oppia.factory('ExplorationStatesService', [
  '$log', '$uibModal', '$filter', '$location', '$rootScope', '$injector', '$q',
  'ExplorationInitStateNameService', 'AlertsService', 'ChangeListService',
  'EditorStateService', 'ValidatorsService', 'StatesObjectFactory',
  'SolutionValidityService', 'AngularNameService',
  'AnswerClassificationService', 'ExplorationContextService',
  'UrlInterpolationService',
  function(
      $log, $uibModal, $filter, $location, $rootScope, $injector, $q,
      ExplorationInitStateNameService, AlertsService, ChangeListService,
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
        return content.toBackendDict();
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
        ChangeListService.editStateProperty(
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
        return getStatePropertyMemento(stateName, 'hints');
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
        return _states !== null;
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

        ChangeListService.addState(newStateName);
        $rootScope.$broadcast('refreshGraph');
        if (successCallback) {
          successCallback(newStateName);
        }
      },
      deleteState: function(deleteStateName) {
        AlertsService.clearWarnings();

        var initStateName = ExplorationInitStateNameService.displayed;
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

          ChangeListService.deleteState(deleteStateName);

          if (EditorStateService.getActiveStateName() === deleteStateName) {
            EditorStateService.setActiveStateName(
              ExplorationInitStateNameService.savedMemento);
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
        ChangeListService.renameState(newStateName, oldStateName);
        // Amend initStateName appropriately, if necessary. Note that this
        // must come after the state renaming, otherwise saving will lead to
        // a complaint that the new name is not a valid state name.
        if (ExplorationInitStateNameService.displayed === oldStateName) {
          ExplorationInitStateNameService.displayed = newStateName;
          ExplorationInitStateNameService.saveDisplayedValue(newStateName);
        }
        $rootScope.$broadcast('refreshGraph');
      }
    };
  }
]);
