// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for VoiceoverContributionBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';
import {VoiceoverContributionBackendApiService} from './voiceover-contribution-backend-api.service';

describe('Voiceover contribution backend api service', () => {
  let voiceoverContributionBackendApiService: VoiceoverContributionBackendApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [VoiceoverContributionBackendApiService],
    });
    voiceoverContributionBackendApiService = TestBed.get(
      VoiceoverContributionBackendApiService
    );
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch data from the backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    voiceoverContributionBackendApiService
      .getVoiceoverContributionDataAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/voiceover_contribution_handler'
    );
    expect(req.request.method).toEqual('GET');
    let enableVoiceoverContribution = true;
    req.flush(enableVoiceoverContribution);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use rejection handler if data backend request failed', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    voiceoverContributionBackendApiService
      .getVoiceoverContributionDataAsync()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/voiceover_contribution_handler'
    );
    expect(req.request.method).toEqual('GET');
    req.flush(
      {
        error: 'Error loading data.',
      },
      {
        status: 500,
        statusText: 'Invalid Request',
      }
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should make request to update voiceover contribution is enabled data', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let enableVoiceoverContribution = true;

    voiceoverContributionBackendApiService
      .updateVoiceoverContributionDataAsync(enableVoiceoverContribution)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/voiceover_contribution_handler'
    );

    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual({
      enable_voiceover_contribution: enableVoiceoverContribution,
    });
    req.flush({status: 200, statusText: 'Success.'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use reject hanlder while updating voiceover contribution data', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let enableVoiceoverContribution = true;

    voiceoverContributionBackendApiService
      .updateVoiceoverContributionDataAsync(enableVoiceoverContribution)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/voiceover_contribution_handler'
    );
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual({
      enable_voiceover_contribution: enableVoiceoverContribution,
    });

    req.flush(
      {
        error: "You don't have rights to update data.",
      },
      {
        status: 401,
        statusText: 'Invalid Request',
      }
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));
});
