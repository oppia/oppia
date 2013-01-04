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
 * @fileoverview Angular controllers for specific classifiers.
 *
 * @author sll@google.com (Sean Lip)
 */

// Code for the finite classifier editor.
function FiniteClassifierEditor($scope, activeInputData) {
  $scope.addCategory = function() {
    if (!$scope.isValidEntityName($scope.newCategoryName, true))
      return;
    if ($scope.isDuplicateArrayInput(
            $scope.states[$scope.stateId]['dests'], 'category', null,
            $scope.newCategoryName))
      return;

    $scope.states[$scope.stateId].dests.push(
        {category: $scope.newCategoryName, dest: $scope.stateId, text: ''});
    $scope.saveStateChange('states');
    $scope.newCategoryName = '';
  };


  $scope.saveCategoryName = function(categoryId, newCategoryName) {
    if (!$scope.isValidEntityName(newCategoryName, false))
      return;
    if ($scope.isDuplicateArrayInput(
            $scope.states[$scope.stateId].dests,
            'category', categoryId, newCategoryName))
      return;

    $scope.states[$scope.stateId].dests[categoryId].category = newCategoryName;
    $scope.saveStateChange('states');
    activeInputData.clear();
  };
}


// Code for the numeric classifier editor.
function NumericClassifierEditor($scope, activeInputData, warningsData) {
  var OPERATOR_REGEXP = /^(\<\=|\>\=|\<|\>|\=|≤|≥)?$/;
  var FLOAT_REGEXP = /^-?\d+(\.?\d+)*$/;
  var TOL_REGEXP = /^±$/;
  // The following regex is constructed as follows: OF(TF)?, where
  // F = FLOAT_REGEXP, O = OPERATOR_REGEXP and T = TOL_REGEXP respectively.
  var FLOAT_NUMERIC_REGEXP =
     /^(\<\=|\>\=|\<|\>|\=|≤|≥)?(-?\d+(\.?\d+)*)(±(\d+(\.?\d+)*))?$/;

  // Converts user input to normalized human-readable categories.
  $scope.getNormalizedNumericCategory = function(input) {
    // Remove all whitespace.
    input = input.replace(/\s/g, '');
    if (!input) {
      warningsData.addWarning('Please enter a non-empty category name.');
      return null;
    }

    var parsedInput = FLOAT_NUMERIC_REGEXP.exec(input);
    if (!parsedInput) {
      warningsData.addWarning('Invalid category name: ' + input);
      return null;
    }

    // Normalize the input.
    input = input.replace('<=', '≤');
    input = input.replace('>=', '≥');
    if (input[0] != '<' && input[0] != '≤' && input[0] != '>' &&
        input[0] != '≥' && input[0] != '=') {
      input = '=' + input;
    }
    input = input.replace('±', ' ± ');
    input = input.substring(0, 1) + ' ' + input.substring(1);
    return input;
  };

  $scope.testNewDummyName = function() {
    var normalizedCategory =
        $scope.getNormalizedNumericCategory($scope.newDummyCategoryName);
    if (normalizedCategory) {
      $scope.addCategory(normalizedCategory);
      $scope.hideDummyCategory();
    } else {
      warningsData.addWarning(
          'Invalid category name: ' + $scope.newDummyCategoryName);
      $scope.hideDummyCategory();
    }
  };

  $scope.hideDummyCategory = function() {
    $scope.newDummyCategoryName = '';
    activeInputData.clear();
  };

  // Adds a character to the appropriate category name editor.
  $scope.addChar = function(c, categoryId) {
    // The following is used to handle the case when the names are 'undefined'.
    if (!$scope.newDummyCategoryName)
      $scope.newDummyCategoryName = '';

    if (categoryId == -1) {
      $scope.newDummyCategoryName += c;
      // TODO(sll): This is not working. Probably an Angular/jQuery problem...
      $('.newDummyCategoryName').focus();
    } else {
      if (!$scope.states[$scope.stateId].dests[categoryId].tempCategoryName)
        $scope.states[$scope.stateId].dests[categoryId].tempCategoryName = '';
      $scope.states[$scope.stateId].dests[categoryId].tempCategoryName += c;
      $('.newCategoryName').focus();
    }
  };

  $scope.addCategory = function(newCategoryName) {
    newCategoryName = $scope.getNormalizedNumericCategory(newCategoryName);
    if (!newCategoryName || $scope.isDuplicateArrayInput(
            $scope.states[$scope.stateId]['dests'],
            'category', null, newCategoryName))
      return;

    // Keep DEFAULT_CATEGORY_NAME as the last option.
    $scope.states[$scope.stateId].dests.splice(
        -1, 0, {category: newCategoryName, dest: $scope.stateId, text: ''});
    $scope.saveStateChange('states');
    $scope.newDummyCategoryName = '';
  };

  $scope.saveCategoryName = function(categoryId) {
    var newCategoryName = $scope.getNormalizedNumericCategory(
        $scope.states[$scope.stateId]['dests'][categoryId].tempCategoryName);
    if (!newCategoryName || $scope.isDuplicateArrayInput(
            $scope.states[$scope.stateId]['dests'],
            'category', categoryId, newCategoryName))
      return;

    $scope.states[$scope.stateId]['dests'][categoryId].tempCategoryName = '';
    $scope.states[$scope.stateId]['dests'][categoryId].category =
        newCategoryName;
    $scope.saveStateChange('states');
    activeInputData.clear();
  };
}


// Code for the set classifier editor.
var SET_CATEGORY_PREFIXES = {
    'extra': 'S has elements not in ',
    'incomplete': 'S omits some elements of ',
    'equal': 'S = ',
    'contains': 'S contains ',
    'excludes': 'S excludes '
};

function SetClassifierEditor($scope, activeInputData) {
  $scope.hideCategoryInput = function() {
    console.log($scope);
    activeInputData.clear();
    $scope.tmpSet = [];
    $scope.newTmpElement = '';
  };

  $scope.hideCategoryInput();

  $scope.getReadablePrefix = function(categoryType) {
    if (SET_CATEGORY_PREFIXES[categoryType])
      return SET_CATEGORY_PREFIXES[categoryType];
    else {
      console.log('Error: unexpected category type ' + categoryType);
      return '';
    }
  };

  $scope.getSetCategoryName = function(categoryType, tmpSet) {
    var readableName = $scope.getReadablePrefix(categoryType);
    return readableName ? readableName + JSON.stringify(tmpSet) : '';
  };

  $scope.getReadablePrefixFromActiveInput = function() {
    var array = activeInputData.name.split('.');
    if (array[0] != 'set')
      return '';
    if (array.length != 4 || array[2] != 'category') {
      console.log('Error: unexpected activeInputData.name ' + activeInputData.name);
    }
    return $scope.getReadablePrefix(array[3]);
  };

  $scope.addNewTmpElement = function() {
    console.log($scope.newTmpElement);
    if ($scope.newTmpElement) {
      $scope.tmpSet.push($scope.newTmpElement);
      $scope.newTmpElement = '';
    }
  };

  $scope.addCategory = function(tmpSet) {
    var array = activeInputData.name.split('.');
    if (array.length != 4 || array[0] != 'set' || array[2] != 'category') {
      console.log('Error: unexpected activeInputData.name ' + activeInputData.name);
    }

    var newCategoryName = $scope.getSetCategoryName(array[3], tmpSet);
    if (!newCategoryName || $scope.isDuplicateArrayInput(
            $scope.states[$scope.stateId]['dests'],
            'category', null, newCategoryName))
      return;

    // Keep DEFAULT_CATEGORY_NAME as the last option.
    $scope.states[$scope.stateId].dests.splice(
        -1, 0, {category: newCategoryName, dest: $scope.stateId, text: ''});
    $scope.saveStateChange('states');
    $scope.hideCategoryInput();
  };

  $scope.saveCategoryName = function(categoryId, tmpSet) {
    var array = activeInputData.name.split('.');
    if (array.length != 4 || array[0] != 'set' || array[2] != 'category') {
      console.log('Error: unexpected activeInputData.name ' + activeInputData.name);
    }

    var newCategoryName = $scope.getSetCategoryName(array[3], tmpSet);
    if (!newCategoryName || $scope.isDuplicateArrayInput(
            $scope.states[$scope.stateId]['dests'],
            'category', categoryId, newCategoryName))
      return;

    $scope.states[$scope.stateId]['dests'][categoryId].category =
        newCategoryName;
    $scope.saveStateChange('states');
    $scope.hideCategoryInput();
  };
}

//Code for text classifier editor.
function TextClassifierEditor($scope, activeInputData) {
  $scope.hideCategoryInput = function() {
    console.log($scope);
    activeInputData.clear();
    $scope.newTmpCategory = '';
    $scope.newTmpType = 'Answer contains';
  };

  $scope.hideCategoryInput();

  $scope.addCategory = function(newCategoryText, newCategoryType) {
    //currently normalizing all text to be lowercase
    //so that comparisons aren't case-sensistive
    newCategoryText = $scope.normalizeText(newCategoryText);
    var newCategoryName = newCategoryType + ' "' + newCategoryText + '"';
    if (!newCategoryName || $scope.isDuplicateArrayInput(
            $scope.states[$scope.stateId]['dests'],
            'category', null, newCategoryName))
      return;

    // Keep DEFAULT_CATEGORY_NAME as the last option.
    $scope.states[$scope.stateId].dests.splice(
        -1, 0, {category: newCategoryName, dest: $scope.stateId, text: ''});
    $scope.saveStateChange('states');
    $scope.hideCategoryInput();
  };

  $scope.saveCategoryName = function(
      categoryId, newCategoryText, newCategoryType) {
    //currently normalizing all text to be lowercase
    //so that comparisons aren't case-sensistive
    newCategoryText = $scope.normalizeText(newCategoryText);
    var newCategoryName = newCategoryType + ' "' + newCategoryText + '"';
    if (!newCategoryName || $scope.isDuplicateArrayInput(
            $scope.states[$scope.stateId]['dests'],
            'category', categoryId, newCategoryName))
      return;

    $scope.states[$scope.stateId]['dests'][categoryId].category =
        newCategoryName;
    $scope.saveStateChange('states');
    $scope.hideCategoryInput();
  };

  $scope.normalizeText = function(text) {
    return text.trim().replace(/\s+/g, ' ').toLowerCase();
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
FiniteClassifierEditor.$inject = ['$scope', 'activeInputData'];
NumericClassifierEditor.$inject = ['$scope', 'activeInputData', 'warningsData'];
SetClassifierEditor.$inject = ['$scope', 'activeInputData'];
TextClassifierEditor.$inject = ['$scope', 'activeInputData'];
