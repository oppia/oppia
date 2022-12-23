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
 * @fileoverview Component for the facilitator dashboard page.
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { LoaderService } from 'services/loader.service';
import { PageTitleService } from 'services/page-title.service';
import { LearnerGroupPagesConstants } from
  'pages/learner-group-pages/learner-group-pages.constants';
import { ShortLearnerGroupSummary } from
  'domain/learner_group/short-learner-group-summary.model';
import { FacilitatorDashboardBackendApiService } from
  'domain/learner_group/facilitator-dashboard-backend-api.service';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

import './facilitator-dashboard-page.component.css';


@Component({
  selector: 'oppia-facilitator-dashboard-page',
  templateUrl: './facilitator-dashboard-page.component.html',
  styleUrls: ['./facilitator-dashboard-page.component.css']
})
export class FacilitatorDashboardPageComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();
  createLearnerGroupPageUrl: string = '';
  shortLearnerGroupSummaries: ShortLearnerGroupSummary[] = [];

  constructor(
    private pageTitleService: PageTitleService,
    private translateService: TranslateService,
    private facilitatorDashboardBackendApiService:
      FacilitatorDashboardBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
    private loaderService: LoaderService
  ) {}

  subscribeToOnLangChange(): void {
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPageTitle();
      })
    );
  }

  setPageTitle(): void {
    let translatedTitle = this.translateService.instant(
      'I18N_FACILITATOR_DASHBOARD_PAGE_TITLE');
    this.pageTitleService.setDocumentTitle(translatedTitle);
  }

  getLearnerGroupPageUrl(learnerGroupId: string): string {
    return (
      this.urlInterpolationService.interpolateUrl(
        '/edit-learner-group/<groupId>', {
          groupId: learnerGroupId
        }
      )
    );
  }

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading your learner groups');
    this.createLearnerGroupPageUrl = (
      LearnerGroupPagesConstants.CREATE_LEARNER_GROUP_PAGE_URL
    );
    this.facilitatorDashboardBackendApiService
      .fetchTeacherDashboardLearnerGroupsAsync().then(
        (shortGroupSummaries) => {
          this.shortLearnerGroupSummaries = shortGroupSummaries;
          this.loaderService.hideLoadingScreen();
        }
      );
    this.subscribeToOnLangChange();
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive(
  'oppiaFacilitatorDashboardPage',
  downgradeComponent({component: FacilitatorDashboardPageComponent}));
