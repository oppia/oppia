// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for a schema-based editor for lists.
 */

oppia.directive('schemaBasedListEditor', [
  'SchemaDefaultValueService', 'ResponsesService',
  'NestedDirectivesRecursionTimeoutPreventionService',
  'FocusManagerService', 'SchemaUndefinedLastElementService',
  'IdGenerationService', 'UrlInterpolationService',
  function(
      SchemaDefaultValueService, ResponsesService,
      NestedDirectivesRecursionTimeoutPreventionService,
      FocusManagerService, SchemaUndefinedLastElementService,
      IdGenerationService, UrlInterpolationService) {
    return {
      scope: {
        localValue: '=',
        isDisabled: '&',
        // Read-only property. The schema definition for each item in the list.
        itemSchema: '&',
        // The length of the list. If not specified, the list is of arbitrary
        // length.
        len: '=',
        // UI configuration. May be undefined.
        uiConfig: '&',
        validators: '&',
        labelForFocusTarget: '&'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/forms/schema_editors/' +
        'schema_based_list_editor_directive.html'),
      restrict: 'E',
      compile: NestedDirectivesRecursionTimeoutPreventionService.compile,
      controller: ['$scope', function($scope) {
        var baseFocusLabel = (
          $scope.labelForFocusTarget() ||
          IdGenerationService.generateNewId() + '-');
        $scope.getFocusLabel = function(index) {
          // Treat the first item in the list as a special case -- if this list
          // is contained in another list, and the outer list is opened with a
          // desire to autofocus on the first input field, we can then focus on
          // the given $scope.labelForFocusTarget().
          // NOTE: This will cause problems for lists nested within lists, since
          // sub-element 0 > 1 will have the same label as sub-element 1 > 0.
          // But we will assume (for now) that nested lists won't be used -- if
          // they are, this will need to be changed.
          return (
            index === 0 ? baseFocusLabel : baseFocusLabel + index.toString());
        };

        $scope.isAddItemButtonPresent = true;
        $scope.addElementText = 'Add element';
        if ($scope.uiConfig() && $scope.uiConfig().add_element_text) {
          $scope.addElementText = $scope.uiConfig().add_element_text;
        }

        // Only hide the 'add item' button in the case of single-line unicode
        // input.
        $scope.isOneLineInput = true;
        if ($scope.itemSchema().type !== 'unicode' ||
            $scope.itemSchema().hasOwnProperty('choices')) {
          $scope.isOneLineInput = false;
        } else if ($scope.itemSchema().ui_config) {
          if ($scope.itemSchema().ui_config.coding_mode) {
            $scope.isOneLineInput = false;
          } else if (
            $scope.itemSchema().ui_config.hasOwnProperty('rows') &&
            $scope.itemSchema().ui_config.rows > 2) {
            $scope.isOneLineInput = false;
          }
        }

        $scope.minListLength = null;
        $scope.maxListLength = null;
        $scope.showDuplicatesWarning = false;
        if ($scope.validators()) {
          for (var i = 0; i < $scope.validators().length; i++) {
            if ($scope.validators()[i].id === 'has_length_at_most') {
              $scope.maxListLength = $scope.validators()[i].max_value;
            } else if ($scope.validators()[i].id === 'has_length_at_least') {
              $scope.minListLength = $scope.validators()[i].min_value;
            } else if ($scope.validators()[i].id === 'is_uniquified') {
              $scope.showDuplicatesWarning = true;
            }
          }
        }

        while ($scope.localValue.length < $scope.minListLength) {
          $scope.localValue.push(
            SchemaDefaultValueService.getDefaultValue($scope.itemSchema()));
        }

        $scope.hasDuplicates = function() {
          var valuesSoFar = {};
          for (var i = 0; i < $scope.localValue.length; i++) {
            var value = $scope.localValue[i];
            if (!valuesSoFar.hasOwnProperty(value)) {
              valuesSoFar[value] = true;
            } else {
              return true;
            }
          }
          return false;
        };

        if ($scope.len === undefined) {
          $scope.addElement = function() {
            if ($scope.isOneLineInput) {
              $scope.hideAddItemButton();
            }

            $scope.localValue.push(
              SchemaDefaultValueService.getDefaultValue($scope.itemSchema()));
            FocusManagerService.setFocus(
              $scope.getFocusLabel($scope.localValue.length - 1));
          };

          var _deleteLastElementIfUndefined = function() {
            var lastValueIndex = $scope.localValue.length - 1;
            var valueToConsiderUndefined = (
              SchemaUndefinedLastElementService.getUndefinedValue(
                $scope.itemSchema()));
            if ($scope.localValue[lastValueIndex] ===
                valueToConsiderUndefined) {
              $scope.deleteElement(lastValueIndex);
            }
          };

          var deleteEmptyElements = function() {
            for (var i = 0; i < $scope.localValue.length - 1; i++) {
              if ($scope.localValue[i].length === 0) {
                $scope.deleteElement(i);
                i--;
              }
            }
          };

          if ($scope.localValue.length === 1) {
            if ($scope.localValue[0].length === 0) {
              $scope.isAddItemButtonPresent = false;
            }
          }

          $scope.lastElementOnBlur = function() {
            _deleteLastElementIfUndefined();
            $scope.showAddItemButton();
          };

          $scope.showAddItemButton = function() {
            deleteEmptyElements();
            $scope.isAddItemButtonPresent = true;
          };

          $scope.hideAddItemButton = function() {
            $scope.isAddItemButtonPresent = false;
          };

          $scope._onChildFormSubmit = function(evt) {
            if (!$scope.isAddItemButtonPresent) {
              /**
               * If form submission happens on last element of the set (i.e the
               * add item button is absent) then automatically add the element
               * to the list.
               */
              if (($scope.maxListLength === null ||
                   $scope.localValue.length < $scope.maxListLength) &&
                  !!$scope.localValue[$scope.localValue.length - 1]) {
                $scope.addElement();
              }
            } else {
              /**
               * If form submission happens on existing element remove focus
               * from it
               */
              document.activeElement.blur();
            }
            evt.stopPropagation();
          };

          $scope.$on('submittedSchemaBasedIntForm', $scope._onChildFormSubmit);
          $scope.$on(
            'submittedSchemaBasedFloatForm', $scope._onChildFormSubmit);
          $scope.$on(
            'submittedSchemaBasedUnicodeForm', $scope._onChildFormSubmit);

          $scope.deleteElement = function(index) {
            // Need to let the RTE know that HtmlContent has been changed.
            $scope.$broadcast('externalHtmlContentChange');
            var answerGroups = ResponsesService.getAnswerGroups();
            for (var i = 0; i < answerGroups.length; i++) {
              var rules = answerGroups[i].rules;
              for (var j = 0; j < rules.length; j++) {
                if (index < rules[j].inputs.x) {
                  ResponsesService.reduceRuleIndexByOne(i, j);
                } else if (index === rules[j].inputs.x) {
                  ResponsesService.makeRuleInvalid(i, j);
                }
              }
            }
            $scope.localValue.splice(index, 1);
          };
        } else {
          if ($scope.len <= 0) {
            throw 'Invalid length for list editor: ' + $scope.len;
          }
          if ($scope.len !== $scope.localValue.length) {
            throw 'List editor length does not match length of input value: ' +
              $scope.len + ' ' + $scope.localValue;
          }
        }
      }]
    };
  }
]);
