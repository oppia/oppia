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

// Each visualization receives three variables: 'data', 'options', and
// 'isAddressed'. The exact format for each of these is specific to the
// particular visualization.

oppia.directive('oppiaVisualizationBarChart', [function() {
  return {
    restrict: 'E',
    scope: {},
    controller: [
      '$scope', '$attrs', '$element', 'HtmlEscaperService',
      function($scope, $attrs, $element, HtmlEscaperService) {
        $scope.data = HtmlEscaperService.escapedJsonToObj($attrs.escapedData);
        $scope.options =
          HtmlEscaperService.escapedJsonToObj($attrs.escapedOptions);

        var dataArray = [['Answers', '']];
        for (var i = 0; i < $scope.data.length; i++) {
          dataArray.push([
            String($scope.data[i].answer), $scope.data[i].frequency]);
        }

        var data = google.visualization.arrayToDataTable(dataArray);

        var options = {
          chartArea: {
            width: '60%'
          },
          hAxis: {
            title: 'Number of times answer was submitted',
            minValue: 0
          },
          legend: {
            position: 'none'
          },
          vAxis: {
            title: 'Answer choice'
          }
        };

        var chart = new google.visualization.BarChart($element[0]);
        chart.draw(data, options);
      }
    ]
  };
}]);
