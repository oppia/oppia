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

import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { WindowRef } from 'services/contextual/window-ref.service';

@Component({
  selector: 'oppia-email-dashboard-result',
  templateUrl: './email-dashboard-result.component.html'
})
export class EmailDashboardResultComponent {
  RESULT_HANDLER_URL = '/emaildashboardresult/<query_id>';
  CANCEL_EMAIL_HANDLER_URL = '/emaildashboardcancelresult/<query_id>';
  EMAIL_DASHBOARD_PAGE = '/emaildashboard';
  TEST_BULK_EMAIL_URL = '/emaildashboardtestbulkemailhandler/<query_id>';
  emailBody: string = '';
  invalid = {
    subject: false,
    body: false,
    maxRecipients: false
  };
  emailSubject: string = '';
  maxRecipients: number;
  emailOption: string = 'all';
  submitIsInProgress: boolean = false;
  POSSIBLE_EMAIL_INTENTS = [
    'bulk_email_marketing', 'bulk_email_improve_exploration',
    'bulk_email_create_exploration',
    'bulk_email_creator_reengagement',
    'bulk_email_learner_reengagement'];
  emailIntent = this.POSSIBLE_EMAIL_INTENTS[0];
  emailSubmitted: boolean = false;
  errorHasOccurred: boolean = false;
  emailCancelled: boolean = false;
  testEmailSentSuccesfully: boolean = false;

  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef,
  ) {}

  getQueryId(): string {
    return (
      this.windowRef.nativeWindow.location.pathname.split('/').slice(-1)[0]);
  }

  validateEmailSubjectAndBody(): boolean {
    let dataIsValid = true;
    if (this.emailSubject.length === 0) {
      this.invalid.subject = true;
      dataIsValid = false;
    }
    if (this.emailBody.length === 0) {
      this.invalid.body = true;
      dataIsValid = false;
    }
    return dataIsValid;
  }

  submitEmail(): void {
    let resultHandlerUrl = this.urlInterpolationService.interpolateUrl(
      this.RESULT_HANDLER_URL, {
        query_id: this.getQueryId()
      });
    let dataIsValid = this.validateEmailSubjectAndBody();

    if (this.emailOption === 'custom' &&
      this.maxRecipients === null) {
      this.invalid.maxRecipients = true;
      dataIsValid = false;
    }

    if (dataIsValid) {
      this.submitIsInProgress = true;
      let data = {
        email_subject: this.emailSubject,
        email_body: this.emailBody,
        email_intent: this.emailIntent,
        max_recipients: (
          this.emailOption !== 'all' ? this.maxRecipients : null)
      };

      this.http.post(resultHandlerUrl, {
        data: data
      }).toPromise().then(() => {
        this.emailSubmitted = true;
        setTimeout(() => {
          this.windowRef.nativeWindow.location.href = this.EMAIL_DASHBOARD_PAGE;
        }, 4000);
      }, () => {
        this.errorHasOccurred = true;
        this.submitIsInProgress = false;
      });
      this.invalid.subject = false;
      this.invalid.body = false;
      this.invalid.maxRecipients = false;
    }
  }

  resetForm(): void {
    this.emailSubject = '';
    this.emailBody = '';
    this.emailOption = 'all';
  }

  cancelEmail(): void {
    this.submitIsInProgress = true;
    let cancelUrlHandler = this.urlInterpolationService.interpolateUrl(
      this.CANCEL_EMAIL_HANDLER_URL, {
        query_id: this.getQueryId()
      });

    this.http.post(cancelUrlHandler, {}).toPromise().then(() => {
      this.emailCancelled = true;
      setTimeout(() => {
        this.windowRef.nativeWindow.location.href = this.EMAIL_DASHBOARD_PAGE;
      }, 4000);
    }, () => {
      this.errorHasOccurred = true;
      this.submitIsInProgress = false;
    });
  }

  sendTestEmail(): void {
    let testEmailHandlerUrl = this.urlInterpolationService.interpolateUrl(
      this.TEST_BULK_EMAIL_URL, {
        query_id: this.getQueryId()
      });
    let dataIsValid = this.validateEmailSubjectAndBody();

    if (dataIsValid) {
      this.http.post(testEmailHandlerUrl, {
        email_subject: this.emailSubject,
        email_body: this.emailBody
      }).toPromise().then(() => {
        this.testEmailSentSuccesfully = true;
      });
      this.invalid.subject = false;
      this.invalid.body = false;
      this.invalid.maxRecipients = false;
    }
  }
}

angular.module('oppia').directive('oppiaEmailDashboardResultPage',
  downgradeComponent({
    component: EmailDashboardResultComponent
  }));
