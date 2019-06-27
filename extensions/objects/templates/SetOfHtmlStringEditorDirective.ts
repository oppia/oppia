// Copyright 2012 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for set of HTML string editor.
 */

// Every editor directive should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.

var oppia = require('AppInit.ts').module;

oppia.directive('setOfHtmlStringEditor', [
  'UrlInterpolationService', 'OBJECT_EDITOR_URL_PREFIX',
  function(UrlInterpolationService, OBJECT_EDITOR_URL_PREFIX) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getInitArgs: '&',
        value: '='
      },
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/objects/templates/set_of_html_string_editor_directive.html'),
      controllerAs: '$ctrl',
      controller: [function() {
        var ctrl = this;
        ctrl.SCHEMA = {
          type: 'list',
          items: {
            type: 'html'
          }
        };

        if (!ctrl.value) {
          ctrl.value = [];
        }
        ctrl.initArgs = ctrl.getInitArgs();
        ctrl.choices = ctrl.initArgs.choices;
        ctrl.selections = ctrl.choices.map(function(choice) {
          return ctrl.value.indexOf(choice.id) !== -1;
        });

        // The following function is necessary to insert elements into the
        // answer groups for the Item Selection Widget.
        ctrl.toggleSelection = function(choiceListIndex) {
          var choiceHtml = ctrl.choices[choiceListIndex].id;
          var selectedChoicesIndex = ctrl.value.indexOf(choiceHtml);
          if (selectedChoicesIndex > -1) {
            ctrl.value.splice(selectedChoicesIndex, 1);
          } else {
            ctrl.value.push(choiceHtml);
          }
        };
      }]
    };
  }]);
