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
        contentId: '=',
        // A function that must be called at the outset of every attempt to
        // edit, even if the action is not subsequently taken through to
        // completion.
        getOnStartEditFn: '&onStartEdit'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/forms/audio_translations_editor_directive.html'),
      controller: [
        '$scope', '$rootScope', '$uibModal', '$sce', 'stateContentService',
        'stateContentIdsToAudioTranslationsService',
        'EditabilityService', 'LanguageUtilService', 'AlertsService',
        'ContextService', 'AssetsBackendApiService',
        function(
            $scope, $rootScope, $uibModal, $sce, stateContentService,
            stateContentIdsToAudioTranslationsService, EditabilityService,
            LanguageUtilService, AlertsService, ContextService,
            AssetsBackendApiService) {
          $scope.isTranslatable = EditabilityService.isTranslatable;

          $scope.stateContentIdsToAudioTranslationsService =
              stateContentIdsToAudioTranslationsService;
          // The following if-condition is present because, sometimes,
          // Travis-CI throws an error of the form "Cannot read property
          // getBindableAudioTranslations of undefined". It looks like there is
          // a race condition that is causing this directive to get
          // initialized when it shouldn't. This is hard to reproduce
          // deterministically, hence this guard.
          if (stateContentIdsToAudioTranslationsService.displayed) {
            $scope.audioTranslations = (
              stateContentIdsToAudioTranslationsService.displayed
                .getBindableAudioTranslations($scope.contentId));
            $scope.hasAudioTranslations =
              stateContentIdsToAudioTranslationsService.displayed
                .hasAudioTranslations($scope.contentId);
          }

          var explorationId = ContextService.getExplorationId();

          $scope.getAudioLanguageDescription = (
            LanguageUtilService.getAudioLanguageDescription);

          $scope.getAudioTranslationFullUrl = function(filename) {
            return $sce.trustAsResourceUrl(
              AssetsBackendApiService.getAudioDownloadUrl(
                explorationId, filename));
          };

          $scope.isFullyTranslated = function() {
            stateContentIdsToAudioTranslationsService.displayed
              .isFullyTranslated($scope.contentId);
          };

          $scope.getNeedsUpdateTooltipMessage = function(needsUpdate) {
            if (needsUpdate) {
              return ($scope.isTranslatable() ? 'Audio might not match text.' +
                ' Reupload the file, or click to unflag.' :
                'Audio might not match text.');
            } else {
              return ($scope.isTranslatable() ? 'Click to mark this audio ' +
                'translation as not matching text.' :
                'Audio translation matches text.');
            }
          };

          $scope.toggleNeedsUpdateAttribute = function(languageCode) {
            $scope.getOnStartEditFn()();
            stateContentIdsToAudioTranslationsService.displayed
              .toggleNeedsUpdateAttribute($scope.contentId, languageCode);
            stateContentIdsToAudioTranslationsService.saveDisplayedValue();
          };

          $scope.openAddAudioTranslationModal = function() {
            var allowedAudioLanguageCodes = (
              LanguageUtilService.getComplementAudioLanguageCodes(
                stateContentIdsToAudioTranslationsService.displayed
                  .getAudioLanguageCodes($scope.contentId)));

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
                'ContextService', 'IdGenerationService',
                'componentName',
                function(
                    $scope, $window, $uibModalInstance, LanguageUtilService,
                    allowedAudioLanguageCodes, AlertsService,
                    ContextService, IdGenerationService,
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
                        ContextService.getExplorationId());
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
              stateContentIdsToAudioTranslationsService.displayed
                .addAudioTranslation(
                  $scope.contentId, result.languageCode, result.filename,
                  result.fileSizeBytes);
              stateContentIdsToAudioTranslationsService.saveDisplayedValue();
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
              stateContentIdsToAudioTranslationsService.displayed
                .deleteAudioTranslation($scope.contentId, languageCode);
              stateContentIdsToAudioTranslationsService.saveDisplayedValue();
            });
          };
        }
      ]
    };
  }
]);
