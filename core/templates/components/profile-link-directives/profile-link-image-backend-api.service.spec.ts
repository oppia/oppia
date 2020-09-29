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
 * @fileoverview Unit tests for Profile Link Backend Api Service
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { ProfileLinkImageBackendApiService } from
  'components/profile-link-directives/profile-link-image-backend-api.service';

describe('Profile Link Backend Api Service', () => {
  let httpTestingController: HttpTestingController;
  let profileLinkImageBackendApiService: ProfileLinkImageBackendApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    httpTestingController = TestBed.get(HttpTestingController);
    profileLinkImageBackendApiService = TestBed.get(
      ProfileLinkImageBackendApiService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch profile photo details', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    profileLinkImageBackendApiService.fetchProfilePictureDataAsync(
      '/preferenceshandler/profile_picture_by_username/user').then(
      successHandler);
    let req = httpTestingController.expectOne(
      '/preferenceshandler/profile_picture_by_username/user');
    expect(req.request.method).toEqual('GET');
    let sampleData = {
      profile_picture_data_url_for_username: 'picture_data'
    };
    req.flush(sampleData);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(
      sampleData.profile_picture_data_url_for_username);
  }));
});
