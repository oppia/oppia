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
 * @fileoverview Directive for the interaction editor section in the state
 * editor.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require('directives/angular-html-bind.directive.ts');
require(
  'pages/exploration-editor-page/editor-tab/templates/modal-templates/' +
  'customize-interaction-modal.controller.ts');

require('domain/exploration/SubtitledHtmlObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require(
  'pages/exploration-editor-page/services/editor-first-time-events.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/services/' +
  'interaction-details-cache.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/services/responses.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-content.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-customization-args.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-next-content-id-index.service');
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
require('services/alerts.service.ts');
require('services/editability.service.ts');
require('services/exploration-html-formatter.service.ts');
require('services/html-escaper.service.ts');
require('services/contextual/window-dimensions.service.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').directive('stateInteractionEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      link: function(scope, element) {
        // This allows the scope to be retrievable during Karma unit testing.
        // See http://stackoverflow.com/a/29833832 for more details.
        element[0].getControllerScope = function() {
          return scope;
        };
      },
      scope: {
        onSaveInteractionCustomizationArgs: '=',
        onSaveInteractionId: '=',
        onSaveNextContentIdIndex: '=',
        onSaveSolution: '=',
        onSaveStateContent: '=',
        recomputeGraph: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/state-editor/state-interaction-editor/' +
        'state-interaction-editor.directive.html'),
      controller: [
        '$scope', '$http', '$rootScope', '$uibModal', '$injector', '$filter',
        'AlertsService', 'HtmlEscaperService', 'StateEditorService',
        'INTERACTION_SPECS', 'StateInteractionIdService',
        'StateCustomizationArgsService', 'StateNextContentIdIndexService',
        'EditabilityService',
        'InteractionDetailsCacheService', 'UrlInterpolationService',
        'ExplorationHtmlFormatterService', 'ResponsesService',
        'SubtitledHtmlObjectFactory', 'StateSolutionService',
        'StateHintsService', 'StateContentService',
        'WindowDimensionsService', function(
            $scope, $http, $rootScope, $uibModal, $injector, $filter,
            AlertsService, HtmlEscaperService, StateEditorService,
            INTERACTION_SPECS, StateInteractionIdService,
            StateCustomizationArgsService, StateNextContentIdIndexService,
            EditabilityService,
            InteractionDetailsCacheService, UrlInterpolationService,
            ExplorationHtmlFormatterService, ResponsesService,
            SubtitledHtmlObjectFactory, StateSolutionService,
            StateHintsService, StateContentService,
            WindowDimensionsService) {
          var ctrl = this;
          ctrl.directiveSubscriptions = new Subscription();
          var DEFAULT_TERMINAL_STATE_CONTENT =
            'Congratulations, you have finished!';

          // Declare dummy submitAnswer() and adjustPageHeight() methods for the
          // interaction preview.
          $scope.submitAnswer = function() {};
          $scope.adjustPageHeight = function() {};

          $scope.getCurrentInteractionName = function() {
            return (
              StateInteractionIdService.savedMemento ?
                INTERACTION_SPECS[StateInteractionIdService.savedMemento].name :
                '');
          };
          $scope.doesCurrentInteractionHaveCustomizations = function() {
            var interactionSpec = INTERACTION_SPECS[
              StateInteractionIdService.savedMemento];
            return (
              interactionSpec &&
              interactionSpec.customization_arg_specs.length > 0);
          };

          var _getInteractionPreviewTag = function(
              interactionCustomizationArgs) {
            if (!StateInteractionIdService.savedMemento) {
              return '';
            }
            return ExplorationHtmlFormatterService.getInteractionHtml(
              StateInteractionIdService.savedMemento,
              interactionCustomizationArgs, false);
          };

          var _updateInteractionPreview = function() {
            $scope.interactionId = StateInteractionIdService.savedMemento;

            var currentCustomizationArgs =
              StateCustomizationArgsService.savedMemento;
            $scope.interactionPreviewHtml = _getInteractionPreviewTag(
              currentCustomizationArgs);
          };

          var _updateAnswerChoices = function() {
            StateEditorService.onUpdateAnswerChoices.emit(
              StateEditorService.getAnswerChoices(
                $scope.interactionId,
                StateCustomizationArgsService.savedMemento));
          };

          // If a terminal interaction is selected for a state with no content,
          // this function sets the content to DEFAULT_TERMINAL_STATE_CONTENT.
          // NOTE TO DEVELOPERS: Callers of this function must ensure that the
          // current active state is a terminal one.
          var updateDefaultTerminalStateContentIfEmpty = function() {
            // Check if the content is currently empty, as expected.
            var previousContent = StateContentService.savedMemento;
            if (!previousContent.isEmpty()) {
              return;
            }
            // Update the state's content.
            StateContentService.displayed.setHtml(
              DEFAULT_TERMINAL_STATE_CONTENT);
            StateContentService.saveDisplayedValue();
            $scope.onSaveStateContent(StateContentService.displayed);
          };

          $scope.onCustomizationModalSavePostHook = function() {
            let nextContentIdIndexHasChanged = (
              StateNextContentIdIndexService.displayed !==
              StateNextContentIdIndexService.savedMemento);
            if (nextContentIdIndexHasChanged) {
              StateNextContentIdIndexService.saveDisplayedValue();
              $scope.onSaveNextContentIdIndex(
                StateNextContentIdIndexService.displayed);
            }

            var hasInteractionIdChanged = (
              StateInteractionIdService.displayed !==
              StateInteractionIdService.savedMemento);
            if (hasInteractionIdChanged) {
              if (INTERACTION_SPECS[StateInteractionIdService.displayed]
                .is_terminal) {
                updateDefaultTerminalStateContentIfEmpty();
              }
              StateInteractionIdService.saveDisplayedValue();
              $scope.onSaveInteractionId(StateInteractionIdService.displayed);
            }

            StateCustomizationArgsService.saveDisplayedValue();
            $scope.onSaveInteractionCustomizationArgs(
              StateCustomizationArgsService.displayed
            );

            InteractionDetailsCacheService.set(
              StateInteractionIdService.savedMemento,
              StateCustomizationArgsService.savedMemento);

            // This must be called here so that the rules are updated before the
            // state graph is recomputed.
            if (hasInteractionIdChanged) {
              StateInteractionIdService.onInteractionIdChanged.emit(
                StateInteractionIdService.savedMemento
              );
            }

            $scope.recomputeGraph();
            _updateInteractionPreview();
            $rootScope.$broadcast(
              'handleCustomArgsUpdate',
              StateEditorService.getAnswerChoices(
                $scope.interactionId,
                StateCustomizationArgsService.savedMemento));
          };

          $scope.openInteractionCustomizerModal = function() {
            if (EditabilityService.isEditable()) {
              AlertsService.clearWarnings();

              $uibModal.open({
                templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                  '/pages/exploration-editor-page/editor-tab/templates/' +
                  'modal-templates/customize-interaction-modal.template.html'),
                backdrop: true,
                controller: 'CustomizeInteractionModalController'
              }).result.then(
                $scope.onCustomizationModalSavePostHook, function() {
                  StateInteractionIdService.restoreFromMemento();
                  StateCustomizationArgsService.restoreFromMemento();
                  StateNextContentIdIndexService.restoreFromMemento();
                });
            }
          };

          $scope.deleteInteraction = function() {
            AlertsService.clearWarnings();
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration-editor-page/editor-tab/templates/' +
                'modal-templates/delete-interaction-modal.template.html'),
              backdrop: true,
              controller: 'ConfirmOrCancelModalController'
            }).result.then(function() {
              StateInteractionIdService.displayed = null;
              StateCustomizationArgsService.displayed = {};
              StateSolutionService.displayed = null;
              InteractionDetailsCacheService.removeDetails(
                StateInteractionIdService.savedMemento);
              StateInteractionIdService.saveDisplayedValue();
              $scope.onSaveInteractionId(StateInteractionIdService.displayed);

              StateCustomizationArgsService.saveDisplayedValue();
              $scope.onSaveInteractionCustomizationArgs(
                StateCustomizationArgsService.displayed
              );

              StateSolutionService.saveDisplayedValue();
              $scope.onSaveSolution(StateSolutionService.displayed);

              StateInteractionIdService.onInteractionIdChanged.emit(
                StateInteractionIdService.savedMemento
              );
              $scope.recomputeGraph();
              _updateInteractionPreview();
              _updateAnswerChoices();
            }, function() {
              AlertsService.clearWarnings();
            });
          };

          $scope.toggleInteractionEditor = function() {
            $scope.interactionEditorIsShown = !$scope.interactionEditorIsShown;
          };

          ctrl.$onInit = function() {
            $scope.EditabilityService = EditabilityService;
            $scope.windowIsNarrow = WindowDimensionsService.isWindowNarrow();
            $scope.interactionEditorIsShown = (
              !WindowDimensionsService.isWindowNarrow());
            $scope.StateInteractionIdService = StateInteractionIdService;
            $scope.hasLoaded = false;
            $scope.customizationModalReopened = false;
            ctrl.directiveSubscriptions.add(
              StateEditorService.onStateEditorInitialized.subscribe(
                (stateData) => {
                  if (stateData === undefined || $.isEmptyObject(stateData)) {
                    throw new Error(
                      'Expected stateData to be defined but ' +
                      'received ' + stateData);
                  }
                  $scope.hasLoaded = false;
                  InteractionDetailsCacheService.reset();
                  ResponsesService.onInitializeAnswerGroups.emit({
                    interactionId: stateData.interaction.id,
                    answerGroups: stateData.interaction.answerGroups,
                    defaultOutcome: stateData.interaction.defaultOutcome,
                    confirmedUnclassifiedAnswers: (
                      stateData.interaction.confirmedUnclassifiedAnswers)
                  });

                  _updateInteractionPreview();
                  _updateAnswerChoices();
                  $scope.hasLoaded = true;
                }
              )
            );

            $scope.getStaticImageUrl = function(imagePath) {
              return UrlInterpolationService.getStaticImageUrl(imagePath);
            };

            $rootScope.$broadcast('interactionEditorInitialized');
            StateEditorService.updateStateInteractionEditorInitialised();
          };

          ctrl.$onDestroy = function() {
            ctrl.directiveSubscriptions.unsubscribe();
          };
        }
      ]
    };
  }]);
