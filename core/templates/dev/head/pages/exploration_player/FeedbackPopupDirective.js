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
 * @fileoverview Directive for the feedback popup.
 */

// This directive is unusual in that it should only be invoked indirectly, as
// follows:
//
// <some-html-element popover-placement="bottom"
//                    uib-popover-template="popover/feedback"
//                    popover-trigger="click" state-name="<[STATE_NAME]>">
// </some-html-element>
//
// The state-name argument is optional. If it is not provided, the feedback is
// assumed to apply to the exploration as a whole.
oppia.directive('feedbackPopup', [
  'ExplorationEngineService', 'UrlInterpolationService',
  function(ExplorationEngineService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_player/feedback_popup_directive.html'),
      controller: [
        '$scope', '$element', '$http', '$log', '$timeout', '$filter',
        'FocusManagerService', 'AlertsService', 'BackgroundMaskService',
        'PlayerPositionService', 'WindowDimensionsService',
        'FEEDBACK_SUBJECT_MAX_CHAR_LIMIT',
        function(
            $scope, $element, $http, $log, $timeout, $filter,
            FocusManagerService, AlertsService, BackgroundMaskService,
            PlayerPositionService, WindowDimensionsService,
            FEEDBACK_SUBJECT_MAX_CHAR_LIMIT) {
          $scope.feedbackText = '';
          $scope.isSubmitterAnonymized = false;
          $scope.isLoggedIn = ExplorationEngineService.isLoggedIn();
          $scope.feedbackSubmitted = false;
          // We generate a random id since there may be multiple popover
          // elements on the same page.
          $scope.feedbackPopoverId = (
            'feedbackPopover' + Math.random().toString(36).slice(2));

          if (WindowDimensionsService.isWindowNarrow()) {
            BackgroundMaskService.activateMask();
          }

          FocusManagerService.setFocus($scope.feedbackPopoverId);

          var feedbackUrl = (
            '/explorehandler/give_feedback/' +
            ExplorationEngineService.getExplorationId());

          var getTriggerElt = function() {
            // Find the popover trigger node (the one with a popover-template
            // attribute). This is also the DOM node that contains the state
            // name. Since the popover DOM node is inserted as a sibling to the
            // node, we therefore climb up the DOM tree until we find the
            // top-level popover element. The trigger will be one of its
            // siblings.
            //
            // If the trigger element cannot be found, a value of undefined is
            // returned. This could happen if the trigger is clicked while the
            // feedback confirmation message is being displayed.
            var elt = $element;
            var popoverChildElt = null;
            for (var i = 0; i < 10; i++) {
              elt = elt.parent();
              if (!angular.isUndefined(
                elt.attr('uib-popover-template-popup'))) {
                popoverChildElt = elt;
                break;
              }
            }
            if (!popoverChildElt) {
              $log.error('Could not close popover element.');
              return undefined;
            }

            var popoverElt = popoverChildElt.parent();
            var triggerElt = null;
            var childElts = popoverElt.children();
            for (var i = 0; i < childElts.length; i++) {
              var childElt = $(childElts[i]);
              if (childElt.attr('uib-popover-template')) {
                triggerElt = childElt;
                break;
              }
            }

            if (!triggerElt) {
              $log.error('Could not find popover trigger.');
              return undefined;
            }

            return triggerElt;
          };

          $scope.saveFeedback = function() {
            if ($scope.feedbackText) {
              $http.post(feedbackUrl, {
                subject: $filter('getAbbreviatedText')(
                  $scope.feedbackText, FEEDBACK_SUBJECT_MAX_CHAR_LIMIT),
                feedback: $scope.feedbackText,
                include_author: (
                  !$scope.isSubmitterAnonymized && $scope.isLoggedIn),
                state_name: PlayerPositionService.getCurrentStateName()
              });
            }

            $scope.feedbackSubmitted = true;
            $timeout(function() {
              var triggerElt = getTriggerElt();
              if (triggerElt) {
                triggerElt.trigger('click');
              }
            }, 2000);
          };

          $scope.closePopover = function() {
            // Closing the popover is done by clicking on the popover trigger.
            // The timeout is needed to postpone the click event to
            // the subsequent digest cycle. Otherwise, an "$apply already
            // in progress" error is raised.
            $timeout(function() {
              getTriggerElt().trigger('click');
            });
            BackgroundMaskService.deactivateMask();
          };

          $scope.$on('$destroy', function() {
            BackgroundMaskService.deactivateMask();
          });
        }
      ]
    };
  }
]);
