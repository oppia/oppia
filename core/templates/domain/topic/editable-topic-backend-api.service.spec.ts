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
 * @fileoverview Unit tests for EditableTopicBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { EditableTopicBackendApiService } from 'domain/topic/editable-topic-backend-api.service';
import { CsrfTokenService } from 'services/csrf-token.service';
import { TopicBackendDict } from 'domain/topic/TopicObjectFactory';

describe('Editable topic backend API service', () => {
  let httpTestingController: HttpTestingController;
  let editableTopicBackendApiService: EditableTopicBackendApiService;
  // Sample topic object returnable from the backend.
  let sampleDataResults = {
    topic_dict: {
      id: '0',
      name: 'Topic Name',
      description: 'Topic Description',
      version: '1',
      canonical_story_references: [{
        story_id: 'story_1',
        story_is_published: true
      }],
      additional_story_references: [{
        story_id: 'story_2',
        story_is_published: true
      }],
      uncategorized_skill_ids: ['skill_id_1'],
      subtopics: [],
      language_code: 'en'
    },
    canonical_story_summary_dicts: [{
      id: '0',
      title: 'Title',
      node_count: 1,
      story_is_published: false
    }],
    grouped_skill_summary_dicts: {},
    skill_id_to_description_dict: {
      skill_id_1: 'Description 1'
    },
    skill_id_to_rubrics_dict: {
      skill_id_1: []
    },
    classroom_url_fragment: 'math',
    skill_question_count_dict: {},
    subtopic_page: {
      id: 'topicId-1',
      topicId: 'topicId',
      page_contents: {
        subtitled_html: {
          html: '<p>Data</p>',
          content_id: 'content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {}
          }
        },
      },
      language_code: 'en'
    },
    skill_creation_is_allowed: true
  };
  let csrfService: CsrfTokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    httpTestingController = TestBed.get(HttpTestingController);
    editableTopicBackendApiService = TestBed.get(
      EditableTopicBackendApiService);
    csrfService = TestBed.get(CsrfTokenService);

    spyOn(csrfService, 'getTokenAsync').and.callFake(async() => {
      return Promise.resolve('sample-csrf-token');
    });
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch an existing topic from the backend',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      editableTopicBackendApiService.fetchTopicAsync('0').then(
        successHandler, failHandler);
      let req = httpTestingController.expectOne('/topic_editor_handler/data/0');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith({
        topicDict: sampleDataResults.topic_dict,
        skillIdToDescriptionDict:
          sampleDataResults.skill_id_to_description_dict,
        groupedSkillSummaries: sampleDataResults.grouped_skill_summary_dicts,
        skillIdToRubricsDict: sampleDataResults.skill_id_to_rubrics_dict,
        skillQuestionCountDict: sampleDataResults.skill_question_count_dict,
        classroomUrlFragment: sampleDataResults.classroom_url_fragment,
        skillCreationIsAllowed: true
      });
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it('should use the rejection handler if the backend request failed',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      editableTopicBackendApiService.fetchTopicAsync('1').then(
        successHandler, failHandler);
      let req = httpTestingController.expectOne('/topic_editor_handler/data/1');
      expect(req.request.method).toEqual('GET');
      req.flush('Error loading topic 1.', {
        status: 500,
        statusText: 'Error loading topic 1.'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading topic 1.');
    }));

  it('should successfully fetch an existing subtopic page from the backend',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      editableTopicBackendApiService.fetchSubtopicPageAsync('topicId', 1).then(
        successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/subtopic_page_editor_handler/data/topicId/1');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(
        sampleDataResults.subtopic_page);
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it('should use the rejection handler when fetching an existing subtopic' +
    ' page fails', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    editableTopicBackendApiService.fetchSubtopicPageAsync('topicId', 1).then(
      successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/subtopic_page_editor_handler/data/topicId/1');
    expect(req.request.method).toEqual('GET');
    req.flush('Error loading subtopic 1.', {
      status: 500,
      statusText: 'Error loading subtopic 1.'
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Error loading subtopic 1.');
  }));

  it('should update a topic after fetching it from the backend',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      // 'topic' is initialized before it's value is fetched from backend,
      // hence we need to do non-null assertion. For more information, see
      // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
      let topic!: TopicBackendDict;

      // Loading a topic the first time should fetch it from the backend.
      editableTopicBackendApiService.fetchTopicAsync('0').then(
        function(data) {
          topic = data.topicDict;
        });
      let req = httpTestingController.expectOne('/topic_editor_handler/data/0');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);

      flushMicrotasks();

      topic.name = 'New Name';
      topic.version = 2;
      let topicWrapper = {
        topic_dict: topic,
        skill_id_to_description_dict: {
          skill_id_1: 'Description 1'
        },
        skill_id_to_rubrics_dict: []
      };

      // Send a request to update topic.
      editableTopicBackendApiService.updateTopicAsync(
        topic.id, topic.version, 'Name is updated', []
      ).then(successHandler, failHandler);
      req = httpTestingController.expectOne('/topic_editor_handler/data/0');
      expect(req.request.method).toEqual('PUT');
      req.flush(topicWrapper);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith({
        topicDict: topic,
        skillIdToDescriptionDict: topicWrapper.skill_id_to_description_dict,
        skillIdToRubricsDict: topicWrapper.skill_id_to_rubrics_dict
      });
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it('should use the rejection handler if the topic to update doesn\'t exist',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      // Loading a topic the first time should fetch it from the backend.
      editableTopicBackendApiService.updateTopicAsync(
        '1', 1, 'Update an invalid topic.', []
      ).then(successHandler, failHandler);
      let req = httpTestingController.expectOne('/topic_editor_handler/data/1');
      expect(req.request.method).toEqual('PUT');
      req.flush('Topic with given id doesn\'t exist.', {
        status: 404,
        statusText: 'Topic with given id doesn\'t exist.'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Topic with given id doesn\'t exist.');
    }));

  it('should check if a topic name already exists',
    fakeAsync(() => {
      editableTopicBackendApiService.doesTopicWithNameExistAsync(
        'topic-name').then(topicNameExists => {
        expect(topicNameExists).toBeTrue();
      });
      let req = httpTestingController.expectOne(
        '/topic_name_handler/topic-name');
      expect(req.request.method).toEqual('GET');
      req.flush({
        topic_name_exists: true
      });

      flushMicrotasks();
    }));

  it('should use the rejection handler if the topic name already exists',
    fakeAsync(() => {
      editableTopicBackendApiService.doesTopicWithNameExistAsync(
        'topic-name').then(() => {}, error => {
        expect(error).toEqual('Error: Failed to check topic name.');
      });
      let req = httpTestingController.expectOne(
        '/topic_name_handler/topic-name');
      expect(req.request.method).toEqual('GET');
      req.flush('Error: Failed to check topic name.', {
        status: 500,
        statusText: 'Error: Failed to check topic name.'
      });

      flushMicrotasks();
    }));

  it('should check if a topic url fragment already exists',
    fakeAsync(() => {
      editableTopicBackendApiService.doesTopicWithUrlFragmentExistAsync(
        'topic-url-fragment').then(topicUrlFragmentExists => {
        expect(topicUrlFragmentExists).toBeTrue();
      });
      let req = httpTestingController.expectOne(
        '/topic_url_fragment_handler/topic-url-fragment');
      expect(req.request.method).toEqual('GET');
      req.flush({
        topic_url_fragment_exists: true
      });

      flushMicrotasks();
    }));

  it('should use the rejection handler if the url fragment already exists',
    fakeAsync(() => {
      editableTopicBackendApiService.doesTopicWithUrlFragmentExistAsync(
        'topic-url-fragment').then(() => {}, errorResponse => {
        expect(errorResponse.statusText).toEqual(
          'Error: Failed to check topic url fragment.');
      });
      let req = httpTestingController.expectOne(
        '/topic_url_fragment_handler/topic-url-fragment');
      expect(req.request.method).toEqual('GET');
      req.flush('Error: Failed to check topic url fragment.', {
        status: 500,
        statusText: 'Error: Failed to check topic url fragment.'
      });

      flushMicrotasks();
    }));

  it('should sucessfully fetch stories from a topic', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    editableTopicBackendApiService.fetchStoriesAsync('0').then(
      successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/topic_editor_story_handler/' + '0');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(
      sampleDataResults.canonical_story_summary_dicts);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use the rejection handler when fetching stories from a' +
    ' topic fails', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    editableTopicBackendApiService.fetchStoriesAsync('0').then(
      successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/topic_editor_story_handler/' + '0');
    expect(req.request.method).toEqual('GET');
    req.flush('Error loading story with id 0.', {
      status: 500,
      statusText: 'Error loading story with id 0.'
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Error loading story with id 0.');
  }));

  it('should sucessfully delete a topic', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    editableTopicBackendApiService.deleteTopicAsync('0').then(
      successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/topic_editor_handler/data/' + '0');
    expect(req.request.method).toEqual('DELETE');
    req.flush({
      status: 200
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(200);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use the rejection handler when deleting a topic fails',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      editableTopicBackendApiService.deleteTopicAsync('1').then(
        successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/topic_editor_handler/data/' + '1');
      expect(req.request.method).toEqual('DELETE');
      req.flush('Error deleting topic 1.', {
        status: 500,
        statusText: 'Error deleting topic 1.'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error deleting topic 1.');
    }));

  it('should sucessfully get topic id to topic name', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    editableTopicBackendApiService.getTopicIdToTopicNameAsync(
      ['topicId']).then(successHandler, failHandler);
    const topicIdToTopicName = {
      topicId: 'topicName'
    };

    let req = httpTestingController.expectOne(
      '/topic_id_to_topic_name_handler/?comma_separated_topic_ids=topicId');
    expect(req.request.method).toEqual('GET');
    req.flush({
      topic_id_to_topic_name: topicIdToTopicName
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(topicIdToTopicName);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use the rejection handler for getting topic id to topic name',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      editableTopicBackendApiService.getTopicIdToTopicNameAsync(
        ['topicId']).then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/topic_id_to_topic_name_handler/?comma_separated_topic_ids=topicId');
      expect(req.request.method).toEqual('GET');

      req.flush({
        error: 'Error in fetching topic id to topic name count.'
      }, {
        status: 400, statusText: 'Invalid request'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Error in fetching topic id to topic name count.');
    }));
});
