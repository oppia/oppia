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
 * @fileoverview Component for showing learner dashboard icons.
 */

import { Component, OnInit, Input} from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import constants from 'assets/constants';
import { LearnerDashboardIdsBackendApiService } from
  'domain/learner_dashboard/learner-dashboard-ids-backend-api.service';
import { LearnerDashboardActivityBackendApiService } from
  'domain/learner_dashboard/learner-dashboard-activity-backend-api.service';
import { LearnerDashboardActivityIds } from
  'domain/learner_dashboard/learner-dashboard-activity-ids.model';

@Component({
  selector: 'oppia-learner-dashboard-icons',
  templateUrl: './learner-dashboard-icons.component.html',
})
export class LearnerDashboardIconsComponent implements OnInit {
  activityIsCurrentlyHoveredOver: boolean = true;
  playlistTooltipIsEnabled: boolean = false;
  learnerDashboardActivityIds: LearnerDashboardActivityIds;

  @Input() activityType: string;
  @Input() activityId: string;
  @Input() activityTitle: string;
  @Input()
  get activityActive(): boolean {
    return this.activityIsCurrentlyHoveredOver;
  }
  set activityActive(hoverState: boolean) {
    this.activityIsCurrentlyHoveredOver = hoverState;
  }
  @Input() isContainerNarrow: boolean;
  @Input() isAddToPlaylistIconShown: boolean;

  constructor(
    private learnerDashboardIdsBackendApiService:
      LearnerDashboardIdsBackendApiService,
    private learnerDashboardActivityBackendApiService:
      LearnerDashboardActivityBackendApiService
  ) {}

  ngOnInit(): void {
    this.learnerDashboardIdsBackendApiService.
      fetchLearnerDashboardIdsAsync().then(
        (learnerDashboardActivityIds) => {
          this.learnerDashboardActivityIds = learnerDashboardActivityIds;
        }
      );
  }

  enablePlaylistTooltip(): void {
    this.playlistTooltipIsEnabled = true;
  }

  disablePlaylistTooltip(): void {
    this.playlistTooltipIsEnabled = false;
  }

  setHoverState(hoverState: boolean): void {
    this.activityIsCurrentlyHoveredOver = hoverState;
  }

  canActivityBeAddedToLearnerPlaylist(activityId: string): boolean {
    if (this.learnerDashboardActivityIds) {
      if (this.learnerDashboardActivityIds.includesActivity(
        activityId)) {
        return false;
      } else {
        if (this.isContainerNarrow) {
          return true;
        } else {
          return this.activityIsCurrentlyHoveredOver;
        }
      }
    }
  }

  belongsToLearnerPlaylist(): boolean {
    var activityType = this.activityType;
    if (this.learnerDashboardActivityIds) {
      if (activityType === constants.ACTIVITY_TYPE_EXPLORATION) {
        return (
          this.learnerDashboardActivityIds.belongsToExplorationPlaylist(
            this.activityId));
      } else if (activityType === constants.ACTIVITY_TYPE_COLLECTION) {
        return (
          this.learnerDashboardActivityIds.belongsToCollectionPlaylist(
            this.activityId));
      }
    }
  }

  belongsToCompletedActivities(): boolean {
    var activityType = this.activityType;
    if (this.learnerDashboardActivityIds) {
      if (activityType === constants.ACTIVITY_TYPE_EXPLORATION) {
        return (
          this.learnerDashboardActivityIds.belongsToCompletedExplorations(
            this.activityId));
      } else if (activityType === constants.ACTIVITY_TYPE_COLLECTION) {
        return (
          this.learnerDashboardActivityIds.belongsToCompletedCollections(
            this.activityId));
      } else if (activityType === constants.ACTIVITY_TYPE_STORY) {
        return (
          this.learnerDashboardActivityIds.belongsToCompletedStories(
            this.activityId));
      } else if (activityType === constants.ACTIVITY_TYPE_LEARN_TOPIC) {
        return (
          this.learnerDashboardActivityIds.belongsToLearntTopics(
            this.activityId));
      }
    }
  }

  belongsToIncompleteActivities(): boolean {
    var activityType = this.activityType;
    if (this.learnerDashboardActivityIds) {
      if (activityType === constants.ACTIVITY_TYPE_EXPLORATION) {
        return (
          this.learnerDashboardActivityIds.belongsToIncompleteExplorations(
            this.activityId));
      } else if (activityType === constants.ACTIVITY_TYPE_COLLECTION) {
        return (
          this.learnerDashboardActivityIds.belongsToIncompleteCollections(
            this.activityId));
      } else if (activityType === constants.ACTIVITY_TYPE_LEARN_TOPIC) {
        return (
          this.learnerDashboardActivityIds.belongsToPartiallyLearntTopics(
            this.activityId));
      }
    }
  }

  addToLearnerPlaylist(activityId: string, activityType: string): void {
    var isSuccessfullyAdded = (
      this.learnerDashboardActivityBackendApiService.addToLearnerPlaylist(
        activityId, activityType));
    if (isSuccessfullyAdded) {
      if (activityType === constants.ACTIVITY_TYPE_EXPLORATION) {
        this.learnerDashboardActivityIds.addToExplorationLearnerPlaylist(
          activityId);
      } else if (activityType === constants.ACTIVITY_TYPE_COLLECTION) {
        this.learnerDashboardActivityIds.addToCollectionLearnerPlaylist(
          activityId);
      }
      this.disablePlaylistTooltip();
    }
  }

  removeFromLearnerPlaylist(
      activityId: string, activityTitle: string, activityType: string): void {
    this.learnerDashboardActivityBackendApiService
      .removeFromLearnerPlaylistModal(
        activityId, activityTitle, activityType,
        this.learnerDashboardActivityIds);
  }
}

angular.module('oppia').directive(
  'oppiaLearnerDashboardIcons', downgradeComponent(
    {component: LearnerDashboardIconsComponent}));
