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

import { Component, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { ContextService } from 'services/context.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { LoaderService } from 'services/loader.service';
import { PageTitleService } from 'services/page-title.service';
import { LearnerGroupPagesConstants } from
  'pages/learner-group-pages/learner-group-pages.constants';
import { ShortLearnerGroupSummary } from 'domain/learner_group/short-learner-group-summary.model';
import { FacilitatorDashboardBackendApiService } from 'domain/learner_group/facilitator-dashboard-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';

@Component({
  selector: 'oppia-facilitator-dashboard-page',
  templateUrl: './facilitator-dashboard-page.component.html',
  styleUrls: []
})
export class FacilitatorDashboardPageComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();
  createLearnerGroupPageUrl: string;
  shortLearnerGroupSummaries: ShortLearnerGroupSummary[];

  constructor(
    private contextService: ContextService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private pageTitleService: PageTitleService,
    private windowDimensionsService: WindowDimensionsService,
    private translateService: TranslateService,
    private facilitatorDashboardBackendApiService:
      FacilitatorDashboardBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
    private loaderService: LoaderService
  ) {}

  checkMobileView(): boolean {
    return (this.windowDimensionsService.getWidth() < 500);
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
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
      'I18N_TOPNAV_FACILITATOR_DASHBOARD');
    this.pageTitleService.setDocumentTitle(translatedTitle);
  }

  learnerGroupPageUrl(learnerGroupId: string): string {
    return (
      this.urlInterpolationService.interpolateUrl(
        '/create/learner-groups/<groupId>', {
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
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
    this.contextService.removeCustomEntityContext();
  }
}

angular.module('oppia').directive(
  'oppiaFacilitatorDashboardPage',
  downgradeComponent({component: FacilitatorDashboardPageComponent}));
