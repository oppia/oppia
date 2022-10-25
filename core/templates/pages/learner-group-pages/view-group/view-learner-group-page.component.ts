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
 * @fileoverview Component for the view learner group page.
 */

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { LoaderService } from 'services/loader.service';
import { LearnerGroupPagesConstants } from '../learner-group-pages.constants';
import { LearnerGroupData } from 'domain/learner_group/learner-group.model';
import { LearnerGroupBackendApiService } from
  'domain/learner_group/learner-group-backend-api.service';
import { ContextService } from 'services/context.service';
import { LearnerGroupSyllabusBackendApiService } from
  'domain/learner_group/learner-group-syllabus-backend-api.service';
import { UserService } from 'services/user.service';
import { LearnerGroupUserProgress } from 'domain/learner_group/learner-group-user-progress.model';
import { ExitLearnerGroupModalComponent } from
  '../templates/exit-learner-group-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { WindowRef } from 'services/contextual/window-ref.service';
import { LearnerGroupPreferencesModalComponent } from
  '../templates/learner-group-preferences-modal.component';

import './view-learner-group-page.component.css';

@Component({
  selector: 'oppia-view-learner-group-page',
  templateUrl: './view-learner-group-page.component.html'
})
export class ViewLearnerGroupPageComponent implements OnInit {
  VIEW_LEARNER_GROUP_TABS_I18N_IDS = (
    LearnerGroupPagesConstants.VIEW_LEARNER_GROUP_TABS);

  activeTab!: string;
  learnerGroupId!: string;
  learnerGroup!: LearnerGroupData;
  username: string | null = null;
  learnerProgress!: LearnerGroupUserProgress;
  progressSharingPermission!: boolean;

  constructor(
    private loaderService: LoaderService,
    private learnerGroupBackendApiService: LearnerGroupBackendApiService,
    private contextService: ContextService,
    private userService: UserService,
    private ngbModal: NgbModal,
    private windowRef: WindowRef,
    private learnerGroupSyllabusBackendApiService:
      LearnerGroupSyllabusBackendApiService
  ) {}

  ngOnInit(): void {
    this.learnerGroupId = this.contextService.getLearnerGroupId();
    this.activeTab = this.VIEW_LEARNER_GROUP_TABS_I18N_IDS.OVERVIEW;
    if (this.learnerGroupId) {
      this.loaderService.showLoadingScreen('Loading');
      this.learnerGroupBackendApiService.fetchLearnerGroupInfoAsync(
        this.learnerGroupId
      ).then(learnerGroupInfo => {
        this.learnerGroup = learnerGroupInfo;
        this.learnerGroupBackendApiService
          .fetchProgressSharingPermissionOfLearnerAsync(this.learnerGroup.id)
          .then(progressSharingPermission => {
            this.progressSharingPermission = progressSharingPermission;
          });
        this.userService.getUserInfoAsync().then(userInfo => {
          this.username = userInfo.getUsername();
        });
        this.learnerGroupSyllabusBackendApiService
          .fetchLearnerSpecificProgressInAssignedSyllabus(
            this.learnerGroupId
          ).then(learnerProgress => {
            this.learnerProgress = learnerProgress;
            this.loaderService.hideLoadingScreen();
          });
      });
    }
  }

  setActiveTab(newActiveTab: string): void {
    this.activeTab = newActiveTab;
  }

  isTabActive(tabName: string): boolean {
    return this.activeTab === tabName;
  }

  getLearnersCount(): number {
    return this.learnerGroup.learnerUsernames.length;
  }

  getCompletedStoriesCountByLearner(): number {
    let completedStoriesCount = 0;
    this.learnerProgress.storiesProgress.forEach(storyProgress => {
      if (
        storyProgress.getCompletedNodeTitles().length ===
        storyProgress.getNodeTitles().length
      ) {
        completedStoriesCount += 1;
      }
    });
    return completedStoriesCount;
  }

  getMasteredSubtopicsCountOfLearner(): number {
    let masteredSubtopicsCount = 0;
    this.learnerProgress.subtopicsProgress.forEach(subtopicProgress => {
      if (subtopicProgress.subtopicMastery &&
        subtopicProgress.subtopicMastery >= 0.9
      ) {
        masteredSubtopicsCount += 1;
      }
    });
    return masteredSubtopicsCount;
  }

  exitLearnerGroup(): void {
    let modalRef = this.ngbModal.open(
      ExitLearnerGroupModalComponent,
      {
        backdrop: 'static',
        windowClass: 'exit-learner-group-modal'
      }
    );
    modalRef.componentInstance.learnerGroupTitle = this.learnerGroup.title;

    modalRef.result.then(() => {
      if (this.username) {
        this.loaderService.showLoadingScreen('Exiting Group');
        this.learnerGroupBackendApiService.exitLearnerGroupAsync(
          this.learnerGroup.id, this.username
        ).then(() => {
          this.windowRef.nativeWindow.location.href = (
            '/learner-dashboard?active_tab=learner-groups');
        });
      }
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  viewLearnerGroupPreferences(): void {
    let modalRef = this.ngbModal.open(
      LearnerGroupPreferencesModalComponent,
      {
        backdrop: 'static',
        windowClass: 'learner-group-preferences-modal'
      }
    );
    modalRef.componentInstance.learnerGroup = this.learnerGroup;
    modalRef.componentInstance.progressSharingPermission = (
      this.progressSharingPermission);

    modalRef.result.then((data) => {
      this.learnerGroupBackendApiService
        .updateProgressSharingPermissionAsync(
          this.learnerGroup.id, data.progressSharingPermission
        ).then((updatedProgressSharingPermission) => {
          this.progressSharingPermission = updatedProgressSharingPermission;
        });
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }
}

angular.module('oppia').directive(
  'oppiaViewLearnerGroupPage',
  downgradeComponent({component: ViewLearnerGroupPageComponent}));
