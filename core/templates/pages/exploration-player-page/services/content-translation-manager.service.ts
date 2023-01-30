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

import { BaseTranslatableObject, InteractionRuleInputs } from
  'interactions/rule-input-defs';
import { PlayerTranscriptService } from
  'pages/exploration-player-page/services/player-transcript.service';
import { StateCard } from 'domain/state_card/state-card.model';
import { WrittenTranslation } from
  'domain/exploration/WrittenTranslationObjectFactory';
import { SubtitledHtml } from
  'domain/exploration/subtitled-html.model';
import { Schema } from 'services/schema-default-value.service';
import { SchemaConstants } from
  'components/forms/schema-based-editors/schema.constants';
import { InteractionSpecsConstants, InteractionSpecsKey } from 'pages/interaction-specs.constants';
import { WrittenTranslations } from
  'domain/exploration/WrittenTranslationsObjectFactory';
import { SubtitledUnicode } from
  'domain/exploration/SubtitledUnicodeObjectFactory';
import { ExtensionTagAssemblerService } from
  'services/extension-tag-assembler.service';
import { InteractionCustomizationArgs } from 'interactions/customization-args-defs';

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

  constructor(
    private playerTranscriptService: PlayerTranscriptService,
    private extensionTagAssemblerService: ExtensionTagAssemblerService
  ) {}

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
    const cards = this.playerTranscriptService.transcript;

    if (languageCode === this.explorationLanguageCode) {
      this.playerTranscriptService.restoreImmutably(
        cloneDeep(this.originalTranscript)
      );
    } else {
      cards.forEach(
        card => this._displayTranslationsForCard(card, languageCode));
    }

    this.onStateCardContentUpdateEmitter.emit();
  }

  getTranslatedHtml(
      writtenTranslations: WrittenTranslations,
      languageCode: string,
      content: SubtitledHtml
  ): string {
    if (!content.contentId) {
      throw new Error('Content ID does not exist');
    }
    const writtenTranslation = writtenTranslations.translationsMapping[
      content.contentId][languageCode];
    if (!writtenTranslation) {
      return content.html;
    }
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

  _swapContent(
      writtenTranslations: WrittenTranslations,
      languageCode: string,
      content: SubtitledHtml|SubtitledUnicode
  ): void {
    if (!content.contentId) {
      throw new Error('Content ID does not exist');
    }
    const writtenTranslation: WrittenTranslation | null = (
      writtenTranslations.translationsMapping[content.contentId][languageCode]);

    if (
      !writtenTranslation ||
      !this._isValidStringTranslation(writtenTranslation)
    ) {
      return;
    }

    let valueName = '';
    // Note: The content can only be of type SubtitledHtml|SubtitledUnicode.
    if (content instanceof SubtitledHtml) {
      valueName = '_html';
    } else if (content instanceof SubtitledUnicode) {
      valueName = '_unicode';
    }

    Object.defineProperty(content, valueName, {
      value: writtenTranslation.translation
    });
  }

  _displayTranslationsForCard(card: StateCard, languageCode: string): void {
    const writtenTranslations = card.writtenTranslations;

    const contentTranslation = writtenTranslations.translationsMapping[
      card.contentId][languageCode];
    const contentTranslationText = (
      contentTranslation && contentTranslation.getTranslation());

    // The isString() check is needed for the TypeScript compiler to narrow the
    // type down from string|string[] to string. See "Using type predicates" at
    // https://www.typescriptlang.org/docs/handbook/2/narrowing.html
    // for more information.
    if (this._isString(contentTranslationText) &&
        this._isValidStringTranslation(contentTranslation)) {
      card.contentHtml = contentTranslationText;
    }

    card.getHints().forEach(hint => this._swapContent(
      writtenTranslations, languageCode, hint.hintContent));

    const solution = card.getSolution();
    if (solution !== null) {
      this._swapContent(
        writtenTranslations, languageCode, solution.explanation);
    }

    const defaultOutcome = card.getInteraction().defaultOutcome;
    if (defaultOutcome) {
      this._swapContent(
        writtenTranslations,
        languageCode,
        defaultOutcome.feedback);
    }

    const answerGroups = card.getInteraction().answerGroups;
    answerGroups.forEach(answerGroup => {
      this._swapContent(
        writtenTranslations, languageCode, answerGroup.outcome.feedback);
    });

    if (card.getInteraction().id) {
      this._swapContentInCustomizationArgs(card, languageCode);
      this._swapContentInRules(card, languageCode);
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
          value as SubtitledHtml|SubtitledUnicode);
      } else if (schema.type === SchemaConstants.SCHEMA_KEY_LIST) {
        (value as Object[]).forEach(
          item => traverseSchemaAndSwapTranslatableContent(
            item, schema.items as Schema));
      } else if (schema.type === SchemaConstants.SCHEMA_TYPE_DICT) {
        schema.properties.forEach(property => {
          const name = property.name as keyof typeof value;
          traverseSchemaAndSwapTranslatableContent(
            value[name],
            property.schema);
        });
      }
    };

    const caSpecs = InteractionSpecsConstants.INTERACTION_SPECS[
      interactionId as InteractionSpecsKey
    ].customization_arg_specs;
    for (const caSpec of caSpecs) {
      const name = caSpec.name as keyof InteractionCustomizationArgs;
      if (caValues.hasOwnProperty(name)) {
        const attr = caValues[name] as {value: Object};
        traverseSchemaAndSwapTranslatableContent(
          attr.value, caSpec.schema as Schema);
      }
    }

    // DOMParser().parseFromString() creates a HTML document from
    // the HTML string and it's body contains our required element
    // as a childnode.
    const element = new DOMParser().parseFromString(
      card.getInteractionHtml(), 'text/html'
    ).body.childNodes[0] as HTMLElement;
    this.extensionTagAssemblerService.formatCustomizationArgAttrs(
      element, caValues);
    card.setInteractionHtml(element.outerHTML);
  }

  _swapContentInRules(card: StateCard, languageCode: string): void {
    const writtenTranslations = card.writtenTranslations;
    const CONTENT_ID_KEY = 'contentId';

    const answerGroups = card.getInteraction().answerGroups;
    answerGroups.forEach(answerGroup => {
      answerGroup.rules.forEach(rule => {
        for (var key in rule.inputs) {
          let ruleInputValue = rule.inputs[key];
          if (this._isTranslatableObject(ruleInputValue)) {
            const writtenTranslation = writtenTranslations.translationsMapping[
              ruleInputValue.contentId as string
            ][languageCode];
            // There must be at least one translation.
            if (
              !writtenTranslation ||
              writtenTranslation.translation.length === 0
            ) {
              continue;
            }

            let ruleInputValueKeys = Object.keys(ruleInputValue);

            // Remove the 'contentId' key.
            let contentIdIndex = ruleInputValueKeys.indexOf(CONTENT_ID_KEY);
            ruleInputValueKeys.splice(contentIdIndex, 1);

            // Retrieve the value corresponding to the other key.
            let nonContentIdKey = (
              ruleInputValueKeys[0] as keyof BaseTranslatableObject);
            ruleInputValue[nonContentIdKey] = (
              writtenTranslation.translation as string);
          }
        }
      });
    });
  }

  _isTranslatableObject(
      ruleInputValue: InteractionRuleInputs):
      ruleInputValue is BaseTranslatableObject {
    return isObject(ruleInputValue) && 'contentId' in ruleInputValue;
  }

  _isString(translation: string|string[]): translation is string {
    return (typeof translation === 'string');
  }

  _isValidStringTranslation(writtenTranslation: WrittenTranslation): boolean {
    return (
      writtenTranslation !== undefined &&
      this._isString(writtenTranslation.translation) &&
      writtenTranslation.translation !== '' &&
      writtenTranslation.needsUpdate === false);
  }
}

angular.module('oppia').factory(
  'ContentTranslationManagerService',
  downgradeInjectable(ContentTranslationManagerService));
