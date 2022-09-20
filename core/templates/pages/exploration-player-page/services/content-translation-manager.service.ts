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
import isObject from 'lodash/isObject';

import { PlayerTranscriptService } from 'pages/exploration-player-page/services/player-transcript.service';
import { StateCard } from 'domain/state_card/state-card.model';
import { ExtensionTagAssemblerService } from 'services/extension-tag-assembler.service';
import { EntityTranslation } from 'domain/translation/EntityTranslationObjectFactory';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslationsFetchingMessageModalComponent } from 'pages/exploration-editor-page/modal-templates/translations-fetching-message-modal.component';
import { EntityTranslationBackendApiService } from 'pages/exploration-editor-page/services/entity-translation-backend-api.service';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { BaseTranslatableObject, InteractionRuleInputs } from 'interactions/rule-input-defs';
import { WrittenTranslation } from 'domain/exploration/WrittenTranslationObjectFactory';
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

  private entityType: string = null;
  private entityId: string = null;
  private version: number = null;

  constructor(
    private ngbModal: NgbModal,
    private playerTranscriptService: PlayerTranscriptService,
    private extensionTagAssemblerService: ExtensionTagAssemblerService,
    private entityTranslationBackendApiService: (
      EntityTranslationBackendApiService)
  ) {}

  fetchAndDisplayTranslations(languageCode: string): void {
    let modalRef = null;
    setTimeout(() => {
      modalRef = this.ngbModal.open(TranslationsFetchingMessageModalComponent, {
        backdrop: 'static',
      });
    }, 0);
    this.entityTranslationBackendApiService.fetchEntityTranslationAsync(
      this.entityId,
      this.entityType,
      this.version,
      languageCode).then((entityTranslation) => {
      this.languageCodeToEntityTranslations[languageCode] = entityTranslation;
      this.displayTranslations(languageCode);
      modalRef.close();
    }, () => {
      modalRef.close();
    });
  }

  getTranslatedHtml(
      languageCode: string,
      content: SubtitledHtml
  ): string {
    if (!content.contentId) {
      throw new Error('Content ID does not exist');
    }
    if (!this.languageCodeToEntityTranslations.hasOwnProperty(languageCode)) {
      return content.html;
    }

    let entityTranslation = this.languageCodeToEntityTranslations[languageCode];
    if (!entityTranslation.hasWrittenTranslation(languageCode)) {
      return content.html;
    }
    const writtenTranslation = entityTranslation[content.contentId];
    const translationText = writtenTranslation.getTranslation();

    // The isString() check is needed for the TypeScript compiler to narrow the
    // type down from string|string[] to string. See "Using type predicates" at
    // https://www.typescriptlang.org/docs/handbook/2/narrowing.html
    // for more information.
    if (this._isString(translationText) &&
      this._isValidStringTranslation(writtenTranslation)) {
      return translationText;
    }

    return content.html;
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
      this.playerTranscriptService.restoreImmutably(
        cloneDeep(this.originalTranscript));
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

  _displayTranslationsForCard(card: StateCard, languageCode: string): void {
    const entityTranslations = this.languageCodeToEntityTranslations[
      languageCode];
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

  _isTranslatableObject(
      ruleInputValue: InteractionRuleInputs):
    ruleInputValue is BaseTranslatableObject {
    return isObject(ruleInputValue) && 'contentId' in ruleInputValue;
  }

  _isString(translation: string | string[]): translation is string {
    return (typeof translation === 'string');
  }

  _isValidStringTranslation(writtenTranslation: WrittenTranslation): boolean {
    return (
      writtenTranslation !== undefined &&
      this._isString(writtenTranslation.translation) &&
      writtenTranslation.translation !== '' &&
      writtenTranslation.needsUpdate === false);
  }

  init(entityType: string, entityId: string, version: number): void {
    this.entityType = entityType;
    this.entityId = entityId;
    this.version = version;
  }
}

angular.module('oppia').factory(
  'ContentTranslationManagerService',
  downgradeInjectable(ContentTranslationManagerService));
