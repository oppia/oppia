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
import { EventEmitter } from '@angular/core';

import { HttpClientTestingModule, HttpTestingController }
  from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { ContextService } from
  'services/context.service';
import { UserExplorationPermissionsService } from
  'pages/exploration-editor-page/services/user-exploration-permissions.service';
import { ExplorationPermissions } from
  'domain/exploration/exploration-permissions.model';

describe('User Exploration Permissions Service', () => {
  let ueps: UserExplorationPermissionsService;
  let contextService: ContextService;
  let httpTestingController: HttpTestingController;

  let sampleExplorationId = 'sample-exploration';
  let samplePermissionsData = {
    can_edit: false,
    can_voiceover: true,
    can_unpublish: false,
    can_release_ownership: false,
    can_publish: false,
    can_delete: false,
    can_modify_roles: false,
    can_manage_voice_artist: false
  };
  let permissionsResponse: ExplorationPermissions;


  beforeEach(()=> {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    httpTestingController = TestBed.inject(HttpTestingController);
    ueps = TestBed.inject(UserExplorationPermissionsService);
    contextService = TestBed.inject(ContextService);
    permissionsResponse =
      ExplorationPermissions.createFromBackendDict(samplePermissionsData);
    spyOn(contextService, 'getExplorationId').and.returnValue(
      sampleExplorationId);
    UserExplorationPermissionsService.permissionsPromise = null;
  });

  afterEach(()=> {
    httpTestingController.verify();
  });

  it('should fetch the correct data', fakeAsync(() => {
    ueps.getPermissionsAsync().then((response) => {
      expect(response).toEqual(permissionsResponse);
    });

    let req = httpTestingController.expectOne(
      '/createhandler/permissions/' + sampleExplorationId);
    expect(req.request.method).toEqual('GET');
    req.flush(samplePermissionsData);
    flushMicrotasks();
  }));

  it('should cache rights data', fakeAsync(() => {
    ueps.getPermissionsAsync();
    let req = httpTestingController.expectOne(
      '/createhandler/permissions/' + sampleExplorationId);
    expect(req.request.method).toEqual('GET');
    req.flush(samplePermissionsData);
    flushMicrotasks();

    ueps.getPermissionsAsync();
    httpTestingController.expectNone(
      '/createhandler/permissions/' + sampleExplorationId);
  }));

  it('should fetch rights data irrespective' +
  'whether it is cached or not', fakeAsync(() => {
    ueps.getPermissionsAsync();
    let req = httpTestingController.expectOne(
      '/createhandler/permissions/' + sampleExplorationId);
    expect(req.request.method).toEqual('GET');
    req.flush(samplePermissionsData);
    flushMicrotasks();

    ueps.fetchPermissionsAsync();
    let req2 = httpTestingController.expectOne(
      '/createhandler/permissions/' + sampleExplorationId);

    expect(req2.request.method).toEqual('GET');
    req2.flush(samplePermissionsData);
    flushMicrotasks();
  }));

  it('should emit when the user exploration' +
  'permissions are fetched', fakeAsync(() => {
    let mockuserExplorationPermissionsFetched = new EventEmitter();
    ueps.fetchPermissionsAsync();
    let req = httpTestingController.expectOne(
      '/createhandler/permissions/' + sampleExplorationId);

    expect(req.request.method).toEqual('GET');
    req.flush(samplePermissionsData);
    flushMicrotasks();
    expect(ueps.onUserExplorationPermissionsFetched).toEqual(
      mockuserExplorationPermissionsFetched);
  }));
});
