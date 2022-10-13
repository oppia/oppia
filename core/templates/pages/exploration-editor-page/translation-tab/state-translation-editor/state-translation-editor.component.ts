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
import { StateWrittenTranslationsService } from 'components/state-editor/state-editor-properties-services/state-written-translations.service';
import { DataFormatToDefaultValuesKey, WrittenTranslation, WrittenTranslationObjectFactory } from 'domain/exploration/WrittenTranslationObjectFactory';
import { ExplorationStatesService } from 'pages/exploration-editor-page/services/exploration-states.service';
import { GraphDataService } from 'pages/exploration-editor-page/services/graph-data.service';
import { EditabilityService } from 'services/editability.service';
import { ExternalSaveService } from 'services/external-save.service';
import { TranslationLanguageService } from '../services/translation-language.service';
import { TranslationStatusService } from '../services/translation-status.service';
import { TranslationTabActiveContentIdService } from '../services/translation-tab-active-content-id.service';

interface HTMLSchema {
  type: string;
  ui_config: {
    language: string;
    languageDirection: string;
  };
}

interface ListSchema {
  type: 'list';
  items: {type: string};
  validators: {id: string} [];
}

@Component({
  selector: 'oppia-state-translation-editor',
  templateUrl: './state-translation-editor.component.html'
})
export class StateTranslationEditorComponent
   implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();

  contentId: string;
  languageCode: string;
  activeWrittenTranslation: WrittenTranslation;
  translationEditorIsOpen: boolean = false;
  dataFormat: DataFormatToDefaultValuesKey | string;
  UNICODE_SCHEMA: {type: string};
  SET_OF_STRINGS_SCHEMA: ListSchema;
  HTML_SCHEMA: HTMLSchema;

  constructor(
    private editabilityService: EditabilityService,
    private explorationStatesService: ExplorationStatesService,
    private externalSaveService: ExternalSaveService,
    private graphDataService: GraphDataService,
    private ngbModal: NgbModal,
    private stateEditorService: StateEditorService,
    private stateWrittenTranslationsService: StateWrittenTranslationsService,
    private translationLanguageService: TranslationLanguageService,
    private translationStatusService: TranslationStatusService,
    private translationTabActiveContentIdService:
      TranslationTabActiveContentIdService,
    private writtenTranslationObjectFactory: WrittenTranslationObjectFactory
  ) { }

  showMarkAudioAsNeedingUpdateModalIfRequired(
      contentId: string, languageCode: string): void {
    let stateName = this.stateEditorService.getActiveStateName();
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
      this.translationTabActiveContentIdService.getActiveContentId());
    this.languageCode = this.translationLanguageService.getActiveLanguageCode();

    this.HTML_SCHEMA = {
      type: 'html',
      ui_config: {
        language: this.translationLanguageService.getActiveLanguageCode(),
        languageDirection: (
          this.translationLanguageService.getActiveLanguageDirection())
      }
    };

    this.activeWrittenTranslation = null;

    if (this.stateWrittenTranslationsService.displayed.hasWrittenTranslation(
      this.contentId, this.languageCode)) {
      this.activeWrittenTranslation = (
        this.stateWrittenTranslationsService.displayed
          .getWrittenTranslation(this.contentId, this.languageCode));
    }
  }

  saveTranslation(): void {
    let oldWrittenTranslation = null;
    let newWrittenTranslation = null;

    this.contentId = (
      this.translationTabActiveContentIdService.getActiveContentId());
    this.languageCode = this.translationLanguageService.getActiveLanguageCode();

    if (this.stateWrittenTranslationsService
      .savedMemento.hasWrittenTranslation(this.contentId, this.languageCode)) {
      let writtenTranslation = (
        this.stateWrittenTranslationsService
          .savedMemento.getWrittenTranslation(
            this.contentId, this.languageCode));
      oldWrittenTranslation = writtenTranslation;
    }
    let writtenTranslation: WrittenTranslation = (
      this.stateWrittenTranslationsService
        .displayed.getWrittenTranslation(this.contentId, this.languageCode));

    newWrittenTranslation = writtenTranslation;
    if (oldWrittenTranslation === null || (
      (oldWrittenTranslation.translation !==
        newWrittenTranslation.translation) ||
       (oldWrittenTranslation.needsUpdate !== (
         newWrittenTranslation.needsUpdate)))
    ) {
      let stateName = this.stateEditorService.getActiveStateName();
      this.showMarkAudioAsNeedingUpdateModalIfRequired(
        this.contentId, this.languageCode);
      this.explorationStatesService.saveWrittenTranslation(
        this.contentId, newWrittenTranslation.dataFormat, this.languageCode,
        stateName, newWrittenTranslation.translation);
      this.stateWrittenTranslationsService.saveDisplayedValue();
      this.translationStatusService.refresh();
    }
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
          this.writtenTranslationObjectFactory.createNew(this.dataFormat));
      }
    }
  }

  onSaveTranslationButtonClicked(): void {
    let displayedWrittenTranslations = (
      this.stateWrittenTranslationsService.displayed);
    if (displayedWrittenTranslations.hasWrittenTranslation(
      this.contentId, this.languageCode)) {
      displayedWrittenTranslations.updateWrittenTranslation(
        this.contentId, this.languageCode,
        this.activeWrittenTranslation.translation);
    } else {
      displayedWrittenTranslations.addWrittenTranslation(
        this.contentId, this.languageCode,
         this.dataFormat as DataFormatToDefaultValuesKey,
         this.activeWrittenTranslation.translation);
    }

    this.saveTranslation();
  }

  cancelEdit(): void {
    this.stateWrittenTranslationsService.restoreFromMemento();
    this.initEditor();
  }

  markAsNeedingUpdate(): void {
    let contentId = (
      this.translationTabActiveContentIdService.getActiveContentId());
    let stateName = this.stateEditorService.getActiveStateName();
    let languageCode = this.translationLanguageService.getActiveLanguageCode();
    this.activeWrittenTranslation.needsUpdate = true;
    this.explorationStatesService.markWrittenTranslationAsNeedingUpdate(
      contentId, languageCode, stateName);
    this.translationStatusService.refresh();
  }

  ngOnInit(): void {
    this.dataFormat = (
      this.translationTabActiveContentIdService.getActiveDataFormat());

    this.UNICODE_SCHEMA = {
      type: 'unicode'
    };

    this.SET_OF_STRINGS_SCHEMA = {
      type: 'list',
      items: {
        type: 'unicode'
      },
      validators: [{
        id: 'is_uniquified'
      }]
    };

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
      this.externalSaveService.onExternalSave.subscribe(()=> {
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
