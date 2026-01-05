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

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {EditableTopicBackendApiService} from 'domain/topic/editable-topic-backend-api.service';
import {CsrfTokenService} from 'services/csrf-token.service';
import {TopicBackendDict} from 'domain/topic/topic-object.model';

/* ---------------------- Backend response interfaces ---------------------- */

interface TopicEditorBackendResponse {
  topic_dict: TopicBackendDict;
  canonical_story_summary_dicts: unknown[];
  grouped_skill_summary_dicts: Record<string, unknown>;
  skill_id_to_description_dict: Record<string, string>;
  skill_id_to_rubrics_dict: Record<string, unknown[]>;
  classroom_url_fragment: string;
  classroom_name: string;
  curriculum_admin_usernames: string[];
  skill_question_count_dict: Record<string, number>;
  subtopic_page: unknown;
  study_guide: unknown;
  skill_creation_is_allowed: boolean;
}

/* ------------------------------------------------------------------------ */

describe('Editable topic backend API service', () => {
  let httpTestingController: HttpTestingController;
  let editableTopicBackendApiService: EditableTopicBackendApiService;
  let csrfService: CsrfTokenService;

  const sampleDataResults: TopicEditorBackendResponse = {
    topic_dict: {
      id: '0',
      name: 'Topic Name',
      description: 'Topic Description',
      version: 1,
      abbreviated_name: '',
      thumbnail_filename: '',
      thumbnail_bg_color: '',

      url_fragment: 'topic-name',
      practice_tab_is_displayed: false,
      skill_ids_for_diagnostic_test: [],
      next_subtopic_id: 1,
      canonical_story_references: [
        {story_id: 'story_1', story_is_published: true},
      ],
      additional_story_references: [
        {story_id: 'story_2', story_is_published: true},
      ],
      uncategorized_skill_ids: ['skill_id_1'],
      subtopics: [],
      language_code: 'en',
      meta_tag_content: 'topic meta',
      page_title_fragment_for_web: 'topic page',
    },
    canonical_story_summary_dicts: [
      {id: '0', title: 'Title', node_count: 1, story_is_published: false},
    ],
    grouped_skill_summary_dicts: {},
    skill_id_to_description_dict: {
      skill_id_1: 'Description 1',
    },
    skill_id_to_rubrics_dict: {
      skill_id_1: [],
    },
    classroom_url_fragment: 'math',
    classroom_name: 'math',
    curriculum_admin_usernames: ['admin1'],
    skill_question_count_dict: {},
    subtopic_page: {
      id: 'topicId-1',
      topicId: 'topicId',
      page_contents: {
        subtitled_html: {html: '<p>Data</p>', content_id: 'content'},
        recorded_voiceovers: {voiceovers_mapping: {content: {}}},
      },
      language_code: 'en',
    },
    study_guide: {
      id: 'topicId-1',
      topicId: 'topicId',
      sections: [
        {
          heading: {
            content_id: 'section_heading_0',
            unicode_str: 'heading 1',
          },
          content: {
            content_id: 'section_content_0',
            html: '<p>content 1</p>',
          },
        },
      ],
      nextContentIdIndex: 2,
      language_code: 'en',
    },
    skill_creation_is_allowed: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    httpTestingController = TestBed.get(HttpTestingController);
    editableTopicBackendApiService = TestBed.get(
      EditableTopicBackendApiService
    );
    csrfService = TestBed.get(CsrfTokenService);

    spyOn(csrfService, 'getTokenAsync').and.resolveTo('sample-csrf-token');
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch an existing topic from the backend', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    editableTopicBackendApiService
      .fetchTopicAsync('0')
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne('/topic_editor_handler/data/0');
    expect(req.request.method).toBe('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should update a topic after fetching it from the backend', fakeAsync(() => {
    let topic!: TopicBackendDict;

    editableTopicBackendApiService
      .fetchTopicAsync('0')
      .then((data: {topicDict: TopicBackendDict}) => {
        topic = data.topicDict;
      });

    const getReq = httpTestingController.expectOne(
      '/topic_editor_handler/data/0'
    );
    getReq.flush(sampleDataResults);
    flushMicrotasks();

    topic.name = 'New Name';
    topic.version = 2;

    const successHandler = jasmine.createSpy('success');

    editableTopicBackendApiService
      .updateTopicAsync(topic.id, topic.version, 'Updated', [])
      .then(successHandler);

    const putReq = httpTestingController.expectOne(
      '/topic_editor_handler/data/0'
    );
    expect(putReq.request.method).toBe('PUT');

    putReq.flush({
      topic_dict: topic,
      skill_id_to_description_dict:
        sampleDataResults.skill_id_to_description_dict,
      skill_id_to_rubrics_dict: sampleDataResults.skill_id_to_rubrics_dict,
    });

    flushMicrotasks();
    expect(successHandler).toHaveBeenCalled();
  }));

  it('should sucessfully delete a topic', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');

    editableTopicBackendApiService.deleteTopicAsync('0').then(successHandler);

    const req = httpTestingController.expectOne('/topic_editor_handler/data/0');
    expect(req.request.method).toBe('DELETE');

    req.flush({status: 200});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(200);
  }));
});
