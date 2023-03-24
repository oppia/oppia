// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the Oppia 'feedback-Updates' page.
 */

import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { TranslateService } from '@ngx-translate/core';
import { AppConstants } from 'app.constants';
import { FeedbackThreadSummary, FeedbackThreadSummaryBackendDict } from 'domain/feedback_thread/feedback-thread-summary.model';
import { LearnerDashboardBackendApiService } from 'domain/learner_dashboard/learner-dashboard-backend-api.service';
import { LearnerGroupBackendApiService } from 'domain/learner_group/learner-group-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { LearnerDashboardPageConstants } from 'pages/learner-dashboard-page/learner-dashboard-page.constants';
import { AlertsService } from 'services/alerts.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { LoaderService } from 'services/loader.service';
import { PageTitleService } from 'services/page-title.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { UserService } from 'services/user.service';
require('cropperjs/dist/cropper.min.css');

import './feedback-updates-page.component.css';


@Component({
  selector: 'oppia-feedback-updates-page',
  templateUrl: './feedback-updates-page.component.html',
  styleUrls: ['./feedback-updates-page.component.css']
})
export class FeedbackUpdatesPageComponent{

  FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS = (
    LearnerDashboardPageConstants.FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS);
  PAGES_REGISTERED_WITH_FRONTEND = (
    AppConstants.PAGES_REGISTERED_WITH_FRONTEND);
  
  isCurrentFeedbackSortDescending!: boolean;
  currentFeedbackThreadsSortType!: string;  
  feedbackThreadActive!: boolean;
  loadingIndicatorIsShown: boolean;
  paginatedThreadsList: FeedbackThreadSummaryBackendDict[][] = [];
  threadSummaries: FeedbackThreadSummary[] = [];
  numberOfUnreadThreads!: number;
    
  constructor(
    private alertsService: AlertsService,
    private windowDimensionService: WindowDimensionsService,
    private focusManagerService: FocusManagerService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private learnerDashboardBackendApiService:
      LearnerDashboardBackendApiService,
    private loaderService: LoaderService,
    private urlInterpolationService: UrlInterpolationService,
    private userService: UserService,
    private translateService: TranslateService,
    private pageTitleService: PageTitleService,
    private learnerGroupBackendApiService: LearnerGroupBackendApiService,
    private urlService: UrlService
  ) {}

  ngOnInit(): void {
    this.loadingIndicatorIsShown = true;
    let dashboardFeedbackUpdatesDataPromise = (
      this.learnerDashboardBackendApiService
        .fetchLearnerDashboardFeedbackUpdatesDataAsync(
          this.paginatedThreadsList));
    dashboardFeedbackUpdatesDataPromise.then(
      responseData => {
        console.log(responseData,"jai bhole");
        this.isCurrentFeedbackSortDescending = true;
        this.currentFeedbackThreadsSortType = (
          LearnerDashboardPageConstants
            .FEEDBACK_THREADS_SORT_BY_KEYS_AND_I18N_IDS.LAST_UPDATED.key);
        this.threadSummaries = [
          ... this.threadSummaries,
          ... responseData.threadSummaries];
        this.paginatedThreadsList = responseData.paginatedThreadsList;
        this.numberOfUnreadThreads =
          responseData.numberOfUnreadThreads;
        this.feedbackThreadActive = false;
        this.loadingIndicatorIsShown = false;
      }, errorResponseStatus => {
        this.loadingIndicatorIsShown = false;
        if (
          AppConstants.FATAL_ERROR_CODES.indexOf(errorResponseStatus) !== -1) {
          this.alertsService.addWarning(
            'Failed to get learner dashboard feedback updates data');
        }
      }
    );
  }


}

angular.module('oppia').directive('oppiaPreferencesPage',
  downgradeComponent({
    component: FeedbackUpdatesPageComponent
  }) as angular.IDirectiveFactory);