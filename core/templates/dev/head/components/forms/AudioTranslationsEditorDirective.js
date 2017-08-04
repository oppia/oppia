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
        getOnStartEditFn: '&onStartEdit',
        getOnChangeFn: '&onChange'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/forms/audio_translations_editor_directive.html'),
      controller: [
        '$scope', '$modal', 'stateContentService', 'editabilityService',
        'LanguageUtilService', 'alertsService', 'explorationContextService',
        'AssetsBackendApiService',
        function(
            $scope, $modal, stateContentService, editabilityService,
            LanguageUtilService, alertsService, explorationContextService,
            AssetsBackendApiService) {
          $scope.isEditable = editabilityService.isEditable;
          $scope.audioTranslations = (
            $scope.subtitledHtml.getBindableAudioTranslations());
          var explorationId = explorationContextService.getExplorationId();

          $scope.getAudioLanguageDescription = (
            LanguageUtilService.getAudioLanguageDescription);

          $scope.getAudioTranslationFullUrl = function(filename) {
            return AssetsBackendApiService.getAudioDownloadUrl(
              explorationId, filename);
          };

          $scope.openAddAudioTranslationModal = function() {
            var allowedAudioLanguageCodes = (
              LanguageUtilService.getComplementAudioLanguageCodes(
                $scope.subtitledHtml.getAudioLanguageCodes()));

            if (allowedAudioLanguageCodes.length === 0) {
              alertsService.addWarning(
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
                'allowedAudioLanguageCodes', 'alertsService',
                'explorationContextService', 'IdGenerationService',
                function(
                    $scope, $modalInstance, LanguageUtilService,
                    allowedAudioLanguageCodes, alertsService,
                    explorationContextService, IdGenerationService) {
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
                  $scope.errorUploadingFile = false;

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

                  $scope.onFileChanged = function(file) {
                    $scope.errorUploadingFile = false;
                    uploadedFile = file;
                  };

                  $scope.onFileCleared = function() {
                    $scope.errorUploadingFile = false;
                    uploadedFile = null;
                  };

                  var generateNewFilename = function() {
                    return (
                      'content-' + $scope.languageCode + '-' +
                      IdGenerationService.generateNewId() + '.mp3');
                  };

                  $scope.save = function() {
                    if ($scope.isAudioTranslationValid()) {
                      var generatedFilename = generateNewFilename();
                      var explorationId = (
                        explorationContextService.getExplorationId());
                      AssetsBackendApiService.saveAudio(
                        explorationId, generatedFilename, uploadedFile
                      ).then(function() {
                        $modalInstance.close({
                          languageCode: $scope.languageCode,
                          filename: generatedFilename,
                          fileSizeBytes: uploadedFile.size
                        });
                      }, function() {
                        console.error(data);
                        // Remove the XSSI prefix.
                        var transformedData = data.responseText.substring(5);
                        var parsedResponse = angular.fromJson(transformedData);
                        $scope.errorUploadingFile = true;
                      });
                    }
                  };

                  $scope.cancel = function() {
                    $modalInstance.dismiss('cancel');
                    alertsService.clearWarnings();
                  };
                }
              ]
            }).result.then(function(result) {
              $scope.subtitledHtml.addAudioTranslation(
                result.languageCode, result.filename, result.fileSizeBytes);
              $scope.getOnChangeFn()();
            });
          };

          $scope.deleteAudioTranslation = function(languageCode) {
            $scope.getOnStartEditFn()();
            $scope.subtitledHtml.deleteAudioTranslation(languageCode);
            $scope.getOnChangeFn()();
          };
        }
      ]
    };
  }
]);
