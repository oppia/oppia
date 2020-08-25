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
  WRITTEN_TRANSLATION_TYPE_HTML
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
    expect(writtenTranslation.getHtml()).toEqual('<p>HTML</p>');
    writtenTranslation.setHtml('<p>New HTML</p>');
    expect(writtenTranslation.getHtml()).toEqual('<p>New HTML</p>');
    expect(writtenTranslation).toEqual(wtof.createFromBackendDict({
      data_format: 'html',
      translation: '<p>New HTML</p>',
      needs_update: false
    }));
  });

  it('should throw error if the wrong getter is used', () => {
    writtenTranslation = wtof.createFromBackendDict({
      data_format: 'unicode',
      translation: 'unicode',
      needs_update: false
    });
    expect(
      () => writtenTranslation.getHtml()
    ).toThrowError('This translation is not of type html');
  });

  it('should throw error if the wrong setter is used', () => {
    writtenTranslation = wtof.createFromBackendDict({
      data_format: 'unicode',
      translation: 'unicode',
      needs_update: false
    });
    expect(
      () => writtenTranslation.setHtml('')
    ).toThrowError('This translation is not of type html');
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
    expect(wtof.createNew(WRITTEN_TRANSLATION_TYPE_HTML, 'New')).toEqual(
      wtof.createFromBackendDict({
        data_format: 'html',
        translation: 'New',
        needs_update: false
      })
    );
  });
});
