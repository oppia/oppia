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
 * @fileoverview Unit tests for WrittenTranslationsObjectFactory.ts
 */
import {TestBed} from '@angular/core/testing';

import {
  WrittenTranslations,
  WrittenTranslationsObjectFactory,
} from 'domain/exploration/WrittenTranslationsObjectFactory';
import {WrittenTranslationObjectFactory} from 'domain/exploration/WrittenTranslationObjectFactory';

describe('Written Translations Object Factory', () => {
  let writtenTranslationsObjectFactory: WrittenTranslationsObjectFactory;
  let writtenTranslationObjectFactory: WrittenTranslationObjectFactory;
  let writtenTranslationsBackendDict: WrittenTranslations;

  beforeEach(() => {
    writtenTranslationsObjectFactory = TestBed.inject(
      WrittenTranslationsObjectFactory
    );
    writtenTranslationObjectFactory = TestBed.inject(
      WrittenTranslationObjectFactory
    );

    writtenTranslationsBackendDict =
      writtenTranslationsObjectFactory.createFromBackendDict({
        translations_mapping: {
          content_1: {
            'hi-en': {
              data_format: 'html',
              translation: '',
              needs_update: false,
            },
          },
        },
      });
  });

  it('should create a written translations object from backend dict', () => {
    expect(writtenTranslationsBackendDict.toBackendDict()).toEqual({
      translations_mapping: {
        content_1: {
          'hi-en': {
            data_format: 'html',
            translation: '',
            needs_update: false,
          },
        },
      },
    });
  });

  it('should create an empty written translations object', () => {
    const emptyWrittenTranslationsObject =
      writtenTranslationsObjectFactory.createEmpty();
    expect(emptyWrittenTranslationsObject.getAllContentIds()).toEqual([]);
  });

  it('should add and delete contents from a written translations object', () => {
    expect(writtenTranslationsBackendDict.getAllContentIds()).toEqual([
      'content_1',
    ]);
    writtenTranslationsBackendDict.addContentId('content_2');
    expect(writtenTranslationsBackendDict.getAllContentIds()).toEqual([
      'content_1',
      'content_2',
    ]);
    expect(() => {
      writtenTranslationsBackendDict.addContentId('content_2');
    }).toThrowError('Trying to add duplicate content id.');
    expect(writtenTranslationsBackendDict.getAllContentIds()).toEqual([
      'content_1',
      'content_2',
    ]);

    writtenTranslationsBackendDict.deleteContentId('content_2');
    expect(writtenTranslationsBackendDict.getAllContentIds()).toEqual([
      'content_1',
    ]);
    expect(() => {
      writtenTranslationsBackendDict.deleteContentId('content_2');
    }).toThrowError('Unable to find the given content id.');
    expect(writtenTranslationsBackendDict.getAllContentIds()).toEqual([
      'content_1',
    ]);
  });

  it('should add translation in a written translations object', () => {
    expect(() => {
      writtenTranslationsBackendDict.addWrittenTranslation(
        'content_1',
        'hi-en',
        'html',
        'This is a HTML text'
      );
    }).toThrowError('Trying to add duplicate language code.');

    writtenTranslationsBackendDict.addWrittenTranslation(
      'content_1',
      'en',
      'html',
      'English HTML'
    );
    expect(
      writtenTranslationsBackendDict.getLanguageCodes('content_1')
    ).toEqual(['hi-en', 'en']);
  });

  it('should update the html language code of a written translations object', () => {
    const writtenTranslationsBackendDict =
      writtenTranslationsObjectFactory.createFromBackendDict({
        translations_mapping: {
          content_1: {
            'hi-en': {
              data_format: 'html',
              translation: '<p>This is the old HTML</p>',
              needs_update: false,
            },
          },
        },
      });

    expect(
      writtenTranslationsBackendDict.hasWrittenTranslation('content_1', 'hi-en')
    ).toBe(true);
    writtenTranslationsBackendDict.updateWrittenTranslation(
      'content_1',
      'hi-en',
      '<p>This is the new HTML</p>'
    );
    expect(
      writtenTranslationsBackendDict.getWrittenTranslation('content_1', 'hi-en')
    ).toEqual(
      writtenTranslationObjectFactory.createFromBackendDict({
        data_format: 'html',
        translation: '<p>This is the new HTML</p>',
        needs_update: false,
      })
    );

    expect(() => {
      writtenTranslationsBackendDict.updateWrittenTranslation(
        'content_1',
        'en',
        'This is the new HTML'
      );
    }).toThrowError('Unable to find the given language code.');
    expect(writtenTranslationsBackendDict.hasWrittenTranslation('', 'en')).toBe(
      false
    );
  });

  it('should toggle needs_update for a language code', () => {
    writtenTranslationsBackendDict.toggleNeedsUpdateAttribute(
      'content_1',
      'hi-en'
    );
    expect(
      writtenTranslationsBackendDict.getWrittenTranslation('content_1', 'hi-en')
    ).toEqual(
      writtenTranslationObjectFactory.createFromBackendDict({
        data_format: 'html',
        translation: '',
        needs_update: true,
      })
    );
    expect(
      writtenTranslationsBackendDict.hasUnflaggedWrittenTranslations(
        'content_1'
      )
    ).toBe(false);

    writtenTranslationsBackendDict.toggleNeedsUpdateAttribute(
      'content_1',
      'hi-en'
    );
    expect(
      writtenTranslationsBackendDict.getWrittenTranslation('content_1', 'hi-en')
    ).toEqual(
      writtenTranslationObjectFactory.createFromBackendDict({
        data_format: 'html',
        translation: '',
        needs_update: false,
      })
    );
    expect(
      writtenTranslationsBackendDict.hasUnflaggedWrittenTranslations(
        'content_1'
      )
    ).toBe(true);
  });

  it('should set needs_update to true in all translations from a content', () => {
    const writtenTranslationsBackendDict =
      writtenTranslationsObjectFactory.createFromBackendDict({
        translations_mapping: {
          content_1: {
            'hi-en': {
              data_format: 'html',
              translation: 'This is the old HTML',
              needs_update: false,
            },
            en: {
              data_format: 'html',
              translation: '',
              needs_update: false,
            },
          },
        },
      });

    writtenTranslationsBackendDict.markAllTranslationsAsNeedingUpdate(
      'content_1'
    );
    expect(
      writtenTranslationsBackendDict.getWrittenTranslation('content_1', 'hi-en')
    ).toEqual(
      writtenTranslationObjectFactory.createFromBackendDict({
        data_format: 'html',
        translation: 'This is the old HTML',
        needs_update: true,
      })
    );
    expect(
      writtenTranslationsBackendDict.getWrittenTranslation('content_1', 'en')
    ).toEqual(
      writtenTranslationObjectFactory.createFromBackendDict({
        data_format: 'html',
        translation: '',
        needs_update: true,
      })
    );
    expect(
      writtenTranslationsBackendDict.hasUnflaggedWrittenTranslations(
        'content_1'
      )
    ).toBe(false);
  });
});
