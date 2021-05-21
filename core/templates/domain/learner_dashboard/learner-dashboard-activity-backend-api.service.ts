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
 * @fileoverview Service related to the learner playlist.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AppConstants } from 'app.constants';
import { AlertsService } from 'services/alerts.service';
import { HttpClient } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { LearnerDashboardActivityIds } from 'domain/learner_dashboard/learner-dashboard-activity-ids.model';
import { LearnerPlaylistModalComponent } from 'pages/learner-dashboard-page/modal-templates/learner-playlist-modal.component';
import { RemoveActivityModalComponent } from 'pages/learner-dashboard-page/modal-templates/remove-activity-modal.component';

interface LearnerPlaylistResponseObject {
  'belongs_to_completed_or_incomplete_list': boolean
  'belongs_to_subscribed_activities': boolean
  'is_admin': boolean
  'is_moderator': boolean
  'is_super_admin': boolean
  'is_topic_manager': boolean
  'playlist_limit_exceeded': boolean
  'user_email': string
  'username': string
  }

@Injectable({
  providedIn: 'root'
})
export class LearnerDashboardActivityBackendApiService {
  successfullyAdded: boolean;
  addToLearnerPlaylistUrl: string;
  removeActivityModalStatus: string;

  constructor(
    private alertsService: AlertsService,
    private http: HttpClient,
    private ngbModal: NgbModal,
    private urlInterpolationService: UrlInterpolationService,
  ) {}

  addToLearnerPlaylist(activityId: string, activityType: string): boolean {
    this.successfullyAdded = true;
    this.addToLearnerPlaylistUrl = (
      this.urlInterpolationService.interpolateUrl(
        '/learnerplaylistactivityhandler/<activityType>/<activityId>', {
          activityType: activityType,
          activityId: activityId
        }));
    this.http.post<LearnerPlaylistResponseObject>(
      this.addToLearnerPlaylistUrl, {}).toPromise()
      .then(response => {
        if (response.belongs_to_completed_or_incomplete_list) {
          this.successfullyAdded = false;
          this.alertsService.addInfoMessage(
            'You have already completed or are completing this ' +
            'activity.');
        }
        if (response.belongs_to_subscribed_activities) {
          this.successfullyAdded = false;
          this.alertsService.addInfoMessage(
            'This is present in your creator dashboard');
        }
        if (response.playlist_limit_exceeded) {
          this.successfullyAdded = false;
          this.alertsService.addInfoMessage(
            'Your \'Play Later\' list is full!  Either you can ' +
            'complete some or you can head to the learner dashboard ' +
            'and remove some.');
        }
        if (this.successfullyAdded) {
          this.alertsService.addSuccessMessage(
            'Successfully added to your \'Play Later\' list.');
        }
      });
    return this.successfullyAdded;
  }

  // This function will open a modal to remove an exploration
  // from the 'Play Later' list in the Library Page.
  removeFromLearnerPlaylistModal(
      activityId: string, activityTitle: string, activityType: string,
      learnerDashboardActivityIds: LearnerDashboardActivityIds): void {
    const modelRef = this.ngbModal.open(
      LearnerPlaylistModalComponent, {backdrop: true});
    modelRef.componentInstance.activityId = activityId;
    modelRef.componentInstance.activityTitle = activityTitle;
    modelRef.componentInstance.activityType = activityType;
    modelRef.result.then((playlistUrl) => {
      this.http.delete<void>(playlistUrl).toPromise();
      if (activityType === AppConstants.ACTIVITY_TYPE_EXPLORATION) {
        learnerDashboardActivityIds.removeFromExplorationLearnerPlaylist(
          activityId);
      } else if (activityType === AppConstants.ACTIVITY_TYPE_COLLECTION) {
        learnerDashboardActivityIds.removeFromCollectionLearnerPlaylist(
          activityId);
      }
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  // This function will open a modal to remove an exploration
  // from the given list either 'Play Later' or 'In Progress'
  // in Learner Dashboard Page.
  async removeActivityModalAsync(
      sectionNameI18nId: string, subsectionName: string,
      activityId: string, activityTitle: string): Promise<void> {
    this.removeActivityModalStatus = null;
    const modelRef = this.ngbModal.open(
      RemoveActivityModalComponent, {backdrop: true});
    modelRef.componentInstance.sectionNameI18nId = sectionNameI18nId;
    modelRef.componentInstance.subsectionName = subsectionName;
    modelRef.componentInstance.activityId = activityId;
    modelRef.componentInstance.activityTitle = activityTitle;
    await modelRef.result.then((playlistUrl) => {
      this.http.delete<void>(playlistUrl).toPromise();
      this.removeActivityModalStatus = 'removed';
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
      this.removeActivityModalStatus = 'canceled';
    });

    return new Promise((resolve, reject) => {
      if (this.removeActivityModalStatus === 'removed') {
        resolve();
      }
    });
  }
}

angular.module('oppia').factory(
  'LearnerDashboardActivityBackendApiService',
  downgradeInjectable(LearnerDashboardActivityBackendApiService)
);
