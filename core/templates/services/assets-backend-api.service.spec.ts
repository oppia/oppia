// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for AssetsBackendApiService
 */

import { AudioFile } from
  'domain/utilities/AudioFileObjectFactory';
import { ImageFile } from
  'domain/utilities/ImageFileObjectFactory';
import { AssetsBackendApiService } from
  'services/assets-backend-api.service';
import { AppConstants } from 'app.constants';
import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from
  '@angular/core/testing';

// Jquery is needed in this file because some tests will spyOn Jquery methods.
// The spies won't actually spy Jquery methods without the import.
import $ from 'jquery';

require('domain/utilities/url-interpolation.service.ts');
require('services/assets-backend-api.service.ts');
require('services/csrf-token.service.ts');
const Constants = require('constants.ts');

interface ErrorResponseType {
  errorMessage: string;
}

fdescribe('Assets Backend API Service', () => {
  describe('on dev mode', () => {
    let serviceInstance = null;
    let httpTestingController = null;
    let audioRequestUrl = null;
    let imageRequestUrl = null;
    const EXAMPLE_AUDIO = new Blob(['audio data'], {type: 'audiotype'});
    const EXAMPLE_IMAGE = new Blob(['image data'], {type: 'imagetype'});

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
      });
      httpTestingController = TestBed.get(HttpTestingController);
      serviceInstance = TestBed.get(AssetsBackendApiService);
      audioRequestUrl = serviceInstance.urlInterpolationService.interpolateUrl(
        '/assetsdevhandler/exploration/<exploration_id>/assets/audio/' +
        '<filename>',
        {
          exploration_id: '0',
          filename: 'myfile.mp3'
        });

      imageRequestUrl = serviceInstance.urlInterpolationService.interpolateUrl(
        '/assetsdevhandler/exploration/<exploration_id>/assets/image/' +
        '<filename>',
        {
          exploration_id: '0',
          filename: 'myfile.png'
        });
    });

    afterEach(() => {
      httpTestingController.verify();
    });

    it('should correctly formulate the download URL for audio', () => {
      expect(
        serviceInstance.getAudioDownloadUrl(
          AppConstants.ENTITY_TYPE.EXPLORATION, 'expid12345', 'a.mp3')
      ).toEqual('/assetsdevhandler/exploration/expid12345/assets/audio/a.mp3');
    });

    it('should correctly formulate the preview URL for images', () => {
      expect(
        serviceInstance.getImageUrlForPreview(
          AppConstants.ENTITY_TYPE.EXPLORATION, 'expid12345', 'a.png')
      ).toEqual('/assetsdevhandler/exploration/expid12345/assets/image/a.png');
    });

    it('should correctly formulate the thumbnail url for preview', () => {
      expect(
        serviceInstance.getThumbnailUrlForPreview(
          AppConstants.ENTITY_TYPE.EXPLORATION, 'expid12345', 'thumbnail.png')
      ).toEqual(
        '/assetsdevhandler/exploration/expid12345/assets/' +
        'thumbnail/thumbnail.png');
    });

    it('should successfully fetch and cache audio', fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      expect(serviceInstance.isCached('myfile.mp3')).toBe(false);


      serviceInstance.loadAudio('0', 'myfile.mp3').then(
        successHandler, failHandler);
      const req = httpTestingController.expectOne(audioRequestUrl);
      expect(req.request.method).toEqual('GET');
      expect((serviceInstance.getAssetsFilesCurrentlyBeingRequested())
        .audio.length).toBe(1);
      req.flush(EXAMPLE_AUDIO);
      flushMicrotasks();
      expect((serviceInstance.getAssetsFilesCurrentlyBeingRequested())
        .audio.length).toBe(0);
      expect(serviceInstance.isCached('myfile.mp3')).toBe(true);
      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

    it('should not fetch an audio if it is already cached', fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      expect(serviceInstance.isCached('myfile.mp3')).toBe(false);
      serviceInstance.loadAudio('0', 'myfile.mp3').then(
        successHandler, failHandler);
      const req = httpTestingController.expectOne(audioRequestUrl);
      expect(req.request.method).toEqual('GET');
      req.flush(EXAMPLE_AUDIO);
      flushMicrotasks();
      expect(serviceInstance.isCached('myfile.mp3')).toBe(true);

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();

      serviceInstance.loadAudio('0', 'myfile.mp3').then(
        (cachedFile: AudioFile) => {
          expect(cachedFile).toEqual(
            serviceInstance.audioFileObjectFactory.createNew(
              'myfile.mp3',
              EXAMPLE_AUDIO
            )
          );
        });
    }));

    it('should handler rejection when fetching a file fails', fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      expect(serviceInstance.isCached('myfile.mp3')).toBe(false);

      serviceInstance.loadAudio('0', 'myfile.mp3').then(
        successHandler, failHandler);
      const req = httpTestingController.expectOne(audioRequestUrl);
      expect(req.request.method).toEqual('GET');
      req.error();
      flushMicrotasks();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('myfile.mp3');
      expect(serviceInstance.isCached('myfile.mp3')).toBe(false);
    }));

    it('should successfully save an audio', () => {
      const successMessage = 'Audio was successfully saved.';
      serviceInstance.csrfTokenService.initializeToken();
      // @ts-ignore in order to ignore JQuery properties that should
      // be declarated.
      spyOn($, 'ajax').and.callFake(() => {
        const d = $.Deferred();
        d.resolve(successMessage);
        return d.promise();
      });

      serviceInstance.saveAudio('0', 'a.mp3', new File([], 'a.mp3'))
        .then((response: string) => {
          expect(response).toBe(successMessage);
        });
    });

    it('should handle rejection when saving a file fails', () => {
      const errorMessage = 'Error on saving audio';
      serviceInstance.csrfTokenService.initializeToken();
      // @ts-ignore in order to ignore JQuery properties that should
      // be declarated.
      spyOn($, 'ajax').and.callFake(() => {
        const d = $.Deferred();
        d.reject({
          // The responseText contains a XSSI Prefix, which is represented by
          // )]}' string. That's why double quotes is being used here. It's not
          // possible to use \' instead of ' so the XSSI Prefix won't be
          // evaluated correctly.
          /* eslint-disable quotes */
          responseText: ")]}'\n{ \"message\": \"" + errorMessage + "\" }"
          /* eslint-enable quotes */
        });
        return d.promise();
      });

      serviceInstance.saveAudio('0', 'a.mp3', new File([], 'a.mp3'))
        .then((response: ErrorResponseType) => {
          expect(response).toEqual({
            message: errorMessage
          });
        });
    });

    it('should successfully fetch and cache image', fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      expect(serviceInstance.isCached('myfile.png')).toBe(false);

      serviceInstance.loadImage(
        AppConstants.ENTITY_TYPE.EXPLORATION, '0', 'myfile.png').then(
        successHandler, failHandler);
      const req = httpTestingController.expectOne(imageRequestUrl);
      expect(req.request.method).toEqual('GET');
      expect((serviceInstance.getAssetsFilesCurrentlyBeingRequested())
        .image.length).toBe(1);

      req.flush(EXAMPLE_IMAGE);
      flushMicrotasks();
      expect((serviceInstance.getAssetsFilesCurrentlyBeingRequested())
        .image.length).toBe(0);
      expect(serviceInstance.isCached('myfile.png')).toBe(true);
      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

    it('should not fetch an image if it is already cached', fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      expect(serviceInstance.isCached('myfile.png')).toBe(false);

      serviceInstance.loadImage(
        AppConstants.ENTITY_TYPE.EXPLORATION, '0', 'myfile.png').then(
        successHandler, failHandler);
      let req = httpTestingController.expectOne(imageRequestUrl);
      expect(req.request.method).toEqual('GET');

      req.flush(EXAMPLE_AUDIO);
      flushMicrotasks();
      expect(serviceInstance.isCached('myfile.png')).toBe(true);
      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();

      serviceInstance.loadImage(
        AppConstants.ENTITY_TYPE.EXPLORATION, '0', 'myfile.png').then(
        (cachedFile: ImageFile) => {
          expect(cachedFile).toEqual(
            serviceInstance.imageFileObjectFactory.createNew(
              'myfile.png',
              new Blob()
            )
          );
        });
    }));

    it('should call the provided failure handler on HTTP failure for an audio',
      fakeAsync(() => {
        let successHandler = jasmine.createSpy('success');
        let failHandler = jasmine.createSpy('fail');

        serviceInstance.loadAudio('0', 'myfile.mp3').then(
          successHandler, failHandler);
        let req = httpTestingController.expectOne(audioRequestUrl);
        expect(req.request.method).toEqual('GET');

        req.error();
        flushMicrotasks();
        expect(successHandler).not.toHaveBeenCalled();
        expect(failHandler).toHaveBeenCalled();
      }));

    it('should call the provided failure handler on HTTP failure for an image',
      fakeAsync(() => {
        const successHandler = jasmine.createSpy('success');
        const failHandler = jasmine.createSpy('fail');

        serviceInstance.loadImage(
          AppConstants.ENTITY_TYPE.EXPLORATION, '0', 'myfile.png').then(
          successHandler, failHandler);
        let req = httpTestingController.expectOne(imageRequestUrl);
        expect(req.request.method).toEqual('GET');

        req.error();
        flushMicrotasks();
        expect(successHandler).not.toHaveBeenCalled();
        expect(failHandler).toHaveBeenCalled();
      }));

    it('should successfully abort the download of all the audio files',
      fakeAsync(() => {
        const successHandler = jasmine.createSpy('success');
        const failHandler = jasmine.createSpy('fail');

        serviceInstance.loadAudio('0', 'myfile.mp3').then(
          successHandler, failHandler);
        let req = httpTestingController.expectOne(audioRequestUrl);
        expect(req.request.method).toEqual('GET');
        expect(serviceInstance.getAssetsFilesCurrentlyBeingRequested()
          .audio.length).toBe(1);

        serviceInstance.abortAllCurrentAudioDownloads();
        expect(serviceInstance.getAssetsFilesCurrentlyBeingRequested()
          .audio.length).toBe(0);
        expect(serviceInstance.isCached('myfile.mp3')).toBe(false);
      }));

    it('should successfully abort the download of the all the image files',
      fakeAsync(() => {
        const successHandler = jasmine.createSpy('success');
        const failHandler = jasmine.createSpy('fail');

        serviceInstance.loadImage(
          AppConstants.ENTITY_TYPE.EXPLORATION, '0', 'myfile.png').then(
          successHandler, failHandler);
        let req = httpTestingController.expectOne(imageRequestUrl);
        expect(req.request.method).toEqual('GET');
        expect(serviceInstance.getAssetsFilesCurrentlyBeingRequested()
          .image.length).toBe(1);

        serviceInstance.abortAllCurrentImageDownloads();
        expect(serviceInstance.getAssetsFilesCurrentlyBeingRequested()
          .image.length).toBe(0);
        expect(serviceInstance.isCached('myfile.png')).toBe(false);
      }));

    it('should use the correct blob type for audio assets', fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      serviceInstance.loadAudio('0', 'myfile.mp3').then(
        successHandler, failHandler);
      let req = httpTestingController.expectOne(audioRequestUrl);
      expect(req.request.method).toEqual('GET');
      expect((serviceInstance.getAssetsFilesCurrentlyBeingRequested())
        .audio.length).toBe(1);

      req.flush(EXAMPLE_AUDIO);
      flushMicrotasks();
      expect((serviceInstance.getAssetsFilesCurrentlyBeingRequested())
        .audio.length).toBe(0);

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
      expect(successHandler.calls.first().args[0].data.type).toBe('audiotype');
    }));
  });

  describe('without dev mode settings', () => {
    let oldGcsResourceBucketName: string = null;
    let oldDevMode: boolean = null;
    beforeAll(() => {
      oldGcsResourceBucketName = Constants.GCS_RESOURCE_BUCKET_NAME;
      Constants.GCS_RESOURCE_BUCKET_NAME = '';
      oldDevMode = Constants.DEV_MODE;
      Constants.DEV_MODE = false;
    });

    afterAll(() => {
      Constants.GCS_RESOURCE_BUCKET_NAME = oldGcsResourceBucketName;
      Constants.DEV_MODE = oldDevMode;
    });

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [AssetsBackendApiService]
      });
    });

    it('should throw an error when is not on dev mode and Google Cloud' +
        ' Service bucket name is not set', fakeAsync(() => {
      expect(() => {
        TestBed.get(AssetsBackendApiService);
      }).toThrowError('GCS_RESOURCE_BUCKET_NAME is not set in prod.');
    }));
  });

  describe('on production mode', () => {
    let serviceInstance: AssetsBackendApiService = null;
    let httpTestingController: HttpTestingController = null;
    const gcsPrefix: string = 'https://storage.googleapis.com/None-resources';
    let oldDevMode: boolean = null;

    beforeAll(() => {
      oldDevMode = Constants.DEV_MODE;
      Constants.DEV_MODE = false;
    });

    afterAll(() => {
      Constants.DEV_MODE = oldDevMode;
    });

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [AssetsBackendApiService]
      });
      httpTestingController = TestBed.get(HttpTestingController);
      serviceInstance = TestBed.get(AssetsBackendApiService);
    });

    it('should correctly formulate the download URL for audios', () => {
      expect(
        serviceInstance.getAudioDownloadUrl(
          AppConstants.ENTITY_TYPE.EXPLORATION, 'expid12345', 'a.mp3')
      ).toEqual(gcsPrefix +
        '/exploration/expid12345/assets/audio/a.mp3');
    });

    it('should correctly formulate the preview URL for images', () => {
      expect(
        serviceInstance.getImageUrlForPreview(
          AppConstants.ENTITY_TYPE.EXPLORATION, 'expid12345', 'a.png')
      ).toEqual(gcsPrefix + '/exploration/expid12345/assets/image/a.png');
    });

    it('should correctly formulate the thumbnail url for preview', () => {
      expect(
        serviceInstance.getThumbnailUrlForPreview(
          AppConstants.ENTITY_TYPE.EXPLORATION, 'expid12345', 'thumbnail.png')
      ).toEqual(gcsPrefix +
        '/exploration/expid12345/assets/thumbnail/thumbnail.png');
    });

    afterEach(() => {
      httpTestingController.verify();
    });
  });
});
