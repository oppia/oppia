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
 * @fileoverview Directive for the state editor directive.
 */

require(
  'pages/state-editor-page/state-content-editor/state-content-editor.directive.ts');
require(
  'pages/state-editor-page/state-hints-editor/state-hints-editor.directive.ts');
require(
  'pages/state-editor-page/state-interaction-editor/' +
  'state-interaction-editor.directive.ts');
require('pages/state-editor-page/state-responses/state-responses.directive.ts');
require(
  'pages/state-editor-page/state-solution-editor/' +
  'state-solution-editor.directive.ts');

require('domain/utilities/UrlInterpolationService.ts');
require(
  'pages/exploration-editor-page/exploration-editor-tab/' +
  'exploration-editor-tab-services/responses.service.ts');
require(
  'pages/state-editor-page/state-editor-properties-services/' +
  'state-property.service.ts');

oppia.directive('stateEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        addState: '=',
        getStateContentPlaceholder: '&stateContentPlaceholder',
        isInteractionShown: '&interactionIsShown',
        navigateToState: '=',
        onSaveHints: '=',
        onSaveInteractionAnswerGroups: '=',
        onSaveInteractionId: '=',
        onSaveInteractionCustomizationArgs: '=',
        onSaveInteractionDefaultOutcome: '=',
        onSaveSolution: '=',
        onSaveStateContent: '=',
        recomputeGraph: '=',
        refreshWarnings: '=',
        showMarkAllAudioAsNeedingUpdateModalIfRequired: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/state-editor-page/state-editor.directive.html'),
      controller: [
        '$scope', '$rootScope', 'INTERACTION_SPECS', 'StateEditorService',
        'StateContentService', 'StateHintsService', 'StateSolutionService',
        'StateInteractionIdService', 'StateCustomizationArgsService',
        function(
            $scope, $rootScope, INTERACTION_SPECS, StateEditorService,
            StateContentService, StateHintsService, StateSolutionService,
            StateInteractionIdService, StateCustomizationArgsService) {
          $scope.oppiaBlackImgUrl = UrlInterpolationService.getStaticImageUrl(
            '/avatar/oppia_avatar_100px.svg');
          $scope.currentStateIsTerminal = false;
          $scope.interactionIdIsSet = false;
          $scope.servicesInitialized = false;
          $scope.stateName = StateEditorService.getActiveStateName();
          var updateInteractionVisibility = function(newInteractionId) {
            $scope.interactionIdIsSet = Boolean(newInteractionId);
            $scope.currentInteractionCanHaveSolution = Boolean(
              $scope.interactionIdIsSet &&
              INTERACTION_SPECS[newInteractionId].can_have_solution);
            $scope.currentStateIsTerminal = Boolean(
              $scope.interactionIdIsSet && INTERACTION_SPECS[
                newInteractionId].is_terminal);
          };

          $scope.reinitializeEditor = function() {
            $rootScope.$broadcast('stateEditorInitialized', $scope.stateData);
          };

          $scope.$on('onInteractionIdChanged', function(evt, newInteractionId) {
            updateInteractionVisibility(newInteractionId);
          });

          $scope.$on('stateEditorInitialized', function(evt, stateData) {
            $scope.stateData = stateData;
            $scope.stateName = StateEditorService.getActiveStateName();
            StateEditorService.setInteraction(stateData.interaction);
            StateContentService.init(
              $scope.stateName, stateData.content);
            StateHintsService.init(
              $scope.stateName, stateData.interaction.hints);
            StateInteractionIdService.init(
              $scope.stateName, stateData.interaction.id);
            StateCustomizationArgsService.init(
              $scope.stateName, stateData.interaction.customizationArgs);
            StateSolutionService.init(
              $scope.stateName, stateData.interaction.solution);
            updateInteractionVisibility(stateData.interaction.id);
            $scope.servicesInitialized = true;
          });

          $rootScope.$broadcast('stateEditorDirectiveInitialized');
        }
      ],
      controllerAs: 'stateEditorController'
    };
  }]);
