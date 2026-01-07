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
import {TopicDomainConstants} from 'domain/topic/topic-domain.constants';

interface TopicEditorBackendResponse {
  topic_dict: TopicBackendDict;
  canonical_story_summary_dicts: unknown[];
  grouped_skill_summary_dicts: Record<string, unknown>;
  skill_id_to_description_dict: Record<string, string>;
  skill_id_to_rubrics_dict: Record<string, unknown[]>;
  classroom_url_fragment: string | null;
  classroom_name: string | null;
  curriculum_admin_usernames: string[];
  skill_question_count_dict: Record<string, number>;
  subtopic_page: unknown;
  study_guide: unknown;
  skill_creation_is_allowed: boolean;
}

describe('EditableTopicBackendApiService', () => {
  let httpTestingController: HttpTestingController;
  let service: EditableTopicBackendApiService;
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
    canonical_story_summary_dicts: [],
    grouped_skill_summary_dicts: {},
    skill_id_to_description_dict: {skill_id_1: 'Description'},
    skill_id_to_rubrics_dict: {skill_id_1: []},
    classroom_url_fragment: 'math',
    classroom_name: 'Math',
    curriculum_admin_usernames: ['admin'],
    skill_question_count_dict: {},
    subtopic_page: {},
    study_guide: {html: '<p>Guide</p>'},
    skill_creation_is_allowed: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EditableTopicBackendApiService, CsrfTokenService],
    });

    httpTestingController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(EditableTopicBackendApiService);
    csrfService = TestBed.inject(CsrfTokenService);

    spyOn(csrfService, 'getTokenAsync').and.resolveTo('csrf-token');
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch topic successfully', fakeAsync(() => {
    let response: unknown = null;

    service.fetchTopicAsync('0').then((res: unknown) => {
      response = res;
    });

    const req = httpTestingController.expectOne('/topic_editor_handler/data/0');
    expect(req.request.method).toBe('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();
    expect(response).not.toBeNull();
  }));

  it('should handle fetch topic failure', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const errorHandler = jasmine.createSpy('error');

    service.fetchTopicAsync('0').then(successHandler, errorHandler);

    const req = httpTestingController.expectOne('/topic_editor_handler/data/0');
    req.flush('Error', {status: 500, statusText: 'Server Error'});

    flushMicrotasks();
    expect(successHandler).not.toHaveBeenCalled();
    expect(errorHandler).toHaveBeenCalled();
  }));

  it('should update topic successfully', fakeAsync(() => {
    let response: unknown = null;

    service.updateTopicAsync('0', 1, 'commit', []).then((res: unknown) => {
      response = res;
    });

    const req = httpTestingController.expectOne('/topic_editor_handler/data/0');
    expect(req.request.method).toBe('PUT');

    req.flush({
      topic_dict: sampleDataResults.topic_dict,
      skill_id_to_description_dict:
        sampleDataResults.skill_id_to_description_dict,
      skill_id_to_rubrics_dict: sampleDataResults.skill_id_to_rubrics_dict,
    });

    flushMicrotasks();
    expect(response).not.toBeNull();
  }));

  it('should delete topic successfully', fakeAsync(() => {
    let status: number | null = null;

    service.deleteTopicAsync('0').then((res: number) => {
      status = res;
    });

    const req = httpTestingController.expectOne('/topic_editor_handler/data/0');
    expect(req.request.method).toBe('DELETE');

    req.flush({status: 200});
    flushMicrotasks();

    expect(status).toBe(200);
  }));

  it('should fetch stories successfully', fakeAsync(() => {
    let response: unknown[] | null = null;

    service.fetchStoriesAsync('0').then((res: unknown[]) => {
      response = res;
    });

    const req = httpTestingController.expectOne(
      '/topic_editor_story_handler/0'
    );
    expect(req.request.method).toBe('GET');

    req.flush({canonical_story_summary_dicts: []});
    flushMicrotasks();

    expect(response).toEqual([]);
  }));

  it('should fetch subtopic page successfully', fakeAsync(() => {
    let response: unknown = null;

    service.fetchSubtopicPageAsync('0', 1).then((res: unknown) => {
      response = res;
    });

    const req = httpTestingController.expectOne(
      '/subtopic_page_editor_handler/data/0/1'
    );
    expect(req.request.method).toBe('GET');

    req.flush({subtopic_page: {}});
    flushMicrotasks();

    expect(response).toEqual({});
  }));

  it('should fetch study guide successfully', fakeAsync(() => {
    let response: unknown = null;

    service.fetchStudyGuideAsync('0', 1).then((res: unknown) => {
      response = res;
    });

    const req = httpTestingController.expectOne(
      '/study_guide_editor_handler/data/0/1'
    );
    expect(req.request.method).toBe('GET');

    req.flush({study_guide: {}});
    flushMicrotasks();

    expect(response).toEqual({});
  }));

  it('should resolve when doesTopicWithNameExistAsync succeeds', fakeAsync(() => {
    let response: boolean | null = null;

    service.doesTopicWithNameExistAsync('Topic Name').then((res: boolean) => {
      response = res;
    });

    const req = httpTestingController.expectOne(
      TopicDomainConstants.TOPIC_NAME_HANDLER_URL_TEMPLATE.replace(
        '<topic_name>',
        encodeURIComponent('Topic Name')
      )
    );

    req.flush({topic_name_exists: true});
    flushMicrotasks();

    expect(response).toBeTrue();
  }));

  it('should resolve when doesTopicWithUrlFragmentExistAsync succeeds', fakeAsync(() => {
    let response: boolean | null = null;

    service
      .doesTopicWithUrlFragmentExistAsync('topic-fragment')
      .then((res: boolean) => {
        response = res;
      });

    const req = httpTestingController.expectOne(
      TopicDomainConstants.TOPIC_URL_FRAGMENT_HANDLER_URL_TEMPLATE.replace(
        '<topic_url_fragment>',
        'topic-fragment'
      )
    );

    req.flush({topic_url_fragment_exists: true});
    flushMicrotasks();

    expect(response).toBeTrue();
  }));

  it('should reject when getTopicIdToTopicNameAsync fails', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const errorHandler = jasmine.createSpy('error');

    service
      .getTopicIdToTopicNameAsync(['id1'])
      .then(successHandler, errorHandler);

    const req = httpTestingController.expectOne(
      '/topic_id_to_topic_name_handler/?comma_separated_topic_ids=id1'
    );

    req.flush(
      {error: {error: 'Backend failure'}},
      {status: 500, statusText: 'Server Error'}
    );

    flushMicrotasks();
    expect(successHandler).not.toHaveBeenCalled();
    expect(errorHandler).toHaveBeenCalled();
  }));

  it('should resolve when getTopicIdToTopicNameAsync succeeds', fakeAsync(() => {
    let response: unknown = null;

    service.getTopicIdToTopicNameAsync(['id1']).then((res: unknown) => {
      response = res;
    });

    const req = httpTestingController.expectOne(
      '/topic_id_to_topic_name_handler/?comma_separated_topic_ids=id1'
    );

    req.flush({
      topic_id_to_topic_name: {id1: 'Topic One'},
    });

    flushMicrotasks();
    expect(response).toEqual({id1: 'Topic One'});
  }));

  it('should reject when fetchStoriesAsync fails', fakeAsync(() => {
    let error: unknown;

    service.fetchStoriesAsync('0').catch((err: unknown) => {
      error = err;
    });

    const req = httpTestingController.expectOne(
      '/topic_editor_story_handler/0'
    );
    req.flush('Error', {status: 500, statusText: 'Server Error'});

    flushMicrotasks();
    expect(error).toBeDefined();
  }));

  it('should reject when fetchSubtopicPageAsync fails', fakeAsync(() => {
    let error: unknown;

    service.fetchSubtopicPageAsync('0', 1).catch((err: unknown) => {
      error = err;
    });

    const req = httpTestingController.expectOne(
      '/subtopic_page_editor_handler/data/0/1'
    );
    req.flush('Error', {status: 500, statusText: 'Server Error'});

    flushMicrotasks();
    expect(error).toBeDefined();
  }));

  it('should reject when fetchStudyGuideAsync fails', fakeAsync(() => {
    let error: unknown;

    service.fetchStudyGuideAsync('0', 1).catch((err: unknown) => {
      error = err;
    });

    const req = httpTestingController.expectOne(
      '/study_guide_editor_handler/data/0/1'
    );
    req.flush('Error', {status: 500, statusText: 'Server Error'});

    flushMicrotasks();
    expect(error).toBeDefined();
  }));

  it('should reject when updateTopicAsync fails', fakeAsync(() => {
    let error: unknown;

    service.updateTopicAsync('0', 1, 'commit', []).catch((err: unknown) => {
      error = err;
    });

    const req = httpTestingController.expectOne('/topic_editor_handler/data/0');
    req.flush('Error', {status: 500, statusText: 'Server Error'});

    flushMicrotasks();
    expect(error).toBeDefined();
  }));

  it('should reject when deleteTopicAsync fails', fakeAsync(() => {
    let error: unknown;

    service.deleteTopicAsync('0').catch((err: unknown) => {
      error = err;
    });

    const req = httpTestingController.expectOne('/topic_editor_handler/data/0');
    req.flush('Error', {status: 500, statusText: 'Server Error'});

    flushMicrotasks();
    expect(error).toBeDefined();
  }));

  it('should reject when doesTopicWithNameExistAsync fails', fakeAsync(() => {
    let error: unknown;

    service.doesTopicWithNameExistAsync('Topic').catch((err: unknown) => {
      error = err;
    });

    const req = httpTestingController.expectOne(
      TopicDomainConstants.TOPIC_NAME_HANDLER_URL_TEMPLATE.replace(
        '<topic_name>',
        encodeURIComponent('Topic')
      )
    );

    req.flush('Error', {status: 500, statusText: 'Server Error'});
    flushMicrotasks();

    expect(error).toBeDefined();
  }));

  it('should reject when doesTopicWithUrlFragmentExistAsync fails', fakeAsync(() => {
    let error: unknown;

    service
      .doesTopicWithUrlFragmentExistAsync('topic-fragment')
      .catch((err: unknown) => {
        error = err;
      });

    const req = httpTestingController.expectOne(
      TopicDomainConstants.TOPIC_URL_FRAGMENT_HANDLER_URL_TEMPLATE.replace(
        '<topic_url_fragment>',
        'topic-fragment'
      )
    );

    req.flush('Error', {status: 500, statusText: 'Server Error'});
    flushMicrotasks();

    expect(error).toBeDefined();
  }));
});
