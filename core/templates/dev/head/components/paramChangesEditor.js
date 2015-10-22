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

oppia.directive('paramChangesEditor', [function() {
  return {
    restrict: 'E',
    scope: {
      paramChangesService: '=',
      postSaveHook: '='
    },
    templateUrl: 'editor/paramChanges',
    controller: [
        '$scope', 'editabilityService', 'explorationParamSpecsService', 'warningsData',
        function($scope, editabilityService, explorationParamSpecsService, warningsData) {

      $scope.editabilityService = editabilityService;
      $scope.isParamChangesEditorOpen = false;
      $scope.warningText = '';
      $scope.PREAMBLE_TEXT = {
        'Copier': 'to',
        'RandomSelector': 'to one of'
      };

      var _INVALID_PARAMETER_NAMES = GLOBALS.INVALID_PARAMETER_NAMES;
      var _DEFAULT_PARAM_SPEC = {
        obj_type: 'UnicodeString'
      };

      $scope.$on('externalSave', function() {
        if ($scope.isParamChangesEditorOpen) {
          $scope.saveParamChanges();
        }
      });

      var getDefaultParameterChange = function(name) {
        return angular.copy({
          name: name,
          customization_args: {
            value: '5',
            parse_with_jinja: true
          },
          generator_id: 'Copier'
        });
      };

      var _generateParamNameChoices = function() {
        return Object.keys(
          explorationParamSpecsService.displayed
        ).sort().map(function(paramName) {
          return {
            id: paramName,
            text: paramName
          }
        });
      };

      // This is a local variable that is used by the select2 dropdowns for
      // choosing parameter names. It may not accurately reflect the content of
      // explorationParamSpecsService, since it's possible that temporary parameter
      // names may be added and then deleted within the course of a single
      // "parameter changes" edit.
      $scope.paramNameChoices = [];

      $scope.addParamChange = function() {
        var newParamName = (
          $scope.paramNameChoices.length > 0 ? $scope.paramNameChoices[0].id : 'x');
        var newParamChange = getDefaultParameterChange(newParamName);

        // Add the new param name to $scope.paramNameChoices, if necessary, so
        // that it shows up in the dropdown.
        if (!$scope.paramNameChoices.hasOwnProperty(newParamChange.name)) {
          explorationParamSpecsService.displayed[newParamChange.name] = angular.copy(
            _DEFAULT_PARAM_SPEC);
          $scope.paramNameChoices = _generateParamNameChoices();
        };

        $scope.paramChangesService.displayed.push(newParamChange);
      };

      $scope.openParamChangesEditor = function() {
        if (!editabilityService.isEditable()) {
          return;
        }

        $scope.isParamChangesEditorOpen = true;
        $scope.paramNameChoices = _generateParamNameChoices();

        if ($scope.paramChangesService.displayed.length === 0) {
          $scope.addParamChange();
        }
      };

      $scope.HUMAN_READABLE_ARGS_RENDERERS = {
        'Copier': function(customization_args) {
          return 'to ' + customization_args.value;
        },
        'RandomSelector': function(customization_args) {
          var result = 'to one of [';
          for (var i = 0; i < customization_args.list_of_values.length; i++) {
            if (i !== 0) {
              result += ', ';
            }
            result += String(customization_args.list_of_values[i]);
          }
          result += '] at random';
          return result;
        }
      };

      $scope.areDisplayedParamChangesValid = function() {
        paramChanges = $scope.paramChangesService.displayed;

        for (var i = 0; i < paramChanges.length; i++) {
          var paramName = paramChanges[i].name;
          if (paramName === '') {
            $scope.warningText = 'Please pick a non-empty parameter name.';
            return false;
          }

          if (_INVALID_PARAMETER_NAMES.indexOf(paramName) !== -1) {
            $scope.warningText = 'The parameter name \'' + paramName + '\' is reserved.';
            return false;
          }

          var _ALPHA_CHARS_REGEX = /^[A-Za-z]+$/;
          if (!_ALPHA_CHARS_REGEX.test(paramName)) {
            $scope.warningText = 'Parameter names should use only alphabetic characters.';
            return false;
          }

          if (!$scope.PREAMBLE_TEXT.hasOwnProperty(paramChanges[i].generator_id)) {
            $scope.warningText = 'Each parameter should have a generator id.';
            return false;
          }

          if (paramChanges[i].generator_id === 'RandomSelector' &&
              paramChanges[i].customization_args.list_of_values.length === 0) {
            $scope.warningText = 'Each parameter should have at least one possible value.';
            return false;
          }
        }

        $scope.warningText = '';
        return true;
      };

      $scope.saveParamChanges = function() {
        // Validate displayed value.
        if (!$scope.areDisplayedParamChangesValid()) {
          warningsData.addWarning('Invalid parameter changes.');
          return;
        }

        $scope.isParamChangesEditorOpen = false;

        // Update paramSpecs manually with newly-added param names.
        explorationParamSpecsService.restoreFromMemento();
        for (var i = 0; i < $scope.paramChangesService.displayed.length; i++) {
          var paramName = $scope.paramChangesService.displayed[i].name;
          if (!explorationParamSpecsService.displayed.hasOwnProperty(name)) {
            explorationParamSpecsService.displayed[paramName] = angular.copy(
              _DEFAULT_PARAM_SPEC);
          }
        }

        explorationParamSpecsService.saveDisplayedValue();
        $scope.paramChangesService.saveDisplayedValue();
        $scope.postSaveHook();
      };

      $scope.swapParamChanges = function(index1, index2) {
        if (index1 < 0 || index1 >= $scope.paramChangesService.displayed.length ||
            index2 < 0 || index2 >= $scope.paramChangesService.displayed.length) {
          warningsData.addWarning(
            'Cannot swap parameter changes at positions ' + index1 +
            ' and ' + index2 + ': index out of range');
        }

        if (index1 === index2) {
          return;
        }

        var tmp = angular.copy($scope.paramChangesService.displayed[index1]);
        $scope.paramChangesService.displayed[index1] = (
          $scope.paramChangesService.displayed[index2]);
        $scope.paramChangesService.displayed[index2] = tmp;
      };

      $scope.deleteParamChange = function(index) {
        if (index < 0 || index >= $scope.paramChangesService.displayed.length) {
          warningsData.addWarning(
            'Cannot delete parameter change at position ' + index +
            ': index out of range');
        }

        $scope.paramChangesService.displayed.splice(index, 1);
      };

      $scope.cancelEdit = function() {
        $scope.paramChangesService.restoreFromMemento();
        $scope.isParamChangesEditorOpen = false;
      };
    }]
  };
}]);
