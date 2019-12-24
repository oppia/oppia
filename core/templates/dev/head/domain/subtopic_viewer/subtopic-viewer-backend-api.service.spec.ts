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

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.
import { TestBed } from '@angular/core/testing';
require('domain/subtopic_viewer/subtopic-viewer-backend-api.service.ts');

import { ReadOnlySubtopicPageObjectFactory } from
  'domain/subtopic_viewer/ReadOnlySubtopicPageObjectFactory';

describe('Subtopic viewer backend API service', function() {
  var SubtopicViewerBackendApiService = null;
  var sampleDataResults = null;
  var $rootScope = null;
  var $scope = null;
  var $httpBackend = null;
  var UndoRedoService = null;
  var sampleDataResultsObjects = null;
  let readOnlySubtopicPageObjectFactory: ReadOnlySubtopicPageObjectFactory =
    null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector) {
    SubtopicViewerBackendApiService = $injector.get(
      'SubtopicViewerBackendApiService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');
    readOnlySubtopicPageObjectFactory = TestBed.get(
      ReadOnlySubtopicPageObjectFactory);

    // Sample subtopic page contents object returnable from the backend
    sampleDataResults = {
      subtopic_title: 'Subtopic Title',
      page_contents: {
        subtitled_html: {
          html: 'test content',
          content_id: 'content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {
              en: {
                filename: 'test.mp3',
                file_size_bytes: 100,
                needs_update: false
              }
            }
          }
        }
      }
    };

    sampleDataResultsObjects = readOnlySubtopicPageObjectFactory.
      createFromBackendDict(sampleDataResults);
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch an existing subtopic from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/subtopic_data_handler/topic/0').respond(
        sampleDataResults);
      SubtopicViewerBackendApiService.fetchSubtopicData('topic', '0').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(sampleDataResultsObjects);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );

  it('should use the rejection handler if the backend request failed',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect(
        'GET', '/subtopic_data_handler/topic/0').respond(
        500, 'Error loading subtopic.');
      SubtopicViewerBackendApiService.fetchSubtopicData('topic', '0').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading subtopic.');
    }
  );
});
