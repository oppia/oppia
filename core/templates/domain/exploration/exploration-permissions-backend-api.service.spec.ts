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
 * @fileoverview Unit tests for ExplorationPermissionsBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { ContextService } from 'services/context.service';
import { ExplorationPermissionsBackendApiService } from
  'domain/exploration/exploration-permissions-backend-api.service';
import { ExplorationPermissionsObjectFactory } from
  'domain/exploration/exploration-permissions-object.factory';

describe('Exploration permissions backend api service', () => {
  let epbas: ExplorationPermissionsBackendApiService;
  let epof: ExplorationPermissionsObjectFactory;
  let httpTestingController: HttpTestingController;
  let contextService: ContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    epbas = TestBed.get(ExplorationPermissionsBackendApiService);
    epof = TestBed.get(ExplorationPermissionsObjectFactory);
    httpTestingController = TestBed.get(HttpTestingController);
    contextService = TestBed.get(ContextService);

    spyOn(contextService, 'getExplorationId').and.returnValue('exp1');
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should correctly fetch permissions', fakeAsync(() => {
    let backendResponse = {
      can_unpublish: true,
      can_release_ownership: false,
      can_publish: false,
      can_voiceover: true,
      can_delete: false,
      can_modify_roles: true,
      can_edit: true
    };

    let expectedResponse = epof.createFromBackendDict(backendResponse);

    epbas.getPermissions().then((expPermissions) => {
      expect(expPermissions).toEqual(expectedResponse);
    });

    let req = httpTestingController.expectOne(
      '/createhandler/permissions/exp1');
    expect(req.request.method).toEqual('GET');
    req.flush(backendResponse);

    flushMicrotasks();
  }));
});
