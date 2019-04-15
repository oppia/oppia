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
        isTranslationTabBusy: '='
      },
      link: function(scope, elm) {
        scope.getRecorderController();

        $('.oppia-translation-tab').on('dragover', function(evt) {
          evt.preventDefault();
          scope.dropAreaIsAccessible = GLOBALS.can_translate;
          scope.userIsGuest = !GLOBALS.userIsLoggedIn;
          scope.$digest();
          return false;
        });

        $('.oppia-main-body').on('dragleave', function(evt) {
          evt.preventDefault();
          if (evt.pageX === 0 || evt.pageY === 0) {
            scope.dropAreaIsAccessible = false;
            scope.userIsGuest = false;
            scope.$digest();
          }
          return false;
        });

        $('.oppia-translation-tab').on('drop', function(evt) {
          evt.preventDefault();
          if (evt.target.classList.contains('oppia-drop-area-message') &&
            scope.dropAreaIsAccessible) {
            files = evt.originalEvent.dataTransfer.files;
            scope.openAddAudioTranslationModal(files);
          }
          scope.dropAreaIsAccessible = false;
          scope.$digest();
          return false;
        });
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/translation_tab/' +
        'audio_translation_bar_directive.html'),
      controller: [
        '$filter', '$rootScope', '$scope', '$timeout', '$uibModal',
        'AlertsService', 'AssetsBackendApiService', 'AudioPlayerService',
        'ContextService', 'EditabilityService', 'ExplorationStatesService',
        'IdGenerationService', 'SiteAnalyticsService',
        'StateContentIdsToAudioTranslationsService',
        'StateEditorService', 'TranslationLanguageService',
        'recorderService', 'TranslationTabActiveContentIdService',
        'RECORDING_TIME_LIMIT',
        function(
            $filter, $rootScope, $scope, $timeout, $uibModal,
            AlertsService, AssetsBackendApiService, AudioPlayerService,
            ContextService, EditabilityService, ExplorationStatesService,
            IdGenerationService, SiteAnalyticsService,
            StateContentIdsToAudioTranslationsService,
            StateEditorService, TranslationLanguageService,
            recorderService, TranslationTabActiveContentIdService,
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
          $scope.audioTimerIsShown = true;
          $scope.audioIsCurrentlyBeingSaved = false;
          document.body.onkeyup = function(e) {
            if (e.keyCode === 82 && !$scope.isAudioAvailable) {
              // 82 belongs to the keycode for 'R'
              // Used as shortcut key for recording
              toggleStartAndStopRecording();
            }
          };

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
            if ($scope.recorder.status.isRecording) {
              message = 'You haven\'t finished recording. Please stop ' +
                'recording and either save or cancel the recording.';
            } else if ($scope.recorder.status.isConverting) {
              message = 'It seems like recorded audio is still getting ' +
                'converted into mp3. Please wait until the audio has finished' +
                ' processing.';
            } else if ($scope.showRecorderWarning) {
              message = 'You haven\'t saved your recording. Please save or ' +
                'cancel the recording.';
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
              SiteAnalyticsService.registerStartAudioRecordingEvent();
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
            $scope.audioIsCurrentlyBeingSaved = true;
            SiteAnalyticsService.registerSaveRecordedAudioEvent();
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
              $scope.audioIsCurrentlyBeingSaved = false;
              $scope.initAudioBar();
            }, function(errorResponse) {
              $scope.audioIsCurrentlyBeingSaved = false;
              AlertsService.addWarning(errorResponse.error);
              $scope.initAudioBar();
            });
          };
          var toggleStartAndStopRecording = function() {
            if ($scope.isAudioAvailable) {
              return;
            }

            if (!$scope.recorder.status.isRecording && !$scope.audioBlob) {
              $scope.checkAndStartRecording();
            } else {
              $scope.recorder.stopRecord();
            }
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

          $scope.$on('activeContentIdChanged', function() {
            $scope.initAudioBar();
          });
          $scope.$on('activeLanguageChanged', function() {
            $scope.initAudioBar();
          });

          $scope.$on('showTranslationTabBusyModal', function() {
            $scope.openTranslationTabBusyModal();
          });

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
                  $scope.busyMessage = message;
                  $scope.gotIt = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            });
          };

          $scope.playPauseUploadedAudioTranslation = function(languageCode) {
            $scope.audioTimerIsShown = true;
            if (!AudioPlayerService.isPlaying()) {
              if (AudioPlayerService.isTrackLoaded()) {
                AudioPlayerService.play();
                $scope.audioTimerIsShown = true;
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
              $scope.audioTimerIsShown = true;
              var currentTime = $filter('formatTimer')(AudioPlayerService
                .getCurrentTime());
              var duration = $filter('formatTimer')(AudioPlayerService
                .getAudioDuration());
              return currentTime + ' / ' + duration;
            } else {
              $scope.audioTimerIsShown = false;
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
                  $scope.audioTimerIsShown = true;
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
            $scope.contentId = (
              TranslationTabActiveContentIdService.getActiveContentId());
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

          $scope.openAddAudioTranslationModal = function(audioFile) {
            SiteAnalyticsService.registerUploadAudioEvent();
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration_editor/translation_tab/' +
                'add_audio_translation_modal_directive.html'),
              backdrop: 'static',
              resolve: {
                audioFile: function() {
                  return audioFile;
                },
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
                'audioFile',
                function(
                    $scope, $uibModalInstance, AlertsService, languageCode,
                    ContextService, generatedFilename, isAudioAvailable,
                    audioFile) {
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
