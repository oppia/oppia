// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for SubtopicViewerBackendApiService.
 */

describe('Subtopic viewer backend API service', function() {
  var SubtopicViewerBackendApiService = null;
  var sampleResponse = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    SubtopicViewerBackendApiService = $injector.get(
      'SubtopicViewerBackendApiService');
    $httpBackend = $injector.get('$httpBackend');
    sampleResponse = {
      subtopic_html_data: '<p>Subtopic Html</p>',
      language_code: 'en'
    };
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch the subtopic data', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    var requestUrl = UrlInterpolationService.interpolateUrl(
      '/subtopic_viewer_handler/data/<topic_id>/<subtopic_id>', {
        topic_id: 'abcdefghijkl',
        subtopic_id: '0'
      });
    $httpBackend.expect('GET', requestUrl).respond(201, sampleResponse);
    SubtopicViewerBackendApiService.fetchSubtopicData(
      'abcdefghijkl', '0').then(successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).toHaveBeenCalledWith(sampleResponse);
    expect(failHandler).not.toHaveBeenCalled();
  });

  it('should use the fail handler if the request fails', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    var requestUrl = UrlInterpolationService.interpolateUrl(
      '/subtopic_viewer_handler/data/<topic_id>/<subtopic_id>', {
        topic_id: 'abcdefghijkl',
        subtopic_id: '0'
      });
    $httpBackend.expect('GET', requestUrl).respond(500, 'Error');
    SubtopicViewerBackendApiService.fetchSubtopicData(
      'abcdefghijkl', '0').then(successHandler, failHandler);
    $httpBackend.flush();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  });
});
