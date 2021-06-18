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
import { ClassroomData } from 'domain/classroom/classroom-data.model';
import { CreatorTopicSummaryBackendDict } from 'domain/topic/creator-topic-summary.model';

describe('Classroom backend API service', function() {
  let classroomBackendApiService:
    ClassroomBackendApiService = null;
  let httpTestingController: HttpTestingController;
  let firstTopicSummaryDict: CreatorTopicSummaryBackendDict = {
    id: 'topic1',
    name: 'Topic name',
    canonical_story_count: 4,
    subtopic_count: 5,
    total_skill_count: 20,
    total_published_node_count: 3,
    uncategorized_skill_count: 5,
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#C6DCDA',
    language_code: 'en',
    description: 'Topic description',
    version: 2,
    additional_story_count: 0,
    topic_model_created_on: 231241343,
    topic_model_last_updated: 3454354354,
    url_fragment: 'topic-name-one'
  };
  let secondTopicSummaryDict: CreatorTopicSummaryBackendDict = {
    id: 'topic2',
    name: 'Topic name 2',
    canonical_story_count: 3,
    subtopic_count: 2,
    total_skill_count: 10,
    total_published_node_count: 3,
    uncategorized_skill_count: 3,
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#C6DCDA',
    language_code: 'en',
    description: 'Topic description',
    version: 2,
    additional_story_count: 0,
    topic_model_created_on: 231241343,
    topic_model_last_updated: 3454354354,
    url_fragment: 'topic-name-two'
  };

  let responseDictionaries = {
    name: 'Math',
    topic_summary_dicts: [firstTopicSummaryDict, secondTopicSummaryDict],
    course_details: 'Course Details',
    topic_list_intro: 'Topics Covered'
  };

  let sampleClassroomDataObject = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    classroomBackendApiService = TestBed.get(ClassroomBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);

    // Sample topic object returnable from the backend.
    sampleClassroomDataObject = (
      ClassroomData.createFromBackendData(
        responseDictionaries.name,
        responseDictionaries.topic_summary_dicts,
        responseDictionaries.course_details,
        responseDictionaries.topic_list_intro));
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch classroom data from the backend',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      classroomBackendApiService.fetchClassroomDataAsync('math').then(
        successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/classroom_data_handler/math');
      expect(req.request.method).toEqual('GET');
      req.flush(responseDictionaries);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(sampleClassroomDataObject);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should use the fail handler for requests that cannot be processed',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      classroomBackendApiService.fetchClassroomDataAsync('0').then(
        successHandler, failHandler);

      let req = httpTestingController.expectOne('/classroom_data_handler/0');
      expect(req.request.method).toEqual('GET');
      req.flush('Invalid request', {
        status: 400,
        statusText: 'Invalid request'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    })
  );

  it('should work with successCallback set to a function',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      classroomBackendApiService.fetchClassroomDataAsync('0').then(
        successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/classroom_data_handler/0');
      expect(req.request.method).toEqual('GET');
      req.flush(responseDictionaries);
      flushMicrotasks();
      expect(successHandler).toHaveBeenCalledWith(sampleClassroomDataObject);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should handle successCallback for fetch classroom page is shown status',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      let service = classroomBackendApiService;
      service.fetchClassroomPromosAreEnabledStatusAsync().then(
        successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/classroom_promos_status_handler');
      expect(req.request.method).toEqual('GET');
      req.flush({classroom_promos_are_enabled: false});

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(false);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should handle errorCallback for fetch classroom page is shown status',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      let service = classroomBackendApiService;
      service.fetchClassroomPromosAreEnabledStatusAsync().then(
        successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/classroom_promos_status_handler');
      expect(req.request.method).toEqual('GET');
      req.flush('Invalid request', {
        status: 400,
        statusText: 'Invalid request'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    })
  );
});
