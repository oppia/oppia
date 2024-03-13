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

import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {SubtitledUnicode} from 'domain/exploration/SubtitledUnicodeObjectFactory';
import {TranslatedContent} from 'domain/exploration/TranslatedContentObjectFactory';
import {EntityTranslation} from 'domain/translation/EntityTranslationObjectFactory';
import {
  TranslatableSetOfNormalizedString,
  TranslatableSetOfUnicodeString,
} from 'interactions/rule-input-defs';

export type TranslatableField =
  | SubtitledHtml
  | SubtitledUnicode
  | TranslatableSetOfNormalizedString
  | TranslatableSetOfUnicodeString;
interface ContentReplacers {
  [format: string]: (arg0: TranslatableField, arg1: TranslatedContent) => void;
}

const CONTENT_REPLACERS: ContentReplacers = {
  html: (translatableField, writtenTranslation): void => {
    (translatableField as SubtitledHtml).html =
      writtenTranslation.translation as string;
  },
  unicode: (
    translatableField: TranslatableField,
    writtenTranslation: TranslatedContent
  ): void => {
    (translatableField as SubtitledUnicode).unicode =
      writtenTranslation.translation as string;
  },
  set_of_normalized_string: (
    translatableField: TranslatableField,
    writtenTranslation: TranslatedContent
  ): void => {
    (translatableField as TranslatableSetOfNormalizedString).normalizedStrSet =
      writtenTranslation.translation as string[];
  },
  set_of_unicode_string: (
    translatableField: TranslatableField,
    writtenTranslation: TranslatedContent
  ): void => {
    (translatableField as TranslatableSetOfUnicodeString).unicodeStrSet =
      writtenTranslation.translation as string[];
  },
};

export class BaseTranslatableObject {
  static getContentValue(content: TranslatableField): string | string[] {
    if (content instanceof SubtitledHtml) {
      return content.html;
    }

    if (content instanceof SubtitledUnicode) {
      return content.unicode;
    }

    if (content.hasOwnProperty('normalizedStrSet')) {
      content = content as TranslatableSetOfNormalizedString;
      return content.normalizedStrSet;
    } else {
      content = content as TranslatableSetOfUnicodeString;
      return content.unicodeStrSet;
    }
  }

  getTranslatableFields(): TranslatableField[] {
    return [];
  }

  getTranslatableObjects(): BaseTranslatableObject[] {
    return [];
  }

  swapContentsWithTranslation(entityTranslations: EntityTranslation): void {
    this.getTranslatableFields().forEach(translatableField => {
      const contentId = translatableField.contentId as string;
      let writtenTranslation =
        entityTranslations.getWrittenTranslation(contentId);
      if (writtenTranslation !== null) {
        let dataFormat: string = writtenTranslation.dataFormat;
        if (CONTENT_REPLACERS.hasOwnProperty(dataFormat)) {
          CONTENT_REPLACERS[dataFormat](translatableField, writtenTranslation);
        }
      }
    });

    this.getTranslatableObjects().forEach(translatableObject => {
      translatableObject.swapContentsWithTranslation(entityTranslations);
    });
  }

  getAllContents(): TranslatableField[] {
    let translatableFields = this.getTranslatableFields();

    this.getTranslatableObjects().forEach(translatableObject => {
      translatableFields = translatableFields.concat(
        translatableObject.getAllContents()
      );
    });

    return translatableFields;
  }

  getAllHTMLStrings(): string[] {
    return this.getAllContents()
      .filter(content => {
        return content instanceof SubtitledHtml;
      })
      .map(content => {
        content = content as SubtitledHtml;
        return content.html;
      });
  }

  getAllContentIds(): string[] {
    return this.getAllContents().map(content => {
      return content.contentId as string;
    });
  }
}
