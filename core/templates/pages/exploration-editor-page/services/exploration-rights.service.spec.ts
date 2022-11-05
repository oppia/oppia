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

import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AlertsService } from 'services/alerts.service';
import { CsrfTokenService } from 'services/csrf-token.service';
import { ExplorationDataService } from 'pages/exploration-editor-page/services/exploration-data.service';
import { ExplorationRightsService } from './exploration-rights.service';
import { ExplorationRightsBackendApiService } from './exploration-rights-backend-api.service';
import cloneDeep from 'lodash/cloneDeep';

describe('Exploration rights service', () => {
  let ers: ExplorationRightsService = null;
  let als: AlertsService = null;
  let httpTestingController: HttpTestingController = null;
  let explorationRightsBackendApiService: ExplorationRightsBackendApiService;
  let csrfService = null;
  let clearWarningsSpy = null;
  let successHandler = null;
  let failHandler = null;
  let alertsService: AlertsService;
  let serviceData = {
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AlertsService,
        {
          provide: ExplorationDataService,
          useValue: {
            explorationId: '12345',
            data: {
              version: 1
            }
          }
        },
        ExplorationRightsBackendApiService
      ]
    });

    als = TestBed.inject(AlertsService);
    csrfService = TestBed.inject(CsrfTokenService);
    ers = TestBed.inject(ExplorationRightsService);
    httpTestingController = TestBed.inject(HttpTestingController);
    explorationRightsBackendApiService =
      TestBed.inject(ExplorationRightsBackendApiService);
  });

  beforeEach(() => {
    spyOn(csrfService, 'getTokenAsync').and.callFake(() => {
      return Promise.resolve('simple-csrf-token');
    });
    clearWarningsSpy = spyOn(als, 'clearWarnings').and.callThrough();
    successHandler = jasmine.createSpy('success');
    failHandler = jasmine.createSpy('fail');
    alertsService = TestBed.inject(AlertsService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should correctly initializes the service', () => {
    expect(ers.ownerNames).toBeUndefined();
    expect(ers.editorNames).toBeUndefined();
    expect(ers.voiceArtistNames).toBeUndefined();
    expect(ers.viewerNames).toBeUndefined();
    expect(ers.isPrivate()).toBe(false);
    expect(ers.isPublic()).toBe(false);
    expect(ers.clonedFrom()).toBeUndefined();
    expect(ers.isCommunityOwned()).toBeUndefined();
    expect(ers.viewableIfPrivate()).toBeUndefined();

    ers.init(
      serviceData.rights.owner_names,
      serviceData.rights.editor_names,
      serviceData.rights.voice_artist_names,
      serviceData.rights.viewer_names,
      serviceData.rights.status,
      serviceData.rights.cloned_from,
      serviceData.rights.community_owned,
      serviceData.rights.viewable_if_private
    );

    expect(ers.ownerNames).toEqual(serviceData.rights.owner_names);
    expect(ers.editorNames).toEqual(serviceData.rights.editor_names);
    expect(ers.voiceArtistNames).toEqual(
      serviceData.rights.voice_artist_names);
    expect(ers.viewerNames).toEqual(serviceData.rights.viewer_names);
    expect(ers.isPrivate()).toEqual(true);
    expect(ers.clonedFrom()).toEqual(serviceData.rights.cloned_from);
    expect(ers.isCommunityOwned()).toBe(
      serviceData.rights.community_owned);
    expect(ers.viewableIfPrivate()).toBe(
      serviceData.rights.viewable_if_private);
  });

  it('should reports the correct cloning status', () => {
    ers.init(['abc'], [], [], [], 'public', '1234', true, false);
    expect(ers.isCloned()).toBe(true);
    expect(ers.clonedFrom()).toEqual('1234');

    ers.init(['abc'], [], [], [], 'public', null, true, false);
    expect(ers.isCloned()).toBe(false);
    expect(ers.clonedFrom()).toBeNull();
  });

  it('should reports the correct community-owned status', () => {
    ers.init(['abc'], [], [], [], 'public', '1234', false, false);
    expect(ers.isCommunityOwned()).toBe(false);

    ers.init(['abc'], [], [], [], 'public', '1234', true, false);
    expect(ers.isCommunityOwned()).toBe(true);
  });

  it('should reports the correct derived statuses', () => {
    ers.init(['abc'], [], [], [], 'private', 'e1234', true, false);
    expect(ers.isPrivate()).toBe(true);
    expect(ers.isPublic()).toBe(false);

    ers.init(['abc'], [], [], [], 'public', 'e1234', true, false);
    expect(ers.isPrivate()).toBe(false);
    expect(ers.isPublic()).toBe(true);
  });

  it('should reports correcty if exploration rights is viewable when private',
    () => {
      ers.init(['abc'], [], [], [], 'private', 'e1234', true, true);
      expect(ers.viewableIfPrivate()).toBe(true);

      ers.init(['abc'], [], [], [], 'private', 'e1234', false, false);
      expect(ers.viewableIfPrivate()).toBe(false);
    });

  it('should change community owned to true', fakeAsync(() => {
    serviceData.rights.community_owned = true;
    spyOn(
      explorationRightsBackendApiService,
      'makeCommunityOwnedPutData').and.returnValue(
      Promise.resolve(serviceData));

    ers.init(['abc'], [], [], [], 'private', 'e1234', false, true);
    ers.makeCommunityOwned();
    tick();
    expect(explorationRightsBackendApiService.makeCommunityOwnedPutData)
      .toHaveBeenCalled();
    expect(ers.isCommunityOwned()).toBe(true);
  }));

  it('should use reject handler when changing community owned to true fails',
    fakeAsync(() => {
      spyOn(
        explorationRightsBackendApiService,
        'makeCommunityOwnedPutData').and.returnValue(
        Promise.reject());

      ers.init(
        ['abc'], [], [], [], 'private', 'e1234', false, true);
      ers.makeCommunityOwned().then(
        successHandler, failHandler);
      tick();

      expect(ers.isCommunityOwned()).toBe(false);
      expect(clearWarningsSpy).not.toHaveBeenCalled();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }));

  it('should change exploration right viewability', fakeAsync(() => {
    serviceData.rights.viewable_if_private = true;
    spyOn(
      explorationRightsBackendApiService,
      'setViewabilityPutData').and.returnValue(
      Promise.resolve(serviceData));

    ers.setViewability(true);
    tick();

    expect(ers.viewableIfPrivate()).toBe(true);
  }));

  it('should use reject when changing exploration right viewability fails',
    fakeAsync(() => {
      spyOn(
        explorationRightsBackendApiService,
        'setViewabilityPutData').and.returnValue(
        Promise.reject());

      ers.init(
        ['abc'], [], [], [], 'private', 'e1234', false, false);
      ers.setViewability(true).then(
        successHandler, failHandler);
      tick();

      expect(ers.viewableIfPrivate()).toBe(false);
      expect(clearWarningsSpy).not.toHaveBeenCalled();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }));

  it('should save a new member', fakeAsync(() => {
    serviceData.rights.viewer_names = ['viewerName'];
    spyOn(
      explorationRightsBackendApiService,
      'saveRoleChangesPutData').and.returnValue(
      Promise.resolve(serviceData));

    ers.saveRoleChanges('newUser', 'viewer');
    tick();

    expect(ers.viewerNames).toEqual(
      ['viewerName']);
  }));

  it('should remove existing user', fakeAsync(() => {
    serviceData.rights.viewer_names = ['newUser'];
    spyOn(
      explorationRightsBackendApiService,
      'removeRoleAsyncDeleteData').and.returnValue(
      Promise.resolve(serviceData));

    ers.removeRoleAsync('newUser').then(successHandler, failHandler);
    tick();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();

    expect(ers.viewerNames).toEqual(
      serviceData.rights.viewer_names);
  }));

  it('should save a new voice artist', fakeAsync(() => {
    serviceData.rights.voice_artist_names = ['voiceArtist'];
    spyOn(
      explorationRightsBackendApiService,
      'assignVoiceArtistRoleAsyncPostData').and.returnValue(
      Promise.resolve(serviceData));

    ers.init(['abc'], [], [], [], 'public', '1234', true, false);
    expect(ers.voiceArtistNames).toEqual([]);

    ers.assignVoiceArtistRoleAsync('voiceArtist').then(
      successHandler, failHandler);
    tick();

    expect(ers.voiceArtistNames).toEqual(['voiceArtist']);
  }));

  it('should reject handler when saving a voice artist fails', fakeAsync(() => {
    spyOn(
      explorationRightsBackendApiService,
      'assignVoiceArtistRoleAsyncPostData').and.returnValue(
      Promise.reject());
    spyOn(alertsService, 'addWarning').and.callThrough();

    ers.assignVoiceArtistRoleAsync('voiceArtist').then(
      successHandler, failHandler);
    tick();

    expect(
      explorationRightsBackendApiService
        .assignVoiceArtistRoleAsyncPostData
    ).toHaveBeenCalled();
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Could not assign voice artist to private activity.'
    );
  }));

  it('should remove existing voice artist', fakeAsync(() => {
    serviceData.rights.voice_artist_names = [];

    spyOn(
      explorationRightsBackendApiService,
      'removeVoiceArtistRoleAsyncDeleteData').and.returnValue(
      Promise.resolve(serviceData));

    ers.init(['abc'], [], ['voiceArtist'], [], 'public', '1234', true, false);
    tick();
    expect(ers.voiceArtistNames).toEqual(['voiceArtist']);

    ers.removeVoiceArtistRoleAsync('voiceArtist').then(
      successHandler, failHandler);
    tick();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();

    expect(ers.voiceArtistNames).toEqual([]);
  }));

  it('should check user already has roles', () => {
    serviceData.rights.owner_names = ['newOwner'];
    serviceData.rights.viewer_names = ['newViewer'];
    serviceData.rights.editor_names = ['newEditor'];
    serviceData.rights.voice_artist_names = ['newVoiceArtist'];

    ers.init(
      serviceData.rights.owner_names,
      serviceData.rights.editor_names,
      serviceData.rights.voice_artist_names,
      serviceData.rights.viewer_names,
      serviceData.rights.status,
      serviceData.rights.cloned_from,
      serviceData.rights.community_owned,
      serviceData.rights.viewable_if_private
    );

    expect(ers.checkUserAlreadyHasRoles('newOwner')).toBeTruthy();
    expect(ers.checkUserAlreadyHasRoles('newViewer')).toBeTruthy();
    expect(ers.checkUserAlreadyHasRoles('newEditor')).toBeTruthy();
    expect(ers.checkUserAlreadyHasRoles('newVoiceArtist')).toBeTruthy();
    expect(ers.checkUserAlreadyHasRoles('notInAllUsersList')).toBeFalsy();
  });

  it('should check oldrole of user', () => {
    let sampleDataResultsCopy = cloneDeep(serviceData);
    sampleDataResultsCopy.rights.owner_names.push('newOwner');
    sampleDataResultsCopy.rights.viewer_names.push('newViewer');
    sampleDataResultsCopy.rights.editor_names.push('newEditor');
    sampleDataResultsCopy.rights.voice_artist_names.push('newVoiceArtist');

    ers.init(
      sampleDataResultsCopy.rights.owner_names,
      sampleDataResultsCopy.rights.editor_names,
      sampleDataResultsCopy.rights.voice_artist_names,
      sampleDataResultsCopy.rights.viewer_names,
      sampleDataResultsCopy.rights.status,
      sampleDataResultsCopy.rights.cloned_from,
      sampleDataResultsCopy.rights.community_owned,
      sampleDataResultsCopy.rights.viewable_if_private
    );

    expect(ers.getOldRole('newOwner')).toEqual('owner');
    expect(ers.getOldRole('newViewer')).toEqual('viewer');
    expect(ers.getOldRole('newEditor')).toEqual('editor');
    expect(ers.getOldRole('newVoiceArtist')).toEqual('voice artist');
  });

  it('should reject handler when saving a new member fails', fakeAsync(() => {
    spyOn(
      explorationRightsBackendApiService,
      'saveRoleChangesPutData').and.returnValue(
      Promise.reject());

    ers.saveRoleChanges(
      'newUser', 'viewer').then(
      successHandler, failHandler);

    tick();

    expect(clearWarningsSpy).not.toHaveBeenCalled();
    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should make exploration rights public', fakeAsync(() => {
    let sampleDataResultsCopy = angular.copy(serviceData);
    sampleDataResultsCopy.rights.status = 'public';

    spyOn(
      explorationRightsBackendApiService,
      'publishPutData').and.returnValue(
      Promise.resolve(sampleDataResultsCopy));

    ers.publish();
    tick();

    expect(ers.isPublic()).toBe(true);
  }));

  it('should call reject handler when making exploration rights public fails',
    fakeAsync(() => {
      spyOn(
        explorationRightsBackendApiService,
        'publishPutData').and.returnValue(
        Promise.reject());

      ers.publish().then(successHandler, failHandler);
      tick();

      expect(clearWarningsSpy).not.toHaveBeenCalled();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }));

  it('should save moderator change to backend', fakeAsync(() => {
    spyOn(
      explorationRightsBackendApiService,
      'saveModeratorChangeToBackendAsyncPutData').and.returnValue(
      Promise.resolve(serviceData));

    ers.saveModeratorChangeToBackendAsync('');
    tick();

    expect(clearWarningsSpy).toHaveBeenCalled();
    expect(ers.ownerNames).toEqual(
      serviceData.rights.owner_names);
    expect(ers.editorNames).toEqual(
      serviceData.rights.editor_names);
    expect(ers.voiceArtistNames).toEqual(
      serviceData.rights.voice_artist_names);
    expect(ers.viewerNames).toEqual(
      serviceData.rights.viewer_names);
    expect(ers.isPrivate()).toEqual(true);
    expect(ers.clonedFrom()).toEqual(
      serviceData.rights.cloned_from);
    expect(ers.isCommunityOwned()).toBe(
      serviceData.rights.community_owned);
    expect(ers.viewableIfPrivate()).toBe(
      serviceData.rights.viewable_if_private);
  }));

  it('should reject handler when saving moderator change to backend fails',
    fakeAsync(() => {
      spyOn(
        explorationRightsBackendApiService,
        'saveModeratorChangeToBackendAsyncPutData').and.returnValue(
        Promise.reject());

      ers.saveModeratorChangeToBackendAsync('');
      tick();

      expect(clearWarningsSpy).not.toHaveBeenCalled();
      expect(ers.ownerNames).toBeNull();
      expect(ers.editorNames).toBeNull();
      expect(ers.voiceArtistNames).toBeNull();
      expect(ers.viewerNames).toBeNull();
      expect(ers.isPrivate()).toBe(false);
      expect(ers.isPublic()).toBe(false);
      expect(ers.clonedFrom()).toBeNull();
      expect(ers.isCommunityOwned()).toBeNull();
      expect(ers.viewableIfPrivate()).toBeNull();
    }));
});
