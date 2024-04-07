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

import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {downgradeComponent} from '@angular/upgrade/static';
import WaveSurfer from 'wavesurfer.js';
import {Subscription} from 'rxjs';
import {OppiaAngularRootComponent} from 'components/oppia-angular-root.component';
import {DeleteAudioTranslationModalComponent} from 'pages/exploration-editor-page/translation-tab/modal-templates/delete-audio-translation-modal.component';
import {TranslationTabBusyModalComponent} from 'pages/exploration-editor-page/translation-tab/modal-templates/translation-tab-busy-modal.component';
import {AddAudioTranslationModalComponent} from '../modal-templates/add-audio-translation-modal.component';
import {UserExplorationPermissionsService} from 'pages/exploration-editor-page/services/user-exploration-permissions.service';
import {UserService} from 'services/user.service';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {StateRecordedVoiceoversService} from 'components/state-editor/state-editor-properties-services/state-recorded-voiceovers.service';
import {ExplorationStatesService} from 'pages/exploration-editor-page/services/exploration-states.service';
import {GraphDataService} from 'pages/exploration-editor-page/services/graph-data.service';
import {AlertsService} from 'services/alerts.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {AudioPlayerService} from 'services/audio-player.service';
import {ContextService} from 'services/context.service';
import {EditabilityService} from 'services/editability.service';
import {ExternalSaveService} from 'services/external-save.service';
import {IdGenerationService} from 'services/id-generation.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {TranslationLanguageService} from '../services/translation-language.service';
import {TranslationStatusService} from '../services/translation-status.service';
import {TranslationTabActiveContentIdService} from '../services/translation-tab-active-content-id.service';
import {Voiceover} from 'domain/exploration/voiceover.model';
import {ExplorationEditorPageConstants} from 'pages/exploration-editor-page/exploration-editor-page.constants';
import {VoiceoverRecordingService} from '../services/voiceover-recording.service';
import {VoiceoverBackendApiService} from 'domain/voiceover/voiceover-backend-api.service';
import {ChangeListService} from 'pages/exploration-editor-page/services/change-list.service';

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
  contentId: string;
  manualVoiceoverIsDisplayed: boolean = false;
  manualVoiceover = null;
  pageIsLoaded: boolean = false;
  startingDuration: number;
  durationSecs: number;
  languageAccentCode: string;
  isAudioAvailable: boolean = false;

  constructor(
    private audioPlayerService: AudioPlayerService,
    private contextService: ContextService,
    private translationLanguageService: TranslationLanguageService,
    private translationTabActiveContentIdService: TranslationTabActiveContentIdService,
    private voiceoverBackendApiService: VoiceoverBackendApiService,
    private ngbModal: NgbModal,
    private idGenerationService: IdGenerationService,
    private alertsService: AlertsService,
    private changeListService: ChangeListService
  ) {}

  ngOnInit(): void {
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
            this.contentId =
              this.translationTabActiveContentIdService.getActiveContentId();
          });
      })
    );
  }

  getVoiceovers(languageAccentCode: string): void {
    this.languageAccentCode = languageAccentCode;
    let explorationId = this.contextService.getExplorationId();
    this.contentId =
      this.translationTabActiveContentIdService.getActiveContentId();
    let explorationVersion = this.contextService.getExplorationVersion();
    let entityType = 'exploration';

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
        this.manualVoiceoverIsDisplayed = true;
      });
  }
  isPlayingUploadedAudio() {
    return true;
  }

  playAudio() {}

  deleteManualVoiceover() {
    this.manualVoiceover = null;
    this.manualVoiceoverIsDisplayed = false;
  }

  addManualVoiceover() {
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
        this.manualVoiceoverIsDisplayed = true;
      },
      () => {
        this.alertsService.clearWarnings();
      }
    );
  }

  generateNewFilename() {
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
