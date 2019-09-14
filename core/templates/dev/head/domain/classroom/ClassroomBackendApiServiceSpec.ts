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
 * @fileoverview Unit tests for TopicViewerBackendApiService.
 */

require('domain/classroom/ClassroomBackendApiService.ts');

describe('Classroom backend API service', function() {
  var ClassroomBackendApiService = null;
  var sampleDataResults = null;
  var $rootScope = null;
  var $scope = null;
  var $httpBackend = null;
  var UndoRedoService = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    ClassroomBackendApiService = $injector.get(
      'ClassroomBackendApiService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');

    // Sample topic object returnable from the backend
    sampleDataResults = {
      topic_summary_dicts: [{
        name: 'Topic name',
        description: 'Topic description',
        canonical_story_count: 4,
        subtopic_count: 5,
        total_skill_count: 20,
        uncategorized_skill_count: 5
      }, {
        name: 'Topic name 2',
        description: 'Topic description 2',
        canonical_story_count: 3,
        subtopic_count: 2,
        total_skill_count: 10,
        uncategorized_skill_count: 3
      }]
    };
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully fetch classroom data from the backend',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expect('GET', '/classroom_data_handler/0').respond(
        sampleDataResults);
      ClassroomBackendApiService.fetchClassroomData('0').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(
        sampleDataResults.topic_summary_dicts);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );
});
