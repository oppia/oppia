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

import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  AfterViewChecked,
} from '@angular/core';
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
import {AutomaticVoiceoverRegenerationConfirmModalComponent} from './modals/automatic-voiceover-regeneration-confirm-modal.component';
import {LocalStorageService} from 'services/local-storage.service';
import {EntityVoiceoversService} from 'services/entity-voiceovers.services';
import {EntityVoiceovers} from 'domain/voiceover/entity-voiceovers.model';
import {TranslationStatusService} from '../services/translation-status.service';
import {GraphDataService} from 'pages/exploration-editor-page/services/graph-data.service';
import {
  LanguageAccentToDescription,
  VoiceoverBackendApiService,
} from 'domain/voiceover/voiceover-backend-api.service';
import {ExplorationChangeEditVoiceovers} from 'domain/exploration/exploration-draft.model';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {EntityTranslationsService} from 'services/entity-translations.services';
import {VoiceoverLanguageManagementService} from 'services/voiceover-language-management-service';
import {AppConstants} from 'app.constants';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {ExplorationStatesService} from 'pages/exploration-editor-page/services/exploration-states.service';

@Component({
  selector: 'oppia-voiceover-card',
  templateUrl: './voiceover-card.component.html',
})
export class VoiceoverCardComponent implements OnInit, AfterViewChecked {
  @ViewChild('visualized') visualized!: ElementRef<Element>;
  directiveSubscriptions = new Subscription();

  voiceoversAreLoaded: boolean = false;
  currentVoiceoverLoadedType!: string | undefined;

  isVoiceoverSupportedForSelectedLanguage: boolean = false;
  isVoiceoverAutogenerationSupportedForSelectedAccent: boolean = false;
  contentAvailableForVoiceovers: boolean = false;

  manualVoiceover!: Voiceover | undefined;
  manualVoiceoverCurrentDuration: number = 0;
  manualVoiceoverTotalDuration!: number;
  manualVoiceoverProgress: number = 0;
  isManualVoiceoverPlaying: boolean = false;

  automaticVoiceover!: Voiceover | undefined;
  automaticVoiceoverCurrentDuration: number = 0;
  automaticVoiceoverTotalDuration!: number;
  automaticVoiceoverProgress: number = 0;
  isAutomaticVoiceoverPlaying: boolean = false;

  activeContentId!: string;
  languageCode!: string;
  languageAccentCode!: string;
  languageAccentCodeIsSelected: boolean = false;
  unsupportedLanguageCode = false;

  availableLanguageAccentCodesToDescriptions: LanguageAccentToDescription = {};
  supportedLanguageAccentCodesToDescriptions: LanguageAccentToDescription = {};
  supportedLanguageAccentCodesLength: number = 0;

  activeEntityVoiceoversInstance!: EntityVoiceovers;

  isAutomaticVoiceoverGenerating: boolean = false;
  isGenerateAutomaticVoiceoverOptionEnabled = false;

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
    private graphDataService: GraphDataService,
    private stateEditorService: StateEditorService,
    private voiceoverBackendApiService: VoiceoverBackendApiService,
    private entityTranslationsService: EntityTranslationsService,
    private voiceoverLanguageManagementService: VoiceoverLanguageManagementService,
    private platformFeatureService: PlatformFeatureService,
    private explorationStatesService: ExplorationStatesService
  ) {}

  ngOnInit(): void {
    this.languageCode = this.translationLanguageService.getActiveLanguageCode();
    this.languageAccentCode =
      this.localStorageService.getLastSelectedLanguageAccentCode() as string;
    this.languageAccentCodeIsSelected = this.languageAccentCode !== 'undefined';

    if (this.entityVoiceoversService.isEntityVoiceoversLoaded()) {
      this.voiceoversAreLoaded = true;
    }

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

    if (!this.entityVoiceoversService.getActiveLanguageAccentCode()) {
      this.voiceoversAreLoaded = true;
      this.unsupportedLanguageCode = true;
    }

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
        if (this.isManualVoiceoverPlaying) {
          this.manualVoiceoverCurrentDuration =
            this.audioPlayerService.getCurrentTimeInSecs();
          this.manualVoiceoverProgress = Math.round(
            (this.manualVoiceoverCurrentDuration /
              this.manualVoiceoverTotalDuration) *
              100
          );
        }
        if (this.isAutomaticVoiceoverPlaying) {
          this.automaticVoiceoverCurrentDuration =
            this.audioPlayerService.getCurrentTimeInSecs();
          this.automaticVoiceoverProgress = Math.round(
            (this.automaticVoiceoverCurrentDuration /
              this.automaticVoiceoverTotalDuration) *
              100
          );
        }
      } else if (!this.audioPlayerService.isTrackLoaded()) {
        this.automaticVoiceoverProgress = 0;
        this.automaticVoiceoverCurrentDuration = 0;
        this.manualVoiceoverCurrentDuration = 0;
        this.manualVoiceoverProgress = 0;
      }

      if (!this.audioPlayerService.isPlaying()) {
        this.isAutomaticVoiceoverPlaying = false;
        this.isManualVoiceoverPlaying = false;
      }
    }, 500);
    this.updateActiveContent();
  }

  ngAfterViewChecked(): void {
    if (
      this.changeListService.explorationChangeList.length >= 0 &&
      this.changeListService.isOnlyVoiceoverChangeListPresent()
    ) {
      this.isGenerateAutomaticVoiceoverOptionEnabled = true;
    } else {
      this.isGenerateAutomaticVoiceoverOptionEnabled = false;
    }
  }

  isAutomaticVoiceoverRegenerationFromExpFeatureEnabled(): boolean {
    return this.platformFeatureService.status
      .AutomaticVoiceoverRegenerationFromExp.isEnabled;
  }

  updateManualVoiceoverWithChangeList(): void {
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
          {},
          {}
        );
      }

      if (!entityVoiceovers.voiceoversMapping.hasOwnProperty(contentId)) {
        entityVoiceovers.voiceoversMapping[contentId] = {};
      }

      if (voiceovers.hasOwnProperty('manual')) {
        let manualVoiceover = Voiceover.createFromBackendDict(
          voiceovers.manual
        );
        entityVoiceovers.voiceoversMapping[contentId].manual = manualVoiceover;
      } else {
        entityVoiceovers.voiceoversMapping[contentId].manual = undefined;
        if (entityVoiceovers.voiceoversMapping[contentId].auto === undefined) {
          delete entityVoiceovers.voiceoversMapping[contentId];
        }
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
      this.setActiveContentAutomaticVoiceover();
      this.entityVoiceoversService.setActiveLanguageAccentCode(
        languageAccentCode
      );
    }

    this.updateContentAvailabilityStatusForVoiceovers();
  }

  updateContentAvailabilityStatusForVoiceovers(): void {
    if (this.isContentAvaiableForVoiceover()) {
      this.contentAvailableForVoiceovers = true;
    } else {
      this.contentAvailableForVoiceovers = false;
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

          this.updateManualVoiceoverWithChangeList();
          this.setActiveContentManualVoiceover();
          this.setActiveContentAutomaticVoiceover();
          this.updateStatusGraph();
        }
      });
    }

    this.languageCode = newLanguageCode;

    if (this.voiceoversAreLoaded) {
      this.isVoiceoverSupportedForSelectedLanguage =
        this.voiceoverLanguageManagementService.canVoiceoverForLanguage(
          this.languageCode
        );
      if (this.isVoiceoverSupportedForSelectedLanguage) {
        this.voiceoverLanguageManagementService.setCloudSupportedLanguageAccents(
          this.languageCode
        );
        this.isVoiceoverAutogenerationSupportedForSelectedAccent =
          this.voiceoverLanguageManagementService.isAutogenerationSupportedGivenLanguageAccent(
            this.languageAccentCode
          );
      }
    }
    this.entityVoiceoversService.setLanguageCode(this.languageCode);
    this.updateContentAvailabilityStatusForVoiceovers();
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

    if (this.voiceoversAreLoaded) {
      this.isVoiceoverSupportedForSelectedLanguage =
        this.voiceoverLanguageManagementService.canVoiceoverForLanguage(
          this.languageCode
        );
      if (this.isVoiceoverSupportedForSelectedLanguage) {
        this.voiceoverLanguageManagementService.setCloudSupportedLanguageAccents(
          this.languageCode
        );
        this.isVoiceoverAutogenerationSupportedForSelectedAccent =
          this.voiceoverLanguageManagementService.isAutogenerationSupportedGivenLanguageAccent(
            this.languageAccentCode
          );
      }
    }

    this.updateContentAvailabilityStatusForVoiceovers();
    this.updateManualVoiceoverWithChangeList();
    this.setActiveContentManualVoiceover();
    this.setActiveContentAutomaticVoiceover();
    this.updateStatusGraph();
  }

  setActiveContentManualVoiceover(): void {
    this.activeEntityVoiceoversInstance =
      this.entityVoiceoversService.getEntityVoiceoversByLanguageAccentCode(
        this.languageAccentCode
      ) as EntityVoiceovers;

    this.manualVoiceoverProgress = 0;
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
    if (this.manualVoiceover) {
      this.manualVoiceoverTotalDuration = Math.round(
        (this.manualVoiceover as Voiceover).durationSecs
      );
    }
  }

  setActiveContentAutomaticVoiceover(): void {
    this.activeEntityVoiceoversInstance =
      this.entityVoiceoversService.getEntityVoiceoversByLanguageAccentCode(
        this.languageAccentCode
      ) as EntityVoiceovers;

    this.automaticVoiceoverProgress = 0;
    this.audioPlayerService.clear();
    this.automaticVoiceover = undefined;

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

    this.automaticVoiceover = voiceoverTypeToVoiceovers.auto;
    if (this.automaticVoiceover) {
      this.automaticVoiceoverTotalDuration = Math.round(
        (this.automaticVoiceover as Voiceover).durationSecs
      );
    }
  }

  updateStatusGraph(): void {
    this.translationStatusService.refresh();
    setTimeout(() => {
      this.graphDataService.recompute();
    });
  }

  playAndPauseVoiceover(filename: string, voiceoverType: string): void {
    if (voiceoverType === AppConstants.VOICEOVER_TYPE_MANUAL) {
      if (this.isAutomaticVoiceoverPlaying === true) {
        this.isAutomaticVoiceoverPlaying = false;
        this.audioPlayerService.clear();
      }
      this.isManualVoiceoverPlaying = !this.isManualVoiceoverPlaying;
      this.automaticVoiceoverProgress = 0;
    }

    if (voiceoverType === AppConstants.VOICEOVER_TYPE_AUTO) {
      if (this.isManualVoiceoverPlaying === true) {
        this.isManualVoiceoverPlaying = false;
        this.audioPlayerService.clear();
      }
      this.isAutomaticVoiceoverPlaying = !this.isAutomaticVoiceoverPlaying;
      this.manualVoiceoverProgress = 0;
    }

    if (this.audioPlayerService.isPlaying()) {
      this.audioPlayerService.pause();
      return;
    }

    if (
      this.audioPlayerService.isTrackLoaded() &&
      this.currentVoiceoverLoadedType === voiceoverType
    ) {
      this.audioPlayerService.play();
    } else {
      this.audioPlayerService.loadAsync(filename).then(() => {
        this.currentVoiceoverLoadedType = voiceoverType;
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

        this.activeEntityVoiceoversInstance.voiceoversMapping[
          this.activeContentId
        ].manual = undefined;

        if (
          this.activeEntityVoiceoversInstance.voiceoversMapping[
            this.activeContentId
          ].auto === undefined
        ) {
          delete this.activeEntityVoiceoversInstance.voiceoversMapping[
            this.activeContentId
          ];
        }

        this.entityVoiceoversService.addEntityVoiceovers(
          this.languageAccentCode,
          this.activeEntityVoiceoversInstance
        );

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
    (
      entityVoiceovers.voiceoversMapping[this.activeContentId as string]
        .manual as Voiceover
    ).needsUpdate = (this.manualVoiceover as Voiceover).needsUpdate;

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
        this.manualVoiceoverTotalDuration = Math.round(
          this.manualVoiceover.durationSecs
        );

        if (this.activeEntityVoiceoversInstance === undefined) {
          this.activeEntityVoiceoversInstance = new EntityVoiceovers(
            this.contextService.getExplorationId(),
            'exploration',
            this.contextService.getExplorationVersion() as number,
            this.languageAccentCode,
            {},
            {}
          );
        }

        if (
          !this.activeEntityVoiceoversInstance.voiceoversMapping.hasOwnProperty(
            this.activeContentId
          )
        ) {
          this.activeEntityVoiceoversInstance.voiceoversMapping[
            this.activeContentId
          ] = {};
        }

        this.activeEntityVoiceoversInstance.voiceoversMapping[
          this.activeContentId
        ].manual = this.manualVoiceover;

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

  isContentAvaiableForVoiceover(): boolean {
    if (this.languageCode === 'en') {
      let activeStateName = this.stateEditorService.getActiveStateName();
      let state = this.explorationStatesService.getState(
        activeStateName as string
      );
      let contentIdToHtml = state.getContentIdToContents();

      if (contentIdToHtml[this.activeContentId]) {
        return true;
      }

      return false;
    }

    return Boolean(
      this.entityTranslationsService.languageCodeToLatestEntityTranslations[
        this.languageCode
      ]
        ?.getWrittenTranslation(this.activeContentId)
        ?.getTranslation()
    );
  }

  generateVoiceover(): void {
    const modalRef = this.ngbModal.open(
      AutomaticVoiceoverRegenerationConfirmModalComponent,
      {
        backdrop: 'static',
      }
    );

    modalRef.result.then(
      () => {
        this.isAutomaticVoiceoverGenerating = true;

        this.voiceoverBackendApiService
          .generateAutotmaticVoiceoverAsync(
            this.contextService.getExplorationId(),
            this.contextService.getExplorationVersion() as number,
            this.stateEditorService.getActiveStateName() as string,
            this.activeContentId,
            this.languageAccentCode
          )
          .then(response => {
            let voiceover = new Voiceover(
              response.filename,
              response.fileSizeBytes,
              response.needsUpdate,
              response.durationSecs
            );
            if (this.activeEntityVoiceoversInstance === undefined) {
              this.activeEntityVoiceoversInstance = new EntityVoiceovers(
                this.contextService.getExplorationId(),
                'exploration',
                this.contextService.getExplorationVersion() as number,
                this.languageAccentCode,
                {},
                {}
              );
            }

            this.automaticVoiceover = voiceover;
            this.automaticVoiceoverTotalDuration = Math.round(
              voiceover.durationSecs
            );

            if (
              !this.activeEntityVoiceoversInstance.voiceoversMapping.hasOwnProperty(
                this.activeContentId
              )
            ) {
              this.activeEntityVoiceoversInstance.voiceoversMapping[
                this.activeContentId
              ] = {};
            }

            this.activeEntityVoiceoversInstance.voiceoversMapping[
              this.activeContentId
            ].auto = this.automaticVoiceover;

            this.activeEntityVoiceoversInstance.automatedVoiceoversAudioOffsetsMsecs[
              this.activeContentId
            ] = response.sentenceTokenWithDurations;

            this.entityVoiceoversService.addEntityVoiceovers(
              this.languageAccentCode,
              this.activeEntityVoiceoversInstance
            );

            this.updateStatusGraph();
            this.isAutomaticVoiceoverGenerating = false;
          })
          .catch(errorResponse => {
            this.alertsService.addWarning(errorResponse.error);
            this.isAutomaticVoiceoverGenerating = false;
          });
      },
      () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is
        // clicked. No further action is needed.
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

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
