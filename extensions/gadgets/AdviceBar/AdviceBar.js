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

    // Constants for calculation of height and width.
    // TODO(anuzis): Update these values to reflect actual size
    // as UX polish is finalized.
    var _WIDTH = 100;
    var _TITLE_HEIGHT = 50;
    var _HEIGHT_PER_ADVICE_RESOURCE = 100;

    return {
      restrict: 'E',
      templateUrl: 'gadget/AdviceBar',
      controller: ['$scope', '$attrs', '$modal', function ($scope, $attrs, $modal) {
        $scope.adviceBarTitle = oppiaHtmlEscaper.escapedJsonToObj($attrs.titleWithValue);
        $scope.adviceBarResources = oppiaHtmlEscaper.escapedJsonToObj($attrs.adviceObjectsWithValue);

        $scope.getWarnings = function() {
          var tipCount = $scope.adviceBarResources.length;
          if (tipCount > _MAX_TIP_COUNT) {
            var validationError = 'AdviceBars are limited to ' +
              _MAX_TIP_COUNT + ' tip' + (_MAX_TIP_COUNT>1?'s':'') + '.';
            return validationError;
          } else if (tipCount < _MIN_TIP_COUNT) {
            var validationError = 'AdviceBars need at least ' +
              _MIN_TIP_COUNT + ' tip' + (_MIN_TIP_COUNT>1?'s':'') + '.';
            return validationError;
          } else {
            return '';
          }
        }

        // @sll: Per our VC, we agreed to have each gadget provide static
        // constants for WIDTH and HEIGHT rather than a dynamic value that
        // depends on its customization args. After the VC, Vishal and I
        // discussed ways of implementing this and again the only simple
        // solution appeared to be having gadget developers hard-code these
        // values in a shared Service.
        //
        // We considered something akin to a front-end gadget Registry that
        // would have a record of approved gadgets (similar to feconf.py)
        // and which directories to retrieve their constants from based
        // on gadgetType, but that didn't seem trivial to implement this
        // afternoon. Any suggestions on how to validate gadget width/height
        // keeping files cleanly decoupled in each gadget's directory?
        //
        // Even if height/width values aren't dynamic based on customization
        // args, we want to be able to enforce reasonable defaults that
        // prevent vertical AdviceBars from being added to the bottom, and
        // the horizontal ScoreBar from being added on the left/right.

        $scope.getHeight = function() {
          var height = 0;
          var tip_count = $scope.adviceBarResources.length;

          // If the AdviceBar has a title to display, factor it into
          // the gadget's height.
          if ($scope.adviceBarTitle != '') {
            height = height + _TITLE_HEIGHT;
          }
          height += _HEIGHT_PER_ADVICE_RESOURCE * tip_count;
          return height;
        }

        $scope.getWidth = function () {
          return _WIDTH;
        }



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
