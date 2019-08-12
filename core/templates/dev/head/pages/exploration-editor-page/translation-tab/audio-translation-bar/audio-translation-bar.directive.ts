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

require('filters/format-timer.filter.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'pages/exploration-editor-page/translation-tab/services/' +
  'translation-language.service.ts');
require(
  'pages/exploration-editor-page/translation-tab/services/' +
  'translation-tab-active-content-id.service.ts');
require(
  'pages/exploration-editor-page/translation-tab/services/' +
  'voiceover-recording.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-property.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-recorded-voiceovers.service.ts');
require('services/AlertsService.ts');
require('services/AssetsBackendApiService.ts');
require('services/AudioPlayerService.ts');
require('services/ContextService.ts');
require('services/EditabilityService.ts');
require('services/IdGenerationService.ts');
require('services/UserService.ts');

require(
  'pages/exploration-editor-page/exploration-editor-page.constants.ajs.ts');

angular.module('oppia').directive('audioTranslationBar', [
  'UrlInterpolationService', 'UserService',
  function(UrlInterpolationService, UserService) {
    return {
      restrict: 'E',
      scope: {
        isTranslationTabBusy: '='
      },
      link: function(scope: ICustomScope, elm) {
        scope.getVoiceoverRecorder();

        var userIsLoggedIn;
        UserService.getUserInfoAsync().then(function(userInfo) {
          userIsLoggedIn = userInfo.isLoggedIn();
        });
        $('.oppia-translation-tab').on('dragover', function(evt) {
          evt.preventDefault();
          scope.dropAreaIsAccessible = GLOBALS.can_voiceover;
          scope.userIsGuest = !userIsLoggedIn;
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
          if ((<Element><any>evt.target).classList.contains(
            'oppia-drop-area-message') && scope.dropAreaIsAccessible) {
            var files = (<DragEvent>evt.originalEvent).dataTransfer.files;
            scope.openAddAudioTranslationModal(files);
          }
          scope.dropAreaIsAccessible = false;
          scope.$digest();
          return false;
        });
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration-editor-page/translation-tab/' +
        'audio-translation-bar/audio-translation-bar.directive.html'),
      controller: [
        '$filter', '$interval', '$rootScope', '$scope', '$uibModal', '$window',
        'AlertsService', 'AssetsBackendApiService', 'AudioPlayerService',
        'ContextService', 'EditabilityService', 'ExplorationStatesService',
        'IdGenerationService', 'SiteAnalyticsService',
        'StateEditorService', 'StateRecordedVoiceoversService',
        'TranslationLanguageService', 'TranslationStatusService',
        'TranslationTabActiveContentIdService', 'VoiceoverRecordingService',
        'RECORDING_TIME_LIMIT',
        function(
            $filter, $interval, $rootScope, $scope, $uibModal, $window,
            AlertsService, AssetsBackendApiService, AudioPlayerService,
            ContextService, EditabilityService, ExplorationStatesService,
            IdGenerationService, SiteAnalyticsService,
            StateEditorService, StateRecordedVoiceoversService,
            TranslationLanguageService, TranslationStatusService,
            TranslationTabActiveContentIdService, VoiceoverRecordingService,
            RECORDING_TIME_LIMIT) {
          $scope.recordingTimeLimit = RECORDING_TIME_LIMIT;
          $scope.audioBlob = null;
          $scope.voiceoverRecorder = null;
          $scope.unsupportedBrowser = false;
          $scope.selectedRecording = false;
          $scope.isAudioAvailable = false;
          $scope.audioIsUpdating = false;
          $scope.languageCode = null;
          $scope.cannotRecord = false;
          $scope.audioNeedsUpdate = false;
          $scope.canVoiceover = false;
          $scope.showRecorderWarning = false;
          $scope.audioLoadingIndicatorIsShown = false;
          $scope.checkingMicrophonePermission = false;
          $scope.audioTimerIsShown = true;
          $scope.audioIsCurrentlyBeingSaved = false;
          $scope.elapsedTime = 0;
          $scope.timerInterval = null;
          $scope.unsavedAudioIsPlaying = false;
          $scope.waveSurfer = null;

          document.body.onkeyup = function(e) {
            if (e.code === 'KeyR' && !$scope.isAudioAvailable) {
              // Used as shortcut key for recording
              toggleStartAndStopRecording();
            }
          };

          $scope.$on('$destroy', function() {
            document.body.onkeyup = null;
          });

          var saveRecordedVoiceoversChanges = function() {
            StateRecordedVoiceoversService.saveDisplayedValue();
            var stateName = StateEditorService.getActiveStateName();
            var value = StateRecordedVoiceoversService.displayed;
            ExplorationStatesService.saveRecordedVoiceovers(stateName, value);
            TranslationStatusService.refresh();
          };

          var getAvailableAudio = function(contentId, languageCode) {
            if ($scope.contentId) {
              return (
                StateRecordedVoiceoversService.displayed.getVoiceover(
                  contentId, languageCode));
            }
          };

          var cancelTimer = function() {
            if ($scope.timerInterval) {
              $interval.cancel($scope.timerInterval);
            }
          };

          var generateNewFilename = function() {
            return $scope.contentId + '-' +
              $scope.languageCode + '-' +
              IdGenerationService.generateNewId() + '.mp3';
          };

          var getTranslationTabBusyMessage = function() {
            var message = '';
            if ($scope.isRecording) {
              message = 'You haven\'t finished recording. Please stop ' +
                'recording and either save or cancel the recording.';
            } else if ($scope.showRecorderWarning) {
              message = 'You haven\'t saved your recording. Please save or ' +
                'cancel the recording.';
            }
            return message;
          };
          var showPermissionAndStartRecording = function() {
            $scope.checkingMicrophonePermission = true;
            $scope.voiceoverRecorder.startRecording().then(function() {
              // When the user accepts the microphone access.
              $scope.showRecorderWarning = true;
              $scope.isTranslationTabBusy = true;

              $scope.recordingPermissionDenied = false;
              $scope.cannotRecord = false;
              $scope.selectedRecording = true;
              $scope.checkingMicrophonePermission = false;

              $scope.elapsedTime = 0;
              $scope.timerInterval = $interval(function() {
                $scope.elapsedTime++;
                // $scope.recordingTimeLimit is decremented to
                // compensate for the audio recording timing inconsistency,
                // so it allows the server to accept the recording.
                if ($scope.elapsedTime === $scope.recordingTimeLimit - 1) {
                  $scope.stopRecording();
                }
              }, 1000);
            }, function() {
              // When the user denies microphone access.
              $scope.recordingPermissionDenied = true;
              $scope.cannotRecord = true;
              $scope.checkingMicrophonePermission = false;
              $scope.$apply();
            });
          };

          $scope.checkAndStartRecording = function() {
            $scope.voiceoverRecorder.initRecorder();
            if (!$scope.voiceoverRecorder.status().isAvailable) {
              $scope.unsupportedBrowser = true;
              $scope.cannotRecord = true;
            } else {
              SiteAnalyticsService.registerStartAudioRecordingEvent();
              $scope.unsupportedBrowser = false;
              showPermissionAndStartRecording();
            }
          };

          $scope.toggleAudioNeedsUpdate = function() {
            StateRecordedVoiceoversService.displayed.toggleNeedsUpdateAttribute(
              $scope.contentId, $scope.languageCode);
            saveRecordedVoiceoversChanges();
            $scope.audioNeedsUpdate = !$scope.audioNeedsUpdate;
          };


          $scope.getVoiceoverRecorder = function() {
            $scope.voiceoverRecorder = VoiceoverRecordingService;
          };

          $scope.reRecord = function() {
            $scope.initAudioBar();
            $scope.selectedRecording = false;
            $scope.checkAndStartRecording();
          };

          $scope.cancelRecording = function() {
            $scope.initAudioBar();
            $scope.selectedRecording = false;
            $scope.audioIsUpdating = false;
            $scope.audioBlob = null;
            $scope.showRecorderWarning = false;
          };

          $scope.stopRecording = function() {
            $scope.voiceoverRecorder.stopRecord();
            $scope.recordingComplete = true;
            cancelTimer();
            $scope.voiceoverRecorder.getMp3Data().then(function(audio) {
              var fileType = 'audio/mp3';
              $scope.audioBlob = new Blob(audio, {type: fileType});
              // Free the browser from web worker.
              $scope.voiceoverRecorder.closeRecorder();
              // Create audio play and pause for unsaved recording.
              var url = $window.URL.createObjectURL($scope.audioBlob);
              // Create visualizer for playing unsaved audio.
              $scope.waveSurfer = $window.WaveSurfer.create({
                container: '#visualized',
                waveColor: '#009688',
                progressColor: '#cccccc',
                height: 38
              });
              $scope.waveSurfer.load(url);
            });
          };

          // Play and pause for unsaved recording.
          $scope.playAndPauseUnsavedAudio = function() {
            $scope.unsavedAudioIsPlaying = !$scope.unsavedAudioIsPlaying;
            if ($scope.unsavedAudioIsPlaying) {
              $scope.waveSurfer.play();
              $scope.waveSurfer.on('finish', function() {
                $scope.unsavedAudioIsPlaying = false;
                $scope.$apply();
              });
            } else {
              $scope.waveSurfer.pause();
            }
          };

          $scope.updateAudio = function() {
            AudioPlayerService.stop();
            AudioPlayerService.clear();
            $scope.audioBlob = null;
            $scope.audioIsUpdating = true;
            $scope.selectedRecording = false;
            $scope.checkAndStartRecording();
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
                StateRecordedVoiceoversService.displayed.deleteVoiceover(
                  contentId, languageCode);
                $scope.audioIsUpdating = false;
              }
              StateRecordedVoiceoversService.displayed.addVoiceover(
                contentId, languageCode, filename, recordedAudioFile.size);
              saveRecordedVoiceoversChanges();
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

            if (!$scope.isRecording && !$scope.audioBlob) {
              $scope.checkAndStartRecording();
            } else {
              $scope.stopRecording();
            }
          };

          $scope.$on('externalSave', function() {
            if ($scope.voiceoverRecorder.status().isRecording) {
              $scope.voiceoverRecorder.stopRecord();
              $scope.voiceoverRecorder.closeRecorder();
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
                '/pages/exploration-editor-page/translation-tab/' +
                'modal-templates/translation-tab-busy-modal.template.html'),
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
            // This stops the voiceoverRecorder when user navigates
            // while recording.
            if ($scope.voiceoverRecorder) {
              if ($scope.voiceoverRecorder.status().isRecording &&
                $scope.showRecorderWarning) {
                $scope.voiceoverRecorder.stopRecord();
                cancelTimer();
                $scope.voiceoverRecorder.closeRecorder();
              }
            }
            $scope.isTranslationTabBusy = false;
            AudioPlayerService.stop();
            AudioPlayerService.clear();
            $scope.showRecorderWarning = false;
            // re-initialize for unsaved recording
            $scope.unsavedAudioIsPlaying = false;
            $scope.waveSurfer = null;
            $scope.languageCode = TranslationLanguageService
              .getActiveLanguageCode();
            $scope.canVoiceover = EditabilityService.isTranslatable();
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
                '/pages/exploration-editor-page/translation-tab/' +
                'modal-templates/delete-audio-translation-modal.template.html'),
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
              StateRecordedVoiceoversService.displayed.deleteVoiceover(
                $scope.contentId, $scope.languageCode);
              saveRecordedVoiceoversChanges();
              $scope.initAudioBar();
            });
          };

          $scope.openAddAudioTranslationModal = function(audioFile) {
            SiteAnalyticsService.registerUploadAudioEvent();
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration-editor-page/translation-tab/' +
                'modal-templates/add-audio-translation-modal.template.html'),
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
                StateRecordedVoiceoversService.displayed.deleteVoiceover(
                  $scope.contentId, $scope.languageCode);
              }
              StateRecordedVoiceoversService.displayed.addVoiceover(
                $scope.contentId, $scope.languageCode, result.filename,
                result.fileSizeBytes);
              saveRecordedVoiceoversChanges();
              $scope.initAudioBar();
            });
          };
          $scope.initAudioBar();
        }]
    };
  }]);
