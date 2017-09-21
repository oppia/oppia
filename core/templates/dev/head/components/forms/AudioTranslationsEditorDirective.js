// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the audio translations editor for subtitled HTML.
 */

oppia.directive('audioTranslationsEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        subtitledHtml: '=',
        // A function that must be called at the outset of every attempt to
        // edit, even if the action is not subsequently taken through to
        // completion.
        getOnStartEditFn: '&onStartEdit',
        // A function that must be called on completion of an action which
        // changes the audio translation data in a persistent way.
        getOnChangeFn: '&onChange'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/forms/audio_translations_editor_directive.html'),
      controller: [
        '$scope', '$modal', '$sce', 'stateContentService', 'editabilityService',
        'LanguageUtilService', 'AlertsService', 'ExplorationContextService',
        'AssetsBackendApiService',
        function(
            $scope, $modal, $sce, stateContentService, editabilityService,
            LanguageUtilService, AlertsService, ExplorationContextService,
            AssetsBackendApiService) {
          $scope.isEditable = editabilityService.isEditable;
          $scope.audioTranslations = (
            $scope.subtitledHtml.getBindableAudioTranslations());
          var explorationId = ExplorationContextService.getExplorationId();

          $scope.getAudioLanguageDescription = (
            LanguageUtilService.getAudioLanguageDescription);

          $scope.getAudioTranslationFullUrl = function(filename) {
            return $sce.trustAsResourceUrl(
              AssetsBackendApiService.getAudioDownloadUrl(
                explorationId, filename));
          };

          $scope.toggleNeedsUpdateAttribute = function(languageCode) {
            $scope.getOnStartEditFn()();
            $scope.subtitledHtml.toggleNeedsUpdateAttribute(languageCode);
            $scope.getOnChangeFn()();
          };

          $scope.openAddAudioTranslationModal = function() {
            var allowedAudioLanguageCodes = (
              LanguageUtilService.getComplementAudioLanguageCodes(
                $scope.subtitledHtml.getAudioLanguageCodes()));

            if (allowedAudioLanguageCodes.length === 0) {
              AlertsService.addWarning(
                'Sorry, there are no more available languages to translate ' +
                'into.');
              return;
            }

            $scope.getOnStartEditFn()();
            $modal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/components/forms/' +
                'add_audio_translation_modal_directive.html'),
              backdrop: 'static',
              resolve: {
                allowedAudioLanguageCodes: function() {
                  return allowedAudioLanguageCodes;
                }
              },
              controller: [
                '$scope', '$modalInstance', 'LanguageUtilService',
                'allowedAudioLanguageCodes', 'AlertsService',
                'ExplorationContextService', 'IdGenerationService',
                function(
                    $scope, $modalInstance, LanguageUtilService,
                    allowedAudioLanguageCodes, AlertsService,
                    ExplorationContextService, IdGenerationService) {
                  var ERROR_MESSAGE_BAD_FILE_UPLOAD = (
                    'There was an error uploading the audio file.');
                  var BUTTON_TEXT_SAVE = 'Save';
                  var BUTTON_TEXT_SAVING = 'Saving...';

                  $scope.languageCodesAndDescriptions = (
                    allowedAudioLanguageCodes.map(function(languageCode) {
                      return {
                        code: languageCode,
                        description: (
                          LanguageUtilService.getAudioLanguageDescription(
                            languageCode))
                      };
                    }));

                  // Whether there was an error uploading the audio file.
                  $scope.errorMessage = null;
                  $scope.saveButtonText = BUTTON_TEXT_SAVE;
                  $scope.saveInProgress = false;

                  $scope.languageCode = allowedAudioLanguageCodes[0];
                  var uploadedFile = null;

                  $scope.isAudioTranslationValid = function() {
                    return (
                      allowedAudioLanguageCodes.indexOf(
                        $scope.languageCode) !== -1 &&
                      uploadedFile !== null &&
                      uploadedFile.size !== null &&
                      uploadedFile.size > 0);
                  };

                  $scope.updateUploadedFile = function(file) {
                    $scope.errorMessage = null;
                    uploadedFile = file;
                  };

                  $scope.clearUploadedFile = function() {
                    $scope.errorMessage = null;
                    uploadedFile = null;
                  };

                  var generateNewFilename = function() {
                    return (
                      'content-' + $scope.languageCode + '-' +
                      IdGenerationService.generateNewId() + '.mp3');
                  };

                  $scope.save = function() {
                    if ($scope.isAudioTranslationValid()) {
                      $scope.saveButtonText = BUTTON_TEXT_SAVING;
                      $scope.saveInProgress = true;
                      var generatedFilename = generateNewFilename();
                      var explorationId = (
                        ExplorationContextService.getExplorationId());
                      AssetsBackendApiService.saveAudio(
                        explorationId, generatedFilename, uploadedFile
                      ).then(function() {
                        $modalInstance.close({
                          languageCode: $scope.languageCode,
                          filename: generatedFilename,
                          fileSizeBytes: uploadedFile.size
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

                  $scope.cancel = function() {
                    $modalInstance.dismiss('cancel');
                    AlertsService.clearWarnings();
                  };
                }
              ]
            }).result.then(function(result) {
              $scope.subtitledHtml.addAudioTranslation(
                result.languageCode, result.filename, result.fileSizeBytes);
              $scope.getOnChangeFn()();
            });
          };

          $scope.openDeleteAudioTranslationModal = function(languageCode) {
            $scope.getOnStartEditFn()();

            $modal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/components/forms/' +
                'delete_audio_translation_modal_directive.html'),
              backdrop: true,
              resolve: {
                languageCode: function() {
                  return languageCode;
                }
              },
              controller: [
                '$scope', '$modalInstance', 'LanguageUtilService',
                'languageCode',
                function(
                    $scope, $modalInstance, LanguageUtilService,
                    languageCode) {
                  $scope.languageDescription = (
                    LanguageUtilService.getAudioLanguageDescription(
                      languageCode));

                  $scope.reallyDelete = function() {
                    $modalInstance.close();
                  };

                  $scope.cancel = function() {
                    $modalInstance.dismiss('cancel');
                    AlertsService.clearWarnings();
                  };
                }
              ]
            }).result.then(function(result) {
              $scope.subtitledHtml.deleteAudioTranslation(languageCode);
              $scope.getOnChangeFn()();
            });
          };
        }
      ]
    };
  }
]);
