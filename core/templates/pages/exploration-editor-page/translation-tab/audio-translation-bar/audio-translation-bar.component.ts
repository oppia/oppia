// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the audio translation bar.
 */

import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { downgradeComponent } from '@angular/upgrade/static';
import WaveSurfer from 'wavesurfer.js';
import { Subscription } from 'rxjs';
import { OppiaAngularRootComponent } from 'components/oppia-angular-root.component';
import { DeleteAudioTranslationModalComponent } from 'pages/exploration-editor-page/translation-tab/modal-templates/delete-audio-translation-modal.component';
import { TranslationTabBusyModalComponent } from 'pages/exploration-editor-page/translation-tab/modal-templates/translation-tab-busy-modal.component';
import { AddAudioTranslationModalComponent } from '../modal-templates/add-audio-translation-modal.component';
import { UserExplorationPermissionsService } from 'pages/exploration-editor-page/services/user-exploration-permissions.service';
import { UserService } from 'services/user.service';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { StateRecordedVoiceoversService } from 'components/state-editor/state-editor-properties-services/state-recorded-voiceovers.service';
import { ExplorationStatesService } from 'pages/exploration-editor-page/services/exploration-states.service';
import { GraphDataService } from 'pages/exploration-editor-page/services/graph-data.service';
import { AlertsService } from 'services/alerts.service';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { AudioPlayerService } from 'services/audio-player.service';
import { ContextService } from 'services/context.service';
import { EditabilityService } from 'services/editability.service';
import { ExternalSaveService } from 'services/external-save.service';
import { IdGenerationService } from 'services/id-generation.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { TranslationLanguageService } from '../services/translation-language.service';
import { TranslationStatusService } from '../services/translation-status.service';
import { TranslationTabActiveContentIdService } from '../services/translation-tab-active-content-id.service';
import { Voiceover } from 'domain/exploration/voiceover.model';
import { ExplorationEditorPageConstants } from 'pages/exploration-editor-page/exploration-editor-page.constants';
import { VoiceoverRecordingService } from '../services/voiceover-recording.service';

@Component({
  selector: 'oppia-audio-translation-bar',
  templateUrl: './audio-translation-bar.component.html'
})
export class AudioTranslationBarComponent implements OnInit, OnDestroy {
  @Input() isTranslationTabBusy: boolean;
  @ViewChild('visualized') visualized!: ElementRef<Element>;

  directiveSubscriptions = new Subscription();

  dropAreaIsAccessible: boolean;
  userIsGuest: boolean;
  unsavedAudioIsPlaying: boolean;
  selectedRecording: boolean;
  audioIsUpdating: boolean;
  audioBlob: Blob | MediaSource;
  showRecorderWarning: boolean;
  languageCode: string;
  contentId: string;
  audioNeedsUpdate: boolean;
  recordingPermissionDenied: boolean;
  cannotRecord: boolean;
  checkingMicrophonePermission: boolean;
  unsupportedBrowser: boolean;
  isAudioAvailable: boolean;
  canVoiceover: boolean;
  audioLoadingIndicatorIsShown: boolean;
  audioTimerIsShown: boolean;
  audioIsCurrentlyBeingSaved: boolean;
  elapsedTime: number = 0;
  recordingComplete: boolean;
  timerInterval: NodeJS.Timer;
  durationSecs: number;
  waveSurfer: WaveSurfer;
  recordingTimeLimit: number;
  audioIsLoading: boolean;
  recordingDate: number;
  startingDuration: number;

  constructor(
    private alertsService: AlertsService,
    private assetsBackendApiService: AssetsBackendApiService,
    private audioPlayerService: AudioPlayerService,
    private contextService: ContextService,
    private editabilityService: EditabilityService,
    private explorationStatesService: ExplorationStatesService,
    private externalSaveService: ExternalSaveService,
    private graphDataService: GraphDataService,
    private idGenerationService: IdGenerationService,
    private ngbModal: NgbModal,
    private siteAnalyticsService: SiteAnalyticsService,
    private stateEditorService: StateEditorService,
    private stateRecordedVoiceoversService: StateRecordedVoiceoversService,
    private translationLanguageService: TranslationLanguageService,
    private translationStatusService: TranslationStatusService,
    private translationTabActiveContentIdService:
      TranslationTabActiveContentIdService,
    private userExplorationPermissionsService:
      UserExplorationPermissionsService,
    private userService: UserService,
    public voiceoverRecorder: VoiceoverRecordingService,
  ) { }

  setProgress(val: {value: number}): void {
    this.audioPlayerService.setCurrentTime(val.value);
  }

  saveRecordedVoiceoversChanges(): void {
    this.stateRecordedVoiceoversService.saveDisplayedValue();
    let stateName = this.stateEditorService.getActiveStateName();
    let value = this.stateRecordedVoiceoversService.displayed;
    this.explorationStatesService.saveRecordedVoiceovers(stateName, value);
    this.translationStatusService.refresh();
  }

  getAvailableAudio(contentId: string, languageCode: string): Voiceover {
    if (this.contentId) {
      return (
        this.stateRecordedVoiceoversService.displayed.getVoiceover(
          contentId, languageCode));
    }
  }

  cancelTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  generateNewFilename(): string {
    return (
      this.contentId + '-' +
       this.languageCode + '-' +
       this.idGenerationService.generateNewId() + '.mp3');
  }

  showPermissionAndStartRecording(): void {
    this.checkingMicrophonePermission = true;
    this.voiceoverRecorder.startRecordingAsync().then(() => {
      // When the user accepts the microphone access.
      this.showRecorderWarning = true;
      this.isTranslationTabBusy = true;

      this.recordingPermissionDenied = false;
      this.cannotRecord = false;
      this.selectedRecording = true;
      this.checkingMicrophonePermission = false;

      this.recordingDate = 0;
      this.elapsedTime = 0;
      OppiaAngularRootComponent.ngZone.runOutsideAngular(() => {
        this.timerInterval = setInterval(() => {
          OppiaAngularRootComponent.ngZone.run(() => {
            this.elapsedTime++;
            this.recordingDate = this.elapsedTime;

            // This.recordingTimeLimit is decremented to
            // compensate for the audio recording timing inconsistency,
            // so it allows the server to accept the recording.
            if (this.elapsedTime === this.recordingTimeLimit - 1) {
              this.stopRecording();
            }
          });
        }, 1000);
      });
    }, () => {
      // When the user denies microphone access.
      this.recordingPermissionDenied = true;
      this.cannotRecord = true;
      this.checkingMicrophonePermission = false;
    });
  }

  checkAndStartRecording(): void {
    this.voiceoverRecorder.initRecorder();

    if (!this.voiceoverRecorder.status().isAvailable) {
      this.unsupportedBrowser = true;
      this.cannotRecord = true;
    } else {
      this.siteAnalyticsService.registerStartAudioRecordingEvent(null);
      this.unsupportedBrowser = false;
      this.showPermissionAndStartRecording();
    }
  }

  toggleAudioNeedsUpdate(): void {
    this.stateRecordedVoiceoversService.displayed.toggleNeedsUpdateAttribute(
      this.contentId, this.languageCode);
    this.saveRecordedVoiceoversChanges();
    this.audioNeedsUpdate = !this.audioNeedsUpdate;
  }

  reRecord(): void {
    this.initAudioBar();
    this.selectedRecording = false;
    this.checkAndStartRecording();
  }

  cancelRecording(): void {
    this.initAudioBar();
    this.selectedRecording = false;
    this.audioIsUpdating = false;
    this.audioBlob = null;
    this.showRecorderWarning = false;
  }

  stopRecording(): void {
    this.voiceoverRecorder.stopRecord();
    this.recordingComplete = true;

    this.cancelTimer();

    this.voiceoverRecorder.getMp3Data().subscribe((audio: BlobPart[]) => {
      let fileType = 'audio/mp3';
      this.audioBlob = new Blob(audio, {type: fileType});
      // Free the browser from web worker.
      this.voiceoverRecorder.closeRecorder();
      // Create audio play and pause for unsaved recording.
      let url = URL.createObjectURL(this.audioBlob);
      // Create visualizer for playing unsaved audio.

      // When new WaveSurfer is created old waveSurfer should be deleted so
      // to do that innerHTML is turend to empty string.
      // eslint-disable-next-line oppia/no-inner-html
      this.visualized.nativeElement.innerHTML = '';
      this.waveSurfer = WaveSurfer.create({
        container: '#visualized',
        waveColor: '#009688',
        progressColor: '#cccccc',
        height: 38
      });
      this.waveSurfer.empty();
      this.waveSurfer.load(url);
    }
    );
  }

  waveSurferOnFinishCb(): void {
    this.unsavedAudioIsPlaying = false;
  }

  // Play and pause for unsaved recording.
  playAndPauseUnsavedAudio(): void {
    this.unsavedAudioIsPlaying = !this.unsavedAudioIsPlaying;
    if (this.unsavedAudioIsPlaying) {
      this.waveSurfer.play();
      this.waveSurfer.on('finish', this.waveSurferOnFinishCb.bind(this));
    } else {
      this.waveSurfer.pause();
    }
  }

  toggleStartAndStopRecording(): void {
    if (!this.voiceoverRecorder.status().isRecording &&
         !this.audioBlob) {
      this.checkAndStartRecording();
    } else {
      this.stopRecording();
    }
  }

  updateAudio(): void {
    this.audioPlayerService.stop();
    this.audioPlayerService.clear();
    this.audioBlob = null;
    this.audioIsUpdating = true;
    this.selectedRecording = false;
    this.checkAndStartRecording();
  }

  saveRecordedAudio(): void {
    this.audioIsCurrentlyBeingSaved = true;
    this.siteAnalyticsService.registerSaveRecordedAudioEvent(null);

    let filename = this.generateNewFilename();
    let fileType = 'audio/mp3';
    let contentId = this.contentId;
    let languageCode = this.languageCode;
    let recordedAudioFile = new File(
      [this.audioBlob as BlobPart], filename, {type: fileType});
    this.showRecorderWarning = false;

    Promise.resolve(
      this.assetsBackendApiService.saveAudio(
        this.contextService.getExplorationId(), filename, recordedAudioFile)
    ).then((response) => {
      if (this.audioIsUpdating) {
        this.stateRecordedVoiceoversService.displayed.deleteVoiceover(
          contentId, languageCode);
        this.audioIsUpdating = false;
      }
      this.stateRecordedVoiceoversService.displayed.addVoiceover(
        contentId, languageCode, filename, recordedAudioFile.size,
        response.duration_secs);
      this.durationSecs = Math.round(response.duration_secs);
      this.saveRecordedVoiceoversChanges();
      this.alertsService.addSuccessMessage(
        'Succesfuly uploaded recorded audio.');
      this.audioIsCurrentlyBeingSaved = false;
      this.initAudioBar();

      setTimeout(() => {
        this.graphDataService.recompute();
      });
    }, (errorResponse) => {
      this.audioIsCurrentlyBeingSaved = false;
      this.alertsService.addWarning(errorResponse.error);
      this.initAudioBar();
    });
  }

  getTranslationTabBusyMessage(): string {
    let message = '';
    if (this.voiceoverRecorder.status().isRecording) {
      message = 'You haven\'t finished recording. Please stop ' +
         'recording and either save or cancel the recording.';
    } else if (this.showRecorderWarning) {
      message = 'You haven\'t saved your recording. Please save or ' +
         'cancel the recording.';
    }
    return message;
  }

  openTranslationTabBusyModal(): void {
    const modalRef = this.ngbModal.open(TranslationTabBusyModalComponent, {
      backdrop: true,
    });

    modalRef.componentInstance.busyMessage =
       this.getTranslationTabBusyMessage();

    modalRef.result.then(() => {}, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  playPauseUploadedAudioTranslation(languageCode: string): void {
    this.audioTimerIsShown = true;
    if (!this.audioPlayerService.isPlaying()) {
      if (this.audioPlayerService.isTrackLoaded()) {
        this.audioPlayerService.play();
        this.audioTimerIsShown = true;
      } else {
        this.loadAndPlayAudioTranslation();
      }
    } else {
      this.audioPlayerService.pause();
    }
  }

  isPlayingUploadedAudio(): boolean {
    return this.audioPlayerService.isPlaying();
  }

  loadAndPlayAudioTranslation(): void {
    this.audioLoadingIndicatorIsShown = true;

    let audioTranslation = this.getAvailableAudio(
      this.contentId, this.languageCode);

    if (audioTranslation) {
      this.audioPlayerService.loadAsync(audioTranslation.filename)
        .then(() => {
          this.audioLoadingIndicatorIsShown = false;
          this.audioIsLoading = false;
          this.audioTimerIsShown = true;
          this.audioPlayerService.play();
        });
    }
  }

  initAudioBar(): void {
    // This stops the voiceoverRecorder when user navigates
    // while recording.
    if (this.voiceoverRecorder) {
      if (this.voiceoverRecorder.status().isRecording &&
         this.showRecorderWarning) {
        this.voiceoverRecorder.stopRecord();
        this.cancelTimer();
        this.voiceoverRecorder.closeRecorder();
      }
    }
    this.isTranslationTabBusy = false;
    this.audioPlayerService.stop();
    this.audioPlayerService.clear();
    this.showRecorderWarning = false;
    // Re-initialize for unsaved recording.
    this.unsavedAudioIsPlaying = false;
    this.waveSurfer = null;
    this.languageCode = this.translationLanguageService
      .getActiveLanguageCode();
    this.canVoiceover = this.editabilityService.isTranslatable();
    this.contentId = (
      this.translationTabActiveContentIdService.getActiveContentId());
    let audioTranslationObject = this.getAvailableAudio(
      this.contentId, this.languageCode);
    if (audioTranslationObject) {
      this.isAudioAvailable = true;
      this.audioIsLoading = true;
      this.selectedRecording = false;
      this.audioNeedsUpdate = audioTranslationObject.needsUpdate;
      this.durationSecs =
         Math.round(audioTranslationObject.durationSecs);
    } else {
      this.isAudioAvailable = false;
      this.audioBlob = null;
      this.selectedRecording = false;
    }
  }

  openDeleteAudioTranslationModal(): void {
    this.ngbModal.open(DeleteAudioTranslationModalComponent, {
      backdrop: true
    }).result.then(() => {
      this.stateRecordedVoiceoversService.displayed.deleteVoiceover(
        this.contentId, this.languageCode);
      this.saveRecordedVoiceoversChanges();
      this.initAudioBar();
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  openAddAudioTranslationModal(audioFile: FileList): void {
    this.siteAnalyticsService.registerUploadAudioEvent(null);
    const modalRef = this.ngbModal.open(AddAudioTranslationModalComponent, {
      backdrop: 'static',
    });

    modalRef.componentInstance.audioFile = audioFile;
    modalRef.componentInstance.generatedFilename = (
      this.generateNewFilename());
    modalRef.componentInstance.languageCode = this.languageCode;
    modalRef.componentInstance.isAudioAvailable = (
      this.isAudioAvailable);

    modalRef.result.then((result) => {
      if (this.isAudioAvailable) {
        this.stateRecordedVoiceoversService.displayed.deleteVoiceover(
          this.contentId, this.languageCode);
      }
      this.stateRecordedVoiceoversService.displayed.addVoiceover(
        this.contentId, this.languageCode, result.filename,
        result.fileSizeBytes, result.durationSecs);
      this.durationSecs = Math.round(result.durationSecs);
      this.saveRecordedVoiceoversChanges();
      this.initAudioBar();
    }, () => {
      this.alertsService.clearWarnings();
    });
  }

  ngOnInit(): void {
    this.recordingTimeLimit = (
      ExplorationEditorPageConstants.RECORDING_TIME_LIMIT);
    this.startingDuration = 0;
    this.unsupportedBrowser = false;
    this.selectedRecording = false;
    this.isAudioAvailable = false;
    this.audioIsUpdating = false;
    this.cannotRecord = false;
    this.audioNeedsUpdate = false;
    this.canVoiceover = false;
    this.showRecorderWarning = false;
    this.audioLoadingIndicatorIsShown = false;
    this.checkingMicrophonePermission = false;
    this.audioTimerIsShown = true;
    this.audioIsCurrentlyBeingSaved = false;
    this.elapsedTime = 0;
    this.unsavedAudioIsPlaying = false;

    document.body.onkeyup = (e) => {
      if (!this.canVoiceover) {
        return;
      }
      if (e.code === 'KeyR' && !this.isAudioAvailable) {
        // Used as shortcut key for recording.
        this.toggleStartAndStopRecording();
      }
    };

    this.directiveSubscriptions.add(
      this.externalSaveService.onExternalSave.subscribe(() => {
        if (this.voiceoverRecorder.status().isRecording) {
          this.voiceoverRecorder.stopRecord();
          this.voiceoverRecorder.closeRecorder();
        }
        this.audioPlayerService.stop();
        this.audioPlayerService.clear();
      })
    );

    this.directiveSubscriptions.add(
      this.translationTabActiveContentIdService.onActiveContentIdChanged.
        subscribe(
          () => this.initAudioBar()
        )
    );

    this.directiveSubscriptions.add(
      this.translationLanguageService.onActiveLanguageChanged.subscribe(
        () => this.initAudioBar()
      )
    );

    this.directiveSubscriptions.add(
      this.stateEditorService.onShowTranslationTabBusyModal.subscribe(
        () => this.openTranslationTabBusyModal()
      )
    );
    this.directiveSubscriptions.add(
      this.audioPlayerService.viewUpdate.subscribe(() => {
      })
    );
    this.directiveSubscriptions.add(
      this.audioPlayerService.onAudioStop.subscribe(() => {
      })
    );

    let userIsLoggedIn;

    this.userService.getUserInfoAsync().then((userInfo) => {
      userIsLoggedIn = userInfo.isLoggedIn();
      return this.userExplorationPermissionsService.getPermissionsAsync();
    }).then((permissions) => {
      $('.oppia-translation-tab').on('dragover', (evt) => {
        evt.preventDefault();
        this.dropAreaIsAccessible = permissions.canVoiceover;
        this.userIsGuest = !userIsLoggedIn;
        return false;
      });
    });

    $('.oppia-main-body').on('dragleave', (evt) => {
      evt.preventDefault();
      if (evt.pageX === 0 || evt.pageY === 0) {
        this.dropAreaIsAccessible = false;
        this.userIsGuest = false;
      }
      return false;
    });

    $('.oppia-translation-tab').on('drop', (evt) => {
      evt.preventDefault();
      if (
        // TODO(#13015): Remove use of unknown as a type.
        // The way to remove this unknown is migrating jQuery.
        // So probably #12882 also.
        (evt.target as unknown as Element).classList.contains(
          'oppia-drop-area-message'
        ) && this.dropAreaIsAccessible
      ) {
        let files = (evt.originalEvent as DragEvent).dataTransfer.files;
        this.openAddAudioTranslationModal(files);
      }
      this.dropAreaIsAccessible = false;
      return false;
    });

    // // This is needed in order for the scope to be retrievable during Karma
    // // unit testing. See http://stackoverflow.com/a/29833832 for more
    // // details.
    // elm[0].getControllerScope = () => {
    //   return scope;
    // };

    this.initAudioBar();
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();

    document.body.onkeyup = null;
    // TODO(#12146): Remove jQuery usage below.
    // Remove jQuery event listeners.
    $('.oppia-translation-tab').off('dragover');
    $('.oppia-main-body').off('dragleave');
    $('.oppia-translation-tab').off('drop');
    // Remove wavesurefer finish event listener.
    this.waveSurfer?.un('finish', this.waveSurferOnFinishCb.bind(this));
  }
}

angular.module('oppia').directive('oppiaAudioTranslationBar',
   downgradeComponent({
     component: AudioTranslationBarComponent
   }) as angular.IDirectiveFactory);
