// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the feedback Updates page.
 */

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { WindowRef } from 'services/contextual/window-ref.service';
import './contributor-admin-dashboard-page.component.css';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ContributorDashboardAdminStatsBackendApiService } from './services/contributor-dashboard-admin-stats-backend-api.service';
import { UserService } from 'services/user.service';

@Component({
  selector: 'contributor-admin-dashboard-page',
  styleUrls: ['./contributor-admin-dashboard-page.component.css'],
  templateUrl: './contributor-admin-dashboard-page.component.html',
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ContributorAdminDashboardPageComponent implements OnInit {
  activeTab!: string;
  TAB_NAME_TRANSLATION_SUBMITTER: string = 'Translation Submitter';
  TAB_NAME_TRANSLATION_REVIEWER: string = 'Translation Reviewer';
  TAB_NAME_QUESTION_SUBMITTER: string = 'Question Submitter';
  TAB_NAME_QUESTION_REVIEWER: string = 'Question Reviewer';
  translationReviewersCount: number = 0;
  questionReviewersCount: number = 0;
  CONTRIBUTION_TYPES!: string[];
  selectedContributionType!: string;
  isQuestionCoordinator!: boolean;
  isTranslationCoordinator!: boolean;

  constructor(
    private windowRef: WindowRef,
    private changeDetectorRef: ChangeDetectorRef,
    private contributorDashboardAdminStatsBackendApiService:
      ContributorDashboardAdminStatsBackendApiService,
    private userService: UserService,
  ) {}

  setActiveTab(tabName: string): void {
    this.activeTab = tabName;
    this.changeDetectorRef.detectChanges();
  }

  checkMobileView(): boolean {
    return (this.windowRef.nativeWindow.innerWidth < 800);
  }

  updateSelectedContributionType(selectedContributionType: string): void {
    this.selectedContributionType = selectedContributionType;
    this.setActiveTab(selectedContributionType);
  }

  ngOnInit(): void {
    this.userService.getUserInfoAsync().then(userInfo => {
      const username = userInfo.getUsername();
      if (username === null) {
        return;
      }
      this.isQuestionCoordinator = userInfo.isQuestionCoordinator();
      this.isTranslationCoordinator = userInfo.isTranslationCoordinator();

      if (this.isTranslationCoordinator) {
        this.CONTRIBUTION_TYPES = [this.TAB_NAME_TRANSLATION_SUBMITTER,
          this.TAB_NAME_TRANSLATION_REVIEWER];
      }
      if (this.isQuestionCoordinator) {
        this.CONTRIBUTION_TYPES = [this.TAB_NAME_QUESTION_SUBMITTER,
          this.TAB_NAME_QUESTION_REVIEWER];
      }
      if (this.isQuestionCoordinator && this.isTranslationCoordinator) {
        this.CONTRIBUTION_TYPES = [this.TAB_NAME_TRANSLATION_SUBMITTER,
          this.TAB_NAME_TRANSLATION_REVIEWER,
          this.TAB_NAME_QUESTION_SUBMITTER,
          this.TAB_NAME_QUESTION_REVIEWER];
      }

      this.updateSelectedContributionType(this.CONTRIBUTION_TYPES[0]);
      this.changeDetectorRef.detectChanges();
    });

    this.contributorDashboardAdminStatsBackendApiService
      .fetchCommunityStats().then(
        (response) => {
          this.translationReviewersCount = response.translation_reviewers_count;
          this.questionReviewersCount = response.question_reviewers_count;
        });
  }
}

angular.module('oppia').directive('contributorAdminDashboardPage',
  downgradeComponent({
    component: ContributorAdminDashboardPageComponent
  }) as angular.IDirectiveFactory);
