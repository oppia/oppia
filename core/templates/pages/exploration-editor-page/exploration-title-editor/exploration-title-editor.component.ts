// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the exploration title field in forms.
 */

angular.module('oppia').component('explorationTitleEditor', {
  bindings: {
    // The text for the label of the field.
    labelText: '@',
    // Value to move focus on the element.
    focusLabel: '@',
    // Additional CSS style to define the width and font-weight.
    formStyle: '@',
    // The method to call when the input field is blured.
    onInputFieldBlur: '&'
  },
  template: require('./exploration-title-editor.component.html'),
  controller: [
    '$scope', 'ExplorationTitleService',
    function($scope, ExplorationTitleService) {
      $scope.explorationTitleService = ExplorationTitleService;
    }
  ]
});
