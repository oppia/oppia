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
 * @fileoverview Unit tests for SkillMasteryBackendApiService.
 */

import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { CsrfTokenService } from 'services/csrf-token.service';
import { SkillMasteryBackendApiService, SkillMasteryBackendResponse } from 'domain/skill/skill-mastery-backend-api.service';
import { SkillMastery } from './skill-mastery.model';

describe('Skill mastery backend API service', () => {
  let skillMasteryBackendApiService: SkillMasteryBackendApiService;
  let csrfService: CsrfTokenService;
  let masteryPerSkillMapping: Record<string, number>;
  let sampleResponse: SkillMasteryBackendResponse;
  let sampleReturnedObject: SkillMastery;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SkillMasteryBackendApiService]
    });

    skillMasteryBackendApiService =
      TestBed.inject(SkillMasteryBackendApiService);
    csrfService = TestBed.inject(CsrfTokenService);
    httpTestingController = TestBed.inject(HttpTestingController);

    spyOn(csrfService, 'getTokenAsync').and.callFake(async function() {
      return Promise.resolve('sample-csrf-token');
    });

    let masteryPerSkillMapping = {
      skillId1: 0.3,
      skillId2: 0.5
    };

    sampleResponse = {
      degrees_of_mastery: masteryPerSkillMapping
    };

    sampleReturnedObject = SkillMastery.createFromBackendDict(
      sampleResponse.degrees_of_mastery);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch the skill mastery degrees from the backend',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let skillIds = ['skillId1', 'skillId2'];

      let requestUrl = '/skill_mastery_handler/data' +
        '?selected_skill_ids=' + encodeURI(JSON.stringify(skillIds));

      skillMasteryBackendApiService.fetchSkillMasteryDegreesAsync(
        ['skillId1', 'skillId2']).then(successHandler, failHandler);

      const req = httpTestingController.expectOne(requestUrl);
      expect(req.request.method).toEqual('GET');
      req.flush(sampleResponse);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(
        sampleReturnedObject);
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it('should use the rejection handler if backend request failed',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let skillIds = ['skillId1', 'skillId2'];

      let requestUrl = '/skill_mastery_handler/data' +
        '?selected_skill_ids=' + encodeURI(JSON.stringify(skillIds));

      skillMasteryBackendApiService.fetchSkillMasteryDegreesAsync(
        ['skillId1', 'skillId2']).then(successHandler, failHandler);

      const req = httpTestingController.expectOne(requestUrl);
      expect(req.request.method).toEqual('GET');
      req.flush({
        error: 'Error fetching skill mastery.'
      }, {
        status: 500, statusText: 'Error fetching skill mastery.'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error fetching skill mastery.');
    }));

  it('should successfully update the skill mastery degrees in the backend',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      skillMasteryBackendApiService.updateSkillMasteryDegreesAsync(
        masteryPerSkillMapping).then(successHandler, failHandler);

      const req = httpTestingController.expectOne(
        '/skill_mastery_handler/data');
      expect(req.request.method).toEqual('PUT');
      req.flush(null);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it('should use the rejection handler if backend request failed',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      skillMasteryBackendApiService.updateSkillMasteryDegreesAsync(
        masteryPerSkillMapping).then(successHandler, failHandler);

      const req = httpTestingController.expectOne(
        '/skill_mastery_handler/data');
      expect(req.request.method).toEqual('PUT');
      req.flush({
        error: 'Error updating skill mastery.'
      }, {
        status: 500, statusText: 'Error updating skill mastery.'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error updating skill mastery.');
    }));
});
