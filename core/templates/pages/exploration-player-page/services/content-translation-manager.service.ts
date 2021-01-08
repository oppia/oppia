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

import { PlayerTranscriptService } from
  'pages/exploration-player-page/services/player-transcript.service';
import { StateCard } from
  'domain/state_card/StateCardObjectFactory';
import { WrittenTranslation } from
  'domain/exploration/WrittenTranslationObjectFactory';
import { SubtitledHtml } from
  'domain/exploration/SubtitledHtmlObjectFactory';
import { Schema } from 'services/schema-default-value.service';
import { SchemaConstants } from
  'components/forms/schema-based-editors/schema-constants';
import INTERACTION_SPECS from 'pages/interaction-specs.constants.ajs';
import { WrittenTranslations } from
  'domain/exploration/WrittenTranslationsObjectFactory';
import { SubtitledUnicode } from
  'domain/exploration/SubtitledUnicodeObjectFactory';
import { ExtensionTagAssemblerService } from
  'services/extension-tag-assembler.service';


@Injectable({
  providedIn: 'root'
})
export class ContentTranslationManagerService {
  private explorationLanguageCode: string;
  private onStateCardContentUpdateEmitter: EventEmitter<void> = (
    new EventEmitter());
  // The 'originalTranscript' is a copy of the transcript in the exploration
  // language in it's initial state.
  private originalTranscript: StateCard[] = [];

  constructor(
    private playerTranscriptService: PlayerTranscriptService,
    private extensionTagAssemblerService: ExtensionTagAssemblerService
  ) {}

  init(explorationLanguageCode: string) : void {
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
  displayTranslations(languageCode: string) : void {
    const cards = this.playerTranscriptService.transcript;

    if (languageCode === this.explorationLanguageCode) {
      this.playerTranscriptService.restoreImmutably(this.originalTranscript);
    } else {
      cards.forEach(
        card => this._displayTranslationsForCard(card, languageCode));
    }

    this.onStateCardContentUpdateEmitter.emit();
  }

  _swapContent(
      writtenTranslations: WrittenTranslations,
      languageCode: string,
      content: SubtitledHtml|SubtitledUnicode
  ): void {
    const writtenTranslation = writtenTranslations.translationsMapping[
      content.contentId][languageCode];

    if (!this._isValidTranslation(writtenTranslation)) {
      return;
    }

    let valueName;
    // Note: The content can only be of type SubtitledHtml|SubtitledUnicode.
    if (content instanceof SubtitledHtml) {
      valueName = 'html';
    } else if (content instanceof SubtitledUnicode) {
      valueName = 'unicode';
    }

    content[valueName] = writtenTranslation.translation;
  }

  _displayTranslationsForCard(card: StateCard, languageCode: string) : void {
    const writtenTranslations = card.writtenTranslations;

    const contentTranslation = writtenTranslations.translationsMapping[
      card.contentId][languageCode];
    if (this._isValidTranslation(contentTranslation)) {
      card.contentHtml = contentTranslation.translation;
    }

    card.getHints().forEach(hint => this._swapContent(
      writtenTranslations, languageCode, hint.hintContent));

    const solution = card.getSolution();
    if (solution !== null) {
      this._swapContent(
        writtenTranslations, languageCode, solution.explanation);
    }

    if (card.getInteraction().defaultOutcome) {
      this._swapContent(
        writtenTranslations,
        languageCode,
        card.getInteraction().defaultOutcome.feedback);
    }

    const answerGroups = card.getInteraction().answerGroups;
    answerGroups.forEach(answerGroup => {
      this._swapContent(
        writtenTranslations, languageCode, answerGroup.outcome.feedback);
    });

    if (card.getInteraction().id) {
      this._swapContentInCustomizationArgs(
        card, languageCode);
    }
  }

  _swapContentInCustomizationArgs(card: StateCard, languageCode: string): void {
    const interactionId = card.getInteractionId();
    const caValues = card.getInteraction().customizationArgs;
    const writtenTranslations = card.writtenTranslations;

    let traverseSchemaAndSwapTranslatableContent = (
        value: Object | Object[],
        schema: Schema
    ): void => {
      const schemaIsSubtitledHtml = (
        schema.type === SchemaConstants.SCHEMA_TYPE_CUSTOM &&
        schema.obj_type === SchemaConstants.SCHEMA_OBJ_TYPE_SUBTITLED_HTML);
      const schemaIsSubtitledUnicode = (
        schema.type === SchemaConstants.SCHEMA_TYPE_CUSTOM &&
        schema.obj_type === SchemaConstants.SCHEMA_OBJ_TYPE_SUBTITLED_UNICODE
      );

      if (schemaIsSubtitledHtml || schemaIsSubtitledUnicode) {
        this._swapContent(
          writtenTranslations, languageCode,
          <SubtitledHtml|SubtitledUnicode>value);
      } else if (schema.type === SchemaConstants.SCHEMA_KEY_LIST) {
        (<Object[]> value).forEach(
          item => traverseSchemaAndSwapTranslatableContent(
            item, <Schema> schema.items));
      } else if (schema.type === SchemaConstants.SCHEMA_TYPE_DICT) {
        schema.properties.forEach(property => {
          const name = property.name;
          traverseSchemaAndSwapTranslatableContent(
            value[name],
            property.schema);
        });
      }
    };

    const caSpecs = INTERACTION_SPECS[interactionId].customization_arg_specs;
    for (const caSpec of caSpecs) {
      const name = caSpec.name;
      if (caValues.hasOwnProperty(name)) {
        traverseSchemaAndSwapTranslatableContent(
          caValues[name].value,
          caSpec.schema);
      }
    }

    const element = $(card.getInteractionHtml());
    this.extensionTagAssemblerService.formatCustomizationArgAttrs(
      element, caValues);
    card.setInteractionHtml(element.get(0).outerHTML);
  }

  _isValidTranslation(writtenTranslation: WrittenTranslation): boolean {
    return (
      writtenTranslation !== undefined &&
      writtenTranslation.translation !== '' &&
      writtenTranslation.needsUpdate === false);
  }
}

angular.module('oppia').factory(
  'ContentTranslationManagerService',
  downgradeInjectable(ContentTranslationManagerService));
