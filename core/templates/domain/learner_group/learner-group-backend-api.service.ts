// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Backend services to get and send data for learner groups
 * from backend and to backend.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { LearnerGroupBackendDict, LearnerGroupData } from './learner-group.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { LearnerGroupUserInfo, LearnerGroupUserInfoBackendDict } from
  './learner-group-user-info.model';
import {
  LearnerGroupAllLearnersInfo,
  LearnerGroupAllLearnersInfoBackendDict
} from './learner-group-all-learners-info.model';


interface DeleteLearnerGroupBackendResponse {
  success: boolean;
}

interface LearnerGroupFeatureIsEnabledBackendDict {
  feature_is_enabled: boolean;
}

interface LearnerGroupProgressSharingPermissionBackendDict {
  progress_sharing_permission: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LearnerGroupBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  async createNewLearnerGroupAsync(
      title: string, description: string,
      invitedLearnerUsernames: string[],
      subtopicPageIds: string[],
      storyIds: string[]
  ): Promise<LearnerGroupData> {
    return new Promise((resolve, reject) => {
      const learnerGroupCreationUrl = '/create_learner_group_handler';

      const postData = {
        group_title: title,
        group_description: description,
        invited_learner_usernames: invitedLearnerUsernames,
        subtopic_page_ids: subtopicPageIds,
        story_ids: storyIds
      };

      this.http.post<LearnerGroupBackendDict>(
        learnerGroupCreationUrl, postData).toPromise().then(response => {
        resolve(LearnerGroupData.createFromBackendDict(response));
      });
    });
  }

  async updateLearnerGroupAsync(
      learnerGroupData: LearnerGroupData
  ): Promise<LearnerGroupData> {
    return new Promise((resolve, reject) => {
      const learnerGroupUpdationUrl = (
        this.urlInterpolationService.interpolateUrl(
          '/update_learner_group_handler/<learner_group_id>', {
            learner_group_id: learnerGroupData.id
          }
        )
      );
      const putData = {
        group_title: learnerGroupData.title,
        group_description: learnerGroupData.description,
        learner_usernames: learnerGroupData.learnerUsernames,
        invited_learner_usernames: learnerGroupData.invitedLearnerUsernames,
        subtopic_page_ids: learnerGroupData.subtopicPageIds,
        story_ids: learnerGroupData.storyIds
      };

      this.http.put<LearnerGroupBackendDict>(
        learnerGroupUpdationUrl, putData).toPromise().then(response => {
        resolve(LearnerGroupData.createFromBackendDict(response));
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async deleteLearnerGroupAsync(
      learnerGroupId: string
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const learnerGroupDeletionUrl = (
        this.urlInterpolationService.interpolateUrl(
          '/delete_learner_group_handler/<learner_group_id>', {
            learner_group_id: learnerGroupId
          }
        )
      );

      this.http.delete<DeleteLearnerGroupBackendResponse>(
        learnerGroupDeletionUrl).toPromise().then(response => {
        resolve(response.success);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async _fetchLearnerGroupInfoAsync(
      learnerGroupId: string
  ):
  Promise<LearnerGroupData> {
    return new Promise((resolve, reject) => {
      const learnerGroupUrl = (
        this.urlInterpolationService.interpolateUrl(
          '/view_learner_group_info_handler/<learner_group_id>', {
            learner_group_id: learnerGroupId
          }
        )
      );

      this.http.get<LearnerGroupBackendDict>(
        learnerGroupUrl).toPromise().then(learnerGroupInfo => {
        resolve(LearnerGroupData.createFromBackendDict(learnerGroupInfo));
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async fetchLearnerGroupInfoAsync(
      learnerGroupId: string
  ):
  Promise<LearnerGroupData> {
    return this._fetchLearnerGroupInfoAsync(learnerGroupId);
  }

  async searchNewLearnerToAddAsync(
      learnerGroupId: string,
      username: string
  ): Promise<LearnerGroupUserInfo> {
    return new Promise((resolve, reject) => {
      const learnerGroupUrl = '/learner_group_search_learner_handler';
      const filterData = {
        username: username,
        learner_group_id: learnerGroupId
      };
      this.http.get<LearnerGroupUserInfoBackendDict>(
        learnerGroupUrl, {
          params: filterData
        }
      ).toPromise().then(response => {
        resolve(LearnerGroupUserInfo.createFromBackendDict(response));
      });
    });
  }

  async fetchLearnersInfoAsync(
      learnerGroupId: string
  ): Promise<LearnerGroupAllLearnersInfo> {
    return new Promise((resolve, reject) => {
      const learnerGroupUrl = (
        this.urlInterpolationService.interpolateUrl(
          '/learner_group_learners_info_handler/<learner_group_id>', {
            learner_group_id: learnerGroupId
          }
        )
      );
      this.http.get<LearnerGroupAllLearnersInfoBackendDict>(
        learnerGroupUrl).toPromise().then(response => {
        resolve(LearnerGroupAllLearnersInfo.createFromBackendDict(response));
      });
    });
  }

  async updateLearnerGroupInviteAsync(
      learnerGroupId: string,
      learnerUsername: string,
      isInviatationAccepted: boolean,
      progressSharingPermission = false
  ): Promise<LearnerGroupData> {
    return new Promise((resolve, reject) => {
      const learnerGroupUrl = (
        this.urlInterpolationService.interpolateUrl(
          '/learner_group_learner_invitation_handler/<learner_group_id>', {
            learner_group_id: learnerGroupId
          }
        )
      );
      const putData = {
        learner_username: learnerUsername,
        is_invitation_accepted: isInviatationAccepted.toString(),
        progress_sharing_permission: progressSharingPermission.toString()
      };
      this.http.put<LearnerGroupBackendDict>(
        learnerGroupUrl, putData).toPromise().then(response => {
        resolve(LearnerGroupData.createFromBackendDict(response));
      });
    });
  }

  async exitLearnerGroupAsync(
      learnerGroupId: string,
      learnerUsername: string
  ): Promise<LearnerGroupData> {
    return new Promise((resolve, reject) => {
      const learnerGroupUrl = (
        this.urlInterpolationService.interpolateUrl(
          '/exit_learner_group_handler/<learner_group_id>', {
            learner_group_id: learnerGroupId
          }
        )
      );
      const putData = {
        learner_username: learnerUsername
      };

      this.http.put<LearnerGroupBackendDict>(
        learnerGroupUrl, putData).toPromise().then(response => {
        resolve(LearnerGroupData.createFromBackendDict(response));
      });
    });
  }

  async fetchProgressSharingPermissionOfLearnerAsync(learnerGroupId: string):
  Promise<boolean> {
    return new Promise((resolve, reject) => {
      const permissionStatusUrl = (
        this.urlInterpolationService.interpolateUrl(
          '/learner_group_progress_sharing_permission_handler/' +
          '<learner_group_id>', {
            learner_group_id: learnerGroupId
          }
        )
      );
      this.http.get<LearnerGroupProgressSharingPermissionBackendDict>(
        permissionStatusUrl).toPromise().then(response => {
        resolve(response.progress_sharing_permission);
      });
    });
  }

  async updateProgressSharingPermissionAsync(
      learnerGroupId: string,
      progressSharingPermission: boolean
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const permissionStatusUrl = (
        this.urlInterpolationService.interpolateUrl(
          '/learner_group_progress_sharing_permission_handler/' +
          '<learner_group_id>', {
            learner_group_id: learnerGroupId
          }
        )
      );
      const putData = {
        progress_sharing_permission: progressSharingPermission.toString()
      };

      this.http.put<LearnerGroupProgressSharingPermissionBackendDict>(
        permissionStatusUrl, putData).toPromise().then(response => {
        resolve(response.progress_sharing_permission);
      });
    });
  }

  async _isLearnerGroupFeatureEnabledAsync():
  Promise<boolean> {
    return new Promise((resolve, reject) => {
      const featureStatusUrl = '/learner_groups_feature_status_handler';
      this.http.get<LearnerGroupFeatureIsEnabledBackendDict>(
        featureStatusUrl).toPromise().then(response => {
        resolve(response.feature_is_enabled);
      });
    });
  }

  async isLearnerGroupFeatureEnabledAsync():
  Promise<boolean> {
    return this._isLearnerGroupFeatureEnabledAsync();
  }
}

angular.module('oppia').factory(
  'LearnerGroupBackendApiService',
  downgradeInjectable(LearnerGroupBackendApiService));
