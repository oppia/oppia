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
 * @fileoverview Component for the about page.
 */

import {Component, OnInit} from '@angular/core';
import {downgradeComponent} from '@angular/upgrade/static';

import {SiteAnalyticsService} from 'services/site-analytics.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {WindowRef} from 'services/contextual/window-ref.service';
import {DonationBoxModalComponent} from 'pages/donate-page/donation-box/donation-box-modal.component';
import {ThanksForDonatingModalComponent} from 'pages/donate-page/thanks-for-donating-modal.component';

import './about-page.component.css';
import {title} from 'process';

@Component({
  selector: 'about-page',
  templateUrl: './about-page.component.html',
  styleUrls: ['./about-page.component.css'],
})
export class AboutPageComponent implements OnInit {
  features = [
    {
      i18nDescription: 'I18N_ABOUT_PAGE_AUDIO_SUBTITLES_FEATURE',
      imageFilename: '/about/cc.svg',
    },
    {
      i18nDescription: 'I18N_ABOUT_PAGE_LESSON_FEATURE',
      imageFilename: '/about/lesson_icon.svg',
    },
    {
      i18nDescription: 'I18N_ABOUT_PAGE_MOBILE_FEATURE',
      imageFilename: '/about/mobile_alt_solid.svg',
    },
    {
      i18nDescription: 'I18N_ABOUT_PAGE_WIFI_FEATURE',
      imageFilename: '/about/wifi_solid.svg',
    },
    {
      i18nDescription: 'I18N_ABOUT_PAGE_LANGUAGE_FEATURE',
      imageFilename: '/about/language_icon.svg',
    },
  ];

  selectedTabIndex = 1;
  partnershipsFormLink: string = '';
  volunteerRolesDetails = [
    {
      title: 'I18N_ABOUT_PAGE_CTA_GROWTH_TITLE',
      iconUrl: '/icons/growth-icon',
      description: 'I18N_ABOUT_PAGE_CTA_GROWTH_DESCRIPTION',
      listItems: [
        'I18N_ABOUT_PAGE_CTA_GROWTH_LIST_ITEM1',
        'I18N_ABOUT_PAGE_CTA_GROWTH_LIST_ITEM2',
        'I18N_ABOUT_PAGE_CTA_GROWTH_LIST_ITEM3',
      ],
    },
    {
      title: 'I18N_ABOUT_PAGE_CTA_DEV_TITLE',
      iconUrl: '/icons/dev-icon',
      description: 'I18N_ABOUT_PAGE_CTA_DEV_DESCRIPTION',
      listItems: [
        'I18N_ABOUT_PAGE_CTA_DEV_LIST_ITEM1',
        'I18N_ABOUT_PAGE_CTA_DEV_LIST_ITEM2',
        'I18N_ABOUT_PAGE_CTA_DEV_LIST_ITEM3',
      ],
    },
    {
      title: 'I18N_ABOUT_PAGE_CTA_ART_TITLE',
      iconUrl: '/icons/art-icon',
      description: 'I18N_ABOUT_PAGE_CTA_ART_DESCRIPTION',
      listItems: [
        'I18N_ABOUT_PAGE_CTA_ART_LIST_ITEM1',
        'I18N_ABOUT_PAGE_CTA_ART_LIST_ITEM2',
      ],
    },
    {
      title: 'I18N_ABOUT_PAGE_CTA_TRANSLATION_TITLE',
      iconUrl: '/icons/translation-icon',
      description: 'I18N_ABOUT_PAGE_CTA_TRANSLATION_DESCRIPTION',
      listItems: [
        'I18N_ABOUT_PAGE_CTA_TRANSLATION_LIST_ITEM1',
        'I18N_ABOUT_PAGE_CTA_TRANSLATION_LIST_ITEM2',
        'I18N_ABOUT_PAGE_CTA_TRANSLATION_LIST_ITEM3',
      ],
    },
    {
      title: 'I18N_ABOUT_PAGE_CTA_LESSON_TITLE',
      iconUrl: '/icons/lesson-icon',
      description: 'I18N_ABOUT_PAGE_CTA_LESSON_DESCRIPTION',
      listItems: [
        'I18N_ABOUT_PAGE_CTA_LESSON_LIST_ITEM1',
        'I18N_ABOUT_PAGE_CTA_LESSON_LIST_ITEM2',
        'I18N_ABOUT_PAGE_CTA_LESSON_LIST_ITEM3',
      ],
    },
  ];
  activeVolunteerRolesIndexes: number[] = [0, 1, 2];

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private siteAnalyticsService: SiteAnalyticsService,
    private windowRef: WindowRef,
    private ngbModal: NgbModal
  ) {}

  ngOnInit(): void {
    const searchParams = new URLSearchParams(
      this.windowRef.nativeWindow.location.search
    );
    const params = Object.fromEntries(searchParams.entries());
    if (params.hasOwnProperty('thanks')) {
      this.ngbModal.open(ThanksForDonatingModalComponent, {
        backdrop: 'static',
        size: 'xl',
      });
    }
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  getImageSet(imageName: string, imageExt: string): string {
    return (
      this.getStaticImageUrl(imageName + '1x.' + imageExt) +
      ' 1x, ' +
      this.getStaticImageUrl(imageName + '15x.' + imageExt) +
      ' 1.5x, ' +
      this.getStaticImageUrl(imageName + '2x.' + imageExt) +
      ' 2x'
    );
  }

  openDonationBoxModal(): void {
    this.ngbModal.open(DonationBoxModalComponent, {
      backdrop: 'static',
      size: 'xl',
      windowClass: 'donation-box-modal',
    });
  }

  onClickBrowseLibraryButton(): void {
    this.siteAnalyticsService.registerClickBrowseLibraryButtonEvent();
  }
}
angular
  .module('oppia')
  .directive('aboutPage', downgradeComponent({component: AboutPageComponent}));
