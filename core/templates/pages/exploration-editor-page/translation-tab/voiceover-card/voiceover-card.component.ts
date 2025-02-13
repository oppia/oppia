// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the voiceovers in the Exploration editor page.
 */

import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
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
import {LanguageAccentToDescription} from 'domain/voiceover/voiceover-backend-api.service';
import {ExplorationChangeEditVoiceovers} from 'domain/exploration/exploration-draft.model';

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
  unsupportedLanguageCode = false;

  manualVoiceover!: Voiceover | undefined;
  manualVoiceoverDuration: number = 0;
  currentVoiceoverDuration: number = 0;
  voiceoverProgress: number = 0;

  activeContentId!: string;
  languageCode!: string;
  languageAccentCode!: string;

  availableLanguageAccentCodesToDescriptions: LanguageAccentToDescription = {};
  supportedLanguageAccentCodesToDescriptions: LanguageAccentToDescription = {};
  supportedLanguageAccentCodesLength: number = 0;

  languageAccentDescription!: string;
  activeEntityVoiceoversInstance!: EntityVoiceovers;

  constructor(
    private audioPlayerService: AudioPlayerService,
    private contextService: ContextService,
    private translationLanguageService: TranslationLanguageService,
    private translationTabActiveContentIdService: TranslationTabActiveContentIdService,
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
    this.pageIsLoaded = true;
    this.languageAccentCodesAreLoaded = true;
    this.languageAccentCode =
      this.localStorageService.getLastSelectedLanguageAccentCode() as string;
    this.languageAccentCodeIsSelected = this.languageAccentCode !== 'undefined';

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

    this.directiveSubscriptions.add(
      this.translationLanguageService.onActiveLanguageAccentChanged.subscribe(
        () => {
          let newLanguageAccentCode =
            this.localStorageService.getLastSelectedLanguageAccentCode() as string;
          this.updateLanguageAccentCode(newLanguageAccentCode);
        }
      )
    );
    this.voiceoversAreLoaded =
      Object.keys(
        this.entityVoiceoversService.languageAccentCodeToEntityVoiceovers
      ).length !== 0;
    this.directiveSubscriptions.add(
      this.entityVoiceoversService.onVoiceoverLoad.subscribe(() => {
        this.voiceoversAreLoaded = true;
      })
    );

    setInterval(() => {
      if (
        this.audioPlayerService.isTrackLoaded() &&
        this.audioPlayerService.isPlaying()
      ) {
        this.currentVoiceoverDuration = Math.floor(
          this.audioPlayerService.getCurrentTimeInSecs()
        );
        this.voiceoverProgress = Math.round(
          (this.currentVoiceoverDuration / this.manualVoiceoverDuration) * 100
        );
      } else if (!this.audioPlayerService.isTrackLoaded()) {
        this.voiceoverProgress = 0;
        this.currentVoiceoverDuration = 0;
      }
    }, 1000);
    this.updateActiveContent();
  }

  updateVoiceoverWithChangeList(): void {
    this.changeListService.getVoiceoverChangeList().forEach(changeDict => {
      changeDict = changeDict as ExplorationChangeEditVoiceovers;
      let contentId = changeDict.content_id;
      let voiceovers = changeDict.voiceovers;
      let languageAccentCode = changeDict.language_accent_code;

      let entityVoiceovers =
        this.entityVoiceoversService.getEntityVoiceoversByLanguageAccentCode(
          languageAccentCode
        );
      if (entityVoiceovers === undefined) {
        entityVoiceovers = new EntityVoiceovers(
          this.entityVoiceoversService.entityId,
          this.entityVoiceoversService.entityType,
          this.entityVoiceoversService.entityVersion,
          languageAccentCode,
          {}
        );
      }
      if (Object.keys(voiceovers).length > 0) {
        let manualVoiceover = Voiceover.createFromBackendDict(
          voiceovers.manual
        );
        entityVoiceovers.voiceoversMapping[contentId] = {
          manual: manualVoiceover,
        };
      } else {
        delete entityVoiceovers.voiceoversMapping[contentId];
      }

      this.entityVoiceoversService.addEntityVoiceovers(
        languageAccentCode,
        entityVoiceovers
      );
    });
  }

  updateActiveContent(): void {
    this.activeContentId =
      this.translationTabActiveContentIdService.getActiveContentId() as string;

    let languageAccentCode =
      this.localStorageService.getLastSelectedLanguageAccentCode() as string;

    this.languageAccentCodeIsSelected = languageAccentCode !== 'undefined';

    if (this.languageAccentCodeIsSelected) {
      this.languageAccentCode = languageAccentCode;
      this.setActiveContentManualVoiceover();
      this.entityVoiceoversService.setActiveLanguageAccentCode(
        languageAccentCode
      );
    }
  }

  updateLanguageCode(): void {
    let newLanguageCode =
      this.translationLanguageService.getActiveLanguageCode();

    if (this.languageCode === undefined) {
      this.entityVoiceoversService.fetchEntityVoiceovers().then(() => {
        this.languageAccentCode =
          this.localStorageService.getLastSelectedLanguageAccentCode() as string;

        this.languageAccentCodeIsSelected =
          this.languageAccentCode !== 'undefined';

        if (this.languageAccentCodeIsSelected) {
          this.entityVoiceoversService.setActiveLanguageAccentCode(
            this.languageAccentCode
          );
          this.updateVoiceoverWithChangeList();
          this.setActiveContentManualVoiceover();
          this.updateStatusGraph();
        }
      });
    }

    this.languageCode = newLanguageCode;
    this.entityVoiceoversService.setLanguageCode(this.languageCode);
  }

  setActiveContentManualVoiceover(): void {
    this.activeEntityVoiceoversInstance =
      this.entityVoiceoversService.getEntityVoiceoversByLanguageAccentCode(
        this.languageAccentCode
      ) as EntityVoiceovers;

    this.currentVoiceoverDuration = 0;
    this.voiceoverProgress = 0;
    this.audioIsLoaded = false;
    this.audioPlayerService.clear();
    this.manualVoiceover = undefined;

    if (this.activeEntityVoiceoversInstance === undefined) {
      return;
    }

    let voiceoverTypeToVoiceovers =
      this.activeEntityVoiceoversInstance.voiceoversMapping[
        this.activeContentId
      ];

    if (voiceoverTypeToVoiceovers === undefined) {
      return;
    }

    this.manualVoiceover = voiceoverTypeToVoiceovers.manual;
    this.manualVoiceoverDuration = Math.round(
      this.manualVoiceover.durationSecs
    );
  }

  updateLanguageAccentCode(languageAccentCode: string): void {
    this.languageAccentCodeIsSelected = false;

    if (languageAccentCode === '') {
      this.unsupportedLanguageCode = true;
    } else {
      this.unsupportedLanguageCode = false;
      this.languageAccentCodeIsSelected = true;
    }
    this.languageAccentCode = languageAccentCode;
    this.entityVoiceoversService.setActiveLanguageAccentCode(
      languageAccentCode
    );
    this.localStorageService.setLastSelectedLanguageAccentCode(
      languageAccentCode
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
        this.manualVoiceover = undefined;
        this.changeListService.editVoiceovers(
          this.activeContentId,
          this.languageAccentCode,
          {}
        );

        delete this.activeEntityVoiceoversInstance.voiceoversMapping[
          this.activeContentId
        ];
        this.updateStatusGraph();
      },
      () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is
        // clicked. No further action is needed.
      }
    );
  }

  toggleAudioNeedsUpdate(): void {
    (this.manualVoiceover as Voiceover).needsUpdate = !(
      this.manualVoiceover as Voiceover
    ).needsUpdate;
    this.changeListService.editVoiceovers(
      this.activeContentId,
      this.languageAccentCode,
      {
        manual: (this.manualVoiceover as Voiceover).toBackendDict(),
      }
    );

    let entityVoiceovers =
      this.entityVoiceoversService.getEntityVoiceoversByLanguageAccentCode(
        this.languageAccentCode
      ) as EntityVoiceovers;
    entityVoiceovers.voiceoversMapping[
      this.activeContentId
    ].manual.needsUpdate = (this.manualVoiceover as Voiceover).needsUpdate;

    this.entityVoiceoversService.removeEntityVoiceovers(
      this.languageAccentCode
    );
    this.entityVoiceoversService.addEntityVoiceovers(
      this.languageAccentCode,
      entityVoiceovers
    );

    this.updateStatusGraph();
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
            this.contextService.getExplorationVersion() as number,
            this.languageAccentCode,
            {}
          );
        }

        this.activeEntityVoiceoversInstance.voiceoversMapping[
          this.activeContentId
        ] = {
          manual: this.manualVoiceover,
        };
        this.entityVoiceoversService.addEntityVoiceovers(
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
