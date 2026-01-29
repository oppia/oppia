// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Preview tab component.
 */

import {
  Component,
  OnInit,
  OnDestroy,
  EventEmitter
} from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { EntityTranslationsService } from 'services/entity-translations.service';
import { NumberAttemptsService } from 'pages/exploration-player-page/services/number-attempts.service';
import { RouterService } from '../services/router.service';
import { ExplorationEngineService } from 'pages/exploration-player-page/services/exploration-engine.service';
import { ExplorationInitStateNameService } from '../services/exploration-init-state-name.service';
import { ExplorationParamChangesService } from '../services/exploration-param-changes.service';
import { ExplorationStatesService } from '../services/exploration-states.service';
import { GraphDataService } from '../services/graph-data.service';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { ChangeListService } from '../services/change-list.service';
import { VoiceoverBackendDict } from 'domain/exploration/voiceover.model';
import { PlatformFeatureService } from '../../../services/platform-feature.service';
import { ConversationFlowService } from 'pages/exploration-player-page/services/conversation-flow.service';
import { ParamChange } from 'domain/exploration/param-change.model';
import { ExplorationDataService } from '../services/exploration-data.service';

@Component({
  selector: 'oppia-preview-tab',
  templateUrl: './preview-tab.component.html',
  styleUrls: ['./preview-tab.component.css']
})
export class PreviewTabComponent implements OnInit, OnDestroy {
  isExplorationPopulated: boolean = false;
  previewWarning: string = '';
  allParams: Record<string, string> = {};

  // NEW: Language selection for preview
  selectedLanguage: string = 'en';
  availableLanguages: string[] = [];

  constructor(
    private ngbModal: NgbModal,
    private entityVoiceoversService: EntityTranslationsService,
    private numberAttemptsService: NumberAttemptsService,
    private routerService: RouterService,
    private explorationEngineService: ExplorationEngineService,
    private explorationInitStateNameService: ExplorationInitStateNameService,
    private explorationParamChangesService: ExplorationParamChangesService,
    private explorationStatesService: ExplorationStatesService,
    private graphDataService: GraphDataService,
    private stateEditorService: StateEditorService,
    private changeListService: ChangeListService,
    private platformFeatureService: PlatformFeatureService,
    private conversationFlowService: ConversationFlowService,
    private explorationDataService: ExplorationDataService
  ) {}

  ngOnInit(): void {
    // Populate available languages from frontend translations
    this.availableLanguages = this.entityVoiceoversService.getAllLanguageCodes();

    // Original initialization code
    this.isExplorationPopulated = false;
    this.previewWarning = '';
    // Additional ngOnInit logic from your original code...
  }

  ngOnDestroy(): void {
    // Cleanup logic if needed
  }

  // NEW: Handle language change
  onLanguageChange(langCode: string): void {
    this.selectedLanguage = langCode;
    // Reload preview with new language
    this.loadPreviewState(this.selectedLanguage, '');
  }

  showParameterSummary(): boolean {
    return Object.keys(this.allParams).length > 0;
  }

  loadPreviewState(startState: string, paramChangeInfo: string): void {
    // Original loadPreviewState code
  }

  showSetParamsModal(paramChanges: ParamChange[], callback: Function): void {
    // Original showSetParamsModal code
  }

  getManualParamChanges(stateName: string): Promise<ParamChange[]> {
    // Original getManualParamChanges code
    return Promise.resolve([]);
  }

  resetPreview(): void {
    // Original resetPreview code
  }

  isNewLessonPlayerEnabled(): boolean {
    return this.platformFeatureService.status.NewLessonPlayer.isEnabled;
  }

  updateManualVoiceoverWithChangeList(): void {
    const changeDicts = this.changeListService.getVoiceoverChangeList();
    changeDicts.forEach(change => {
      if (change.cmd === 'update_voiceovers') {
        this.entityVoiceoversService.addEntityVoiceovers(
          change.language_accent_code,
          change.content_id,
          change.voiceovers
        );
      }
    });
  }
}
