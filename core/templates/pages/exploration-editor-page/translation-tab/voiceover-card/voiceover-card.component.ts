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

import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
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
import {ChangeListService} from 'pages/exploration-editor-page/services/change-list.service';
import {VoiceoverRemovalConfirmModalComponent} from './modals/voiceover-removal-confirm-modal.component';
import {LocalStorageService} from 'services/local-storage.service';
import {EntityVoiceoversService} from 'services/entity-voiceovers.services';
import {EntityVoiceovers} from 'domain/voiceover/entity-voiceovers.model';
import {TranslationStatusService} from '../services/translation-status.service';
import {GraphDataService} from 'pages/exploration-editor-page/services/graph-data.service';
import {
  LanguageAccentToDescription,
  VoiceoverBackendApiService,
} from 'domain/voiceover/voiceover-backend-api.service';

@Component({
  selector: 'oppia-voiceover-card',
  templateUrl: './voiceover-card.component.html',
})
export class VoiceoverCardComponent implements OnInit {
  @ViewChild('visualized') visualized!: ElementRef<Element>;
  directiveSubscriptions = new Subscription();

  pageIsLoaded: boolean = false;
  audioIsLoaded: boolean = false;
  languageAccentCodesAreLoaded: boolean = false;
  isAudioAvailable: boolean = false;
  voiceoversAreLoaded: boolean = false;
  languageAccentCodeIsSelected: boolean = false;

  manualVoiceover: Voiceover = null;
  manualVoiceoverDuration: number = 0;
  currentVoiceoverDuration: number = 0;
  voiceoverProgress: number = 0;

  activeContentId: string;
  languageCode: string;
  languageAccentCode: string;
  languageCodesMapping;

  availableLanguageAccentCodesToDescriptions: LanguageAccentToDescription = {};
  supportedLanguageAccentCodesToDescriptions: LanguageAccentToDescription = {};
  supportedLanguageAccentCodesLength: number = 0;

  languageAccentDescription!: string;
  languageAccentMasterList = {};
  activeEntityVoiceoversInstance: EntityVoiceovers;

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
    private entityVoiceoversService: EntityVoiceoversService,
    private translationStatusService: TranslationStatusService,
    private graphDataService: GraphDataService
  ) {}

  ngOnInit(): void {
    this.pageIsLoaded = false;
    this.languageAccentCodesAreLoaded = false;

    this.voiceoverBackendApiService
      .fetchVoiceoverAdminDataAsync()
      .then(voiceoverLanguages => {
        this.languageAccentMasterList =
          voiceoverLanguages.languageAccentMasterList;

        this.languageCodesMapping = voiceoverLanguages.languageCodesMapping;

        this.updateLanguageAccentCodesDropdownOptions();

        this.pageIsLoaded = true;
        this.languageAccentCodesAreLoaded = true;
      });

    this.directiveSubscriptions.add(
      this.translationLanguageService.onActiveLanguageChanged.subscribe(() => {
        this.updateLanguageCode();
      })
    );

    this.directiveSubscriptions.add(
      this.translationTabActiveContentIdService.onActiveContentIdChanged.subscribe(
        () => {
          this.updateActiveContent();
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
      }
      // Check how to reset the progress when played completely.
    }, 1000);
  }

  updateLanguageAccentCodesDropdownOptions(): void {
    this.availableLanguageAccentCodesToDescriptions = {};
    this.supportedLanguageAccentCodesToDescriptions = {};
    this.supportedLanguageAccentCodesLength = 0;

    this.availableLanguageAccentCodesToDescriptions =
      this.languageAccentMasterList[this.languageCode];

    const supportedLanguageAccentCodes =
      this.languageCodesMapping[this.languageCode];

    for (let accentCode in supportedLanguageAccentCodes) {
      const description =
        this.availableLanguageAccentCodesToDescriptions[accentCode];
      this.supportedLanguageAccentCodesToDescriptions[accentCode] = description;
    }

    if (this.supportedLanguageAccentCodesToDescriptions) {
      this.supportedLanguageAccentCodesLength = Object.keys(
        this.supportedLanguageAccentCodesToDescriptions
      ).length;
    }
  }

  updateActiveContent(): void {
    this.voiceoversAreLoaded = false;
    this.activeContentId =
      this.translationTabActiveContentIdService.getActiveContentId();

    let languageAccentCode =
      this.localStorageService.getLastSelectedLanguageAccentCode();

    this.languageAccentCodeIsSelected = languageAccentCode !== 'undefined';

    if (this.languageAccentCodeIsSelected) {
      this.setActiveContentManualVoiceover();
      this.languageAccentCode = languageAccentCode;
      this.entityVoiceoversService.setActiveLanguageAccentCode(
        languageAccentCode
      );
    }
    this.voiceoversAreLoaded = true;
  }

  updateLanguageCode(): void {
    let newLanguageCode =
      this.translationLanguageService.getActiveLanguageCode();

    // The page is reloaded.
    if (this.languageCode === undefined) {
      this.languageAccentCode =
        this.localStorageService.getLastSelectedLanguageAccentCode();

      this.languageAccentCodeIsSelected =
        this.languageAccentCode !== 'undefined';

      if (this.languageAccentCodeIsSelected) {
        this.entityVoiceoversService.setActiveLanguageAccentCode(
          this.languageAccentCode
        );
        this.translationStatusService.refresh();
        setTimeout(() => {
          this.graphDataService.recompute();
        });
      }
    } else if (this.languageCode !== newLanguageCode) {
      this.localStorageService.setLastSelectedLanguageAccentCode(undefined);
      this.languageAccentCode = undefined;
      this.languageAccentCodeIsSelected = false;
    }

    this.languageCode = this.translationLanguageService.getActiveLanguageCode();
    this.entityVoiceoversService.setLanguageCode(this.languageCode);

    if (this.languageAccentCodesAreLoaded) {
      this.updateLanguageAccentCodesDropdownOptions();
    }
  }

  setActiveContentManualVoiceover(): void {
    this.activeEntityVoiceoversInstance =
      this.entityVoiceoversService.getEntityVoiceoversByLanguageAccentCode(
        this.languageAccentCode
      );

    this.currentVoiceoverDuration = 0;
    this.voiceoverProgress = 0;
    this.audioIsLoaded = false;
    this.audioPlayerService.clear();

    if (this.activeEntityVoiceoversInstance) {
      let voiceoverTypeToVoiceovers =
        this.activeEntityVoiceoversInstance.voiceoversMapping[
          this.activeContentId
        ];

      if (voiceoverTypeToVoiceovers) {
        this.manualVoiceover = voiceoverTypeToVoiceovers.manual;
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

  updateLanguageAccentCode(languageAccentCode: string): void {
    this.languageAccentCode = languageAccentCode;
    this.entityVoiceoversService.setActiveLanguageAccentCode(
      languageAccentCode
    );
    this.languageAccentCodeIsSelected = true;
    this.localStorageService.setLastSelectedLanguageAccentCode(
      languageAccentCode
    );

    this.entityVoiceoversService.setActiveLanguageAccentCode(
      this.languageAccentCode
    );
    this.setActiveContentManualVoiceover();
    this.updateStatusGraph();
  }

  updateStatusGraph(): void {
    this.translationStatusService.refresh();
    setTimeout(() => {
      this.graphDataService.recompute();
    });
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
          this.activeContentId,
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
      this.activeContentId,
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
          this.activeContentId,
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

        this.activeEntityVoiceoversInstance.voiceoversMapping[
          this.activeContentId
        ] = {
          manual: this.manualVoiceover,
        };
        this.entityVoiceoversService.addNewEntityVoiceovers(
          this.languageAccentCode,
          this.activeEntityVoiceoversInstance
        );
        this.updateStatusGraph();
      },
      () => {
        this.alertsService.clearWarnings();
      }
    );
  }

  generateNewFilename(): string {
    return (
      this.activeContentId +
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
