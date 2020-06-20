// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for drag and drop HTML string editor.
 */

angular.module('oppia').directive('dragAndDropHtmlStringEditor', [
  function() {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getInitArgs: '&',
        value: '='
      },
      template: require('./drag-and-drop-html-string-editor.directive.html'),
      controllerAs: '$ctrl',
      controller: [function() {
        var ctrl = this;

        ctrl.$onInit = function() {
          ctrl.name = Math.random().toString(36).substring(7);
          ctrl.initArgs = ctrl.getInitArgs();
          ctrl.choices = ctrl.initArgs.choices;

          if (!ctrl.value || ctrl.value === '') {
            ctrl.value = ctrl.choices[0].id;
          }
        };
      }]
    };
  }]);
