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
 * @fileoverview Directives for the object editors.
 */

// Individual object editor directives are in extensions/objects/templates.

import { CustomSchema } from 'services/schema-default-value.service';

interface ObjectEditorCustomScope extends ng.IScope {
  objType?: string;
  ngModelController: {
    $setValidity: (validationErrorKey: string, isValid: boolean) => void;
  };
  schema: CustomSchema;
  initArgs?: Object;
  modalId: symbol;
  getInitArgs?: (() => Object);
  alwaysEditable?: boolean;
  isEditable?: boolean;
  getAlwaysEditable?: (() => boolean);
  getIsEditable?: (() => boolean);
  getSchema?: (() => CustomSchema);
  updateValue: (unknown) => void;
  updateValid: (e: Record<string, boolean>) => void;
  value: unknown;
}

angular.module('oppia').directive('objectEditor', [
  '$compile', '$log', '$rootScope', function($compile, $log, $rootScope) {
    return {
      scope: {
        alwaysEditable: '@',
        initArgs: '=',
        isEditable: '@',
        modalId: '<',
        objType: '@',
        getSchema: '&schema',
        value: '='
      },
      link: function(scope: ObjectEditorCustomScope, element) {
        const MIGRATED_EDITORS: string[] = [
          'algebraic-expression',
          'boolean',
          'code-string',
          'coord-two-dim',
          'custom-osk-letters',
          'drag-and-drop-positive-int',
          'filepath',
          'fraction',
          'graph',
          'html',
          'image-with-regions',
          'int',
          'list-of-sets-of-translatable-html-content-ids',
          'list-of-tabs',
          'list-of-unicode-string',
          'math-equation',
          'math-expression-content',
          'set-of-unicode-string',
          'music-phrase',
          'number-with-units',
          'nonnegative-int',
          'normalized-string',
          'numeric-expression',
          'position-of-terms',
          'positive-int',
          'ratio-expression',
          'real',
          'sanitized-url',
          'set-of-algebraic-identifier',
          'set-of-translatable-html-content-ids',
          'skill-selector',
          'subtitled-html',
          'subtitled-unicode',
          'svg-filename',
          'translatable-html-content-id',
          'translatable-set-of-normalized-string',
          'translatable-set-of-unicode-string',
          'unicode-string'
        ];
        // Converts a camel-cased string to a lower-case hyphen-separated
        // string.
        var directiveName = scope.objType.replace(
          /([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        scope.getInitArgs = function() {
          return scope.initArgs;
        };
        scope.getAlwaysEditable = function() {
          return scope.alwaysEditable;
        };
        scope.getIsEditable = function() {
          return scope.isEditable;
        };
        scope.updateValue = function(e) {
          scope.value = e;
          $rootScope.$applyAsync();
        };
        scope.updateValid = function(e) {
          if (!scope.ngModelController) {
            return;
          }
          for (const key of Object.keys(e)) {
            scope.ngModelController.$setValidity(key, e[key]);
          }
          scope.$applyAsync();
        };
        if (directiveName) {
          if (MIGRATED_EDITORS.indexOf(directiveName) >= 0) {
            element.html(
              '<' + directiveName +
              '-editor [always-editable]="alwaysEditable"' +
              ' [init-args]="initArgs" [is-editable]="' +
              'isEditable" [schema]="getSchema()"' +
              '[modal-id]="modalId" (validity-change)="updateValid($event)"' +
              '(value-changed)="updateValue($event)" [value]="value"></' +
              directiveName + '-editor>' +
              '<input ng-show="false" style="height: 0; width: 0"' +
              ' ng-model="value">');
            $compile(element.contents())(scope);
          } else {
            element.html(
              '<' + directiveName +
              '-editor get-always-editable="getAlwaysEditable()"' +
              ' get-init-args="getInitArgs()" get-is-editable=' +
              '"getIsEditable()" get-schema="getSchema()" value="value"></' +
              directiveName + '-editor>');
            $compile(element.contents())(scope);
          }
        } else {
          $log.error('Error in objectEditor: no editor type supplied.');
        }
        if (element[0]) {
          scope.ngModelController = angular.element(
            element[0].lastElementChild).controller('ngModel');
        }
      },
      restrict: 'E'
    };
  }]);
