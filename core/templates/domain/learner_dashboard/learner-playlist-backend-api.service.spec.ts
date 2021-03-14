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
 * @fileoverview Tests for LearnerPlaylistBackendApiService.
 */

import { async, fakeAsync, flushMicrotasks, TestBed } from
  '@angular/core/testing';
import { CsrfTokenService } from 'services/csrf-token.service';
import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';

import { AlertsService } from 'services/alerts.service';
import { NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import { LearnerPlaylistBackendApiService } from
  'domain/learner_dashboard/learner-playlist-backend-api.service';
import { LearnerDashboardActivityIds } from
  'domain/learner_dashboard/learner-dashboard-activity-ids.model';

export class MockNgbModalRef {
  componentInstance: {
    activityId: null,
    activityTitle: null,
    activityType: null
  };
}

describe('Learner playlist service factory', () => {
  let learnerPlaylistBackendApiService: LearnerPlaylistBackendApiService;
  let http: HttpTestingController;
  let activityId = '1';
  let activityType = 'exploration';
  let alertsService: AlertsService;
  let csrfService: CsrfTokenService;
  let ngbModal: NgbModal;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
  }));

  beforeEach(() => {
    learnerPlaylistBackendApiService =
      TestBed.inject(LearnerPlaylistBackendApiService);
    ngbModal = TestBed.inject(NgbModal);
    http = TestBed.inject(HttpTestingController);
    csrfService = TestBed.inject(CsrfTokenService);
    alertsService = TestBed.inject(AlertsService);

    spyOn(csrfService, 'getTokenAsync').and.callFake(() => {
      return new Promise((resolve) => {
        resolve('sample-csrf-token');
      });
    });
    spyOn(alertsService, 'addInfoMessage').and.callThrough();
    spyOn(alertsService, 'addSuccessMessage').and.callThrough();
  });

  afterEach(() => {
    http.verify();
  });

  it('should successfully add playlist to play later list', fakeAsync(() => {
    let response = {
      belongs_to_completed_or_incomplete_list: false,
      belongs_to_subscribed_activities: false,
      playlist_limit_exceeded: false
    };
    learnerPlaylistBackendApiService.addToLearnerPlaylist(
      activityId, activityType);
    let req = http.expectOne(
      '/learnerplaylistactivityhandler/exploration/1');
    expect(req.request.method).toEqual('POST');
    req.flush(response);

    flushMicrotasks();
    expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
      'Successfully added to your \'Play Later\' list.');
    expect(alertsService.addInfoMessage).not.toHaveBeenCalled();
  }));

  it('should not add playlist to play later list ' +
    'and show belongs to completed or incomplete list', fakeAsync(() => {
    let response = {
      belongs_to_completed_or_incomplete_list: true,
      belongs_to_subscribed_activities: false,
      playlist_limit_exceeded: false
    };
    learnerPlaylistBackendApiService.addToLearnerPlaylist(
      activityId, activityType);
    let req = http.expectOne(
      '/learnerplaylistactivityhandler/exploration/1');
    expect(req.request.method).toEqual('POST');
    req.flush(response);

    flushMicrotasks();
    expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
      'You have already completed or are completing this activity.');
    expect(alertsService.addSuccessMessage).not.toHaveBeenCalled();
  }));

  it('should not add playlist to play later list ' +
    'and show belongs to subscribed activities', fakeAsync(() => {
    let response = {
      belongs_to_completed_or_incomplete_list: false,
      belongs_to_subscribed_activities: true,
      playlist_limit_exceeded: false
    };
    learnerPlaylistBackendApiService.addToLearnerPlaylist(
      activityId, activityType);
    let req = http.expectOne(
      '/learnerplaylistactivityhandler/exploration/1');
    expect(req.request.method).toEqual('POST');
    req.flush(response);

    flushMicrotasks();
    expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
      'This is present in your creator dashboard');
    expect(alertsService.addSuccessMessage).not.toHaveBeenCalled();
  }));

  it('should not add playlist to play later list ' +
    'and show playlist limit exceeded', fakeAsync(() => {
    let response = {
      belongs_to_completed_or_incomplete_list: false,
      belongs_to_subscribed_activities: false,
      playlist_limit_exceeded: true
    };
    learnerPlaylistBackendApiService.addToLearnerPlaylist(
      activityId, activityType);
    let req = http.expectOne(
      '/learnerplaylistactivityhandler/exploration/1');
    expect(req.request.method).toEqual('POST');
    req.flush(response);

    flushMicrotasks();
    expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
      'Your \'Play Later\' list is full!  Either you can ' +
      'complete some or you can head to the learner dashboard ' +
      'and remove some.');
    expect(alertsService.addSuccessMessage).not.toHaveBeenCalled();
  }));

  it('should open an ngbModal when removing from learner playlist',
    () => {
      let learnerDashboardActivityIds = LearnerDashboardActivityIds
        .createFromBackendDict({
          incomplete_exploration_ids: [],
          incomplete_collection_ids: [],
          completed_exploration_ids: [],
          completed_collection_ids: [],
          exploration_playlist_ids: [],
          collection_playlist_ids: []
        });
      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        setTimeout(opt.beforeDismiss);
        return <NgbModalRef>(
          { componentInstance: MockNgbModalRef,
            result: Promise.resolve('success')});
      });
      learnerPlaylistBackendApiService.removeFromLearnerPlaylist(
        '0', 'title', 'exploration', learnerDashboardActivityIds);
      expect(modalSpy).toHaveBeenCalled();
    });

  it('should remove an exploration from learner playlist', fakeAsync(() => {
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      setTimeout(opt.beforeDismiss);
      return <NgbModalRef>(
        { componentInstance: MockNgbModalRef,
          result: Promise.resolve('success')});
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

    learnerPlaylistBackendApiService.removeFromLearnerPlaylist(
      '0', 'title', 'exploration', learnerDashboardActivityIds);
    flushMicrotasks();

    expect(modalSpy).toHaveBeenCalled();
    expect(learnerDashboardActivityIds.explorationPlaylistIds).toEqual(
      ['1', '2']);
  }));

  it('should remove a collection from learner playlist', fakeAsync(() => {
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      setTimeout(opt.beforeDismiss);
      return <NgbModalRef>(
        { componentInstance: MockNgbModalRef,
          result: Promise.resolve('success')});
    });

    let learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: ['0', '1', '2']
      });

    learnerPlaylistBackendApiService.removeFromLearnerPlaylist(
      '0', 'title', 'collection', learnerDashboardActivityIds);
    flushMicrotasks();

    expect(modalSpy).toHaveBeenCalled();
    expect(learnerDashboardActivityIds.collectionPlaylistIds).toEqual(
      ['1', '2']);
  }));

  it('should not remove anything from learner playlist when cancel ' +
    'button is clicked', fakeAsync(() => {
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      setTimeout(opt.beforeDismiss);
      return <NgbModalRef>(
        { componentInstance: MockNgbModalRef,
          result: Promise.reject('fail')});
    });

    let learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: ['0', '1', '2']
      });

    learnerPlaylistBackendApiService.removeFromLearnerPlaylist(
      activityId, 'title', 'collection', learnerDashboardActivityIds);
    flushMicrotasks();

    expect(modalSpy).toHaveBeenCalled();
    expect(learnerDashboardActivityIds.collectionPlaylistIds).toEqual(
      ['0', '1', '2']);
  }));
});
