// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controllers, services and filters for hints.
 */

oppia.controller('StateHints', [
  '$scope', '$rootScope', '$modal', '$filter', 'editorContextService',
  'AlertsService', 'INTERACTION_SPECS', 'stateHintsService',
  'explorationStatesService', 'stateInteractionIdService',
  'UrlInterpolationService', 'HintObjectFactory', 'ExplorationPlayerService',
  'stateSolutionService',
  function(
    $scope, $rootScope, $modal, $filter, editorContextService,
    AlertsService, INTERACTION_SPECS, stateHintsService,
    explorationStatesService, stateInteractionIdService,
    UrlInterpolationService, HintObjectFactory, ExplorationPlayerService,
    stateSolutionService) {
    $scope.editorContextService = editorContextService;
    $scope.stateHintsService = stateHintsService;
    $scope.activeHintIndex = null;
    $scope.isLoggedIn = ExplorationPlayerService.isLoggedIn();

    $scope.dragDotsImgUrl = UrlInterpolationService.getStaticImageUrl(
      '/general/drag_dots.png');

    $scope.$on('stateEditorInitialized', function(evt, stateData) {
      stateHintsService.init(
        editorContextService.getActiveStateName(),
          stateData.interaction.hints);

      $scope.activeHintIndex = null;
    });

    $scope.getHintSummary = function(hint) {
      var hintAsPlainText = (
        hint.hintText.length ?
          $filter('convertToPlainText')(hint.hintText) : '');
      return hintAsPlainText;
    };

    $scope.changeActiveHintIndex = function(newIndex) {
      var currentActiveIndex = $scope.activeHintIndex;
      if (currentActiveIndex !== null && (
          !stateHintsService.displayed[currentActiveIndex].hintText)) {
        if (stateSolutionService.savedMemento &&
          stateHintsService.displayed.length === 1) {
          openDeleteLastHintModal();
          return;
        } else {
          AlertsService.addInfoMessage('Deleting empty hint.');
          stateHintsService.displayed.splice(currentActiveIndex, 1);
          stateHintsService.saveDisplayedValue();
        }
      }
      // If the current hint is being clicked on again, close it.
      if (newIndex === $scope.activeHintIndex) {
        $scope.activeHintIndex = null;
      } else {
        $scope.activeHintIndex = newIndex;
      }
    };

    // This returns false if the current interaction ID is null.
    $scope.isCurrentInteractionLinear = function() {
      var interactionId = stateInteractionIdService.savedMemento;
      return interactionId && INTERACTION_SPECS[interactionId].is_linear;
    };

    $scope.openAddHintModal = function() {
      AlertsService.clearWarnings();
      $rootScope.$broadcast('externalSave');

      $modal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_editor/editor_tab/' +
          'add_hint_modal_directive.html'),
        backdrop: 'static',
        controller: [
          '$scope', '$modalInstance', 'editorContextService',
          function($scope, $modalInstance, editorContextService) {
            $scope.HINT_FORM_SCHEMA = {
              type: 'html',
              ui_config: {}
            };

            $scope.tmpHint = '';

            $scope.addHintForm = {};

            $scope.hintIndex = stateHintsService.displayed.length + 1;

            $scope.saveHint = function() {
              // Close the modal and save it afterwards.
              $modalInstance.close({
                hint: angular.copy(
                  HintObjectFactory.createNew($scope.tmpHint))
              });
            };

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
              AlertsService.clearWarnings();
            };
          }
        ]
      }).result.then(function(result) {
        stateHintsService.displayed.push(result.hint);
        stateHintsService.saveDisplayedValue();
      });
    };

    // When the page is scrolled so that the top of the page is above the
    // browser viewport, there are some bugs in the positioning of the helper.
    // This is a bug in jQueryUI that has not been fixed yet. For more details,
    // see http://stackoverflow.com/q/5791886
    $scope.HINT_LIST_SORTABLE_OPTIONS = {
      axis: 'y',
      cursor: 'move',
      handle: '.oppia-hint-sort-handle',
      items: '.oppia-sortable-hint',
      revert: 100,
      tolerance: 'pointer',
      start: function(e, ui) {
        $rootScope.$broadcast('externalSave');
        $scope.activeHintIndex = null;
        ui.placeholder.height(ui.item.height());
      },
      stop: function() {
        stateHintsService.saveDisplayedValue();
      }
    };

    var openDeleteLastHintModal = function() {
      AlertsService.clearWarnings();

      $modal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_editor/editor_tab/' +
          'delete_last_hint_modal_directive.html'),
        backdrop: true,
        controller: [
          '$scope', '$modalInstance',
          function($scope, $modalInstance) {
            $scope.deleteBothSolutionAndHint = function() {
              $modalInstance.close();
            };

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
              AlertsService.clearWarnings();
            };
          }
        ]
      }).result.then(function() {
        stateSolutionService.displayed = null;
        stateSolutionService.saveDisplayedValue();
        stateHintsService.displayed = [];
        stateHintsService.saveDisplayedValue();
      });
    };

    $scope.deleteHint = function(index, evt) {
      // Prevent clicking on the delete button from also toggling the display
      // state of the hint.
      evt.stopPropagation();

      AlertsService.clearWarnings();
      $modal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_editor/editor_tab/' +
          'delete_hint_modal_directive.html'),
        backdrop: true,
        controller: [
          '$scope', '$modalInstance', function($scope, $modalInstance) {
            $scope.reallyDelete = function() {
              $modalInstance.close();
            };

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
              AlertsService.clearWarnings();
            };
          }
        ]
      }).result.then(function() {
        if (stateSolutionService.savedMemento &&
          stateHintsService.savedMemento.length === 1) {
          openDeleteLastHintModal();
        } else {
          stateHintsService.displayed.splice(index, 1);
          stateHintsService.saveDisplayedValue();
        }
      });
    };

    $scope.onSaveInlineHint = function() {
      stateHintsService.saveDisplayedValue();
    };
  }
]);
