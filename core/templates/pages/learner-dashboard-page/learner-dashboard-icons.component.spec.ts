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

import { async, ComponentFixture, fakeAsync, TestBed, tick } from
  '@angular/core/testing';

import { LearnerDashboardIdsBackendApiService } from 'domain/learner_dashboard/learner-dashboard-ids-backend-api.service';
import { LearnerDashboardActivityBackendApiService } from 'domain/learner_dashboard/learner-dashboard-activity-backend-api.service';
import { LearnerDashboardActivityIds } from 'domain/learner_dashboard/learner-dashboard-activity-ids.model';

import { LearnerDashboardIconsComponent } from './learner-dashboard-icons.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MockTranslatePipe } from 'tests/unit-test-utils';

describe('Learner Dashboard Icons Component', () => {
  let component: LearnerDashboardIconsComponent;
  let fixture: ComponentFixture<LearnerDashboardIconsComponent>;

  let learnerDashboardIdsBackendApiService:
    LearnerDashboardIdsBackendApiService;
  let learnerDashboardActivityBackendApiService:
    LearnerDashboardActivityBackendApiService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        HttpClientTestingModule,
        NgbModule
      ],
      declarations: [
        LearnerDashboardIconsComponent,
        MockTranslatePipe
      ],
      providers: [
        LearnerDashboardIdsBackendApiService,
        LearnerDashboardActivityBackendApiService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LearnerDashboardIconsComponent);
    component = fixture.componentInstance;
    learnerDashboardIdsBackendApiService =
      TestBed.inject(LearnerDashboardIdsBackendApiService);
    learnerDashboardActivityBackendApiService =
      TestBed.inject(LearnerDashboardActivityBackendApiService);
    fixture.detectChanges();
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

  it('should get value of activityActive', fakeAsync(() => {
    component.activityIsCurrentlyHoveredOver = false;
    const activityActiveSpy = spyOnProperty(
      component, 'activityActive', 'get')
      .and.callThrough();
    let getActivityActive = component.activityActive;

    fixture.detectChanges();

    expect(getActivityActive).toBe(false);
    expect(activityActiveSpy).toHaveBeenCalled();
  }
  ));

  it('should set value of activityActive', fakeAsync(() => {
    component.activityIsCurrentlyHoveredOver = false;
    const activityActiveSpy = spyOnProperty(
      component, 'activityActive', 'set')
      .and.callThrough();

    component.activityActive = true;
    let setActivityActive = component.activityActive;

    fixture.detectChanges();

    expect(setActivityActive).toBe(true);
    expect(component.activityIsCurrentlyHoveredOver).toBe(true);
    expect(activityActiveSpy).toHaveBeenCalled();
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

  it('should set hover state to true', () => {
    component.setHoverState(true);
    expect(component.activityIsCurrentlyHoveredOver).toBe(true);
  }
  );

  it('should set hover state to false', () => {
    component.setHoverState(false);
    expect(component.activityIsCurrentlyHoveredOver).toBe(false);
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
    component.activityType = 'learn topic';
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
    component.activityType = 'learn topic';
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
    component.activityType = 'learn topic';
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
    component.activityType = 'learn topic';
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
    let activityId = '1';
    let activityTitle = 'Title';
    let activityType = 'exploration';

    const learnerPlaylistSpy =
      spyOn(
        learnerDashboardActivityBackendApiService,
        'removeFromLearnerPlaylistModal')
        .and.returnValue(null);

    component.removeFromLearnerPlaylist(
      activityId, activityTitle, activityType);

    fixture.detectChanges();

    expect(learnerPlaylistSpy).toHaveBeenCalled();
  }
  ));

  it('should open a modal for removing collection from' +
    ' learner playlist', fakeAsync(() => {
    let activityId = '1';
    let activityTitle = 'Title';
    let activityType = 'collection';

    const learnerPlaylistSpy =
      spyOn(
        learnerDashboardActivityBackendApiService,
        'removeFromLearnerPlaylistModal')
        .and.returnValue(null);

    component.removeFromLearnerPlaylist(
      activityId, activityTitle, activityType);

    fixture.detectChanges();

    expect(learnerPlaylistSpy).toHaveBeenCalled();
  }
  ));

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
        exploration_playlist_ids: [],
        collection_playlist_ids: []
      });

    const learnerPlaylistSpy =
      spyOn(learnerDashboardActivityBackendApiService, 'addToLearnerPlaylist')
        .and.returnValue(true);

    component.addToLearnerPlaylist(
      activityId, activityType);

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
        exploration_playlist_ids: [],
        collection_playlist_ids: []
      });

    const learnerPlaylistSpy =
      spyOn(learnerDashboardActivityBackendApiService, 'addToLearnerPlaylist')
        .and.returnValue(true);

    component.addToLearnerPlaylist(
      activityId, activityType);

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
        exploration_playlist_ids: [],
        collection_playlist_ids: []
      });

    const learnerPlaylistSpy =
      spyOn(learnerDashboardActivityBackendApiService, 'addToLearnerPlaylist')
        .and.returnValue(false);

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
        exploration_playlist_ids: [],
        collection_playlist_ids: []
      });

    const learnerPlaylistSpy =
      spyOn(learnerDashboardActivityBackendApiService, 'addToLearnerPlaylist')
        .and.returnValue(false);

    component.addToLearnerPlaylist(
      activityId, activityType);

    fixture.detectChanges();

    expect(learnerPlaylistSpy).toHaveBeenCalled();
    expect(component.learnerDashboardActivityIds.collectionPlaylistIds)
      .toEqual([]);
  }
  ));
});
