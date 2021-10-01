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
 * @fileoverview Controller for add audio translation modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

require('services/assets-backend-api.service.ts');
require('services/context.service.ts');

angular.module('oppia').controller('AddAudioTranslationModalController', [
  '$controller', '$q', '$rootScope', '$scope', '$uibModalInstance',
  'AssetsBackendApiService', 'ContextService', 'audioFile', 'generatedFilename',
  'isAudioAvailable', 'languageCode',
  function(
      $controller, $q, $rootScope, $scope, $uibModalInstance,
      AssetsBackendApiService, ContextService, audioFile, generatedFilename,
      isAudioAvailable, languageCode) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });

    var ERROR_MESSAGE_BAD_FILE_UPLOAD = (
      'There was an error uploading the audio file.');
    var BUTTON_TEXT_SAVE = 'Save';
    var BUTTON_TEXT_SAVING = 'Saving...';

    // Whether there was an error uploading the audio file.
    $scope.errorMessage = null;
    $scope.saveButtonText = BUTTON_TEXT_SAVE;
    $scope.saveInProgress = false;
    $scope.isAudioAvailable = isAudioAvailable;
    var uploadedFile = null;
    $scope.droppedFile = audioFile;

    $scope.isAudioTranslationValid = function() {
      return (
        uploadedFile !== null &&
        uploadedFile.size !== null &&
        uploadedFile.size > 0);
    };

    $scope.updateUploadedFile = function(file) {
      $scope.errorMessage = null;
      uploadedFile = file;
      $rootScope.$applyAsync();
    };

    $scope.clearUploadedFile = function() {
      $scope.errorMessage = null;
      uploadedFile = null;
      $rootScope.$applyAsync();
    };

    $scope.confirm = function() {
      if ($scope.isAudioTranslationValid()) {
        $scope.saveButtonText = BUTTON_TEXT_SAVING;
        $scope.saveInProgress = true;
        var explorationId = (
          ContextService.getExplorationId());
        $q.when(
          AssetsBackendApiService.saveAudio(
            explorationId, generatedFilename, uploadedFile)
        ).then(function(response) {
          $uibModalInstance.close({
            languageCode: languageCode,
            filename: generatedFilename,
            fileSizeBytes: uploadedFile.size,
            durationSecs: response.duration_secs
          });
        }, function(errorResponse) {
          $scope.errorMessage = (
            errorResponse.error || ERROR_MESSAGE_BAD_FILE_UPLOAD);
          uploadedFile = null;
          $scope.saveButtonText = BUTTON_TEXT_SAVE;
          $scope.saveInProgress = false;
        });
      }
    };
  }
]);
