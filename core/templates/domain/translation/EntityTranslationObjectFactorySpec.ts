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
    let entityTranslation = EntityTranslation.createFromBackendDict(
      entityTranslationBackendDict);

    expect(entityTranslation.languageCode).toEqual('hi');
  });

  it('should return null if content id not exist', () => {
    let entityTranslation = EntityTranslation.createFromBackendDict(
      entityTranslationBackendDict);
    expect(entityTranslation.getWrittenTranslation('invalid_id')).toBeNull();
  });

  it('should return correct translation for valid content Id', () => {
    let entityTranslation = EntityTranslation.createFromBackendDict(
      entityTranslationBackendDict);
    let contentTranslation = entityTranslation.getWrittenTranslation(
      'content_1');
    expect(contentTranslation).not.toBeNull();
  });
});
