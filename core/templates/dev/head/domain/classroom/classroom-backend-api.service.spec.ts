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
 * @fileoverview Unit tests for ClassroomBackendApiService.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { TopicSummaryObjectFactory } from
  'domain/topic/TopicSummaryObjectFactory';
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('domain/classroom/classroom-backend-api.service.ts');

describe('Classroom backend API service', function() {
  var ClassroomBackendApiService = null;
  var responseDictionaries = null;
  var sampleDataResultsObjects = null;
  var $rootScope = null;
  var $scope = null;
  var $httpBackend = null;
  var UndoRedoService = null;
  var topicSummaryObjectFactory = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector) {
    ClassroomBackendApiService = $injector.get(
      'ClassroomBackendApiService');
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $httpBackend = $injector.get('$httpBackend');
    topicSummaryObjectFactory = $injector.get('TopicSummaryObjectFactory');

    // Sample topic object returnable from the backend
    responseDictionaries = {
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

    // Sample topic object returnable from the backend
    sampleDataResultsObjects = {
      topic_summary_objects: [
        topicSummaryObjectFactory.createFromBackendDict(
          responseDictionaries.topic_summary_dicts[0]),
        topicSummaryObjectFactory.createFromBackendDict(
          responseDictionaries.topic_summary_dicts[1])
      ]
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
        responseDictionaries);
      ClassroomBackendApiService.fetchClassroomData('0').then(
        successHandler, failHandler);
      $httpBackend.flush();

      expect(successHandler).toHaveBeenCalledWith(
        sampleDataResultsObjects.topic_summary_objects);
      expect(failHandler).not.toHaveBeenCalled();
    }
  );
});
