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
 * @fileoverview Directive for "bar chart" visualization.
 */

angular.module('oppia').directive('oppiaVisualizationBarChart', () => ({
  restrict: 'E',
  scope: { data: '<', options: '<' },
  template: '',
  controller: function($element, $scope) {
    this.$onInit = () => {
      const data = google.visualization.arrayToDataTable([
        ['Answers', ''],
        ...$scope.data.map(d => [String(d.answer), d.frequency]),
      ]);
      const options = {
        hAxis: { title: $scope.options.x_axis_label, minValue: 0 },
        vAxis: { title: $scope.options.y_axis_label },
        legend: <const> 'none',
      };
      const chart = new google.visualization.BarChart($element[0]);
      chart.draw(data, options);
    };
  }
}));
