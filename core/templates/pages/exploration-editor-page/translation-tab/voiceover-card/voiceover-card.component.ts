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
import {EntityVoiceoversService} from 'services/entity-voiceovers.services';
import {EntityVoiceovers} from 'domain/voiceover/entity-voiceovers.model';

@Component({
  selector: 'oppia-voiceover-card',
  templateUrl: './voiceover-card.component.html',
})
export class VoiceoverCardComponent implements OnInit {
  @ViewChild('visualized') visualized!: ElementRef<Element>;
  directiveSubscriptions = new Subscription();
  languageCode: string;
  availableLanguageAccentCodesToDescriptions;
  supportedLanguageAccentCodesLength: number = 0;
  supportedLanguageAccentCodesToDescriptions;
  languageCodesMapping;
  contentId: string;
  manualVoiceover = null;
  pageIsLoaded: boolean = false;
  startingDuration: number;
  durationSecs: number;
  languageAccentCode: string;
  languageAccentCodeIsSelected: boolean = false;
  isAudioAvailable: boolean = false;
  voiceoversAreLoaded: boolean = false;
  audioIsLoaded: boolean = false;
  manualVoiceoverDuration: number = 0;
  currentVoiceoverDuration: number = 0;
  voiceoverProgress: number = 0;
  languageAccentDescription!: string;
  languageAccentMasterList = {};
  activeEntityVoiceoversInstance: EntityVoiceovers;
  languageAccentLoaded: boolean = false;

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
    private localStorageService: LocalStorageService,
    private entityVoiceoversService: EntityVoiceoversService
  ) {}

  ngOnInit(): void {
    this.pageIsLoaded = false;
    this.voiceoversAreLoaded = false;

    this.voiceoverBackendApiService
      .fetchVoiceoverAdminDataAsync()
      .then(voiceoverLanguages => {
        this.languageAccentLoaded = true;
        this.languageAccentMasterList =
          voiceoverLanguages.languageAccentMasterList;
        this.languageCodesMapping = voiceoverLanguages.languageCodesMapping;

        this.availableLanguageAccentCodesToDescriptions =
          this.languageAccentMasterList[this.languageCode];

        let supportedLanguageAccentCodes =
          this.languageCodesMapping[this.languageCode];

        this.supportedLanguageAccentCodesToDescriptions = {};
        for (let accentCode in supportedLanguageAccentCodes) {
          let description =
            this.availableLanguageAccentCodesToDescriptions[accentCode];
          this.supportedLanguageAccentCodesToDescriptions[accentCode] =
            description;
        }
        this.supportedLanguageAccentCodesLength = 0;

        if (this.supportedLanguageAccentCodesToDescriptions) {
          this.supportedLanguageAccentCodesLength = Object.keys(
            this.supportedLanguageAccentCodesToDescriptions
          ).length;
        }

        this.pageIsLoaded = true;
      });

    this.directiveSubscriptions.add(
      this.translationLanguageService.onActiveLanguageChanged.subscribe(() => {
        this.updateLanguageCode();
      })
    );

    this.directiveSubscriptions.add(
      this.translationTabActiveContentIdService.onActiveContentIdChanged.subscribe(
        () => {
          this.updateContent();
        }
      )
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

  updateContent() {
    this.voiceoversAreLoaded = false;
    this.contentId =
      this.translationTabActiveContentIdService.getActiveContentId();

    let languageAccentCode =
      this.localStorageService.getLastSelectedLanguageAccentCode();
    this.languageAccentCodeIsSelected = languageAccentCode !== 'undefined';
    if (this.languageAccentCodeIsSelected) {
      this.setActiveContentManualVoiceover();
      this.languageAccentCode = languageAccentCode;
    }
    this.voiceoversAreLoaded = true;
  }

  updateLanguageCode() {
    let newLanguageCode =
      this.translationLanguageService.getActiveLanguageCode();

    if (this.languageCode === undefined) {
      this.languageAccentCode =
        this.localStorageService.getLastSelectedLanguageAccentCode();

      this.languageAccentCodeIsSelected =
        this.languageAccentCode !== 'undefined';
    } else if (this.languageCode !== newLanguageCode) {
      this.localStorageService.setLastSelectedLanguageAccentCode(undefined);
      this.languageAccentCode = undefined;
      this.languageAccentCodeIsSelected = false;
    }

    this.languageCode = this.translationLanguageService.getActiveLanguageCode();
    this.entityVoiceoversService.setLanguageCode(this.languageCode);
    // this.entityVoiceoversService.fetchEntityVoiceovers();

    if (this.languageAccentLoaded) {
      this.availableLanguageAccentCodesToDescriptions =
        this.languageAccentMasterList[this.languageCode];

      let supportedLanguageAccentCodes =
        this.languageCodesMapping[this.languageCode];
      this.supportedLanguageAccentCodesToDescriptions = {};
      for (let accentCode in supportedLanguageAccentCodes) {
        let description =
          this.availableLanguageAccentCodesToDescriptions[accentCode];
        this.supportedLanguageAccentCodesToDescriptions[accentCode] =
          description;
      }
      this.supportedLanguageAccentCodesLength = 0;
      if (this.supportedLanguageAccentCodesToDescriptions) {
        this.supportedLanguageAccentCodesLength = Object.keys(
          this.supportedLanguageAccentCodesToDescriptions
        ).length;
      }
    }
  }

  setActiveContentManualVoiceover() {
    this.activeEntityVoiceoversInstance =
      this.entityVoiceoversService.getVoiceoverInGivenLanguageAccentCode(
        this.languageAccentCode
      );

    this.currentVoiceoverDuration = 0;
    this.voiceoverProgress = 0;
    this.audioIsLoaded = false;
    this.audioPlayerService.clear();

    if (this.activeEntityVoiceoversInstance) {
      let voiceovers =
        this.activeEntityVoiceoversInstance.voiceovers[this.contentId];

      if (voiceovers) {
        this.manualVoiceover = voiceovers.manual;
        this.manualVoiceoverDuration = Math.round(
          this.manualVoiceover.durationSecs
        );
      } else {
        this.manualVoiceover = undefined;
      }
    } else {
      this.manualVoiceover = undefined;
    }
  }

  updateLanguageAccentCode(languageAccentCode) {
    this.languageAccentCode = languageAccentCode;
    this.languageAccentCodeIsSelected = true;
    this.localStorageService.setLastSelectedLanguageAccentCode(
      languageAccentCode
    );

    this.setActiveContentManualVoiceover();
  }

  getVoiceovers(languageAccentCode: string): void {
    this.localStorageService.setLastSelectedLanguageAccentCode(
      languageAccentCode
    );
    this.languageAccentCode = languageAccentCode;
    this.contentId =
      this.translationTabActiveContentIdService.getActiveContentId();

    this.currentVoiceoverDuration = 0;
    this.voiceoverProgress = 0;
    this.audioIsLoaded = false;
    this.audioPlayerService.clear();

    let entityVoiceovers =
      this.entityVoiceoversService.getVoiceoverInGivenLanguageAccentCode(
        languageAccentCode
      );
    if (entityVoiceovers) {
      let voiceovers = entityVoiceovers.voiceovers[this.contentId];

      if (voiceovers) {
        this.manualVoiceover = voiceovers.manual;
      } else {
        this.manualVoiceover = undefined;
      }
    } else {
      this.manualVoiceover = undefined;
    }

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

        if (this.activeEntityVoiceoversInstance === undefined) {
          this.activeEntityVoiceoversInstance = new EntityVoiceovers(
            this.contextService.getExplorationId(),
            'exploration',
            this.contextService.getExplorationVersion(),
            this.languageAccentCode,
            {}
          );
        }

        this.activeEntityVoiceoversInstance.voiceovers[this.contentId] = {
          manual: this.manualVoiceover,
        };
        this.entityVoiceoversService.addManualVoiceover(
          this.languageAccentCode,
          this.activeEntityVoiceoversInstance
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
