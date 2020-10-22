// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for LearnerPlaylistService.js.
 */

require('domain/learner_dashboard/learner-playlist.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/csrf-token.service.ts');
// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.
// TODO(#7222): Remove usage of importAllAngularServices once upgraded to
// Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils';

import { LearnerDashboardActivityIds } from
  'domain/learner_dashboard/learner-dashboard-activity-ids.model';
import { TranslatorProviderForTests } from 'tests/test.extras';

describe('Learner playlist service factory', function() {
  var LearnerPlaylistService = null;
  var $httpBackend = null;
  var $rootScope = null;
  var $q = null;
  var activityType = null;
  var UrlInterpolationService = null;
  var activityId = '1';
  var addToLearnerPlaylistUrl = '';
  var AlertsService = null;
  var CsrfService = null;
  var $uibModal = null;
  importAllAngularServices();

  beforeEach(angular.mock.module('oppia'));
  beforeEach(
    angular.mock.module('oppia', TranslatorProviderForTests));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector, _$q_) {
    $httpBackend = $injector.get('$httpBackend');
    LearnerPlaylistService = $injector.get(
      'LearnerPlaylistService');
    $rootScope = $injector.get('$rootScope');
    $q = _$q_;
    activityType = $injector.get('ACTIVITY_TYPE_EXPLORATION');
    UrlInterpolationService = $injector.get('UrlInterpolationService');
    AlertsService = $injector.get('AlertsService');
    spyOn(AlertsService, 'addInfoMessage').and.callThrough();
    spyOn(AlertsService, 'addSuccessMessage').and.callThrough();
    CsrfService = $injector.get('CsrfTokenService');
    $uibModal = $injector.get('$uibModal');

    spyOn(CsrfService, 'getTokenAsync').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve('sample-csrf-token');
      return deferred.promise;
    });
  }));

  beforeEach(function() {
    addToLearnerPlaylistUrl = (
      UrlInterpolationService.interpolateUrl(
        '/learnerplaylistactivityhandler/<activityType>/<activityId>', {
          activityType: activityType,
          activityId: activityId
        }));
  });
  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully add playlist to play later list', function() {
    var response = {
      belongs_to_completed_or_incomplete_list: false,
      belongs_to_subscribed_activities: false,
      playlist_limit_exceeded: false
    };
    $httpBackend.expectPOST(addToLearnerPlaylistUrl).respond(
      JSON.stringify(response));
    LearnerPlaylistService.addToLearnerPlaylist(activityId, activityType);

    $httpBackend.flush();
    $rootScope.$digest();
    expect(AlertsService.addSuccessMessage).toHaveBeenCalledWith(
      'Successfully added to your \'Play Later\' list.');
    expect(AlertsService.addInfoMessage).not.toHaveBeenCalled();
  });

  it('should not add playlist to play later list' +
    'and show belongs to completed or incomplete list', function() {
    var response = {
      belongs_to_completed_or_incomplete_list: true,
      belongs_to_subscribed_activities: false,
      playlist_limit_exceeded: false
    };
    $httpBackend.expectPOST(addToLearnerPlaylistUrl).respond(
      JSON.stringify(response));
    LearnerPlaylistService.addToLearnerPlaylist(activityId, activityType);

    $httpBackend.flush();
    $rootScope.$digest();
    expect(AlertsService.addInfoMessage).toHaveBeenCalledWith(
      'You have already completed or are completing this activity.');
    expect(AlertsService.addSuccessMessage).not.toHaveBeenCalled();
  });

  it('should not add playlist to play later list' +
    'and show belongs to subscribed activities', function() {
    var response = {
      belongs_to_completed_or_incomplete_list: false,
      belongs_to_subscribed_activities: true,
      playlist_limit_exceeded: false
    };
    $httpBackend.expectPOST(addToLearnerPlaylistUrl).respond(
      JSON.stringify(response));
    LearnerPlaylistService.addToLearnerPlaylist(activityId, activityType);

    $httpBackend.flush();
    $rootScope.$digest();
    expect(AlertsService.addInfoMessage).toHaveBeenCalledWith(
      'This is present in your creator dashboard');
    expect(AlertsService.addSuccessMessage).not.toHaveBeenCalled();
  });

  it('should not add playlist to play later list' +
    'and show playlist limit exceeded', function() {
    var response = {
      belongs_to_completed_or_incomplete_list: false,
      belongs_to_subscribed_activities: false,
      playlist_limit_exceeded: true
    };
    $httpBackend.expectPOST(addToLearnerPlaylistUrl).respond(
      JSON.stringify(response));
    LearnerPlaylistService.addToLearnerPlaylist(activityId, activityType);

    $httpBackend.flush();
    $rootScope.$digest();
    expect(AlertsService.addInfoMessage).toHaveBeenCalledWith(
      'Your \'Play Later\' list is full!  Either you can ' +
      'complete some or you can head to the learner dashboard ' +
      'and remove some.');
    expect(AlertsService.addSuccessMessage).not.toHaveBeenCalled();
  });

  it('should open an $uibModal when removing from learner playlist',
    function() {
      var modalSpy = spyOn($uibModal, 'open').and.callThrough();
      LearnerPlaylistService.removeFromLearnerPlaylist(
        '0', 'title', 'exploration', []);
      expect(modalSpy).toHaveBeenCalled();
    });

  it('should remove an exploration from learner playlist', function() {
    spyOn($uibModal, 'open').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve();
      return {
        result: deferred.promise
      };
    });

    var learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        exploration_playlist_ids: ['0', '1', '2'],
        collection_playlist_ids: []
      });

    LearnerPlaylistService.removeFromLearnerPlaylist(
      '0', 'title', 'exploration', learnerDashboardActivityIds);
    $rootScope.$apply();

    expect(learnerDashboardActivityIds.explorationPlaylistIds).toEqual(
      ['1', '2']);
  });

  it('should remove a collection from learner playlist', function() {
    spyOn($uibModal, 'open').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve();
      return {
        result: deferred.promise
      };
    });
    var learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: ['0', '1', '2']
      });

    LearnerPlaylistService.removeFromLearnerPlaylist(
      '0', 'title', 'collection', learnerDashboardActivityIds);
    $rootScope.$apply();

    expect(learnerDashboardActivityIds.collectionPlaylistIds).toEqual(
      ['1', '2']);
  });

  it('should not remove anything from learner playlist when cancel' +
    ' button is clicked', function() {
    spyOn($uibModal, 'open').and.callFake(function() {
      var deferred = $q.defer();
      deferred.reject();
      return {
        result: deferred.promise
      };
    });
    var learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: ['0', '1', '2']
      });

    LearnerPlaylistService.removeFromLearnerPlaylist(
      activityId, 'title', 'collection', learnerDashboardActivityIds);
    $rootScope.$apply();

    expect(learnerDashboardActivityIds.collectionPlaylistIds).toEqual(
      ['0', '1', '2']);
  });
});
