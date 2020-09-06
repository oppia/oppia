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
 * @fileoverview Directive for pie chart visualization.
 */

angular.module('oppia').component('pieChart', {
  bindings: {
    // A read-only array representing the table of chart data.
    data: '&',
    // A read-only object containing several chart options. This object
    // should have the following keys: pieHole, pieSliceTextStyleColor,
    // chartAreaWidth, colors, height, legendPosition, width.
    options: '&'
  },
  controller: ['$element', '$scope', 'WindowDimensionsService', function(
      $element, $scope, WindowDimensionsService) {
    var ctrl = this;
    ctrl.resizeSubscription = null;

    ctrl.$onInit = function() {
      if (!$.isArray(ctrl.data())) {
        return;
      }
      var options = ctrl.options();
      var chart = null;

      // Need to wait for load statement in editor template to finish.
      // https://stackoverflow.com/questions/42714876/
      google.charts.setOnLoadCallback(function() {
        if (!chart) {
          chart = new google.visualization.PieChart($element[0]);
        }
      });
      var redrawChart = function() {
        if (chart !== null) {
          chart.draw(google.visualization.arrayToDataTable(ctrl.data()), {
            title: options.title,
            pieHole: options.pieHole,
            pieSliceTextStyle: {
              color: options.pieSliceTextStyleColor,
            },
            pieSliceBorderColor: options.pieSliceBorderColor,
            pieSliceText: 'none',
            chartArea: {
              left: options.left,
              width: options.chartAreaWidth
            },
            colors: options.colors,
            height: options.height,
            legend: {
              position: options.legendPosition || 'none'
            },
            width: options.width
          });
        }
      };

      $scope.$watch('data()', redrawChart);

      ctrl.resizeSubscription = WindowDimensionsService.getResizeEvent()
        .subscribe(evt => {
          redrawChart();
          $scope.$applyAsync();
        });
    };

    ctrl.$onDestroy = function() {
      if (ctrl.resizeSubscription) {
        ctrl.resizeSubscription.unsubscribe();
      }
    };
  }]
});
