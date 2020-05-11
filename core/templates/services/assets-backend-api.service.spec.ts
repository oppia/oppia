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

// TODO(#7222): Remove the following block of unnnecessary imports once
// AssetsBackendApiService.ts is upgraded to Angular 8.
import { AudioFileObjectFactory } from
  'domain/utilities/AudioFileObjectFactory';
import { FileDownloadRequestObjectFactory } from
  'domain/utilities/FileDownloadRequestObjectFactory';
import { ImageFileObjectFactory } from
  'domain/utilities/ImageFileObjectFactory';
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.
// Jquery is needed in this file because some tests will spyOn Jquery methods.
// The spies won't actually spy Jquery methods without the import.
import $ from 'jquery';

require('domain/utilities/url-interpolation.service.ts');
require('services/assets-backend-api.service.ts');
require('services/csrf-token.service.ts');

describe('Assets Backend API Service', function() {
  describe('on dev mode', function() {
    var AssetsBackendApiService = null;
    var fileDownloadRequestObjectFactory = null;
    var UrlInterpolationService = null;
    var audioFileObjectFactory = null;
    var imageFileObjectFactory = null;
    var CsrfService = null;
    var $httpBackend = null;
    var $rootScope = null;
    var $q = null;
    var ENTITY_TYPE = null;
    var audioRequestUrl = null;
    var imageRequestUrl = null;

    beforeEach(angular.mock.module('oppia'));
    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.value('AudioFileObjectFactory', new AudioFileObjectFactory());
      $provide.value(
        'FileDownloadRequestObjectFactory',
        new FileDownloadRequestObjectFactory());
      $provide.value('ImageFileObjectFactory', new ImageFileObjectFactory());
    }));
    beforeEach(angular.mock.module('oppia', function($provide) {
      var ugs = new UpgradedServices();
      for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
        $provide.value(key, value);
      }
    }));

    beforeEach(angular.mock.inject(function($injector) {
      AssetsBackendApiService = $injector.get(
        'AssetsBackendApiService');
      fileDownloadRequestObjectFactory = $injector.get(
        'FileDownloadRequestObjectFactory');
      audioFileObjectFactory = $injector.get('AudioFileObjectFactory');
      imageFileObjectFactory = $injector.get('ImageFileObjectFactory');
      UrlInterpolationService = $injector.get(
        'UrlInterpolationService');
      $httpBackend = $injector.get('$httpBackend');
      $rootScope = $injector.get('$rootScope');
      ENTITY_TYPE = $injector.get('ENTITY_TYPE');
      $q = $injector.get('$q');

      CsrfService = $injector.get('CsrfTokenService');

      spyOn(CsrfService, 'getTokenAsync').and.callFake(function() {
        var deferred = $q.defer();
        deferred.resolve('sample-csrf-token');
        return deferred.promise;
      });

      audioRequestUrl = UrlInterpolationService.interpolateUrl(
        '/assetsdevhandler/exploration/<exploration_id>/assets/audio/' +
        '<filename>',
        {
          exploration_id: '0',
          filename: 'myfile.mp3'
        });

      imageRequestUrl = UrlInterpolationService.interpolateUrl(
        '/assetsdevhandler/exploration/<exploration_id>/assets/image/' +
        '<filename>',
        {
          exploration_id: '0',
          filename: 'myfile.png'
        });
    }));

    afterEach(function() {
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should correctly formulate the download URL for audio', function() {
      expect(
        AssetsBackendApiService.getAudioDownloadUrl(
          ENTITY_TYPE.EXPLORATION, 'expid12345', 'a.mp3')
      ).toEqual('/assetsdevhandler/exploration/expid12345/assets/audio/a.mp3');
    });

    it('should correctly formulate the preview URL for images', function() {
      expect(
        AssetsBackendApiService.getImageUrlForPreview(
          ENTITY_TYPE.EXPLORATION, 'expid12345', 'a.png')
      ).toEqual('/assetsdevhandler/exploration/expid12345/assets/image/a.png');
    });

    it('should correctly formulate the thumbnail url for preview', function() {
      expect(
        AssetsBackendApiService.getThumbnailUrlForPreview(
          ENTITY_TYPE.EXPLORATION, 'expid12345', 'thumbnail.png')).toEqual(
        '/assetsdevhandler/exploration/expid12345/assets/' +
        'thumbnail/thumbnail.png');
    });

    it('should successfully fetch and cache audio', function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', audioRequestUrl).respond(201, 'audio data');
      expect(AssetsBackendApiService.isCached('myfile.mp3')).toBe(false);


      AssetsBackendApiService.loadAudio('0', 'myfile.mp3').then(
        successHandler, failHandler);
      expect((AssetsBackendApiService.getAssetsFilesCurrentlyBeingRequested())
        .audio.length).toBe(1);
      $httpBackend.flush();
      expect((AssetsBackendApiService.getAssetsFilesCurrentlyBeingRequested())
        .audio.length).toBe(0);
      expect(AssetsBackendApiService.isCached('myfile.mp3')).toBe(true);
      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
      $httpBackend.verifyNoOutstandingExpectation();
    });

    it('should not fetch an audio if it is already cached', function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', audioRequestUrl).respond(201, 'audio data');
      expect(AssetsBackendApiService.isCached('myfile.mp3')).toBe(false);
      AssetsBackendApiService.loadAudio('0', 'myfile.mp3').then(
        successHandler, failHandler);
      $httpBackend.flush();
      expect(AssetsBackendApiService.isCached('myfile.mp3')).toBe(true);

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
      $httpBackend.verifyNoOutstandingExpectation();

      AssetsBackendApiService.loadAudio('0', 'myfile.mp3').then(
        function(cachedFile) {
          expect(cachedFile).toEqual(audioFileObjectFactory.createNew(
            'myfile.mp3',
            new Blob()
          ));
        });
      $httpBackend.verifyNoOutstandingExpectation();
    });

    it('should handler rejection when fetching a file fails', function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', audioRequestUrl).respond(
        500, 'File not found.');
      expect(AssetsBackendApiService.isCached('myfile.mp3')).toBe(false);

      AssetsBackendApiService.loadAudio('0', 'myfile.mp3').then(
        successHandler, failHandler);
      $httpBackend.flush();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('myfile.mp3');
      expect(AssetsBackendApiService.isCached('myfile.mp3')).toBe(false);
      $httpBackend.verifyNoOutstandingExpectation();
    });

    it('should successfully save an audio', function(done) {
      var successMessage = 'Audio was successfully saved.';
      // @ts-ignore in order to ignore JQuery properties that should
      // be declarated.
      spyOn($, 'ajax').and.callFake(function() {
        var d = $.Deferred();
        d.resolve(successMessage);
        return d.promise();
      });

      AssetsBackendApiService.saveAudio('0', 'a.mp3', new File([], 'a.mp3'))
        .then(function(response) {
          expect(response).toBe(successMessage);
        }).then(done, done.fail);

      // $q Promises need to be forcibly resolved through a JavaScript digest,
      // which is what $apply helps kick-start.
      $rootScope.$apply();
    });

    it('should handle rejection when saving a file fails', function(done) {
      var errorMessage = 'Error on saving audio';
      // @ts-ignore in order to ignore JQuery properties that should
      // be declarated.
      spyOn($, 'ajax').and.callFake(function() {
        var d = $.Deferred();
        d.reject({
          // responseText contains a XSSI Prefix, which is represented by )]}'
          // string. That's why double quotes is being used here. It's not
          // possible to use \' instead of ' so the XSSI Prefix won't be
          // evaluated correctly.
          /* eslint-disable quotes */
          responseText: ")]}'\n{ \"message\": \"" + errorMessage + "\" }"
          /* eslint-enable quotes */
        });
        return d.promise();
      });

      AssetsBackendApiService.saveAudio('0', 'a.mp3', new File([], 'a.mp3'))
        .then(done, function(response) {
          expect(response).toEqual({
            message: errorMessage
          });
          done();
        });

      // $q Promises need to be forcibly resolved through a JavaScript digest,
      // which is what $apply helps kick-start.
      $rootScope.$apply();
    });

    it('should successfully fetch and cache image', function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', imageRequestUrl).respond(201, 'image data');
      expect(AssetsBackendApiService.isCached('myfile.png')).toBe(false);

      AssetsBackendApiService.loadImage(
        ENTITY_TYPE.EXPLORATION, '0', 'myfile.png').then(
        successHandler, failHandler);
      expect((AssetsBackendApiService.getAssetsFilesCurrentlyBeingRequested())
        .image.length).toBe(1);
      $httpBackend.flush();
      expect((AssetsBackendApiService.getAssetsFilesCurrentlyBeingRequested())
        .image.length).toBe(0);
      expect(AssetsBackendApiService.isCached('myfile.png')).toBe(true);
      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
      $httpBackend.verifyNoOutstandingExpectation();
    });

    it('should not fetch an image if it is already cached', function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', imageRequestUrl).respond(201, 'image data');
      expect(AssetsBackendApiService.isCached('myfile.png')).toBe(false);

      AssetsBackendApiService.loadImage(
        ENTITY_TYPE.EXPLORATION, '0', 'myfile.png').then(
        successHandler, failHandler);
      $httpBackend.flush();
      expect(AssetsBackendApiService.isCached('myfile.png')).toBe(true);
      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
      $httpBackend.verifyNoOutstandingExpectation();

      AssetsBackendApiService.loadImage(
        ENTITY_TYPE.EXPLORATION, '0', 'myfile.png').then(
        function(cachedFile) {
          expect(cachedFile).toEqual(imageFileObjectFactory.createNew(
            'myfile.png',
            new Blob()
          ));
        });
      $httpBackend.verifyNoOutstandingExpectation();
    });

    it('should call the provided failure handler on HTTP failure for an audio',
      function() {
        var successHandler = jasmine.createSpy('success');
        var failHandler = jasmine.createSpy('fail');

        $httpBackend.expect('GET', audioRequestUrl).respond(
          500, 'MutagenError');
        AssetsBackendApiService.loadAudio('0', 'myfile.mp3').then(
          successHandler, failHandler);
        $httpBackend.flush();

        expect(successHandler).not.toHaveBeenCalled();
        expect(failHandler).toHaveBeenCalled();
        $httpBackend.verifyNoOutstandingExpectation();
      });

    it('should call the provided failure handler on HTTP failure for an image',
      function() {
        var successHandler = jasmine.createSpy('success');
        var failHandler = jasmine.createSpy('fail');

        $httpBackend.expect('GET', imageRequestUrl).respond(500, 'Error');
        AssetsBackendApiService.loadImage(
          ENTITY_TYPE.EXPLORATION, '0', 'myfile.png').then(
          successHandler, failHandler);
        $httpBackend.flush();

        expect(successHandler).not.toHaveBeenCalled();
        expect(failHandler).toHaveBeenCalled();
        $httpBackend.verifyNoOutstandingExpectation();
      });

    it('should successfully abort the download of all the audio files',
      function() {
        var successHandler = jasmine.createSpy('success');
        var failHandler = jasmine.createSpy('fail');

        $httpBackend.expect('GET', audioRequestUrl).respond(201, 'audio data');

        AssetsBackendApiService.loadAudio('0', 'myfile.mp3').then(
          successHandler, failHandler);

        expect(AssetsBackendApiService.getAssetsFilesCurrentlyBeingRequested()
          .audio.length).toBe(1);

        AssetsBackendApiService.abortAllCurrentAudioDownloads();
        $httpBackend.verifyNoOutstandingRequest();
        expect(AssetsBackendApiService.getAssetsFilesCurrentlyBeingRequested()
          .audio.length).toBe(0);
        expect(AssetsBackendApiService.isCached('myfile.mp3')).toBe(false);
      });

    it('should successfully abort the download of the all the image files',
      function() {
        var successHandler = jasmine.createSpy('success');
        var failHandler = jasmine.createSpy('fail');

        $httpBackend.expect('GET', imageRequestUrl).respond(201, 'image data');

        AssetsBackendApiService.loadImage(
          ENTITY_TYPE.EXPLORATION, '0', 'myfile.png').then(
          successHandler, failHandler);

        expect(AssetsBackendApiService.getAssetsFilesCurrentlyBeingRequested()
          .image.length).toBe(1);

        AssetsBackendApiService.abortAllCurrentImageDownloads();
        $httpBackend.verifyNoOutstandingRequest();
        expect(AssetsBackendApiService.getAssetsFilesCurrentlyBeingRequested()
          .image.length).toBe(0);
        expect(AssetsBackendApiService.isCached('myfile.png')).toBe(false);
      });

    it('should use the correct blob type for audio assets', function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', audioRequestUrl).respond(
        201, {type: 'audio/mpeg'});
      AssetsBackendApiService.loadAudio('0', 'myfile.mp3').then(
        successHandler, failHandler);
      expect((AssetsBackendApiService.getAssetsFilesCurrentlyBeingRequested())
        .audio.length).toBe(1);
      $httpBackend.flush();
      expect((AssetsBackendApiService.getAssetsFilesCurrentlyBeingRequested())
        .audio.length).toBe(0);

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
      expect(successHandler.calls.first().args[0].data.type).toBe('audio/mpeg');
      $httpBackend.verifyNoOutstandingExpectation();
    });
  });

  describe('without dev mode settings', function() {
    beforeEach(angular.mock.module('oppia'));
    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.value('AudioFileObjectFactory', new AudioFileObjectFactory());
      $provide.value(
        'FileDownloadRequestObjectFactory',
        new FileDownloadRequestObjectFactory());
      $provide.value('ImageFileObjectFactory', new ImageFileObjectFactory());
      $provide.constant('DEV_MODE', false);
      $provide.constant('GCS_RESOURCE_BUCKET_NAME', false);
    }));
    beforeEach(angular.mock.module('oppia', function($provide) {
      var ugs = new UpgradedServices();
      for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
        $provide.value(key, value);
      }
    }));

    it('should throw an error when is not on dev mode and Google Cloud' +
      ' Service bucket name is not set', angular.mock.inject(
      function($injector) {
        expect(function() {
          var service = $injector.get(
            'AssetsBackendApiService');
        }).toThrowError('GCS_RESOURCE_BUCKET_NAME is not set in prod.');
      }));
  });

  describe('on production mode', function() {
    var AssetsBackendApiService = null;
    var ENTITY_TYPE = null;
    var gcsPrefix = 'https://storage.googleapis.com/None-resources';

    beforeEach(angular.mock.module('oppia'));
    beforeEach(angular.mock.module('oppia', function($provide) {
      $provide.value('AudioFileObjectFactory', new AudioFileObjectFactory());
      $provide.value(
        'FileDownloadRequestObjectFactory',
        new FileDownloadRequestObjectFactory());
      $provide.value('ImageFileObjectFactory', new ImageFileObjectFactory());
      $provide.constant('DEV_MODE', false);
    }));
    beforeEach(angular.mock.module('oppia', function($provide) {
      var ugs = new UpgradedServices();
      for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
        $provide.value(key, value);
      }
    }));

    beforeEach(angular.mock.inject(function($injector) {
      AssetsBackendApiService = $injector.get(
        'AssetsBackendApiService');
      ENTITY_TYPE = $injector.get('ENTITY_TYPE');
    }));

    it('should correctly formulate the download URL for audios', function() {
      expect(
        AssetsBackendApiService.getAudioDownloadUrl(
          ENTITY_TYPE.EXPLORATION, 'expid12345', 'a.mp3')
      ).toEqual(gcsPrefix +
        '/exploration/expid12345/assets/audio/a.mp3');
    });

    it('should correctly formulate the preview URL for images', function() {
      expect(
        AssetsBackendApiService.getImageUrlForPreview(
          ENTITY_TYPE.EXPLORATION, 'expid12345', 'a.png')
      ).toEqual(gcsPrefix + '/exploration/expid12345/assets/image/a.png');
    });

    it('should correctly formulate the thumbnail url for preview', function() {
      expect(
        AssetsBackendApiService.getThumbnailUrlForPreview(
          ENTITY_TYPE.EXPLORATION, 'expid12345', 'thumbnail.png')
      ).toEqual(gcsPrefix +
        '/exploration/expid12345/assets/thumbnail/thumbnail.png');
    });
  });
});
