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
 * @fileoverview Component for the edit learner group page.
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { LoaderService } from 'services/loader.service';
import { PageTitleService } from 'services/page-title.service';
import { LearnerGroupPagesConstants } from '../learner-group-pages.constants';
import { LearnerGroupData } from 'domain/learner_group/learner-group.model';
import { LearnerGroupBackendApiService } from
  'domain/learner_group/learner-group-backend-api.service';
import { ContextService } from 'services/context.service';

import './edit-learner-group-page.component.css';


@Component({
  selector: 'oppia-edit-learner-group-page',
  templateUrl: './edit-learner-group-page.component.html',
  styleUrls: ['./edit-learner-group-page.component.css']
})
export class EditLearnerGroupPageComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();
  EDIT_LEARNER_GROUP_TABS_I18N_IDS = (
    LearnerGroupPagesConstants.EDIT_LEARNER_GROUP_TABS);

  activeTab!: string;
  learnerGroupId!: string;
  learnerGroup!: LearnerGroupData;

  constructor(
    private loaderService: LoaderService,
    private pageTitleService: PageTitleService,
    private translateService: TranslateService,
    private learnerGroupBackendApiService: LearnerGroupBackendApiService,
    private contextService: ContextService
  ) {}

  ngOnInit(): void {
    this.learnerGroupId = this.contextService.getLearnerGroupId();
    this.activeTab = this.EDIT_LEARNER_GROUP_TABS_I18N_IDS.OVERVIEW;
    if (this.learnerGroupId) {
      this.loaderService.showLoadingScreen('Loading');
      this.learnerGroupBackendApiService.fetchLearnerGroupInfoAsync(
        this.learnerGroupId
      ).then(learnerGroup => {
        this.learnerGroup = learnerGroup;
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
      'I18N_EDIT_LEARNER_GROUP_PAGE_TITLE');
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
