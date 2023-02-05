// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the Android page.
 */

import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AlertsService } from 'services/alerts.service';

import { PageTitleService } from 'services/page-title.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { animate, keyframes, style, transition, trigger } from '@angular/animations';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { AppConstants } from 'app.constants';
import { MailingListBackendApiService } from 'domain/mailing-list/mailing-list-backend-api.service';

import './android-page.component.css';

@Component({
  selector: 'android-page',
  templateUrl: './android-page.component.html',
  styleUrls: ['./android-page.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('1s ease', keyframes([
          style({ opacity: 0 }),
          style({ opacity: 1 })
        ]))
      ])
    ]),
    trigger('delayedFadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('1s 1s ease', keyframes([
          style({ opacity: 0 }),
          style({ opacity: 1 })
        ]))
      ])
    ])
  ]
})
export class AndroidPageComponent implements OnInit, OnDestroy {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @ViewChild('androidUpdatesSection') androidUpdatesSectionRef!: (
    ElementRef<Element>);

  @ViewChild('featuresMainText') featuresMainTextRef!: ElementRef<Element>;

  @ViewChild('feature1') featureRef1!: ElementRef<Element>;

  @ViewChild('feature2') featureRef2!: ElementRef<Element>;

  @ViewChild('feature3') featureRef3!: ElementRef<Element>;

  @ViewChild('feature4') featureRef4!: ElementRef<Element>;

  featuresShown = 0;
  androidUpdatesSectionIsSeen = false;
  featuresMainTextIsSeen = false;
  emailAddress: string | null = null;
  name: string | null = null;
  userCanSubscribe: boolean = false;
  userHasSubscribed: boolean = false;

  OPPIA_AVATAR_IMAGE_URL = (
    this.urlInterpolationService
      .getStaticImageUrl('/avatar/oppia_avatar_large_100px.svg'));

  ANDROID_APP_URL = (
    'https://play.google.com/store/apps/details?id=org.oppia.android'
  );

  directiveSubscriptions = new Subscription();
  constructor(
    private alertsService: AlertsService,
    private mailingListBackendApiService: MailingListBackendApiService,
    private pageTitleService: PageTitleService,
    private translateService: TranslateService,
    private urlInterpolationService: UrlInterpolationService,
    private windowDimensionsService: WindowDimensionsService
  ) {}

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPageTitle();
      })
    );
    this.featuresShown = 0;
  }

  ngAfterViewInit(): void {
    this.setPageTitle();
  }

  changeFeaturesShown(featureNumber: number): void {
    this.featuresShown = featureNumber;
  }

  validateEmailAddress(): boolean {
    // A simple check for basic email validation.
    let regex = new RegExp(AppConstants.EMAIL_REGEX);
    return regex.test(String(this.emailAddress));
  }

  subscribeToAndroidList(): void {
    this.mailingListBackendApiService.subscribeUserToMailingList(
      String(this.emailAddress),
      String(this.name),
      AppConstants.MAILING_LIST_ANDROID_TAG
    ).then((status) => {
      if (status) {
        this.userHasSubscribed = true;
      } else {
        this.alertsService.addInfoMessage(
          'Sorry, an unexpected error occurred. Please email admin@oppia.org ' +
          'to be added to the mailing list.', 10000);
      }
    }).catch(errorResponse => {
      this.alertsService.addInfoMessage(
        'Sorry, an unexpected error occurred. Please email admin@oppia.org ' +
        'to be added to the mailing list.', 10000);
    });
  }

  setPageTitle(): void {
    let translatedTitle = this.translateService.instant(
      'I18N_ANDROID_PAGE_TITLE');
    this.pageTitleService.setDocumentTitle(translatedTitle);
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive(
  'androidPage',
  downgradeComponent({component: AndroidPageComponent}));
