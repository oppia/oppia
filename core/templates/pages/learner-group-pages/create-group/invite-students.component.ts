// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the subtopic viewer.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AlertsService } from 'services/alerts.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { LearnerGroupBackendApiService } from
  'domain/learner_group/learner-group-backend-api.service';
import { LearnerGroupInvitedUserInfo } from
  'domain/learner_group/learner-group-user-progress.model';

@Component({
  selector: 'oppia-invite-students',
  templateUrl: './invite-students.component.html'
})
export class InviteStudentsComponent {
  @Input() learnerGroupID: string = '';
  @Input() invitedUsersInfo: LearnerGroupInvitedUserInfo[] = [];
  @Input() invitedUsernames: string[] = [];
  @Output() updateLearnerGroupInvitedStudents:
    EventEmitter<string[]> = new EventEmitter();

  @Output() updateLearnerGroupInvitedStudentsInfo:
    EventEmitter<LearnerGroupInvitedUserInfo[]> = new EventEmitter();

  learnerGroupTitle: string;
  learnerGroupDescription: string;
  searchedUsername: string;
  alertTimeout = 6000;

  constructor(
    private alertsService: AlertsService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private learnerGroupBackendApiService: LearnerGroupBackendApiService
  ) {}

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }

  updateInvitedStudents(): void {
    this.updateLearnerGroupInvitedStudents.emit(
      this.invitedUsernames);
    this.updateLearnerGroupInvitedStudentsInfo.emit(
      this.invitedUsersInfo);
  }

  onSearchQueryChangeExec(username: string): void {
    if (username) {
      if (this.invitedUsernames.includes(username.toLowerCase())) {
        this.alertsService.addInfoMessage(
          'User with username ' + username + ' has been already invited.'
        );
        return;
      }
      this.learnerGroupBackendApiService.searchNewStudentToAddAsync(
        this.learnerGroupID, username
      ).then(userInfo => {
        if (!userInfo.error) {
          this.invitedUsersInfo.push(userInfo);
          this.invitedUsernames.push(userInfo.username);
          this.updateInvitedStudents();
        } else {
          this.alertsService.addInfoMessage(userInfo.error, this.alertTimeout);
        }
      });
    }
  }

  removeInvitedStudent(username: string): void {
    this.invitedUsersInfo = this.invitedUsersInfo.filter(
      (userInfo) => userInfo.username !== username);
    this.invitedUsernames = this.invitedUsernames.filter(
      (username) => username !== username);
    this.updateInvitedStudents();
  }

  getProfileImageDataUrl(dataUrl: string): string {
    return decodeURIComponent(dataUrl);
  }
}

angular.module('oppia').directive(
  'oppiaLearnerGroupDetails',
  downgradeComponent({component: InviteStudentsComponent}));
