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
 * Directive for the TestGadget gadget. This gadget is a simplified
 * abstraction of the AdviceBar gadget for testing purposes.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

oppia.directive('oppiaGadgetTestGadget', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {

    // Maximum and minimum number of tips that an TestGadget can hold.
    var _MAX_TIP_COUNT = 3;
    var _MIN_TIP_COUNT = 1;

    return {
      restrict: 'E',
      templateUrl: 'gadget/TestGadget',
      controller: ['$scope', '$attrs', '$modal', function ($scope, $attrs, $modal) {
        $scope.testGadgetAdviceResources = oppiaHtmlEscaper.escapedJsonToObj(
        	$attrs.adviceObjectsWithValue);

        $scope.validate = function() {
          var tipCount = $scope.testGadgetAdviceResources.length;
          if (tipCount > _MAX_TIP_COUNT) {
            var validationError = 'TestGadget is limited to ' +
              _MAX_TIP_COUNT + ' tip' + (_MAX_TIP_COUNT>1 ? 's' : '') + '.';
            return validationError;
          } else if (tipCount < _MIN_TIP_COUNT) {
            var validationError = 'TestGadget needs at least ' +
              _MIN_TIP_COUNT + ' tip' + (_MIN_TIP_COUNT>1 ? 's' : '') + '.';
            return validationError;
          } else {
            return '';
          }
        };

        $scope.overlayAdviceModal = function(adviceResourceIndex) {
          $modal.open({
            templateUrl: '../extensions/gadgets/TestGadget/static/html/test_gadget_overlay.html',
            controller: 'TestGadgetAdviceModalCtrl',
            backdrop: true,
            resolve: {
              adviceTitle: function() {
                return $scope.testGadgetAdviceResources[adviceResourceIndex].adviceTitle;
              },
              adviceHtml: function() {
                return $scope.testGadgetAdviceResources[adviceResourceIndex].adviceHtml;
              }
            },
          })
        };
      }],
    }
  }
]);

oppia.controller('TestGadgetAdviceModalCtrl',
  ['$scope', 'adviceTitle', 'adviceHtml',
  function ($scope, adviceTitle, adviceHtml) {
    $scope.adviceTitle = adviceTitle;
    $scope.adviceHtml = adviceHtml;
}]);
