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
        'LanguageUtilService', 'alertsService',
        function(
            $scope, $modal, stateContentService, editabilityService,
            LanguageUtilService, alertsService) {
          $scope.isEditable = editabilityService.isEditable;
          console.log($scope.subtitledHtml);
          $scope.audioTranslations = (
            $scope.subtitledHtml.getBindableAudioTranslations());

          $scope.openAddAudioTranslationModal = function() {
            var allowedAudioLanguageCodes = (
              LanguageUtilService.getComplementAudioLanguageCodes(
                $scope.subtitledHtml.getAudioLanguageCodes()));

            if (allowedAudioLanguageCodes.length === 0) {
              alertsService.addWarning(
                'Sorry, all audio translation slots are full.');
              return;
            }

            $scope.getOnStartEditFn()();
            $modal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/components/forms/' +
                'add_audio_translation_modal_directive.html'),
              backdrop: true,
              resolve: {
                allowedAudioLanguageCodes: function() {
                  return allowedAudioLanguageCodes;
                }
              },
              controller: [
                '$scope', '$modalInstance', 'LanguageUtilService',
                'allowedAudioLanguageCodes',
                function(
                    $scope, $modalInstance, LanguageUtilService,
                    allowedAudioLanguageCodes) {
                  $scope.languageCodesAndDescriptions = (
                    allowedAudioLanguageCodes.map(function(languageCode) {
                      return {
                        code: languageCode,
                        description: (
                          LanguageUtilService.getAudioLanguageDescription(
                            languageCode))
                      };
                    }));

                  $scope.languageCode = allowedAudioLanguageCodes[0];
                  $scope.filename = null;  // FIXME: set on audio upload
                  $scope.fileSizeBytes = null;  // FIXME: set on audio upload

                  $scope.isAudioTranslationValid = function() {
                    return (
                      allowedAudioLanguageCodes.indexOf(
                        $scope.languageCode) !== -1 &&
                      $scope.filename !== null &&
                      $scope.fileSizeBytes !== null &&
                      $scope.fileSizeBytes > 0);
                  };

                  $scope.save = function() {
                    if ($scope.isAudioTranslationValid()) {
                      $modalInstance.close(
                        $scope.languageCode, $scope.filename,
                        $scope.fileSizeBytes);
                    }
                  };

                  $scope.cancel = function() {
                    $modalInstance.dismiss('cancel');
                    alertsService.clearWarnings();
                  };
                }
              ]
            }).result.then(function(languageCode, filename, fileSizeBytes) {
              $scope.subtitledHtml.addAudioTranslation(
                languageCode, filename, fileSizeBytes);
              $scope.getOnChangeFn()();
            });
          };

          $scope.openEditAudioTranslationModal = function() {
            // FIXME
          };

          $scope.deleteAudioTranslation = function(language) {
            $scope.getOnStartEditFn()();
            $scope.subtitledHtml.deleteAudioTranslation(language);
            $scope.getOnChangeFn()();
          };
        }
      ]
    };
  }
]);
