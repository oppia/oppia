// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for fix commit command backend API service.
 */

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { FixCommitCommandBackendApiService } from './fix-commit-command-backend-api.service';

describe('Fix commit commands backend api service', () => {
  let fixCommitCommandBackendApiService: FixCommitCommandBackendApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    fixCommitCommandBackendApiService = TestBed.inject(
      FixCommitCommandBackendApiService);
    http = TestBed.inject(HttpTestingController);
  });

  it('should fix the commit commands correctly', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failureHandler = jasmine.createSpy('failure');

    fixCommitCommandBackendApiService
      .fixCommitCommandsAsync()
      .then(successHandler, failureHandler);

    const req = http.expectOne('/fix_commit_commands/');
    expect(req.request.method).toEqual('POST');
    req.flush('success');
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failureHandler).not.toHaveBeenCalled();
  }));

  it('should fail to fix the commit commands', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failureHandler = jasmine.createSpy('failure');

    fixCommitCommandBackendApiService
      .fixCommitCommandsAsync()
      .then(successHandler, failureHandler);

    const req = http.expectOne('/fix_commit_commands/');
    expect(req.request.method).toEqual('POST');
    req.flush('failure', {
      status: 404, statusText: 'Page not found'
    });
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failureHandler).not.toHaveBeenCalled();
  }));
});
