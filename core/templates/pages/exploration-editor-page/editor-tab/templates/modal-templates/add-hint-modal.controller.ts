// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for add hint modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

require(
  'components/state-editor/state-editor-properties-services/' +
  'state-hints.service.ts');
require('domain/exploration/HintObjectFactory.ts');
require('services/generate-content-id.service.ts');
require('services/context.service.ts');

angular.module('oppia').controller('AddHintModalController', [
  '$controller', '$scope', '$uibModalInstance', 'ContextService',
  'GenerateContentIdService', 'HintObjectFactory', 'StateHintsService',
  'COMPONENT_NAME_HINT',
  function(
      $controller, $scope, $uibModalInstance, ContextService,
      GenerateContentIdService, HintObjectFactory, StateHintsService,
      COMPONENT_NAME_HINT) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });

    $scope.HINT_FORM_SCHEMA = {
      type: 'html',
      ui_config: {
        hide_complex_extensions: (
          ContextService.getEntityType() === 'question')
      }
    };

    $scope.tmpHint = '';
    $scope.addHintForm = {};
    $scope.hintIndex = StateHintsService.displayed.length + 1;
    $scope.saveHint = function() {
      var contentId = GenerateContentIdService.getNextStateId(
        COMPONENT_NAME_HINT);
      // Close the modal and save it afterwards.
      $uibModalInstance.close({
        hint: angular.copy(
          HintObjectFactory.createNew(contentId, $scope.tmpHint)),
        contentId: contentId
      });
    };
  }
]);
