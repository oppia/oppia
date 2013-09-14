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
    templateUrl: '/templates/param_change_editor',
    controller: function($scope, $attrs) {

      // Sentinel value for indicating a 'temporary' new parameter change.
      $scope.NEW_PARAM_CHANGE_SENTINEL = 'New change';

      $scope.getCustomizationArgsAsString = function(customization_args) {
        var argStrings = [];
        for (var key in customization_args) {
          argStrings.push(key + ': ' + customization_args[key]);
        }

        return argStrings.join(', ');
      };

      var DEFAULT_TMP_PARAM_CHANGE = {
        generator_id: 'Copier',
        customization_args: {
          value: '[New parameter value]',
          parse_with_jinja: false
        },
        select2Name: {id: '[New parameter]', text: '[New parameter]'}
      };

      // Reset and/or initialize variables for parameter change input.
      $scope.resetParamChangeInput = function() {
        $scope.activeItem = -1;
        $scope.tmpParamChange = angular.copy(DEFAULT_TMP_PARAM_CHANGE);
      };

      $scope.resetParamChangeInput();

      $scope.getObjTypeForParam = function(paramName) {
        if ($scope.paramSpecs && paramName in $scope.paramSpecs) {
          return $scope.paramSpecs[paramName].obj_type;
        }

        return '';
      };

      // Controller for the box displaying parameter name options.
      $scope.paramSelector = {
        createSearchChoice: function(term, data) {
          if ($(data).filter(function() {
            return this.text.localeCompare(term) === 0;
          }).length===0) {
            return {id: 'new', text: term};
          }
        },
        data: [],
        formatNoMatches: function(term) {
          return '(choose a parameter name)';
        }
      };

      // Initializes dropdown options for the parameter name selector. The
      // select2 library expects the options to have 'id' and 'text' fields.
      $scope.initSelectorOptions = function() {
        var namedata = [];
        if ($scope.paramSpecs) {
          for (var paramName in $scope.paramSpecs) {
            namedata.push({id: paramName, text: paramName});
          }
        }
        angular.extend($scope.paramSelector.data, namedata);
      };

      // Called when an 'add param change' action is triggered.
      $scope.startAddParamChange = function() {
        $scope.activeItem = $scope.NEW_PARAM_CHANGE_SENTINEL;
        $scope.initSelectorOptions();
        $scope.tmpParamChange = angular.copy(DEFAULT_TMP_PARAM_CHANGE);
      };

      // TODO(sll): Move this list (of value generators without init_args)
      // somewhere more global.
      $scope.ALLOWED_KEYS = {
        'Copier': ['value', 'parse_with_jinja'],
        'RandomSelector': ['list_of_values'],
      };

      $scope.inArray = function(array, value) {
        for (var i = 0; i < array.length; i++) {
          if (array[i] == value) {
            return true;
          }
        }
        return false;
      };

      // Returns a new customization args object that has been stripped of
      // unwanted keys.
      $scope.getCleanCustomizationArgs = function(
          generatorId, customizationArgs) {
        var newCustomizationArgs = angular.copy(customizationArgs);
        var customizationArgsKeys = [];
        for (var key in newCustomizationArgs) {
          if (newCustomizationArgs.hasOwnProperty(key)) {
            customizationArgsKeys.push(key);
          }
        }
        for (var j = 0; j < customizationArgsKeys.length; j++) {
          if (!$scope.inArray($scope.ALLOWED_KEYS[generatorId],
                              customizationArgsKeys[j])) {
            console.log(customizationArgsKeys[j]);
            delete newCustomizationArgs[customizationArgsKeys[j]];
          }
        }
        return newCustomizationArgs;
      };

      // Called when an 'edit param change' action is triggered.
      $scope.startEditParamChange = function(index) {
        var param = $scope.paramChanges[index];
        $scope.initSelectorOptions();
        $scope.activeItem = index;

        var newCustomizationArgs = $scope.getCleanCustomizationArgs(
          param.generator_id, param.customization_args);

        $scope.tmpParamChange = {
          generator_id: param.generator_id,
          customization_args: newCustomizationArgs,
          select2Name: {id: param.name, text: param.name}
        };
      };

      $scope.updateAndSaveParamChangeList = function(
          index, name, generator_id, customization_args) {
        if (index !== $scope.NEW_PARAM_CHANGE_SENTINEL) {
          $scope.paramChanges[index] = {
            'name': name,
            'generator_id': generator_id,
            'customization_args': customization_args
          };
        } else {
          $scope.paramChanges.push({
            'name': name,
            'generator_id': generator_id,
            'customization_args': customization_args
          });
        }

        $scope.saveParamChanges();
      };

      $scope.commitParamChange = function(index) {
        if (!$scope.tmpParamChange.select2Name.text) {
          warningsData.addWarning('Please specify a parameter name.');
          return;
        }

        // The tmpParamName from the selector is usually of the format
        // {id:param_name, text:param_name}, except when the user is creating
        // a new parameter, in which case it is {id:'new', text:param_name}.
        var name = $scope.tmpParamChange.select2Name.text;
        var generator_id = $scope.tmpParamChange.generator_id;
        var customization_args = $scope.getCleanCustomizationArgs(
          generator_id, $scope.tmpParamChange.customization_args);

        if (!$scope.getObjTypeForParam(name)) {
          // The name is new, so add the parameter to the exploration parameter
          // list.
          $scope.addExplorationParamSpec(
            name,
            'UnicodeString',
            $scope.updateAndSaveParamChangeList.bind(
              undefined, index, name, generator_id, customization_args)
          );
        } else {
          $scope.updateAndSaveParamChangeList(
            index, name, generator_id, customization_args);
        }

        $scope.resetParamChangeInput();
      };
    
      $scope.deleteParamChange = function (index) {
        $scope.paramChanges.splice(index, 1);
        $scope.saveParamChanges();
        $scope.resetParamChangeInput();
      };
    }
  };
});
