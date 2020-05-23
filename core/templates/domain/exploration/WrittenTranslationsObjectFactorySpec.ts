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
import { TestBed } from '@angular/core/testing';

import { WrittenTranslationsObjectFactory } from
  'domain/exploration/WrittenTranslationsObjectFactory';
import { WrittenTranslationObjectFactory } from
  'domain/exploration/WrittenTranslationObjectFactory';

describe('Written Translations Object Factory', () => {
  beforeEach(() => {
    this.writtenTranslationsObjectFactory = TestBed.get(
      WrittenTranslationsObjectFactory);
    this.writtenTranslationObjectFactory = TestBed.get(
      WrittenTranslationObjectFactory);

    this.writtenTranslationsBackendDict = (
      this.writtenTranslationsObjectFactory.createFromBackendDict({
        translations_mapping: {
          content_1: {
            'hi-en': {
              html: '',
              needs_update: false
            }
          }
        }
      }));
  });

  it('should create a written translations object from backend dict', () => {
    expect(this.writtenTranslationsBackendDict.toBackendDict())
      .toEqual({
        translations_mapping: {
          content_1: {
            'hi-en': {
              html: '',
              needs_update: false
            }
          }
        }
      });
  });

  it('should create an empty written translations object', () => {
    const emptyWrittenTranslationsObject = (
      this.writtenTranslationsObjectFactory.createEmpty());
    expect(emptyWrittenTranslationsObject.getAllContentId()).toEqual([]);
  });

  it('should add and delete contents from a written translations object',
    () => {
      expect(this.writtenTranslationsBackendDict.getAllContentId()).toEqual([
        'content_1']);
      this.writtenTranslationsBackendDict.addContentId('content_2');
      expect(this.writtenTranslationsBackendDict.getAllContentId()).toEqual([
        'content_1', 'content_2']);
      expect(() => {
        this.writtenTranslationsBackendDict.addContentId('content_2');
      }).toThrowError('Trying to add duplicate content id.');
      expect(this.writtenTranslationsBackendDict.getAllContentId()).toEqual([
        'content_1', 'content_2']);

      this.writtenTranslationsBackendDict.deleteContentId('content_2');
      expect(this.writtenTranslationsBackendDict.getAllContentId()).toEqual([
        'content_1']);
      expect(() => {
        this.writtenTranslationsBackendDict.deleteContentId('content_2');
      }).toThrowError('Unable to find the given content id.');
      expect(this.writtenTranslationsBackendDict.getAllContentId()).toEqual([
        'content_1']);
    });

  it('should add translation in a written translations object', () => {
    expect(() => {
      this.writtenTranslationsBackendDict.addWrittenTranslation(
        'content_1', 'hi-en', 'This is a HTML text');
    }).toThrowError('Trying to add duplicate language code.');

    this.writtenTranslationsBackendDict.addWrittenTranslation(
      'content_1', 'en', 'English HTML');
    expect(this.writtenTranslationsBackendDict
      .getTranslationsLanguageCodes('content_1')).toEqual(['hi-en', 'en']);
  });

  it('should update the html language code of a written translations object',
    () => {
      this.writtenTranslationsBackendDict = (
        this.writtenTranslationsObjectFactory.createFromBackendDict({
          translations_mapping: {
            content_1: {
              'hi-en': {
                html: '<p>This is the old HTML</p>',
                needs_update: false
              }
            }
          }
        }));

      expect(this.writtenTranslationsBackendDict.hasWrittenTranslation(
        'content_1', 'hi-en')).toBe(true);
      this.writtenTranslationsBackendDict.updateWrittenTranslationHtml(
        'content_1', 'hi-en', '<p>This is the new HTML</p>');
      expect(this.writtenTranslationsBackendDict.getWrittenTranslation(
        'content_1', 'hi-en')).toEqual(
        this.writtenTranslationObjectFactory.createFromBackendDict({
          html: '<p>This is the new HTML</p>',
          needs_update: false
        }));

      expect(() => {
        this.writtenTranslationsBackendDict.updateWrittenTranslationHtml(
          'content_1', 'en', 'This is the new HTML');
      }).toThrowError('Unable to find the given language code.');
      expect(this.writtenTranslationsBackendDict.hasWrittenTranslation('en'))
        .toBe(false);
    });

  it('should toggle needs_update for a language code', () => {
    this.writtenTranslationsBackendDict.toggleNeedsUpdateAttribute(
      'content_1', 'hi-en');
    expect(this.writtenTranslationsBackendDict.getWrittenTranslation(
      'content_1', 'hi-en')).toEqual(
      this.writtenTranslationObjectFactory.createFromBackendDict({
        html: '',
        needs_update: true
      }));
    expect(this.writtenTranslationsBackendDict.hasUnflaggedWrittenTranslations(
      'content_1')).toBe(false);

    this.writtenTranslationsBackendDict.toggleNeedsUpdateAttribute(
      'content_1', 'hi-en');
    expect(this.writtenTranslationsBackendDict.getWrittenTranslation(
      'content_1', 'hi-en')).toEqual(
      this.writtenTranslationObjectFactory.createFromBackendDict({
        html: '',
        needs_update: false
      }));
    expect(this.writtenTranslationsBackendDict.hasUnflaggedWrittenTranslations(
      'content_1')).toBe(true);
  });

  it('should set needs_update to true in all translations from a content',
    () => {
      this.writtenTranslationsBackendDict = (
        this.writtenTranslationsObjectFactory.createFromBackendDict({
          translations_mapping: {
            content_1: {
              'hi-en': {
                html: 'This is the old HTML',
                needs_update: false
              },
              en: {
                html: '',
                needs_update: false
              }
            }
          }
        }));

      this.writtenTranslationsBackendDict.markAllTranslationsAsNeedingUpdate(
        'content_1');
      expect(this.writtenTranslationsBackendDict.getWrittenTranslation(
        'content_1', 'hi-en')).toEqual(
        this.writtenTranslationObjectFactory.createFromBackendDict({
          html: 'This is the old HTML',
          needs_update: true
        }));
      expect(this.writtenTranslationsBackendDict.getWrittenTranslation(
        'content_1', 'en')).toEqual(
        this.writtenTranslationObjectFactory.createFromBackendDict({
          html: '',
          needs_update: true
        }));
      expect(this.writtenTranslationsBackendDict.hasUnflaggedWrittenTranslations(
        'content_1')).toBe(false);
    });
});
