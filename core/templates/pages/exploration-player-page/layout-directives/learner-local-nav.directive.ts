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
 * @fileoverview Directive for the local navigation in the learner view.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require(
  'pages/exploration-player-page/templates/' +
  'flag-exploration-modal.controller.ts');

require('domain/utilities/url-interpolation.service.ts');
require('domain/exploration/read-only-exploration-backend-api.service.ts');
require('pages/exploration-player-page/services/exploration-engine.service.ts');
require(
  'pages/exploration-player-page/layout-directives/' +
  'feedback-popup.directive.ts');
require('pages/exploration-player-page/services/player-position.service.ts');
require(
  'pages/exploration-player-page/suggestion-modal-for-learner-local-view/' +
  'suggestion-modal-for-exploration-player.service.ts');
require('services/alerts.service.ts');
require('services/user.service.ts');

require(
  'pages/exploration-player-page/exploration-player-page.constants.ajs.ts');

angular.module('oppia').directive('learnerLocalNav', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration-player-page/layout-directives/' +
        'learner-local-nav.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$http', '$uibModal', 'AlertsService', 'ExplorationEngineService',
        'LoaderService', 'ReadOnlyExplorationBackendApiService',
        'SuggestionModalForExplorationPlayerService',
        'UrlInterpolationService', 'UserService',
        'ENABLE_EXP_FEEDBACK_FOR_LOGGED_OUT_USERS', 'FEEDBACK_POPOVER_PATH',
        'FLAG_EXPLORATION_URL_TEMPLATE',
        function(
            $http, $uibModal, AlertsService, ExplorationEngineService,
            LoaderService, ReadOnlyExplorationBackendApiService,
            SuggestionModalForExplorationPlayerService,
            UrlInterpolationService, UserService,
            ENABLE_EXP_FEEDBACK_FOR_LOGGED_OUT_USERS, FEEDBACK_POPOVER_PATH,
            FLAG_EXPLORATION_URL_TEMPLATE) {
          var ctrl = this;
          ctrl.getFeedbackPopoverUrl = function() {
            return UrlInterpolationService.getDirectiveTemplateUrl(
              FEEDBACK_POPOVER_PATH);
          };

          ctrl.showLearnerSuggestionModal = function() {
            SuggestionModalForExplorationPlayerService.showSuggestionModal(
              'edit_exploration_state_content', {});
          };
          ctrl.showFlagExplorationModal = function() {
            $uibModal.open({
              template: require(
                'pages/exploration-player-page/templates/' +
                'flag-exploration-modal.template.html'),
              backdrop: true,
              controller: 'FlagExplorationModalController',
            }).result.then(function(result) {
              var flagExplorationUrl = UrlInterpolationService.interpolateUrl(
                FLAG_EXPLORATION_URL_TEMPLATE, {
                  exploration_id: ctrl.explorationId
                }
              );
              var report = (
                '[' + result.state + '] (' + result.report_type + ') ' +
                result.report_text);
              $http.post(flagExplorationUrl, {
                report_text: report
              }, function(error) {
                AlertsService.addWarning(error);
              });
              $uibModal.open({
                template: require(
                  'pages/exploration-player-page/templates/' +
                  'exploration-successfully-flagged-modal.template.html'),
                backdrop: true,
                controller: 'ConfirmOrCancelModalController'
              }).result.then(function() {}, function() {
                // Note to developers:
                // This callback is triggered when the Cancel button is clicked.
                // No further action is needed.
              });
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };
          ctrl.$onInit = function() {
            ctrl.explorationId = ExplorationEngineService.getExplorationId();
            ReadOnlyExplorationBackendApiService
              .loadExploration(ctrl.explorationId)
              .then(function(exploration) {
                ctrl.canEdit = exploration.can_edit;
              });
            ctrl.username = '';
            ctrl.feedbackOptionIsShown = true;
            LoaderService.showLoadingScreen('Loading');
            UserService.getUserInfoAsync().then(function(userInfo) {
              ctrl.username = userInfo.getUsername();
              if (
                ctrl.username === null &&
                !ENABLE_EXP_FEEDBACK_FOR_LOGGED_OUT_USERS) {
                ctrl.feedbackOptionIsShown = false;
              }
              LoaderService.hideLoadingScreen();
            });
          };
        }
      ]
    };
  }]);
