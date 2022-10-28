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
 * @fileoverview Unit tests for SkillRightsBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from
  '@angular/core/testing';

import { SkillRightsBackendDict, SkillRights } from
  'domain/skill/skill-rights.model';
import { SkillRightsBackendApiService} from
  'domain/skill/skill-rights-backend-api.service';

describe('Skill rights backend API service', () => {
  let skillRightsBackendApiService: SkillRightsBackendApiService;
  let httpTestingController: HttpTestingController;
  let sampleSkillRights: SkillRightsBackendDict = {
    skill_id: '0',
    can_edit_skill_description: true
  };
  let skillRightsObject: SkillRights;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    httpTestingController = TestBed.get(HttpTestingController);
    skillRightsBackendApiService = TestBed.get(SkillRightsBackendApiService);

    skillRightsObject = SkillRights.createFromBackendDict(
      sampleSkillRights);
  });
  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch a skill dict from backend',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      skillRightsBackendApiService.fetchSkillRightsAsync('0').then(
        successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/skill_editor_handler/rights/0');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleSkillRights);
      flushMicrotasks();
      expect(successHandler).toHaveBeenCalledWith(skillRightsObject);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should use reject handler when fetching a skill dict from backend' +
  ' fails', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    skillRightsBackendApiService.fetchSkillRightsAsync('0').then(
      successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/skill_editor_handler/rights/0');
    req.error(new ErrorEvent('Error'));
    expect(req.request.method).toEqual('GET');
    flushMicrotasks();
    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should successfully fetch a skill dict from backend if it\'s not' +
    'cached', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    skillRightsBackendApiService.loadSkillRightsAsync('0').then(
      successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/skill_editor_handler/rights/0');
    req.flush(sampleSkillRights);
    expect(req.request.method).toEqual('GET');
    flushMicrotasks();
    expect(skillRightsBackendApiService.isCached('0')).toBe(true);
    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should report a cached skill rights after caching it',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      // The skill should not currently be cached.
      expect(skillRightsBackendApiService.isCached('0')).toBe(false);
      // Cache a skill.
      skillRightsBackendApiService.cacheSkillRights('0', skillRightsObject);

      // It should now be cached.
      expect(skillRightsBackendApiService.isCached('0')).toBe(true);

      // A new skill should not have been fetched from the backend. Also,
      // the returned skill should match the expected skill object.
      skillRightsBackendApiService.loadSkillRightsAsync('0').then(
        successHandler, failHandler);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(skillRightsObject);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );
});
