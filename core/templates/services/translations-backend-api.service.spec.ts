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
 * @fileoverview Unit tests for TranslationsBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { TranslationsBackendApiService } from
  'services/translations-backend-api.service';

describe('Translations backend API service', () => {
  let httpTestingController: HttpTestingController;
  let translationsBackendApiService: TranslationsBackendApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    httpTestingController = TestBed.get(HttpTestingController);
    translationsBackendApiService = TestBed.get(TranslationsBackendApiService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should correctly fetch translations.', fakeAsync(() => {
    const translations = {
      I18N_T_1: 'Hello'
    };

    translationsBackendApiService.fetchTranslations('en').then(response => {
      expect(response).toEqual(translations);
    });

    let req = httpTestingController.expectOne('/assets/i18n/en.json');
    expect(req.request.method).toEqual('GET');
    req.flush(translations);

    flushMicrotasks();
  }));
});
