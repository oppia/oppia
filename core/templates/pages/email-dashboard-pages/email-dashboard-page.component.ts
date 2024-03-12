// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for oppia email dashboard page.
 */

import {ChangeDetectorRef, Component} from '@angular/core';
import {AppConstants} from 'app.constants';
import {QueryData} from 'domain/email-dashboard/email-dashboard-backend-api.service';
import {EmailDashboardQuery} from 'domain/email-dashboard/email-dashboard-query.model';
import {LoaderService} from 'services/loader.service';
import {UserService} from 'services/user.service';
import {EmailDashboardDataService} from './email-dashboard-data.service';

@Component({
  selector: 'oppia-email-dashboard-page',
  templateUrl: './email-dashboard-page.component.html',
})
export class EmailDashboardPageComponent {
  data!: QueryData;
  currentPageOfQueries!: EmailDashboardQuery[];
  showSuccessMessage: boolean = false;
  username!: string | null;
  customizationArgSpecs = AppConstants.EMAIL_DASHBOARD_PREDICATE_DEFINITION;
  isRequired: boolean = false;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private emailDashboardDataService: EmailDashboardDataService,
    private loaderService: LoaderService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.currentPageOfQueries = [];
    this.username = '';

    this.loaderService.showLoadingScreen('Loading');
    this.resetForm();

    this.userService.getUserInfoAsync().then(userInfo => {
      this.username = userInfo.getUsername();
      this.loaderService.hideLoadingScreen();
    });

    this.emailDashboardDataService.getNextQueriesAsync().then(queries => {
      this.currentPageOfQueries = queries;
    });
  }

  updateQueryData(newValue: boolean | number, field: string): void {
    if (this.data[field] !== newValue) {
      this.data[field] = newValue;
      this.changeDetectorRef.detectChanges();
    }
  }

  resetForm(): void {
    this.data = {};
    AppConstants.EMAIL_DASHBOARD_PREDICATE_DEFINITION.forEach(predicate => {
      this.data[predicate.backend_attr] = predicate.default_value;
    });
  }

  areAllInputsEmpty(): boolean {
    return Object.values(this.data).every(
      value => value === null || value === false
    );
  }

  submitQueryAsync(): void {
    this.emailDashboardDataService.submitQueryAsync(this.data).then(queries => {
      this.currentPageOfQueries = queries;
    });
    this.resetForm();
    this.showSuccessMessage = true;
  }

  getNextPageOfQueries(): void {
    if (this.emailDashboardDataService.isNextPageAvailable()) {
      this.emailDashboardDataService.getNextQueriesAsync().then(queries => {
        this.currentPageOfQueries = queries;
      });
    }
  }

  getPreviousPageOfQueries(): void {
    if (this.emailDashboardDataService.isPreviousPageAvailable()) {
      this.currentPageOfQueries =
        this.emailDashboardDataService.getPreviousQueries();
    }
  }

  showNextButton(): boolean {
    return this.emailDashboardDataService.isNextPageAvailable();
  }

  showPreviousButton(): boolean {
    return this.emailDashboardDataService.isPreviousPageAvailable();
  }

  recheckStatus(index: number): void {
    let query =
      this.currentPageOfQueries !== undefined
        ? this.currentPageOfQueries[index]
        : null;
    if (query) {
      let queryId = query.id;
      this.emailDashboardDataService.fetchQueryAsync(queryId).then(query => {
        this.currentPageOfQueries[index] = query;
      });
    }
  }

  showLinkToResultPage(submitter: string, status: string): boolean {
    return submitter === this.username && status === 'completed';
  }
}
