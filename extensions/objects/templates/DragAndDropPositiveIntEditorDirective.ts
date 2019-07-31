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
 * @fileoverview Directive for drag and drop positive int editor.
 */

angular.module('oppia').directive('dragAndDropPositiveIntEditor', [
  'UrlInterpolationService',
  function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getInitArgs: '&',
        value: '='
      },
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/objects/templates/drag_and_drop_positive_int_editor_directive.html'),
      controllerAs: '$ctrl',
      controller: [function() {
        var ctrl = this;
        if (!parseInt(ctrl.value)) {
          ctrl.value = 1;
        }
        if (!ctrl.selectedRank) {
          ctrl.selectedRank = '';
        }
        ctrl.allowedRanks = [];
        ctrl.initArgs = ctrl.getInitArgs();
        ctrl.choices = ctrl.initArgs.choices;
        for (var i = 0; i < ctrl.choices.length; i++) {
          ctrl.allowedRanks.push(i + 1);
        }
        ctrl.selection = function(selectedRank) {
          ctrl.value = parseInt(selectedRank);
        };
      }]
    };
  }]);
