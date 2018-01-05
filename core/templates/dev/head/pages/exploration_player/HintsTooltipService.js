// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for displaying the hints tooltip to the learner.
 */

oppia.factory('HintsTooltipService', [
  '$uibModal', '$uibModalStack', '$timeout', 'UrlInterpolationService',
  function($uibModal, $uibModalStack, $timeout, UrlInterpolationService) {
    // 10 second wait before closing the modal.
    var CLOSE_TOOLTIP_MSEC = 10000;
    var WAIT_FOR_TOOLTIP_TO_BE_SHOWN_MSEC = 5000;
    var timeout = null;
    var tooltipIsOpen = false;
    var tooltipCanBeViewed = true;
    var enqueueTimeout = function (func, timeToWaitMsec) {
      resetTimeouts();
      timeout = $timeout(func, timeToWaitMsec);
    };
    var resetTimeouts = function() {
      if (timeout) {
        $timeout.cancel(timeout);
      }
    };

    var showTooltipModal = function () {
      $uibModal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_player/hints_tooltip_directive.html'),
        backdrop: 'static',
        resolve: {},
        controller: [
          '$scope', '$uibModalInstance',
          function ($scope, $uibModalInstance) {
            tooltipIsOpen = true;
            $scope.closeModal = function () {
              if (timeout) {
                $timeout.cancel(timeout);
              }
              $uibModalInstance.close('done');
              tooltipIsOpen = false;
            };
            tooltipCanBeViewed = false;
          }]
      });
      enqueueTimeout(closeTooltip, CLOSE_TOOLTIP_MSEC);
    };

    var closeTooltip = function() {
      $uibModalStack.dismissAll();
      tooltipIsOpen = false;
      tooltipCanBeViewed = false;
    };

    return {
      startTimerForTooltip: function() {
        enqueueTimeout(showTooltipModal, WAIT_FOR_TOOLTIP_TO_BE_SHOWN_MSEC);
      },
      isTooltipOpen: function() {
        return tooltipIsOpen;
      },
      closeTooltipModal: function() {
        resetTimeouts();
        closeTooltip();
      },
      isTooltipViewable: function() {
        return tooltipCanBeViewed;
      },
      resetTimers: function() {
        resetTimeouts();
      },
      reset: function() {
        timeout = null;
        tooltipCanBeViewed = true;
      }
    }
  }]);
