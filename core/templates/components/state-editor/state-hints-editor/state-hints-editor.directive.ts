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
 * @fileoverview Directive for the add and view hints section of the state
 * editor.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require('components/state-directives/hint-editor/hint-editor.directive.ts');
require(
  'components/state-directives/response-header/response-header.directive.ts');
require(
  'pages/exploration-editor-page/editor-tab/templates/modal-templates/' +
  'add-hint-modal.controller.ts');

require('domain/exploration/HintObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-hints.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-interaction-id.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-solution.service.ts');
require('filters/format-rte-preview.filter.ts');
require('services/alerts.service.ts');
require('services/context.service.ts');
require('services/editability.service.ts');
require('services/generate-content-id.service.ts');

angular.module('oppia').directive('stateHintsEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        onSaveHints: '=',
        onSaveSolution: '=',
        showMarkAllAudioAsNeedingUpdateModalIfRequired: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/state-editor/state-hints-editor/' +
        'state-hints-editor.directive.html'),
      controller: [
        '$scope', '$rootScope', '$uibModal', '$filter', 'AlertsService',
        'EditabilityService', 'StateEditorService', 'StateHintsService',
        'StateInteractionIdService', 'StateSolutionService',
        'UrlInterpolationService', 'INTERACTION_SPECS',
        function(
            $scope, $rootScope, $uibModal, $filter, AlertsService,
            EditabilityService, StateEditorService, StateHintsService,
            StateInteractionIdService, StateSolutionService,
            UrlInterpolationService, INTERACTION_SPECS) {
          var ctrl = this;
          var _getExistingHintsContentIds = function() {
            var existingContentIds = [];
            StateHintsService.displayed.forEach(function(hint) {
              var contentId = hint.hintContent.getContentId();
              existingContentIds.push(contentId);
            });
            return existingContentIds;
          };

          $scope.getHintButtonText = function() {
            var hintButtonText = '+ Add Hint';
            if ($scope.StateHintsService.displayed) {
              if ($scope.StateHintsService.displayed.length >= 5) {
                hintButtonText = 'Limit Reached';
              }
            }
            return hintButtonText;
          };

          $scope.getHintSummary = function(hint) {
            var hintAsPlainText = $filter(
              'formatRtePreview')(hint.hintContent.getHtml());
            return hintAsPlainText;
          };

          $scope.changeActiveHintIndex = function(newIndex) {
            var currentActiveIndex = StateHintsService.getActiveHintIndex();
            if (currentActiveIndex !== null && (
              !StateHintsService.displayed[currentActiveIndex]
                .hintContent.getHtml())) {
              if (StateSolutionService.savedMemento &&
                StateHintsService.displayed.length === 1) {
                openDeleteLastHintModal();
                return;
              } else {
                AlertsService.addInfoMessage('Deleting empty hint.');
                StateHintsService.displayed.splice(currentActiveIndex, 1);
                StateHintsService.saveDisplayedValue();
                $scope.onSaveHints(StateHintsService.displayed);
              }
            }
            // If the current hint is being clicked on again, close it.
            if (newIndex === StateHintsService.getActiveHintIndex()) {
              StateHintsService.setActiveHintIndex(null);
            } else {
              StateHintsService.setActiveHintIndex(newIndex);
            }
          };

          // This returns false if the current interaction ID is null.
          $scope.isCurrentInteractionLinear = function() {
            var interactionId = StateInteractionIdService.savedMemento;
            return interactionId && INTERACTION_SPECS[interactionId].is_linear;
          };

          $scope.openAddHintModal = function() {
            if ($scope.StateHintsService.displayed.length === 5) {
              return;
            }
            var existingHintsContentIds = _getExistingHintsContentIds();
            AlertsService.clearWarnings();
            $rootScope.$broadcast('externalSave');

            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration-editor-page/editor-tab/templates/' +
                'modal-templates/add-hint-modal.template.html'),
              backdrop: 'static',
              resolve: {
                existingHintsContentIds: () => existingHintsContentIds
              },
              controller: 'AddHintModalController'
            }).result.then(function(result) {
              StateHintsService.displayed.push(result.hint);
              StateHintsService.saveDisplayedValue();
              $scope.onSaveHints(StateHintsService.displayed);
            }, function() {
              AlertsService.clearWarnings();
            });
          };

          var openDeleteLastHintModal = function() {
            AlertsService.clearWarnings();

            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration-editor-page/editor-tab/templates/' +
                'modal-templates/delete-last-hint-modal.template.html'),
              backdrop: true,
              controller: 'ConfirmOrCancelModalController'
            }).result.then(function() {
              var solutionContentId = StateSolutionService.displayed
                .explanation.getContentId();
              StateSolutionService.displayed = null;
              StateSolutionService.saveDisplayedValue();
              $scope.onSaveSolution(StateSolutionService.displayed);

              var hintContentId = StateHintsService.displayed[0]
                .hintContent.getContentId();
              StateHintsService.displayed = [];
              StateHintsService.saveDisplayedValue();
              $scope.onSaveHints(StateHintsService.displayed);
            }, function() {
              AlertsService.clearWarnings();
            });
          };

          $scope.deleteHint = function(index, evt) {
            // Prevent clicking on the delete button from also toggling the
            // display state of the hint.
            evt.stopPropagation();

            AlertsService.clearWarnings();
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration-editor-page/editor-tab/templates/' +
                'modal-templates/delete-hint-modal.template.html'),
              backdrop: true,
              controller: 'ConfirmOrCancelModalController'
            }).result.then(function() {
              if (StateSolutionService.savedMemento &&
                StateHintsService.savedMemento.length === 1) {
                openDeleteLastHintModal();
              } else {
                var hintContentId = StateHintsService.displayed[index]
                  .hintContent.getContentId();
                StateHintsService.displayed.splice(index, 1);
                StateHintsService.saveDisplayedValue();
                $scope.onSaveHints(StateHintsService.displayed);
              }

              if (index === StateHintsService.getActiveHintIndex()) {
                StateHintsService.setActiveHintIndex(null);
              }
            }, function() {
              AlertsService.clearWarnings();
            });
          };

          $scope.onSaveInlineHint = function() {
            StateHintsService.saveDisplayedValue();
            $scope.onSaveHints(StateHintsService.displayed);
          };

          ctrl.$onInit = function() {
            $scope.EditabilityService = EditabilityService;
            $scope.StateHintsService = StateHintsService;
            StateHintsService.setActiveHintIndex(null);
            $scope.canEdit = EditabilityService.isEditable();
            $scope.getStaticImageUrl = function(imagePath) {
              return UrlInterpolationService.getStaticImageUrl(imagePath);
            };
            // When the page is scrolled so that the top of the page is above
            // the browser viewport, there are some bugs in the positioning of
            // the helper. This is a bug in jQueryUI that has not been fixed
            // yet. For more details, see http://stackoverflow.com/q/5791886
            $scope.HINT_LIST_SORTABLE_OPTIONS = {
              axis: 'y',
              cursor: 'move',
              handle: '.oppia-hint-sort-handle',
              items: '.oppia-sortable-hint',
              revert: 100,
              tolerance: 'pointer',
              start: function(e, ui) {
                $rootScope.$broadcast('externalSave');
                StateHintsService.setActiveHintIndex(null);
                ui.placeholder.height(ui.item.height());
              },
              stop: function() {
                StateHintsService.saveDisplayedValue();
                $scope.onSaveHints(StateHintsService.displayed);
              }
            };
            StateEditorService.updateStateHintsEditorInitialised();
          };
        }
      ]
    };
  }]);
