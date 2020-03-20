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

import { WrittenTranslationObjectFactory, WrittenTranslation } from
  'domain/exploration/WrittenTranslationObjectFactory';

describe('WrittenTranslation object factory', () => {
  describe('WrittenTranslationObjectFactory', () => {
    let wtof: WrittenTranslationObjectFactory;
    let writtenTranslation: WrittenTranslation;

    beforeEach(() => {
      wtof = new WrittenTranslationObjectFactory();
      writtenTranslation = wtof.createFromBackendDict({
        html: '<p>HTML</p>',
        needs_update: false
      });
    });

    it('should set and get html value correctly', () => {
      expect(writtenTranslation).toEqual(wtof.createFromBackendDict({
        html: '<p>HTML</p>',
        needs_update: false
      }));
      expect(writtenTranslation.getHtml()).toEqual('<p>HTML</p>');
      writtenTranslation.setHtml('<p>New HTML</p>');
      expect(writtenTranslation.getHtml()).toEqual('<p>New HTML</p>');
      expect(writtenTranslation).toEqual(wtof.createFromBackendDict({
        html: '<p>New HTML</p>',
        needs_update: false
      }));
    });

    it('should correctly mark written translation as needing update',
      () => {
        expect(writtenTranslation).toEqual(wtof.createFromBackendDict({
          html: '<p>HTML</p>',
          needs_update: false
        }));
        writtenTranslation.markAsNeedingUpdate();
        expect(writtenTranslation).toEqual(wtof.createFromBackendDict({
          html: '<p>HTML</p>',
          needs_update: true
        }));
      });

    it('should toggle needs update attribute correctly', () => {
      expect(writtenTranslation).toEqual(wtof.createFromBackendDict({
        html: '<p>HTML</p>',
        needs_update: false
      }));
      writtenTranslation.toggleNeedsUpdateAttribute();
      expect(writtenTranslation).toEqual(wtof.createFromBackendDict({
        html: '<p>HTML</p>',
        needs_update: true
      }));

      writtenTranslation.toggleNeedsUpdateAttribute();
      expect(writtenTranslation).toEqual(wtof.createFromBackendDict({
        html: '<p>HTML</p>',
        needs_update: false
      }));
    });

    it('should convert to backend dict correctly', () => {
      expect(writtenTranslation.toBackendDict()).toEqual({
        html: '<p>HTML</p>',
        needs_update: false
      });
    });

    it('should create a new written translation translation', () => {
      expect(wtof.createNew('New')).toEqual(
        wtof.createFromBackendDict({
          html: 'New',
          needs_update: false
        })
      );
    });
  });
});
