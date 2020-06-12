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
 * @fileoverview Directive for the state graph visualization.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'loading-dots.directive.ts');
require(
  'pages/exploration-editor-page/editor-tab/templates/modal-templates/' +
  'teach-oppia-modal.controller.ts');

require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-editor-page/services/exploration-rights.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-property.service.ts');
require('filters/truncate-input-based-on-interaction-answer-type.filter.ts');
require('services/editability.service.ts');
require('services/improvements.service.ts');
require('services/state-top-answers-stats.service.ts');

require(
  'pages/exploration-editor-page/exploration-editor-page.constants.ajs.ts');

angular.module('oppia').directive('unresolvedAnswersOverview', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration-editor-page/editor-tab/' +
        'unresolved-answers-overview/' +
        'unresolved-answers-overview.directive.html'),
      controller: [
        '$rootScope', '$scope', '$uibModal', 'EditabilityService',
        'ExplorationRightsService', 'ExplorationStatesService',
        'ImprovementsService', 'StateEditorService',
        'StateInteractionIdService', 'StateTopAnswersStatsService',
        'INTERACTION_SPECS', 'SHOW_TRAINABLE_UNRESOLVED_ANSWERS',
        function(
            $rootScope, $scope, $uibModal, EditabilityService,
            ExplorationRightsService, ExplorationStatesService,
            ImprovementsService, StateEditorService,
            StateInteractionIdService, StateTopAnswersStatsService,
            INTERACTION_SPECS, SHOW_TRAINABLE_UNRESOLVED_ANSWERS) {
          var ctrl = this;
          var MAXIMUM_UNRESOLVED_ANSWERS = 5;
          var MINIMUM_UNRESOLVED_ANSWER_FREQUENCY = 2;

          var isStateRequiredToBeResolved = function(stateName) {
            return ImprovementsService
              .isStateForcedToResolveOutstandingUnaddressedAnswers(
                ExplorationStatesService.getState(stateName));
          };

          $scope.isUnresolvedAnswersOverviewShown = function() {
            var activeStateName = StateEditorService.getActiveStateName();
            return StateTopAnswersStatsService.hasStateStats(activeStateName) &&
              isStateRequiredToBeResolved(activeStateName);
          };

          $scope.getCurrentInteractionId = function() {
            return StateInteractionIdService.savedMemento;
          };

          $scope.isCurrentInteractionLinear = function() {
            var interactionId = $scope.getCurrentInteractionId();
            return interactionId && INTERACTION_SPECS[interactionId].is_linear;
          };

          $scope.isCurrentInteractionTrainable = function() {
            var interactionId = $scope.getCurrentInteractionId();
            return (
              interactionId &&
              INTERACTION_SPECS[interactionId].is_trainable);
          };

          $scope.isEditableOutsideTutorialMode = function() {
            return EditabilityService.isEditableOutsideTutorialMode();
          };

          $scope.openTeachOppiaModal = function() {
            $rootScope.$broadcast('externalSave');

            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration-editor-page/editor-tab/templates/' +
                'modal-templates/teach-oppia-modal.template.html'),
              backdrop: true,
              controller: 'TeachOppiaModalController'
            }).result.then(function() {}, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          $scope.getUnresolvedStateStats = function() {
            return StateTopAnswersStatsService.getUnresolvedStateStats(
              StateEditorService.getActiveStateName());
          };
          ctrl.$onInit = function() {
            $scope.unresolvedAnswersOverviewIsShown = false;
            $scope.SHOW_TRAINABLE_UNRESOLVED_ANSWERS = (
              SHOW_TRAINABLE_UNRESOLVED_ANSWERS);
          };
        }
      ]
    };
  }]);
