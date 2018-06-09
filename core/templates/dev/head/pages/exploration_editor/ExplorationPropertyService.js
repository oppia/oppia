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
