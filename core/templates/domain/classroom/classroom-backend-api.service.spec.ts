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

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';
import {ClassroomData} from 'domain/classroom/classroom-data.model';
import {CreatorTopicSummaryBackendDict} from 'domain/topic/creator-topic-summary.model';
import {ClassroomDomainConstants} from 'domain/classroom/classroom-domain.constants';

describe('Classroom backend API service', function () {
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
    published_chapter_counts_for_each_story: [3, 4],
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
    published_chapter_counts_for_each_story: [3, 4],
  };

  let responseDictionaries = {
    classroom_id: 'mathid',
    name: 'Math',
    url_fragment: 'math',
    topic_summary_dicts: [firstTopicSummaryDict, secondTopicSummaryDict],
    course_details: 'Course Details',
    topic_list_intro: 'Topics Covered',
    is_published: true,
    is_diagnostic_test_enabled: false,
    teaser_text: 'learn math',
    thumbnail_data: {
      filename: 'thumbnail.svg',
      size_in_bytes: 1000,
      bg_color: 'transparent',
    },
    banner_data: {
      filename: 'banner.png',
      size_in_bytes: 1000,
      bg_color: 'transparent',
    },
    public_classrooms_count: 1,
  };
  let classroomBackendDict = {
    classroom_id: 'math_classroom_id',
    name: 'math',
    url_fragment: 'math',
    course_details: 'Curated math foundations course.',
    topic_list_intro: 'Start from the basics with our first topic.',
    topic_id_to_prerequisite_topic_ids: {},
    teaser_text: 'Teaser text of the classroom',
    is_published: true,
    is_diagnostic_test_enabled: false,
    thumbnail_data: {
      filename: 'thumbnail.svg',
      bg_color: 'transparent',
      size_in_bytes: 1000,
    },
    banner_data: {
      filename: 'banner.svg',
      bg_color: 'transparent',
      size_in_bytes: 1000,
    },
  };
  let sampleClassroomDataObject: ClassroomData;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    classroomBackendApiService = TestBed.inject(ClassroomBackendApiService);
    httpTestingController = TestBed.inject(HttpTestingController);

    // Sample topic object returnable from the backend.
    sampleClassroomDataObject = ClassroomData.createFromBackendData(
      responseDictionaries.classroom_id,
      responseDictionaries.name,
      responseDictionaries.url_fragment,
      responseDictionaries.topic_summary_dicts,
      responseDictionaries.course_details,
      responseDictionaries.topic_list_intro,
      responseDictionaries.teaser_text,
      responseDictionaries.is_published,
      responseDictionaries.is_diagnostic_test_enabled,
      responseDictionaries.thumbnail_data,
      responseDictionaries.banner_data,
      responseDictionaries.public_classrooms_count
    );
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch classroom data from the backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    classroomBackendApiService
      .fetchClassroomDataAsync('math')
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/classroom_data_handler/math');
    expect(req.request.method).toEqual('GET');
    req.flush(responseDictionaries);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(sampleClassroomDataObject);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use the fail handler for requests that cannot be processed', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    classroomBackendApiService
      .fetchClassroomDataAsync('0')
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/classroom_data_handler/0');
    expect(req.request.method).toEqual('GET');
    req.flush('Invalid request', {
      status: 400,
      statusText: 'Invalid request',
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should work with successCallback set to a function', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    classroomBackendApiService
      .fetchClassroomDataAsync('0')
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/classroom_data_handler/0');
    expect(req.request.method).toEqual('GET');
    req.flush(responseDictionaries);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(sampleClassroomDataObject);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should create new classroom id', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let service = classroomBackendApiService;

    service.getNewClassroomIdAsync().then(successHandler, failHandler);
    let req = httpTestingController.expectOne('/new_classroom_id_handler');
    expect(req.request.method).toEqual('GET');
    req.flush({classroom_id: 'classroomId'});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith('classroomId');
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should handle errorcallback while getting new classroom id', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let service = classroomBackendApiService;

    service.getNewClassroomIdAsync().then(successHandler, failHandler);
    let req = httpTestingController.expectOne('/new_classroom_id_handler');
    expect(req.request.method).toEqual('GET');

    req.flush('Invalid request', {
      status: 400,
      statusText: 'Invalid request',
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should get all classroom id to name and index mappings', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let service = classroomBackendApiService;

    service
      .getAllClassroomDisplayInfoDictAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      ClassroomDomainConstants.CLASSROOM_DISPLAY_INFO_HANDLER_URL_TEMPLATE
    );
    expect(req.request.method).toEqual('GET');

    let classroomDisplayInfoDicts = [
      {
        classroom_id: 'math_classroom_id',
        classroom_name: 'math',
        classroom_index: 1,
      },
      {
        classroom_id: 'physics_classroom_id',
        classroom_name: 'physics',
        classroom_index: 2,
      },
    ];

    req.flush({
      classroom_display_info: classroomDisplayInfoDicts,
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(classroomDisplayInfoDicts);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it(
    'should handle errorcallbask while fetching classroom id to ' +
      'classroom name dict',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let service = classroomBackendApiService;

      service
        .getAllClassroomDisplayInfoDictAsync()
        .then(successHandler, failHandler);
      let req = httpTestingController.expectOne(
        ClassroomDomainConstants.CLASSROOM_DISPLAY_INFO_HANDLER_URL_TEMPLATE
      );
      expect(req.request.method).toEqual('GET');

      req.flush('Invalid request', {
        status: 400,
        statusText: 'Invalid request',
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    })
  );

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
      teaser_text: 'Learn math',
      topic_list_intro: 'Start from the basics with our first topic.',
      topic_id_to_prerequisite_topic_ids: {},
      is_published: true,
      is_diagnostic_test_enabled: false,
      thumbnail_data: {
        filename: 'thumbnail.svg',
        bg_color: 'transparent',
        size_in_bytes: 1000,
      },
      banner_data: {
        filename: 'banner.png',
        bg_color: 'transparent',
        size_in_bytes: 1000,
      },
    };
    let expectedClassroomDict = {
      classroomId: 'math_classroom_id',
      name: 'math',
      urlFragment: 'math',
      courseDetails: 'Curated math foundations course.',
      teaserText: 'Learn math',
      topicListIntro: 'Start from the basics with our first topic.',
      topicIdToPrerequisiteTopicIds: {},
      isPublished: true,
      isDiagnosticTestEnabled: false,
      thumbnailData: {
        filename: 'thumbnail.svg',
        bg_color: 'transparent',
        size_in_bytes: 1000,
      },
      bannerData: {
        filename: 'banner.png',
        bg_color: 'transparent',
        size_in_bytes: 1000,
      },
    };

    service
      .getClassroomDataAsync(classroomId)
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne('/classroom/math_classroom_id');
    expect(req.request.method).toEqual('GET');

    req.flush({classroom_dict: classroomBackendDict});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith({
      classroomDict: expectedClassroomDict,
    });
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should handle errorcallback while getting classroom data', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let service = classroomBackendApiService;
    let classroomId = 'math_classroom_id';

    service
      .getClassroomDataAsync(classroomId)
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne('/classroom/math_classroom_id');
    expect(req.request.method).toEqual('GET');

    req.flush('Invalid request', {
      status: 400,
      statusText: 'Invalid request',
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
    let form = new FormData();
    form.append(
      'payload',
      JSON.stringify({classroom_dict: classroomBackendDict})
    );
    form.append('thumbnail_image', new Blob());
    form.append('banner_image', new Blob());

    service
      .updateClassroomDataAsync(classroomId, classroomBackendDict)
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne('/classroom/math_classroom_id');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(form);

    req.flush({status: 200, statusText: 'Success.'});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should handle errorcallback while updating classroom data', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let service = classroomBackendApiService;
    let classroomId = 'math_classroom_id';
    let form = new FormData();
    form.append(
      'payload',
      JSON.stringify({classroom_dict: classroomBackendDict})
    );
    form.append('thumbnail_image', new Blob());
    form.append('banner_image', new Blob());

    service
      .updateClassroomDataAsync(classroomId, classroomBackendDict)
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne('/classroom/math_classroom_id');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(form);

    req.flush('Invalid request', {
      status: 400,
      statusText: 'Invalid request',
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should be able to create a new classroom', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let service = classroomBackendApiService;
    let classroomId = 'history_classroom_id';
    let classroomName = 'history';
    let classroomUrlFragment = 'history';
    let result = {new_classroom_id: classroomId};

    service
      .createNewClassroomAsync(classroomName, classroomUrlFragment)
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne('/classroom_admin/create_new');
    expect(req.request.method).toEqual('POST');

    req.flush(
      {new_classroom_id: classroomId},
      {status: 200, statusText: 'Success.'}
    );

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(result);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should fail to create a new classroom', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let service = classroomBackendApiService;
    let classroomName = '';
    let classroomUrlFragment = 'history';

    service
      .createNewClassroomAsync(classroomName, classroomUrlFragment)
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne('/classroom_admin/create_new');
    expect(req.request.method).toEqual('POST');

    req.flush(
      {error: 'name field should not be empty'},
      {status: 400, statusText: 'Bad Request'}
    );

    flushMicrotasks();
    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('name field should not be empty');
  }));

  it('should be able to delete classroom', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let service = classroomBackendApiService;
    let classroomId = 'math_classroom_id';

    service.deleteClassroomAsync(classroomId).then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/classroom/math_classroom_id');
    expect(req.request.method).toEqual('DELETE');

    req.flush({status: 200, statusText: 'Success.'});

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
      statusText: 'Invalid request',
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should check if a classroom url fragment already exists', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    classroomBackendApiService
      .doesClassroomWithUrlFragmentExistAsync('classroom-url-fragment')
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/classroom_url_fragment_handler/classroom-url-fragment'
    );
    expect(req.request.method).toEqual('GET');
    req.flush({
      classroom_url_fragment_exists: true,
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use the rejection handler if the url fragment already exists', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    classroomBackendApiService
      .doesClassroomWithUrlFragmentExistAsync('classroom-url-fragment')
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/classroom_url_fragment_handler/classroom-url-fragment'
    );
    expect(req.request.method).toEqual('GET');
    req.flush('Error: Failed to check classroom url fragment.', {
      status: 500,
      statusText: 'Error: Failed to check classroom url fragment.',
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
    let req = httpTestingController.expectOne('/classroom_id_handler/math');
    expect(req.request.method).toEqual('GET');
    req.flush({classroom_id: 'classroomId'});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith('classroomId');
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should handle errorcallback while getting the classroom id', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let service = classroomBackendApiService;

    service.getClassroomIdAsync('math').then(successHandler, failHandler);
    let req = httpTestingController.expectOne('/classroom_id_handler/math');
    expect(req.request.method).toEqual('GET');

    req.flush('Invalid request', {
      status: 400,
      statusText: 'Invalid request',
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should be able to get topics and classroom relation', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let service = classroomBackendApiService;

    service.getAllTopicsToClassroomRelation().then(successHandler, failHandler);
    let req = httpTestingController.expectOne('/topics_to_classrooms_relation');
    expect(req.request.method).toEqual('GET');
    req.flush({
      topics_to_classrooms_relation: [
        {
          topic_name: 'topic1',
          topic_id: 'topic1',
          classroom_name: 'math',
          classroom_url_fragment: 'math',
        },
      ],
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should handle errorcallback while getting topics and classroom relation', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let service = classroomBackendApiService;

    service.getAllTopicsToClassroomRelation().then(successHandler, failHandler);
    let req = httpTestingController.expectOne('/topics_to_classrooms_relation');
    expect(req.request.method).toEqual('GET');
    req.flush('Invalid request', {
      status: 400,
      statusText: 'Invalid request',
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should be able to get summary of all classrooms', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let service = classroomBackendApiService;

    service.getAllClassroomsSummaryAsync().then(successHandler, failHandler);
    let req = httpTestingController.expectOne('/all_classrooms_summary');
    expect(req.request.method).toEqual('GET');
    req.flush({
      all_classrooms_summary: [
        {
          classroom_id: 'mathclassroom',
          name: 'math',
          url_fragment: 'math',
          teaser_text: 'math teaser text',
          is_published: true,
          thumbnail_filename: 'thumbnail.svg',
          thumbnail_bg_color: 'transparent',
        },
      ],
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should handle errorcallback while getting classroom summaries', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let service = classroomBackendApiService;

    service.getAllClassroomsSummaryAsync().then(successHandler, failHandler);
    let req = httpTestingController.expectOne('/all_classrooms_summary');
    expect(req.request.method).toEqual('GET');
    req.flush('Invalid request', {
      status: 400,
      statusText: 'Invalid request',
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should update classroom index mappings successfully', fakeAsync(() => {
    const mappings = [
      {classroomId: 'classroom_1', classroomName: 'Math', classroomIndex: 1},
      {classroomId: 'classroom_2', classroomName: 'Science', classroomIndex: 2},
    ];
    let service = classroomBackendApiService;
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    service
      .updateClassroomIndexMappingAsync(mappings)
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne('/update_classrooms_order');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body instanceof FormData).toBeTrue();

    req.flush(null);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should handle error during classroom index mappings update', fakeAsync(() => {
    const mappings = [
      {classroomId: 'classroom_1', classroomName: 'Math', classroomIndex: 1},
    ];
    let service = classroomBackendApiService;
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    service
      .updateClassroomIndexMappingAsync(mappings)
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne('/update_classrooms_order');
    expect(req.request.method).toEqual('PUT');

    req.flush('Invalid request', {
      status: 400,
      statusText: 'Invalid request',
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));
});
