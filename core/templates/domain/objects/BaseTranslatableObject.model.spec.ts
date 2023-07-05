// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for BaseTranslatableObject model.
 */

import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { SubtitledUnicode } from 'domain/exploration/SubtitledUnicodeObjectFactory';
import { EntityTranslation } from 'domain/translation/EntityTranslationObjectFactory';
import { TranslatableSetOfNormalizedString, TranslatableSetOfUnicodeString } from 'interactions/rule-input-defs';
import { BaseTranslatableObject, TranslatableField } from './BaseTranslatableObject.model';

class DerivedTranslatableObject extends BaseTranslatableObject {
  htmlField: SubtitledHtml;
  unicodeField: SubtitledUnicode;
  setOfNormalizedStringsField: TranslatableSetOfNormalizedString;
  setOfUnicodeStringsField: TranslatableSetOfUnicodeString;

  constructor() {
    super();
    this.htmlField = new SubtitledHtml('Html content', 'content_0');
    this.unicodeField = new SubtitledUnicode('Unicode content', 'content_1');
    this.setOfNormalizedStringsField = {
      normalizedStrSet: ['String 1', 'String 2'],
      contentId: 'content_2'
    };
    this.setOfUnicodeStringsField = {
      unicodeStrSet: ['String 1', 'String 2'],
      contentId: 'content_3'
    };
  }

  getTranslatableFields(): TranslatableField[] {
    return [
      this.htmlField,
      this.unicodeField,
      this.setOfNormalizedStringsField,
      this.setOfUnicodeStringsField
    ];
  }
}

describe('Base Translatable Object model', () => {
  describe('.getContentValue', () => {
    it('should return correct html', () => {
      let expectedHtml = '<p>Html string</p>';
      let translatableHtmlContent = new SubtitledHtml(
        expectedHtml, 'content_id_1');
      let observedContentValue = BaseTranslatableObject.getContentValue(
        translatableHtmlContent);

      expect(observedContentValue).toBe(expectedHtml);
    });

    it('should return correct unicode string', () => {
      let expectedUnicode = 'Unicode string';
      let translatableUnicodeContent = new SubtitledUnicode(
        expectedUnicode, 'content_id_1');
      let observedContentValue = BaseTranslatableObject.getContentValue(
        translatableUnicodeContent);

      expect(observedContentValue).toBe(expectedUnicode);
    });

    it('should return correct set of normalized string', () => {
      let expectedSetOfNormalizedString = [
        'SetOfNormalizedString1', 'SetOfNormalizedString2'];
      let translatableContent: TranslatableSetOfNormalizedString = {
        normalizedStrSet: expectedSetOfNormalizedString,
        contentId: 'content_id_1'
      };
      let observedContentValue = BaseTranslatableObject.getContentValue(
        translatableContent);

      expect(observedContentValue).toBe(expectedSetOfNormalizedString);
    });

    it('should return correct set of unicode string', () => {
      let expectedSetOfUnicodeString = [
        'SetOfUnicodeString1', 'SetOfUnicodeString2'];
      let translatableContent: TranslatableSetOfUnicodeString = {
        unicodeStrSet: expectedSetOfUnicodeString,
        contentId: 'content_id_1'
      };
      let observedContentValue = BaseTranslatableObject.getContentValue(
        translatableContent);

      expect(observedContentValue).toBe(expectedSetOfUnicodeString);
    });
  });

  describe('.swapContentsWithTranslation', () => {
    it('should swap html field', () => {
      let entityTranslation = EntityTranslation.createFromBackendDict({
        entity_id: 'entity1',
        entity_type: 'exploration',
        entity_version: 5,
        language_code: 'hi',
        translations: {
          content_0: {
            content_format: 'html',
            content_value: 'Translation',
            needs_update: false
          }
        }
      });
      let derivedTranslatableObject = new DerivedTranslatableObject();
      expect(derivedTranslatableObject.htmlField.html).toEqual('Html content');

      derivedTranslatableObject.swapContentsWithTranslation(entityTranslation);

      expect(derivedTranslatableObject.htmlField.html).toEqual('Translation');
    });

    it('should swap unicode field', () => {
      let entityTranslation = EntityTranslation.createFromBackendDict({
        entity_id: 'entity1',
        entity_type: 'exploration',
        entity_version: 5,
        language_code: 'hi',
        translations: {
          content_1: {
            content_format: 'unicode',
            content_value: 'Translation',
            needs_update: false
          }
        }
      });
      let derivedTranslatableObject = new DerivedTranslatableObject();
      expect(derivedTranslatableObject.unicodeField.unicode).toEqual(
        'Unicode content'
      );

      derivedTranslatableObject.swapContentsWithTranslation(entityTranslation);

      expect(derivedTranslatableObject.unicodeField.unicode).toEqual(
        'Translation'
      );
    });

    it('should swap set of normalized string field', () => {
      let entityTranslation = EntityTranslation.createFromBackendDict({
        entity_id: 'entity1',
        entity_type: 'exploration',
        entity_version: 5,
        language_code: 'hi',
        translations: {
          content_2: {
            content_format: 'set_of_normalized_string',
            content_value: ['Translation 1', 'Translation 2'],
            needs_update: false
          }
        }
      });
      let derivedTranslatableObject = new DerivedTranslatableObject();
      expect(
        derivedTranslatableObject.setOfNormalizedStringsField.normalizedStrSet
      ).toEqual(['String 1', 'String 2']);

      derivedTranslatableObject.swapContentsWithTranslation(entityTranslation);

      expect(
        derivedTranslatableObject.setOfNormalizedStringsField.normalizedStrSet
      ).toEqual(
        ['Translation 1', 'Translation 2']
      );
    });


    it('should swap set of unicode string field', () => {
      let entityTranslation = EntityTranslation.createFromBackendDict({
        entity_id: 'entity1',
        entity_type: 'exploration',
        entity_version: 5,
        language_code: 'hi',
        translations: {
          content_3: {
            content_format: 'set_of_unicode_string',
            content_value: ['Translation 1', 'Translation 2'],
            needs_update: false
          }
        }
      });
      let derivedTranslatableObject = new DerivedTranslatableObject();
      expect(
        derivedTranslatableObject.setOfUnicodeStringsField.unicodeStrSet
      ).toEqual(['String 1', 'String 2']);

      derivedTranslatableObject.swapContentsWithTranslation(entityTranslation);

      expect(
        derivedTranslatableObject.setOfUnicodeStringsField.unicodeStrSet
      ).toEqual(
        ['Translation 1', 'Translation 2']
      );
    });
  });
});
