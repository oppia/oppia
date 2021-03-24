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
 * @fileoverview Unit tests for the exploration rights service
 * of the exploration editor page.
 */

import { AppConstants } from 'app.constants';
import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { AlertsService } from 'services/alerts.service';
import { CsrfTokenService } from 'services/csrf-token.service';

import { ExplorationRightsService } from
  // eslint-disable-next-line max-len
  'pages/exploration-editor-page/services/exploration-rights-backend-api.service';
import { ExplorationDataService } from
  'pages/exploration-editor-page/services/exploration-data.service';

describe('Exploration rights service', () => {
  let explorationRightsService: ExplorationRightsService = null;
  let httpTestingController: HttpTestingController = null;
  let alertsService: AlertsService = null;
  let csrfService = null;
  let clearWarningsSpy = null;
  let successHandler = null;
  let failHandler = null;
  let sampleDataResults = {
    rights: {
      owner_names: ['abc'],
      editor_names: [],
      voice_artist_names: [],
      viewer_names: [],
      status: 'private',
      cloned_from: 'e1234',
      community_owned: true,
      viewable_if_private: true
    }
  };

  let mockFunction = (): void => {
    return;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: ExplorationDataService,
          useValue: {
            explorationId: '12345',
            data: {
              version: 1
            }
          }
        }
      ]
    });
    alertsService = TestBed.inject(AlertsService);
    csrfService = TestBed.inject(CsrfTokenService);
    explorationRightsService =
      TestBed.inject(ExplorationRightsService);
    httpTestingController = TestBed.inject(HttpTestingController);

    spyOn(csrfService, 'getTokenAsync').and.callFake(() => {
      return Promise.resolve('simple-csrf-token');
    });
    clearWarningsSpy = spyOn(alertsService, 'clearWarnings').and.callThrough();
  });

  beforeEach(() => {
    successHandler = jasmine.createSpy('success');
    failHandler = jasmine.createSpy('fail');
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should correctly initializes the service', () => {
    expect(explorationRightsService.ownerNames).toBeUndefined();
    expect(explorationRightsService.editorNames).toBeUndefined();
    expect(explorationRightsService.voiceArtistNames).toBeUndefined();
    expect(explorationRightsService.viewerNames).toBeUndefined();
    expect(explorationRightsService.isPrivate()).toBe(false);
    expect(explorationRightsService.isPublic()).toBe(false);
    expect(explorationRightsService.clonedFrom()).toBeUndefined();
    expect(explorationRightsService.isCommunityOwned()).toBeUndefined();
    expect(explorationRightsService.viewableIfPrivate()).toBeUndefined();

    explorationRightsService.init(
      sampleDataResults.rights.owner_names,
      sampleDataResults.rights.editor_names,
      sampleDataResults.rights.voice_artist_names,
      sampleDataResults.rights.viewer_names,
      sampleDataResults.rights.status,
      sampleDataResults.rights.cloned_from,
      sampleDataResults.rights.community_owned,
      sampleDataResults.rights.viewable_if_private
    );

    expect(explorationRightsService.ownerNames).toEqual(
      sampleDataResults.rights.owner_names);
    expect(explorationRightsService.editorNames).toEqual(
      sampleDataResults.rights.editor_names);
    expect(explorationRightsService.voiceArtistNames).toEqual(
      sampleDataResults.rights.voice_artist_names);
    expect(explorationRightsService.viewerNames).toEqual(
      sampleDataResults.rights.viewer_names);
    expect(explorationRightsService.isPrivate()).toEqual(true);
    expect(explorationRightsService.clonedFrom()).toEqual(
      sampleDataResults.rights.cloned_from);
    expect(explorationRightsService.isCommunityOwned()).toBe(
      sampleDataResults.rights.community_owned);
    expect(explorationRightsService.viewableIfPrivate()).toBe(
      sampleDataResults.rights.viewable_if_private);
  });

  it('should reports the correct cloning status', () => {
    explorationRightsService.init(
      ['abc'], [], [], [], 'public', '1234', true, false);
    expect(explorationRightsService.isCloned()).toBe(true);
    expect(explorationRightsService.clonedFrom()).toEqual('1234');

    explorationRightsService.init(
      ['abc'], [], [], [], 'public', null, true, false);
    expect(explorationRightsService.isCloned()).toBe(false);
    expect(explorationRightsService.clonedFrom()).toBeNull();
  });

  it('should reports the correct community-owned status', () => {
    explorationRightsService.init(
      ['abc'], [], [], [], 'public', '1234', false, false);
    expect(explorationRightsService.isCommunityOwned()).toBe(false);

    explorationRightsService.init(
      ['abc'], [], [], [], 'public', '1234', true, false);
    expect(explorationRightsService.isCommunityOwned()).toBe(true);
  });

  it('should reports the correct derived statuses', () => {
    explorationRightsService.init(
      ['abc'], [], [], [], 'private', 'e1234', true, false);
    expect(explorationRightsService.isPrivate()).toBe(true);
    expect(explorationRightsService.isPublic()).toBe(false);

    explorationRightsService.init(
      ['abc'], [], [], [], 'public', 'e1234', true, false);
    expect(explorationRightsService.isPrivate()).toBe(false);
    expect(explorationRightsService.isPublic()).toBe(true);
  });

  it('should reports correcty if exploration rights is viewable when private',
    () => {
      explorationRightsService.init(
        ['abc'], [], [], [], 'private', 'e1234', true, true);
      expect(explorationRightsService.viewableIfPrivate()).toBe(true);

      explorationRightsService.init(
        ['abc'], [], [], [], 'private', 'e1234', false, false);
      expect(explorationRightsService.viewableIfPrivate()).toBe(false);
    });

  it('should change community owned to true', fakeAsync(() => {
    explorationRightsService.init(
      ['abc'], [], [], [], 'private', 'e1234', false, true);

    explorationRightsService.makeCommunityOwned(mockFunction);

    const req = httpTestingController.expectOne('/createhandler/rights/12345');
    expect(req.request.method).toEqual('PUT');
    req.flush(sampleDataResults);

    flushMicrotasks();

    expect(clearWarningsSpy).toHaveBeenCalled();
    expect(explorationRightsService.isCommunityOwned()).toBe(true);
  }));

  it('should use reject handler when changing community owned to true fails',
    fakeAsync(() => {
      explorationRightsService.init(
        ['abc'], [], [], [], 'private', 'e1234', false, true);
      explorationRightsService.makeCommunityOwned(mockFunction).then(
        successHandler, failHandler);

      const req = httpTestingController.expectOne(
        '/createhandler/rights/12345');
      expect(req.request.method).toEqual('PUT');
      req.flush({}, {status: 500, statusText: ''});

      flushMicrotasks();

      expect(explorationRightsService.isCommunityOwned()).toBe(false);
      expect(clearWarningsSpy).not.toHaveBeenCalled();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }));

  it('should change exploration right viewability', fakeAsync(() => {
    let sampleDataResultsCopy = angular.copy(sampleDataResults);
    sampleDataResultsCopy.rights.viewable_if_private = true;

    explorationRightsService.setViewability(true, mockFunction);

    const req = httpTestingController.expectOne(
      '/createhandler/rights/12345');
    expect(req.request.method).toEqual('PUT');
    req.flush(sampleDataResultsCopy, {status: 200, statusText: ''});

    flushMicrotasks();

    expect(explorationRightsService.viewableIfPrivate()).toBe(true);
  }));

  it('should use reject when changing exploration right viewability fails',
    fakeAsync(() => {
      explorationRightsService.init(
        ['abc'], [], [], [], 'private', 'e1234', false, false);
      explorationRightsService.setViewability(true, mockFunction).then(
        successHandler, failHandler);

      const req = httpTestingController.expectOne(
        '/createhandler/rights/12345');
      expect(req.request.method).toEqual('PUT');
      req.flush({}, {status: 500, statusText: ''});

      flushMicrotasks();

      expect(explorationRightsService.viewableIfPrivate()).toBe(false);
      expect(clearWarningsSpy).not.toHaveBeenCalled();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }));

  it('should save a new member', fakeAsync(() => {
    let sampleDataResultsCopy = angular.copy(sampleDataResults);
    sampleDataResultsCopy.rights.viewer_names.push('newUser');
    explorationRightsService.saveRoleChanges(
      'newUser', AppConstants.ROLE_VIEWER, mockFunction);

    const req = httpTestingController.expectOne(
      '/createhandler/rights/12345');
    expect(req.request.method).toEqual('PUT');
    req.flush(sampleDataResultsCopy, {status: 200, statusText: ''});

    flushMicrotasks();

    expect(explorationRightsService.viewerNames).toEqual(
      sampleDataResultsCopy.rights.viewer_names);
  }));

  it('should remove existing user', fakeAsync(() => {
    let sampleDataResultsCopy = angular.copy(sampleDataResults);
    sampleDataResultsCopy.rights.viewer_names.push('newUser');

    explorationRightsService.removeRoleAsync(
      'newUser').then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      '/createhandler/rights/12345?username=newUser');
    expect(req.request.method).toEqual('DELETE');
    req.flush(sampleDataResultsCopy, {status: 200, statusText: ''});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should check user already has roles', fakeAsync(() => {
    var sampleDataResultsCopy = angular.copy(sampleDataResults);
    sampleDataResultsCopy.rights.owner_names.push('newOwner');
    sampleDataResultsCopy.rights.viewer_names.push('newViewer');
    sampleDataResultsCopy.rights.editor_names.push('newEditor');
    sampleDataResultsCopy.rights.voice_artist_names.push('newVoiceArtist');

    explorationRightsService.init(
      sampleDataResultsCopy.rights.owner_names,
      sampleDataResultsCopy.rights.editor_names,
      sampleDataResultsCopy.rights.voice_artist_names,
      sampleDataResultsCopy.rights.viewer_names,
      sampleDataResultsCopy.rights.status,
      sampleDataResultsCopy.rights.cloned_from,
      sampleDataResultsCopy.rights.community_owned,
      sampleDataResultsCopy.rights.viewable_if_private
    );

    expect(explorationRightsService.checkUserAlreadyHasRoles(
      'newOwner')).toBeTruthy();
    expect(explorationRightsService.checkUserAlreadyHasRoles(
      'newViewer')).toBeTruthy();
    expect(explorationRightsService.checkUserAlreadyHasRoles(
      'newEditor')).toBeTruthy();
    expect(explorationRightsService.checkUserAlreadyHasRoles(
      'newVoiceArtist')).toBeTruthy();
    expect(explorationRightsService.checkUserAlreadyHasRoles(
      'notInAllUsersList')).toBeFalsy();
  }));

  it('should check oldrole of user', fakeAsync(() => {
    var sampleDataResultsCopy = angular.copy(sampleDataResults);
    sampleDataResultsCopy.rights.owner_names.push('newOwner');
    sampleDataResultsCopy.rights.viewer_names.push('newViewer');
    sampleDataResultsCopy.rights.editor_names.push('newEditor');
    sampleDataResultsCopy.rights.voice_artist_names.push('newVoiceArtist');

    explorationRightsService.init(
      sampleDataResultsCopy.rights.owner_names,
      sampleDataResultsCopy.rights.editor_names,
      sampleDataResultsCopy.rights.voice_artist_names,
      sampleDataResultsCopy.rights.viewer_names,
      sampleDataResultsCopy.rights.status,
      sampleDataResultsCopy.rights.cloned_from,
      sampleDataResultsCopy.rights.community_owned,
      sampleDataResultsCopy.rights.viewable_if_private
    );

    expect(explorationRightsService.getOldRole('newOwner')).toEqual(
      AppConstants.ROLE_OWNER);
    expect(explorationRightsService.getOldRole('newViewer')).toEqual(
      AppConstants.ROLE_VIEWER);
    expect(explorationRightsService.getOldRole('newEditor')).toEqual(
      AppConstants.ROLE_EDITOR);
    expect(explorationRightsService.getOldRole('newVoiceArtist')).toEqual(
      AppConstants.ROLE_VOICE_ARTIST);
  }));

  it('should reject handler when saving a new member fails', fakeAsync(() => {
    explorationRightsService.saveRoleChanges(
      'newUser', AppConstants.ROLE_VIEWER, mockFunction).then(
      successHandler, failHandler);

    const req = httpTestingController.expectOne(
      '/createhandler/rights/12345');
    expect(req.request.method).toEqual('PUT');
    req.flush({}, {status: 500, statusText: ''});

    flushMicrotasks();

    expect(clearWarningsSpy).not.toHaveBeenCalled();
    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should make exploration rights public', fakeAsync(() => {
    let sampleDataResultsCopy = angular.copy(sampleDataResults);
    sampleDataResultsCopy.rights.status = 'public';

    explorationRightsService.publish();

    const req = httpTestingController.expectOne(
      '/createhandler/status/12345');
    expect(req.request.method).toEqual('PUT');
    req.flush(sampleDataResultsCopy, {status: 200, statusText: ''});

    flushMicrotasks();

    expect(explorationRightsService.isPublic()).toBe(true);
  }));

  it('should call reject handler when making exploration rights public fails',
    fakeAsync(() => {
      explorationRightsService.publish().then(successHandler, failHandler);

      const req = httpTestingController.expectOne(
        '/createhandler/status/12345');
      expect(req.request.method).toEqual('PUT');
      req.flush({}, {status: 500, statusText: ''});

      flushMicrotasks();

      expect(clearWarningsSpy).not.toHaveBeenCalled();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }));

  it('should save moderator change to backend', fakeAsync(() => {
    explorationRightsService.saveModeratorChangeToBackend('', mockFunction);

    const req = httpTestingController.expectOne(
      '/createhandler/moderatorrights/12345');
    expect(req.request.method).toEqual('PUT');
    req.flush(sampleDataResults, {status: 200, statusText: ''});
    flushMicrotasks();

    expect(clearWarningsSpy).toHaveBeenCalled();
    expect(explorationRightsService.ownerNames).toEqual(
      sampleDataResults.rights.owner_names);
    expect(explorationRightsService.editorNames).toEqual(
      sampleDataResults.rights.editor_names);
    expect(explorationRightsService.voiceArtistNames).toEqual(
      sampleDataResults.rights.voice_artist_names);
    expect(explorationRightsService.viewerNames).toEqual(
      sampleDataResults.rights.viewer_names);
    expect(explorationRightsService.isPrivate()).toEqual(true);
    expect(explorationRightsService.clonedFrom()).toEqual(
      sampleDataResults.rights.cloned_from);
    expect(explorationRightsService.isCommunityOwned()).toBe(
      sampleDataResults.rights.community_owned);
    expect(explorationRightsService.viewableIfPrivate()).toBe(
      sampleDataResults.rights.viewable_if_private);
  }));

  it('should reject handler when saving moderator change to backend fails',
    fakeAsync(() => {
      explorationRightsService.saveModeratorChangeToBackend('', mockFunction);

      const req = httpTestingController.expectOne(
        '/createhandler/moderatorrights/12345');
      expect(req.request.method).toEqual('PUT');
      req.flush({}, {status: 500, statusText: ''});
      flushMicrotasks();

      expect(clearWarningsSpy).not.toHaveBeenCalled();
      expect(explorationRightsService.ownerNames).toBeUndefined();
      expect(explorationRightsService.editorNames).toBeUndefined();
      expect(explorationRightsService.voiceArtistNames).toBeUndefined();
      expect(explorationRightsService.viewerNames).toBeUndefined();
      expect(explorationRightsService.isPrivate()).toBe(false);
      expect(explorationRightsService.isPublic()).toBe(false);
      expect(explorationRightsService.clonedFrom()).toBeUndefined();
      expect(explorationRightsService.isCommunityOwned()).toBeUndefined();
      expect(explorationRightsService.viewableIfPrivate()).toBeUndefined();
    }));
});
