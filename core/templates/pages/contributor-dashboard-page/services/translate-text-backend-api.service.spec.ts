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
 * @fileoverview Tests that translatable text backend api works correctly.
 */

import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { TranslatableTexts } from 'domain/opportunity/translatable-texts.model';
import { TranslateTextBackendApiService } from './translate-text-backend-api.service';

describe('TranslateTextBackendApiService', () => {
  let translateTextBackendApiService: TranslateTextBackendApiService;
  let httpTestingController: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    translateTextBackendApiService = TestBed.inject(
      TranslateTextBackendApiService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('getTranslatableTextsAsync', () => {
    let successHandler, failHandler;
    it('should correctly request translatable texts for a given exploration ' +
    'id and language code', fakeAsync(() => {
      successHandler = jasmine.createSpy('success');
      failHandler = jasmine.createSpy('error');
      const sampleDataResults = {
        state_names_to_content_id_mapping: {
          stateName1: {contentId1: 'text1', contentId2: 'text2'},
          stateName2: {contentId3: 'text3'}
        },
        version: '1'
      };
      translateTextBackendApiService.getTranslatableTextsAsync('1', 'en').then(
        successHandler, failHandler
      );
      const req = httpTestingController.expectOne(
        '/gettranslatabletexthandler?exp_id=1&language_code=en');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(
        TranslatableTexts.createFromBackendDict(sampleDataResults));
    }));

    it('should call the failHandler on error response', fakeAsync(() => {
      const errorEvent = new ErrorEvent('error');
      failHandler = (error: HttpErrorResponse) => {
        expect(error.error).toBe(errorEvent);
      };
      translateTextBackendApiService.getTranslatableTextsAsync('1', 'en').then(
        successHandler, failHandler
      );
      const req = httpTestingController.expectOne(
        '/gettranslatabletexthandler?exp_id=1&language_code=en');
      expect(req.request.method).toEqual('GET');
      req.error(errorEvent);
      flushMicrotasks();
    }));
  });

  describe('suggestTranslatedTextAsync', () => {
    let successHandler, failHandler, imagesData;
    beforeEach(() => {
      successHandler = jasmine.createSpy('success');
      failHandler = jasmine.createSpy('error');
      imagesData = [{
        filename: 'imageFilename',
        imageBlob: 'imageBlob'
      }];
    });

    it('should correctly submit a translation suggestion', fakeAsync(() => {
      const expectedPayload = {
        suggestion_type: 'translate_content',
        target_type: 'exploration',
        description: 'Adds translation',
        target_id: 'activeExpId',
        target_version_at_submission: 'activeExpVersion',
        change: {
          cmd: 'add_written_translation',
          content_id: 'activeContentId',
          state_name: 'activeStateName',
          language_code: 'languageCode',
          content_html: 'contentHtml',
          translation_html: 'translationHtml',
          data_format: 'html'
        }
      };

      translateTextBackendApiService.suggestTranslatedTextAsync(
        'activeExpId',
        'activeExpVersion',
        'activeContentId',
        'activeStateName',
        'languageCode',
        'contentHtml',
        'translationHtml',
        imagesData).then(successHandler, failHandler);
      const req = httpTestingController.expectOne(
        '/suggestionhandler/');
      expect(req.request.method).toEqual('POST');
      expect(req.request.body.getAll('payload')[0]).toEqual(
        JSON.stringify(expectedPayload));
      req.flush({});
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
    }));

    it('should append image data to form data', fakeAsync(() => {
      translateTextBackendApiService.suggestTranslatedTextAsync(
        'activeExpId',
        'activeExpVersion',
        'activeContentId',
        'activeStateName',
        'languageCode',
        'contentHtml',
        'translationHtml',
        imagesData).then(successHandler, failHandler);
      const req = httpTestingController.expectOne(
        '/suggestionhandler/');
      expect(req.request.method).toEqual('POST');
      expect(req.request.body.getAll('imageFilename')[0]).toEqual('imageBlob');
      req.flush({});
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
    }));
    it('should handle multiple image blobs per filename', fakeAsync(() => {
      imagesData = [{
        filename: 'imageFilename1',
        imageBlob: 'imageBlob1'
      }, {
        filename: 'imageFilename1',
        imageBlob: 'imageBlob2'
      }, {
        filename: 'imageFilename2',
        imageBlob: 'imageBlob1'
      }, {
        filename: 'imageFilename2',
        imageBlob: 'imageBlob2'
      }];
      translateTextBackendApiService.suggestTranslatedTextAsync(
        'activeExpId',
        'activeExpVersion',
        'activeContentId',
        'activeStateName',
        'languageCode',
        'contentHtml',
        'translationHtml',
        imagesData).then(successHandler, failHandler);
      const req = httpTestingController.expectOne(
        '/suggestionhandler/');
      expect(req.request.method).toEqual('POST');
      const filename1Blobs = req.request.body.getAll('imageFilename1');
      const filename2Blobs = req.request.body.getAll('imageFilename2');
      expect(filename1Blobs).toContain('imageBlob1');
      expect(filename1Blobs).toContain('imageBlob2');
      expect(filename2Blobs).toContain('imageBlob1');
      expect(filename2Blobs).toContain('imageBlob2');
      req.flush({});
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
    }));

    it('should call the failhandler on error response', fakeAsync(() => {
      const errorEvent = new ErrorEvent('error');
      failHandler = (error: HttpErrorResponse) => {
        expect(error.error).toBe(errorEvent);
      };

      translateTextBackendApiService.suggestTranslatedTextAsync(
        'activeExpId',
        'activeExpVersion',
        'activeContentId',
        'activeStateName',
        'languageCode',
        'contentHtml',
        'translationHtml',
        imagesData).then(successHandler, failHandler);
      const req = httpTestingController.expectOne(
        '/suggestionhandler/');
      expect(req.request.method).toEqual('POST');
      req.error(errorEvent);
      flushMicrotasks();
    }));
  });
});
