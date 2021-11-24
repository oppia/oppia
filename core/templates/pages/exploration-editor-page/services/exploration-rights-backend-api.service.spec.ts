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
 * @fileoverview Unit tests for Exploration Rights Backend Api Service
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed, waitForAsync} from '@angular/core/testing';
import { ExplorationRightsBackendApiService } from './exploration-rights-backend-api.service';

describe('Exploration Rights Backend Api Service', () => {
  let service: ExplorationRightsBackendApiService;
  let httpTestingController: HttpTestingController;
  let successHandler = jasmine.createSpy('success');
  let failHandler = jasmine.createSpy('fail');

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ExplorationRightsBackendApiService]
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(ExplorationRightsBackendApiService);
  }));

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should check makeCommunityOwnedPutData working fine',
    fakeAsync(() => {
      service.makeCommunityOwnedPutData(
        '/oppia', 3, true
      ).then(successHandler, failHandler);

      let req = httpTestingController.expectOne('/oppia');
      expect(req.request.method).toEqual('PUT');
      req.flush([]);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should check saveRoleChangesPutData working fine',
    fakeAsync(() => {
      service.saveRoleChangesPutData(
        '/oppia', 3, 'editor', 'shivam'
      ).then(successHandler, failHandler);

      let req = httpTestingController.expectOne('/oppia');
      expect(req.request.method).toEqual('PUT');
      req.flush([]);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should check setViewabilityPutData working fine',
    fakeAsync(() => {
      service.setViewabilityPutData(
        '/oppia', 3, true
      ).then(successHandler, failHandler);

      let req = httpTestingController.expectOne('/oppia');
      expect(req.request.method).toEqual('PUT');
      req.flush([]);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should check publishPutData working fine',
    fakeAsync(() => {
      service.publishPutData(
        '/oppia', true
      ).then(successHandler, failHandler);

      let req = httpTestingController.expectOne('/oppia');
      expect(req.request.method).toEqual('PUT');
      req.flush([]);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should check saveModeratorChangeToBackendAsyncPutData working fine',
    fakeAsync(() => {
      service.saveModeratorChangeToBackendAsyncPutData(
        '/oppia', 3, ''
      ).then(successHandler, failHandler);

      let req = httpTestingController.expectOne('/oppia');
      expect(req.request.method).toEqual('PUT');
      req.flush([]);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should check removeRoleAsyncDeleteData working fine',
    fakeAsync(() => {
      service.removeRoleAsyncDeleteData(
        '/oppia', 'shivam'
      ).then(successHandler, failHandler);

      let req = httpTestingController.expectOne('/oppia?username=shivam');
      expect(req.request.method).toEqual('DELETE');
      req.flush([]);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should check assignVoiceArtistRoleAsyncPostData working fine',
    fakeAsync(() => {
      service.assignVoiceArtistRoleAsyncPostData(
        '/oppia', 'shivam'
      ).then(successHandler, failHandler);

      let req = httpTestingController.expectOne('/oppia');
      expect(req.request.method).toEqual('POST');
      req.flush([]);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should check removeVoiceArtistRoleAsyncDeleteData working fine',
    fakeAsync(() => {
      service.removeVoiceArtistRoleAsyncDeleteData(
        '/oppia', 'shivam'
      ).then(successHandler, failHandler);

      let req = httpTestingController.expectOne('/oppia?voice_artist=shivam');
      expect(req.request.method).toEqual('DELETE');
      req.flush([]);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );
});
