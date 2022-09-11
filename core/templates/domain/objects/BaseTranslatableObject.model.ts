// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Model for the BaseTranslatableObject.
 */

import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { SubtitledUnicode } from 'domain/exploration/SubtitledUnicodeObjectFactory';
import { TranslatedContent } from 'domain/exploration/TranslatedContentObjectFactory';
import { EntityTranslation } from 'domain/translation/EntityTranslationObjectFactory';
import { TranslatableSetOfNormalizedString, TranslatableSetOfUnicodeString } from 'interactions/rule-input-defs';

export type TranslatableField = (
  SubtitledHtml |
  SubtitledUnicode |
  TranslatableSetOfNormalizedString |
  TranslatableSetOfUnicodeString
);

export class BaseTranslatableObject {
  static getContentValue(content: TranslatableField): string | string[] | null {
    if (content instanceof SubtitledHtml) {
      return content.html;
    }

    if (content instanceof SubtitledUnicode) {
      return content.unicode;
    }

    if (content.hasOwnProperty('normalizedStrSet')) {
      content = content as TranslatableSetOfNormalizedString;
      return content.normalizedStrSet;
    }

    if (content.hasOwnProperty('unicodeStrSet')) {
      content = content as TranslatableSetOfUnicodeString;
      return content.unicodeStrSet;
    }

    return null;
  }

  getTranslatableFields(): TranslatableField[] {
    return [];
  }

  getTranslatableObjects(): BaseTranslatableObject[] {
    return [];
  }

  _isString(translation: string|string[]): translation is string {
    return (typeof translation === 'string');
  }

  _isValidStringTranslation(writtenTranslation: TranslatedContent): boolean {
    return (
      writtenTranslation !== undefined &&
      this._isString(writtenTranslation.translation) &&
      writtenTranslation.translation !== '' &&
      writtenTranslation.needsUpdate === false);
  }

  swapContentsWithTranslation(entityTranslations: EntityTranslation): void {
    this.getTranslatableFields().forEach((translatableField) => {
      const contentId = translatableField.contentId;
      if (entityTranslations.hasWrittenTranslation(contentId)) {
        let writtenTranslation = entityTranslations.getWrittenTranslation(
          contentId);
        if (this._isValidStringTranslation(writtenTranslation)) {
          if (translatableField instanceof SubtitledHtml) {
            translatableField.html = writtenTranslation.translation as string;
          } else if (translatableField instanceof SubtitledUnicode) {
            translatableField.unicode = (
              writtenTranslation.translation as string);
          }
        }
      }
    });

    this.getTranslatableObjects().forEach((translatableObject) => {
      translatableObject.swapContentsWithTranslation(entityTranslations);
    });
  }

  getAllContents(): (SubtitledHtml | SubtitledUnicode)[] {
    let translatableFields = this.getTranslatableFields();

    this.getTranslatableObjects().forEach((translatableObject) => {
      translatableFields = translatableFields.concat(
        translatableObject.getAllContents());
    });

    return translatableFields;
  }

  getAllHTMLs(): SubtitledHtml[] {
    return this.getAllContents().map((content) => {
      if (content instanceof SubtitledHtml) {
        return content;
      }
    });
  }

  getAllContentIds(): string[] {
    return this.getAllContents().map((content) => {
      return content.contentId;
    });
  }
}
