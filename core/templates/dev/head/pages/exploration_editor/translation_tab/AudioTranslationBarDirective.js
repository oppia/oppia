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
 * @fileoverview Directive for the state translation.
 */

oppia.directive('audioTranslationBar', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        contentId: '='
      },
      link: function(scope, elm) {
        scope.getRecorderController();
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/translation_tab/' +
        'audio_translation_bar_directive.html'),
      controller: [
        '$scope', '$filter', '$timeout', '$uibModal', 'AlertsService',
        'stateContentIdsToAudioTranslationsService', 'IdGenerationService',
        'AudioPlayerService', 'TranslationLanguageService',
        'AssetsBackendApiService', 'recorderService', 'AudioTranslationService',
        function(
            $scope, $filter, $timeout, $uibModal, AlertsService,
            stateContentIdsToAudioTranslationsService, IdGenerationService,
            AudioPlayerService, TranslationLanguageService,
            AssetsBackendApiService, recorderService, AudioTranslationService) {
          $scope.RECORDER_ID = 'recorderId';
          $scope.recordingTimeLimit = 1000;
          $scope.audioBlob = null;
          $scope.recorder = null;
          $scope.unsupportedBrowser = false;
          $scope.selectedRecording = false;
          $scope.isAudioAvailable = false;
          $scope.isUpdatingAudio = false;
          $scope.languageCode = null;
          $scope.cannotRecord = false;
          $scope.AudioPlayerService = AudioPlayerService;
          if (GLOBALS.can_translate) {
            $scope.canDeleteAudio = true;
          }

          recorderService.showPermission({
            onDenied: function() {
              $scope.recordingPermissionDenied = true;
              $scope.cannotRecord = true;
            },
            onAllowed: function() {
              $scope.recordingPermissionDenied = false;
              $scope.cannotRecord = false;
            },
            onClosed: function() {
              $scope.recordingPermissionDenied = true;
              $scope.cannotRecord = true;
            },
          });

          $scope.checkAndStartRecording = function() {
            console.log("over!");
            if(!$scope.recorder.isAvailable) {
              console.log("over!");
              $scope.unsupportedBrowser = true;
              $scope.cannotRecord = true;
            } else if($scope.recorder.isAvailable) {
               console.log("oover!");
              $scope.unsupportedBrowser = false;
              $scope.cannotRecord = false;
              $scope.recordingPermissionDenied = false;
              $scope.selectedRecording = true;
              $scope.recorder.startRecord();
            } else {
              console.log("overr!");
              $scope.recordingPermissionDenied = true;
              $scope.cannotRecord = true;
            }
          };

          $scope.getRecorderController = function() {
            $scope.recorder = recorderService.controller($scope.RECORDER_ID);
          };
          var getAvailableAudio = function(contentId, languageCode) {
            if ($scope.contentId) {
              return stateContentIdsToAudioTranslationsService
                .displayed.getAudioTranslation(contentId, languageCode);
            }
          };

          var generateNewFilename = function() {
            return $scope.contentId + '-' +
              $scope.languageCode + '-' +
              IdGenerationService.generateNewId() + '.mp3';
          };

          $scope.reRecord = function() {
            $scope.initAudioBar();
            $scope.recorder = recorderService.controller($scope.RECORDER_ID);
            $scope.recorder.startRecord();
          };

          $scope.updateAudio = function() {
            $scope.audioBlob = null;
            $scope.isUpdatingAudio = true;
            $scope.recorder = recorderService.controller($scope.RECORDER_ID);
            $scope.recorder.startRecord();
          };
         $scope.saveRecordedAudio = function() {
            var filename = generateNewFilename();
            var fileType = 'audio/mp3';
            var recodedAudioFile = new File(
              [$scope.audioBlob], filename, {type: fileType});
            AudioTranslationService.upload(filename, recodedAudioFile)
              .then(function() {
                if($scope.isUpdatingAudio) {
                  stateContentIdsToAudioTranslationsService.displayed
                .deleteAudioTranslation($scope.contentId, $scope.languageCode);
                $scope.isUpdatingAudio = false;
                }
                stateContentIdsToAudioTranslationsService.displayed
                  .addAudioTranslation($scope.contentId, $scope.languageCode,
                  filename, recodedAudioFile.size);
                stateContentIdsToAudioTranslationsService.saveDisplayedValue();
                AlertsService.addSuccessMessage(
                  "Succesfuly uploaded recoded audio.");
                $scope.initAudioBar();
            }, function(errorResponse) {

            });
          };

          $scope.$watch('contentId', function() {
            $scope.initAudioBar();
          });

          $scope.$on('refreshAudioTranslationBar', function() {
            $scope.initAudioBar();
          });

          $scope.initAudioBar = function() {
            $scope.languageCode = TranslationLanguageService
              .getActiveLanguageCode();
            var audioTranslationObject = getAvailableAudio(
              $scope.contentId, $scope.languageCode)
            if(audioTranslationObject) {
              $scope.isAudioAvailable = true;
              $scope.isLoadingAudio = true;
              AudioPlayerService.load(audioTranslationObject.filename)
                .then(function(audioObject) {
                  $scope.isLoadingAudio = false;
                });
            } else {
              $scope.isAudioAvailable = false;
              $scope.audioBlob = null;
            }
          };

          $scope.track = {
            progress: function(progressPercentage) {
              if (angular.isDefined(progressPercentage)) {
                AudioPlayerService.setProgress(progressPercentage / 100);
              }
              return AudioPlayerService.getProgress() * 100;
            }
          };

          $scope.openDeleteAudioTranslationModal = function(languageCode) {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration_editor/translation_tab/' +
                'delete_audio_translation_modal_directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function( $scope, $uibModalInstance) {
                  $scope.reallyDelete = function() {
                    $uibModalInstance.close();
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            }).result.then(function(result) {
              stateContentIdsToAudioTranslationsService.displayed
                .deleteAudioTranslation($scope.contentId, $scope.languageCode);
              stateContentIdsToAudioTranslationsService.saveDisplayedValue();
              $scope.initAudioBar();
            });
          };

          $timeout(function(){
            $scope.initAudioBar();
          }, 100);
      }]
  };
}]);
