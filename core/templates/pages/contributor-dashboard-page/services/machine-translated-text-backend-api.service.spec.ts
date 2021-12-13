// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for MachineTranslatedTextBackendApiService.
*/

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';

import { TranslatableItem } from 'domain/opportunity/translatable-content.model';
import { MachineTranslatedTextBackendApiService, MachineTranslatedTextBackendDict } from './machine-translated-text-backend-api.service';

describe('Machine Translated Texts Backend Api Service', () => {
  let machineTranslatedTextBackendApiService:
    MachineTranslatedTextBackendApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    httpTestingController = TestBed.inject(HttpTestingController);
    machineTranslatedTextBackendApiService = TestBed.inject(
      MachineTranslatedTextBackendApiService);
  });

  describe('getMachineTranslatedStateTextsAsync', () => {
    const sampleTranslationResponse: MachineTranslatedTextBackendDict = {
      translated_texts: {item1: new TranslatableItem(
        'texto para traducir', 'html', 'content', null, null)}
    };

    it('should return a machine generated translation', fakeAsync(() => {
      machineTranslatedTextBackendApiService
        .getMachineTranslatedStateTextsAsync(
          '0', 'Introduction', ['content1'], 'es').then((response) => {
          expect(response.item1.content).toEqual('texto para traducir');
        });
      const req = httpTestingController.expectOne(
        '/machine_translated_state_texts_handler?exp_id=0&state_name=Introduc' +
        'tion&content_ids=%5B%22content1%22%5D&target_language_code=es');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleTranslationResponse);
      flushMicrotasks();
    }));
  });
});