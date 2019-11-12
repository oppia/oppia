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
 * @fileoverview Unit tests for assetsBackendApiService
 */

import { FileDownloadRequestObjectFactory } from
  'domain/utilities/FileDownloadRequestObjectFactory';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {TestBed} from '@angular/core/testing';
import {UrlInterpolationService} from
  'domain/utilities/url-interpolation.service';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';

fdescribe('Assets Backend API Service', function() {
  let assetsBackendApiService: AssetsBackendApiService = null;
  let fileDownloadRequestObjectFactory = null;
  let urlInterpolationService = null;
  let ENTITY_TYPE = null;
  let httpTestingController: HttpTestingController;


  beforeEach(() => {
      TestBed.configureTestingModule({
          imports: [HttpClientTestingModule],
          providers: [AssetsBackendApiService]
      });
    assetsBackendApiService = TestBed.get(AssetsBackendApiService);
    fileDownloadRequestObjectFactory = TestBed.get(
      FileDownloadRequestObjectFactory);
    urlInterpolationService = TestBed.get(UrlInterpolationService);


    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(function() {
    httpTestingController.verify();
  });

  it('should correctly formulate the download URL', function() {
    // TODO(sll): Find a way to substitute out constants.DEV_MODE so that we
    // can test the production URL, too.
    expect(
      assetsBackendApiService.getAudioDownloadUrl(
        ENTITY_TYPE.EXPLORATION, 'expid12345', 'a.mp3')
    ).toEqual('/assetsdevhandler/exploration/expid12345/assets/audio/a.mp3');
  });

  it('should successfully fetch and cache audio', function() {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let requestUrl = urlInterpolationService.interpolateUrl(
      '/assetsdevhandler/exploration/<exploration_id>/assets/audio/<filename>',
      {
        exploration_id: '0',
        filename: 'myfile.mp3'
      });

    const req = httpTestingController.expectOne(requestUrl);
    expect(req.request.method).toEqual('GET');
    req.flush('audio data');
    expect(assetsBackendApiService.isCached('myfile.mp3')).toBe(false);


    assetsBackendApiService.loadAudio('0', 'myfile.mp3').then(
      successHandler, failHandler);
    expect((assetsBackendApiService.getAssetsFilesCurrentlyBeingRequested())
      .audio.length).toBe(1);

    expect((assetsBackendApiService.getAssetsFilesCurrentlyBeingRequested())
      .audio.length).toBe(0);
    expect(assetsBackendApiService.isCached('myfile.mp3')).toBe(true);
    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should successfully fetch and cache image', function() {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let requestUrl = urlInterpolationService.interpolateUrl(
      '/assetsdevhandler/exploration/<exploration_id>/assets/image/<filename>',
      {
        exploration_id: '0',
        filename: 'myfile.png'
      });

    let req = httpTestingController.expectOne( requestUrl);
    expect(req.request.method).toEqual('GET');
    req.flush('image data');
    expect(assetsBackendApiService.isCached('myfile.png')).toBe(false);


    assetsBackendApiService.loadImage(
      ENTITY_TYPE.EXPLORATION, '0', 'myfile.png').then(
      successHandler, failHandler);
    expect((assetsBackendApiService.getAssetsFilesCurrentlyBeingRequested())
      .image.length).toBe(1);
    // $httpBackend.flush();
    expect((assetsBackendApiService.getAssetsFilesCurrentlyBeingRequested())
      .image.length).toBe(0);
    expect(assetsBackendApiService.isCached('myfile.png')).toBe(true);
    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should call the provided failure handler on HTTP failure for an audio',
    function() {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      let requestUrl = urlInterpolationService.interpolateUrl(
        '/assetsdevhandler/exploration/<exploration_id>/assets/audio/' +
        '<filename>', {
          exploration_id: '0',
          filename: 'myfile.mp3'
        });

      let req = httpTestingController.expectOne( requestUrl);
      expect(req.request.method).toEqual('GET');
      req.flush('MutagenError');
      assetsBackendApiService.loadAudio('0', 'myfile.mp3').then(
        successHandler, failHandler);

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    });

  it('should call the provided failure handler on HTTP failure for an image',
    function() {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      let requestUrl = urlInterpolationService.interpolateUrl(
        '/assetsdevhandler/exploration/<exploration_id>/assets/image/' +
        '<filename>', {
          exploration_id: '0',
          filename: 'myfile.png'
        });

      const req = httpTestingController.expectOne(requestUrl);
      expect(req.request.method).toEqual('GET');
      req.flush('Error');
      assetsBackendApiService.loadImage(
        ENTITY_TYPE.EXPLORATION, '0', 'myfile.png').then(
        successHandler, failHandler);

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    });

  it('should successfully abort the download of all the audio files',
    function() {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      let requestUrl = urlInterpolationService.interpolateUrl(
        '/assetsdevhandler/exploration/<exploration_id>/assets/audio/' +
        '<filename>', {
          exploration_id: '0',
          filename: 'myfile.mp3'
        });


      const req = httpTestingController.expectOne(requestUrl);
      expect(req.request.method).toEqual('GET');
      req.flush('audio data');
      assetsBackendApiService.loadAudio('0', 'myfile.mp3').then(
        successHandler, failHandler);

      expect(assetsBackendApiService.getAssetsFilesCurrentlyBeingRequested()
        .audio.length).toBe(1);

      assetsBackendApiService.abortAllCurrentAudioDownloads();
      expect(assetsBackendApiService.getAssetsFilesCurrentlyBeingRequested()
        .audio.length).toBe(0);
      expect(assetsBackendApiService.isCached('myfile.mp3')).toBe(false);
    });

  it('should successfully abort the download of the all the image files',
    function() {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      let requestUrl = urlInterpolationService.interpolateUrl(
        'assetsdevhandler/exploration/<exploration_id>/assets/image/<filename>',
        {
          exploration_id: '0',
          filename: 'myfile.png'
        });


      const req = httpTestingController.expectOne(requestUrl);
      expect(req.request.method).toEqual('GET');
      req.flush('image data');

      assetsBackendApiService.loadImage(
        ENTITY_TYPE.EXPLORATION, '0', 'myfile.png').then(
        successHandler, failHandler);

      expect(assetsBackendApiService.getAssetsFilesCurrentlyBeingRequested()
        .image.length).toBe(1);

      assetsBackendApiService.abortAllCurrentImageDownloads();
      expect(assetsBackendApiService.getAssetsFilesCurrentlyBeingRequested()
        .image.length).toBe(0);
      expect(assetsBackendApiService.isCached('myfile.png')).toBe(false);
    });

  it('should use the correct blob type for audio assets', function() {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let requestUrl = urlInterpolationService.interpolateUrl(
      '/assetsdevhandler/exploration/<exploration_id>/assets/audio/<filename>',
      {
        exploration_id: '0',
        filename: 'myfile.mp3'
      });

    const req = httpTestingController.expectOne(requestUrl);
    expect(req.request.method).toEqual('GET');
    req.flush('audio data');
    assetsBackendApiService.loadAudio('0', 'myfile.mp3').then(
      successHandler, failHandler);
    expect((assetsBackendApiService.getAssetsFilesCurrentlyBeingRequested())
      .audio.length).toBe(1);
    expect((assetsBackendApiService.getAssetsFilesCurrentlyBeingRequested())
      .audio.length).toBe(0);

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
    expect(successHandler.calls.first().args[0].data.type).toBe('audio/mpeg');
  });
});
