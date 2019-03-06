// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the parameter changes editor (which is shown in
 * both the exploration settings tab and the state editor page).
 */

oppia.directive('paramChangesEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        paramChangesService: '=',
        postSaveHook: '=',
        isCurrentlyInSettingsTab: '&currentlyInSettingsTab'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/' +
        'param_changes_editor_directive.html'),
      controller: [
        '$scope', '$rootScope', 'EditabilityService', 'StateEditorService',
        'ExplorationParamSpecsService', 'AlertsService',
        'ParamChangeObjectFactory', 'ExplorationStatesService',
        function(
            $scope, $rootScope, EditabilityService, StateEditorService,
            ExplorationParamSpecsService, AlertsService,
            ParamChangeObjectFactory, ExplorationStatesService) {
          $scope.EditabilityService = EditabilityService;
          $scope.isParamChangesEditorOpen = false;
          $scope.warningText = '';
          $scope.PREAMBLE_TEXT = {
            Copier: 'to',
            RandomSelector: 'to one of'
          };

          var INVALID_PARAMETER_NAMES = GLOBALS.INVALID_PARAMETER_NAMES;

          $scope.$on('externalSave', function() {
            if ($scope.isParamChangesEditorOpen) {
              $scope.saveParamChanges();
            }
          });

          var generateParamNameChoices = function() {
            return ExplorationParamSpecsService.displayed.getParamNames().sort()
              .map(function(paramName) {
                return {
                  id: paramName,
                  text: paramName
                };
              });
          };

          // This is a local variable that is used by the select2 dropdowns for
          // choosing parameter names. It may not accurately reflect the content
          // of ExplorationParamSpecsService, since it's possible that temporary
          // parameter names may be added and then deleted within the course
          // of a single "parameter changes" edit.
          $scope.paramNameChoices = [];

          $scope.addParamChange = function() {
            var newParamName = (
              $scope.paramNameChoices.length > 0 ?
                $scope.paramNameChoices[0].id : 'x');
            var newParamChange = ParamChangeObjectFactory.createDefault(
              newParamName);
            // Add the new param name to $scope.paramNameChoices, if necessary,
            // so that it shows up in the dropdown.
            if (ExplorationParamSpecsService.displayed.addParamIfNew(
              newParamChange.name)) {
              $scope.paramNameChoices = generateParamNameChoices();
            }
            $scope.paramChangesService.displayed.push(newParamChange);
          };

          $scope.openParamChangesEditor = function() {
            if (!EditabilityService.isEditable()) {
              return;
            }

            $scope.isParamChangesEditorOpen = true;
            $scope.paramNameChoices = generateParamNameChoices();

            if ($scope.paramChangesService.displayed.length === 0) {
              $scope.addParamChange();
            }
          };

          $scope.onChangeGeneratorType = function(paramChange) {
            paramChange.resetCustomizationArgs();
          };

          $scope.HUMAN_READABLE_ARGS_RENDERERS = {
            Copier: function(customizationArgs) {
              return 'to ' + customizationArgs.value;
            },
            RandomSelector: function(customizationArgs) {
              var result = 'to one of [';
              for (
                var i = 0; i < customizationArgs.list_of_values.length; i++) {
                if (i !== 0) {
                  result += ', ';
                }
                result += String(customizationArgs.list_of_values[i]);
              }
              result += '] at random';
              return result;
            }
          };

          $scope.areDisplayedParamChangesValid = function() {
            var paramChanges = $scope.paramChangesService.displayed;

            for (var i = 0; i < paramChanges.length; i++) {
              var paramName = paramChanges[i].name;
              if (paramName === '') {
                $scope.warningText = 'Please pick a non-empty parameter name.';
                return false;
              }

              if (INVALID_PARAMETER_NAMES.indexOf(paramName) !== -1) {
                $scope.warningText = (
                  'The parameter name \'' + paramName + '\' is reserved.');
                return false;
              }

              var ALPHA_CHARS_REGEX = /^[A-Za-z]+$/;
              if (!ALPHA_CHARS_REGEX.test(paramName)) {
                $scope.warningText = (
                  'Parameter names should use only alphabetic characters.');
                return false;
              }

              var generatorId = paramChanges[i].generatorId;
              var customizationArgs = paramChanges[i].customizationArgs;

              if (!$scope.PREAMBLE_TEXT.hasOwnProperty(generatorId)) {
                $scope.warningText =
                 'Each parameter should have a generator id.';
                return false;
              }

              if (generatorId === 'RandomSelector' &&
                  customizationArgs.list_of_values.length === 0) {
                $scope.warningText = (
                  'Each parameter should have at least one possible value.');
                return false;
              }
            }

            $scope.warningText = '';
            return true;
          };

          $scope.saveParamChanges = function() {
            // Validate displayed value.
            if (!$scope.areDisplayedParamChangesValid()) {
              AlertsService.addWarning('Invalid parameter changes.');
              return;
            }

            $scope.isParamChangesEditorOpen = false;

            // Update paramSpecs manually with newly-added param names.
            ExplorationParamSpecsService.restoreFromMemento();
            $scope.paramChangesService.displayed.forEach(function(paramChange) {
              ExplorationParamSpecsService.displayed.addParamIfNew(
                paramChange.name);
            });

            ExplorationParamSpecsService.saveDisplayedValue();
            $scope.paramChangesService.saveDisplayedValue();
            if (!$scope.isCurrentlyInSettingsTab()) {
              ExplorationStatesService.saveStateParamChanges(
                $scope.paramChangesService.stateName,
                angular.copy($scope.paramChangesService.displayed));
            }
            if ($scope.postSaveHook) {
              $scope.postSaveHook();
            }
          };

          $scope.deleteParamChange = function(index) {
            if (index < 0 ||
                index >= $scope.paramChangesService.displayed.length) {
              AlertsService.addWarning(
                'Cannot delete parameter change at position ' + index +
                ': index out of range');
            }

            // This ensures that any new parameter names that have been added
            // before the deletion are added to the list of possible names in
            // the select2 dropdowns. Otherwise, after the deletion, the
            // dropdowns may turn blank.
            $scope.paramChangesService.displayed.forEach(function(paramChange) {
              ExplorationParamSpecsService.displayed.addParamIfNew(
                paramChange.name);
            });
            $scope.paramNameChoices = generateParamNameChoices();

            $scope.paramChangesService.displayed.splice(index, 1);
          };

          $scope.PARAM_CHANGE_LIST_SORTABLE_OPTIONS = {
            axis: 'y',
            containment: '.oppia-param-change-draggable-area',
            cursor: 'move',
            handle: '.oppia-param-change-sort-handle',
            items: '.oppia-param-editor-row',
            tolerance: 'pointer',
            start: function(e, ui) {
              $scope.$apply();
              ui.placeholder.height(ui.item.height());
            },
            stop: function() {
              // This ensures that any new parameter names that have been added
              // before the swap are added to the list of possible names in the
              // select2 dropdowns. Otherwise, after the swap, the dropdowns may
              // turn blank.
              $scope.paramChangesService.displayed.forEach(
                function(paramChange) {
                  ExplorationParamSpecsService.displayed.addParamIfNew(
                    paramChange.name);
                }
              );
              $scope.paramNameChoices = generateParamNameChoices();
              $scope.$apply();
            }
          };

          $scope.cancelEdit = function() {
            $scope.paramChangesService.restoreFromMemento();
            $scope.isParamChangesEditorOpen = false;
          };

          $scope.dragDotsImgUrl = UrlInterpolationService.getStaticImageUrl(
            '/general/drag_dots.png');
        }
      ]
    };
  }]);
