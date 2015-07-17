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
 * Directive for the AdviceBar gadget.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

oppia.directive('oppiaGadgetAdviceBar', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {

    // Maximum and minimum number of tips that an AdviceBar can hold.
    var _MAX_TIP_COUNT = 3;
    var _MIN_TIP_COUNT = 1;

    return {
      restrict: 'E',
      templateUrl: 'gadget/AdviceBar',
      controller: ['$scope', '$attrs', '$modal', function ($scope, $attrs, $modal) {
        $scope.adviceBarTitle = oppiaHtmlEscaper.escapedJsonToObj($attrs.titleWithValue);
        $scope.adviceBarResources = oppiaHtmlEscaper.escapedJsonToObj($attrs.adviceObjectsWithValue);

        // TODO(anuzis): Update this method to suit the front-end API Sean and
        // Vishal determine is best when it's decided.
        $scope.validate = function() {
          var tipCount = $scope.adviceBarResources.length;
          if (tipCount > _MAX_TIP_COUNT) {
            var validationError = 'AdviceBars are limited to ' +
              _MAX_TIP_COUNT + ' tip' + (_MAX_TIP_COUNT>1 ? 's' : '') + '.';
            return validationError;
          } else if (tipCount < _MIN_TIP_COUNT) {
            var validationError = 'AdviceBars need at least ' +
              _MIN_TIP_COUNT + ' tip' + (_MIN_TIP_COUNT>1 ? 's' : '') + '.';
            return validationError;
          } else {
            return '';
          }
        };

        $scope.overlayAdviceModal = function(adviceResourceIndex) {
          $modal.open({
            templateUrl: '../extensions/gadgets/AdviceBar/static/html/advice_overlay.html',
            controller: 'AdviceBarModalCtrl',
            backdrop: true,
            resolve: {
              adviceTitle: function() {
                return $scope.adviceBarResources[adviceResourceIndex].adviceTitle;
              },
              adviceHtml: function() {
                return $scope.adviceBarResources[adviceResourceIndex].adviceHtml;
              }
            },
          })
        };
      }],
    }
  }
]);

oppia.controller('AdviceBarModalCtrl',
  ['$scope', 'adviceTitle', 'adviceHtml',
  function ($scope, adviceTitle, adviceHtml) {
    $scope.adviceTitle = adviceTitle;
    $scope.adviceHtml = adviceHtml;
}]);
