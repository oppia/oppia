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

@Component({
  selector: 'oppia-audio-translation-bar',
  templateUrl: './audio-translation-bar.component.html',
})
export class VoiceoverCardComponent implements OnInit {
  @Input() isTranslationTabBusy: boolean;
  @ViewChild('visualized') visualized!: ElementRef<Element>;

  languageCode: string;
  languageAccentCodeToDescription;
  contentId: string;
  manualVoiceoverIsDisplayed: boolean = false;
  manualVoiceover;

  constructor(
    private contextService: ContextService,
    private translationLanguageService: TranslationLanguageService,
    private translationTabActiveContentIdService: TranslationTabActiveContentIdService,
    private voiceoverBackendApiService: VoiceoverBackendApiService
  ) {}

  ngOnInit(): void {}

  getLanguageAccentCodes(): void {
    this.languageCode = this.translationLanguageService.getActiveLanguageCode();
    this.voiceoverBackendApiService
      .fetchVoiceoverAdminDataAsync()
      .then(response => {
        this.languageAccentCodeToDescription =
          response.languageCodesMapping[this.languageCode];
      });
  }

  getVoiceovers(languageAccentCode: string): void {
    let explorationId = this.contextService.getExplorationId();
    let contentId =
      this.translationTabActiveContentIdService.getActiveContentId();
    let explorationVersion = this.contextService.getExplorationVersion();
    let entityType = 'exploration';

    this.voiceoverBackendApiService
      .fetchVoiceoversAsync(
        entityType,
        explorationId,
        explorationVersion,
        languageAccentCode,
        contentId
      )
      .then(response => {
        this.manualVoiceover = response.manualVoiceover;
        this.manualVoiceoverIsDisplayed = true;
      });
  }

  displayManualVoiceover(voiceover) {
    this.manualVoiceoverIsDisplayed = true;
    this.manualVoiceover = voiceover;
  }

  deleteManualVoiceover() {
    this.manualVoiceover = null;
    this.manualVoiceoverIsDisplayed = false;
  }

  addManualVoiceover() {
    // upload file, follow current behaviour.
    // this.manualVoiceover = ;
    this.manualVoiceoverIsDisplayed = true;
  }
}

angular.module('oppia').directive(
  'oppiaVoiceoverCardComponent',
  downgradeComponent({
    component: VoiceoverCardComponent,
  }) as angular.IDirectiveFactory
);
