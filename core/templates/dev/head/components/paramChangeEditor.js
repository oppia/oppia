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
 * @fileoverview Directives for the parameter change editor.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.directive('paramChangeEditor', ['warningsData', 'explorationParamSpecsService',
    function(warningsData, explorationParamSpecsService) {
  // Directive that implements an editor for specifying parameter changes.
  return {
    restrict: 'E',
    scope: {
      paramChanges: '=',
      saveParamChanges: '=',
      isEditable: '='
    },
    templateUrl: 'inline/param_change_editor',
    controller: ['$scope', '$attrs', function($scope, $attrs) {
      $scope.getObjTypeForParam = function(paramName) {
        if (explorationParamSpecsService.savedMemento.hasOwnProperty(paramName)) {
          return explorationParamSpecsService.savedMemento[paramName].obj_type;
        } else {
          return '';
        }
      };

      $scope.INVALID_PARAMETER_NAMES = GLOBALS.INVALID_PARAMETER_NAMES;

      $scope.DEFAULT_CUSTOMIZATION_ARGS = {
        'Copier': {
          value: '',
          parse_with_jinja: true
        },
        'RandomSelector': {
          list_of_values: []
        }
      };

      var DEFAULT_TMP_PARAM_CHANGE = {
        name: '',
        generator_id: 'Copier',
        customization_args: $scope.DEFAULT_CUSTOMIZATION_ARGS['Copier']
      };

      // The 0-based index of the parameter change item that is currently active for
      // editing, or -1 if no item is active.
      $scope.activeItem = -1;

      $scope.ALLOWED_KEYS = {
        'Copier': ['value', 'parse_with_jinja'],
        'RandomSelector': ['list_of_values'],
      };
      $scope.PREAMBLE_TEXT = {
        'Copier': 'should be changed to',
        'RandomSelector': 'should be one of'
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

      $scope.resetEditor = function() {
        $scope.activeItem = -1;
        $scope.tmpParamChange = angular.copy(DEFAULT_TMP_PARAM_CHANGE);
        // This should only be non-null when an editing view is active.
        $scope.paramChangesMemento = null;
      };

      $scope.resetEditor();

      // Choices for the select2 dropdown that displays parameter name options.
      $scope.paramNameChoices = [];
      $scope.resetParamNameChoices = function() {
        // Initialize dropdown options for the parameter name selector.
        $scope.paramNameChoices = Object.keys(
          explorationParamSpecsService.savedMemento
        ).sort().map(function(paramName) {
          return {
            id: paramName,
            text: paramName
          }
        });
      };

      $scope.$on('externalSave', function() {
        if ($scope.paramChangesMemento !== null) {
          // An edit view is active.
          $scope.commitParamChange($scope.activeItem);
          if ($scope.paramChangesMemento !== null) {
            // The save failed. Discard the change.
            $scope.resetEditor();
          }
        }
      });

      // Called when an 'add param change' action is triggered.
      $scope.startAddParamChange = function() {
        $scope.resetParamNameChoices();
        $scope.paramChangesMemento = angular.copy($scope.paramChanges);
        $scope.activeItem = $scope.paramChanges.length;
        $scope.paramChanges.push(angular.copy(DEFAULT_TMP_PARAM_CHANGE));
      };

      // Returns a new customization args object that has been stripped of
      // unwanted keys.
      $scope.getCleanCustomizationArgs = function(generatorId, customizationArgs) {
        var newCustomizationArgs = angular.copy(customizationArgs);
        var customizationArgsKeys = [];
        for (var key in newCustomizationArgs) {
          if (newCustomizationArgs.hasOwnProperty(key)) {
            customizationArgsKeys.push(key);
          }
        }
        for (var j = 0; j < customizationArgsKeys.length; j++) {
          if ($scope.ALLOWED_KEYS[generatorId].indexOf(customizationArgsKeys[j]) === -1) {
            delete newCustomizationArgs[customizationArgsKeys[j]];
          }
        }
        return newCustomizationArgs;
      };

      $scope.startEditParamChange = function(index) {
        $scope.resetParamNameChoices();

        $scope.paramChangesMemento = angular.copy($scope.paramChanges);

        var param = $scope.paramChanges[index];
        $scope.activeItem = index;

        var newCustomizationArgs = $scope.getCleanCustomizationArgs(
          param.generator_id, param.customization_args);

        $scope.tmpParamChange = {
          name: param.name,
          generator_id: param.generator_id,
          customization_args: newCustomizationArgs
        };
      };

      $scope.commitParamChange = function(index) {
        if ($scope.tmpParamChange.name === '') {
          // This reverses a temporary parameter change addition that has not
          // been edited.
          $scope.deleteParamChange(index);
          return;
        }
        if ($scope.INVALID_PARAMETER_NAMES.indexOf($scope.tmpParamChange.name) !== -1) {
          warningsData.addWarning(
            'The parameter name ' + $scope.tmpParamChange.name +
            ' is reserved. Please choose another.');
          return;
        }

        var VALID_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
        for (var i = 0; i < $scope.tmpParamChange.name.length; i++) {
          if (VALID_CHARS.indexOf($scope.tmpParamChange.name[i]) === -1) {
            warningsData.addWarning(
                'Invalid parameter name. Only parameter names consisting ' +
                'of digits and lowercase/uppercase letters are accepted.');
            return;
          }
        }

        var name = $scope.tmpParamChange.name;
        var generator_id = $scope.tmpParamChange.generator_id;
        var customization_args = $scope.getCleanCustomizationArgs(
            generator_id, $scope.tmpParamChange.customization_args);

        // If the name is new, add the parameter to the exploration parameter
        // list.
        if (!explorationParamSpecsService.savedMemento.hasOwnProperty(name)) {
          explorationParamSpecsService.displayed[name] = {obj_type: 'UnicodeString'};
          explorationParamSpecsService.saveDisplayedValue();
        }

        $scope.paramChanges[index] = {
          'name': name,
          'generator_id': generator_id,
          'customization_args': customization_args
        };
        $scope.saveParamChanges(
          $scope.paramChanges, angular.copy($scope.paramChangesMemento));

        $scope.resetEditor();
      };

      $scope.deleteParamChange = function(index) {
        if (index < 0 || index >= $scope.paramChanges.length) {
          warningsData.addWarning(
            'Cannot delete parameter change at position ' + index +
            ': index out of range');
        }
        if ($scope.paramChangesMemento === null) {
          $scope.paramChangesMemento = angular.copy($scope.paramChanges);
        }
        $scope.paramChanges.splice(index, 1);
        $scope.saveParamChanges(
          $scope.paramChanges, angular.copy($scope.paramChangesMemento));
        $scope.resetEditor();
      };

      $scope.swapParamChanges = function(index1, index2) {
        if (index1 < 0 || index1 >= $scope.paramChanges.length ||
            index2 < 0 || index2 >= $scope.paramChanges.length) {
          warningsData.addWarning(
            'Cannot swap parameter changes at positions ' + index1 +
            ' and ' + index2 + ': index out of range');
        }

        if (index1 === index2) {
          return;
        }

        $scope.paramChangesMemento = angular.copy($scope.paramChanges);
        var tmpChange = angular.copy($scope.paramChanges[index1]);
        $scope.paramChanges[index1] = $scope.paramChanges[index2];
        $scope.paramChanges[index2] = tmpChange;
        $scope.saveParamChanges(
            $scope.paramChanges, angular.copy($scope.paramChangesMemento));
        $scope.resetEditor();
      }
    }]
  };
}]);
