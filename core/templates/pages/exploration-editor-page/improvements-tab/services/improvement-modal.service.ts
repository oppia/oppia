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
  'pages/exploration-editor-page/feedback-tab/services/thread-data.service.ts');
require(
  'pages/exploration-editor-page/feedback-tab/services/' +
  'thread-status-display.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'learner-answer-details-data.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'user-exploration-permissions.service.ts');
require(
  'pages/exploration-editor-page/suggestion-modal-for-editor-view/' +
  'suggestion-modal-for-exploration-editor.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/exploration-html-formatter.service.ts');
/* eslint-disable max-len */
require('pages/exploration-editor-page/improvements-tab/services/improvement-playthrough-modal.controller.ts');
require('pages/exploration-editor-page/improvements-tab/services/improvement-learner-answer-details-modal.controller.ts');
require('pages/exploration-editor-page/improvements-tab/services/improvement-feedback-thread-modal.controller.ts');
require('pages/exploration-editor-page/improvements-tab/services/improvement-suggestion-thread-modal.controller.ts');
require('pages/exploration-editor-page/improvements-tab/services/improvement-confirmation-modal.controller.ts');
/* eslint-enable max-len */

angular.module('oppia').factory('ImprovementModalService', [
  '$uibModal', 'ThreadDataService', 'UrlInterpolationService',
  'UserExplorationPermissionsService', 'UserService',
  function(
      $uibModal, ThreadDataService, UrlInterpolationService,
      UserExplorationPermissionsService, UserService) {
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
          controller: 'ImprovementPlaythoughModalController'
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
      openFeedbackThread: function(thread) {
        return $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration-editor-page/improvements-tab/templates/' +
            'feedback-thread-modal.template.html'),
          resolve: {
            messages: ThreadDataService.getMessagesAsync(thread),
            isUserLoggedIn:
              UserService.getUserInfoAsync().then(u => u.isLoggedIn()),
            thread: () => thread
          },
          controller: 'ImprovementFeedbackThreadModalController',
          backdrop: 'static',
          size: 'lg',
        });
      },

      openSuggestionThread: function(thread) {
        return $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration-editor-page/improvements-tab/templates/' +
            'suggestion-thread-modal.template.html'),
          backdrop: 'static',
          size: 'lg',
          resolve: {
            messages: ThreadDataService.getMessagesAsync(thread),
            isUserLoggedIn:
              UserService.getUserInfoAsync().then(u => u.isLoggedIn()),
            thread: () => thread
          },
          controller: 'ImprovementSuggestionThreadModalController',
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
