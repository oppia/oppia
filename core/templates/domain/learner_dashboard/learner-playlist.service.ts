// Copyright 2017 The Oppia Authors. All Rights Reserved.
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


import constants from 'assets/constants';
import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AlertsService } from 'services/alerts.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LearnerDashboardActivityIds } from
  'domain/learner_dashboard/learner-dashboard-activity-ids.model';
import { LearnerPlaylistModalComponent } from './learner-playlist-modal.component';

export interface LearnerPlaylistDict {
  'belongs_to_completed_or_incomplete_list': boolean;
  'belongs_to_subscribed_activities': boolean;
  'playlist_limit_exceeded': boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LearnerPlaylistService {
  constructor(
    private ngbModal: NgbModal,
    private http: HttpClient,
    private alertsService: AlertsService,
    private urlInterpolationService: UrlInterpolationService) {}

  addToLearnerPlaylist(activityId: string, activityType: string): boolean {
    let successfullyAdded = true;
    let addToLearnerPlaylistUrl: string = (
      this.urlInterpolationService.interpolateUrl(
        '/learnerplaylistactivityhandler/<activityType>/<activityId>', {
          activityType: activityType,
          activityId: activityId
        }));
    this.http.post<LearnerPlaylistDict>(
      addToLearnerPlaylistUrl, {}).toPromise().then(
      (response) => {
        if (response.belongs_to_completed_or_incomplete_list) {
          successfullyAdded = false;
          this.alertsService.addInfoMessage(
            'You have already completed or are completing this ' +
            'activity.');
        }
        if (response.belongs_to_subscribed_activities) {
          successfullyAdded = false;
          this.alertsService.addInfoMessage(
            'This is present in your creator dashboard');
        }
        if (response.playlist_limit_exceeded) {
          successfullyAdded = false;
          this.alertsService.addInfoMessage(
            'Your \'Play Later\' list is full!  Either you can ' +
              'complete some or you can head to the learner dashboard ' +
              'and remove some.');
        }
        if (successfullyAdded) {
          this.alertsService.addSuccessMessage(
            'Successfully added to your \'Play Later\' list.');
        }
      });
    return successfullyAdded;
  }

  removeFromLearnerPlaylist(
      activityId: string, activityTitle: string, activityType: string,
      learnerDashboardActivityIds: LearnerDashboardActivityIds):void {
    const modalRef = this.ngbModal.open(
      LearnerPlaylistModalComponent,
      {
        backdrop: true
      });
    modalRef.componentInstance.activityId = activityId;
    modalRef.componentInstance.activityType = activityType;
    modalRef.componentInstance.activityTitle = activityTitle;
    modalRef.componentInstance.urlInterpolationService =
     this.urlInterpolationService;
    modalRef.result.then(function() {
      if (activityType === constants.ACTIVITY_TYPE_EXPLORATION) {
        learnerDashboardActivityIds.removeFromExplorationLearnerPlaylist(
          activityId);
      } else if (activityType === constants.ACTIVITY_TYPE_COLLECTION) {
        learnerDashboardActivityIds.removeFromCollectionLearnerPlaylist(
          activityId);
      }
    }, function() {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }
}

angular.module('oppia').factory(
  'LearnerPlaylistService',
  downgradeInjectable(LearnerPlaylistService));
