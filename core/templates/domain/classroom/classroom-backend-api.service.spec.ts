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
import { ClassroomDomainConstants } from 'domain/classroom/classroom-domain.constants';

describe('Classroom backend API service', function() {
  let classroomBackendApiService: ClassroomBackendApiService;
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
    url_fragment: 'topic-name-one',
    can_edit_topic: false,
    is_published: false,
    total_upcoming_chapters_count: 1,
    total_overdue_chapters_count: 1,
    total_chapter_counts_for_each_story: [5, 4],
    published_chapter_counts_for_each_story: [3, 4]
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
    url_fragment: 'topic-name-two',
    can_edit_topic: false,
    is_published: false,
    total_upcoming_chapters_count: 1,
    total_overdue_chapters_count: 1,
    total_chapter_counts_for_each_story: [5, 4],
    published_chapter_counts_for_each_story: [3, 4]
  };

  let responseDictionaries = {
    name: 'Math',
    topic_summary_dicts: [firstTopicSummaryDict, secondTopicSummaryDict],
    course_details: 'Course Details',
    topic_list_intro: 'Topics Covered'
  };

  let sampleClassroomDataObject: ClassroomData;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    classroomBackendApiService = TestBed.inject(ClassroomBackendApiService);
    httpTestingController = TestBed.inject(HttpTestingController);

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

  it('should create new classroom id', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let service = classroomBackendApiService;

    service.getNewClassroomIdAsync().then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/new_classroom_id_handler');
    expect(req.request.method).toEqual('GET');
    req.flush({classroom_id: 'classroomId'});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith('classroomId');
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it(
    'should handle errorcallback while getting new classroom id',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let service = classroomBackendApiService;

      service.getNewClassroomIdAsync().then(successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/new_classroom_id_handler');
      expect(req.request.method).toEqual('GET');

      req.flush('Invalid request', {
        status: 400,
        statusText: 'Invalid request'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }));

  it('should get all classroom id to classroom name dict', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let service = classroomBackendApiService;

    service.getAllClassroomIdToClassroomNameDictAsync().then(
      successHandler, failHandler);
    let req = httpTestingController.expectOne(
      ClassroomDomainConstants.CLASSROOM_ID_TO_NAME_HANDLER_URL_TEMPLATE);
    expect(req.request.method).toEqual('GET');

    let classroomIdToClassroomNameDict = {
      math_classroom_id: 'math',
      physics_classroom_id: 'physics'
    };
    req.flush({
      classroom_id_to_classroom_name: classroomIdToClassroomNameDict
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(
      classroomIdToClassroomNameDict);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it(
    'should handle errorcallbask while fetching classroom id to ' +
    'classroom name dict', fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let service = classroomBackendApiService;

      service.getAllClassroomIdToClassroomNameDictAsync().then(
        successHandler, failHandler);
      let req = httpTestingController.expectOne(
        ClassroomDomainConstants.CLASSROOM_ID_TO_NAME_HANDLER_URL_TEMPLATE);
      expect(req.request.method).toEqual('GET');

      req.flush('Invalid request', {
        status: 400,
        statusText: 'Invalid request'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }));

  it('should be able to get the classroom data', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let service = classroomBackendApiService;
    let classroomId = 'math_classroom_id';
    let classroomBackendDict = {
      classroom_id: 'math_classroom_id',
      name: 'math',
      url_fragment: 'math',
      course_details: 'Curated math foundations course.',
      topic_list_intro: 'Start from the basics with our first topic.',
      topic_id_to_prerequisite_topic_ids: {}
    };
    let expectedClassroomDict = {
      classroomId: 'math_classroom_id',
      name: 'math',
      urlFragment: 'math',
      courseDetails: 'Curated math foundations course.',
      topicListIntro: 'Start from the basics with our first topic.',
      topicIdToPrerequisiteTopicIds: {}
    };

    service.getClassroomDataAsync(classroomId).then(
      successHandler, failHandler);
    let req = httpTestingController.expectOne('/classroom/math_classroom_id');
    expect(req.request.method).toEqual('GET');

    req.flush({classroom_dict: classroomBackendDict});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(
      {classroomDict: expectedClassroomDict}
    );
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it(
    'should handle errorcallback while getting classroom data',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let service = classroomBackendApiService;
      let classroomId = 'math_classroom_id';

      service.getClassroomDataAsync(classroomId).then(
        successHandler, failHandler);
      let req = httpTestingController.expectOne('/classroom/math_classroom_id');
      expect(req.request.method).toEqual('GET');

      req.flush('Invalid request', {
        status: 400,
        statusText: 'Invalid request'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }));

  it('should be able to update classroom data', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let service = classroomBackendApiService;
    let classroomId = 'math_classroom_id';
    let classroomBackendDict = {
      classroom_id: 'math_classroom_id',
      name: 'math',
      url_fragment: 'math',
      course_details: 'Curated math foundations course.',
      topic_list_intro: 'Start from the basics with our first topic.',
      topic_id_to_prerequisite_topic_ids: {}
    };
    let payload = {
      classroom_dict: classroomBackendDict
    };

    service.updateClassroomDataAsync(classroomId, classroomBackendDict).then(
      successHandler, failHandler);
    let req = httpTestingController.expectOne('/classroom/math_classroom_id');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(payload);

    req.flush(
      { status: 200, statusText: 'Success.'});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it(
    'should handle errorcallback while updating classroom data',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let service = classroomBackendApiService;
      let classroomId = 'math_classroom_id';
      let classroomBackendDict = {
        classroom_id: 'math_classroom_id',
        name: 'math',
        url_fragment: 'math',
        course_details: 'Curated math foundations course.',
        topic_list_intro: 'Start from the basics with our first topic.',
        topic_id_to_prerequisite_topic_ids: {}
      };
      let payload = {
        classroom_dict: classroomBackendDict
      };

      service.updateClassroomDataAsync(classroomId, classroomBackendDict).then(
        successHandler, failHandler);
      let req = httpTestingController.expectOne('/classroom/math_classroom_id');
      expect(req.request.method).toEqual('PUT');
      expect(req.request.body).toEqual(payload);

      req.flush('Invalid request', {
        status: 400,
        statusText: 'Invalid request'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }));

  it('should be able to delete classroom', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let service = classroomBackendApiService;
    let classroomId = 'math_classroom_id';

    service.deleteClassroomAsync(classroomId).then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/classroom/math_classroom_id');
    expect(req.request.method).toEqual('DELETE');

    req.flush(
      { status: 200, statusText: 'Success.'});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should handle errorcallback while deleting classroom', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let service = classroomBackendApiService;
    let classroomId = 'math_classroom_id';

    service.deleteClassroomAsync(classroomId).then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/classroom/math_classroom_id');
    expect(req.request.method).toEqual('DELETE');

    req.flush('Invalid request', {
      status: 400,
      statusText: 'Invalid request'
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should check if a classroom url fragment already exists',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      classroomBackendApiService.doesClassroomWithUrlFragmentExistAsync(
        'classroom-url-fragment').then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/classroom_url_fragment_handler/classroom-url-fragment');
      expect(req.request.method).toEqual('GET');
      req.flush({
        classroom_url_fragment_exists: true
      });

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it('should use the rejection handler if the url fragment already exists',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      classroomBackendApiService.doesClassroomWithUrlFragmentExistAsync(
        'classroom-url-fragment').then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/classroom_url_fragment_handler/classroom-url-fragment');
      expect(req.request.method).toEqual('GET');
      req.flush('Error: Failed to check classroom url fragment.', {
        status: 500,
        statusText: 'Error: Failed to check classroom url fragment.'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }));

  it('should be able to get classroom id', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let service = classroomBackendApiService;

    service.getClassroomIdAsync('math').then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/classroom_id_handler/math');
    expect(req.request.method).toEqual('GET');
    req.flush({classroom_id: 'classroomId'});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith('classroomId');
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it(
    'should handle errorcallback while getting the classroom id',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let service = classroomBackendApiService;

      service.getClassroomIdAsync('math').then(successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/classroom_id_handler/math');
      expect(req.request.method).toEqual('GET');

      req.flush('Invalid request', {
        status: 400,
        statusText: 'Invalid request'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }));
});
