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
        componentName: '@',
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
        '$scope', '$uibModal', '$sce', 'stateContentService',
        'EditabilityService', 'LanguageUtilService', 'AlertsService',
        'ExplorationContextService', 'AssetsBackendApiService',
        function(
            $scope, $uibModal, $sce, stateContentService, EditabilityService,
            LanguageUtilService, AlertsService, ExplorationContextService,
            AssetsBackendApiService) {
          $scope.isEditable = EditabilityService.isEditable;

          // The following if-condition is present because, sometimes,
          // Travis-CI throws an error of the form "Cannot read property
          // getBindableAudioTranslations of undefined". It looks like there is
          // a race condition that is causing this directive to get
          // initialized when it shouldn't. This is hard to reproduce
          // deterministically, hence this guard.
          if ($scope.subtitledHtml) {
            $scope.audioTranslations = (
              $scope.subtitledHtml.getBindableAudioTranslations());
          }

          var explorationId = ExplorationContextService.getExplorationId();

          $scope.getAudioLanguageDescription = (
            LanguageUtilService.getAudioLanguageDescription);

          $scope.getAudioTranslationFullUrl = function(filename) {
            return $sce.trustAsResourceUrl(
              AssetsBackendApiService.getAudioDownloadUrl(
                explorationId, filename));
          };

          $scope.getNeedsUpdateTooltipMessage = function(needsUpdate) {
            if (needsUpdate) {
              return ($scope.isEditable() ? 'Audio might not match text.' +
                ' Reupload the file, or click to unflag.' :
                'Audio might not match text.');
            } else {
              return ($scope.isEditable() ? 'Click to mark this audio ' +
                'translation as not matching text.' :
                'Audio is matching text.');
            }
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
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/components/forms/' +
                'add_audio_translation_modal_directive.html'),
              backdrop: 'static',
              resolve: {
                allowedAudioLanguageCodes: function() {
                  return allowedAudioLanguageCodes;
                },
                componentName: function() {
                  return $scope.componentName;
                }
              },
              controller: [
                '$scope', '$window', '$uibModalInstance', 'LanguageUtilService',
                'allowedAudioLanguageCodes', 'AlertsService',
                'ExplorationContextService', 'IdGenerationService',
                'componentName',
                function(
                    $scope, $window, $uibModalInstance, LanguageUtilService,
                    allowedAudioLanguageCodes, AlertsService,
                    ExplorationContextService, IdGenerationService,
                    componentName) {
                  var ERROR_MESSAGE_BAD_FILE_UPLOAD = (
                    'There was an error uploading the audio file.');
                  var BUTTON_TEXT_SAVE = 'Save';
                  var BUTTON_TEXT_SAVING = 'Saving...';
                  var prevLanguageCode = $window.localStorage.getItem(
                    'last_uploaded_audio_lang');

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
                  $scope.languageCode =
                    allowedAudioLanguageCodes.indexOf(prevLanguageCode) !== -1 ?
                      prevLanguageCode : allowedAudioLanguageCodes[0];
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
                    return componentName + '-' +
                      $scope.languageCode + '-' +
                      IdGenerationService.generateNewId() + '.mp3';
                  };

                  $scope.save = function() {
                    if ($scope.isAudioTranslationValid()) {
                      $scope.saveButtonText = BUTTON_TEXT_SAVING;
                      $scope.saveInProgress = true;
                      var generatedFilename = generateNewFilename();
                      $window.localStorage.setItem(
                        'last_uploaded_audio_lang', $scope.languageCode);
                      var explorationId = (
                        ExplorationContextService.getExplorationId());
                      AssetsBackendApiService.saveAudio(
                        explorationId, generatedFilename, uploadedFile
                      ).then(function() {
                        $uibModalInstance.close({
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
                    $uibModalInstance.dismiss('cancel');
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

            $uibModal.open({
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
                '$scope', '$uibModalInstance', 'LanguageUtilService',
                'languageCode',
                function(
                    $scope, $uibModalInstance, LanguageUtilService,
                    languageCode) {
                  $scope.languageDescription = (
                    LanguageUtilService.getAudioLanguageDescription(
                      languageCode));

                  $scope.reallyDelete = function() {
                    $uibModalInstance.close();
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
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
