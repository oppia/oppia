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

import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { WindowRef } from 'services/contextual/window-ref.service';
import { EmailDashboardResultBackendApiService } from './email-dashboard-result-backend-api.service';

export interface EmailData {
  'email_subject': string;
  'email_body': string;
  'email_intent': string;
  'max_recipients': number;
}

@Component({
  selector: 'oppia-email-dashboard-result',
  templateUrl: './email-dashboard-result.component.html'
})
export class EmailDashboardResultComponent {
  EMAIL_DASHBOARD_PAGE = '/emaildashboard';
  emailBody: string = '';
  invalid = {
    subject: false,
    body: false,
    maxRecipients: false
  };

  emailSubject: string = '';
  maxRecipients!: number;
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
    private emailDashboardResultBackendApiService:
    EmailDashboardResultBackendApiService,
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
    let dataIsValid = this.validateEmailSubjectAndBody();

    if (this.emailOption === 'custom' &&
      this.maxRecipients === 0) {
      this.invalid.maxRecipients = true;
      dataIsValid = false;
    }

    if (dataIsValid) {
      this.submitIsInProgress = true;
      let data: EmailData = {
        email_subject: this.emailSubject,
        email_body: this.emailBody,
        email_intent: this.emailIntent,
        max_recipients: (
          this.emailOption !== 'all' ? this.maxRecipients : 0)
      };

      this.emailDashboardResultBackendApiService.submitEmailAsync(
        data, this.getQueryId()).then(() => {
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

    this.emailDashboardResultBackendApiService.cancelEmailAsync(
      this.getQueryId()).then(() => {
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
    let dataIsValid = this.validateEmailSubjectAndBody();

    if (dataIsValid) {
      this.emailDashboardResultBackendApiService.sendTestEmailAsync(
        this.emailSubject, this.emailBody, this.getQueryId()).then(() => {
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
