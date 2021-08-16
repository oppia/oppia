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
 * @fileoverview Component for the selection dropdown with HTML content.
 */

require('directives/angular-html-bind.directive.ts');
require('domain/utilities/url-interpolation.service.ts');

// This component allows user to put html into select's options.
// 'options' should be an array of objects containing attributes 'id' and 'val'
// Attribute 'val' is presented to the user. After user selection, the
// corresponding attribute 'id' is assigned to 'selection'.

angular.module('oppia').component('htmlSelect', {
  bindings: {
    options: '=',
    selection: '='
  },
  template: require(
    'components/forms/custom-forms-directives/html-select.component.html'),
  controller: ['$scope', function($scope) {
    let ctrl = this;
    $scope.select = function(id) {
      ctrl.selection = id;
    };

    $scope.getSelectionIndex = function() {
      for (var index = 0; index < ctrl.options.length; index++) {
        if (ctrl.options[index].id === ctrl.selection) {
          return index;
        }
      }
    };
  }]
});
