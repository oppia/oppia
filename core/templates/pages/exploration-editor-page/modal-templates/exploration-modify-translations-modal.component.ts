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
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {ContextService} from 'services/context.service';
import {EntityBulkTranslationsBackendApiService} from '../services/entity-bulk-translations-backend-api.service';
import {EntityTranslationsService} from 'services/entity-translations.services';
import {LanguageUtilService} from 'domain/utilities/language-util.service';
import {TranslatedContent} from 'domain/exploration/TranslatedContentObjectFactory';
import {ChangeListService} from '../services/change-list.service';

interface LanguageCodeToContentTranslations {
  [language_code: string]: TranslatedContent;
}

@Component({
  selector: 'oppia-exploration-modify-translations-modal',
  templateUrl: './exploration-modify-translations-modal.component.html',
})
export class ModifyTranslationsModalComponent extends ConfirmOrCancelModal {
  @Input() contentId!: string;
  explorationId!: string;
  explorationVersion!: number;
  contentTranslations: LanguageCodeToContentTranslations = {};
  allExistingTranslationsHaveBeenRemoved: boolean = false;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private contextService: ContextService,
    private entityBulkTranslationsBackendApiService: EntityBulkTranslationsBackendApiService,
    private languageUtilService: LanguageUtilService,
    private entityTranslationsService: EntityTranslationsService,
    private changeListService: ChangeListService
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.explorationId = this.contextService.getExplorationId();
    this.explorationVersion =
      this.contextService.getExplorationVersion() as number;

    // Populate the content translations via latest draft changes first,
    // in order to get the most recently updated translations.
    for (let language in this.entityTranslationsService
      .languageCodeToEntityTranslations) {
      let translationContent =
        this.entityTranslationsService.languageCodeToEntityTranslations[
          language
        ].getWrittenTranslation(this.contentId);
      if (translationContent) {
        this.contentTranslations[language] = translationContent;
      }
    }

    this.allExistingTranslationsHaveBeenRemoved = this.changeListService
      .getTranslationChangeList()
      .some(changeDict => {
        return (
          changeDict.cmd === 'remove_translations' &&
          changeDict.content_id === this.contentId
        );
      });

    // Populate the content translations via published translations from the backend.
    // These translations are used for a language when the published translations are
    // the latest translations available.
    if (!this.allExistingTranslationsHaveBeenRemoved) {
      this.entityBulkTranslationsBackendApiService
        .fetchEntityBulkTranslationsAsync(
          this.explorationId,
          'exploration',
          this.explorationVersion
        )
        .then(response => {
          for (let language in response) {
            let languageTranslations = response[language].translationMapping;
            if (
              this.contentId in languageTranslations &&
              !this.contentTranslations[language]
            ) {
              let translationDict = languageTranslations[this.contentId];
              this.contentTranslations[language] = new TranslatedContent(
                translationDict.translation,
                translationDict.dataFormat,
                translationDict.needsUpdate
              );
            }
          }
        });
    }
  }

  getLanguageName(languageCode: string): string {
    return this.languageUtilService.getContentLanguageDescription(
      languageCode
    ) as string;
  }
}
