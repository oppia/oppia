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
 * @fileoverview Component for updating translations of edited content.
 */

import {Component, Input} from '@angular/core';
import {NgbActiveModal, NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {ContextService} from 'services/context.service';
import {EntityTranslationsService} from 'services/entity-translations.services';
import {LanguageUtilService} from 'domain/utilities/language-util.service';
import {TranslatedContent} from 'domain/exploration/TranslatedContentObjectFactory';
import {ChangeListService} from '../services/change-list.service';
import {
  ModifyTranslationOpportunity,
  TranslationModalComponent,
} from 'pages/contributor-dashboard-page/modal-templates/translation-modal.component';
import {TranslationLanguageService} from '../translation-tab/services/translation-language.service';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {StateInteractionIdService} from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import {
  TRANSLATION_DATA_FORMAT_SET_OF_NORMALIZED_STRING,
  TRANSLATION_DATA_FORMAT_SET_OF_UNICODE_STRING,
} from 'domain/exploration/WrittenTranslationObjectFactory';

interface LanguageCodeToContentTranslations {
  [languageCode: string]: TranslatedContent;
}

@Component({
  selector: 'oppia-exploration-modify-translations-modal',
  templateUrl: './exploration-modify-translations-modal.component.html',
})
export class ModifyTranslationsModalComponent extends ConfirmOrCancelModal {
  @Input() contentId!: string;
  @Input() contentValue!: string;
  explorationId!: string;
  explorationVersion!: number;
  contentTranslations: LanguageCodeToContentTranslations = {};
  languageIsCheckedStatusDict: {
    [languageCode: string]: boolean;
  } = {};
  translationsHaveLoaded: boolean = false;
  interactionId?: string;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private ngbModal: NgbModal,
    private contextService: ContextService,
    private languageUtilService: LanguageUtilService,
    private entityTranslationsService: EntityTranslationsService,
    private changeListService: ChangeListService,
    private translationLanguageService: TranslationLanguageService,
    private stateEditorService: StateEditorService,
    private stateInteractionIdService: StateInteractionIdService
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.explorationId = this.contextService.getExplorationId();
    this.explorationVersion =
      this.contextService.getExplorationVersion() as number;
    this.interactionId = this.stateInteractionIdService.savedMemento;

    // Populate the content translations via latest draft changes first,
    // in order to get the most recently updated translations.
    for (let language in this.entityTranslationsService
      .languageCodeToLatestEntityTranslations) {
      let translationContent =
        this.entityTranslationsService.languageCodeToLatestEntityTranslations[
          language
        ].getWrittenTranslation(this.contentId);
      if (translationContent) {
        this.contentTranslations[language] = translationContent;
      }
    }
    this.updateTranslationDisplayContent();
  }

  updateTranslationDisplayContent(): void {
    Object.keys(this.contentTranslations).forEach(languageCode => {
      this.languageIsCheckedStatusDict[languageCode] = false;
    });
    this.translationsHaveLoaded = true;
  }

  openTranslationEditor(languageCode: string): void {
    const modalRef = this.ngbModal.open(TranslationModalComponent, {
      size: 'lg',
      backdrop: 'static',
    });
    this.translationLanguageService.setActiveLanguageCode(languageCode);

    const modifyTranslationOpportunity: ModifyTranslationOpportunity = {
      id: this.explorationId,
      contentId: this.contentId,
      heading: this.stateEditorService.getActiveStateName() || '',
      subheading: 'Update Translation',
      textToTranslate: this.contentValue,
      currentContentTranslation: this.contentTranslations[languageCode],
      interactionId: this.interactionId,
    };
    modalRef.componentInstance.modifyTranslationOpportunity =
      modifyTranslationOpportunity;

    modalRef.result.then(result => {
      if (result) {
        this.contentTranslations[languageCode].translation = result;
        this.languageIsCheckedStatusDict[languageCode] = true;
      }
    });
  }

  confirm(): void {
    for (let language in this.contentTranslations) {
      if (this.languageIsCheckedStatusDict[language] === true) {
        const updatedTranslatedContent = new TranslatedContent(
          this.contentTranslations[language].translation,
          this.contentTranslations[language].dataFormat,
          false
        );
        this.changeListService.editTranslation(
          this.contentId,
          language,
          updatedTranslatedContent
        );
        this.entityTranslationsService.languageCodeToLatestEntityTranslations[
          language
        ].updateTranslation(this.contentId, updatedTranslatedContent);
      } else {
        const updatedTranslatedContent = new TranslatedContent(
          this.contentTranslations[language].translation,
          this.contentTranslations[language].dataFormat,
          true
        );
        this.changeListService.markTranslationAsNeedingUpdateForLanguage(
          this.contentId,
          language
        );
        this.entityTranslationsService.languageCodeToLatestEntityTranslations[
          language
        ].updateTranslation(this.contentId, updatedTranslatedContent);
      }
    }
    this.ngbActiveModal.close();
  }

  cancel(): void {
    this.ngbActiveModal.dismiss();
  }

  getLanguageName(languageCode: string): string {
    return this.languageUtilService.getContentLanguageDescription(
      languageCode
    ) as string;
  }

  isSetOfStringDataFormat(): boolean {
    const activeDataFormat =
      this.contentTranslations[Object.keys(this.contentTranslations)[0]]
        .dataFormat;
    return (
      activeDataFormat === TRANSLATION_DATA_FORMAT_SET_OF_NORMALIZED_STRING ||
      activeDataFormat === TRANSLATION_DATA_FORMAT_SET_OF_UNICODE_STRING
    );
  }
}
