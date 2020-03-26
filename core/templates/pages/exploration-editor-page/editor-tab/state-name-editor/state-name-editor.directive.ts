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
 * @fileoverview Directive for the state name editor section of the state
 * editor.
 */

require('domain/utilities/url-interpolation.service.ts');
require('filters/string-utility-filters/normalize-whitespace.filter.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require('pages/exploration-editor-page/services/router.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-name.service.ts');
require('services/editability.service.ts');
require('services/stateful/focus-manager.service.ts');

angular.module('oppia').directive('stateNameEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      link: function(scope, element) {
        // This allows the scope to be retrievable during Karma unit testing.
        // See http://stackoverflow.com/a/29833832 for more details.
        element[0].getControllerScope = function() {
          return scope;
        };
      },
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration-editor-page/editor-tab/state-name-editor/' +
        'state-name-editor.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$filter', '$rootScope', 'EditabilityService',
        'StateEditorService', 'StateNameService', 'FocusManagerService',
        'ExplorationStatesService', 'RouterService',
        function(
            $scope, $filter, $rootScope, EditabilityService,
            StateEditorService, StateNameService, FocusManagerService,
            ExplorationStatesService, RouterService) {
          var ctrl = this;

          ctrl.initStateNameEditor = function() {
            StateNameService.init();
          };

          ctrl.openStateNameEditor = function() {
            var stateName = StateEditorService.getActiveStateName();
            StateNameService.setStateNameEditorVisibility(true);
            StateNameService.setStateNameSavedMemento(stateName);
            ctrl.tmpStateName = stateName;
            FocusManagerService.setFocus('stateNameEditorOpened');
          };

          ctrl.saveStateName = function(newStateName) {
            var normalizedNewName =
              ctrl._getNormalizedStateName(newStateName);
            var savedMemento = StateNameService.getStateNameSavedMemento();
            if (!_isNewStateNameValid(normalizedNewName)) {
              return false;
            }

            if (savedMemento === normalizedNewName) {
              StateNameService.setStateNameEditorVisibility(false);
              return false;
            } else {
              ExplorationStatesService.renameState(
                StateEditorService.getActiveStateName(), normalizedNewName);
              StateNameService.setStateNameEditorVisibility(false);
              // Save the contents of other open fields.
              $rootScope.$broadcast('externalSave');
              ctrl.initStateNameEditor();
              return true;
            }
          };

          ctrl._getNormalizedStateName = function(newStateName) {
            return $filter('normalizeWhitespace')(newStateName);
          };

          var _isNewStateNameValid = function(stateName) {
            if (stateName === StateEditorService.getActiveStateName()) {
              return true;
            }
            return ExplorationStatesService.isNewStateNameValid(
              stateName, true);
          };

          ctrl.saveStateNameAndRefresh = function(newStateName) {
            var normalizedStateName =
              ctrl._getNormalizedStateName(newStateName);
            var valid = ctrl.saveStateName(normalizedStateName);
            if (valid) {
              RouterService.navigateToMainTab(normalizedStateName);
            }
          };
          ctrl.$onInit = function() {
            $scope.$on('externalSave', function() {
              if (StateNameService.isStateNameEditorShown()) {
                ctrl.saveStateName(ctrl.tmpStateName);
              }
            });
            StateNameService.init();
            ctrl.EditabilityService = EditabilityService;
            ctrl.StateEditorService = StateEditorService;
            ctrl.StateNameService = StateNameService;
            ctrl.stateNameEditorIsShown = false;
          };
        }
      ]
    };
  }]);
