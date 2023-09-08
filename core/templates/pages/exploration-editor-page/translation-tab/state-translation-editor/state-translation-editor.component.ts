// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the state translation editor.
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { Subscription } from 'rxjs';
import { MarkAudioAsNeedingUpdateModalComponent } from 'components/forms/forms-templates/mark-audio-as-needing-update-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { ExplorationStatesService } from 'pages/exploration-editor-page/services/exploration-states.service';
import { GraphDataService } from 'pages/exploration-editor-page/services/graph-data.service';
import { EditabilityService } from 'services/editability.service';
import { ExternalSaveService } from 'services/external-save.service';
import { TranslationLanguageService } from '../services/translation-language.service';
import { TranslationStatusService } from '../services/translation-status.service';
import { TranslationTabActiveContentIdService } from '../services/translation-tab-active-content-id.service';
import { EntityTranslationsService } from 'services/entity-translations.services';
import { DataFormatToDefaultValuesKey, TranslatedContent } from 'domain/exploration/TranslatedContentObjectFactory';
import { ChangeListService } from 'pages/exploration-editor-page/services/change-list.service';

interface HTMLSchema {
  type: string;
  ui_config: {
    language: string;
    languageDirection: string;
  };
}

interface ListSchema {
  type: 'list';
  items: { type: string };
  validators: { id: string }[];
}

@Component({
  selector: 'oppia-state-translation-editor',
  templateUrl: './state-translation-editor.component.html'
})
export class StateTranslationEditorComponent
  implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();

  contentId: string = '';
  languageCode: string = '';
  activeWrittenTranslation: TranslatedContent | null = null;
  translationEditorIsOpen: boolean = false;
  dataFormat: DataFormatToDefaultValuesKey | string = '';
  UNICODE_SCHEMA: { type: string } = {
    type: 'unicode'
  };

  SET_OF_STRINGS_SCHEMA: ListSchema = {
    type: 'list',
    items: {
      type: 'unicode'
    },
    validators: [{
      id: 'is_uniquified'
    }]
  };

  HTML_SCHEMA: HTMLSchema | null = null;

  constructor(
    private editabilityService: EditabilityService,
    private entityTranslationsService: EntityTranslationsService,
    private explorationStatesService: ExplorationStatesService,
    private changeListService: ChangeListService,
    private externalSaveService: ExternalSaveService,
    private graphDataService: GraphDataService,
    private ngbModal: NgbModal,
    private stateEditorService: StateEditorService,
    private translationLanguageService: TranslationLanguageService,
    private translationStatusService: TranslationStatusService,
    private translationTabActiveContentIdService:
      TranslationTabActiveContentIdService,
  ) { }

  showMarkAudioAsNeedingUpdateModalIfRequired(
      contentId: string, languageCode: string): void {
    let stateName = this.stateEditorService.getActiveStateName() as string;
    let state = this.explorationStatesService.getState(stateName);
    let recordedVoiceovers = state.recordedVoiceovers;
    let availableAudioLanguages = (
      recordedVoiceovers.getLanguageCodes(contentId));
    if (availableAudioLanguages.indexOf(languageCode) !== -1) {
      let voiceover = recordedVoiceovers.getVoiceover(
        contentId, languageCode);
      if (voiceover.needsUpdate) {
        return;
      }

      this.ngbModal.open(MarkAudioAsNeedingUpdateModalComponent, {
        backdrop: 'static'
      }).result.then(() => {
        recordedVoiceovers.toggleNeedsUpdateAttribute(
          contentId, languageCode);
        this.explorationStatesService.saveRecordedVoiceovers(
          stateName, recordedVoiceovers);
      }, () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      });
    }
  }

  isEditable(): boolean {
    return this.editabilityService.isEditable();
  }

  initEditor(): void {
    this.translationEditorIsOpen = false;
    this.contentId = (
      this.translationTabActiveContentIdService.getActiveContentId() as string);
    this.languageCode = this.translationLanguageService.getActiveLanguageCode();

    this.HTML_SCHEMA = {
      type: 'html',
      ui_config: {
        language: this.languageCode,
        languageDirection: (
          this.translationLanguageService.getActiveLanguageDirection())
      }
    };

    const entityTranslations = (
      this.entityTranslationsService.languageCodeToEntityTranslations[
        this.languageCode]
    );
    if (entityTranslations) {
      this.activeWrittenTranslation = entityTranslations.getWrittenTranslation(
        this.translationTabActiveContentIdService.getActiveContentId() as string
      );
    }
  }

  saveTranslation(): void {
    this.contentId = (
      this.translationTabActiveContentIdService.getActiveContentId() as string);
    this.languageCode = this.translationLanguageService.getActiveLanguageCode();

    this.showMarkAudioAsNeedingUpdateModalIfRequired(
      this.contentId, this.languageCode);
    this.activeWrittenTranslation = (
      this.activeWrittenTranslation as TranslatedContent);
    this.changeListService.editTranslation(
      this.contentId, this.languageCode, this.activeWrittenTranslation);
    this.entityTranslationsService.languageCodeToEntityTranslations[
      this.languageCode
    ].updateTranslation(this.contentId, this.activeWrittenTranslation);

    this.translationStatusService.refresh();
    this.translationEditorIsOpen = false;

    setTimeout(() => {
      this.graphDataService.recompute();
    });
  }

  openTranslationEditor(): void {
    if (this.isEditable()) {
      this.translationEditorIsOpen = true;
      if (!this.activeWrittenTranslation) {
        this.activeWrittenTranslation = (
          TranslatedContent.createNew(this.dataFormat));
      }
    }
  }

  onSaveTranslationButtonClicked(): void {
    this.activeWrittenTranslation = (
      this.activeWrittenTranslation as TranslatedContent);
    this.activeWrittenTranslation.needsUpdate = false;
    this.saveTranslation();
  }

  cancelEdit(): void {
    this.initEditor();
  }

  markAsNeedingUpdate(): void {
    let contentId = (
      this.translationTabActiveContentIdService.getActiveContentId() as string);
    let languageCode = this.translationLanguageService.getActiveLanguageCode();
    this.activeWrittenTranslation = (
      this.activeWrittenTranslation as TranslatedContent);
    this.activeWrittenTranslation.markAsNeedingUpdate();
    this.changeListService.editTranslation(
      contentId, languageCode, this.activeWrittenTranslation);
    this.translationStatusService.refresh();
  }

  ngOnInit(): void {
    this.dataFormat = (
      this.translationTabActiveContentIdService.getActiveDataFormat() as string
    );

    this.directiveSubscriptions.add(
      this.translationTabActiveContentIdService.onActiveContentIdChanged.
        subscribe(
          (dataFormat) => {
            this.dataFormat = dataFormat;
            this.initEditor();
          }
        )
    );

    this.directiveSubscriptions.add(
      this.translationLanguageService.onActiveLanguageChanged.subscribe(
        () => this.initEditor()
      )
    );

    this.initEditor();

    this.directiveSubscriptions.add(
      this.externalSaveService.onExternalSave.subscribe(() => {
        if (this.translationEditorIsOpen) {
          this.saveTranslation();
        }
      }));
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaStateTranslationEditor',
  downgradeComponent({
    component: StateTranslationEditorComponent
  }) as angular.IDirectiveFactory);
