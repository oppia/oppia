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

 import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
 import { downgradeComponent } from '@angular/upgrade/static';
 import { TranslateService } from '@ngx-translate/core';
 import { Subscription } from 'rxjs';
 
 import { AppConstants } from 'app.constants';
 import { SubtopicViewerBackendApiService } from 'domain/subtopic_viewer/subtopic-viewer-backend-api.service';
 import { SubtopicPageContents } from 'domain/topic/subtopic-page-contents.model';
 import { Subtopic } from 'domain/topic/subtopic.model';
 import { AlertsService } from 'services/alerts.service';
 import { ContextService } from 'services/context.service';
 import { UrlService } from 'services/contextual/url.service';
 import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
 import { I18nLanguageCodeService, TranslationKeyType } from 'services/i18n-language-code.service';
 import { LoaderService } from 'services/loader.service';
 import { PageTitleService } from 'services/page-title.service';
import { LearnerGroupData } from 'domain/learner_group/learner-group.model';
import { LearnerGroupPagesConstants } from './learner-group-pages.constants';
import { LearnerGroupBackendApiService } from 'domain/learner_group/learner-group-backend-api.service';
import { LearnerGroupInvitedUserInfo } from 'domain/learner_group/learner-group-user-progress.model';
 
@Component({
  selector: 'oppia-invite-students',
  templateUrl: './invite-students.component.html'
})
export class InviteStudentsComponent implements OnInit, OnDestroy {
  @Output() updateLearnerGroupInvitedStudents:
    EventEmitter<string[]> = new EventEmitter();
  learnerGroupTitle: string;
  learnerGroupDescription: string;
  directiveSubscriptions = new Subscription();

  searchedUsername: string;
  placeholderMessage: string;
  invitedUsersInfo: LearnerGroupInvitedUserInfo[] = [];
  invitedUsernames: string[] = [];

  constructor(
    private alertsService: AlertsService,
    private contextService: ContextService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private loaderService: LoaderService,
    private pageTitleService: PageTitleService,
    private subtopicViewerBackendApiService: SubtopicViewerBackendApiService,
    private urlService: UrlService,
    private windowDimensionsService: WindowDimensionsService,
    private translateService: TranslateService,
    private learnerGroupBackendApiService: LearnerGroupBackendApiService
  ) {}

  checkMobileView(): boolean {
    return (this.windowDimensionsService.getWidth() < 500);
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }

  ngOnInit(): void {
    this.placeholderMessage = 'Add username of the student to invite and press enter';
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
    this.contextService.removeCustomEntityContext();
  }

  updateInvitedStudents(): void {
    this.updateLearnerGroupInvitedStudents.emit(
      this.invitedUsernames);
  }

  onSearchQueryChangeExec(username: string): void {
    if (username) {
      if (this.invitedUsernames.includes(username)) {
        this.alertsService.addWarning(
          'User with username ' + username + ' has been already invited.'
        );
        return
      }
      this.learnerGroupBackendApiService.searchNewStudentToAddAsync(
        'newId', username
      ).then((userInfo) => {
        if (!userInfo.error) {
          this.invitedUsersInfo.push(userInfo);
          this.invitedUsernames.push(userInfo.username);
          this.alertsService.clearWarnings();
          this.updateInvitedStudents();
        } else {
          this.alertsService.addWarning(userInfo.error);
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
}

angular.module('oppia').directive(
  'oppiaLearnerGroupDetails',
  downgradeComponent({component: InviteStudentsComponent}));
