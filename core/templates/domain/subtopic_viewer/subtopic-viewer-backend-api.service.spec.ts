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
 * @fileoverview Unit tests for SubtopicViewerBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { SubtopicViewerBackendApiService } from
  'domain/subtopic_viewer/subtopic-viewer-backend-api.service';

describe('Subtopic viewer backend API service', () => {
  let subtopicViewerBackendApiService: SubtopicViewerBackendApiService;
  let httpTestingController: HttpTestingController;
  // Sample subtopic page contents object returnable from the backend.
  let sampleDataResults = {
    subtopic_title: 'Subtopic Title',
    page_contents: {
      subtitled_html: {
        html: 'test content',
        content_id: 'content'
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {
            en: {
              filename: 'test.mp3',
              file_size_bytes: 100,
              needs_update: false
            }
          }
        }
      }
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    subtopicViewerBackendApiService = TestBed.get(
      SubtopicViewerBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch an existing subtopic from the backend',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      subtopicViewerBackendApiService.fetchSubtopicDataAsync(
        'topic', 'staging', '0').then(successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/subtopic_data_handler/staging/topic/0');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should use the rejection handler if the backend request failed',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      subtopicViewerBackendApiService.fetchSubtopicDataAsync(
        'topic', 'staging', '0').then(successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/subtopic_data_handler/staging/topic/0');
      expect(req.request.method).toEqual('GET');
      req.flush('Error loading subtopic.', {
        status: 500, statusText: 'Invalid Request'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    })
  );
});
