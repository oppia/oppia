// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the UserExplorationPermissionsService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { ContextService } from 'services/context.service';
import { UrlService } from 'services/contextual/url.service';
import { UserExplorationPermissionsService } from
  // eslint-disable-next-line max-len
  'pages/exploration-editor-page/services/user-exploration-permissions.service';

describe('User Exploration Permissions Service', () => {
  let ueps: UserExplorationPermissionsService;
  let contextService: ContextService;
  let urlService: UrlService;
  let httpTestingController: HttpTestingController;

  let sampleExplorationId = 'sample-exploration';
  let samplePermissionsData = {
    canEdit: false,
    canVoiceOver: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    httpTestingController = TestBed.get(HttpTestingController);
    ueps = TestBed.get(UserExplorationPermissionsService);
    contextService = TestBed.get(ContextService);
    urlService = TestBed.get(UrlService);

    spyOn(contextService, 'getExplorationId').and.returnValue(
      sampleExplorationId);
  });

  it('should fetch the correct data', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    ueps.getPermissionsAsync().then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/createhandler/permissions/' +
      sampleExplorationId);
    expect(req.request.method).toEqual('GET');
    req.flush(samplePermissionsData);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(samplePermissionsData);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should cache rights data', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    ueps.getPermissionsAsync().then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/createhandler/permissions/' +
      sampleExplorationId);
    expect(req.request.method).toEqual('GET');
    req.flush(samplePermissionsData);
    flushMicrotasks();

    expect(ueps.getPermissionsAsync).toThrowError();
  }));
});
