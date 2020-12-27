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
 * @fileoverview Service which handles opening and closing
 * the training data editor of an answer group.
 */

require('filters/truncate-input-based-on-interaction-answer-type.filter.ts');
require(
  'pages/exploration-editor-page/editor-tab/test-interaction-panel/' +
  'test-interaction-panel.component.ts');

require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-editor-page/services/angular-name.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/services/responses.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/training-panel/' +
  'training-data.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/training-panel/' +
  'training-modal.service.ts');
require(
  'pages/exploration-player-page/services/answer-classification.service.ts');
require(
  'pages/exploration-player-page/services/current-interaction.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-property.service.ts');
require('services/alerts.service.ts');
require('services/context.service.ts');
require('services/exploration-html-formatter.service.ts');
require('services/stateful/focus-manager.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/training-panel/' +
  'training-data-editor-panel-modal.controller.ts');
require('services/external-save.service.ts');

angular.module('oppia').factory('TrainingDataEditorPanelService', [
  '$uibModal', 'AlertsService', 'ExternalSaveService',
  'UrlInterpolationService',
  function(
      $uibModal, AlertsService, ExternalSaveService,
      UrlInterpolationService) {
    return {
      /**
      * Opens training data editor for currently selected answer group.
      */
      openTrainingDataEditor: function() {
        AlertsService.clearWarnings();
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration-editor-page/editor-tab/templates/' +
            'training-data-editor.template.html'),
          backdrop: 'static',
          controller: 'TrainingDataEditorPanelServiceModalController'
        });
        // Save the modified training data externally in state content.
        ExternalSaveService.onExternalSave.emit();
      }
    };
  }
]);
