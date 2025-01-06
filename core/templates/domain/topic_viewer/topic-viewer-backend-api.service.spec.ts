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

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {
  ReadOnlyTopic,
  ReadOnlyTopicBackendDict,
  ReadOnlyTopicObjectFactory,
} from 'domain/topic_viewer/read-only-topic-object.factory';
import {TopicViewerBackendApiService} from 'domain/topic_viewer/topic-viewer-backend-api.service';

describe('Topic viewer backend API service', () => {
  let topicViewerBackendApiService: TopicViewerBackendApiService;
  let httpTestingController: HttpTestingController;
  let sampleDataResultsObjects: ReadOnlyTopic;
  let sampleDataResults: ReadOnlyTopicBackendDict;
  let readOnlyTopicObjectFactory: ReadOnlyTopicObjectFactory;

  beforeEach(() => {
    readOnlyTopicObjectFactory = new ReadOnlyTopicObjectFactory();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    topicViewerBackendApiService = TestBed.inject(TopicViewerBackendApiService);
    readOnlyTopicObjectFactory = TestBed.inject(ReadOnlyTopicObjectFactory);

    let nodeDict = {
      id: 'node_1',
      thumbnail_filename: 'image.png',
      title: 'Title 1',
      description: 'Description 1',
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2'],
      destination_node_ids: ['node_2'],
      outline: 'Outline',
      exploration_id: null,
      outline_is_finalized: false,
      thumbnail_bg_color: '#a33f40',
      status: 'Published',
      planned_publication_date_msecs: 100.0,
      last_modified_msecs: 100.0,
      first_publication_date_msecs: 200.0,
      unpublishing_reason: null,
    };

    // Sample topic object returnable from the backend.
    sampleDataResults = {
      topic_name: 'topic_name',
      topic_id: 'topic_id',
      topic_description: 'Topic description',
      canonical_story_dicts: [
        {
          id: '0',
          title: 'Story Title',
          description: 'Story Description',
          node_titles: ['Chapter 1'],
          thumbnail_filename: 'image.svg',
          thumbnail_bg_color: '#F8BF74',
          story_is_published: true,
          url_fragment: 'story-title',
          completed_node_titles: ['Chapter 1'],
          all_node_dicts: [nodeDict],
        },
      ],
      additional_story_dicts: [
        {
          id: '1',
          title: 'Story Title',
          description: 'Story Description',
          node_titles: ['Chapter 1'],
          thumbnail_filename: 'image.svg',
          thumbnail_bg_color: '#F8BF74',
          story_is_published: true,
          completed_node_titles: ['Chapter 1'],
          url_fragment: 'story-title-one',
          all_node_dicts: [nodeDict],
        },
      ],
      uncategorized_skill_ids: ['skill_id_1'],
      subtopics: [
        {
          skill_ids: ['skill_id_2'],
          id: 1,
          title: 'subtopic_name',
          thumbnail_filename: 'image.svg',
          thumbnail_bg_color: '#F8BF74',
          url_fragment: 'subtopic-name',
        },
      ],
      degrees_of_mastery: {
        skill_id_1: 0.5,
        skill_id_2: 0.3,
      },
      skill_descriptions: {
        skill_id_1: 'Skill Description 1',
        skill_id_2: 'Skill Description 2',
      },
      practice_tab_is_displayed: false,
      meta_tag_content: 'Topic meta tag content',
      page_title_fragment_for_web: 'topic page title',
      classroom_name: 'math',
    };

    sampleDataResultsObjects =
      readOnlyTopicObjectFactory.createFromBackendDict(sampleDataResults);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch an existing topic from the backend', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');
    topicViewerBackendApiService
      .fetchTopicDataAsync('0', 'staging')
      .then(successHandler, failHandler);
    const req = httpTestingController.expectOne(
      '/topic_data_handler/staging/0'
    );
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(sampleDataResultsObjects);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use rejection handler if backend request failed', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');
    topicViewerBackendApiService
      .fetchTopicDataAsync('0', 'staging')
      .then(successHandler, failHandler);
    const req = httpTestingController.expectOne(
      '/topic_data_handler/staging/0'
    );
    expect(req.request.method).toEqual('GET');
    req.flush(
      {
        error: 'Error fetching topic 0.',
      },
      {
        status: 500,
        statusText: 'Error fetching topic 0.',
      }
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Error fetching topic 0.');
  }));
});
