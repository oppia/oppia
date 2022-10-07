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

import { Component, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { LoaderService } from 'services/loader.service';
import { PageTitleService } from 'services/page-title.service';
import { LearnerGroupPagesConstants } from '../learner-group-pages.constants';
import { LearnerGroupData } from 'domain/learner_group/learner-group.model';
import { LearnerGroupBackendApiService } from
  'domain/learner_group/learner-group-backend-api.service';
import { ContextService } from 'services/context.service';
import { ShortLearnerGroupSummary } from 'domain/learner_group/short-learner-group-summary.model';
import { LearnerGroupSyllabusBackendApiService } from 'domain/learner_group/learner-group-syllabus-backend-api.service';


import './view-learner-group-page.component.css';
import { UserService } from 'services/user.service';
import { LearnerGroupUserProgress } from 'domain/learner_group/learner-group-user-progress.model';
import { StoryViewerBackendApiService } from 'domain/story_viewer/story-viewer-backend-api.service';
import { ChapterProgressSummary } from 'domain/exploration/chapter-progress-summary.model';

@Component({
  selector: 'oppia-view-learner-group-page',
  templateUrl: './view-learner-group-page.component.html'
})
export class ViewLearnerGroupPageComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();
  VIEW_LEARNER_GROUP_TABS_I18N_IDS = (
    LearnerGroupPagesConstants.VIEW_LEARNER_GROUP_TABS);

  activeTab!: string;
  learnerGroupId!: string;
  learnerGroup!: LearnerGroupData;
  username!: string;
  learnerProgress!: LearnerGroupUserProgress;
  storiesChaptersProgress: ChapterProgressSummary[] = [];

  constructor(
    private loaderService: LoaderService,
    private pageTitleService: PageTitleService,
    private translateService: TranslateService,
    private learnerGroupBackendApiService: LearnerGroupBackendApiService,
    private contextService: ContextService,
    private userService: UserService,
    private storyViewerBackendApiService: StoryViewerBackendApiService,
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
        let userInfoPromise = this.userService.getUserInfoAsync();
        userInfoPromise.then(userInfo => {
          this.username = userInfo.getUsername();
          this.learnerGroupSyllabusBackendApiService
            .fetchLearnerSpecificProgressInAssignedSyllabus(
              this.learnerGroupId
            ).then(learnerProgress => {
              console.log(learnerProgress, 'shahjshjsa');
              this.learnerProgress = learnerProgress;
            });
          this.storyViewerBackendApiService.fetchProgressInStoriesChapters(
              this.username, this.learnerGroup.storyIds
            ).then(storiesChaptersProgress => {
              this.storiesChaptersProgress = storiesChaptersProgress;
            });
        });
        this.loaderService.hideLoadingScreen();
      });
    }
    this.subscribeToOnLangChange();
  }

  subscribeToOnLangChange(): void {
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPageTitle();
      })
    );
  }

  setPageTitle(): void {
    let translatedTitle = this.translateService.instant(
      'I18N_LEARNER_GROUP_PAGE_TITLE');
    this.pageTitleService.setDocumentTitle(translatedTitle);
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

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive(
  'oppiaViewLearnerGroupPage',
  downgradeComponent({component: ViewLearnerGroupPageComponent}));
