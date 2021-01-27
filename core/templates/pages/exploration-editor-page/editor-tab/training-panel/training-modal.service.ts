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
 * @fileoverview Service which handles opening and closing
 * the training modal used for unresolved answers.
 */

require(
  'pages/exploration-editor-page/editor-tab/training-panel/' +
  'training-panel.component.ts');

require('domain/exploration/AnswerGroupObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-editor-page/services/angular-name.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'pages/exploration-editor-page/services/exploration-warnings.service.ts');
require('pages/exploration-editor-page/services/graph-data.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/services/responses.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/training-panel/' +
  'training-data.service.ts');
require(
  'pages/exploration-player-page/services/answer-classification.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-property.service.ts');
require('services/alerts.service.ts');
require('services/context.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/training-panel/' +
  'training-modal.controller');
require('services/external-save.service.ts');

angular.module('oppia').factory('TrainingModalService', [
  '$uibModal', 'AlertsService', 'ExternalSaveService',
  'UrlInterpolationService',
  function(
      $uibModal, AlertsService, ExternalSaveService,
      UrlInterpolationService) {
    return {
      /**
      * Opens unresolved answer trainer modal for given answer.
      * @param {Object} unhandledAnswer - The answer to be trained.
      * @param {requestCallback} finishTrainingCallback - Function to call when
          answer has been trained.
      */
      openTrainUnresolvedAnswerModal: function(
          unhandledAnswer, finishTrainingCallback) {
        AlertsService.clearWarnings();
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration-editor-page/editor-tab/templates/' +
            'modal-templates/training-unresolved-answer-modal.template.html'),
          backdrop: 'static',
          resolve: {
            unhandledAnswer: function() {
              return unhandledAnswer;
            },
            finishTrainingCallback: function() {
              return finishTrainingCallback;
            }
          },
          controller: 'TrainingModalController'
        });
        // Save the modified training data externally in state content.
        ExternalSaveService.onExternalSave.emit();
      }
    };
  }
]);
