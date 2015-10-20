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
 * @fileoverview Controllers for the state parameter changes section
 * of the editor sidebar.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.controller('StateParamChangesEditor', [
    '$scope', 'editorContextService', 'stateParamChangesService',
    'editabilityService', 'explorationParamSpecsService', 'warningsData',
    'explorationStatesService',
    function(
      $scope, editorContextService, stateParamChangesService,
      editabilityService, explorationParamSpecsService, warningsData,
      explorationStatesService) {

  $scope.stateParamChangesService = stateParamChangesService;
  $scope.editabilityService = editabilityService;
  $scope.isStateParamChangesEditorOpen = false;

  $scope.warningText = '';

  var _INVALID_PARAMETER_NAMES = GLOBALS.INVALID_PARAMETER_NAMES;

  $scope.$on('stateEditorInitialized', function(evt, stateData) {
    stateParamChangesService.init(
      editorContextService.getActiveStateName(),
      stateData.param_changes, stateData, 'param_changes');
  });

  $scope.PREAMBLE_TEXT = {
    'Copier': 'to',
    'RandomSelector': 'to one of'
  };

  var _DEFAULT_PARAM_SPEC = {
    obj_type: 'UnicodeString'
  };

  // The name of this parameter change needs to be filled in.
  var _DEFAULT_PARAM_CHANGE = {
    name: '',
    customization_args: {
      value: '5',
      parse_with_jinja: true
    },
    generator_id: 'Copier'
  };

  var _generateParamNameChoices = function() {
    return Object.keys(
      explorationParamSpecsService.savedMemento
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
    var newParamChange = angular.copy(_DEFAULT_PARAM_CHANGE);
    var allParamNames = $scope.paramNameChoices;
    newParamChange.name = allParamNames.length > 0 ? allParamNames[0] : 'x';

    // Add the new param name to $scope.paramNameChoices, if necessary, so
    // that it shows up in the dropdown.
    if (!$scope.paramNameChoices.hasOwnProperty(newParamChange.name)) {
      explorationParamSpecsService.displayed[newParamChange.name] = angular.copy(
        _DEFAULT_PARAM_SPEC);
      $scope.paramNameChoices = _generateParamNameChoices();
    };

    stateParamChangesService.displayed.push(newParamChange);
  };

  $scope.openStateParamChangesEditor = function() {
    $scope.isStateParamChangesEditorOpen = true;
    $scope.paramNameChoices = _generateParamNameChoices();
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
    paramChanges = stateParamChangesService.displayed;

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

  $scope.saveStateParamChanges = function() {
    // Validate displayed value.
    if (!$scope.areDisplayedParamChangesValid()) {
      warningsData.addWarning('Invalid parameter changes.');
      return;
    }

    // Update paramSpecs manually with newly-added param names.
    explorationParamSpecsService.restoreFromMemento();
    for (var i = 0; i < stateParamChangesService.displayed.length; i++) {
      var paramName = stateParamChangesService.displayed[i].name;
      if (!explorationParamSpecsService.displayed.hasOwnProperty(name)) {
        explorationParamSpecsService.displayed[paramName] = angular.copy(
          _DEFAULT_PARAM_SPEC);
      }
    }

    explorationParamSpecsService.saveDisplayedValue();
    stateParamChangesService.saveDisplayedValue();
    $scope.isStateParamChangesEditorOpen = false;
    _updateStatesDict();
  };

  $scope.swapParamChanges = function(index1, index2) {
    if (index1 < 0 || index1 >= stateParamChangesService.displayed.length ||
        index2 < 0 || index2 >= stateParamChangesService.displayed.length) {
      warningsData.addWarning(
        'Cannot swap parameter changes at positions ' + index1 +
        ' and ' + index2 + ': index out of range');
    }

    if (index1 === index2) {
      return;
    }

    var tmp = angular.copy(stateParamChangesService.displayed[index1]);
    stateParamChangesService.displayed[index1] = (
      stateParamChangesService.displayed[index2]);
    stateParamChangesService.displayed[index2] = tmp;
    _updateStatesDict();
  };

  $scope.deleteParamChange = function(index) {
    if (index < 0 || index >= stateParamChangesService.displayed.length) {
      warningsData.addWarning(
        'Cannot delete parameter change at position ' + index +
        ': index out of range');
    }

    stateParamChangesService.displayed.splice(index, 1);
    _updateStatesDict();
  };

  $scope.cancelEdit = function() {
    stateParamChangesService.restoreFromMemento();
    $scope.isStateParamChangesEditorOpen = false;
  };

  var _updateStatesDict = function() {
    var activeStateName = editorContextService.getActiveStateName();
    var _stateDict = explorationStatesService.getState(activeStateName);
    _stateDict.param_changes = angular.copy(
      stateParamChangesService.savedMemento);
    explorationStatesService.setState(activeStateName, _stateDict);
  };
}]);
