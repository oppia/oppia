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
 * @fileoverview Directives for schema-based object editors.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.factory('schemaParsingService', ['htmlService', function(htmlService) {
  return {
    buildFromSchema: function(schema, propertyToBindTo, schemaAttrName) {
      if (schema.type === 'bool') {
        return htmlService.build('bool-editor', [
          ['local-value', propertyToBindTo],
          ['is-editable', 'isEditable()']
        ], '');
      } else if (schema.type === 'unicode') {
        return htmlService.build('unicode-editor', [
          ['local-value', propertyToBindTo],
          ['is-editable', 'isEditable()']
        ], '');
      } else if (schema.type === 'list') {
        return htmlService.build('list-editor', [
          ['local-value', propertyToBindTo],
          ['is-editable', 'isEditable()'],
          ['item-schema', schemaAttrName + '.items']
        ], '');
      } else if (schema.type === 'dict') {
        var innerFormHtml = '<form role="form">';
        for (var key in schema.properties) {
          innerFormHtml += '  <div class="form-group">';
          // TODO(sll): Add a 'for' attribute here.
          innerFormHtml += htmlService.build('label', [], key);
          innerFormHtml += ' ';
          innerFormHtml += this.buildFromSchema(
            schema.properties[key], propertyToBindTo + '.' + key,
            schemaAttrName + '.properties.' + key);
          innerFormHtml += htmlService.build('br', [], '');
          innerFormHtml += '  </div>';
        }
        innerFormHtml += '</form>';
        return innerFormHtml;
      } else if (schema.type === 'html') {
        return htmlService.build('new-html-editor', [
          ['local-value', propertyToBindTo],
          ['is-editable', 'isEditable()']
        ], '');
      } else {
        console.error('Invalid schema type: ' + schema.type);
      }
    },
    getDefaultValue: function(schema) {
      if (schema.type === 'bool') {
        return false;
      } else if (schema.type === 'unicode' || schema.type === 'html') {
        return '';
      } else if (schema.type === 'list') {
        return [];
      } else if (schema.type === 'dict') {
        return {};
      } else {
        console.error('Invalid schema type: ' + schema.type);
      }
    }
  };
}]);

// TODO(sll): Rename this (and instances of 'new-html-editor') to just HtmlEditor.
// TODO(sll): The 'Cancel' button should revert the text in the HTML box to its
// original state.
// TODO(sll): The noninteractive widgets in the RTE do not work.
oppia.directive('newHtmlEditor', ['$compile', 'htmlService', function($compile, htmlService) {
  return {
    scope: {
      localValue: '=',
      // Read-only property. Whether the item is editable.
      isEditable: '&'
    },
    link: function(scope, element, attrs) {
      var elementHtml = '';
      if (scope.isEditable()) {
        elementHtml = htmlService.build(
          'rich-text-editor', [['html-content', 'localValue']], '');
      } else {
        elementHtml = htmlService.build(
          'span', [['angular-html-bind', 'localValue']], '');
      }
      element.html(elementHtml);
      $compile(element.contents())(scope);
    },
    restrict: 'E',
    controller: function($scope, $attrs) {
      return;
    }
  };
}]);

oppia.directive('boolEditor', ['$compile', 'htmlService', function($compile, htmlService) {
  return {
    scope: {
      localValue: '=',
      // Read-only property. Whether the item is editable.
      isEditable: '&'
    },
    link: function(scope, element, attrs) {
      var elementHtml = '';
      if (scope.isEditable()) {
        elementHtml = htmlService.build(
          'input', [['type', 'checkbox'], ['ng-model', 'localValue']], '');
      } else {
        elementHtml = htmlService.build('span', [], '<[localValue]>');
      }
      element.html(elementHtml);
      $compile(element.contents())(scope);
    },
    restrict: 'E',
    controller: function($scope, $attrs) {
      return;
    }
  };
}]);

oppia.directive('unicodeEditor', ['$compile', 'htmlService', function($compile, htmlService) {
  return {
    scope: {
      localValue: '=',
      // Read-only property. Whether the item is editable.
      isEditable: '&'
    },
    link: function(scope, element, attrs) {
      var elementHtml = '';
      if (scope.isEditable()) {
        elementHtml = htmlService.build('input', [
          ['type', 'text'],
          ['ng-model', 'localValue'],
          ['class', 'form-control']
        ], '');
      } else {
        elementHtml = htmlService.build('span', [], '<[localValue]>');
      }
      element.html(elementHtml);
      $compile(element.contents())(scope);
    },
    restrict: 'E',
    controller: function($scope, $attrs) {
      return;
    }
  };
}]);

// TODO(sll): This duplicates an existing object editor directive; remove
// the other one.
oppia.directive('listEditor', [
    '$compile', 'htmlService', 'schemaParsingService',
    function($compile, htmlService, schemaParsingService) {
  return {
    scope: {
      localValue: '=',
      // Read-only property. Whether the item is editable.
      isEditable: '&',
      // Read-only property. The schema definition for each item in the list.
      itemSchema: '&'
    },
    link: function(scope, element, attrs) {
      var elementHtml = (
        '<table class="table">' +
        '  <tr ng-repeat="item in localValue track by $index">' +
        '    <td>' +
        schemaParsingService.buildFromSchema(
          scope.itemSchema(), 'localValue[$index]', 'itemSchema()') +
        '    </td>' + (
          scope.isEditable() ?
        '    <td>' +
        '      <button class="btn btn-default btn-xs" type="button" ng-click="deleteElement($index)">' +
        '        <span class="glyphicon glyphicon-remove" title="Delete item">' +
        '        </span>' +
        '      </button>' +
        '    </td>' : '') +
        '  </tr>' +
        '</table>');

      if (scope.isEditable()) {
        elementHtml += (
          '<button class="btn btn-default" type="button" ng-click="addElement()">' +
          '  Add element' +
          '</button>');
      }

      element.html(elementHtml);
      $compile(element.contents())(scope);
    },
    restrict: 'E',
    controller: function($scope, $attrs) {
      $scope.addElement = function() {
        $scope.localValue.push(
          schemaParsingService.getDefaultValue($scope.itemSchema()));
      };

      $scope.deleteElement = function(index) {
        $scope.localValue.splice(index, 1);
      };
    }
  };
}]);

oppia.directive('schemaBasedEditor', [
    '$compile', 'htmlService', 'schemaParsingService',
    function($compile, htmlService, schemaParsingService) {
  return {
    scope: {
      definition: '=',
      isEditable: '&',
      savedValue: '='
    },
    link: function(scope, element, attrs) {
      var formHtml = schemaParsingService.buildFromSchema(
        scope.definition, 'localValue', 'definition');
      if (scope.isEditable()) {
        formHtml += (
          '<div>' +
            htmlService.build('button', [
              ['ng-click', 'submitValue(localValue)'],
              ['class', 'btn btn-success']
            ], 'Submit') +
            htmlService.build('button', [
              ['ng-click', 'cancelEdit()'],
              ['class', 'btn btn-default']
            ], 'Cancel') +
          '</div>');
      }

      element.html(formHtml);
      $compile(element.contents())(scope);
    },
    restrict: 'E',
    controller: function($scope, $attrs) {
      $scope.$watch('savedValue', function(newValue, oldValue) {
        $scope.localValue = angular.copy($scope.savedValue);
      });

      $scope.submitValue = function(value) {
        $scope.savedValue = angular.copy($scope.localValue);
        alert($scope.savedValue);
      };
      $scope.cancelEdit = function() {
        $scope.localValue = angular.copy($scope.savedValue);
      };
    }
  };
}]);
