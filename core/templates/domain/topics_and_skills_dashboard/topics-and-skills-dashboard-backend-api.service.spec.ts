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
 * @fileoverview Unit tests for Topics and skills dashboard.
 */


import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { TopicsAndSkillsDashboardBackendApiService } from
  // eslint-disable-next-line max-len
  'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';

describe('Topics and Skills Dashboard backend API service', () => {
  let topicsAndSkillsDashboardBackendApiService:
    TopicsAndSkillsDashboardBackendApiService = null;
  let httpTestingController: HttpTestingController = null;

  const SAMPLE_TOPIC_ID = 'hyuy4GUlvTqJ';
  const TOPICS_AND_SKILLS_DASHBOARD_DATA_URL = (
    '/topics_and_skills_dashboard/data');
  const SKILLS_DASHBOARD_DATA_URL = '/skills_dashboard/data';
  const ASSIGNED_SKILL_DATA_URL = '/topics_and_skills_dashboard/<skill_id>';
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    httpTestingController = TestBed.get(HttpTestingController);
    topicsAndSkillsDashboardBackendApiService = TestBed.get(
      TopicsAndSkillsDashboardBackendApiService);
    let sampleDataResults = {
      topic_summary_dicts: [{
        id: SAMPLE_TOPIC_ID,
        name: 'Sample Name',
        language_code: 'en',
        version: 1,
        canonical_story_count: 3,
        additional_story_count: 0,
        uncategorized_skill_count: 3,
        subtopic_count: 3,
        topic_model_created_on: 1466178691847.67,
        topic_model_last_updated: 1466178759209.839
      }],
      skill_summary_dicts: []
    };

    afterEach(() => {
      httpTestingController.verify();
    });

    it('should use rejection handler if dashboard data backend request failed',
      fakeAsync(() => {
        let successHandler = jasmine.createSpy('success');
        let failHandler = jasmine.createSpy('fail');
        topicsAndSkillsDashboardBackendApiService.fetchDashboardDataAsync()
          .then(successHandler, failHandler);
        let req = httpTestingController.expectOne(
          TOPICS_AND_SKILLS_DASHBOARD_DATA_URL,
          'Error Loading dashboard data.');
        expect(req.request.method).toEqual('GET');
        expect(successHandler).not.toHaveBeenCalled();
        expect(failHandler).toHaveBeenCalled();
      })
    );

    it('should successfully fetch skills dashboard data from the backend',
      fakeAsync(() => {
        let successHandler = jasmine.createSpy('success');
        let failHandler = jasmine.createSpy('fail');
        topicsAndSkillsDashboardBackendApiService.fetchSkillsDashboardDataAsync(
          null, 0, null).then(
          successHandler, failHandler);
        let req = httpTestingController.expectOne(SKILLS_DASHBOARD_DATA_URL);
        expect(req.request.method).toEqual('POST');
        req.flush({});
        expect(successHandler).not.toHaveBeenCalled();
        expect(failHandler).toHaveBeenCalled();
      })
    );

    it('should successfully fetch assigned skills data from the backend',
      fakeAsync(() => {
        let successHandler = jasmine.createSpy('success');
        let failHandler = jasmine.createSpy('fail');
        topicsAndSkillsDashboardBackendApiService
          .fetchTopicAssignmentsForSkillAsync(
            'skillId1'
          ).then(successHandler, failHandler);
        let req = httpTestingController.expectOne(ASSIGNED_SKILL_DATA_URL);
        expect(req.request.method).toEqual('GET');
        req.flush({});
        expect(successHandler).toHaveBeenCalled();
        expect(failHandler).not.toHaveBeenCalled();
      })
    );

    it('should use fail handler if fetching assigned skills data failed',
      fakeAsync(() => {
        let successHandler = jasmine.createSpy('success');
        let failHandler = jasmine.createSpy('fail');
        topicsAndSkillsDashboardBackendApiService.fetchSkillsDashboardDataAsync(
          null, 0, null).then(
          successHandler, failHandler);
        let req = httpTestingController.expectOne(ASSIGNED_SKILL_DATA_URL);
        expect(req.request.method).toEqual('GET');
        req.flush('Error loading assigned skill data.', {
          status: 500
        });
        expect(successHandler).not.toHaveBeenCalled();
        expect(failHandler).toHaveBeenCalledWith(
          'Error loading assigned skill data.');
      })
    );

    it('should use fail handler if skills dashboard data failed',
      fakeAsync(() => {
        let successHandler = jasmine.createSpy('success');
        let failHandler = jasmine.createSpy('fail');
        topicsAndSkillsDashboardBackendApiService.fetchSkillsDashboardDataAsync(
          null, 0, null).then(
          successHandler, failHandler);
        let req = httpTestingController.expectOne(
          SKILLS_DASHBOARD_DATA_URL, 'Error loading dashboard data.');
        expect(req.request.method).toEqual('POST');
        req.flush('Error loading skills data.', {
          status: 500
        });
        expect(successHandler).not.toHaveBeenCalled();
        expect(failHandler).toHaveBeenCalled();
      })
    );

    it('should successfully fetch topics and skills dashboard data from the ' +
      'backend', fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      topicsAndSkillsDashboardBackendApiService.fetchDashboardDataAsync().then(
        successHandler, failHandler);
      let req = httpTestingController.expectOne(
        TOPICS_AND_SKILLS_DASHBOARD_DATA_URL);
      expect(req.request.method).toEqual('GET');
      req.flush(sampleDataResults);
      flushMicrotasks();
      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
    );
  });
});
