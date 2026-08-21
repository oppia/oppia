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

import {HttpErrorResponse} from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';
import {TranslatableTexts} from 'domain/opportunity/translatable-texts.model';
import {
  ImageLocalStorageService,
  ImagesData,
} from 'services/image-local-storage.service';
import {TranslateTextBackendApiService} from './translate-text-backend-api.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {FeatureStatusChecker} from 'domain/feature-flag/feature-status-summary.model';

class MockPlatformFeatureService {
  get status() {
    return {
      EnableTranslationOppsWithNewOppModels: {
        isEnabled: false,
      },
    };
  }
}

describe('TranslateTextBackendApiService', () => {
  let translateTextBackendApiService: TranslateTextBackendApiService;
  let httpTestingController: HttpTestingController;
  let imageLocalStorageService: ImageLocalStorageService;
  let mockPlatformFeatureService: MockPlatformFeatureService;
  const getTranslatableItem = (text: string) => {
    return {
      content_format: 'html',
      content_value: text,
      content_type: 'content',
      interaction_id: null,
      rule_type: null,
    };
  };

  beforeEach(() => {
    mockPlatformFeatureService = new MockPlatformFeatureService();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService,
        },
      ],
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    translateTextBackendApiService = TestBed.inject(
      TranslateTextBackendApiService
    );
    imageLocalStorageService = TestBed.inject(ImageLocalStorageService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('getTranslatableTextsAsync', () => {
    let successHandler: jasmine.Spy<jasmine.Func>;
    let failHandler: (error: HttpErrorResponse) => void;

    it(
      'should correctly request translatable texts for a given exploration ' +
        'id and language code',
      fakeAsync(() => {
        successHandler = jasmine.createSpy('success');
        failHandler = jasmine.createSpy('error');
        const sampleDataResults = {
          state_names_to_content_id_mapping: {
            stateName1: {
              contentId1: getTranslatableItem('text1'),
              contentId2: getTranslatableItem('text2'),
            },
            stateName2: {contentId3: getTranslatableItem('text3')},
          },
          version: '1',
        };
        translateTextBackendApiService
          .getTranslatableTextsAsync('1', 'en')
          .then(successHandler, failHandler);
        const req = httpTestingController.expectOne(
          '/gettranslatabletexthandler?exp_id=1&language_code=en'
        );
        expect(req.request.method).toEqual('GET');
        req.flush(sampleDataResults);
        flushMicrotasks();

        expect(successHandler).toHaveBeenCalledWith(
          TranslatableTexts.createFromBackendDict(sampleDataResults)
        );
      })
    );

    it(
      'should correctly request translatable texts for V2 when ' +
        'feature flag is enabled',
      fakeAsync(() => {
        spyOnProperty(mockPlatformFeatureService, 'status').and.returnValue({
          EnableTranslationOppsWithNewOppModels: {
            isEnabled: true,
          },
        } as unknown as FeatureStatusChecker);

        successHandler = jasmine.createSpy('success');
        failHandler = jasmine.createSpy('error');

        const sampleDataResults = {
          translatable_contents: [
            {
              content_id: 'contentId1',
              content_type: 'content',
              content_format: 'html',
              content_value: 'text1',
            },
          ],
          version: '2',
        };

        translateTextBackendApiService
          .getTranslatableTextsAsync('1', 'en')
          .then(successHandler, failHandler);

        const req = httpTestingController.expectOne(
          '/gettranslatablecontentshandlerv2?entity_id=1&entity_type=exploration&language_code=en'
        );
        expect(req.request.method).toEqual('GET');
        req.flush(sampleDataResults);
        flushMicrotasks();

        expect(successHandler).toHaveBeenCalledWith(
          TranslatableTexts.createFromBackendDictV2(sampleDataResults)
        );
      })
    );

    it('should call the failHandler on error response', fakeAsync(() => {
      const errorEvent = new ErrorEvent('error');
      failHandler = (error: HttpErrorResponse) => {
        expect(error.error).toBe(errorEvent);
      };
      translateTextBackendApiService
        .getTranslatableTextsAsync('1', 'en')
        .then(successHandler, failHandler);
      const req = httpTestingController.expectOne(
        '/gettranslatabletexthandler?exp_id=1&language_code=en'
      );
      expect(req.request.method).toEqual('GET');
      req.error(errorEvent);
      flushMicrotasks();
    }));
  });

  describe('getMachineTranslationAsync', () => {
    let successHandler: jasmine.Spy<jasmine.Func>;
    let failHandler: jasmine.Spy<jasmine.Func>;

    beforeEach(() => {
      successHandler = jasmine.createSpy('success');
      failHandler = jasmine.createSpy('fail');
    });

    it('should POST to /generate-translation with correct body', fakeAsync(() => {
      const mockResponse = {
        translated_text: 'नमस्ते',
        translation_provider: 'gcp',
      };

      translateTextBackendApiService
        .getMachineTranslationAsync('Hello', 'en', 'hi')
        .then(successHandler, failHandler);

      const req = httpTestingController.expectOne('/generate-translation');
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual({
        source_text: 'Hello',
        source_language_code: 'en',
        target_language_code: 'hi',
      });
      req.flush(mockResponse);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(mockResponse);
      expect(failHandler).not.toHaveBeenCalled();
    }));

    it('should return translated_text and translation_provider', fakeAsync(() => {
      const mockResponse = {
        translated_text: '<p>Translated HTML</p>',
        translation_provider: 'azure',
      };

      translateTextBackendApiService
        .getMachineTranslationAsync('<p>Source HTML</p>', 'en', 'es')
        .then(successHandler, failHandler);

      const req = httpTestingController.expectOne('/generate-translation');
      req.flush(mockResponse);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith({
        translated_text: '<p>Translated HTML</p>',
        translation_provider: 'azure',
      });
    }));

    it('should reject with error message on HTTP error', fakeAsync(() => {
      translateTextBackendApiService
        .getMachineTranslationAsync('Hello', 'en', 'hi')
        .then(successHandler, failHandler);

      const req = httpTestingController.expectOne('/generate-translation');
      req.flush(
        {error: 'No active provider configured for hi.'},
        {status: 400, statusText: 'Bad Request'}
      );
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'No active provider configured for hi.'
      );
    }));
  });

  describe('suggestTranslatedTextAsync', () => {
    class MockReaderObject {
      result = 'data:image/png;base64,imageBlob1';
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
      successHandler = jasmine.createSpy('success');
      failHandler = jasmine.createSpy('error');
      imagesData = [
        {
          filename: 'imageFilename',
          imageBlob: new Blob(['imageBlob1'], {type: 'image'}),
        },
      ];
    });

    it('should correctly submit a manual translation suggestion', fakeAsync(() => {
      // This throws "Argument of type 'mockReaderObject' is not assignable to
      // parameter of type 'HTMLImageElement'.". We need to suppress this
      // error because 'HTMLImageElement' has around 250 more properties.
      // We have only defined the properties we need in 'mockReaderObject'.
      spyOn(window, 'FileReader').and.returnValue(new MockReaderObject());
      const expectedPayload = {
        suggestion_type: 'translate_content',
        target_type: 'exploration',
        description: 'Adds translation',
        target_id: 'activeExpId',
        target_version_at_submission: 'activeExpVersion',
        change_cmd: {
          cmd: 'add_written_translation',
          content_id: 'activeContentId',
          state_name: 'activeStateName',
          language_code: 'languageCode',
          content_html: 'contentHtml',
          translation_html: 'translationHtml',
          data_format: 'html',
        },
        files: {
          imageFilename: 'imageBlob1',
        },
      };

      translateTextBackendApiService
        .suggestTranslatedTextAsync(
          'activeExpId',
          'activeExpVersion',
          'activeContentId',
          'activeStateName',
          'languageCode',
          'contentHtml',
          'translationHtml',
          imagesData,
          'html'
        )
        .then(successHandler, failHandler);
      flushMicrotasks();
      const req = httpTestingController.expectOne('/suggestionhandler/');
      expect(req.request.method).toEqual('POST');
      expect(req.request.body.getAll('payload')[0]).toEqual(
        JSON.stringify(expectedPayload)
      );
      req.flush({});
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
    }));

    it(
      'should include auto-generation metadata in change_cmd when ' +
        'wasAutoGenerated is true',
      fakeAsync(() => {
        spyOn(
          imageLocalStorageService,
          'getFilenameToBase64MappingAsync'
        ).and.returnValue(Promise.resolve({}));

        translateTextBackendApiService
          .suggestTranslatedTextAsync(
            'expId',
            'expVersion',
            'contentId',
            'stateName',
            'hi',
            'Hello',
            'नमस्ते',
            [],
            'html',
            /* wasAutoGenerated= */ true,
            /* autoGenerationProvider= */ 'gcp',
            /* wasEdited= */ false
          )
          .then(successHandler, failHandler);
        flushMicrotasks();

        const req = httpTestingController.expectOne('/suggestionhandler/');
        const payload = JSON.parse(req.request.body.getAll('payload')[0]);
        expect(payload.change_cmd.was_auto_generated).toBeTrue();
        expect(payload.change_cmd.auto_generation_provider).toBe('gcp');
        expect(payload.change_cmd.was_edited).toBeFalse();
        req.flush({});
        flushMicrotasks();

        expect(successHandler).toHaveBeenCalled();
      })
    );

    it(
      'should include was_edited=true when contributor edited the ' +
        'AI suggestion before submission',
      fakeAsync(() => {
        spyOn(
          imageLocalStorageService,
          'getFilenameToBase64MappingAsync'
        ).and.returnValue(Promise.resolve({}));

        translateTextBackendApiService
          .suggestTranslatedTextAsync(
            'expId',
            'expVersion',
            'contentId',
            'stateName',
            'hi',
            'Hello',
            'नमस्ते (edited)',
            [],
            'html',
            /* wasAutoGenerated= */ true,
            /* autoGenerationProvider= */ 'gcp',
            /* wasEdited= */ true
          )
          .then(successHandler, failHandler);
        flushMicrotasks();

        const req = httpTestingController.expectOne('/suggestionhandler/');
        const payload = JSON.parse(req.request.body.getAll('payload')[0]);
        expect(payload.change_cmd.was_auto_generated).toBeTrue();
        expect(payload.change_cmd.was_edited).toBeTrue();
        req.flush({});
        flushMicrotasks();

        expect(successHandler).toHaveBeenCalled();
      })
    );

    it(
      'should NOT include auto-generation metadata when wasAutoGenerated ' +
        'is false (manual translation)',
      fakeAsync(() => {
        spyOn(
          imageLocalStorageService,
          'getFilenameToBase64MappingAsync'
        ).and.returnValue(Promise.resolve({}));

        translateTextBackendApiService
          .suggestTranslatedTextAsync(
            'expId',
            'expVersion',
            'contentId',
            'stateName',
            'hi',
            'Hello',
            'नमस्ते',
            [],
            'html'
            // wasAutoGenerated defaults to false
          )
          .then(successHandler, failHandler);
        flushMicrotasks();

        const req = httpTestingController.expectOne('/suggestionhandler/');
        const payload = JSON.parse(req.request.body.getAll('payload')[0]);
        // Metadata fields must be absent for manual suggestions.
        expect(payload.change_cmd.was_auto_generated).toBeUndefined();
        expect(payload.change_cmd.auto_generation_provider).toBeUndefined();
        expect(payload.change_cmd.was_edited).toBeUndefined();
        req.flush({});
        flushMicrotasks();

        expect(successHandler).toHaveBeenCalled();
      })
    );

    it('should append image data to form data', fakeAsync(() => {
      spyOn(
        imageLocalStorageService,
        'getFilenameToBase64MappingAsync'
      ).and.returnValue(
        Promise.resolve({
          file1: 'imgBase64',
        })
      );
      translateTextBackendApiService
        .suggestTranslatedTextAsync(
          'activeExpId',
          'activeExpVersion',
          'activeContentId',
          'activeStateName',
          'languageCode',
          'contentHtml',
          'translationHtml',
          imagesData,
          'html'
        )
        .then(successHandler, failHandler);
      flushMicrotasks();
      const req = httpTestingController.expectOne('/suggestionhandler/');
      const files = JSON.parse(req.request.body.getAll('payload')[0]).files;
      expect(req.request.method).toEqual('POST');
      expect(files.file1).toContain('imgBase64');
      req.flush({});
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
    }));

    it('should handle multiple image blobs per filename', fakeAsync(() => {
      imagesData = [
        {
          filename: 'imageFilename1',
          imageBlob: {
            size: 0,
            type: 'imageBlob1',
          } as Blob,
        },
        {
          filename: 'imageFilename2',
          imageBlob: {
            size: 0,
            type: 'imageBlob2',
          } as Blob,
        },
      ];
      spyOn(
        imageLocalStorageService,
        'getFilenameToBase64MappingAsync'
      ).and.returnValue(
        Promise.resolve({
          imageFilename1: 'img1Base64',
          imageFilename2: 'img2Base64',
        })
      );
      translateTextBackendApiService
        .suggestTranslatedTextAsync(
          'activeExpId',
          'activeExpVersion',
          'activeContentId',
          'activeStateName',
          'languageCode',
          'contentHtml',
          'translationHtml',
          imagesData,
          'html'
        )
        .then(successHandler, failHandler);
      flushMicrotasks();
      const req = httpTestingController.expectOne('/suggestionhandler/');
      expect(req.request.method).toEqual('POST');
      const files = JSON.parse(req.request.body.getAll('payload')[0]).files;
      expect(files.imageFilename1).toContain('img1Base64');
      expect(files.imageFilename2).toContain('img2Base64');
      req.flush({});
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
    }));

    it('should call the failhandler on error response', fakeAsync(() => {
      const errorEvent = new ErrorEvent('error');
      failHandler = (error: HttpErrorResponse) => {
        expect(error.error).toBe(errorEvent);
      };
      spyOn(
        imageLocalStorageService,
        'getFilenameToBase64MappingAsync'
      ).and.returnValue(Promise.resolve({}));
      translateTextBackendApiService
        .suggestTranslatedTextAsync(
          'activeExpId',
          'activeExpVersion',
          'activeContentId',
          'activeStateName',
          'languageCode',
          'contentHtml',
          'translationHtml',
          imagesData,
          'html'
        )
        .then(successHandler, failHandler);
      flushMicrotasks();
      const req = httpTestingController.expectOne('/suggestionhandler/');
      expect(req.request.method).toEqual('POST');
      req.error(errorEvent);
      flushMicrotasks();
    }));

    it(
      'should throw error if Image Data is not present in' + ' local Storage',
      async () => {
        imagesData = [
          {
            filename: 'imageFilename1',
            imageBlob: null,
          },
        ];

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
            'html'
          )
        ).toBeRejectedWithError('No image data found');
      }
    );

    it('should throw error if prefix is invalid', async () => {
      imagesData = [
        {
          filename: 'imageFilename1',
          imageBlob: new Blob(['data:random/xyz;base64,Blob1'], {
            type: 'image',
          }),
        },
      ];
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
          'html'
        )
      ).toBeRejectedWithError('No valid prefix found in data url');
    });
  });
});
