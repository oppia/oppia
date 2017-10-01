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
  var $httpBackend = null;
  var $rootScope = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    AssetsBackendApiService = $injector.get(
      'AssetsBackendApiService');
    UrlInterpolationService = $injector.get(
      'UrlInterpolationService');
    $httpBackend = $injector.get('$httpBackend');
    $rootScope = $injector.get('$rootScope');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
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
    $httpBackend.flush();

    expect(AssetsBackendApiService.isCached('myfile.mp3')).toBe(true);
    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('Should call the provided failure handler on HTTP failure', function() {
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
  });
});
