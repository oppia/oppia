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
  ChangeDetectorRef,
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
import {PageContextService} from 'services/page-context.service';
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
import {AdminBackendApiService} from 'domain/admin/admin-backend-api.service';
import {VoiceoverPlayerService} from 'pages/exploration-player-page/services/voiceover-player.service';
import {AutomaticVoiceoverHighlightService} from 'services/automatic-voiceover-highlight-service';

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

  isVoiceoverAutogenerationEnabledByAdmins: boolean = false;

  manualVoiceoverIsLoading: boolean = false;
  automaticVoiceoverIsLoading: boolean = false;

  constructor(
    private audioPlayerService: AudioPlayerService,
    private adminBackendApiService: AdminBackendApiService,
    private pageContextService: PageContextService,
    private changeDetectorRef: ChangeDetectorRef,
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
    private explorationStatesService: ExplorationStatesService,
    private voiceoverPlayerService: VoiceoverPlayerService,
    private automaticVoiceoverHighlightService: AutomaticVoiceoverHighlightService
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

    if (
      this.entityVoiceoversService.isEntityVoiceoversLoaded() &&
      !this.translationLanguageService.getActiveLanguageAccentCode()
    ) {
      this.voiceoversAreLoaded = true;
      this.unsupportedLanguageCode = true;
    }

    this.directiveSubscriptions.add(
      this.entityVoiceoversService.onVoiceoverLoad.subscribe(() => {
        this.voiceoversAreLoaded = true;
        this.changeDetectorRef.detectChanges();
        this.setLanguageAccentConfigsAfterVoiceoverLoad();
        this.updateActiveContent();
      })
    );

    this.adminBackendApiService
      .getAdminConfigForAutomaticVoiceoversAsync()
      .then(isVoiceoverAutogenerationEnabledByAdmins => {
        this.isVoiceoverAutogenerationEnabledByAdmins =
          isVoiceoverAutogenerationEnabledByAdmins;
      });

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
    }, 300);
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
    this.isVoiceoverAutogenerationSupportedForSelectedAccent =
      this.voiceoverLanguageManagementService.isAutogenerationSupportedGivenLanguageAccent(
        this.languageAccentCode
      );
    this.changeDetectorRef.detectChanges();
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

          this.setActiveContentManualVoiceover();
          this.setActiveContentAutomaticVoiceover();
          this.updateStatusGraph();

          this.automaticVoiceoverHighlightService.setAutomatedVoiceoversAudioOffsets(
            this.entityVoiceoversService.getActiveEntityVoiceovers()
              ?.automatedVoiceoversAudioOffsetsMsecs || {}
          );
          this.automaticVoiceoverHighlightService.getSentencesToHighlightForTimeRanges();
        }
      });
    }

    this.languageCode = newLanguageCode;

    if (this.voiceoversAreLoaded) {
      this.setLanguageAccentConfigsAfterVoiceoverLoad();
    }
    this.entityVoiceoversService.setLanguageCode(this.languageCode);
    this.updateContentAvailabilityStatusForVoiceovers();
  }

  setLanguageAccentConfigsAfterVoiceoverLoad(): void {
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
      this.setLanguageAccentConfigsAfterVoiceoverLoad();
    }

    this.updateContentAvailabilityStatusForVoiceovers();
    this.setActiveContentManualVoiceover();
    this.setActiveContentAutomaticVoiceover();
    this.updateStatusGraph();
  }

  setActiveContentManualVoiceover(): void {
    this.updateManualVoiceoverWithChangeList();
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
      this.automaticVoiceoverProgress = 0;
    }

    if (voiceoverType === AppConstants.VOICEOVER_TYPE_AUTO) {
      if (this.isManualVoiceoverPlaying === true) {
        this.isManualVoiceoverPlaying = false;
        this.audioPlayerService.clear();
      }
      this.manualVoiceoverProgress = 0;
    }

    if (this.audioPlayerService.isPlaying()) {
      this.flipVoiceoverPlayStatus(voiceoverType);
      this.audioPlayerService.pause();
      return;
    }

    if (
      this.audioPlayerService.isTrackLoaded() &&
      this.currentVoiceoverLoadedType === voiceoverType
    ) {
      this.audioPlayerService.play();
      this.flipVoiceoverPlayStatus(voiceoverType);
    } else {
      this.enableVoiceoverLoading(voiceoverType);
      this.audioPlayerService.loadAsync(filename).then(() => {
        this.disableVoiceoverLoading(voiceoverType);
        this.flipVoiceoverPlayStatus(voiceoverType);
        this.currentVoiceoverLoadedType = voiceoverType;
        this.audioPlayerService.play();
      });
    }
  }

  enableVoiceoverLoading(voiceoverType: string): void {
    if (voiceoverType === AppConstants.VOICEOVER_TYPE_MANUAL) {
      this.manualVoiceoverIsLoading = true;
    } else {
      this.automaticVoiceoverIsLoading = true;
    }
  }

  disableVoiceoverLoading(voiceoverType: string): void {
    if (voiceoverType === AppConstants.VOICEOVER_TYPE_MANUAL) {
      this.manualVoiceoverIsLoading = false;
    } else {
      this.automaticVoiceoverIsLoading = false;
    }
  }

  flipVoiceoverPlayStatus(voiceoverType: string): void {
    if (voiceoverType === AppConstants.VOICEOVER_TYPE_MANUAL) {
      this.isManualVoiceoverPlaying = !this.isManualVoiceoverPlaying;
      this.voiceoverPlayerService.isAutomaticVoiceoverPlaying = false;
    } else {
      this.isAutomaticVoiceoverPlaying = !this.isAutomaticVoiceoverPlaying;
      this.voiceoverPlayerService.isAutomaticVoiceoverPlaying =
        this.isAutomaticVoiceoverPlaying;
    }
  }

  isExplorationLinkedToStory(): boolean {
    return this.pageContextService.isExplorationLinkedToStory();
  }

  shouldShowAutoVoiceoverRegenerationSection(): boolean {
    return (
      this.isVoiceoverAutogenerationSupportedForSelectedAccent &&
      this.isExplorationLinkedToStory() &&
      this.isVoiceoverAutogenerationEnabledByAdmins
    );
  }

  getAutomaticVoiceoverDisableReason(): string {
    if (!this.isVoiceoverAutogenerationSupportedForSelectedAccent) {
      return 'Autogenerated voiceovers are not supported for the selected language accent. Please reach out to the voiceover admin if you would like them to be supported.';
    }

    if (!this.isExplorationLinkedToStory()) {
      return 'Autogenerated voiceovers are only available for explorations linked to a published story. Please contact the curriculum admin for help.';
    }

    if (!this.isVoiceoverAutogenerationEnabledByAdmins) {
      return 'Voiceover autogeneration via cloud services is currently disabled. Please contact the admins for more information.';
    }

    return '';
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
            this.pageContextService.getExplorationId(),
            'exploration',
            this.pageContextService.getExplorationVersion() as number,
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

    modalRef.componentInstance.explorationId =
      this.pageContextService.getExplorationId();
    modalRef.componentInstance.explorationVersion =
      this.pageContextService.getExplorationVersion() as number;
    modalRef.componentInstance.stateName =
      this.stateEditorService.getActiveStateName() as string;
    modalRef.componentInstance.contentId = this.activeContentId;
    modalRef.componentInstance.languageAccentCode = this.languageAccentCode;
    modalRef.componentInstance.isAutomaticVoiceoverPresent =
      !!this.automaticVoiceover;
    this.isAutomaticVoiceoverGenerating = true;

    modalRef.result.then(
      response => {
        this.isAutomaticVoiceoverGenerating = false;

        if (response === undefined) {
          return;
        }
        const voiceover = response.voiceover;
        const sentenceTokenWithDurations = response.sentenceTokenWithDurations;

        if (this.activeEntityVoiceoversInstance === undefined) {
          this.activeEntityVoiceoversInstance = new EntityVoiceovers(
            this.pageContextService.getExplorationId(),
            'exploration',
            this.pageContextService.getExplorationVersion() as number,
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
        ] = sentenceTokenWithDurations;

        this.entityVoiceoversService.addEntityVoiceovers(
          this.languageAccentCode,
          this.activeEntityVoiceoversInstance
        );

        this.updateStatusGraph();
        this.automaticVoiceoverHighlightService.setAutomatedVoiceoversAudioOffsets(
          this.activeEntityVoiceoversInstance
            ?.automatedVoiceoversAudioOffsetsMsecs || {}
        );
        this.automaticVoiceoverHighlightService.getSentencesToHighlightForTimeRanges();
      },
      () => {
        this.isAutomaticVoiceoverGenerating = false;
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
