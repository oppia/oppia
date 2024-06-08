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
import {TranslatedContentBackendDict} from 'domain/exploration/TranslatedContentObjectFactory';

interface LanguageCodeToContentTranslations {
  [language_code: string]: TranslatedContentBackendDict;
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

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private contextService: ContextService,
    private entityBulkTranslationsBackendApiService: EntityBulkTranslationsBackendApiService,
    private languageUtilService: LanguageUtilService,
    private entityTranslationsService: EntityTranslationsService
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.explorationId = this.contextService.getExplorationId();
    this.explorationVersion = this.contextService.getExplorationVersion();

    for (let language in this.entityTranslationsService
      .languageCodeToEntityTranslations) {
      let translationContent =
        this.entityTranslationsService.languageCodeToEntityTranslations[
          language
        ].getWrittenTranslation(this.contentId);
      if (translationContent) {
        this.contentTranslations[language] = translationContent.toBackendDict();
      }
    }

    this.entityBulkTranslationsBackendApiService
      .fetchEntityBulkTranslationsAsync(
        this.explorationId,
        'exploration',
        this.explorationVersion
      )
      .then(response => {
        for (let language in response) {
          let language_translations = response[language]['translations'];
          if (
            this.contentId in language_translations &&
            !this.contentTranslations[language]
          ) {
            this.contentTranslations[language] =
              language_translations[this.contentId];
          }
        }
      });
  }

  getLanguageName(languageCode: string): string {
    return this.languageUtilService.getContentLanguageDescription(languageCode);
  }
}
