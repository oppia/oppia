// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ReleaseCoordinatorBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {ReleaseCoordinatorPageConstants} from '../release-coordinator-page.constants';
import {CsrfTokenService} from 'services/csrf-token.service';
import {BeamJobRun} from 'domain/jobs/beam-job-run.model';
import {BeamJob} from 'domain/jobs/beam-job.model';
import {BeamJobRunResult} from 'domain/jobs/beam-job-run-result.model';
import {
  UserGroup,
  UserGroupBackendDict,
} from 'domain/release_coordinator/user-group.model';
import {
  ReleaseCoordinatorBackendApiService,
  UserGroupsResponse,
  UserGroupsDict,
} from './release-coordinator-backend-api.service';

describe('Release coordinator backend api service', () => {
  let rcbas: ReleaseCoordinatorBackendApiService;
  let httpTestingController: HttpTestingController;
  let csrfService: CsrfTokenService;
  let successHandler: jasmine.Spy<jasmine.Func>;
  let failHandler: jasmine.Spy<jasmine.Func>;
  let userGroupResponse: UserGroupsResponse;
  let sampleUserGroupBackendDict1: UserGroupBackendDict = {
    user_group_id: 'UserGroup1ID',
    name: 'UserGroup1',
    member_usernames: ['User1', 'User2', 'User3'],
  };
  let sampleUserGroupBackendDict2: UserGroupBackendDict = {
    user_group_id: 'UserGroup2ID',
    name: 'UserGroup2',
    member_usernames: ['User4', 'User5'],
  };
  let userGroupSampleData: UserGroupsDict = {
    user_group_dicts: [
      sampleUserGroupBackendDict1,
      sampleUserGroupBackendDict2,
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    rcbas = TestBed.get(ReleaseCoordinatorBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
    csrfService = TestBed.get(CsrfTokenService);
    successHandler = jasmine.createSpy('success');
    failHandler = jasmine.createSpy('fail');
    userGroupResponse = {
      userGroups: userGroupSampleData.user_group_dicts.map(dict =>
        UserGroup.createFromBackendDict(dict)
      ),
    };

    spyOn(csrfService, 'getTokenAsync').and.callFake(async () => {
      return Promise.resolve('sample-csrf-token');
    });
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it(
    'should flush the memory cache when calling' + 'flushMemoryCacheAsync',
    fakeAsync(() => {
      rcbas.flushMemoryCacheAsync().then(successHandler, failHandler);

      let req = httpTestingController.expectOne('/memorycachehandler');
      expect(req.request.method).toEqual('DELETE');
      req.flush(200);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it(
    'should fail to flush the memory cache when calling' +
      'flushMemoryCacheAsync',
    fakeAsync(() => {
      rcbas.flushMemoryCacheAsync().then(successHandler, failHandler);

      let req = httpTestingController.expectOne('/memorycachehandler');
      expect(req.request.method).toEqual('DELETE');
      req.flush(
        {
          error: 'Failed to flush memory cache.',
        },
        {
          status: 500,
          statusText: 'Internal Server Error',
        }
      );
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Failed to flush memory cache.');
    })
  );

  it(
    'should get the data of memory cache profile when' +
      'calling getMemoryCacheProfileAsync',
    fakeAsync(() => {
      rcbas.getMemoryCacheProfileAsync().then(successHandler, failHandler);
      let req = httpTestingController.expectOne('/memorycachehandler');
      expect(req.request.method).toEqual('GET');
      req.flush(200);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it(
    'should fail to get the data of memory cache profile' +
      'when calling getMemoryCacheProfileAsync',
    fakeAsync(() => {
      rcbas.getMemoryCacheProfileAsync().then(successHandler, failHandler);
      let req = httpTestingController.expectOne('/memorycachehandler');
      expect(req.request.method).toEqual('GET');
      req.flush(
        {
          error: 'Failed to get data.',
        },
        {
          status: 500,
          statusText: 'Internal Server Error',
        }
      );
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Failed to get data.');
    })
  );

  it('should get all beam jobs', fakeAsync(async () => {
    const beamJobsPromise = rcbas.getBeamJobs().toPromise();
    const req = httpTestingController.expectOne('/beam_job');
    expect(req.request.method).toEqual('GET');
    req.flush({
      jobs: [{name: 'FooJob'}],
    });
    flushMicrotasks();

    expect(await beamJobsPromise).toEqual([new BeamJob('FooJob')]);
  }));

  it('should get all beam job runs', fakeAsync(async () => {
    const beamJobRunsPromise = rcbas.getBeamJobRuns().toPromise();
    const req = httpTestingController.expectOne('/beam_job_run');
    expect(req.request.method).toEqual('GET');
    req.flush({
      runs: [
        {
          job_id: 'abc',
          job_name: 'FooJob',
          job_state: 'RUNNING',
          job_started_on_msecs: 0,
          job_updated_on_msecs: 0,
          job_is_synchronous: false,
        },
      ],
    });
    flushMicrotasks();

    expect(await beamJobRunsPromise).toEqual([
      new BeamJobRun('abc', 'FooJob', 'RUNNING', 0, 0, false),
    ]);
  }));

  it('should start a new job', fakeAsync(async () => {
    const beamJob = new BeamJob('FooJob');
    const beamJobRunPromise = rcbas.startNewBeamJob(beamJob).toPromise();
    const req = httpTestingController.expectOne('/beam_job_run');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual({job_name: 'FooJob'});
    req.flush({
      job_id: 'abc',
      job_name: 'FooJob',
      job_state: 'RUNNING',
      job_started_on_msecs: 0,
      job_updated_on_msecs: 0,
      job_is_synchronous: false,
    });
    flushMicrotasks();

    expect(await beamJobRunPromise).toEqual(
      new BeamJobRun('abc', 'FooJob', 'RUNNING', 0, 0, false)
    );
  }));

  it('should cancel a running beam job', fakeAsync(async () => {
    const beamJobRun = new BeamJobRun('abc', 'FooJob', 'RUNNING', 0, 0, false);
    const beamJobRunPromise = rcbas.cancelBeamJobRun(beamJobRun).toPromise();
    const req = httpTestingController.expectOne('/beam_job_run?job_id=abc');
    expect(req.request.method).toEqual('DELETE');
    req.flush({
      job_id: 'abc',
      job_name: 'FooJob',
      job_state: 'CANCELLING',
      job_started_on_msecs: 0,
      job_updated_on_msecs: 0,
      job_is_synchronous: false,
    });
    flushMicrotasks();

    expect(await beamJobRunPromise).toEqual(
      new BeamJobRun('abc', 'FooJob', 'CANCELLING', 0, 0, false)
    );
  }));

  it('should get the output of a beam job run', fakeAsync(async () => {
    const beamJobRun = new BeamJobRun('abc', 'FooJob', 'DONE', 0, 0, false);
    const resultPromise = rcbas.getBeamJobRunOutput(beamJobRun).toPromise();
    const req = httpTestingController.expectOne(
      '/beam_job_run_result?job_id=abc'
    );
    expect(req.request.method).toEqual('GET');
    req.flush({
      stdout: '123',
      stderr: '456',
    });
    flushMicrotasks();

    expect(await resultPromise).toEqual(new BeamJobRunResult('123', '456'));
  }));

  it('should return all user groups', fakeAsync(() => {
    rcbas.getUserGroupsAsync().then(function (response) {
      expect(response).toEqual(userGroupResponse);
    });
    const req = httpTestingController.expectOne(
      ReleaseCoordinatorPageConstants.USER_GROUPS_HANDLER_URL
    );
    expect(req.request.method).toEqual('GET');
    req.flush(userGroupSampleData);
    flushMicrotasks();
  }));

  it('should fail to get all user groups in case of errors', fakeAsync(() => {
    rcbas.getUserGroupsAsync().then(successHandler, failHandler);
    const req = httpTestingController.expectOne(
      ReleaseCoordinatorPageConstants.USER_GROUPS_HANDLER_URL
    );
    expect(req.request.method).toEqual('GET');
    req.flush(
      {
        error: 'Failed to update username.',
      },
      {
        status: 500,
        statusText: 'Internal Server Error',
      }
    );
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Failed to update username.');
  }));

  it('should update the user group', fakeAsync(() => {
    rcbas
      .updateUserGroupAsync('UserGroup1ID', 'USERGROUP1', ['user1', 'user2'])
      .then(successHandler, failHandler);
    const req = httpTestingController.expectOne(
      ReleaseCoordinatorPageConstants.USER_GROUPS_HANDLER_URL
    );
    expect(req.request.method).toEqual('PUT');
    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should fail to update the user group in case of errors', fakeAsync(() => {
    rcbas
      .updateUserGroupAsync('UserGroup1ID', 'USERGROUP1', ['user1', 'user2'])
      .then(successHandler, failHandler);
    const req = httpTestingController.expectOne(
      ReleaseCoordinatorPageConstants.USER_GROUPS_HANDLER_URL
    );
    expect(req.request.method).toEqual('PUT');
    req.flush(
      {
        error: 'Failed to update username.',
      },
      {
        status: 500,
        statusText: 'Internal Server Error',
      }
    );
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Failed to update username.');
  }));

  it('should delete the user group', fakeAsync(() => {
    rcbas
      .deleteUserGroupAsync('UserGroup1ID')
      .then(successHandler, failHandler);
    const req = httpTestingController.expectOne(
      ReleaseCoordinatorPageConstants.USER_GROUPS_HANDLER_URL +
        '?user_group_id=UserGroup1ID'
    );
    expect(req.request.method).toEqual('DELETE');
    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should fail to delete the user group in case of errors', fakeAsync(() => {
    rcbas
      .deleteUserGroupAsync('UserGroup1ID')
      .then(successHandler, failHandler);
    const req = httpTestingController.expectOne(
      ReleaseCoordinatorPageConstants.USER_GROUPS_HANDLER_URL +
        '?user_group_id=UserGroup1ID'
    );
    expect(req.request.method).toEqual('DELETE');
    req.flush(
      {
        error: 'Failed to update username.',
      },
      {
        status: 500,
        statusText: 'Internal Server Error',
      }
    );
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Failed to update username.');
  }));

  it('should create the user group', fakeAsync(() => {
    rcbas
      .createUserGroupAsync('UserGroup3', [])
      .then(successHandler, failHandler);
    const req = httpTestingController.expectOne(
      ReleaseCoordinatorPageConstants.USER_GROUPS_HANDLER_URL
    );
    expect(req.request.method).toEqual('POST');
    req.flush({
      user_group_dict: {
        user_group_id: 'UserGroup3ID',
        name: 'UserGroup3',
        member_usernames: [],
      },
    });
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should fail to create the user group in case of errors', fakeAsync(() => {
    rcbas
      .createUserGroupAsync('UserGroup3', [])
      .then(successHandler, failHandler);
    const req = httpTestingController.expectOne(
      ReleaseCoordinatorPageConstants.USER_GROUPS_HANDLER_URL
    );
    expect(req.request.method).toEqual('POST');
    req.flush(
      {
        error: 'Failed to create user group.',
      },
      {
        status: 500,
        statusText: 'Internal Server Error',
      }
    );
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Failed to create user group.');
  }));
});
