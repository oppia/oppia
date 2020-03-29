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

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { TopicViewerBackendApiService } from
  'domain/topic_viewer/topic-viewer-backend-api.service';

describe('Topic viewer backend API service', () => {
  let topicViewerBackendApiService:
    TopicViewerBackendApiService = null;
  let httpTestingController: HttpTestingController;
  let sampleDataResults = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    httpTestingController = TestBed.get(HttpTestingController);
    topicViewerBackendApiService = TestBed.get(TopicViewerBackendApiService);

    // Sample topic object returnable from the backend
    sampleDataResults = {
      topic_name: 'topic_name',
      topic_id: 'topic_id',
      canonical_story_dicts: [{
        id: '0',
        title: 'Story Title',
        description: 'Story Description',
      }],
      additional_story_dicts: [{
        id: '1',
        title: 'Story Title',
        description: 'Story Description',
      }],
      uncategorized_skill_ids: ['skill_id_1'],
      subtopics: [{
        skill_ids: ['skill_id_2'],
        id: 1,
        title: 'subtopic_name'}],
      degrees_of_mastery: {
        skill_id_1: 0.5,
        skill_id_2: 0.3
      },
      skill_descriptions: {
        skill_id_1: 'Skill Description 1',
        skill_id_2: 'Skill Description 2'
      }
    };
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch an existing topic from the backend',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');
      topicViewerBackendApiService.fetchTopicData('0').then(
        successHandler, failHandler);
      const req = httpTestingController.expectOne(
        '/topic_data_handler/0');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(sampleDataResults);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should use rejection handler if backend request failed',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');
      topicViewerBackendApiService.fetchTopicData('0').then(
        successHandler, failHandler);
      const req = httpTestingController.expectOne(
        '/topic_data_handler/0');
      expect(req.request.method).toEqual('GET');
      req.flush('Error fetching topic 0.', {
        status: 500,
        statusText: 'Error fetching topic 0.'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error fetching topic 0.');
    })
  );
});
