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
 * @fileoverview Unit tests for LearnerDashboardIconsComponent.
 */

import { async, ComponentFixture, fakeAsync, flushMicrotasks, TestBed, tick } from
  '@angular/core/testing';

import { LearnerDashboardIdsBackendApiService } from 'domain/learner_dashboard/learner-dashboard-ids-backend-api.service';
import { LearnerDashboardActivityBackendApiService } from 'domain/learner_dashboard/learner-dashboard-activity-backend-api.service';
import { LearnerDashboardActivityIds } from 'domain/learner_dashboard/learner-dashboard-activity-ids.model';

import { LearnerDashboardIconsComponent } from './learner-dashboard-icons.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgbModal, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { LearnerPlaylistModalComponent } from './modal-templates/learner-playlist-modal.component';

class MockNgbModalRef {
  componentInstance = {
    activityId: null,
    activityTitle: null,
    activityType: null
  };
}

describe('Learner Dashboard Icons Component', () => {
  let component: LearnerDashboardIconsComponent;
  let fixture: ComponentFixture<LearnerDashboardIconsComponent>;
  let ngbModal: NgbModal;
  let learnerDashboardIdsBackendApiService:
    LearnerDashboardIdsBackendApiService;
  let learnerDashboardActivityBackendApiService:
    LearnerDashboardActivityBackendApiService;
  let learnerPlaylistSpy: jasmine.Spy;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        HttpClientTestingModule,
        NgbModule
      ],
      declarations: [
        LearnerDashboardIconsComponent,
        LearnerPlaylistModalComponent,
        MockTranslatePipe
      ],
      providers: [
        LearnerDashboardIdsBackendApiService,
        LearnerDashboardActivityBackendApiService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).overrideModule(BrowserDynamicTestingModule, {
      set: {
        entryComponents: [LearnerPlaylistModalComponent],
      }
    }).compileComponents();
  }));

  beforeEach(() => {
    ngbModal = TestBed.inject(NgbModal);
    fixture = TestBed.createComponent(LearnerDashboardIconsComponent);
    component = fixture.componentInstance;
    learnerDashboardIdsBackendApiService =
      TestBed.inject(LearnerDashboardIdsBackendApiService);
    learnerDashboardActivityBackendApiService =
      TestBed.inject(LearnerDashboardActivityBackendApiService);
    fixture.detectChanges();
    learnerPlaylistSpy = spyOn(
      learnerDashboardActivityBackendApiService,
      'removeFromLearnerPlaylist'
    ).and.callThrough();
  });

  it('should intialize the component and set values', fakeAsync(() => {
    let learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        partially_learnt_topic_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        completed_story_ids: [],
        learnt_topic_ids: [],
        topic_ids_to_learn: [],
        all_topic_ids: [],
        untracked_topic_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: []
      });

    const learnerDashboardSpy = spyOn(
      learnerDashboardIdsBackendApiService, 'fetchLearnerDashboardIdsAsync')
      .and.callFake(async() => {
        return Promise.resolve(learnerDashboardActivityIds);
      });

    component.ngOnInit();
    tick();
    fixture.detectChanges();

    expect(component.learnerDashboardActivityIds)
      .toBe(learnerDashboardActivityIds);
    expect(learnerDashboardSpy).toHaveBeenCalled();
  }
  ));

  it('should enable the tooltip', () => {
    component.enablePlaylistTooltip();
    expect(component.playlistTooltipIsEnabled).toBe(true);
  }
  );

  it('should disable the tooltip', () => {
    component.disablePlaylistTooltip();
    expect(component.playlistTooltipIsEnabled).toBe(false);
  }
  );

  it('should return true if the activity can be added to' +
    ' learner playlist', fakeAsync(() => {
    component.isContainerNarrow = true;
    component.learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        partially_learnt_topic_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        completed_story_ids: [],
        learnt_topic_ids: [],
        topic_ids_to_learn: [],
        all_topic_ids: [],
        untracked_topic_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: []
      });

    let result = component.canActivityBeAddedToLearnerPlaylist('1');

    fixture.detectChanges();

    expect(result).toBe(true);
  }
  ));

  it('should return false if the activity can not be added to' +
    ' learner playlist', fakeAsync(() => {
    component.isContainerNarrow = true;
    component.learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        partially_learnt_topic_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        completed_story_ids: [],
        learnt_topic_ids: [],
        topic_ids_to_learn: [],
        all_topic_ids: [],
        untracked_topic_ids: [],
        exploration_playlist_ids: ['1'],
        collection_playlist_ids: []
      });

    let result = component.canActivityBeAddedToLearnerPlaylist('1');

    fixture.detectChanges();

    expect(result).toBe(false);
  }
  ));

  it('should return true if the curent exploration belongs to the' +
    ' learner playlist', fakeAsync(() => {
    component.activityType = 'exploration';
    component.activityId = '1';
    component.learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        partially_learnt_topic_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        completed_story_ids: [],
        learnt_topic_ids: [],
        topic_ids_to_learn: [],
        all_topic_ids: [],
        untracked_topic_ids: [],
        exploration_playlist_ids: ['1'],
        collection_playlist_ids: []
      });

    let result = component.belongsToLearnerPlaylist();

    fixture.detectChanges();

    expect(result).toBe(true);
  }
  ));

  it('should return true if the curent collection belongs to the' +
    ' learner playlist', fakeAsync(() => {
    component.activityType = 'collection';
    component.activityId = '1';
    component.learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        partially_learnt_topic_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        completed_story_ids: [],
        learnt_topic_ids: [],
        topic_ids_to_learn: [],
        all_topic_ids: [],
        untracked_topic_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: ['1']
      });

    let result = component.belongsToLearnerPlaylist();

    fixture.detectChanges();

    expect(result).toBe(true);
  }
  ));

  it('should return true if the curent exploration belongs to the' +
    ' completed playlist', fakeAsync(() => {
    component.activityType = 'exploration';
    component.activityId = '1';
    component.learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        partially_learnt_topic_ids: [],
        completed_exploration_ids: ['1'],
        completed_collection_ids: [],
        completed_story_ids: [],
        learnt_topic_ids: [],
        topic_ids_to_learn: [],
        all_topic_ids: [],
        untracked_topic_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: []
      });

    let result = component.belongsToCompletedActivities();

    fixture.detectChanges();

    expect(result).toBe(true);
  }
  ));

  it('should return true if the curent collection belongs to the' +
    ' completed playlist', fakeAsync(() => {
    component.activityType = 'collection';
    component.activityId = '1';
    component.learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        partially_learnt_topic_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: ['1'],
        completed_story_ids: [],
        learnt_topic_ids: [],
        topic_ids_to_learn: [],
        all_topic_ids: [],
        untracked_topic_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: []
      });

    let result = component.belongsToCompletedActivities();

    fixture.detectChanges();

    expect(result).toBe(true);
  }
  ));

  it('should return true if the curent story belongs to the' +
    ' completed playlist', fakeAsync(() => {
    component.activityType = 'story';
    component.activityId = '1';
    component.learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        partially_learnt_topic_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        completed_story_ids: ['1'],
        learnt_topic_ids: [],
        topic_ids_to_learn: [],
        all_topic_ids: [],
        untracked_topic_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: []
      });

    let result = component.belongsToCompletedActivities();

    fixture.detectChanges();

    expect(result).toBe(true);
  }
  ));

  it('should return true if the curent topic belongs to the' +
    ' learnt playlist', fakeAsync(() => {
    component.activityType = 'learntopic';
    component.activityId = '1';
    component.learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        partially_learnt_topic_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        completed_story_ids: [],
        learnt_topic_ids: ['1'],
        topic_ids_to_learn: [],
        all_topic_ids: [],
        untracked_topic_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: []
      });

    let result = component.belongsToCompletedActivities();

    fixture.detectChanges();

    expect(result).toBe(true);
  }
  ));

  it('should return true if the curent exploration belongs to the' +
    ' incomplete playlist', fakeAsync(() => {
    component.activityType = 'exploration';
    component.activityId = '1';
    component.learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: ['1'],
        incomplete_collection_ids: [],
        partially_learnt_topic_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        completed_story_ids: [],
        learnt_topic_ids: [],
        topic_ids_to_learn: [],
        all_topic_ids: [],
        untracked_topic_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: []
      });

    let result = component.belongsToIncompleteActivities();

    fixture.detectChanges();

    expect(result).toBe(true);
  }
  ));

  it('should return true if the curent collection belongs to the' +
    ' incomplete playlist', fakeAsync(() => {
    component.activityType = 'collection';
    component.activityId = '1';
    component.learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: ['1'],
        partially_learnt_topic_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        completed_story_ids: [],
        learnt_topic_ids: [],
        topic_ids_to_learn: [],
        all_topic_ids: [],
        untracked_topic_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: []
      });

    let result = component.belongsToIncompleteActivities();

    fixture.detectChanges();

    expect(result).toBe(true);
  }
  ));

  it('should return true if the curent topic belongs to the' +
    ' partially learnt playlist', fakeAsync(() => {
    component.activityType = 'learntopic';
    component.activityId = '1';
    component.learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        partially_learnt_topic_ids: ['1'],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        completed_story_ids: [],
        learnt_topic_ids: [],
        topic_ids_to_learn: [],
        all_topic_ids: [],
        untracked_topic_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: []
      });

    let result = component.belongsToIncompleteActivities();

    fixture.detectChanges();

    expect(result).toBe(true);
  }
  ));

  it('should return false if the curent exploration belongs to the' +
    ' learner playlist', fakeAsync(() => {
    component.activityType = 'exploration';
    component.activityId = '1';
    component.learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        partially_learnt_topic_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        completed_story_ids: [],
        learnt_topic_ids: [],
        topic_ids_to_learn: [],
        all_topic_ids: [],
        untracked_topic_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: []
      });

    let result = component.belongsToLearnerPlaylist();

    fixture.detectChanges();

    expect(result).toBe(false);
  }
  ));

  it('should return false if the curent collection belongs to the' +
    ' learner playlist', fakeAsync(() => {
    component.activityType = 'collection';
    component.activityId = '1';
    component.learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        partially_learnt_topic_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        completed_story_ids: [],
        learnt_topic_ids: [],
        topic_ids_to_learn: [],
        all_topic_ids: [],
        untracked_topic_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: []
      });

    let result = component.belongsToLearnerPlaylist();

    fixture.detectChanges();

    expect(result).toBe(false);
  }
  ));

  it('should return false if the curent exploration belongs to the' +
    ' completed playlist', fakeAsync(() => {
    component.activityType = 'exploration';
    component.activityId = '1';
    component.learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        partially_learnt_topic_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        completed_story_ids: [],
        learnt_topic_ids: [],
        topic_ids_to_learn: [],
        all_topic_ids: [],
        untracked_topic_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: []
      });

    let result = component.belongsToCompletedActivities();

    fixture.detectChanges();

    expect(result).toBe(false);
  }
  ));

  it('should return false if the curent collection belongs to the' +
    ' completed playlist', fakeAsync(() => {
    component.activityType = 'collection';
    component.activityId = '1';
    component.learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        partially_learnt_topic_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        completed_story_ids: [],
        learnt_topic_ids: [],
        topic_ids_to_learn: [],
        all_topic_ids: [],
        untracked_topic_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: []
      });

    let result = component.belongsToCompletedActivities();

    fixture.detectChanges();

    expect(result).toBe(false);
  }
  ));

  it('should return false if the curent story belongs to the' +
    ' completed playlist', fakeAsync(() => {
    component.activityType = 'story';
    component.activityId = '1';
    component.learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        partially_learnt_topic_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        completed_story_ids: [],
        learnt_topic_ids: [],
        topic_ids_to_learn: [],
        all_topic_ids: [],
        untracked_topic_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: []
      });

    let result = component.belongsToCompletedActivities();

    fixture.detectChanges();

    expect(result).toBe(false);
  }
  ));

  it('should return false if the curent topic belongs to the' +
    ' learnt playlist', fakeAsync(() => {
    component.activityType = 'learntopic';
    component.activityId = '1';
    component.learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        partially_learnt_topic_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        completed_story_ids: [],
        learnt_topic_ids: [],
        topic_ids_to_learn: [],
        all_topic_ids: [],
        untracked_topic_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: []
      });

    let result = component.belongsToCompletedActivities();

    fixture.detectChanges();

    expect(result).toBe(false);
  }
  ));

  it('should return false if the curent exploration belongs to the' +
    ' incomplete playlist', fakeAsync(() => {
    component.activityType = 'exploration';
    component.activityId = '1';
    component.learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        partially_learnt_topic_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        completed_story_ids: [],
        learnt_topic_ids: [],
        topic_ids_to_learn: [],
        all_topic_ids: [],
        untracked_topic_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: []
      });

    let result = component.belongsToIncompleteActivities();

    fixture.detectChanges();

    expect(result).toBe(false);
  }
  ));

  it('should return false if the curent collection belongs to the' +
    ' incomplete playlist', fakeAsync(() => {
    component.activityType = 'collection';
    component.activityId = '1';
    component.learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        partially_learnt_topic_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        completed_story_ids: [],
        learnt_topic_ids: [],
        topic_ids_to_learn: [],
        all_topic_ids: [],
        untracked_topic_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: []
      });

    let result = component.belongsToIncompleteActivities();

    fixture.detectChanges();

    expect(result).toBe(false);
  }
  ));

  it('should return false if the curent topic belongs to the' +
    ' partially learnt playlist', fakeAsync(() => {
    component.activityType = 'learntopic';
    component.activityId = '1';
    component.learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        partially_learnt_topic_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        completed_story_ids: [],
        learnt_topic_ids: [],
        topic_ids_to_learn: [],
        all_topic_ids: [],
        untracked_topic_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: []
      });

    let result = component.belongsToIncompleteActivities();

    fixture.detectChanges();

    expect(result).toBe(false);
  }
  ));

  it('should open a modal for removing exploration from' +
    ' learner playlist', fakeAsync(() => {
    const learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: [],
        completed_story_ids: [],
        learnt_topic_ids: [],
        partially_learnt_topic_ids: [],
        topic_ids_to_learn: [],
        all_topic_ids: [],
        untracked_topic_ids: []
      });
    component.learnerDashboardActivityIds = learnerDashboardActivityIds;
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return (
        { componentInstance: MockNgbModalRef,
          result: Promise.resolve('url')
        } as NgbModalRef);
    });
    let activityId = '1';
    let activityTitle = 'Title';
    let activityType = 'exploration';

    component.removeFromLearnerPlaylist(
      activityId, activityTitle, activityType);
    fixture.detectChanges();
    flushMicrotasks();

    expect(modalSpy).toHaveBeenCalled();
    expect(learnerPlaylistSpy).toHaveBeenCalled();
  }
  ));

  it('should open a modal for removing collection from' +
    ' learner playlist', fakeAsync(() => {
    const learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: [],
        completed_story_ids: [],
        learnt_topic_ids: [],
        partially_learnt_topic_ids: [],
        topic_ids_to_learn: [],
        all_topic_ids: [],
        untracked_topic_ids: []
      });
    component.learnerDashboardActivityIds = learnerDashboardActivityIds;
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return (
        { componentInstance: MockNgbModalRef,
          result: Promise.resolve('url')
        } as NgbModalRef);
    });
    let activityId = '1';
    let activityTitle = 'Title';
    let activityType = 'collection';

    component.removeFromLearnerPlaylist(
      activityId, activityTitle, activityType);
    fixture.detectChanges();
    flushMicrotasks();

    expect(modalSpy).toHaveBeenCalled();
    expect(learnerPlaylistSpy).toHaveBeenCalled();
  }
  ));

  it(
    'should open an ngbModal when removing from learner playlist' +
    ' when calling removeFromLearnerPlaylistModal',
    fakeAsync(() => {
      const learnerDashboardActivityIds = LearnerDashboardActivityIds
        .createFromBackendDict({
          incomplete_exploration_ids: [],
          incomplete_collection_ids: [],
          completed_exploration_ids: [],
          completed_collection_ids: [],
          exploration_playlist_ids: [],
          collection_playlist_ids: [],
          completed_story_ids: [],
          learnt_topic_ids: [],
          partially_learnt_topic_ids: [],
          topic_ids_to_learn: [],
          all_topic_ids: [],
          untracked_topic_ids: []
        });
      component.learnerDashboardActivityIds = learnerDashboardActivityIds;
      const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return (
        { componentInstance: MockNgbModalRef,
          result: Promise.resolve('url')
        } as NgbModalRef);
      });
      component.removeFromLearnerPlaylist(
        '0', 'title', 'exploration');
      expect(modalSpy).toHaveBeenCalled();
      flushMicrotasks();
      expect(learnerPlaylistSpy).toHaveBeenCalledWith(
        '0', 'exploration', learnerDashboardActivityIds, 'url');
    }));

  it(
    'should not remove anything from learner playlist when cancel ' +
  'button is clicked when calling removeFromLearnerPlaylistModal',
    fakeAsync(() => {
      spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
        return (
        { componentInstance: MockNgbModalRef,
          result: Promise.reject('success')
        } as NgbModalRef);
      });
      component.removeFromLearnerPlaylist(
        '0', 'title', 'collection');
      flushMicrotasks();

      expect(learnerPlaylistSpy).not.toHaveBeenCalled();
    }));

  it('should add exploration to learner playlist', fakeAsync(() => {
    let activityId = '1';
    let activityType = 'exploration';

    component.learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        partially_learnt_topic_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        completed_story_ids: [],
        learnt_topic_ids: [],
        topic_ids_to_learn: [],
        all_topic_ids: [],
        untracked_topic_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: []
      });

    const learnerPlaylistSpy =
      spyOn(learnerDashboardActivityBackendApiService, 'addToLearnerPlaylist')
        .and.returnValue(Promise.resolve(true));

    component.addToLearnerPlaylist(
      activityId, activityType);

    tick();

    fixture.detectChanges();

    expect(learnerPlaylistSpy).toHaveBeenCalled();
    expect(component.learnerDashboardActivityIds.explorationPlaylistIds)
      .toEqual(['1']);
  }
  ));

  it('should add collection to learner playlist', fakeAsync(() => {
    let activityId = '1';
    let activityType = 'collection';

    component.learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        partially_learnt_topic_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        completed_story_ids: [],
        learnt_topic_ids: [],
        topic_ids_to_learn: [],
        all_topic_ids: [],
        untracked_topic_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: []
      });

    const learnerPlaylistSpy =
      spyOn(learnerDashboardActivityBackendApiService, 'addToLearnerPlaylist')
        .and.returnValue(Promise.resolve(true));

    component.addToLearnerPlaylist(
      activityId, activityType);

    tick();

    fixture.detectChanges();

    expect(learnerPlaylistSpy).toHaveBeenCalled();
    expect(component.learnerDashboardActivityIds.collectionPlaylistIds)
      .toEqual(['1']);
  }
  ));

  it('should fail to add exploration to learner playlist', fakeAsync(() => {
    let activityId = '1';
    let activityType = 'exploration';

    component.learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        partially_learnt_topic_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        completed_story_ids: [],
        learnt_topic_ids: [],
        topic_ids_to_learn: [],
        all_topic_ids: [],
        untracked_topic_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: []
      });

    const learnerPlaylistSpy =
      spyOn(learnerDashboardActivityBackendApiService, 'addToLearnerPlaylist')
        .and.returnValue(Promise.resolve(true));

    component.addToLearnerPlaylist(
      activityId, activityType);

    fixture.detectChanges();

    expect(learnerPlaylistSpy).toHaveBeenCalled();
    expect(component.learnerDashboardActivityIds.explorationPlaylistIds)
      .toEqual([]);
  }
  ));

  it('should fail to add collection to learner playlist', fakeAsync(() => {
    let activityId = '1';
    let activityType = 'collection';

    component.learnerDashboardActivityIds = LearnerDashboardActivityIds
      .createFromBackendDict({
        incomplete_exploration_ids: [],
        incomplete_collection_ids: [],
        partially_learnt_topic_ids: [],
        completed_exploration_ids: [],
        completed_collection_ids: [],
        completed_story_ids: [],
        learnt_topic_ids: [],
        topic_ids_to_learn: [],
        all_topic_ids: [],
        untracked_topic_ids: [],
        exploration_playlist_ids: [],
        collection_playlist_ids: []
      });

    const learnerPlaylistSpy =
      spyOn(learnerDashboardActivityBackendApiService, 'addToLearnerPlaylist')
        .and.returnValue(Promise.resolve(true));

    component.addToLearnerPlaylist(
      activityId, activityType);

    fixture.detectChanges();

    expect(learnerPlaylistSpy).toHaveBeenCalled();
    expect(component.learnerDashboardActivityIds.collectionPlaylistIds)
      .toEqual([]);
  }
  ));
});
