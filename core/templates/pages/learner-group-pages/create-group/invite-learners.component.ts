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
 * @fileoverview Component for the inviting learners to learner group.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { LearnerGroupBackendApiService } from
  'domain/learner_group/learner-group-backend-api.service';
import { LearnerGroupUserInfo } from
  'domain/learner_group/learner-group-user-info.model';
import { UserService } from 'services/user.service';

import './invite-learners.component.css';


@Component({
  selector: 'oppia-invite-learners',
  templateUrl: './invite-learners.component.html',
  styleUrls: ['./invite-learners.component.css']
})
export class InviteLearnersComponent {
  @Input() learnerGroupID: string = '';
  @Input() invitedUsersInfo: LearnerGroupUserInfo[] = [];
  @Input() invitedUsernames: string[] = [];
  @Output() updateLearnerGroupInvitedLearners:
    EventEmitter<string[]> = new EventEmitter();

  @Output() updateLearnerGroupInvitedLearnersInfo:
    EventEmitter<LearnerGroupUserInfo[]> = new EventEmitter();

  searchedUsername: string = '';
  errorMessage!: string;

  constructor(
    private learnerGroupBackendApiService: LearnerGroupBackendApiService,
    private userService: UserService
  ) {}

  updateInvitedLearners(): void {
    this.updateLearnerGroupInvitedLearners.emit(
      this.invitedUsernames);
    this.updateLearnerGroupInvitedLearnersInfo.emit(
      this.invitedUsersInfo);
  }

  onSearchQueryChangeExec(username: string): void {
    if (username) {
      const isUserAlreadyInvited = this.invitedUsernames.some(
        (name) => name.toLowerCase() === username.toLowerCase()
      );
      if (isUserAlreadyInvited) {
        this.errorMessage = (
          'User with username ' + username + ' has been already invited.'
        );
        return;
      }
      this.learnerGroupBackendApiService.searchNewLearnerToAddAsync(
        this.learnerGroupID, username
      ).then(userInfo => {
        if (!userInfo.error) {
          this.errorMessage = '';
          this.invitedUsersInfo.push(userInfo);
          this.invitedUsernames.push(userInfo.username);
          this.updateInvitedLearners();
        } else {
          this.errorMessage = userInfo.error;
        }
      });
    }
  }

  removeInvitedLearner(username: string): void {
    this.invitedUsersInfo = this.invitedUsersInfo.filter(
      (userInfo) => userInfo.username !== username);
    this.invitedUsernames = this.invitedUsernames.filter(
      (username) => username !== username);
    this.updateInvitedLearners();
  }

  getProfileImagePngDataUrl(username: string): string {
    let [pngImageUrl, _] = this.userService.getProfileImageDataUrl(
      username);
    return pngImageUrl;
  }

  getProfileImageWebpDataUrl(username: string): string {
    let [_, webpImageUrl] = this.userService.getProfileImageDataUrl(
      username);
    return webpImageUrl;
  }
}

angular.module('oppia').directive(
  'oppiaInviteLearners',
  downgradeComponent({component: InviteLearnersComponent}));
