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
 * @fileoverview Component for the donate page.
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { PageTitleService } from 'services/page-title.service';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { WindowDimensionsService } from
  'services/contextual/window-dimensions.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import 'popper.js';
import 'bootstrap';
import { AppConstants } from 'app.constants';
import { AlertsService } from 'services/alerts.service';
import { MailingListBackendApiService } from 'domain/mailing-list/mailing-list-backend-api.service';
import { ThanksForDonatingModalComponent } from './thanks-for-donating-modal.component';
import { ThanksForSubscribingModalComponent } from './thanks-for-subscribing-modal.component';

@Component({
  selector: 'donate-page',
  templateUrl: './donate-page.component.html',
  styleUrls: []
})
export class DonatePageComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();
  windowIsNarrow: boolean = false;
  donateImgUrl: string = '';
  emailAddress: string | null = null;
  name: string | null = null;
  OPPIA_AVATAR_IMAGE_URL = (
    this.getStaticImageUrl('/avatar/oppia_avatar_large_100px.svg')
  );

  constructor(
    private pageTitleService: PageTitleService,
    private urlInterpolationService: UrlInterpolationService,
    private windowDimensionService: WindowDimensionsService,
    private windowRef: WindowRef,
    private translateService: TranslateService,
    private alertsService: AlertsService,
    private mailingListBackendApiService: MailingListBackendApiService,
    private ngbModal: NgbModal
  ) {}

  ngOnInit(): void {
    this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
    this.donateImgUrl = this.getStaticImageUrl('/general/opp_donate_text.svg');
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPageTitle();
      })
    );
    this.windowRef.nativeWindow.onhashchange = () => {
      let newHash: string = this.windowRef.nativeWindow.location.hash;
      if (newHash === '#thank-you') {
        this.ngbModal.open(
          ThanksForDonatingModalComponent,
          {
            backdrop: 'static',
            size: 'xl'
          }
        );
      }
    };
  }

  setPageTitle(): void {
    let translatedTitle = this.translateService.instant(
      'I18N_DONATE_PAGE_BROWSER_TAB_TITLE');
    this.pageTitleService.setDocumentTitle(translatedTitle);
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  getImageSet(imageName: string, imageExt: string): string {
    return (
      this.getStaticImageUrl(imageName + '1x.' + imageExt) + ' 1x, ' +
      this.getStaticImageUrl(imageName + '15x.' + imageExt) + ' 1.5x, ' +
      this.getStaticImageUrl(imageName + '2x.' + imageExt) + ' 2x'
    );
  }

  validateEmailAddress(): boolean {
    let regex = new RegExp(AppConstants.EMAIL_REGEX);
    return regex.test(String(this.emailAddress));
  }

  subscribeToMailingList(): void {
    this.mailingListBackendApiService.subscribeUserToMailingList(
      String(this.emailAddress),
      String(this.name),
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
          'Sorry, an unexpected error occurred. Please email admin@oppia.org ' +
          'to be added to the mailing list.', 10000);
      }
    }).catch(errorResponse => {
      this.alertsService.addInfoMessage(
        'Sorry, an unexpected error occurred. Please email admin@oppia.org ' +
        'to be added to the mailing list.', 10000);
    });
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive(
  'donatePage', downgradeComponent({component: DonatePageComponent}));
