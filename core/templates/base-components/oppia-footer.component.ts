// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the footer.
 */

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { downgradeComponent } from '@angular/upgrade/static';
import { PlatformFeatureService } from 'services/platform-feature.service';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AppConstants } from 'app.constants';
import { AlertsService } from 'services/alerts.service';
import { ThanksForSubscribingModalComponent } from './thanks-for-subscribing-modal.component';
import { MailingListBackendApiService } from 'domain/mailing-list/mailing-list-backend-api.service';

import './oppia-footer.component.css';


@Component({
  selector: 'oppia-footer',
  templateUrl: './oppia-footer.component.html',
  styleUrls: ['./oppia-footer.component.css']
})
export class OppiaFooterComponent {
  emailAddress: string | null = null;
  name: string | null = null;
  siteFeedbackFormUrl: string = AppConstants.SITE_FEEDBACK_FORM_URL;
  currentYear: number = new Date().getFullYear();
  PAGES_REGISTERED_WITH_FRONTEND = (
    AppConstants.PAGES_REGISTERED_WITH_FRONTEND);

  BRANCH_NAME = AppConstants.BRANCH_NAME;

  SHORT_COMMIT_HASH = AppConstants.SHORT_COMMIT_HASH;

  versionInformationIsShown: boolean = (
    this.router.url === '/about' && !AppConstants.DEV_MODE);

  constructor(
    private alertsService: AlertsService,
    private ngbModal: NgbModal,
    private mailingListBackendApiService: MailingListBackendApiService,
    private platformFeatureService: PlatformFeatureService,
    private router: Router
  ) {}

  getOppiaBlogUrl(): string {
    return '/blog';
  }

  validateEmailAddress(): boolean {
    let regex = new RegExp(AppConstants.EMAIL_REGEX);
    return regex.test(String(this.emailAddress));
  }

  subscribeToMailingList(): void {
    // Convert null or empty string to null for consistency.
    const userName = this.name ? String(this.name) : null;
    this.mailingListBackendApiService.subscribeUserToMailingList(
      String(this.emailAddress),
      userName,
      AppConstants.MAILING_LIST_WEB_TAG
    ).then((status) => {
      if (status) {
        this.alertsService.addInfoMessage('Done!', 1000);
        this.ngbModal.open(
          ThanksForSubscribingModalComponent,
          {
            backdrop: 'static',
            size: 'xl'
          }
        );
      } else {
        this.alertsService.addInfoMessage(
          AppConstants.MAILING_LIST_UNEXPECTED_ERROR_MESSAGE, 10000);
      }
    }).catch(errorResponse => {
      this.alertsService.addInfoMessage(
        AppConstants.MAILING_LIST_UNEXPECTED_ERROR_MESSAGE, 10000);
    });
  }
}

angular.module('oppia').directive('oppiaFooter',
  downgradeComponent({
    component: OppiaFooterComponent
  }) as angular.IDirectiveFactory);
