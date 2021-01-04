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

import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { LearnerDashboardActivityIds } from
  'domain/learner_dashboard/learner-dashboard-activity-ids.model';
import { TranslatorProviderForTests } from 'tests/test.extras';
import { LearnerPlaylistService } from './learner-playlist.service';
import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { HttpBackend } from '@angular/common/http';
import constants from 'assets/constants';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { AlertsService } from 'services/alerts.service';
import { CsrfTokenService } from 'services/csrf-token.service';

describe('Learner playlist service factory', () => {
  let httpBackend: HttpBackend = null;
  let activityType = null;
  let urlInterpolationService: UrlInterpolationService = null;
  let activityId = '1';
  let addToLearnerPlaylistUrl = '';
  let alertsService: AlertsService = null;
  let csrfService: CsrfTokenService = null;
  let $uibModal = null;
  let httpTestingController: HttpTestingController;
  let instance: LearnerPlaylistService;

  beforeEach(
    angular.mock.module('oppia', TranslatorProviderForTests));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    httpTestingController = TestBed.get(HttpTestingController);
    instance = TestBed.get(LearnerPlaylistService);
    httpBackend = TestBed.get(HttpBackend);
    activityType = TestBed.get(constants.ACTIVITY_TYPE_EXPLORATION);
    urlInterpolationService = TestBed.get(UrlInterpolationService);
    alertsService = TestBed.get(AlertsService);
    csrfService = TestBed.get(CsrfTokenService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  spyOn(alertsService, 'addInfoMessage').and.callThrough();
  spyOn(alertsService, 'addSuccessMessage').and.callThrough();
  spyOn(csrfService, 'getTokenAsync').and.callFake(function() {
    var deferred = $q.defer();
    deferred.resolve('sample-csrf-token');
    return deferred.promise;
  });

  beforeEach(() => {
    addToLearnerPlaylistUrl = (
      urlInterpolationService.interpolateUrl(
        '/learnerplaylistactivityhandler/<activityType>/<activityId>', {
          activityType: activityType,
          activityId: activityId
        }));
  });
  afterEach(() => {
    httpBackend.verifyNoOutstandingExpectation();
    httpBackend.verifyNoOutstandingRequest();
  });

  it('should successfully add playlist to play later list', fakeAsync(() => {
    let response = {
      belongs_to_completed_or_incomplete_list: false,
      belongs_to_subscribed_activities: false,
      playlist_limit_exceeded: false
    };
    $httpBackend.expectPOST(addToLearnerPlaylistUrl).respond(
      JSON.stringify(response));
    instance.addToLearnerPlaylist(activityId, activityType);

    $httpBackend.flush();
    $rootScope.$digest();
    expect(AlertsService.addSuccessMessage).toHaveBeenCalledWith(
      'Successfully added to your \'Play Later\' list.');
    expect(AlertsService.addInfoMessage).not.toHaveBeenCalled();
  }));

  it('should not add playlist to play later list' +
    'and show belongs to completed or incomplete list', fakeAsync(() => {
    var response = {
      belongs_to_completed_or_incomplete_list: true,
      belongs_to_subscribed_activities: false,
      playlist_limit_exceeded: false
    };
    $httpBackend.expectPOST(addToLearnerPlaylistUrl).respond(
      JSON.stringify(response));
    instance.addToLearnerPlaylist(activityId, activityType);

    $httpBackend.flush();
    this.digest();
    expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
      'You have already completed or are completing this activity.');
    expect(alertsService.addSuccessMessage).not.toHaveBeenCalled();
  }));

  it('should not add playlist to play later list' +
    'and show belongs to subscribed activities', fakeAsync(() => {
    var response = {
      belongs_to_completed_or_incomplete_list: false,
      belongs_to_subscribed_activities: true,
      playlist_limit_exceeded: false
    };
    $httpBackend.expectPOST(addToLearnerPlaylistUrl).respond(
      JSON.stringify(response));
    instance.addToLearnerPlaylist(activityId, activityType);

    $httpBackend.flush();
    $rootScope.$digest();
    expect(AlertsService.addInfoMessage).toHaveBeenCalledWith(
      'This is present in your creator dashboard');
    expect(AlertsService.addSuccessMessage).not.toHaveBeenCalled();
  }));

  it('should not add playlist to play later list' +
    'and show playlist limit exceeded', fakeAsync(() => {
    var response = {
      belongs_to_completed_or_incomplete_list: false,
      belongs_to_subscribed_activities: false,
      playlist_limit_exceeded: true
    };
    $httpBackend.expectPOST(addToLearnerPlaylistUrl).respond(
      JSON.stringify(response));
    instance.addToLearnerPlaylist(activityId, activityType);

    $httpBackend.flush();
    $rootScope.$digest();
    expect(AlertsService.addInfoMessage).toHaveBeenCalledWith(
      'Your \'Play Later\' list is full!  Either you can ' +
      'complete some or you can head to the learner dashboard ' +
      'and remove some.');
    expect(AlertsService.addSuccessMessage).not.toHaveBeenCalled();
  }));

  it('should open an $uibModal when removing from learner playlist',
    fakeAsync(() => {
      var modalSpy = spyOn($uibModal, 'open').and.callThrough();
      instance.removeFromLearnerPlaylist(
        '0', 'title', 'exploration', []);
      expect(modalSpy).toHaveBeenCalled();
    }));

  it('should remove an exploration from learner playlist', fakeAsync(() => {
    spyOn($uibModal, 'open').and.callFake(function() {
      var deferred = $q.defer();
      deferred.resolve();
      return {
        result: deferred.promise
      };
    });

    let learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        exploration_playlist_ids: ['0', '1', '2'],
        collection_playlist_ids: []
      });

    instance.removeFromLearnerPlaylist(
      '0', 'title', 'exploration', learnerDashboardActivityIds);
    $rootScope.$apply();

    expect(learnerDashboardActivityIds.explorationPlaylistIds).toEqual(
      ['1', '2']);
  }));

  it('should remove a collection from learner playlist', fakeAsync(() => {
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

    instance.removeFromLearnerPlaylist(
      '0', 'title', 'collection', learnerDashboardActivityIds);
    $rootScope.$apply();

    expect(learnerDashboardActivityIds.collectionPlaylistIds).toEqual(
      ['1', '2']);
  }));

  it('should not remove anything from learner playlist when cancel' +
    ' button is clicked', fakeAsync(() => {
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

    instance.removeFromLearnerPlaylist(
      activityId, 'title', 'collection', learnerDashboardActivityIds);
    $rootScope.$apply();

    expect(learnerDashboardActivityIds.collectionPlaylistIds).toEqual(
      ['0', '1', '2']);
  }));
});
