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
 * @fileoverview Tests for EntityTranslationsService.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { EntityTranslation } from 'domain/translation/EntityTranslationObjectFactory';
import { EntityTranslationBackendApiService } from 'pages/exploration-editor-page/services/entity-translation-backend-api.service';
import { EntityTranslationsService } from './entity-translations.services';

describe('Entity translations service', () => {
  let entityTranslationsService: EntityTranslationsService;
  let etbs: EntityTranslationBackendApiService;
  let entityTranslation: EntityTranslation;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EntityTranslationsService]
    });
    entityTranslationsService = TestBed.inject(EntityTranslationsService);
    etbs = TestBed.inject(EntityTranslationBackendApiService);

    entityTranslation = EntityTranslation.createFromBackendDict({
      entity_id: 'exp',
      entity_type: 'exploration',
      entity_version: 5,
      language_code: 'fr',
      translations: {
        content: {
          content_format: 'html',
          content_value: '<p>fr content</p>',
          needs_update: false
        },
        hint_0: {
          content_format: 'html',
          content_value: '<p>fr hint</p>',
          needs_update: false
        },
        solution: {
          content_format: 'html',
          content_value: '<p>fr solution</p>',
          needs_update: false
        },
        ca_placeholder_0: {
          content_format: 'unicode',
          content_value: 'fr placeholder',
          needs_update: false
        },
        outcome_1: {
          content_format: 'html',
          content_value: '<p>fr feedback</p>',
          needs_update: false
        },
        default_outcome: {
          content_format: 'html',
          content_value: '<p>fr default outcome</p>',
          needs_update: false
        },
        rule_input_3: {
          content_format: 'set_of_normalized_string',
          content_value: ['fr rule input 1', 'fr rule input 2'],
          needs_update: false
        }
      }
    });
    spyOn(etbs, 'fetchEntityTranslationAsync').and.returnValue(
      Promise.resolve(entityTranslation)
    );
  });

  it('should successfully fetch data from backend api service',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      entityTranslationsService.init('entity1', 'exploration', 5);

      entityTranslationsService.getEntityTranslationsAsync('hi')
        .then(successHandler, failHandler);
      tick();
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should remove fetched translations when reset', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    entityTranslationsService.init('entity1', 'exploration', 5);

    entityTranslationsService.getEntityTranslationsAsync('hi')
      .then(successHandler, failHandler);
    tick();
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();

    expect(
      entityTranslationsService
        .languageCodeToEntityTranslations.hasOwnProperty('hi')
    ).toBeTrue();
    entityTranslationsService.reset();

    expect(
      entityTranslationsService
        .languageCodeToEntityTranslations.hasOwnProperty('hi')
    ).not.toBeTrue();
  }));

  it('should store fetched data and return without calling api service',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      entityTranslationsService.init('entity1', 'exploration', 5);
      entityTranslationsService.languageCodeToEntityTranslations.hi = (
        entityTranslation
      );

      entityTranslationsService.getEntityTranslationsAsync('hi')
        .then(successHandler, failHandler);
      tick();
      flushMicrotasks();

      expect(etbs.fetchEntityTranslationAsync).not.toHaveBeenCalled();
    })
  );

  it('should return correct html for given contentIds', () => {
    entityTranslationsService.languageCodeToEntityTranslations.hi = (
      entityTranslation
    );

    const htmlData = entityTranslationsService.getHtmlTranslations(
      'hi', ['content', 'invalid_content', 'rule_input_3']);

    expect(htmlData).toEqual(['<p>fr content</p>']);
  });

  it('should return empty list for translation not available in language',
    () => {
      entityTranslationsService.languageCodeToEntityTranslations.hi = (
        entityTranslation
      );

      const htmlData = entityTranslationsService.getHtmlTranslations(
        'ar', ['content', 'invalid_content', 'rule_input_3']);

      expect(htmlData).toEqual([]);
    });
});
