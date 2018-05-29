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

describe('Assets Backend API Service', function() {
  var AssetsBackendApiService = null;
  var FileDownloadRequestObjectFactory = null;
  var UrlInterpolationService = null;
  var $httpBackend = null;
  var $rootScope = null;
  var $q = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    AssetsBackendApiService = $injector.get(
      'AssetsBackendApiService');
    FileDownloadRequestObjectFactory = $injector.get(
      'FileDownloadRequestObjectFactory');
    UrlInterpolationService = $injector.get(
      'UrlInterpolationService');
    $httpBackend = $injector.get('$httpBackend');
    $rootScope = $injector.get('$rootScope');
    $q = $injector.get('$q');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('Should successfully fetch and cache audio', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    var requestUrl = UrlInterpolationService.interpolateUrl(
      '/audiohandler/<exploration_id>/audio/<filename>', {
        exploration_id: '0',
        filename: 'myfile.mp3'
      });

    $httpBackend.expect('GET', requestUrl).respond(201, 'audio data');
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

  it('Should successfully fetch and cache image', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    var requestUrl = UrlInterpolationService.interpolateUrl(
      '/imagehandler/<exploration_id>/image/<filename>', {
        exploration_id: '0',
        filename: 'myfile.png'
      });

    $httpBackend.expect('GET', requestUrl).respond(201, 'image data');
    expect(AssetsBackendApiService.isCached('myfile.png')).toBe(false);


    AssetsBackendApiService.loadImage('0', 'myfile.png').then(
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

  it('Should call the provided failure handler on HTTP failure for an audio',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      var requestUrl = UrlInterpolationService.interpolateUrl(
        '/audiohandler/<exploration_id>/audio/<filename>', {
          exploration_id: '0',
          filename: 'myfile.mp3'
        });

      $httpBackend.expect('GET', requestUrl).respond(500, 'MutagenError');
      AssetsBackendApiService.loadAudio('0', 'myfile.mp3').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
      $httpBackend.verifyNoOutstandingExpectation();
    });

  it('Should call the provided failure handler on HTTP failure for an image',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      var requestUrl = UrlInterpolationService.interpolateUrl(
        '/imagehandler/<exploration_id>/image/<filename>', {
          exploration_id: '0',
          filename: 'myfile.png'
        });

      $httpBackend.expect('GET', requestUrl).respond(500, 'Error');
      AssetsBackendApiService.loadImage('0', 'myfile.png').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
      $httpBackend.verifyNoOutstandingExpectation();
    });

  it('Should successfully abort the download of all the audio files',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      var requestUrl = UrlInterpolationService.interpolateUrl(
        '/audiohandler/<exploration_id>/audio/<filename>', {
          exploration_id: '0',
          filename: 'myfile.mp3'
        });

      $httpBackend.expect('GET', requestUrl).respond(201, 'audio data');

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

  it('Should successfully abort the download of the all the image files',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      var requestUrl = UrlInterpolationService.interpolateUrl(
        'imagehandler/<exploration_id>/image/<filename>', {
          exploration_id: '0',
          filename: 'myfile.png'
        });

      $httpBackend.expect('GET', requestUrl).respond(201, 'image data');

      AssetsBackendApiService.loadImage('0', 'myfile.png').then(
        successHandler, failHandler);

      expect(AssetsBackendApiService.getAssetsFilesCurrentlyBeingRequested()
        .image.length).toBe(1);

      AssetsBackendApiService.abortAllCurrentImageDownloads();
      $httpBackend.verifyNoOutstandingRequest();
      expect(AssetsBackendApiService.getAssetsFilesCurrentlyBeingRequested()
        .image.length).toBe(0);
      expect(AssetsBackendApiService.isCached('myfile.png')).toBe(false);
    });
});
