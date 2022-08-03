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
import {
  LearnerGroupAllStudentsInfo,
  LearnerGroupAllStudentsInfoBackendDict,
  LearnerGroupUserInfo, LearnerGroupUserInfoBackendDict
} from './learner-group-user-info.model';


interface DeleteLearnerGroupBackendResponse {
  success: boolean;
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
      invitedStudentUsernames: string[],
      subtopicPageIds: string[],
      storyIds: string[]
  ): Promise<LearnerGroupData> {
    return new Promise((resolve, reject) => {
      const learnerGroupCreationUrl = '/create_learner_group_handler';

      const postData = {
        group_title: title,
        group_description: description,
        invited_student_usernames: invitedStudentUsernames,
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
        student_usernames: learnerGroupData.studentUsernames,
        invited_student_usernames: learnerGroupData.invitedStudentUsernames,
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
          '/facilitator_view_of_learner_group_handler/<learner_group_id>', {
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

  async searchNewStudentToAddAsync(
      learnerGroupId: string,
      username: string
  ): Promise<LearnerGroupUserInfo> {
    return new Promise((resolve, reject) => {
      const learnerGroupUrl = '/learner_group_search_student_handler';
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

  async fetchStudentsInfoAsync(
      learnerGroupId: string
  ): Promise<LearnerGroupAllStudentsInfo> {
    return new Promise((resolve, reject) => {
      const learnerGroupUrl = (
        this.urlInterpolationService.interpolateUrl(
          '/learner_group_students_info_handler/<learner_group_id>', {
            learner_group_id: learnerGroupId
          }
        )
      );
      this.http.get<LearnerGroupAllStudentsInfoBackendDict>(
        learnerGroupUrl).toPromise().then(response => {
        resolve(LearnerGroupAllStudentsInfo.createFromBackendDict(response));
      });
    });
  }

  async updateLearnerGroupInviteAsync(
      learnerGroupId: string,
      studentUsername: string,
      isInviatationAccepted: boolean,
      progressSharingPermission = false
  ): Promise<LearnerGroupData> {
    return new Promise((resolve, reject) => {
      const learnerGroupUrl = (
        this.urlInterpolationService.interpolateUrl(
          '/learner_group_student_invitation_handler/<learner_group_id>', {
            learner_group_id: learnerGroupId
          }
        )
      );
      const putData = {
        student_username: studentUsername,
        is_invitation_accepted: isInviatationAccepted.toString(),
        progress_sharing_permission: progressSharingPermission.toString()
      };
      this.http.put<LearnerGroupBackendDict>(
        learnerGroupUrl, putData).toPromise().then(response => {
        resolve(LearnerGroupData.createFromBackendDict(response));
      });
    });
  }
}

angular.module('oppia').factory(
  'LearnerGroupBackendApiService',
  downgradeInjectable(LearnerGroupBackendApiService));
