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

  it('should successfully send put http request when' +
    ' makeCommunityOwnedPutData called', fakeAsync(
    () => {
      let requestData = {
        version: 3,
        make_community_owned: true
      };

      service.makeCommunityOwnedPutData(
        'oppia12345', requestData.version, requestData.make_community_owned
      ).then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/createhandler/rights/oppia12345');
      expect(req.request.method).toEqual('PUT');
      expect(req.request.body).toEqual(requestData);
      req.flush([]);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should successfully send put http request when' +
  ' when saveRoleChangesPutData called', fakeAsync(
    () => {
      let requestData = {
        version: 3,
        new_member_role: 'editor',
        new_member_username: 'usernameForEditorRole'
      };

      service.saveRoleChangesPutData(
        'oppia12345', requestData.version, requestData.new_member_role,
        requestData.new_member_username
      ).then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/createhandler/rights/oppia12345');
      expect(req.request.method).toEqual('PUT');
      expect(req.request.body).toEqual(requestData);
      req.flush([]);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should successfully send put http request' +
  ' when setViewabilityPutData called', fakeAsync(
    () => {
      let requestData = {
        version: 3,
        viewableIfPrivate: true
      };

      service.setViewabilityPutData(
        'oppia12345', requestData.version, requestData.viewableIfPrivate
      ).then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/createhandler/rights/oppia12345');
      expect(req.request.method).toEqual('PUT');
      expect(req.request.body).toEqual(requestData);
      req.flush([]);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should successfully send put http request' +
  'when publishPutData called', fakeAsync(() => {
    let requestData = {
      make_public: true
    };

    service.publishPutData(
      'oppia12345', requestData.make_public
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/createhandler/status/oppia12345');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(requestData);
    req.flush([]);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  })
  );

  it('should successfully send put http request' +
  ' when saveModeratorChangeToBackendAsyncPutData called', fakeAsync(() => {
    let requestData = {
      version: 3,
      email_body: ''
    };

    service.saveModeratorChangeToBackendAsyncPutData(
      'oppia12345', requestData.version, requestData.email_body
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/createhandler/moderatorrights/oppia12345');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(requestData);
    req.flush([]);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  })
  );

  it('should successfully send Delete http request' +
  ' when removeRoleAsyncDeleteData called', fakeAsync(
    () => {
      service.removeRoleAsyncDeleteData(
        'oppia12345', 'userNameToDeleteTheUser'
      ).then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/createhandler/rights/oppia12345?username=userNameToDeleteTheUser');
      expect(req.request.method).toEqual('DELETE');
      req.flush([]);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should successfully send http Post request' +
  ' when assignVoiceArtistRoleAsyncPostData called', fakeAsync(() => {
    let requestData = {
      username: 'usernameForAssignVoiceArtistRole'
    };

    service.assignVoiceArtistRoleAsyncPostData(
      'oppia12345', requestData.username
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/voice_artist_management_handler/exploration/oppia12345');

    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(requestData);
    req.flush([]);
    flushMicrotasks();
    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  })
  );

  it('should successfully send Delete http request' +
  ' when removeVoiceArtistRoleAsyncDeleteData called', fakeAsync(() => {
    service.removeVoiceArtistRoleAsyncDeleteData(
      'oppia12345', 'usernameForRemoveVoiceArtistRole'
    ).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/voice_artist_management_handler/' +
      'exploration/oppia12345?voice_artist=usernameForRemoveVoiceArtistRole');
    expect(req.request.method).toEqual('DELETE');
    req.flush([]);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  })
  );
});
