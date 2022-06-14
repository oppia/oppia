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
 * @fileoverview Service to manage the content translations displayed.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { EventEmitter, Injectable } from '@angular/core';
import cloneDeep from 'lodash/cloneDeep';
import { HttpClient } from '@angular/common/http';

import { PlayerTranscriptService } from 'pages/exploration-player-page/services/player-transcript.service';
import { StateCard } from 'domain/state_card/state-card.model';
import { ExtensionTagAssemblerService } from 'services/extension-tag-assembler.service';
import { EntityTranslation, EntityTranslationBackendDict } from 'domain/translation/EntityTranslationObjectFactory';

export interface LanguageCodeToEntityTranslations {
  [languageCode: string]: EntityTranslation;
}

@Injectable({
  providedIn: 'root'
})
export class ContentTranslationManagerService {
  // This is initialized using the class initialization method.
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  private explorationLanguageCode!: string;
  private onStateCardContentUpdateEmitter: EventEmitter<void> = (
    new EventEmitter());

  // The 'originalTranscript' is a copy of the transcript in the exploration
  // language in it's initial state.
  private originalTranscript: StateCard[] = [];
  private languageCodeToEntityTranslations: LanguageCodeToEntityTranslations = (
    {});

  entityType: string;
  entityId: string;
  version: number;

  fetchingTranslations: boolean = false;

  constructor(
    private httpClient: HttpClient,
    private playerTranscriptService: PlayerTranscriptService,
    private extensionTagAssemblerService: ExtensionTagAssemblerService
  ) {}

  fetchAndDisplayTranslations(languageCode: string): Promise<any> {
    const url = (
      `/entity_translations_handler/${this.entityType}/${this.entityId}/${this.version}/${languageCode}`);
    this.fetchingTranslations = true;

    return this.httpClient.get<EntityTranslationBackendDict>(url).toPromise()
      .then((response) => {
        this.fetchingTranslations = false;
        const entityTranslations = EntityTranslation.createFromBackendDict(
          response);
        this.languageCodeToEntityTranslations[languageCode] = entityTranslations;
        this.displayTranslations(languageCode);
      });
  }

  setOriginalTranscript(explorationLanguageCode: string): void {
    this.explorationLanguageCode = explorationLanguageCode;
    this.originalTranscript = cloneDeep(
      this.playerTranscriptService.transcript);
  }

  get onStateCardContentUpdate(): EventEmitter<void> {
    return this.onStateCardContentUpdateEmitter;
  }

  /**
   * This method replaces the translatable content inside the player transcript
   * service's StateCards. If the language code is set back to the original
   * exploration language, the original transcript in the exploration language
   * is restored, since it was previously modified from switching to another
   * language previously. Note that learners can only freely switch content
   * languages when they are on the first state and have not entered an answer
   * yet (so, there are no response pairs), otherwise they will have to refresh
   * the page and restart the exploration.
   * @param {string} languageCode The language code to display translations for.
   */
  displayTranslations(languageCode: string): void {
    if (languageCode === this.explorationLanguageCode) {
      this.playerTranscriptService.restoreImmutably(this.originalTranscript);
    } else if (
      !this.languageCodeToEntityTranslations.hasOwnProperty(languageCode)) {
        this.fetchAndDisplayTranslations(languageCode);
        return;
    } else {
      const cards = this.playerTranscriptService.transcript;
      cards.forEach(
        card => this._displayTranslationsForCard(card, languageCode));
    }

    this.onStateCardContentUpdateEmitter.emit();
  }

  _displayTranslationsForCard(card: StateCard, languageCode): void {
    const entityTranslations = this.languageCodeToEntityTranslations[languageCode];
    card.swapContentsWithTranslation(entityTranslations);
    if (card.getInteractionId()) {
      // DOMParser().parseFromString() creates a HTML document from
      // the HTML string and it's body contains our required element
      // as a childnode.
      const element = new DOMParser().parseFromString(
        card.getInteractionHtml(), 'text/html'
      ).body.childNodes[0] as HTMLElement;
      this.extensionTagAssemblerService.formatCustomizationArgAttrs(
        element, card.getInteractionCustomizationArgs());
      card.setInteractionHtml(element.outerHTML);
    }
  }

  init(entityType: string, entityId: string, version: number) {
    this.entityType = entityType;
    this.entityId = entityId;
    this.version = version;
  }
}

angular.module('oppia').factory(
  'ContentTranslationManagerService',
  downgradeInjectable(ContentTranslationManagerService));
