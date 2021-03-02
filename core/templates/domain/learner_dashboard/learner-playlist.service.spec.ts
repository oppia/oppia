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

import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { LearnerDashboardActivityIds } from
  'domain/learner_dashboard/learner-dashboard-activity-ids.model';
import { TranslatorProviderForTests } from 'tests/test.extras';
import { LearnerPlaylistService } from './learner-playlist.service';
import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { AlertsService } from 'services/alerts.service';
import { CsrfTokenService } from 'services/csrf-token.service';
import { ChangeDetectorRef } from '@angular/core';
import { ApplicationRef } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';

export class MockChangeDetectorRef {
  detectChanges: () => void;
}

export class MockApplicationRef {
  tick: () => void;
}
export class MockNgbModalRef {
  result: Promise<void> = new Promise((resolve) => resolve());
}

fdescribe('Learner playlist service factory', () => {
  let activityType: string;
  let urlInterpolationService: UrlInterpolationService;
  let activityId = '1';
  let addToLearnerPlaylistUrl = '';
  let alertsService: AlertsService;
  let csrfService: CsrfTokenService;
  let httpTestingController: HttpTestingController;
  let instance: LearnerPlaylistService;
  let ref: ChangeDetectorRef;
  let appRef: ApplicationRef;
  let ngbModal: NgbModal;
  let mockModalRef: NgbModalRef;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(
    angular.mock.module('oppia', TranslatorProviderForTests));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        LearnerPlaylistService,
        {
          provide: ChangeDetectorRef,
          useClass: MockChangeDetectorRef,
        },
        {
          provide: NgbModalRef,
          useClass: MockNgbModalRef,
        },
      ],
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    instance = TestBed.inject(LearnerPlaylistService);
    ref = TestBed.inject(ChangeDetectorRef);
    appRef = TestBed.inject(ApplicationRef);
    activityType = AppConstants.ACTIVITY_TYPE_EXPLORATION;
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    alertsService = TestBed.inject(AlertsService);
    csrfService = TestBed.inject(CsrfTokenService);
    ngbModal = TestBed.inject(NgbModal);
    mockModalRef = TestBed.inject(NgbModalRef);
    spyOn(alertsService, 'addInfoMessage').and.callThrough();
    spyOn(alertsService, 'addSuccessMessage').and.callThrough();
    spyOn(csrfService, 'getTokenAsync').and.callFake(
      (): Promise<string> => {
        return new Promise<string>((resolve) => {
          resolve('sample-csrf-token');
        });
      });
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
    httpTestingController.verify();
  });

  fit('should successfully add playlist to play later list', fakeAsync(() => {
    let response = {
      belongs_to_completed_or_incomplete_list: false,
      belongs_to_subscribed_activities: false,
      playlist_limit_exceeded: false
    };
    instance.addToLearnerPlaylist(activityId, activityType);
    let req = httpTestingController.expectOne(addToLearnerPlaylistUrl);
    expect(req.request.method).toEqual('POST');
    req.flush(JSON.stringify(response));

    flushMicrotasks();
    appRef.tick();
    expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
      'Successfully added to your \'Play Later\' list.');
    expect(alertsService.addInfoMessage).not.toHaveBeenCalled();
  }));

  fit('should not add playlist to play later list' +
    ' and show belongs to completed or incomplete list', fakeAsync(() => {
    let response = {
      belongs_to_completed_or_incomplete_list: true,
      belongs_to_subscribed_activities: false,
      playlist_limit_exceeded: false
    };
    let req = httpTestingController.expectOne(addToLearnerPlaylistUrl);
    expect(req.request.method).toEqual('POST');
    req.flush(JSON.stringify(response));
    instance.addToLearnerPlaylist(activityId, activityType);

    flushMicrotasks();
    appRef.tick();
    expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
      'You have already completed or are completing this activity.');
    expect(alertsService.addSuccessMessage).not.toHaveBeenCalled();
  }));

  fit('should not add playlist to play later list' +
    ' and show belongs to subscribed activities', fakeAsync(() => {
    let response = {
      belongs_to_completed_or_incomplete_list: false,
      belongs_to_subscribed_activities: true,
      playlist_limit_exceeded: false
    };
    let req = httpTestingController.expectOne(addToLearnerPlaylistUrl);
    expect(req.request.method).toEqual('POST');
    req.flush(JSON.stringify(response));
    instance.addToLearnerPlaylist(activityId, activityType);

    flushMicrotasks();
    appRef.tick();
    expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
      'This is present in your creator dashboard');
    expect(alertsService.addSuccessMessage).not.toHaveBeenCalled();
  }));

  fit('should not add playlist to play later list' +
    ' and show playlist limit exceeded', fakeAsync(() => {
    let response = {
      belongs_to_completed_or_incomplete_list: false,
      belongs_to_subscribed_activities: false,
      playlist_limit_exceeded: true
    };
    let req = httpTestingController.expectOne(addToLearnerPlaylistUrl);
    expect(req.request.method).toEqual('POST');
    req.flush(JSON.stringify(response));
    instance.addToLearnerPlaylist(activityId, activityType);

    flushMicrotasks();
    appRef.tick();
    expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
      'Your \'Play Later\' list is full!  Either you can ' +
      'complete some or you can head to the learner dashboard ' +
      'and remove some.');
    expect(alertsService.addSuccessMessage).not.toHaveBeenCalled();
  }));

  fit('should open an ngbModal when removing from learner playlist',
    fakeAsync(() => {
      let learnerDashboardActivityIds = LearnerDashboardActivityIds
        .createFromBackendDict({
          incomplete_exploration_ids: [],
          incomplete_collection_ids: [],
          completed_exploration_ids: [],
          completed_collection_ids: [],
          exploration_playlist_ids: ['0', '1', '2'],
          collection_playlist_ids: []
        });
      const modalSpy = spyOn(ngbModal, 'open').and.callThrough();
      instance.removeFromLearnerPlaylist(
        '0', 'title', 'exploration', learnerDashboardActivityIds);
      expect(modalSpy).toHaveBeenCalled();
    }));

  fit('should remove an exploration from learner playlist', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue(mockModalRef);
    let deferred = new Promise<void>((resolve) => {
      resolve();
    });
    mockModalRef.result = deferred;

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
    ref.detectChanges();

    expect(learnerDashboardActivityIds.explorationPlaylistIds).toEqual(
      ['1', '2']);
  }));

  fit('should remove a collection from learner playlist', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue(mockModalRef);
    let deferred = new Promise<void>((resolve) => {
      resolve();
    });
    mockModalRef.result = deferred;
    let learnerDashboardActivityIds = LearnerDashboardActivityIds
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
    ref.detectChanges();

    expect(learnerDashboardActivityIds.collectionPlaylistIds).toEqual(
      ['1', '2']);
  }));

  fit('should not remove anything from learner playlist when cancel' +
    ' button is clicked', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue(mockModalRef);
    let deferred = new Promise<void>((reject) => {
      reject();
    });
    mockModalRef.result = deferred;
    let learnerDashboardActivityIds = LearnerDashboardActivityIds
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
    ref.detectChanges();

    expect(learnerDashboardActivityIds.collectionPlaylistIds).toEqual(
      ['0', '1', '2']);
  }));
});
