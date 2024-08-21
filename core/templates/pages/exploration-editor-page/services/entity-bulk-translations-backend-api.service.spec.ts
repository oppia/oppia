// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for EntityBulkTranslationsBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {fakeAsync, flushMicrotasks, TestBed, tick} from '@angular/core/testing';
import {EntityBulkTranslationsBackendApiService} from './entity-bulk-translations-backend-api.service';

describe('Entity Bulk Translations Backend Api Service', () => {
  let translationApiService: EntityBulkTranslationsBackendApiService;
  let httpTestingController: HttpTestingController;
  let successHandler = jasmine.createSpy('success');
  let failHandler = jasmine.createSpy('fail');

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    translationApiService = TestBed.inject(
      EntityBulkTranslationsBackendApiService
    );
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch entity translations in bulk', fakeAsync(() => {
    let entityId: string = 'entity1';
    let entityType: string = 'exploration';
    let entityVersion: number = 5;
    translationApiService
      .fetchEntityBulkTranslationsAsync(entityId, entityType, entityVersion)
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/entity_translations_bulk_handler/exploration/entity1/5'
    );
    expect(req.request.method).toEqual('GET');
    req.flush(
      {
        hi: {
          entity_id: 'entity1',
          entity_type: 'exploration',
          entity_version: 5,
          language_code: 'hi',
          translations: {
            feedback_3: {
              content_format: 'html',
              content_value: '<p>This is feedback 1.</p>',
              needs_update: false,
            },
          },
        },
      },
      {
        status: 200,
        statusText: 'Success.',
      }
    );
    tick();
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
  }));

  it('should handle backend failure', fakeAsync(() => {
    let entityId: string = 'entity1';
    let entityType: string = 'exploration';
    let entityVersion: number = 5;
    translationApiService
      .fetchEntityBulkTranslationsAsync(entityId, entityType, entityVersion)
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/entity_translations_bulk_handler/exploration/entity1/5'
    );
    expect(req.request.method).toEqual('GET');
    req.flush(
      {
        error: 'Some error occurred in the backend.',
      },
      {
        status: 500,
        statusText: 'Internal Server Error',
      }
    );

    flushMicrotasks();

    expect(failHandler).toHaveBeenCalledWith(
      'Some error occurred in the backend.'
    );
  }));
});
