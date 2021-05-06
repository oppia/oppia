// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the WrittenTranslation object factory.
 */

import {
  WrittenTranslationObjectFactory,
  WrittenTranslation,
  TRANSLATION_DATA_FORMAT_HTML,
  TRANSLATION_DATA_FORMAT_UNICODE,
  TRANSLATION_DATA_FORMAT_SET_OF_NORMALIZED_STRING,
  TRANSLATION_DATA_FORMAT_SET_OF_UNICODE_STRING
} from 'domain/exploration/WrittenTranslationObjectFactory';

describe('WrittenTranslation object factory', () => {
  let wtof: WrittenTranslationObjectFactory;
  let writtenTranslation: WrittenTranslation;

  beforeEach(() => {
    wtof = new WrittenTranslationObjectFactory();
    writtenTranslation = wtof.createFromBackendDict({
      data_format: 'html',
      translation: '<p>HTML</p>',
      needs_update: false
    });
  });

  it('should set and get translation value correctly', () => {
    expect(writtenTranslation).toEqual(wtof.createFromBackendDict({
      data_format: 'html',
      translation: '<p>HTML</p>',
      needs_update: false
    }));
    expect(writtenTranslation.getTranslation()).toEqual('<p>HTML</p>');
    expect(writtenTranslation.isHtml()).toBe(true);
    expect(writtenTranslation.isUnicode()).toBe(false);
    expect(writtenTranslation.isSetOfStrings()).toBe(false);

    writtenTranslation.setTranslation('<p>New HTML</p>');
    expect(writtenTranslation.getTranslation()).toEqual('<p>New HTML</p>');
    expect(writtenTranslation).toEqual(wtof.createFromBackendDict({
      data_format: 'html',
      translation: '<p>New HTML</p>',
      needs_update: false
    }));

    const unicodeWrittenTranslation = wtof.createFromBackendDict({
      data_format: 'unicode',
      translation: 'unicode',
      needs_update: false
    });
    expect(unicodeWrittenTranslation.getTranslation()).toEqual('unicode');
    expect(unicodeWrittenTranslation.isHtml()).toBe(false);
    expect(unicodeWrittenTranslation.isUnicode()).toBe(true);
    expect(unicodeWrittenTranslation.isSetOfStrings()).toBe(false);

    const setOfStringsWrittenTranslation = wtof.createFromBackendDict({
      data_format: 'set_of_normalized_string',
      translation: ['a string'],
      needs_update: false
    });
    expect(setOfStringsWrittenTranslation.getTranslation()).toEqual(
      ['a string']);
    expect(setOfStringsWrittenTranslation.isHtml()).toBe(false);
    expect(setOfStringsWrittenTranslation.isUnicode()).toBe(false);
    expect(setOfStringsWrittenTranslation.isSetOfStrings()).toBe(true);
  });

  it('should throw error for an invalid data format on creation', () => {
    expect(() => wtof.createNew('invalid')).toThrowError(
      'Invalid translation data format: invalid');
  });

  it('should throw error if the wrong setter is used', () => {
    writtenTranslation = wtof.createFromBackendDict({
      data_format: 'unicode',
      translation: 'unicode',
      needs_update: false
    });
    expect(
      () => writtenTranslation.setTranslation(['abc'])
    ).toThrowError(
      'This translation is not of the correct type for data format unicode');
  });

  it('should correctly mark written translation as needing update',
    () => {
      expect(writtenTranslation).toEqual(wtof.createFromBackendDict({
        data_format: 'html',
        translation: '<p>HTML</p>',
        needs_update: false
      }));
      writtenTranslation.markAsNeedingUpdate();
      expect(writtenTranslation).toEqual(wtof.createFromBackendDict({
        data_format: 'html',
        translation: '<p>HTML</p>',
        needs_update: true
      }));
    });

  it('should toggle needs update attribute correctly', () => {
    expect(writtenTranslation).toEqual(wtof.createFromBackendDict({
      data_format: 'html',
      translation: '<p>HTML</p>',
      needs_update: false
    }));
    writtenTranslation.toggleNeedsUpdateAttribute();
    expect(writtenTranslation).toEqual(wtof.createFromBackendDict({
      data_format: 'html',
      translation: '<p>HTML</p>',
      needs_update: true
    }));

    writtenTranslation.toggleNeedsUpdateAttribute();
    expect(writtenTranslation).toEqual(wtof.createFromBackendDict({
      data_format: 'html',
      translation: '<p>HTML</p>',
      needs_update: false
    }));
  });

  it('should convert to backend dict correctly', () => {
    expect(writtenTranslation.toBackendDict()).toEqual({
      data_format: 'html',
      translation: '<p>HTML</p>',
      needs_update: false
    });
  });

  it('should create a new written translation translation', () => {
    expect(wtof.createNew(TRANSLATION_DATA_FORMAT_HTML)).toEqual(
      wtof.createFromBackendDict({
        data_format: 'html',
        translation: '',
        needs_update: false
      })
    );

    expect(wtof.createNew(TRANSLATION_DATA_FORMAT_UNICODE)).toEqual(
      wtof.createFromBackendDict({
        data_format: 'unicode',
        translation: '',
        needs_update: false
      })
    );

    expect(
      wtof.createNew(TRANSLATION_DATA_FORMAT_SET_OF_UNICODE_STRING)
    ).toEqual(
      wtof.createFromBackendDict({
        data_format: 'set_of_unicode_string',
        translation: [],
        needs_update: false
      })
    );

    expect(
      wtof.createNew(TRANSLATION_DATA_FORMAT_SET_OF_NORMALIZED_STRING)
    ).toEqual(
      wtof.createFromBackendDict({
        data_format: 'set_of_normalized_string',
        translation: [],
        needs_update: false
      })
    );
  });
});
