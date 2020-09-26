// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for "enumerated frequency table" visualization.
 */

angular.module('oppia').directive(
  'oppiaVisualizationEnumeratedFrequencyTable', () => ({
    restrict: 'E',
    scope: { data: '<', options: '<', addressedInfoIsSupported: '<' },
    template: require(
      './oppia-visualization-enumerated-frequency-table.directive.html'),
    style: require(
      './oppia-visualization-enumerated-frequency-table.directive.css'),
    controller: function($scope) {
      this.$onInit = () => {
        // By default only the first element is shown, the rest are hidden.
        $scope.answerVisible = $scope.data.map((_, i) => i === 0);

        $scope.toggleAnswerVisibility = (i: number) => {
          $scope.answerVisible[i] = !$scope.answerVisible[i];
        };
      };
    }
  })
);
