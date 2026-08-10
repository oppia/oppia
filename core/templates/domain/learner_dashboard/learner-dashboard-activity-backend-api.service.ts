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
 * @fileoverview Service related to the learner dashboard activities.
 */

import {Injectable} from '@angular/core';

import {AlertsService} from 'services/alerts.service';
import {HttpClient} from '@angular/common/http';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {RemoveActivityModalComponent} from 'pages/learner-dashboard-page/modal-templates/remove-activity-modal.component';

interface LearnerGoalsResponseObject {
  belongs_to_learnt_list: boolean;
  is_super_admin: boolean;
  goals_limit_exceeded: boolean;
  user_email: string;
  username: string;
}

@Injectable({
  providedIn: 'root',
})
export class LearnerDashboardActivityBackendApiService {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  addToLearnerGoalsUrl!: string;
  removeActivityModalStatus!: string;
  successfullyAdded: boolean = false;

  constructor(
    private alertsService: AlertsService,
    private http: HttpClient,
    private ngbModal: NgbModal,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  async addToLearnerGoals(
    activityId: string,
    activityType: string
  ): Promise<boolean> {
    this.successfullyAdded = true;
    this.addToLearnerGoalsUrl = this.urlInterpolationService.interpolateUrl(
      '/learnergoalshandler/<activityType>/<activityId>',
      {
        activityType: activityType,
        activityId: activityId,
      }
    );
    var response = await this.http
      .post<LearnerGoalsResponseObject>(this.addToLearnerGoalsUrl, {})
      .toPromise();
    if (response.belongs_to_learnt_list) {
      this.successfullyAdded = false;
      this.alertsService.addInfoMessage(
        'You have already learnt this activity.'
      );
    }
    if (response.goals_limit_exceeded) {
      this.successfullyAdded = false;
      this.alertsService.addInfoMessage(
        "Your 'Current Goals' list is full! Please finish existing " +
          'goals or remove some to add new goals to your list.'
      );
    }
    if (this.successfullyAdded) {
      this.alertsService.addSuccessMessage(
        "Successfully added to your 'Current Goals' list."
      );
    }
    return this.successfullyAdded;
  }

  // This function will open a modal to remove an exploration
  // from the given list or remove a topic from the 'Current
  // Goals' or 'In Progress' in Learner Dashboard Page.
  async removeActivityModalAsync(
    sectionNameI18nId: string,
    subsectionName: string,
    activityId: string,
    activityTitle: string
  ): Promise<void> {
    const modelRef = this.ngbModal.open(RemoveActivityModalComponent, {
      backdrop: true,
    });
    modelRef.componentInstance.sectionNameI18nId = sectionNameI18nId;
    modelRef.componentInstance.subsectionName = subsectionName;
    modelRef.componentInstance.activityId = activityId;
    modelRef.componentInstance.activityTitle = activityTitle;
    await modelRef.result.then(
      activityUrl => {
        this.http.delete<void>(activityUrl).toPromise();
        this.removeActivityModalStatus = 'removed';
      },
      () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
        this.removeActivityModalStatus = 'canceled';
      }
    );

    return new Promise((resolve, reject) => {
      if (this.removeActivityModalStatus === 'removed') {
        resolve();
      }
    });
  }
}
