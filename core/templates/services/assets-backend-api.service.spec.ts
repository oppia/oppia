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
 * @fileoverview Unit tests for AssetsBackendApiService
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {AppConstants} from 'app.constants';
import {AudioFile} from 'domain/utilities/audio-file.model';
import {ImageFile} from 'domain/utilities/image-file.model';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {CsrfTokenService} from 'services/csrf-token.service';

describe('Assets Backend API Service', () => {
  describe('on dev mode', () => {
    let assetsBackendApiService: AssetsBackendApiService;
    let csrfTokenService: CsrfTokenService;
    let httpTestingController: HttpTestingController;

    const audioRequestUrl =
      '/assetsdevhandler/exploration/0/assets/audio/myfile.mp3';
    const imageRequestUrl =
      '/assetsdevhandler/exploration/0/assets/image/myfile.png';

    const audioBlob = new Blob(['audio data'], {type: 'audiotype'});
    const imageBlob = new Blob(['image data'], {type: 'imagetype'});

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
      });
      assetsBackendApiService = TestBed.inject(AssetsBackendApiService);
      csrfTokenService = TestBed.inject(CsrfTokenService);
      httpTestingController = TestBed.inject(HttpTestingController);

      spyOn(csrfTokenService, 'getTokenAsync').and.returnValue(
        Promise.resolve('token')
      );
    });

    afterEach(() => {
      httpTestingController.verify();
    });

    it('should correctly formulate the download URL for audio', () => {
      expect(
        assetsBackendApiService.getAudioDownloadUrl(
          AppConstants.ENTITY_TYPE.EXPLORATION,
          'expid12345',
          'a.mp3'
        )
      ).toEqual('/assetsdevhandler/exploration/expid12345/assets/audio/a.mp3');
    });

    it('should correctly formulate the preview URL for images', () => {
      expect(
        assetsBackendApiService.getImageUrlForPreview(
          AppConstants.ENTITY_TYPE.EXPLORATION,
          'expid12345',
          'a.png'
        )
      ).toEqual('/assetsdevhandler/exploration/expid12345/assets/image/a.png');
    });

    it('should correctly formulate the thumbnail url for preview', () => {
      expect(
        assetsBackendApiService.getThumbnailUrlForPreview(
          AppConstants.ENTITY_TYPE.EXPLORATION,
          'expid12345',
          'thumbnail.png'
        )
      ).toEqual(
        '/assetsdevhandler/exploration/expid12345/assets/' +
          'thumbnail/thumbnail.png'
      );
    });

    it('should successfully fetch and cache audio', fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      expect(assetsBackendApiService.isCached('myfile.mp3')).toBeFalse();

      assetsBackendApiService
        .loadAudio('0', 'myfile.mp3')
        .then(successHandler, failHandler);
      const req = httpTestingController.expectOne(audioRequestUrl);
      expect(req.request.method).toEqual('GET');
      expect(
        assetsBackendApiService.getAssetsFilesCurrentlyBeingRequested().audio
          .length
      ).toEqual(1);
      req.flush(audioBlob);
      flushMicrotasks();
      expect(
        assetsBackendApiService.getAssetsFilesCurrentlyBeingRequested().audio
          .length
      ).toEqual(0);
      expect(assetsBackendApiService.isCached('myfile.mp3')).toBeTrue();
      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

    it('should not fetch an audio if it is already cached', fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      expect(assetsBackendApiService.isCached('myfile.mp3')).toBeFalse();
      assetsBackendApiService
        .loadAudio('0', 'myfile.mp3')
        .then(successHandler, failHandler);
      const req = httpTestingController.expectOne(audioRequestUrl);
      expect(req.request.method).toEqual('GET');
      req.flush(audioBlob);
      flushMicrotasks();
      expect(assetsBackendApiService.isCached('myfile.mp3')).toBeTrue();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();

      assetsBackendApiService
        .loadAudio('0', 'myfile.mp3')
        .then((cachedFile: AudioFile) => {
          expect(cachedFile).toEqual(new AudioFile('myfile.mp3', audioBlob));
        });
    }));

    it('should handler rejection when fetching a file fails', fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      expect(assetsBackendApiService.isCached('myfile.mp3')).toBeFalse();

      assetsBackendApiService
        .loadAudio('0', 'myfile.mp3')
        .then(successHandler, failHandler);
      const req = httpTestingController.expectOne(audioRequestUrl);
      expect(req.request.method).toEqual('GET');
      req.flush(audioBlob, {status: 400, statusText: 'Failed'});
      flushMicrotasks();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('myfile.mp3');
      expect(assetsBackendApiService.isCached('myfile.mp3')).toBeFalse();
    }));

    it('should successfully save an audio', fakeAsync(() => {
      const successMessage = 'Audio was successfully saved.';
      const onSuccess = jasmine.createSpy('onSuccess');
      const onFailure = jasmine.createSpy('onFailure');

      assetsBackendApiService
        .saveAudio('0', 'a.mp3', new File([], 'a.mp3'))
        .then(onSuccess, onFailure);
      flushMicrotasks();

      httpTestingController
        .expectOne('/createhandler/audioupload/0')
        .flush(successMessage);
      flushMicrotasks();

      expect(onSuccess).toHaveBeenCalledWith(successMessage);
      expect(onFailure).not.toHaveBeenCalled();
    }));

    it('should successfully save a math SVG', fakeAsync(() => {
      const successMessage = 'Math SVG was successfully saved.';
      const onSuccess = jasmine.createSpy('onSuccess');
      const onFailure = jasmine.createSpy('onFailure');

      assetsBackendApiService
        .saveMathExpressionImage(
          imageBlob,
          'newMathExpression.svg',
          'exploration',
          'expid12345'
        )
        .then(onSuccess, onFailure);
      flushMicrotasks();

      httpTestingController
        .expectOne('/createhandler/imageupload/exploration/expid12345')
        .flush(successMessage);
      flushMicrotasks();

      expect(onSuccess).toHaveBeenCalledWith(successMessage);
      expect(onFailure).not.toHaveBeenCalled();
    }));

    it('should successfully post a thumbnail to server', fakeAsync(() => {
      const successMessage = 'Thumbnail SVG was successfully saved.';
      const onSuccess = jasmine.createSpy('onSuccess');
      const onFailure = jasmine.createSpy('onFailure');

      assetsBackendApiService
        .postThumbnailFile(
          new Blob(['abc']),
          'filename.svg',
          'entity_type',
          'entity_id'
        )
        .subscribe(onSuccess, onFailure);
      flushMicrotasks();

      httpTestingController
        .expectOne('/createhandler/imageupload/entity_type/entity_id')
        .flush(successMessage);

      expect(onSuccess).toHaveBeenCalledWith(successMessage);
      expect(onFailure).not.toHaveBeenCalled();
    }));

    it('should handle rejection when saving a math SVG fails', fakeAsync(() => {
      const onSuccess = jasmine.createSpy('onSuccess');
      const onFailure = jasmine.createSpy('onFailure');

      assetsBackendApiService
        .saveMathExpressionImage(
          imageBlob,
          'new.svg',
          'exploration',
          'expid12345'
        )
        .then(onSuccess, onFailure);
      flushMicrotasks();

      httpTestingController
        .expectOne('/createhandler/imageupload/exploration/expid12345')
        .flush(null, {status: 400, statusText: 'Failure'});
      flushMicrotasks();

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onFailure).toHaveBeenCalled();
    }));

    it('should handle rejection when saving a math SVG fails with non HTTP err', fakeAsync(() => {
      const onSuccess = jasmine.createSpy('onSuccess');
      const onFailure = jasmine.createSpy('onFailure');

      spyOn(
        assetsBackendApiService,
        // This throws "Argument of type 'getImageUploadUrl' is not assignable
        // to parameter of type 'keyof AssetsBackendApiService'. We need to
        // suppress this error because of strict type checking. This is
        // because the type of getImageUploadUrl is string and not a
        // function.
        // @ts-ignore
        'getImageUploadUrl'
      ).and.throwError(Error('token'));

      assetsBackendApiService
        .saveMathExpressionImage(
          imageBlob,
          'new.svg',
          'exploration',
          'expid12345'
        )
        .then(onSuccess, onFailure);
      flushMicrotasks();

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onFailure).toHaveBeenCalled();
    }));

    it('should handle rejection when saving a file fails', fakeAsync(() => {
      const onSuccess = jasmine.createSpy('onSuccess');
      const onFailure = jasmine.createSpy('onFailure');

      assetsBackendApiService
        .saveAudio('0', 'a.mp3', audioBlob)
        .then(onSuccess, onFailure);
      flushMicrotasks();

      httpTestingController
        .expectOne('/createhandler/audioupload/0')
        .flush(null, {status: 400, statusText: 'Failure'});
      flushMicrotasks();

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onFailure).toHaveBeenCalled();
    }));

    it('should handle rejection when saving a file fails with non HTTP error', fakeAsync(() => {
      const onSuccess = jasmine.createSpy('onSuccess');
      const onFailure = jasmine.createSpy('onFailure');

      spyOn(
        assetsBackendApiService,
        // This throws "Argument of type 'getImageUploadUrl' is not assignable
        // to parameter of type 'keyof AssetsBackendApiService'. We need to
        // suppress this error because of strict type checking. This is
        // because the type of getImageUploadUrl is string and not a
        // function.
        // @ts-ignore
        'getAudioUploadUrl'
      ).and.throwError(Error('token'));

      assetsBackendApiService
        .saveAudio('0', 'a.mp3', audioBlob)
        .then(onSuccess, onFailure);
      flushMicrotasks();

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onFailure).toHaveBeenCalled();
    }));

    it('should successfully fetch and cache image', fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      expect(assetsBackendApiService.isCached('myfile.png')).toBeFalse();

      assetsBackendApiService
        .loadImage(AppConstants.ENTITY_TYPE.EXPLORATION, '0', 'myfile.png')
        .then(successHandler, failHandler);
      const req = httpTestingController.expectOne(imageRequestUrl);
      expect(req.request.method).toEqual('GET');
      expect(
        assetsBackendApiService.getAssetsFilesCurrentlyBeingRequested().image
          .length
      ).toEqual(1);

      req.flush(imageBlob);
      flushMicrotasks();
      expect(
        assetsBackendApiService.getAssetsFilesCurrentlyBeingRequested().image
          .length
      ).toEqual(0);
      expect(assetsBackendApiService.isCached('myfile.png')).toBeTrue();
      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

    it('should not fetch an image if it is already cached', fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      expect(assetsBackendApiService.isCached('myfile.png')).toBeFalse();

      assetsBackendApiService
        .loadImage(AppConstants.ENTITY_TYPE.EXPLORATION, '0', 'myfile.png')
        .then(successHandler, failHandler);
      let req = httpTestingController.expectOne(imageRequestUrl);
      expect(req.request.method).toEqual('GET');

      req.flush(audioBlob);
      flushMicrotasks();
      expect(assetsBackendApiService.isCached('myfile.png')).toBeTrue();
      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();

      assetsBackendApiService
        .loadImage(AppConstants.ENTITY_TYPE.EXPLORATION, '0', 'myfile.png')
        .then((cachedFile: ImageFile) => {
          expect(cachedFile).toEqual(new ImageFile('myfile.png', new Blob()));
        });
    }));

    it('should call the provided failure handler on HTTP failure for an audio', fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      assetsBackendApiService
        .loadAudio('0', 'myfile.mp3')
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(audioRequestUrl);
      expect(req.request.method).toEqual('GET');
      req.flush(audioBlob, {status: 400, statusText: 'Failure'});

      flushMicrotasks();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }));

    it('should call the provided failure handler on HTTP failure for an image', fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      assetsBackendApiService
        .loadImage(AppConstants.ENTITY_TYPE.EXPLORATION, '0', 'myfile.png')
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(imageRequestUrl);
      expect(req.request.method).toEqual('GET');
      req.flush(audioBlob, {status: 400, statusText: 'Failure'});

      flushMicrotasks();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }));

    it('should successfully abort the download of all the audio files', fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      assetsBackendApiService
        .loadAudio('0', 'myfile.mp3')
        .then(successHandler, failHandler);
      let req = httpTestingController.expectOne(audioRequestUrl);
      expect(req.request.method).toEqual('GET');
      expect(
        assetsBackendApiService.getAssetsFilesCurrentlyBeingRequested().audio
          .length
      ).toEqual(1);

      assetsBackendApiService.abortAllCurrentAudioDownloads();
      expect(
        assetsBackendApiService.getAssetsFilesCurrentlyBeingRequested().audio
          .length
      ).toEqual(0);
      expect(assetsBackendApiService.isCached('myfile.mp3')).toBeFalse();
    }));

    it('should successfully abort the download of the all the image files', fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      assetsBackendApiService
        .loadImage(AppConstants.ENTITY_TYPE.EXPLORATION, '0', 'myfile.png')
        .then(successHandler, failHandler);
      let req = httpTestingController.expectOne(imageRequestUrl);
      expect(req.request.method).toEqual('GET');
      expect(
        assetsBackendApiService.getAssetsFilesCurrentlyBeingRequested().image
          .length
      ).toEqual(1);

      assetsBackendApiService.abortAllCurrentImageDownloads();
      expect(
        assetsBackendApiService.getAssetsFilesCurrentlyBeingRequested().image
          .length
      ).toEqual(0);
      expect(assetsBackendApiService.isCached('myfile.png')).toBeFalse();
    }));

    it('should use the correct blob type for audio assets', fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      assetsBackendApiService
        .loadAudio('0', 'myfile.mp3')
        .then(successHandler, failHandler);
      let req = httpTestingController.expectOne(audioRequestUrl);
      expect(req.request.method).toEqual('GET');
      expect(
        assetsBackendApiService.getAssetsFilesCurrentlyBeingRequested().audio
          .length
      ).toEqual(1);

      req.flush(audioBlob);
      flushMicrotasks();
      expect(
        assetsBackendApiService.getAssetsFilesCurrentlyBeingRequested().audio
          .length
      ).toEqual(0);

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
      expect(successHandler.calls.first().args[0].data.type).toEqual(
        'audiotype'
      );
    }));
  });

  describe('on emulator mode', () => {
    let assetsBackendApiService: AssetsBackendApiService;
    let httpTestingController: HttpTestingController;
    const gcsPrefix: string =
      'https://storage.googleapis.com/app_default_bucket';

    beforeEach(() => {
      spyOnProperty(
        AssetsBackendApiService,
        'EMULATOR_MODE',
        'get'
      ).and.returnValue(false);
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [AssetsBackendApiService],
      });
      httpTestingController = TestBed.inject(HttpTestingController);
      assetsBackendApiService = TestBed.inject(AssetsBackendApiService);
    });

    it('should correctly formulate the download URL for audios', () => {
      expect(
        assetsBackendApiService.getAudioDownloadUrl(
          AppConstants.ENTITY_TYPE.EXPLORATION,
          'expid12345',
          'a.mp3'
        )
      ).toEqual(gcsPrefix + '/exploration/expid12345/assets/audio/a.mp3');
    });

    it('should correctly formulate the preview URL for images', () => {
      expect(
        assetsBackendApiService.getImageUrlForPreview(
          AppConstants.ENTITY_TYPE.EXPLORATION,
          'expid12345',
          'a.png'
        )
      ).toEqual(gcsPrefix + '/exploration/expid12345/assets/image/a.png');
    });

    it('should correctly formulate the thumbnail url for preview', () => {
      expect(
        assetsBackendApiService.getThumbnailUrlForPreview(
          AppConstants.ENTITY_TYPE.EXPLORATION,
          'expid12345',
          'thumbnail.png'
        )
      ).toEqual(
        gcsPrefix + '/exploration/expid12345/assets/thumbnail/thumbnail.png'
      );
    });

    afterEach(() => {
      httpTestingController.verify();
    });
  });
});
