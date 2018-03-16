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
 * @fileoverview Directive for bar chart visualization.
 */

oppia.directive('barChart', [function() {
  return {
    restrict: 'E',
    scope: {
      // A read-only array representing the table of chart data.
      data: '&',
      // A read-only object containing several chart options. This object
      // should have the following keys: chartAreaWidth, colors, height,
      // legendPosition and width.
      options: '&'
    },
    controller: ['$scope', '$element', function($scope, $element) {
      if (!$.isArray($scope.data())) {
        return;
      }
      var options = $scope.options();
      var chart = null;

      var redrawChart = function() {
        if (!chart) {
          try {
            // Occasionally, we run into the following error:
            //"TypeError: google.visualization.BarChart is not a constructor".
            // This ignores the above error since the bar chart directive is to
            // be deprecated soon.
            chart = new google.visualization.BarChart($element[0]);
          } catch (e) {
            return;
          }
        }
        chart.draw(google.visualization.arrayToDataTable($scope.data()), {
          chartArea: {
            left: 0,
            width: options.chartAreaWidth
          },
          colors: options.colors,
          hAxis: {
            gridlines: {
              color: 'transparent'
            }
          },
          height: options.height,
          isStacked: true,
          legend: {
            position: options.legendPosition || 'none'
          },
          width: options.width
        });
      };

      $scope.$watch('data()', redrawChart);
      $(window).resize(redrawChart);
    }]
  };
}]);
