// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for LearnerGroupBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { LearnerGroupBackendApiService } from
  './learner-group-backend-api.service';
import { LearnerGroupUserInfo } from './learner-group-user-info.model';
import { LearnerGroupData } from './learner-group.model';

describe('Learner Group Backend API Service', () => {
  var learnerGroupBackendApiService: LearnerGroupBackendApiService;
  let httpTestingController: HttpTestingController;

  var sampleLearnerGroupDataResults = {
    id: 'groupId',
    title: 'title',
    description: 'description',
    facilitator_usernames: ['facilitator1'],
    student_usernames: [],
    invited_student_usernames: ['student1', 'student2'],
    subtopic_page_ids: ['subtopic_id_1'],
    story_ids: ['story_id_1']
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LearnerGroupBackendApiService]
    });
    learnerGroupBackendApiService = TestBed.inject(
      LearnerGroupBackendApiService);

    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully create new learner group', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    const LEARNER_GROUP_CREATION_URL = '/create_learner_group_handler';

    learnerGroupBackendApiService.createNewLearnerGroupAsync(
      'title', 'description', ['student1', 'student2'],
      ['subtopic_id_1'], ['story_id_1']).then(successHandler, failHandler);

    var req = httpTestingController.expectOne(LEARNER_GROUP_CREATION_URL);
    expect(req.request.method).toEqual('POST');
    req.flush(sampleLearnerGroupDataResults);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(
      LearnerGroupData.createFromBackendDict(
        sampleLearnerGroupDataResults));
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should successfully update learner group', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    const LEARNER_GROUP_UPDATE_URL = '/update_learner_group_handler/groupId';

    var sampleLearnerGroupData = {
      id: 'groupId',
      title: 'updated title',
      description: 'updated description',
      facilitator_usernames: ['facilitator1'],
      student_usernames: [],
      invited_student_usernames: ['student1', 'student2'],
      subtopic_page_ids: ['subtopic_id_1'],
      story_ids: ['story_id_1']
    };

    let updatedLearnerGroupData = LearnerGroupData.createFromBackendDict(
      sampleLearnerGroupData);

    learnerGroupBackendApiService.updateLearnerGroupAsync(
      updatedLearnerGroupData).then(successHandler, failHandler);

    var req = httpTestingController.expectOne(LEARNER_GROUP_UPDATE_URL);
    expect(req.request.method).toEqual('PUT');
    req.flush(sampleLearnerGroupData);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(
      LearnerGroupData.createFromBackendDict(
        sampleLearnerGroupData));
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should show error if user updating learner group is not a facilitator',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      const LEARNER_GROUP_UPDATE_URL = '/update_learner_group_handler/groupId';

      var sampleLearnerGroupData = {
        id: 'groupId',
        title: 'updated title',
        description: 'updated description',
        facilitator_usernames: ['facilitator2'],
        student_usernames: [],
        invited_student_usernames: ['student1', 'student2'],
        subtopic_page_ids: ['subtopic_id_1'],
        story_ids: ['story_id_1']
      };

      let updatedLearnerGroupData = LearnerGroupData.createFromBackendDict(
        sampleLearnerGroupData);

      learnerGroupBackendApiService.updateLearnerGroupAsync(
        updatedLearnerGroupData).then(successHandler, failHandler);

      var req = httpTestingController.expectOne(LEARNER_GROUP_UPDATE_URL);
      expect(req.request.method).toEqual('PUT');
      req.flush({
        error: 401
      }, {
        status: 401,
        statusText: 'You are not a facilitator of this learner group.'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(401);
    })
  );

  it('should successfully delete learner group', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    const LEARNER_GROUP_DELETE_URL = '/delete_learner_group_handler/groupId';

    learnerGroupBackendApiService.deleteLearnerGroupAsync(
      'groupId').then(successHandler, failHandler);

    var req = httpTestingController.expectOne(LEARNER_GROUP_DELETE_URL);
    expect(req.request.method).toEqual('DELETE');
    req.flush({
      success: true
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should show error if user deleting learner group is not a facilitator',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      const LEARNER_GROUP_DELETE_URL = '/delete_learner_group_handler/groupId';

      learnerGroupBackendApiService.deleteLearnerGroupAsync(
        'groupId').then(successHandler, failHandler);

      var req = httpTestingController.expectOne(LEARNER_GROUP_DELETE_URL);
      expect(req.request.method).toEqual('DELETE');
      req.flush({
        error: 401
      }, {
        status: 401,
        statusText: 'You do not have the rights to delete this ' +
        'learner group as you are not its facilitator.'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(401);
    })
  );

  it('should successfully fetch learner group', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    const LEARNER_GROUP_GET_URL = (
      '/facilitator_view_of_learner_group_handler/groupId'
    );

    learnerGroupBackendApiService.fetchLearnerGroupInfoAsync(
      'groupId').then(successHandler, failHandler);

    var req = httpTestingController.expectOne(LEARNER_GROUP_GET_URL);
    expect(req.request.method).toEqual('GET');
    req.flush(sampleLearnerGroupDataResults);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(
      LearnerGroupData.createFromBackendDict(
        sampleLearnerGroupDataResults));
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should show error if user fetching learner group is not a facilitator',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      const LEARNER_GROUP_GET_URL = (
        '/facilitator_view_of_learner_group_handler/groupId'
      );

      learnerGroupBackendApiService.fetchLearnerGroupInfoAsync(
        'groupId').then(successHandler, failHandler);

      var req = httpTestingController.expectOne(LEARNER_GROUP_GET_URL);
      expect(req.request.method).toEqual('GET');
      req.flush({
        error: 401
      }, {
        status: 401,
        statusText: 'You are not a facilitator of this learner group.'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(401);
    })
  );

  it('should successfully search new student to add', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    const SEARCH_STUDENT_URL = (
      '/learner_group_search_student_handler?username=username1&' +
      'learner_group_id=groupId'
    );
    const sampleUserInfo = {
      username: 'username1',
      user_profile_picture_url: 'profile_picture_url1',
      error: ''
    };

    learnerGroupBackendApiService.searchNewStudentToAddAsync(
      'groupId', 'username1').then(successHandler, failHandler);

    var req = httpTestingController.expectOne(SEARCH_STUDENT_URL);
    expect(req.request.method).toEqual('GET');
    req.flush(sampleUserInfo);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(
      LearnerGroupUserInfo.createFromBackendDict(
        sampleUserInfo));
    expect(failHandler).not.toHaveBeenCalled();
  }));
});
