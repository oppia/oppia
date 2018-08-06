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
 * @fileoverview Directive for the audio translation bar.
 */
// Constant for audio recording time limit.
oppia.constant('RECORDING_TIME_LIMIT', 300);

oppia.directive('audioTranslationBar', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        contentId: '=',
        isTranslationTabBusy: '='
      },
      link: function(scope, elm) {
        scope.getRecorderController();
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/translation_tab/' +
        'audio_translation_bar_directive.html'),
      controller: [
        '$scope', '$filter', '$timeout', '$uibModal', '$rootScope',
        'StateContentIdsToAudioTranslationsService', 'IdGenerationService',
        'AudioPlayerService', 'TranslationLanguageService', 'AlertsService',
        'StateEditorService', 'ExplorationStatesService', 'EditabilityService',
        'AssetsBackendApiService', 'recorderService', 'ContextService',
        'RECORDING_TIME_LIMIT',
        function(
            $scope, $filter, $timeout, $uibModal, $rootScope,
            StateContentIdsToAudioTranslationsService, IdGenerationService,
            AudioPlayerService, TranslationLanguageService, AlertsService,
            StateEditorService, ExplorationStatesService, EditabilityService,
            AssetsBackendApiService, recorderService, ContextService,
            RECORDING_TIME_LIMIT) {
          $scope.RECORDER_ID = 'recorderId';
          $scope.recordingTimeLimit = RECORDING_TIME_LIMIT;
          $scope.audioBlob = null;
          $scope.recorder = null;
          $scope.unsupportedBrowser = false;
          $scope.selectedRecording = false;
          $scope.isAudioAvailable = false;
          $scope.audioIsUpdating = false;
          $scope.languageCode = null;
          $scope.cannotRecord = false;
          $scope.audioNeedsUpdate = false;
          $scope.canTranslate = false;
          $scope.showRecorderWarning = false;
          $scope.audioLoadingIndicatorIsShown = false;
          $scope.checkingMicrophonePermission = false;

          var saveContentIdsToAudioTranslationChanges = function() {
            StateContentIdsToAudioTranslationsService.saveDisplayedValue();
            var stateName = StateEditorService.getActiveStateName();
            var value = StateContentIdsToAudioTranslationsService.displayed;
            ExplorationStatesService.saveContentIdsToAudioTranslations(
              stateName, value);
          };

          var getAvailableAudio = function(contentId, languageCode) {
            if ($scope.contentId) {
              return StateContentIdsToAudioTranslationsService
                .displayed.getAudioTranslation(contentId, languageCode);
            }
          };

          var generateNewFilename = function() {
            return $scope.contentId + '-' +
              $scope.languageCode + '-' +
              IdGenerationService.generateNewId() + '.mp3';
          };

          $scope.onRecordStart = function() {
            $scope.showRecorderWarning = true;
            $scope.isTranslationTabBusy = true;
          };

          $scope.onConversionComplete = function() {
            $rootScope.loadingMessage = '';
          };

          var getTranslationTabBusyMessage = function() {
            var message = '';
            if($scope.recorder.status.isRecording) {
              message = 'It seems like you haven\'t stopped recording, please' +
                ' stop recording and either save or cancel the recording!'
            } else if($scope.recorder.status.isConverting) {
              message = 'It seems like recorded audio is still getting ' +
                'converted into mp3 please wait till it\'s done!'
            } else if($scope.showRecorderWarning) {
              message = 'It looks like you haven\'t saved the recorded audio,' +
                ' please save/cancel the recorded audio.'
            }
            return message;
          };
          var showPermissionAndStartRecording = function() {
            $scope.checkingMicrophonePermission = true;
            recorderService.showPermission({
              onDenied: function() {
                $scope.recordingPermissionDenied = true;
                $scope.cannotRecord = true;
                $scope.checkingMicrophonePermission = false;
              },
              onAllowed: function() {
                $scope.recordingPermissionDenied = false;
                $scope.cannotRecord = false;
                $scope.recorder.startRecord();
                $scope.selectedRecording = true;
                $scope.checkingMicrophonePermission = false;
              },
              onClosed: function() {
                $scope.recordingPermissionDenied = true;
                $scope.cannotRecord = true;
                $scope.checkingMicrophonePermission = false;
              },
            });
          };

          $scope.checkAndStartRecording = function() {
            if (!$scope.recorder.isAvailable) {
              $scope.unsupportedBrowser = true;
              $scope.cannotRecord = true;
            } else {
              $scope.unsupportedBrowser = false;
              showPermissionAndStartRecording();
            }
          };

          $scope.toggleAudioNeedsUpdate = function() {
            StateContentIdsToAudioTranslationsService.displayed
              .toggleNeedsUpdateAttribute(
                $scope.contentId, $scope.languageCode);
            saveContentIdsToAudioTranslationChanges();
            $scope.audioNeedsUpdate = !$scope.audioNeedsUpdate;
          };

          $scope.getRecorderController = function() {
            $scope.recorder = recorderService.controller($scope.RECORDER_ID);
          };

          $scope.reRecord = function() {
            $scope.initAudioBar();
            $scope.selectedRecording = false;
            showPermissionAndStartRecording();
          };

          $scope.cancelRecording = function() {
            $scope.initAudioBar();
            $scope.selectedRecording = false;
            $scope.audioIsUpdating = false;
            $scope.audioBlob = null;
            $scope.showRecorderWarning = false;
          };

          $scope.updateAudio = function() {
            AudioPlayerService.stop();
            AudioPlayerService.clear();
            $scope.audioBlob = null;
            $scope.audioIsUpdating = true;
            $scope.selectedRecording = false;
            showPermissionAndStartRecording();
          };

          $scope.saveRecordedAudio = function() {
            var filename = generateNewFilename();
            var fileType = 'audio/mp3';
            var contentId = $scope.contentId;
            var languageCode = $scope.languageCode;
            var recordedAudioFile = new File(
              [$scope.audioBlob], filename, {type: fileType});
            $scope.showRecorderWarning = false;
            AssetsBackendApiService.saveAudio(
              ContextService.getExplorationId(), filename,
              recordedAudioFile).then(function() {
              if ($scope.audioIsUpdating) {
                StateContentIdsToAudioTranslationsService.displayed
                  .deleteAudioTranslation(contentId, languageCode);
                $scope.audioIsUpdating = false;
              }
              StateContentIdsToAudioTranslationsService.displayed
                .addAudioTranslation(contentId, languageCode,
                  filename, recordedAudioFile.size);
              saveContentIdsToAudioTranslationChanges();
              AlertsService.addSuccessMessage(
                'Succesfuly uploaded recorded audio.');
              $scope.initAudioBar();
            }, function(errorResponse) {
              AlertsService.addWarning(errorResponse.error);
              $scope.initAudioBar();
            });
          };

          $scope.$on('externalSave', function() {
            if ($scope.recorder && $scope.recorder.status.isPlaying) {
              $scope.recorder.playbackPause();
            }
            if (recorderService.getHandler()) {
              recorderService.getHandler().clear();
            }
            AudioPlayerService.stop();
            AudioPlayerService.clear();
            $scope.audioBlob = null;
          });

          $scope.$watch('contentId', function() {
            $scope.initAudioBar();
          });

          $scope.$on('refreshAudioTranslationBar', function() {
            $scope.initAudioBar();
          });

          $scope.$on('showTranslationTabBusyModal', function() {
            $scope.openTranslationTabBusyModal();
          })

          $scope.openTranslationTabBusyModal = function() {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration_editor/translation_tab/' +
                'translation_tab_busy_modal_directive.html'),
              backdrop: true,
              resolve: {
                message: function() {
                  return getTranslationTabBusyMessage();
                }
              },
              controller: [
                '$scope', '$uibModalInstance', 'message',
                function( $scope, $uibModalInstance, message) {
                  console.log(message);
                  $scope.busyMessage = message;
                  $scope.gotIt = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            })
          };

          $scope.playPauseUploadedAudioTranslation = function(languageCode) {
            if (!AudioPlayerService.isPlaying()) {
              if (AudioPlayerService.isTrackLoaded()) {
                AudioPlayerService.play();
              } else {
                loadAndPlayAudioTranslation();
              }
            } else {
              AudioPlayerService.pause();
            }
          };


          var isCached = function(audioTranslation) {
            return AssetsBackendApiService.isCached(audioTranslation.filename);
          };

          $scope.getUploadedAudioTimer = function() {
            if (AudioPlayerService.isTrackLoaded()) {
              var currentTime = $filter('formatTimer')(AudioPlayerService
                .getCurrentTime());
              var duration = $filter('formatTimer')(AudioPlayerService
                .getAudioDuration());
              return currentTime + ' / ' + duration;
            } else {
              return '--:-- / --:--';
            }
          };

          $scope.isPlayingUploadedAudio = function() {
            return AudioPlayerService.isPlaying();
          };

          var loadAndPlayAudioTranslation = function() {
            $scope.audioLoadingIndicatorIsShown = true;
            var audioTranslation = getAvailableAudio(
              $scope.contentId, $scope.languageCode);
            if (audioTranslation) {
              AudioPlayerService.load(audioTranslation.filename)
                .then(function() {
                  $scope.audioLoadingIndicatorIsShown = false;
                  AudioPlayerService.play();
                });
            }
          };

          $scope.initAudioBar = function() {
            // This stops angular-recorder when user navigate while recording.
            if ($scope.recorder) {
              if ($scope.recorder.status.isPlaying) {
                $scope.recorder.playbackPause();
              }
              if ($scope.recorder.status.isRecording &&
                $scope.showRecorderWarning) {
                $scope.recorder.stopRecord();
                $rootScope.loadingMessage = 'loading';
              }
              if ($scope.recorder.status.isConverting) {
                $rootScope.loadingMessage = 'loading';
              }
              if (recorderService && recorderService.getHandler()) {
                recorderService.getHandler().stop();
                recorderService.getHandler().clear();
              }
            }
            $scope.isTranslationTabBusy = false;
            AudioPlayerService.stop();
            AudioPlayerService.clear();
            $scope.showRecorderWarning = false;
            $scope.languageCode = TranslationLanguageService
              .getActiveLanguageCode();
            $scope.canTranslate = EditabilityService.isTranslatable();
            var audioTranslationObject = getAvailableAudio(
              $scope.contentId, $scope.languageCode);
            if (audioTranslationObject) {
              $scope.isAudioAvailable = true;
              $scope.isLoadingAudio = true;
              $scope.selectedRecording = false;
              $scope.audioNeedsUpdate = audioTranslationObject.needsUpdate;
            } else {
              $scope.isAudioAvailable = false;
              $scope.audioBlob = null;
              $scope.selectedRecording = false;
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

          $scope.openDeleteAudioTranslationModal = function() {
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
              StateContentIdsToAudioTranslationsService.displayed
                .deleteAudioTranslation($scope.contentId, $scope.languageCode);
              saveContentIdsToAudioTranslationChanges();
              $scope.initAudioBar();
            });
          };

          $scope.openAddAudioTranslationModal = function() {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration_editor/translation_tab/' +
                'add_audio_translation_modal_directive.html'),
              backdrop: 'static',
              resolve: {
                generatedFilename: function() {
                  return generateNewFilename();
                },
                languageCode: function() {
                  return $scope.languageCode;
                },
                isAudioAvailable: function() {
                  return $scope.isAudioAvailable;
                }
              },
              controller: [
                '$scope', '$uibModalInstance', 'AlertsService', 'languageCode',
                'ContextService', 'generatedFilename', 'isAudioAvailable',
                function(
                    $scope, $uibModalInstance, AlertsService, languageCode,
                    ContextService, generatedFilename, isAudioAvailable) {
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

                  $scope.isAudioTranslationValid = function() {
                    return (
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

                  $scope.save = function() {
                    if ($scope.isAudioTranslationValid()) {
                      $scope.saveButtonText = BUTTON_TEXT_SAVING;
                      $scope.saveInProgress = true;
                      var explorationId = (
                        ContextService.getExplorationId());
                      AssetsBackendApiService.saveAudio(
                        explorationId, generatedFilename, uploadedFile
                      ).then(function() {
                        $uibModalInstance.close({
                          languageCode: languageCode,
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
              if ($scope.isAudioAvailable) {
                StateContentIdsToAudioTranslationsService.displayed
                  .deleteAudioTranslation(
                    $scope.contentId, $scope.languageCode);
              }
              StateContentIdsToAudioTranslationsService.displayed
                .addAudioTranslation(
                  $scope.contentId, $scope.languageCode, result.filename,
                  result.fileSizeBytes);
              saveContentIdsToAudioTranslationChanges();
              $scope.initAudioBar();
            });
          };

          $scope.initAudioBar();
        }]
    };
  }]);
