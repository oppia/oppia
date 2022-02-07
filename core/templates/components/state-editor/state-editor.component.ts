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
 * @fileoverview Controller for the state editor directive.
 */

require(
  'components/state-editor/state-hints-editor/state-hints-editor.component.ts');
require(
  'components/state-editor/state-interaction-editor/' +
  'state-interaction-editor.directive.ts');
require(
  'components/state-editor/state-skill-editor/' +
  'state-skill-editor.component.ts');
require(
  'components/state-editor/state-responses-editor/' +
  'state-responses.component.ts');
require(
  'components/state-editor/state-solution-editor/' +
  'state-solution-editor.component.ts');

require('domain/utilities/url-interpolation.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-card-is-checkpoint.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-skill.service');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-name.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-next-content-id-index.service');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-param-changes.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-property.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-solicit-answer-details.service.ts');
require('services/contextual/window-dimensions.service');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-interaction-id.service');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-solution.service');
require(
  'pages/exploration-editor-page/editor-tab/' +
  'exploration-editor-tab.component.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').component('stateEditor', {
  bindings: {
    addState: '=',
    getStateContentPlaceholder: '&stateContentPlaceholder',
    getStateContentSaveButtonPlaceholder: (
      '&stateContentSaveButtonPlaceholder'),
    isInteractionShown: '&interactionIsShown',
    navigateToState: '=',
    onSaveHints: '=',
    onSaveInapplicableSkillMisconceptionIds: '=',
    onSaveInteractionAnswerGroups: '=',
    onSaveInteractionCustomizationArgs: '=',
    onSaveInteractionDefaultOutcome: '=',
    onSaveInteractionId: '=',
    onSaveLinkedSkillId: '=',
    onSaveNextContentIdIndex: '=',
    onSaveSolicitAnswerDetails: '=',
    onSaveSolution: '=',
    onSaveStateContent: '=',
    recomputeGraph: '=',
    refreshWarnings: '=',
    showMarkAllAudioAsNeedingUpdateModalIfRequired: '=',
    explorationIsLinkedToStory: '='
  },
  template: require('./state-editor.component.html'),
  controller: [
    '$scope', 'StateCardIsCheckpointService', 'StateContentService',
    'StateCustomizationArgsService', 'StateEditorService',
    'StateHintsService', 'StateInteractionIdService',
    'StateLinkedSkillIdService', 'StateNameService',
    'StateNextContentIdIndexService', 'StateParamChangesService',
    'StateSolicitAnswerDetailsService', 'StateSolutionService',
    'UrlInterpolationService', 'WindowDimensionsService', 'INTERACTION_SPECS',
    function(
        $scope, StateCardIsCheckpointService, StateContentService,
        StateCustomizationArgsService, StateEditorService,
        StateHintsService, StateInteractionIdService,
        StateLinkedSkillIdService, StateNameService,
        StateNextContentIdIndexService, StateParamChangesService,
        StateSolicitAnswerDetailsService, StateSolutionService,
        UrlInterpolationService, WindowDimensionsService, INTERACTION_SPECS) {
      var ctrl = this;
      ctrl.directiveSubscriptions = new Subscription();
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
        StateEditorService.onStateEditorInitialized.emit($scope.stateData);
      };

      $scope.toggleConceptCard = function() {
        $scope.conceptCardIsShown = !$scope.conceptCardIsShown;
      };

      $scope.updateView = function() {
        $scope.$applyAsync();
      };

      ctrl.$onInit = function() {
        $scope.oppiaBlackImgUrl = UrlInterpolationService.getStaticImageUrl(
          '/avatar/oppia_avatar_100px.svg');
        $scope.currentStateIsTerminal = false;
        $scope.conceptCardIsShown = true;
        $scope.windowIsNarrow = WindowDimensionsService.isWindowNarrow();
        $scope.interactionIdIsSet = false;
        $scope.servicesInitialized = false;
        $scope.stateName = StateEditorService.getActiveStateName();
        ctrl.directiveSubscriptions.add(
          StateInteractionIdService.onInteractionIdChanged.subscribe(
            (newInteractionId) => {
              updateInteractionVisibility(newInteractionId);
            }
          )
        );

        ctrl.directiveSubscriptions.add(
          StateEditorService.onStateEditorInitialized.subscribe(
            (stateData) => {
              if (stateData === undefined || $.isEmptyObject(stateData)) {
                throw new Error(
                  'Expected stateData to be defined but ' +
                  'received ' + stateData);
              }
              $scope.stateData = stateData;
              $scope.stateName = StateEditorService.getActiveStateName();
              StateEditorService.setInteraction(stateData.interaction);
              StateContentService.init(
                $scope.stateName, stateData.content);
              StateLinkedSkillIdService.init(
                $scope.stateName, stateData.linkedSkillId);
              StateHintsService.init(
                $scope.stateName, stateData.interaction.hints);
              StateInteractionIdService.init(
                $scope.stateName, stateData.interaction.id);
              StateCustomizationArgsService.init(
                $scope.stateName, stateData.interaction.customizationArgs);
              StateNextContentIdIndexService.init(
                $scope.stateName, stateData.nextContentIdIndex);
              StateNameService.init($scope.stateName, stateData.name);
              StateParamChangesService.init(
                $scope.stateName, stateData.paramChanges);
              StateSolicitAnswerDetailsService.init(
                $scope.stateName, stateData.solicitAnswerDetails);
              StateCardIsCheckpointService.init(
                $scope.stateName, stateData.cardIsCheckpoint);
              StateSolutionService.init(
                $scope.stateName, stateData.interaction.solution);
              updateInteractionVisibility(stateData.interaction.id);
              $scope.servicesInitialized = true;
            }
          )
        );
        StateEditorService.onStateEditorDirectiveInitialized.emit();
        StateEditorService.updateStateEditorDirectiveInitialised();
      };
      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };
    }
  ]
});
