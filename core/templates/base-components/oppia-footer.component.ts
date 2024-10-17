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

import {Component, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {downgradeComponent} from '@angular/upgrade/static';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {Subject} from 'rxjs';
import {debounceTime, switchMap, takeUntil} from 'rxjs/operators';
import {AppConstants} from 'app.constants';
import {NavbarAndFooterGATrackingPages} from 'app.constants';
import {AlertsService} from 'services/alerts.service';
import {ThanksForSubscribingModalComponent} from './thanks-for-subscribing-modal.component';
import {MailingListBackendApiService} from 'domain/mailing-list/mailing-list-backend-api.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';

import './oppia-footer.component.css';

@Component({
  selector: 'oppia-footer',
  templateUrl: './oppia-footer.component.html',
  styleUrls: ['./oppia-footer.component.css'],
})
export class OppiaFooterComponent implements OnDestroy {
  emailAddress: string | null = null;
  name: string | null = null;
  siteFeedbackFormUrl: string = AppConstants.SITE_FEEDBACK_FORM_URL;
  currentYear: number = new Date().getFullYear();
  PAGES_REGISTERED_WITH_FRONTEND = AppConstants.PAGES_REGISTERED_WITH_FRONTEND;
  BRANCH_NAME = AppConstants.BRANCH_NAME;
  SHORT_COMMIT_HASH = AppConstants.SHORT_COMMIT_HASH;

  private emailSubscriptionDebounce: Subject<void> = new Subject();
  private componentIsBeingDestroyed$: Subject<void> = new Subject();

  versionInformationIsShown: boolean =
    this.router.url === '/about' && !AppConstants.DEV_MODE;

  subscriptionIsInProgress: boolean = false;
  subscriptionState: 'subscribe' | 'subscribing' | 'subscribed' = 'subscribe';
  debounceTimeoutDuration: number = 1500;

  constructor(
    private alertsService: AlertsService,
    private ngbModal: NgbModal,
    private mailingListBackendApiService: MailingListBackendApiService,
    private router: Router,
    private windowRef: WindowRef,
    private siteAnalyticsService: SiteAnalyticsService
  ) {
    this.emailSubscriptionDebounce
      .pipe(
        debounceTime(this.debounceTimeoutDuration),
        switchMap(() => this.performMailingListSubscription()),
        takeUntil(this.componentIsBeingDestroyed$)
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.componentIsBeingDestroyed$.next();
    this.componentIsBeingDestroyed$.complete();
  }

  getOppiaBlogUrl(): string {
    return '/blog';
  }

  validateEmailAddress(): boolean {
    const regex = new RegExp(AppConstants.EMAIL_REGEX);
    return regex.test(String(this.emailAddress));
  }

  onSubscribeButtonClicked(): void {
    if (this.subscriptionIsInProgress || !this.validateEmailAddress()) {
      return;
    }
    this.subscriptionIsInProgress = true;
    this.subscriptionState = 'subscribing';
    this.emailSubscriptionDebounce.next();
  }

  private performMailingListSubscription(): Promise<void> {
    const userName = this.name ? String(this.name) : null;
    return this.mailingListBackendApiService
      .subscribeUserToMailingList(
        String(this.emailAddress),
        userName,
        AppConstants.MAILING_LIST_WEB_TAG
      )
      .then(status => {
        if (status) {
          this.subscriptionState = 'subscribed';
          this.alertsService.addInfoMessage('Done!', 1000);
          this.ngbModal.open(ThanksForSubscribingModalComponent, {
            backdrop: 'static',
            size: 'xl',
          });
        } else {
          this.subscriptionState = 'subscribe';
          this.alertsService.addInfoMessage(
            AppConstants.MAILING_LIST_UNEXPECTED_ERROR_MESSAGE,
            1000
          );
        }
      })
      .catch(() => {
        this.subscriptionState = 'subscribe';
        this.alertsService.addInfoMessage(
          AppConstants.MAILING_LIST_UNEXPECTED_ERROR_MESSAGE,
          10000
        );
      })
      .finally(() => {
        this.subscriptionIsInProgress = false;
      });
  }

  navigateToAboutPage(): void {
    this.siteAnalyticsService.registerClickFooterButtonEvent(
      NavbarAndFooterGATrackingPages.ABOUT
    );
    this.windowRef.nativeWindow.location.href = '/about';
  }

  navigateToTeachPage(): void {
    this.siteAnalyticsService.registerClickFooterButtonEvent(
      NavbarAndFooterGATrackingPages.TEACH
    );
    this.windowRef.nativeWindow.location.href = '/teach';
  }
}

angular.module('oppia').directive(
  'oppiaFooter',
  downgradeComponent({
    component: OppiaFooterComponent,
  }) as angular.IDirectiveFactory
);
