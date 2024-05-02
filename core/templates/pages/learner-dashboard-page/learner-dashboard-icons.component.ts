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

import {Component, OnInit, Input} from '@angular/core';

import {AppConstants} from 'app.constants';
import {LearnerDashboardIdsBackendApiService} from 'domain/learner_dashboard/learner-dashboard-ids-backend-api.service';
import {LearnerDashboardActivityBackendApiService} from 'domain/learner_dashboard/learner-dashboard-activity-backend-api.service';
import {LearnerDashboardActivityIds} from 'domain/learner_dashboard/learner-dashboard-activity-ids.model';
import {LearnerPlaylistModalComponent} from './modal-templates/learner-playlist-modal.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'oppia-learner-dashboard-icons',
  templateUrl: './learner-dashboard-icons.component.html',
})
export class LearnerDashboardIconsComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() activityType!: string;
  @Input() activityId!: string;
  @Input() activityTitle!: string;
  @Input() isContainerNarrow: boolean = false;
  @Input() isAddToPlaylistIconShown: boolean = false;
  learnerDashboardActivityIds!: LearnerDashboardActivityIds;
  activityIsCurrentlyHoveredOver: boolean = true;
  playlistTooltipIsEnabled: boolean = false;

  constructor(
    private learnerDashboardIdsBackendApiService: LearnerDashboardIdsBackendApiService,
    private learnerDashboardActivityBackendApiService: LearnerDashboardActivityBackendApiService,
    private ngbModal: NgbModal
  ) {}

  ngOnInit(): void {
    this.learnerDashboardIdsBackendApiService
      .fetchLearnerDashboardIdsAsync()
      .then(learnerDashboardActivityIds => {
        this.learnerDashboardActivityIds = learnerDashboardActivityIds;
      });
  }

  enablePlaylistTooltip(): void {
    this.playlistTooltipIsEnabled = true;
  }

  disablePlaylistTooltip(): void {
    this.playlistTooltipIsEnabled = false;
  }

  canActivityBeAddedToLearnerPlaylist(activityId: string): boolean {
    if (this.learnerDashboardActivityIds) {
      if (this.learnerDashboardActivityIds.includesActivity(activityId)) {
        return false;
      }
    }
    return true;
  }

  belongsToLearnerPlaylist(): boolean {
    var activityType = this.activityType;
    if (this.learnerDashboardActivityIds) {
      if (activityType === AppConstants.ACTIVITY_TYPE_EXPLORATION) {
        return this.learnerDashboardActivityIds.belongsToExplorationPlaylist(
          this.activityId
        );
      } else if (activityType === AppConstants.ACTIVITY_TYPE_COLLECTION) {
        return this.learnerDashboardActivityIds.belongsToCollectionPlaylist(
          this.activityId
        );
      }
    }
    return false;
  }

  belongsToCompletedActivities(): boolean {
    var activityType = this.activityType;
    if (this.learnerDashboardActivityIds) {
      if (activityType === AppConstants.ACTIVITY_TYPE_EXPLORATION) {
        return this.learnerDashboardActivityIds.belongsToCompletedExplorations(
          this.activityId
        );
      } else if (activityType === AppConstants.ACTIVITY_TYPE_COLLECTION) {
        return this.learnerDashboardActivityIds.belongsToCompletedCollections(
          this.activityId
        );
      } else if (activityType === AppConstants.ACTIVITY_TYPE_STORY) {
        return this.learnerDashboardActivityIds.belongsToCompletedStories(
          this.activityId
        );
      } else if (activityType === AppConstants.ACTIVITY_TYPE_LEARN_TOPIC) {
        return this.learnerDashboardActivityIds.belongsToLearntTopics(
          this.activityId
        );
      }
    }
    return false;
  }

  belongsToIncompleteActivities(): boolean {
    var activityType = this.activityType;
    if (this.learnerDashboardActivityIds) {
      if (activityType === AppConstants.ACTIVITY_TYPE_EXPLORATION) {
        return this.learnerDashboardActivityIds.belongsToIncompleteExplorations(
          this.activityId
        );
      } else if (activityType === AppConstants.ACTIVITY_TYPE_COLLECTION) {
        return this.learnerDashboardActivityIds.belongsToIncompleteCollections(
          this.activityId
        );
      } else if (activityType === AppConstants.ACTIVITY_TYPE_LEARN_TOPIC) {
        return this.learnerDashboardActivityIds.belongsToPartiallyLearntTopics(
          this.activityId
        );
      }
    }
    return false;
  }

  async addToLearnerPlaylist(
    activityId: string,
    activityType: string
  ): Promise<void> {
    var isSuccessfullyAdded =
      await this.learnerDashboardActivityBackendApiService.addToLearnerPlaylist(
        activityId,
        activityType
      );
    if (isSuccessfullyAdded) {
      if (activityType === AppConstants.ACTIVITY_TYPE_EXPLORATION) {
        this.learnerDashboardActivityIds.addToExplorationLearnerPlaylist(
          activityId
        );
      } else if (activityType === AppConstants.ACTIVITY_TYPE_COLLECTION) {
        this.learnerDashboardActivityIds.addToCollectionLearnerPlaylist(
          activityId
        );
      }
      this.disablePlaylistTooltip();
    }
  }

  // This function will open a modal to remove an exploration
  // from the 'Play Later' list in the Library Page.
  removeFromLearnerPlaylist(
    activityId: string,
    activityTitle: string,
    activityType: string
  ): void {
    // This following logic of showing a modal for confirmation previously
    // resided in learnerDashboardActivityBackendApiService. However, in
    // issue #14225, we noticed some errors with dynamic component creation.
    // The componentFactoryResolver in the service was from AppModule and not
    // the page specific module. This makes sense as the we provide all
    // services in root (As specified by the providedIn: 'root'). So the
    // injector used is the root injector and not the page module injector.
    // The entry components specified in page module won't be available when
    // we use the root injector.
    // TODO(#14290): Find a better way to refactor code that opens modals
    // into new services that use the page specific injector rather than
    // the root injector.
    const modelRef = this.ngbModal.open(LearnerPlaylistModalComponent, {
      backdrop: true,
    });
    modelRef.componentInstance.activityId = activityId;
    modelRef.componentInstance.activityTitle = activityTitle;
    modelRef.componentInstance.activityType = activityType;
    modelRef.result.then(
      playlistUrl => {
        this.learnerDashboardActivityBackendApiService.removeFromLearnerPlaylist(
          activityId,
          activityType,
          this.learnerDashboardActivityIds,
          playlistUrl
        );
      },
      () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      }
    );
  }
}
