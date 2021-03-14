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
import { LearnerPlaylistService } from
  'domain/learner_dashboard/learner-playlist-backend-api.service';
import { LearnerDashboardActivityIds } from
  'domain/learner_dashboard/learner-dashboard-activity-ids.model';

@Component({
  selector: 'learner-dashboard-icons',
  templateUrl: './learner-dashboard-icons.component.html',
})
export class LearnerDashboardIconsComponent implements OnInit {
  activityIsCurrentlyHoveredOver: boolean = true;
  playlistTooltipIsEnabled: boolean = false;
  learnerDashboardActivityIds: LearnerDashboardActivityIds;

  @Input() activityType: string;
  @Input() activityId: string;
  @Input() activityTitle: string;
  // @Input() activityActive: string;
  @Input()
  get activityActive(): boolean{ return }
  set activityActive(hoverState: boolean){
    this.activityIsCurrentlyHoveredOver = hoverState }
  @Input() isContainerNarrow: boolean;
  @Input() isAddToPlaylistIconShown: boolean;

  constructor(
    private learnerDashboardIdsBackendApiService:
      LearnerDashboardIdsBackendApiService,
    private learnerPlaylistService: LearnerPlaylistService
  ) {}

  ngOnInit(): void {
    this.learnerDashboardIdsBackendApiService.
      fetchLearnerDashboardIdsAsync().then(
        (learnerDashboardActivityIds) => {
          this.learnerDashboardActivityIds = learnerDashboardActivityIds;
        }
      ); 
  }

  enablePlaylistTooltip() {
    this.playlistTooltipIsEnabled = true;
  }

  disablePlaylistTooltip() {
    this.playlistTooltipIsEnabled = false;
  }

  setHoverState(hoverState) {
    this.activityIsCurrentlyHoveredOver = hoverState;
  }

  canActivityBeAddedToLearnerPlaylist(activityId) {
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

  belongsToLearnerPlaylist() {
    var activityType = this.activityType;
    if (this.learnerDashboardActivityIds) {
      if (activityType === constants.ACTIVITY_TYPE_EXPLORATION) {
        return (
          /* eslint-disable-next-line max-len */
          this.learnerDashboardActivityIds.belongsToExplorationPlaylist(
            this.activityId));
      } else if (activityType === constants.ACTIVITY_TYPE_COLLECTION) {
        return (
          /* eslint-disable-next-line max-len */
          this.learnerDashboardActivityIds.belongsToCollectionPlaylist(
            this.activityId));
      }
    }
  }

  belongsToCompletedActivities() {
    var activityType = this.activityType;
    if (this.learnerDashboardActivityIds) {
      if (activityType === constants.ACTIVITY_TYPE_EXPLORATION) {
        return (
          // eslint-disable-next-line max-len
          this.learnerDashboardActivityIds.belongsToCompletedExplorations(
            this.activityId));
      } else if (activityType === constants.ACTIVITY_TYPE_COLLECTION) {
        return (
          // eslint-disable-next-line max-len
          this.learnerDashboardActivityIds.belongsToCompletedCollections(
            this.activityId));
      }
    }
  }

  belongsToIncompleteActivities() {
    var activityType = this.activityType;
    if (this.learnerDashboardActivityIds) {
      if (activityType === constants.ACTIVITY_TYPE_EXPLORATION) {
        return (
          // eslint-disable-next-line max-len
          this.learnerDashboardActivityIds.belongsToIncompleteExplorations(
            this.activityId));
      } else if (activityType === constants.ACTIVITY_TYPE_COLLECTION) {
        return (
          // eslint-disable-next-line max-len
          this.learnerDashboardActivityIds.belongsToIncompleteCollections(
            this.activityId));
      }
    }
  }

  addToLearnerPlaylist(activityId, activityType) {
    var isSuccessfullyAdded = (
      this.learnerPlaylistService.addToLearnerPlaylist(
        activityId, activityType));
    if (isSuccessfullyAdded) {
      if (activityType === constants.ACTIVITY_TYPE_EXPLORATION) {
        /* eslint-disable-next-line max-len */
        this.learnerDashboardActivityIds.addToExplorationLearnerPlaylist(
          activityId);
      } else if (activityType === constants.ACTIVITY_TYPE_COLLECTION) {
        /* eslint-disable-next-line max-len */
        this.learnerDashboardActivityIds.addToCollectionLearnerPlaylist(
          activityId);
      }
      this.disablePlaylistTooltip();
    }
  }

  removeFromLearnerPlaylist(activityId, activityTitle, activityType) {
    this.learnerPlaylistService.removeFromLearnerPlaylist(
      activityId, activityTitle, activityType,
      this.learnerDashboardActivityIds);
  }
}

angular.module('oppia').directive(
  'learnerDashboardIcons', downgradeComponent(
    {component: LearnerDashboardIconsComponent}));
