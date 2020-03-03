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

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { ClassroomBackendApiService } from
  'domain/classroom/classroom-backend-api.service';
import { TopicSummaryObjectFactory } from
  'domain/topic/TopicSummaryObjectFactory';

describe('Classroom backend API service', function() {
  let classroomBackendApiService:
    ClassroomBackendApiService = null;
  let httpTestingController: HttpTestingController;
  let topicSummaryObjectFactory:
    TopicSummaryObjectFactory = null;
  let responseDictionaries = {
    topic_summary_dicts: [{
      id: 'sample_topic_id_1',
      name: 'Topic Name 1',
      subtopicCount: 5,
      canonicalStoryCount: 4,
      totalSkillCount: 10,
      uncategorizedSkillCount: 3,
      additionalStoryCount: 1,
      topicModelCreatedOn: 100001515,
      topicModelLastUpdated: 5454542545,
      version: 1,
      languageCode: 'en'
    }, {
      id: 'sample_topic_id_2',
      name: 'Topic Name 2',
      subtopicCount: 1,
      canonicalStoryCount: 2,
      totalSkillCount: 3,
      uncategorizedSkillCount: 3,
      additionalStoryCount: 1,
      topicModelCreatedOn: 151554845,
      topicModelLastUpdated: 4542545,
      version: 1,
      languageCode: 'en'
    }]
  };
  let sampleDataResultsObjects = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    classroomBackendApiService = TestBed.get(ClassroomBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
    topicSummaryObjectFactory = TestBed.get(TopicSummaryObjectFactory);

    // Sample topic object returnable from the backend
    sampleDataResultsObjects = {
      topic_summary_objects: [
        topicSummaryObjectFactory.createFromBackendDict(
          responseDictionaries.topic_summary_dicts[0]),
        topicSummaryObjectFactory.createFromBackendDict(
          responseDictionaries.topic_summary_dicts[1])
      ]
    };
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch classroom data from the backend',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      classroomBackendApiService.fetchClassroomData('0').then(
        successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/classroom_data_handler/0');
      expect(req.request.method).toEqual('GET');
      req.flush(responseDictionaries);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(
        sampleDataResultsObjects.topic_summary_objects);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );
});
