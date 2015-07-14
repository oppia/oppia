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
 * Directive for the PencilCode gadget.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

oppia.directive('oppiaGadgetPencilCode', [
  'oppiaHtmlEscaper', 'learnerParamsService', 'oppiaPlayerService',
  function(oppiaHtmlEscaper, learnerParamsService, oppiaPlayerService) {
    return {
      restrict: 'E',
      templateUrl: 'gadget/PencilCode',
      controller: ['$scope', '$element', function ($scope, $element) {

        var hasLoadingCompleted = false;
        // A copy of the initial value for the currently-active state, so that
        // the gadget can be reset when needed.
        $scope.currentInitialValue = '';

        // This assumes a single panel called 'main' that contains at most
        // one gadget of this type.
        var statesContainingGadget = [];
        var panelsContents = oppiaPlayerService.getGadgetPanelsContents();
        for (var panelName in panelsContents) {
          for (var i = 0; i < panelsContents[panelName].length; i++) {
            if (panelsContents[panelName][i].gadget_id === 'PencilCode') {
              statesContainingGadget = angular.copy(
                panelsContents[panelName][i].visible_in_states);
              break;
            }
          }
        }

        var initialCodeCache = {};
        var lastSeenCodeCache = {};

        $scope.$watch(function() {
          return oppiaPlayerService.getActiveStateName();
        }, function(newStateName, oldStateName) {
          if (statesContainingGadget.indexOf(oldStateName) !== -1) {
            lastSeenCodeCache[oldStateName] = pce.getCode();
          }

          if (statesContainingGadget.indexOf(newStateName) !== -1) {
            var valueToChangeTo = null;
            var firstTimeSeen = null;

            if (initialCodeCache.hasOwnProperty(newStateName)) {
              valueToChangeTo = lastSeenCodeCache[newStateName];
              firstTimeSeen = false;
              $scope.currentInitialValue = initialCodeCache[newStateName];
            } else {
              valueToChangeTo = learnerParamsService.getValue(
                'PencilCode0initialCode');
              firstTimeSeen = true;
              initialCodeCache[newStateName] = valueToChangeTo;
              lastSeenCodeCache[newStateName] = valueToChangeTo;
              $scope.currentInitialValue = valueToChangeTo;
            }

            if (!hasLoadingCompleted || valueToChangeTo !== pce.getCode()) {
              if (hasLoadingCompleted) {
                pce.setCode(valueToChangeTo);
                // TODO(sll): begin a new run if autoplay functionality is
                // desired. Make sure the previous run is stopped first.
              } else {
                $scope.doInitialLoad(valueToChangeTo);
              }
            }
          }
        });

        var pce = new PencilCodeEmbed($element[0].children[0]);
        pce.on('load', function() {
          pce.hideToggleButton();
          hasLoadingCompleted = true;
        });

        $scope.doInitialLoad = function(initialCode) {
          pce.beginLoad(initialCode);
        };

        $scope.resetGadget = function(newCode) {
          pce.setCode(newCode);
        };
      }],
    }
  }
]);
