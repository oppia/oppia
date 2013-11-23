// Copyright 2012 Google Inc. All Rights Reserved.
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

oppia.directive('paramChangeEditor', function($compile, $http, warningsData) {
  // Directive that implements an editor for specifying parameter changes.
  return {
    restrict: 'E',
    scope: {paramChanges: '=', paramSpecs: '=', saveParamChanges: '=', addExplorationParamSpec: '='},
    templateUrl: 'inline/param_change_editor',
    controller: function($scope, $attrs) {
      $scope._inArray = function(array, value) {
        for (var i = 0; i < array.length; i++) {
          if (array[i] == value) {
            return true;
          }
        }
        return false;
      };

      $scope.getObjTypeForParam = function(paramName) {
        if ($scope.paramSpecs && paramName in $scope.paramSpecs) {
          return $scope.paramSpecs[paramName].obj_type;
        }
        return '';
      };

      var DEFAULT_TMP_PARAM_CHANGE = {
        name: '[New parameter]',
        generator_id: 'Copier',
        customization_args: {
          value: '[New parameter value]',
          parse_with_jinja: false
        }
      };

      // The 0-based index of the parameter change item that is currently active for
      // editing, or -1 if no item is active.
      $scope.activeItem = -1;
      // Choices for the select2 dropdown that displays parameter name options.
      $scope.paramNameChoices = [];
      // TODO(sll): Move these lists (of value generators without init_args)
      // somewhere more global.
      $scope.ALLOWED_KEYS = {
        'Copier': ['value', 'parse_with_jinja'],
        'RandomSelector': ['list_of_values'],
      };
      $scope.PREAMBLE_TEXT = {
        'Copier': 'by setting it to',
        'RandomSelector': 'by picking, at random, one of'
      };
      $scope.HUMAN_READABLE_ARGS_RENDERERS = {
        'Copier': function(customization_args) {
          return 'to ' + customization_args.value + (
              customization_args.parse_with_jinja ? ' (evaluating parameters)' : ''
          );
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

      // Reset the parameter change editor.
      $scope.resetEditor = function() {
        $scope.activeItem = -1;
        $scope.tmpParamChange = angular.copy(DEFAULT_TMP_PARAM_CHANGE);
        // This should only be non-null when an editing view is active.
        $scope.paramChangesMemento = null;

        // Initialize dropdown options for the parameter name selector.
        var namedata = [];
        if ($scope.paramSpecs) {
          for (var paramName in $scope.paramSpecs) {
            namedata.push(paramName);
          }
        }
        angular.extend($scope.paramNameChoices, namedata);
      };

      $scope.resetEditor();

      // Called when an 'add param change' action is triggered.
      $scope.startAddParamChange = function() {
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
          if (!$scope._inArray($scope.ALLOWED_KEYS[generatorId],
                              customizationArgsKeys[j])) {
            console.log(customizationArgsKeys[j]);
            delete newCustomizationArgs[customizationArgsKeys[j]];
          }
        }
        return newCustomizationArgs;
      };

      // Called when an 'edit param change' action is triggered.
      $scope.startEditParamChange = function(index) {
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
        if (!$scope.tmpParamChange.name) {
          warningsData.addWarning('Please specify a parameter name.');
          return;
        }
        if ($scope.tmpParamChange.name === '[New parameter]') {
          // This reverses a temporary parameter change addition that has not
          // been edited.
          $scope.deleteParamChange(index);
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

        $scope.$broadcast('externalSave');

        var name = $scope.tmpParamChange.name;
        var generator_id = $scope.tmpParamChange.generator_id;
        var customization_args = $scope.getCleanCustomizationArgs(
            generator_id, $scope.tmpParamChange.customization_args);
        var _updateAndSaveParamChangeList = function(
            index, name, generator_id, customization_args) {
          $scope.paramChanges[index] = {
            'name': name,
            'generator_id': generator_id,
            'customization_args': customization_args
          };
          $scope.saveParamChanges(
              $scope.paramChanges, angular.copy($scope.paramChangesMemento));
        };

        if (!$scope.getObjTypeForParam(name)) {
          // The name is new, so add the parameter to the exploration parameter
          // list.
          $scope.addExplorationParamSpec(
            name,
            'UnicodeString',
            _updateAndSaveParamChangeList.bind(
                undefined, index, name, generator_id, customization_args)
          );
        } else {
          _updateAndSaveParamChangeList(
              index, name, generator_id, customization_args);
        }

        $scope.resetEditor();
      };
    
      $scope.deleteParamChange = function(index) {
        $scope.paramChangesMemento = angular.copy($scope.paramChanges);
        $scope.paramChanges.splice(index, 1);
        $scope.saveParamChanges(
            $scope.paramChanges, angular.copy($scope.paramChangesMemento));
        $scope.resetEditor();
      };
    }
  };
});
