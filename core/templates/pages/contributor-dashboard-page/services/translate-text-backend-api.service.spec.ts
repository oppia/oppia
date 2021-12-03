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
import { ImagesData } from 'services/image-local-storage.service';
import { TranslateTextBackendApiService } from './translate-text-backend-api.service';

describe('TranslateTextBackendApiService', () => {
  let translateTextBackendApiService: TranslateTextBackendApiService;
  let httpTestingController: HttpTestingController;
  const getTranslatableItem = (text: string) => {
    return {
      data_format: 'html',
      content: text,
      content_type: 'content',
      interaction_id: null,
      rule_type: null
    };
  };

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
    let successHandler: jasmine.Spy<jasmine.Func>;
    let failHandler: (error: HttpErrorResponse) => void;

    it('should correctly request translatable texts for a given exploration ' +
    'id and language code', fakeAsync(() => {
      successHandler = jasmine.createSpy('success');
      failHandler = jasmine.createSpy('error');
      const sampleDataResults = {
        state_names_to_content_id_mapping: {
          stateName1: {
            contentId1: getTranslatableItem('text1'),
            contentId2: getTranslatableItem('text2')
          },
          stateName2: {contentId3: getTranslatableItem('text3')}
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
    class MockReaderObject {
    result = 'imageBlob1';
    onload: () => string;
    constructor() {
      this.onload = () => {
        return 'Fake onload executed';
      };
    }
    readAsDataURL(file: Blob) {
      this.onload();
      return 'The file is loaded';
    }
    }
    let successHandler: jasmine.Spy<jasmine.Func>;
    let failHandler: (error: HttpErrorResponse) => void;
    let imagesData: ImagesData[];
    beforeEach(() => {
    // This throws "Argument of type 'mockReaderObject' is not assignable to
    // parameter of type 'HTMLImageElement'.". We need to suppress this
    // error because 'HTMLImageElement' has around 250 more properties.
    // We have only defined the properties we need in 'mockReaderObject'.
    // @ts-expect-error
      spyOn(window, 'FileReader').and.returnValue(new MockReaderObject());
      successHandler = jasmine.createSpy('success');
      failHandler = jasmine.createSpy('error');
      imagesData = [{
        filename: 'imageFilename',
        imageBlob: new Blob(['imageBlob1'], {type: 'image'})
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
        },
        files: {
          imageFilename: 'imageBlob1'
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
        imagesData,
        'html').then(successHandler, failHandler);
      flushMicrotasks();
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
      spyOn(translateTextBackendApiService, 'blobtoBase64').and.returnValue(
        Promise.resolve('imageBlob'));
      translateTextBackendApiService.suggestTranslatedTextAsync(
        'activeExpId',
        'activeExpVersion',
        'activeContentId',
        'activeStateName',
        'languageCode',
        'contentHtml',
        'translationHtml',
        imagesData,
        'html').then(successHandler, failHandler);
      flushMicrotasks();
      const req = httpTestingController.expectOne(
        '/suggestionhandler/');
      const files = JSON.parse(req.request.body.getAll('payload')[0]).files;
      const images = Object.values(files);
      expect(req.request.method).toEqual('POST');
      expect(images).toContain('imageBlob');
      req.flush({});
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
    }));
    it('should handle multiple image blobs per filename', fakeAsync(() => {
      imagesData = [{
        filename: 'imageFilename1',
        imageBlob: {
          size: 0,
          type: 'imageBlob1'
        } as Blob
      }, {
        filename: 'imageFilename1',
        imageBlob: {
          size: 0,
          type: 'imageBlob2'
        } as Blob
      }, {
        filename: 'imageFilename2',
        imageBlob: {
          size: 0,
          type: 'imageBlob1'
        } as Blob
      }, {
        filename: 'imageFilename2',
        imageBlob: {
          size: 0,
          type: 'imageBlob2'
        } as Blob
      }];
      spyOn(translateTextBackendApiService, 'blobtoBase64').and.returnValue(
        Promise.resolve(['imageBlob1', 'imageBlob2'])
      );
      translateTextBackendApiService.suggestTranslatedTextAsync(
        'activeExpId',
        'activeExpVersion',
        'activeContentId',
        'activeStateName',
        'languageCode',
        'contentHtml',
        'translationHtml',
        imagesData,
        'html').then(successHandler, failHandler);
      flushMicrotasks();
      const req = httpTestingController.expectOne(
        '/suggestionhandler/');
      expect(req.request.method).toEqual('POST');
      const files = JSON.parse(req.request.body.getAll('payload')[0]).files;
      const filename1Blobs = files.imageFilename1[0];
      const filename2Blobs = files.imageFilename2[0];
      const filename3Blobs = files.imageFilename1[1];
      const filename4Blobs = files.imageFilename2[1];
      expect(filename1Blobs).toContain('imageBlob1');
      expect(filename2Blobs).toContain('imageBlob1');
      expect(filename3Blobs).toContain('imageBlob2');
      expect(filename4Blobs).toContain('imageBlob2');
      req.flush({});
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
    }));


    it('should call the failhandler on error response', fakeAsync(() => {
      const errorEvent = new ErrorEvent('error');
      failHandler = (error: HttpErrorResponse) => {
        expect(error.error).toBe(errorEvent);
      };
      spyOn(translateTextBackendApiService, 'blobtoBase64').and.returnValue(
        Promise.resolve('imageBlob'));
      translateTextBackendApiService.suggestTranslatedTextAsync(
        'activeExpId',
        'activeExpVersion',
        'activeContentId',
        'activeStateName',
        'languageCode',
        'contentHtml',
        'translationHtml',
        imagesData,
        'html').then(successHandler, failHandler);
      flushMicrotasks();
      const req = httpTestingController.expectOne(
        '/suggestionhandler/');
      expect(req.request.method).toEqual('POST');
      req.error(errorEvent);
      flushMicrotasks();
    }));

    it('should throw error if Image Data is not present in' +
       ' local Storage', async() => {
      imagesData = [{
        filename: 'imageFilename1',
        imageBlob: null
      }];

      await expectAsync(
        translateTextBackendApiService.suggestTranslatedTextAsync(
          'activeExpId',
          'activeExpVersion',
          'activeContentId',
          'activeStateName',
          'languageCode',
          'contentHtml',
          'translationHtml',
          imagesData,
          'html')
      ).toBeRejectedWithError('No image data found');
    });
  });
});
