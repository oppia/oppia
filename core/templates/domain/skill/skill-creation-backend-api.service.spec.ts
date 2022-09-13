// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for SkillCreationBackendApiService.
 */

import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController }
  from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import {
  RubricBackendDict,
  SkillCreationBackendApiService
} from 'domain/skill/skill-creation-backend-api.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';

describe('Skill creation backend api service', () => {
  let httpTestingController: HttpTestingController;
  let skillCreationBackendApiService: SkillCreationBackendApiService;
  let rubricDict: RubricBackendDict;
  let imageLocalStorageService: ImageLocalStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    httpTestingController = TestBed.inject(HttpTestingController);
    skillCreationBackendApiService = TestBed.inject(
      SkillCreationBackendApiService);
    imageLocalStorageService = TestBed.inject(ImageLocalStorageService);

    rubricDict = {
      explanations: ['test-explanation'],
      difficulty: 'test-difficulty'
    };
  });

  afterEach(()=> {
    httpTestingController.verify();
  });

  it('should successfully create a new skill and obtain the skill ID',
    fakeAsync(() => {
      spyOn(
        imageLocalStorageService, 'getFilenameToBase64MappingAsync'
      ).and.returnValue(Promise.resolve({
        'image.png': 'base64String'
      }));
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let imageBlob = new Blob(
        ['data:image/png;base64,xyz'], {type: 'image/png'});
      let imageData = {
        filename: 'image.png',
        imageBlob: imageBlob
      };
      let postData = {
        description: 'test-description',
        linked_topic_ids: ['test_id'],
        explanation_dict: 'test_dictionary',
        rubrics: rubricDict,
        files: {
          'image.png': 'base64String'
        }
      };

      skillCreationBackendApiService.createSkillAsync(
        'test-description', rubricDict, 'test_dictionary', ['test_id'],
        [imageData]
      ).then(successHandler, failHandler);
      flushMicrotasks();

      let req = httpTestingController.expectOne(
        '/skill_editor_handler/create_new');
      expect(req.request.method).toEqual('POST');
      expect(req.request.body.get('payload')).toEqual(JSON.stringify(postData));
      req.flush(postData);
      flushMicrotasks();
      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it('should fail to create a new skill and call the fail handler',
    fakeAsync(() => {
      spyOn(
        imageLocalStorageService, 'getFilenameToBase64MappingAsync'
      ).and.returnValue(Promise.resolve({}));
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      let postData = {
        description: 'test-description',
        linked_topic_ids: ['test_id'],
        explanation_dict: 'test_dictionary',
        rubrics: rubricDict,
        files: {}
      };
      skillCreationBackendApiService.createSkillAsync(
        'test-description', rubricDict, 'test_dictionary', ['test_id'], []
      ).then(successHandler, failHandler);
      flushMicrotasks();
      let errorResponse = new HttpErrorResponse({
        error: 'test 404 error',
        status: 404,
        statusText: 'Not Found'
      });
      let req = httpTestingController.expectOne(
        '/skill_editor_handler/create_new');
      req.error(new ErrorEvent('Error'), errorResponse);

      expect(req.request.method).toEqual('POST');
      expect(req.request.body.get('payload')).toEqual(JSON.stringify(postData));
      flushMicrotasks();
      expect(failHandler).toHaveBeenCalled();
      expect(successHandler).not.toHaveBeenCalled();
    }));
});
