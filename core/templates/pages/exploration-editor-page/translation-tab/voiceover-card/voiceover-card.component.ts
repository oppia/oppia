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

import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {downgradeComponent} from '@angular/upgrade/static';
import {Subscription} from 'rxjs';
import {AddAudioTranslationModalComponent} from '../modal-templates/add-audio-translation-modal.component';
import {AlertsService} from 'services/alerts.service';
import {AudioPlayerService} from 'services/audio-player.service';
import {ContextService} from 'services/context.service';
import {IdGenerationService} from 'services/id-generation.service';
import {TranslationLanguageService} from '../services/translation-language.service';
import {TranslationTabActiveContentIdService} from '../services/translation-tab-active-content-id.service';
import {Voiceover} from 'domain/exploration/voiceover.model';
import {VoiceoverBackendApiService} from 'domain/voiceover/voiceover-backend-api.service';
import {ChangeListService} from 'pages/exploration-editor-page/services/change-list.service';
import {VoiceoverRemovalConfirmModalComponent} from './modals/voiceover-removal-confirm-modal.component';
import {LocalStorageService} from 'services/local-storage.service';

@Component({
  selector: 'oppia-voiceover-card',
  templateUrl: './voiceover-card.component.html',
})
export class VoiceoverCardComponent implements OnInit {
  @Input() isTranslationTabBusy: boolean;
  @ViewChild('visualized') visualized!: ElementRef<Element>;
  directiveSubscriptions = new Subscription();
  languageCode: string;
  availableLanguageAccentCodesToDescriptions;
  availableLanguageAccentCodesLength: number = 0;
  contentId: string;
  manualVoiceover = null;
  pageIsLoaded: boolean = false;
  startingDuration: number;
  durationSecs: number;
  languageAccentCode: string;
  isAudioAvailable: boolean = false;
  voiceoversAreLoaded: boolean = false;
  audioIsLoaded: boolean = false;
  manualVoiceoverDuration: number = 0;
  currentVoiceoverDuration: number = 0;
  voiceoverProgress: number = 0;
  languageAccentDescription!: string;

  constructor(
    private audioPlayerService: AudioPlayerService,
    private contextService: ContextService,
    private translationLanguageService: TranslationLanguageService,
    private translationTabActiveContentIdService: TranslationTabActiveContentIdService,
    private voiceoverBackendApiService: VoiceoverBackendApiService,
    private ngbModal: NgbModal,
    private idGenerationService: IdGenerationService,
    private alertsService: AlertsService,
    private changeListService: ChangeListService,
    private localStorageService: LocalStorageService
  ) {}

  ngOnInit(): void {
    this.pageIsLoaded = false;
    this.voiceoversAreLoaded = false;
    this.directiveSubscriptions.add(
      this.translationLanguageService.onActiveLanguageChanged.subscribe(() => {
        this.languageCode =
          this.translationLanguageService.getActiveLanguageCode();
        this.voiceoverBackendApiService
          .fetchVoiceoverAdminDataAsync()
          .then(response => {
            this.availableLanguageAccentCodesToDescriptions =
              response.languageAccentMasterList[this.languageCode];
            this.pageIsLoaded = true;
            if (this.availableLanguageAccentCodesToDescriptions) {
              this.availableLanguageAccentCodesLength = Object.keys(
                this.availableLanguageAccentCodesToDescriptions
              ).length;
            }
            this.languageAccentCode =
              this.localStorageService.getLastSelectedLanguageAccentCode();
            this.contentId =
              this.translationTabActiveContentIdService.getActiveContentId();
          });
      })
    );
    setInterval(() => {
      if (
        this.audioPlayerService.isTrackLoaded() &&
        this.audioPlayerService.isPlaying()
      ) {
        this.currentVoiceoverDuration =
          this.audioPlayerService.getCurrentTime();
        this.voiceoverProgress = Math.round(
          (this.currentVoiceoverDuration / this.manualVoiceoverDuration) * 100
        );
        this.audioIsLoaded = true;
      }
    }, 1000);
  }

  getVoiceovers(languageAccentCode: string): void {
    this.localStorageService.setLastSelectedLanguageAccentCode(
      languageAccentCode
    );
    this.languageAccentCode = languageAccentCode;
    let explorationId = this.contextService.getExplorationId();
    this.contentId =
      this.translationTabActiveContentIdService.getActiveContentId();
    let explorationVersion = this.contextService.getExplorationVersion();
    let entityType = 'exploration';
    this.currentVoiceoverDuration = 0;
    this.voiceoverProgress = 0;
    this.audioIsLoaded = false;
    this.audioPlayerService.clear();

    this.voiceoverBackendApiService
      .fetchVoiceoversAsync(
        entityType,
        explorationId,
        explorationVersion,
        languageAccentCode,
        this.contentId
      )
      .then(response => {
        this.manualVoiceover = response.manualVoiceover;
        if (this.manualVoiceover !== null) {
          this.manualVoiceoverDuration = Math.round(
            this.manualVoiceover.durationSecs
          );
          this.audioIsLoaded = true;
        }
      });

    this.voiceoversAreLoaded = true;
  }

  playAndPauseVoiceover(filename: string): void {
    if (this.audioPlayerService.isPlaying()) {
      this.audioPlayerService.pause();
      return;
    }
    if (this.audioPlayerService.isTrackLoaded()) {
      this.audioPlayerService.play();
    } else {
      this.audioPlayerService.loadAsync(filename).then(() => {
        this.audioIsLoaded = true;
        this.audioPlayerService.play();
      });
    }
  }

  deleteManualVoiceover(): void {
    const modalRef = this.ngbModal.open(VoiceoverRemovalConfirmModalComponent, {
      backdrop: 'static',
    });
    modalRef.result.then(
      () => {
        this.manualVoiceover = null;
        this.changeListService.editVoiceovers(
          this.contentId,
          this.languageAccentCode,
          {}
        );
      },
      () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is
        // clicked. No further action is needed.
      }
    );
  }

  toggleAudioNeedsUpdate(): void {
    this.manualVoiceover.needsUpdate = !this.manualVoiceover.needsUpdate;
    this.changeListService.editVoiceovers(
      this.contentId,
      this.languageAccentCode,
      {
        manual: this.manualVoiceover.toBackendDict(),
      }
    );
  }

  addManualVoiceover(): void {
    const modalRef = this.ngbModal.open(AddAudioTranslationModalComponent, {
      backdrop: 'static',
    });

    modalRef.componentInstance.audioFile = undefined;
    modalRef.componentInstance.generatedFilename = this.generateNewFilename();
    modalRef.componentInstance.languageCode = this.languageCode;
    modalRef.componentInstance.isAudioAvailable = this.isAudioAvailable;

    modalRef.result.then(
      result => {
        this.manualVoiceover = new Voiceover(
          result.filename,
          result.fileSizeBytes,
          false,
          result.durationSecs
        );

        this.changeListService.editVoiceovers(
          this.contentId,
          this.languageAccentCode,
          {
            manual: this.manualVoiceover.toBackendDict(),
          }
        );
        this.manualVoiceoverDuration = Math.round(
          this.manualVoiceover.durationSecs
        );
      },
      () => {
        this.alertsService.clearWarnings();
      }
    );
  }

  generateNewFilename(): string {
    return (
      this.contentId +
      '-' +
      this.languageAccentCode +
      '-' +
      this.idGenerationService.generateNewId() +
      '.mp3'
    );
  }
}

angular.module('oppia').directive(
  'oppiaVoiceoverCardComponent',
  downgradeComponent({
    component: VoiceoverCardComponent,
  }) as angular.IDirectiveFactory
);
