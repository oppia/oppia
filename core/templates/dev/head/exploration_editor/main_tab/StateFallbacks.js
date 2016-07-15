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
 * @fileoverview Controllers, services and filters for fallbacks.
 */

oppia.controller('StateFallbacks', [
  '$scope', '$rootScope', '$modal', '$filter', 'editorContextService',
  'alertsService', 'INTERACTION_SPECS', 'stateFallbacksService',
  'explorationStatesService', 'stateInteractionIdService',
  'UrlInterpolationService',
  function(
      $scope, $rootScope, $modal, $filter, editorContextService,
      alertsService, INTERACTION_SPECS, stateFallbacksService,
      explorationStatesService, stateInteractionIdService,
      UrlInterpolationService) {
    $scope.editorContextService = editorContextService;
    $scope.stateFallbacksService = stateFallbacksService;
    $scope.activeFallbackIndex = null;

    $scope.dragDotsImgUrl = UrlInterpolationService.getStaticImageUrl(
      '/general/drag_dots.png');

    $scope.$on('stateEditorInitialized', function(evt, stateData) {
      stateFallbacksService.init(
        editorContextService.getActiveStateName(),
        stateData.interaction.fallbacks);

      $scope.activeFallbackIndex = null;
    });

    $scope.getFallbackSummary = function(fallback) {
      var numSubmits = fallback.trigger.customization_args.num_submits.value;
      var fallbackDescription = (
        '[' + numSubmits +
        ' unsuccessful attempt' + (numSubmits !== 1 ? 's' : '') + '] ');
      var feedbackAsPlainText = (
        fallback.outcome.feedback.length ?
        $filter('convertToPlainText')(fallback.outcome.feedback[0]) :
        '');
      return fallbackDescription + feedbackAsPlainText;
    };

    $scope.changeActiveFallbackIndex = function(newIndex) {
      // If the current fallback is being clicked on again, close it.
      if (newIndex === $scope.activeFallbackIndex) {
        $scope.activeFallbackIndex = null;
      } else {
        $scope.activeFallbackIndex = newIndex;
      }
    };

    // This returns false if the current interaction ID is null.
    $scope.isCurrentInteractionLinear = function() {
      var interactionId = stateInteractionIdService.savedMemento;
      return interactionId && INTERACTION_SPECS[interactionId].is_linear;
    };

    $scope.openAddFallbackModal = function() {
      alertsService.clearWarnings();
      $rootScope.$broadcast('externalSave');

      $modal.open({
        templateUrl: 'modals/addFallback',
        backdrop: true,
        controller: [
          '$scope', '$modalInstance', 'editorContextService',
          function($scope, $modalInstance, editorContextService) {
            $scope.INT_FORM_SCHEMA = {
              type: 'int',
              ui_config: {},
              validators: [{
                id: 'is_at_least',
                min_value: 1
              }]
            };

            $scope.tmpFallback = {
              trigger: {
                trigger_type: 'NthResubmission',
                customization_args: {
                  num_submits: {
                    value: 3
                  }
                }
              },
              outcome: {
                dest: editorContextService.getActiveStateName(),
                feedback: [''],
                param_changes: []
              }
            };

            $scope.isSelfLoopWithNoFeedback = function(outcome) {
              var hasFeedback = outcome.feedback.some(function(feedbackPiece) {
                return Boolean(feedbackPiece);
              });

              return (
                outcome.dest === editorContextService.getActiveStateName() &&
                !hasFeedback);
            };

            $scope.addFallbackForm = {};

            $scope.saveFallback = function() {
              $scope.$broadcast('saveOutcomeFeedbackDetails');
              $scope.$broadcast('saveOutcomeDestDetails');
              // Close the modal and save it afterwards.
              $modalInstance.close({
                fallback: angular.copy($scope.tmpFallback)
              });
            };

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
              alertsService.clearWarnings();
            };
          }
        ]
      }).result.then(function(result) {
        stateFallbacksService.displayed.push(result.fallback);
        stateFallbacksService.saveDisplayedValue();
      });
    };

    // When the page is scrolled so that the top of the page is above the
    // browser viewport, there are some bugs in the positioning of the helper.
    // This is a bug in jQueryUI that has not been fixed yet. For more details,
    // see http://stackoverflow.com/q/5791886
    $scope.FALLBACK_LIST_SORTABLE_OPTIONS = {
      axis: 'y',
      cursor: 'move',
      handle: '.oppia-fallback-sort-handle',
      items: '.oppia-sortable-fallback',
      revert: 100,
      tolerance: 'pointer',
      start: function(e, ui) {
        $rootScope.$broadcast('externalSave');
        $scope.activeFallbackIndex = null;
        ui.placeholder.height(ui.item.height());
      },
      stop: function() {
        stateFallbacksService.saveDisplayedValue();
      }
    };

    $scope.deleteFallback = function(index, evt) {
      // Prevent clicking on the delete button from also toggling the display
      // state of the answer group.
      evt.stopPropagation();

      alertsService.clearWarnings();
      $modal.open({
        templateUrl: 'modals/deleteFallback',
        backdrop: true,
        controller: [
          '$scope', '$modalInstance', function($scope, $modalInstance) {
            $scope.reallyDelete = function() {
              $modalInstance.close();
            };

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
              alertsService.clearWarnings();
            };
          }
        ]
      }).result.then(function() {
        stateFallbacksService.displayed.splice(index, 1);
        stateFallbacksService.saveDisplayedValue();
      });
    };

    $scope.onComponentSave = function() {
      stateFallbacksService.saveDisplayedValue();
    };
  }
]);
