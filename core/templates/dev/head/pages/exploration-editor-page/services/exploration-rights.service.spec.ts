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

// TODO(#7222): Remove the following block of unnnecessary imports once
// exploration-rights.service.ts is upgraded to Angular 8.
import { ExplorationDraftObjectFactory } from
  'domain/exploration/ExplorationDraftObjectFactory';
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('pages/exploration-editor-page/services/exploration-rights.service.ts');

describe('Exploration rights service', function() {
  var ers, als;
  var $httpBackend = null;
  var CsrfService = null;
  var sampleDataResults = {
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
  var clearWarningsSpy = null;

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value(
      'ExplorationDraftObjectFactory', new ExplorationDraftObjectFactory());
    $provide.value(
      'ExplorationDataService', {
        explorationId: '12345',
        data: {
          version: 1
        }
      });
  }));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));
  beforeEach(angular.mock.inject(function($injector, $q) {
    ers = $injector.get('ExplorationRightsService');
    als = $injector.get('AlertsService');
    $httpBackend = $injector.get('$httpBackend');
    CsrfService = $injector.get('CsrfTokenService');

    spyOn(CsrfService, 'getTokenAsync').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve('sample-csrf-token');
      return deferred.promise;
    });

    clearWarningsSpy = spyOn(als, 'clearWarnings').and.callThrough();
  }));

  it('should correctly initializes the service', function() {
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
      sampleDataResults.rights.owner_names,
      sampleDataResults.rights.editor_names,
      sampleDataResults.rights.voice_artist_names,
      sampleDataResults.rights.viewer_names,
      sampleDataResults.rights.status,
      sampleDataResults.rights.cloned_from,
      sampleDataResults.rights.community_owned,
      sampleDataResults.rights.viewable_if_private
    );

    expect(ers.ownerNames).toEqual(sampleDataResults.rights.owner_names);
    expect(ers.editorNames).toEqual(sampleDataResults.rights.editor_names);
    expect(ers.voiceArtistNames).toEqual(
      sampleDataResults.rights.voice_artist_names);
    expect(ers.viewerNames).toEqual(sampleDataResults.rights.viewer_names);
    expect(ers.isPrivate()).toEqual(true);
    expect(ers.clonedFrom()).toEqual(sampleDataResults.rights.cloned_from);
    expect(ers.isCommunityOwned()).toBe(
      sampleDataResults.rights.community_owned);
    expect(ers.viewableIfPrivate()).toBe(
      sampleDataResults.rights.viewable_if_private);
  });

  it('should reports the correct cloning status', function() {
    ers.init(['abc'], [], [], [], 'public', '1234', true);
    expect(ers.isCloned()).toBe(true);
    expect(ers.clonedFrom()).toEqual('1234');

    ers.init(['abc'], [], [], [], 'public', null, true);
    expect(ers.isCloned()).toBe(false);
    expect(ers.clonedFrom()).toBeNull();
  });

  it('should reports the correct community-owned status', function() {
    ers.init(['abc'], [], [], [], 'public', '1234', false);
    expect(ers.isCommunityOwned()).toBe(false);

    ers.init(['abc'], [], [], [], 'public', '1234', true);
    expect(ers.isCommunityOwned()).toBe(true);
  });

  it('should reports the correct derived statuses', function() {
    ers.init(['abc'], [], [], [], 'private', 'e1234', true);
    expect(ers.isPrivate()).toBe(true);
    expect(ers.isPublic()).toBe(false);

    ers.init(['abc'], [], [], [], 'public', 'e1234', true);
    expect(ers.isPrivate()).toBe(false);
    expect(ers.isPublic()).toBe(true);
  });

  it('should reports correcty if exploration rights is viewable when private',
    function() {
      ers.init(['abc'], [], [], [], 'private', 'e1234', true, true);
      expect(ers.viewableIfPrivate()).toBe(true);

      ers.init(['abc'], [], [], [], 'private', 'e1234', false, false);
      expect(ers.viewableIfPrivate()).toBe(false);
    });

  it('should change community owned to true', function() {
    ers.init(['abc'], [], [], [], 'private', 'e1234', false, true);

    $httpBackend.expectPUT('/createhandler/rights/12345').respond(
      200, sampleDataResults);
    ers.makeCommunityOwned().then(function() {
      expect(clearWarningsSpy).toHaveBeenCalled();
      expect(ers.isCommunityOwned()).toBe(true);
    });
    $httpBackend.flush();
  });

  it('should use reject handler when changing community owned to true fails',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      ers.init(['abc'], [], [], [], 'private', 'e1234', false, true);

      $httpBackend.expectPUT('/createhandler/rights/12345')
        .respond(500);
      ers.makeCommunityOwned().then(successHandler, failHandler);
      $httpBackend.flush();

      expect(ers.isCommunityOwned()).toBe(false);
      expect(clearWarningsSpy).not.toHaveBeenCalled();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    });

  it('should change exploration right viewability', function() {
    var sampleDataResultsCopy = angular.copy(sampleDataResults);
    sampleDataResultsCopy.rights.viewable_if_private = true;

    $httpBackend.expectPUT('/createhandler/rights/12345').respond(
      200, sampleDataResultsCopy);
    ers.setViewability(true).then(function() {
      expect(ers.viewableIfPrivate()).toBe(true);
    });
    $httpBackend.flush();
  });

  it('should use reject when changing exploration right viewability fails',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      ers.init(['abc'], [], [], [], 'private', 'e1234', false, false);

      $httpBackend.expectPUT('/createhandler/rights/12345')
        .respond(500);
      ers.setViewability(true).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(ers.viewableIfPrivate()).toBe(false);
      expect(clearWarningsSpy).not.toHaveBeenCalled();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    });

  it('should save a new member', function() {
    var sampleDataResultsCopy = angular.copy(sampleDataResults);
    sampleDataResultsCopy.rights.viewer_names.push('newUser');

    $httpBackend.expectPUT('/createhandler/rights/12345').respond(
      200, sampleDataResultsCopy);
    ers.saveRoleChanges('newUser', 'viewer').then(function() {
      expect(ers.viewerNames).toEqual(
        sampleDataResultsCopy.rights.viewer_names);
    });
    $httpBackend.flush();
  });

  it('should reject handler when saving a new member fails', function() {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    $httpBackend.expectPUT('/createhandler/rights/12345')
      .respond(500);
    ers.saveRoleChanges('newUser', 'viewer').then(successHandler, failHandler);
    $httpBackend.flush();

    expect(clearWarningsSpy).not.toHaveBeenCalled();
    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  });

  it('should make exploration rights public', function() {
    var sampleDataResultsCopy = angular.copy(sampleDataResults);
    sampleDataResultsCopy.rights.status = 'public';

    $httpBackend.expectPUT('/createhandler/status/12345').respond(
      200, sampleDataResultsCopy);
    ers.publish(true).then(function() {
      expect(ers.isPublic()).toBe(true);
    });
    $httpBackend.flush();
  });

  it('should call reject handler when making exploration rights public fails',
    function() {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      $httpBackend.expectPUT('/createhandler/status/12345')
        .respond(500);
      ers.publish(true).then(successHandler, failHandler);
      $httpBackend.flush();

      expect(clearWarningsSpy).not.toHaveBeenCalled();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    });

  it('should save moderator change to backend', function() {
    $httpBackend.expectPUT('/createhandler/moderatorrights/12345').respond(
      200, sampleDataResults);
    ers.saveModeratorChangeToBackend();
    $httpBackend.flush();

    expect(clearWarningsSpy).toHaveBeenCalled();
    expect(ers.ownerNames).toEqual(sampleDataResults.rights.owner_names);
    expect(ers.editorNames).toEqual(sampleDataResults.rights.editor_names);
    expect(ers.voiceArtistNames).toEqual(
      sampleDataResults.rights.voice_artist_names);
    expect(ers.viewerNames).toEqual(sampleDataResults.rights.viewer_names);
    expect(ers.isPrivate()).toEqual(true);
    expect(ers.clonedFrom()).toEqual(sampleDataResults.rights.cloned_from);
    expect(ers.isCommunityOwned()).toBe(
      sampleDataResults.rights.community_owned);
    expect(ers.viewableIfPrivate()).toBe(
      sampleDataResults.rights.viewable_if_private);
  });

  it('should reject handler when saving moderator change to backend fails',
    function() {
      $httpBackend.expectPUT('/createhandler/moderatorrights/12345')
        .respond(500);
      ers.saveModeratorChangeToBackend();
      $httpBackend.flush();

      expect(clearWarningsSpy).not.toHaveBeenCalled();
      expect(ers.ownerNames).toBeUndefined();
      expect(ers.editorNames).toBeUndefined();
      expect(ers.voiceArtistNames).toBeUndefined();
      expect(ers.viewerNames).toBeUndefined();
      expect(ers.isPrivate()).toBe(false);
      expect(ers.isPublic()).toBe(false);
      expect(ers.clonedFrom()).toBeUndefined();
      expect(ers.isCommunityOwned()).toBeUndefined();
      expect(ers.viewableIfPrivate()).toBeUndefined();
    });
});
