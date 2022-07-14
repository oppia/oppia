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

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require('filters/format-timer.filter.ts');
require(
  'pages/exploration-editor-page/translation-tab/modal-templates/' +
  'add-audio-translation-modal.controller.ts');

require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'user-exploration-permissions.service.ts');
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
require('services/alerts.service.ts');
require('services/assets-backend-api.service.ts');
require('services/audio-player.service.ts');
require('services/context.service.ts');
require('services/editability.service.ts');
require('services/id-generation.service.ts');
require('services/user.service.ts');
require('services/external-save.service.ts');
require('services/ngb-modal.service.ts');

import WaveSurfer from 'wavesurfer.js';

import { Subscription } from 'rxjs';
import { OppiaAngularRootComponent } from 'components/oppia-angular-root.component';
import { DeleteAudioTranslationModalComponent } from 'pages/exploration-editor-page/translation-tab/modal-templates/delete-audio-translation-modal.component';
import { TranslationTabBusyModalComponent } from 'pages/exploration-editor-page/translation-tab/modal-templates/translation-tab-busy-modal.component';
require(
  'pages/exploration-editor-page/exploration-editor-page.constants.ajs.ts');

interface AudioTranslationBarCustomScope extends ng.IScope {
  userIsGuest?: boolean;
  dropAreaIsAccessible?: boolean;
  showDropArea?: boolean;
  getVoiceoverRecorder?: () => void;
  openAddAudioTranslationModal?: (files: FileList) => void;
}

angular.module('oppia').directive('audioTranslationBar', [
  '$rootScope', 'NgbModal',
  'UserExplorationPermissionsService', 'UserService',
  function(
      $rootScope, NgbModal,
      UserExplorationPermissionsService, UserService) {
    return {
      restrict: 'E',
      scope: {
        isTranslationTabBusy: '='
      },
      link: function(scope: AudioTranslationBarCustomScope, elm) {
        scope.getVoiceoverRecorder();

        var userIsLoggedIn;
        UserService.getUserInfoAsync().then(function(userInfo) {
          userIsLoggedIn = userInfo.isLoggedIn();
          return UserExplorationPermissionsService.getPermissionsAsync();
        }).then(function(permissions) {
          $('.oppia-translation-tab').on('dragover', function(evt) {
            evt.preventDefault();
            scope.dropAreaIsAccessible = permissions.canVoiceover;
            scope.userIsGuest = !userIsLoggedIn;
            scope.$digest();
            // TODO(#8521): Remove the use of $rootScope.$apply()
            // once the controller is migrated to angular.
            $rootScope.$applyAsync();
            return false;
          });
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
          if (
            (evt.target as Element).classList.contains(
              'oppia-drop-area-message'
            ) && scope.dropAreaIsAccessible
          ) {
            var files = (evt.originalEvent as DragEvent).dataTransfer.files;
            scope.openAddAudioTranslationModal(files);
          }
          scope.dropAreaIsAccessible = false;
          scope.$digest();
          return false;
        });

        // This is needed in order for the scope to be retrievable during Karma
        // unit testing. See http://stackoverflow.com/a/29833832 for more
        // details.
        elm[0].getControllerScope = function() {
          return scope;
        };
      },
      template: require(
        'pages/exploration-editor-page/translation-tab/' +
        'audio-translation-bar/audio-translation-bar.directive.html'),
      controller: [
        '$interval', '$q', '$scope', '$uibModal', '$window',
        'AlertsService', 'AssetsBackendApiService', 'AudioPlayerService',
        'ContextService', 'EditabilityService',
        'ExplorationStatesService', 'ExternalSaveService', 'GraphDataService',
        'IdGenerationService', 'SiteAnalyticsService',
        'StateEditorService', 'StateRecordedVoiceoversService',
        'TranslationLanguageService', 'TranslationStatusService',
        'TranslationTabActiveContentIdService', 'VoiceoverRecordingService',
        'RECORDING_TIME_LIMIT',
        function(
            $interval, $q, $scope, $uibModal, $window,
            AlertsService, AssetsBackendApiService, AudioPlayerService,
            ContextService, EditabilityService,
            ExplorationStatesService, ExternalSaveService, GraphDataService,
            IdGenerationService, SiteAnalyticsService,
            StateEditorService, StateRecordedVoiceoversService,
            TranslationLanguageService, TranslationStatusService,
            TranslationTabActiveContentIdService, VoiceoverRecordingService,
            RECORDING_TIME_LIMIT) {
          var ctrl = this;
          ctrl.directiveSubscriptions = new Subscription();
          $scope.AudioPlayerService = AudioPlayerService;

          $scope.setProgress = function(val: {value: number}) {
            AudioPlayerService.setCurrentTime(val.value);
            $scope.$applyAsync();
          };

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

          var showPermissionAndStartRecording = function() {
            $scope.checkingMicrophonePermission = true;
            $scope.voiceoverRecorder.startRecordingAsync().then(function() {
              // When the user accepts the microphone access.
              $scope.showRecorderWarning = true;
              $scope.isTranslationTabBusy = true;

              $scope.recordingPermissionDenied = false;
              $scope.cannotRecord = false;
              $scope.selectedRecording = true;
              $scope.checkingMicrophonePermission = false;

              $scope.elapsedTime = 0;
              OppiaAngularRootComponent.ngZone.runOutsideAngular(() => {
                $scope.timerInterval = $interval(function() {
                  OppiaAngularRootComponent.ngZone.run(() => {
                    $scope.elapsedTime++;
                    // $scope.recordingTimeLimit is decremented to
                    // compensate for the audio recording timing inconsistency,
                    // so it allows the server to accept the recording.
                    if ($scope.elapsedTime === $scope.recordingTimeLimit - 1) {
                      $scope.stopRecording();
                    }
                  });
                }, 1000);
              });
            }, function() {
              // When the user denies microphone access.
              $scope.recordingPermissionDenied = true;
              $scope.cannotRecord = true;
              $scope.checkingMicrophonePermission = false;
              $scope.$applyAsync();
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
              $scope.waveSurfer = WaveSurfer.create({
                container: '#visualized',
                waveColor: '#009688',
                progressColor: '#cccccc',
                height: 38
              });
              $scope.waveSurfer.load(url);
            });
          };

          const waveSurferOnFinishCb = () => {
            $scope.unsavedAudioIsPlaying = false;
            $scope.$applyAsync();
          };

          // Play and pause for unsaved recording.
          $scope.playAndPauseUnsavedAudio = function() {
            $scope.unsavedAudioIsPlaying = !$scope.unsavedAudioIsPlaying;
            if ($scope.unsavedAudioIsPlaying) {
              $scope.waveSurfer.play();
              $scope.waveSurfer.on('finish', waveSurferOnFinishCb);
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
            $q.when(
              AssetsBackendApiService.saveAudio(
                ContextService.getExplorationId(), filename, recordedAudioFile)
            ).then(function(response) {
              if ($scope.audioIsUpdating) {
                StateRecordedVoiceoversService.displayed.deleteVoiceover(
                  contentId, languageCode);
                $scope.audioIsUpdating = false;
              }
              StateRecordedVoiceoversService.displayed.addVoiceover(
                contentId, languageCode, filename, recordedAudioFile.size,
                response.duration_secs);
              $scope.durationSecs = Math.round(response.duration_secs);
              saveRecordedVoiceoversChanges();
              AlertsService.addSuccessMessage(
                'Succesfuly uploaded recorded audio.');
              $scope.audioIsCurrentlyBeingSaved = false;
              $scope.initAudioBar();
              setTimeout(() => {
                GraphDataService.recompute();
              });
            }, function(errorResponse) {
              $scope.audioIsCurrentlyBeingSaved = false;
              AlertsService.addWarning(errorResponse.error);
              $scope.initAudioBar();
            });
          };

          var toggleStartAndStopRecording = function() {
            if (!$scope.voiceoverRecorder.status().isRecording &&
                !$scope.audioBlob) {
              $scope.checkAndStartRecording();
            } else {
              $scope.stopRecording();
            }
          };

          $scope.getTranslationTabBusyMessage = function() {
            var message = '';
            if ($scope.voiceoverRecorder.status().isRecording) {
              message = 'You haven\'t finished recording. Please stop ' +
                'recording and either save or cancel the recording.';
            } else if ($scope.showRecorderWarning) {
              message = 'You haven\'t saved your recording. Please save or ' +
                'cancel the recording.';
            }
            return message;
          };

          $scope.openTranslationTabBusyModal = function() {
            const modalRef = NgbModal
              .open(TranslationTabBusyModalComponent, {
                backdrop: true,
              });
            modalRef.componentInstance.busyMessage =
              $scope.getTranslationTabBusyMessage();

            modalRef.result.then(function() {}, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
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

          $scope.isPlayingUploadedAudio = function() {
            return AudioPlayerService.isPlaying();
          };

          var loadAndPlayAudioTranslation = function() {
            $scope.audioLoadingIndicatorIsShown = true;
            var audioTranslation = getAvailableAudio(
              $scope.contentId, $scope.languageCode);
            if (audioTranslation) {
              AudioPlayerService.loadAsync(audioTranslation.filename)
                .then(function() {
                  $scope.audioLoadingIndicatorIsShown = false;
                  $scope.audioIsLoading = false;
                  $scope.audioTimerIsShown = true;
                  AudioPlayerService.play();
                  $scope.$applyAsync();
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
            // Re-initialize for unsaved recording.
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
              $scope.audioIsLoading = true;
              $scope.selectedRecording = false;
              $scope.audioNeedsUpdate = audioTranslationObject.needsUpdate;
              $scope.durationSecs =
                Math.round(audioTranslationObject.durationSecs);
            } else {
              $scope.isAudioAvailable = false;
              $scope.audioBlob = null;
              $scope.selectedRecording = false;
            }
          };

          $scope.openDeleteAudioTranslationModal = function() {
            NgbModal.open(DeleteAudioTranslationModalComponent, {
              backdrop: true
            }).result.then(function() {
              StateRecordedVoiceoversService.displayed.deleteVoiceover(
                $scope.contentId, $scope.languageCode);
              saveRecordedVoiceoversChanges();
              $scope.initAudioBar();
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          $scope.openAddAudioTranslationModal = function(audioFile) {
            SiteAnalyticsService.registerUploadAudioEvent();
            $uibModal.open({
              template: require(
                'pages/exploration-editor-page/translation-tab/' +
                'modal-templates/add-audio-translation-modal.template.html'),
              backdrop: 'static',
              resolve: {
                audioFile: () => audioFile,
                generatedFilename: () => generateNewFilename(),
                languageCode: () => $scope.languageCode,
                isAudioAvailable: () => $scope.isAudioAvailable
              },
              controller: 'AddAudioTranslationModalController',
            }).result.then(function(result) {
              if ($scope.isAudioAvailable) {
                StateRecordedVoiceoversService.displayed.deleteVoiceover(
                  $scope.contentId, $scope.languageCode);
              }
              StateRecordedVoiceoversService.displayed.addVoiceover(
                $scope.contentId, $scope.languageCode, result.filename,
                result.fileSizeBytes, result.durationSecs);
              $scope.durationSecs = Math.round(result.durationSecs);
              saveRecordedVoiceoversChanges();
              $scope.initAudioBar();
            }, function() {
              AlertsService.clearWarnings();
            });
          };

          ctrl.$onInit = function() {
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
              if (!$scope.canVoiceover) {
                return;
              }
              if (e.code === 'KeyR' && !$scope.isAudioAvailable) {
                // Used as shortcut key for recording.
                toggleStartAndStopRecording();
              }
            };

            $scope.$on('$destroy', function() {
              document.body.onkeyup = null;
              // TODO(#12146): Remove jQuery usage below.
              // Remove jQuery event listeners.
              $('.oppia-translation-tab').off('dragover');
              $('.oppia-main-body').off('dragleave');
              $('.oppia-translation-tab').off('drop');
              // Remove wavesurefer finish event listener.
              $scope.waveSurfer?.un('finish', waveSurferOnFinishCb);
            });

            ctrl.directiveSubscriptions.add(
              ExternalSaveService.onExternalSave.subscribe(() => {
                if ($scope.voiceoverRecorder.status().isRecording) {
                  $scope.voiceoverRecorder.stopRecord();
                  $scope.voiceoverRecorder.closeRecorder();
                }
                AudioPlayerService.stop();
                AudioPlayerService.clear();
                $scope.audioBlob = null;
              })
            );

            ctrl.directiveSubscriptions.add(
              TranslationTabActiveContentIdService.onActiveContentIdChanged.
                subscribe(
                  () => $scope.initAudioBar()
                )
            );

            ctrl.directiveSubscriptions.add(
              TranslationLanguageService.onActiveLanguageChanged.subscribe(
                () => $scope.initAudioBar()
              )
            );

            ctrl.directiveSubscriptions.add(
              StateEditorService.onShowTranslationTabBusyModal.subscribe(
                () => $scope.openTranslationTabBusyModal()
              )
            );
            ctrl.directiveSubscriptions.add(
              AudioPlayerService.viewUpdate.subscribe(() => {
                $scope.$applyAsync();
              })
            );
            ctrl.directiveSubscriptions.add(
              AudioPlayerService.onAudioStop.subscribe(() => {
                $scope.$applyAsync();
              })
            );
            $scope.initAudioBar();
          };
          ctrl.$onDestroy = function() {
            ctrl.directiveSubscriptions.unsubscribe();
          };
        }]
    };
  }]);
