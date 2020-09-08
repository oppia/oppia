// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for creating modals associated to the improvements tab.
 */

require(
  'pages/exploration-editor-page/services/' +
  'user-exploration-permissions.service.ts');
require('domain/utilities/url-interpolation.service.ts');

angular.module('oppia').factory('ImprovementModalService', [
  '$uibModal', 'UrlInterpolationService', 'UserExplorationPermissionsService',
  function(
      $uibModal, UrlInterpolationService, UserExplorationPermissionsService) {
    return {
      /**
       * Opens the modal for displaying playthrough actions.
       * @param {Playthrough} playthrough.
       * @param {int} playthroughIndex.
       */
      openPlaythroughModal: function(playthrough, playthroughIndex) {
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration-editor-page/statistics-tab/templates/' +
            'playthrough-modal.template.html'),
          backdrop: true,
          resolve: {
            playthrough: () => playthrough,
            playthroughIndex: () => playthroughIndex
          },
          controller: 'ImprovementPlaythoughModalController',
          windowClass: 'oppia-improvement-playthrough-modal'
        });
      },
      openLearnerAnswerDetails: function(learnerAnswerDetails) {
        return $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration-editor-page/improvements-tab/templates/' +
            'answer-details-modal.template.html'),
          resolve: {
            isEditable: () => (
              UserExplorationPermissionsService.getPermissionsAsync()
                .then(permissions => permissions.canEdit)),
            learnerAnswerDetails: () => learnerAnswerDetails
          },
          controller: 'ImprovementLearnerAnswerDetailsModalController'
        });
      },
      /**
       * @returns {Promise} - State is resolved when the confirmation button is
       *    pressed, or rejected when the cancel button is pressed.
       */
      openConfirmationModal: function(message, buttonText, buttonClass) {
        return $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/components/common-layout-directives/common-elements/' +
            'confirmation-modal.template.html'),
          backdrop: true,
          resolve: {
            message: () => message,
            buttonText: () => buttonText,
            buttonClass: () => buttonClass
          },
          controller: 'ImprovementConfirmationModalController'
        });
      },
    };
  },
]);
