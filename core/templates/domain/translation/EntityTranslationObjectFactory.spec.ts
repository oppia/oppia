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
 * @fileoverview Unit tests for EntityTranslation class.
 */
import { EntityTranslation, EntityTranslationBackendDict } from './EntityTranslationObjectFactory';
import { TranslatedContent } from 'domain/exploration/TranslatedContentObjectFactory';

describe('EntityTranslation', () => {
  let entityTranslationBackendDict: EntityTranslationBackendDict;

  beforeEach(() => {
    entityTranslationBackendDict = {
      entity_id: 'entity1',
      entity_type: 'exploration',
      entity_version: 5,
      language_code: 'hi',
      translations: {
        content_1: {
          content_format: 'html',
          content_value: 'Translation',
          needs_update: false
        }
      }
    };
  });

  it('should create a entity translation object from backend dict', () => {
    const entityTranslation = EntityTranslation.createFromBackendDict(
      entityTranslationBackendDict);

    expect(entityTranslation.languageCode).toEqual('hi');
  });

  it('should return null if content id not exist', () => {
    const entityTranslation = EntityTranslation.createFromBackendDict(
      entityTranslationBackendDict);
    expect(entityTranslation.getWrittenTranslation('invalid_id')).toBeNull();
  });

  it('should return correct translation for valid content Id', () => {
    const entityTranslation = EntityTranslation.createFromBackendDict(
      entityTranslationBackendDict);
    const contentTranslation = entityTranslation.getWrittenTranslation(
      'content_1');
    expect(contentTranslation).not.toBeNull();
  });

  it('should do nothing if content id does not exist', () => {
    const entityTranslation = EntityTranslation.createFromBackendDict(
      entityTranslationBackendDict);
    entityTranslation.translationMapping = {};

    entityTranslation.markTranslationAsNeedingUpdate('invalid_id');

    expect(entityTranslation.translationMapping).toEqual(
      {});
  });

  it('should mark translation as needing update', () => {
    const entityTranslation = EntityTranslation.createFromBackendDict(
      entityTranslationBackendDict);

    entityTranslation.markTranslationAsNeedingUpdate('content_1');

    expect(
      entityTranslation.translationMapping.content_1.needsUpdate).toBeTrue();
  });

  it('should remove translation', () => {
    const entityTranslation = EntityTranslation.createFromBackendDict(
      entityTranslationBackendDict);
    expect(
      entityTranslation.translationMapping.hasOwnProperty(
        'content_1')).toBeTrue();

    entityTranslation.removeTranslation('content_1');

    expect(
      entityTranslation.translationMapping.hasOwnProperty(
        'content_1')).toBeFalse();
  });

  it('should update translation', () => {
    const entityTranslation = EntityTranslation.createFromBackendDict(
      entityTranslationBackendDict);
    expect(
      entityTranslation.translationMapping.content_1.toBackendDict()).toEqual(
      entityTranslationBackendDict.translations.content_1);
    const newTranslationDict = {
      content_format: 'unicode',
      content_value: 'NewTranslation',
      needs_update: true
    };

    entityTranslation.updateTranslation(
      'content_1', TranslatedContent.createFromBackendDict(newTranslationDict));

    expect(
      entityTranslation.translationMapping.content_1.toBackendDict()).toEqual(
      newTranslationDict);
  });
});
