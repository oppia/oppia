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
 * @fileoverview Tests for LearnerPlaylistService.js.
 */

import { async, fakeAsync, flushMicrotasks, TestBed } from
'@angular/core/testing';
import { CsrfTokenService } from 'services/csrf-token.service';
import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';

import { AlertsService } from 'services/alerts.service';
import { NgbModal, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
// import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
// import { LearnerPlaylistModalComponent } from './learner-playlist-modal.component';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
// require('domain/learner_dashboard/learner-playlist.service.ts');
// require('domain/utilities/url-interpolation.service.ts');
// require('services/csrf-token.service.ts');
import { LearnerPlaylistService } from
  'domain/learner_dashboard/learner-playlist.service.ts';
import { LearnerPlaylistModalComponent } from
'domain/learner_dashboard/learner-playlist-modal.component.ts';
import { LearnerDashboardActivityIds } from
  'domain/learner_dashboard/learner-dashboard-activity-ids.model';
import { TranslatorProviderForTests } from 'tests/test.extras';

class MockNgbModal {
  open(): void {
    return;
  }

}
// class prom {
//   return new Promise((resolve, reject) => resolve(true));
// }

export class componentInstance{
  prompt: undefined;
  title: undefined;
}

export class result { 
}

export class MockNgbModalRef {
  componentInstance = {
      prompt: undefined,
      title: undefined
  };
  result: Promise<any> = new Promise((resolve, reject) => resolve(true));
}
// export class MockNgbModalRef {
//   result: Promise<any> = new Promise((resolve, reject) => resolve('x'));
// }

fdescribe('Learner playlist service factory', () => {
  let learnerPlaylistService: LearnerPlaylistService;
  let http: HttpTestingController;
  let urlInterpolationService:UrlInterpolationService;
  let activityId = '1';
  let activityType = 'exploration'
  let addToLearnerPlaylistUrl = '';
  let alertsService: AlertsService;
  let csrfService: CsrfTokenService;
  let ngbModal: NgbModal;
  let ngbModalRef: NgbModalRef;
  let mockModalRef: MockNgbModalRef = new MockNgbModalRef();
  
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: NgbModal, useClass: MockNgbModal
        }
      ]
    })
  }));

  beforeEach(() => {
    learnerPlaylistService = TestBed.inject(LearnerPlaylistService);
    ngbModal = TestBed.inject(NgbModal);
    //ngbModalRef = TestBed.inject(NgbModalRef);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
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

  // beforeEach(angular.mock.module('oppia'));
  // beforeEach(
  //   angular.mock.module('oppia', TranslatorProviderForTests));
  // beforeEach(angular.mock.module('oppia', function($provide) {
  //   let ugs = new UpgradedServices();
  //   for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
  //     $provide.value(key, value);
  //   }
  // }));

  // beforeEach(angular.mock.inject(function($injector, _$q_) {
  //   $httpBackend = $injector.get('$httpBackend');
  //   LearnerPlaylistService = $injector.get(
  //     'LearnerPlaylistService');
  //   $rootScope = $injector.get('$rootScope');
  //   $q = _$q_;
  //   activityType = $injector.get('ACTIVITY_TYPE_EXPLORATION');
  //   UrlInterpolationService = $injector.get('UrlInterpolationService');
  //   AlertsService = $injector.get('AlertsService');
  //   spyOn(AlertsService, 'addInfoMessage').and.callThrough();
  //   spyOn(AlertsService, 'addSuccessMessage').and.callThrough();
  //   CsrfService = $injector.get('CsrfTokenService');
  //   ngbModal = $injector.get('ngbModal');

  //   spyOn(CsrfService, 'getTokenAsync').and.callFake(() => {
  //     let deferred = $q.defer();
  //     deferred.resolve('sample-csrf-token');
  //     return deferred.promise;
  //   });
  // }));

  beforeEach(() => {
    addToLearnerPlaylistUrl = (
      urlInterpolationService.interpolateUrl(
        '/learnerplaylistactivityhandler/<activityType>/<activityId>', {
          activityType: activityType,
          activityId: activityId
        }));
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
    learnerPlaylistService.addToLearnerPlaylist(activityId, activityType);
    let req = http.expectOne(
      '/learnerplaylistactivityhandler/exploration/1')
    expect(req.request.method).toEqual('POST');
    req.flush(response);

    flushMicrotasks();
    expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
      'Successfully added to your \'Play Later\' list.');
    expect(alertsService.addInfoMessage).not.toHaveBeenCalled();
  }));

  it('should not add playlist to play later list' +
    'and show belongs to completed or incomplete list', fakeAsync(() => {
    let response = {
      belongs_to_completed_or_incomplete_list: true,
      belongs_to_subscribed_activities: false,
      playlist_limit_exceeded: false
    };
    learnerPlaylistService.addToLearnerPlaylist(activityId, activityType);
    let req = http.expectOne(
      '/learnerplaylistactivityhandler/exploration/1')
    expect(req.request.method).toEqual('POST');
    req.flush(response);

    flushMicrotasks();
    expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
      'You have already completed or are completing this activity.');
    expect(alertsService.addSuccessMessage).not.toHaveBeenCalled();
  }));

  it('should not add playlist to play later list' +
    'and show belongs to subscribed activities', fakeAsync(() => {
    let response = {
      belongs_to_completed_or_incomplete_list: false,
      belongs_to_subscribed_activities: true,
      playlist_limit_exceeded: false
    };
    learnerPlaylistService.addToLearnerPlaylist(activityId, activityType);
    let req = http.expectOne(
      '/learnerplaylistactivityhandler/exploration/1')
    expect(req.request.method).toEqual('POST');
    req.flush(response);

    flushMicrotasks();
    expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
      'This is present in your creator dashboard');
    expect(alertsService.addSuccessMessage).not.toHaveBeenCalled();
  }));

  it('should not add playlist to play later list' +
    'and show playlist limit exceeded', fakeAsync(() => {
    let response = {
      belongs_to_completed_or_incomplete_list: false,
      belongs_to_subscribed_activities: false,
      playlist_limit_exceeded: true
    };
    learnerPlaylistService.addToLearnerPlaylist(activityId, activityType);
    let req = http.expectOne(
      '/learnerplaylistactivityhandler/exploration/1')
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
    fakeAsync(async () => {
    //   const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
    //     // Call the beforeDismiss function to close the dialog
    //     setTimeout(opt.beforeDismiss);
    //     return <NgbModalRef>({ componentInstance: MockNgbModalRef})
    // });
    const modalSpy = spyOn(ngbModal, 'open').and.callThrough();
    //const modalSpy2 = spyOn(ngbModal, 'open').and.returnValue(MockNgbModalRef);
    flushMicrotasks();
    await learnerPlaylistService.removeFromLearnerPlaylist(
        '0', 'title', 'exploration', []);
      flushMicrotasks();
      expect(ngbModal.open).toHaveBeenCalled();
    }));

  // it('should remove an exploration from learner playlist', () => {
  //   //spyOn(ngbModal, 'open').and.callFake(() => {
  //     // let deferred = $q.defer();
  //     // deferred.resolve();
  //     // return {
  //     //   result: deferred.promise
  //     // };
  //   //});
  //   const modalSpy = spyOn(ngbModal, 'open').and.callThrough();

  //   let learnerDashboardActivityIds = LearnerDashboardActivityIds
  //     .createFromBackendDict({
  //       incomplete_exploration_ids: [],
  //       incomplete_collection_ids: [],
  //       completed_exploration_ids: [],
  //       completed_collection_ids: [],
  //       exploration_playlist_ids: ['0', '1', '2'],
  //       collection_playlist_ids: []
  //     });

  //   learnerPlaylistService.removeFromLearnerPlaylist(
  //     '0', 'title', 'exploration', learnerDashboardActivityIds);
  //   // $rootScope.$apply();

  //   expect(learnerDashboardActivityIds.explorationPlaylistIds).toEqual(
  //     ['1', '2']);
  // });

  // it('should remove a collection from learner playlist', () => {
  //   spyOn(ngbModal, 'open').and.callFake(() => {
  //     let deferred = $q.defer();
  //     deferred.resolve();
  //     return {
  //       result: deferred.promise
  //     };
  //   });
  //   let learnerDashboardActivityIds = LearnerDashboardActivityIds
  //     .createFromBackendDict({
  //       incomplete_exploration_ids: [],
  //       incomplete_collection_ids: [],
  //       completed_exploration_ids: [],
  //       completed_collection_ids: [],
  //       exploration_playlist_ids: [],
  //       collection_playlist_ids: ['0', '1', '2']
  //     });

  //   LearnerPlaylistService.removeFromLearnerPlaylist(
  //     '0', 'title', 'collection', learnerDashboardActivityIds);
  //   $rootScope.$apply();

  //   expect(learnerDashboardActivityIds.collectionPlaylistIds).toEqual(
  //     ['1', '2']);
  // });

  // it('should not remove anything from learner playlist when cancel' +
  //   ' button is clicked', () => {
  //   spyOn(ngbModal, 'open').and.callFake(() => {
  //     let deferred = $q.defer();
  //     deferred.reject();
  //     return {
  //       result: deferred.promise
  //     };
  //   });
  //   let learnerDashboardActivityIds = LearnerDashboardActivityIds
  //     .createFromBackendDict({
  //       incomplete_exploration_ids: [],
  //       incomplete_collection_ids: [],
  //       completed_exploration_ids: [],
  //       completed_collection_ids: [],
  //       exploration_playlist_ids: [],
  //       collection_playlist_ids: ['0', '1', '2']
  //     });

  //   LearnerPlaylistService.removeFromLearnerPlaylist(
  //     activityId, 'title', 'collection', learnerDashboardActivityIds);
  //   $rootScope.$apply();

  //   expect(learnerDashboardActivityIds.collectionPlaylistIds).toEqual(
  //     ['0', '1', '2']);
  // });
});
