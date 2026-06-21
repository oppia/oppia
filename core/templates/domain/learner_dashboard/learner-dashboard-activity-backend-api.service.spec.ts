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
 * @fileoverview Tests for LearnerDashboardActivityBackendApiService.
 */

import {
  async,
  fakeAsync,
  flushMicrotasks,
  TestBed,
} from '@angular/core/testing';
import {CsrfTokenService} from 'services/csrf-token.service';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import {AlertsService} from 'services/alerts.service';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {LearnerDashboardActivityBackendApiService} from 'domain/learner_dashboard/learner-dashboard-activity-backend-api.service';
import {LearnerDashboardActivityIds} from 'domain/learner_dashboard/learner-dashboard-activity-ids.model';

class MockRemoveActivityNgbModalRef {
  componentInstance = {
    sectionNameI18nId: null,
    subsectionName: null,
    activityId: null,
    activityTitle: null,
  };
}

describe('Learner playlist Backend Api service ', () => {
  let learnerDashboardActivityBackendApiService: LearnerDashboardActivityBackendApiService;
  let http: HttpTestingController;
  let activityId = '1';
  let activityType = 'exploration';
  let alertsService: AlertsService;
  let csrfService: CsrfTokenService;
  let ngbModal: NgbModal;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
  }));

  beforeEach(() => {
    learnerDashboardActivityBackendApiService = TestBed.inject(
      LearnerDashboardActivityBackendApiService
    );
    ngbModal = TestBed.inject(NgbModal);
    http = TestBed.inject(HttpTestingController);
    csrfService = TestBed.inject(CsrfTokenService);
    alertsService = TestBed.inject(AlertsService);

    spyOn(csrfService, 'getTokenAsync').and.callFake(async () => {
      return new Promise(resolve => {
        resolve('sample-csrf-token');
      });
    });
    spyOn(alertsService, 'addInfoMessage').and.callThrough();
    spyOn(alertsService, 'addSuccessMessage').and.callThrough();
  });

  it('should successfully add playlist to play later list', fakeAsync(() => {
    let response = {
      belongs_to_completed_or_incomplete_list: false,
      belongs_to_subscribed_activities: false,
      playlist_limit_exceeded: false,
    };
    learnerDashboardActivityBackendApiService.addToLearnerPlaylist(
      activityId,
      activityType
    );
    let req = http.expectOne('/learnerplaylistactivityhandler/exploration/1');
    expect(req.request.method).toEqual('POST');
    req.flush(response);

    flushMicrotasks();
    expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
      "Successfully added to your 'Play Later' list."
    );
    expect(alertsService.addInfoMessage).not.toHaveBeenCalled();
  }));

  it(
    'should not add playlist to play later list ' +
      'and show belongs to completed or incomplete list',
    fakeAsync(() => {
      let response = {
        belongs_to_completed_or_incomplete_list: true,
        belongs_to_subscribed_activities: false,
        playlist_limit_exceeded: false,
      };
      learnerDashboardActivityBackendApiService.addToLearnerPlaylist(
        activityId,
        activityType
      );
      let req = http.expectOne('/learnerplaylistactivityhandler/exploration/1');
      expect(req.request.method).toEqual('POST');
      req.flush(response);

      flushMicrotasks();
      expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
        'You have already completed or are completing this activity.'
      );
      expect(alertsService.addSuccessMessage).not.toHaveBeenCalled();
    })
  );

  it(
    'should not add playlist to play later list ' +
      'and show belongs to subscribed activities',
    fakeAsync(() => {
      let response = {
        belongs_to_completed_or_incomplete_list: false,
        belongs_to_subscribed_activities: true,
        playlist_limit_exceeded: false,
      };
      learnerDashboardActivityBackendApiService.addToLearnerPlaylist(
        activityId,
        activityType
      );
      let req = http.expectOne('/learnerplaylistactivityhandler/exploration/1');
      expect(req.request.method).toEqual('POST');
      req.flush(response);

      flushMicrotasks();
      expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
        'This is present in your creator dashboard'
      );
      expect(alertsService.addSuccessMessage).not.toHaveBeenCalled();
    })
  );

  it(
    'should not add playlist to play later list ' +
      'and show playlist limit exceeded',
    fakeAsync(() => {
      let response = {
        belongs_to_completed_or_incomplete_list: false,
        belongs_to_subscribed_activities: false,
        playlist_limit_exceeded: true,
      };
      learnerDashboardActivityBackendApiService.addToLearnerPlaylist(
        activityId,
        activityType
      );
      let req = http.expectOne('/learnerplaylistactivityhandler/exploration/1');
      expect(req.request.method).toEqual('POST');
      req.flush(response);

      flushMicrotasks();
      expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
        "Your 'Play Later' list is full!  Either you can " +
          'complete some or you can head to the learner dashboard ' +
          'and remove some.'
      );
      expect(alertsService.addSuccessMessage).not.toHaveBeenCalled();
    })
  );

  it('should successfully add topic to learn list of learner goals', fakeAsync(() => {
    let response = {
      belongs_to_learnt_list: false,
      goals_limit_exceeded: false,
    };
    let activityType = 'learntopic';
    learnerDashboardActivityBackendApiService.addToLearnerGoals(
      activityId,
      activityType
    );
    let req = http.expectOne('/learnergoalshandler/learntopic/1');
    expect(req.request.method).toEqual('POST');
    req.flush(response);

    flushMicrotasks();
    expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
      "Successfully added to your 'Current Goals' list."
    );
    expect(alertsService.addInfoMessage).not.toHaveBeenCalled();
  }));

  it(
    'should not add topic to learn list of learner goals ' +
      'and show belongs to learnt list',
    fakeAsync(() => {
      let response = {
        belongs_to_learnt_list: true,
        playlist_limit_exceeded: false,
      };
      let activityType = 'learntopic';
      learnerDashboardActivityBackendApiService.addToLearnerGoals(
        activityId,
        activityType
      );
      let req = http.expectOne('/learnergoalshandler/learntopic/1');
      expect(req.request.method).toEqual('POST');
      req.flush(response);

      flushMicrotasks();
      expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
        'You have already learnt this activity.'
      );
      expect(alertsService.addSuccessMessage).not.toHaveBeenCalled();
    })
  );

  it(
    'should not add topic to learn list of learner goals ' +
      'and show goals limit exceeded',
    fakeAsync(() => {
      let response = {
        belongs_to_learnt_list: false,
        goals_limit_exceeded: true,
      };
      let activityType = 'learntopic';
      learnerDashboardActivityBackendApiService.addToLearnerGoals(
        activityId,
        activityType
      );
      let req = http.expectOne('/learnergoalshandler/learntopic/1');
      expect(req.request.method).toEqual('POST');
      req.flush(response);

      flushMicrotasks();
      expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
        "Your 'Current Goals' list is full! Please finish existing " +
          'goals or remove some to add new goals to your list.'
      );
      expect(alertsService.addSuccessMessage).not.toHaveBeenCalled();
    })
  );

  it(
    'should remove an exploration from learner playlist' +
      ' when calling removeFromLearnerPlaylistModal',
    fakeAsync(() => {
      let learnerDashboardActivityIds =
        LearnerDashboardActivityIds.createFromBackendDict({
          incomplete_exploration_ids: [],
          incomplete_collection_ids: [],
          completed_exploration_ids: [],
          completed_collection_ids: [],
          exploration_playlist_ids: ['0', '1', '2'],
          collection_playlist_ids: [],
          completed_story_ids: [],
          learnt_topic_ids: [],
          partially_learnt_topic_ids: [],
          topic_ids_to_learn: [],
          all_topic_ids: [],
          untracked_topic_ids: [],
        });

      learnerDashboardActivityBackendApiService.removeFromLearnerPlaylist(
        '0',
        'exploration',
        learnerDashboardActivityIds,
        'success'
      );
      flushMicrotasks();
      expect(learnerDashboardActivityIds.explorationPlaylistIds).toEqual([
        '1',
        '2',
      ]);
    })
  );

  it(
    'should remove a collection from learner playlist' +
      ' when calling removeFromLearnerPlaylistModal',
    fakeAsync(() => {
      let learnerDashboardActivityIds =
        LearnerDashboardActivityIds.createFromBackendDict({
          incomplete_exploration_ids: [],
          incomplete_collection_ids: [],
          completed_exploration_ids: [],
          completed_collection_ids: [],
          exploration_playlist_ids: [],
          collection_playlist_ids: ['0', '1', '2'],
          completed_story_ids: [],
          learnt_topic_ids: [],
          partially_learnt_topic_ids: [],
          topic_ids_to_learn: [],
          all_topic_ids: [],
          untracked_topic_ids: [],
        });

      learnerDashboardActivityBackendApiService.removeFromLearnerPlaylist(
        '0',
        'collection',
        learnerDashboardActivityIds,
        'success'
      );
      flushMicrotasks();

      expect(learnerDashboardActivityIds.collectionPlaylistIds).toEqual([
        '1',
        '2',
      ]);
    })
  );

  it(
    'should opena a modal to remove an exploration from learner playlist' +
      ' when calling removeActivityModal',
    fakeAsync(() => {
      expect(
        learnerDashboardActivityBackendApiService.removeActivityModalStatus
      ).toBeUndefined;

      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return {
          componentInstance: MockRemoveActivityNgbModalRef,
          result: Promise.resolve('url'),
        } as NgbModalRef;
      });

      let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION';
      let subsectionName = 'I18N_DASHBOARD_EXPLORATIONS';
      let activityId = '0';
      let activityTitle = 'title';

      learnerDashboardActivityBackendApiService.removeActivityModalAsync(
        sectionNameI18nId,
        subsectionName,
        activityId,
        activityTitle
      );

      flushMicrotasks();

      expect(modalSpy).toHaveBeenCalled();
      expect(
        learnerDashboardActivityBackendApiService.removeActivityModalStatus
      ).toBe('removed');
    })
  );

  it(
    'should opena a modal to remove a collection from learner playlist' +
      ' when calling removeActivityModal',
    fakeAsync(() => {
      expect(
        learnerDashboardActivityBackendApiService.removeActivityModalStatus
      ).toBeUndefined;

      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return {
          componentInstance: MockRemoveActivityNgbModalRef,
          result: Promise.resolve('success'),
        } as NgbModalRef;
      });

      let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION';
      let subsectionName = 'I18N_DASHBOARD_COLLECTIONS';
      let activityId = '0';
      let activityTitle = 'title';

      learnerDashboardActivityBackendApiService.removeActivityModalAsync(
        sectionNameI18nId,
        subsectionName,
        activityId,
        activityTitle
      );
      flushMicrotasks();

      expect(modalSpy).toHaveBeenCalled();
      expect(
        learnerDashboardActivityBackendApiService.removeActivityModalStatus
      ).toBe('removed');
    })
  );

  it(
    'should opena a modal to remove an exploration from incomplete playlist' +
      ' when calling removeActivityModal',
    fakeAsync(() => {
      expect(
        learnerDashboardActivityBackendApiService.removeActivityModalStatus
      ).toBeUndefined;

      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return {
          componentInstance: MockRemoveActivityNgbModalRef,
          result: Promise.resolve('url'),
        } as NgbModalRef;
      });

      let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
      let subsectionName = 'I18N_DASHBOARD_EXPLORATIONS';
      let activityId = '0';
      let activityTitle = 'title';

      learnerDashboardActivityBackendApiService.removeActivityModalAsync(
        sectionNameI18nId,
        subsectionName,
        activityId,
        activityTitle
      );

      flushMicrotasks();

      expect(modalSpy).toHaveBeenCalled();
      expect(
        learnerDashboardActivityBackendApiService.removeActivityModalStatus
      ).toBe('removed');
    })
  );

  it(
    'should opena a modal to remove a collection from incomplete playlist' +
      ' when calling removeActivityModal',
    fakeAsync(() => {
      expect(
        learnerDashboardActivityBackendApiService.removeActivityModalStatus
      ).toBeUndefined;

      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return {
          componentInstance: MockRemoveActivityNgbModalRef,
          result: Promise.resolve('success'),
        } as NgbModalRef;
      });

      let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_INCOMPLETE_SECTION';
      let subsectionName = 'I18N_DASHBOARD_COLLECTIONS';
      let activityId = '0';
      let activityTitle = 'title';

      learnerDashboardActivityBackendApiService.removeActivityModalAsync(
        sectionNameI18nId,
        subsectionName,
        activityId,
        activityTitle
      );
      flushMicrotasks();

      expect(modalSpy).toHaveBeenCalled();
      expect(
        learnerDashboardActivityBackendApiService.removeActivityModalStatus
      ).toBe('removed');
    })
  );

  it(
    'should not open a modal if cancel button is clicked' +
      ' when calling removeActivityModal',
    fakeAsync(() => {
      expect(
        learnerDashboardActivityBackendApiService.removeActivityModalStatus
      ).toBeUndefined;

      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return {
          componentInstance: MockRemoveActivityNgbModalRef,
          result: Promise.reject('fail'),
        } as NgbModalRef;
      });

      let sectionNameI18nId = 'I18N_LEARNER_DASHBOARD_PLAYLIST_SECTION';
      let subsectionName = 'I18N_DASHBOARD_COLLECTIONS';
      let activityId = '0';
      let activityTitle = 'title';

      learnerDashboardActivityBackendApiService.removeActivityModalAsync(
        sectionNameI18nId,
        subsectionName,
        activityId,
        activityTitle
      );
      flushMicrotasks();

      expect(modalSpy).toHaveBeenCalled();
      expect(
        learnerDashboardActivityBackendApiService.removeActivityModalStatus
      ).toBe('canceled');
    })
  );
});
