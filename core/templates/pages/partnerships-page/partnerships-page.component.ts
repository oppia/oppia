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
 * @fileoverview Component for the partnerships page.
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { PageTitleService } from 'services/page-title.service';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';


@Component({
  selector: 'partnerships-page',
  templateUrl: './partnerships-page.component.html',
  styleUrls: [],
})
export class PartnershipsPageComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();
  partnershipsImgUrl: string = '';
  formIconUrl: string = '';
  callIconUrl: string = '';
  changeIconUrl: string = '';
  peopleIconUrl: string = '';
  agreeIconUrl: string = '';
  serviceIconUrl: string = '';
  partneringImgUrl: string = '';
  org1Url: string = '';
  org2Url: string = '';
  org3Url: string = '';
  org4Url: string = '';
  org5Url: string = '';
  org6Url: string = '';
  partner1: string = '';
  partner2: string = '';
  partner3: string = '';
  learner1: string = '';
  learner2: string = '';
  learner3: string = '';
  panelOpenState: boolean = false;

  constructor(
    private pageTitleService: PageTitleService,
    private urlInterpolationService: UrlInterpolationService,
    private translateService: TranslateService
  ) {}

  setPageTitle(): void {
    let translatedTitle = this.translateService.instant(
      'I18N_PARTNERSHIPS_PAGE_TITLE');
    this.pageTitleService.setDocumentTitle(translatedTitle);
  }

  getFormLink(): string {
    let userLanguage = this.translateService.currentLang;
    const englishLink = "https://forms.gle/Y71U8FdhQwZpicJj8";
    const portugueseLink = "https://docs-google-com.translate.goog/forms/d/e/1FAIpQLSdL5mjFO7RxDtg8yfXluEtciYj8WnAqTL9fZWnwPgOqXV-9lg/viewform?_x_tr_sl=en&_x_tr_tl=pt&_x_tr_hl=en-US&_x_tr_pto=wapp";
    const arabicLink = "https://docs-google-com.translate.goog/forms/d/e/1FAIpQLSdL5mjFO7RxDtg8yfXluEtciYj8WnAqTL9fZWnwPgOqXV-9lg/viewform?_x_tr_sl=en&_x_tr_tl=ar&_x_tr_hl=en-US&_x_tr_pto=wapp";
    const hindiLink = "https://docs-google-com.translate.goog/forms/d/e/1FAIpQLSdL5mjFO7RxDtg8yfXluEtciYj8WnAqTL9fZWnwPgOqXV-9lg/viewform?_x_tr_sl=en&_x_tr_tl=hi&_x_tr_hl=en-US&_x_tr_pto=wapp";
    const spanishLink = "https://docs-google-com.translate.goog/forms/d/e/1FAIpQLSdL5mjFO7RxDtg8yfXluEtciYj8WnAqTL9fZWnwPgOqXV-9lg/viewform?_x_tr_sl=en&_x_tr_tl=es&_x_tr_hl=en-US&_x_tr_pto=wapp";
    const bengaliLink = "https://docs-google-com.translate.goog/forms/d/e/1FAIpQLSdL5mjFO7RxDtg8yfXluEtciYj8WnAqTL9fZWnwPgOqXV-9lg/viewform?_x_tr_sl=en&_x_tr_tl=bn&_x_tr_hl=en-US&_x_tr_pto=wapp";
    const frenchLink = "https://docs-google-com.translate.goog/forms/d/e/1FAIpQLSdL5mjFO7RxDtg8yfXluEtciYj8WnAqTL9fZWnwPgOqXV-9lg/viewform?_x_tr_sl=en&_x_tr_tl=fr&_x_tr_hl=en-US&_x_tr_pto=wapp";
    const indonesianLink = "https://docs-google-com.translate.goog/forms/d/e/1FAIpQLSdL5mjFO7RxDtg8yfXluEtciYj8WnAqTL9fZWnwPgOqXV-9lg/viewform?_x_tr_sl=en&_x_tr_tl=id&_x_tr_hl=en-US&_x_tr_pto=wapp";
    const ukranianLink = "https://docs-google-com.translate.goog/forms/d/e/1FAIpQLSdL5mjFO7RxDtg8yfXluEtciYj8WnAqTL9fZWnwPgOqXV-9lg/viewform?_x_tr_sl=en&_x_tr_tl=uk&_x_tr_hl=en-US&_x_tr_pto=wapp";
    const slovakLink = "https://docs-google-com.translate.goog/forms/d/e/1FAIpQLSdL5mjFO7RxDtg8yfXluEtciYj8WnAqTL9fZWnwPgOqXV-9lg/viewform?_x_tr_sl=en&_x_tr_tl=sk&_x_tr_hl=en-US&_x_tr_pto=wapp";
    const dutchLink = "https://docs-google-com.translate.goog/forms/d/e/1FAIpQLSdL5mjFO7RxDtg8yfXluEtciYj8WnAqTL9fZWnwPgOqXV-9lg/viewform?_x_tr_sl=en&_x_tr_tl=nl&_x_tr_hl=en-US&_x_tr_pto=wapp";
    const vietnameseLink = "https://docs-google-com.translate.goog/forms/d/e/1FAIpQLSdL5mjFO7RxDtg8yfXluEtciYj8WnAqTL9fZWnwPgOqXV-9lg/viewform?_x_tr_sl=en&_x_tr_tl=vi&_x_tr_hl=en-US&_x_tr_pto=wapp";
    const turkishLink = "https://docs-google-com.translate.goog/forms/d/e/1FAIpQLSdL5mjFO7RxDtg8yfXluEtciYj8WnAqTL9fZWnwPgOqXV-9lg/viewform?_x_tr_sl=en&_x_tr_tl=tr&_x_tr_hl=en-US&_x_tr_pto=wapp";
    const chineseSimplified = "https://docs-google-com.translate.goog/forms/d/e/1FAIpQLSdL5mjFO7RxDtg8yfXluEtciYj8WnAqTL9fZWnwPgOqXV-9lg/viewform?_x_tr_sl=en&_x_tr_tl=zh-hans&_x_tr_hl=en-US&_x_tr_pto=wapp";
    const chineseTraditional = "https://docs-google-com.translate.goog/forms/d/e/1FAIpQLSdL5mjFO7RxDtg8yfXluEtciYj8WnAqTL9fZWnwPgOqXV-9lg/viewform?_x_tr_sl=en&_x_tr_tl=zh-hant&_x_tr_hl=en-US&_x_tr_pto=wapp";
    switch (userLanguage) {
      case 'en':
        return englishLink;
      case 'pt-br':
        return portugueseLink;
      case 'ar':
        return arabicLink;
      case 'hi':
        return hindiLink;
      case 'es':
        return spanishLink;
      case 'bn':
        return bengaliLink;
      case 'fr':
        return frenchLink;
      case 'id':
        return indonesianLink;
      case 'uk':
        return ukranianLink;
      case 'sk':
        return slovakLink;
      case 'nl':
        return dutchLink;
      case 'vi':
        return vietnameseLink;
      case 'tr':
        return turkishLink;
      case 'zh-hans':
        return chineseSimplified;
      case 'zh-hant':
        return chineseTraditional;
      default:
        return englishLink;
    }
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPageTitle();
      })
    );
    this.partnershipsImgUrl = this.urlInterpolationService.getStaticImageUrl(
      '/general/partnerships_hero_image.png');
    this.formIconUrl = this.urlInterpolationService.getStaticImageUrl(
      '/icons/icon_form.png');
    this.callIconUrl = this.urlInterpolationService.getStaticImageUrl(
      '/icons/icon_call.png');
    this.changeIconUrl = this.urlInterpolationService.getStaticImageUrl(
      '/icons/icon_change.png');
    this.peopleIconUrl = this.urlInterpolationService.getStaticImageUrl(
      '/icons/icon_people.png');
    this.agreeIconUrl = this.urlInterpolationService.getStaticImageUrl(
      '/icons/icon_agree.png');
    this.serviceIconUrl = this.urlInterpolationService.getStaticImageUrl(
      '/icons/icon_service.png');
    this.partneringImgUrl = this.urlInterpolationService.getStaticImageUrl(
      '/general/partnering_image.png');
    this.org1Url = this.urlInterpolationService.getStaticImageUrl(
      '/partner_logos/movimentoAmplia.png');
    this.org2Url = this.urlInterpolationService.getStaticImageUrl(
      '/partner_logos/digitalCitizen.png');
    this.org3Url = this.urlInterpolationService.getStaticImageUrl(
      '/partner_logos/injazPalestine.png');
    this.org4Url = this.urlInterpolationService.getStaticImageUrl(
      '/partner_logos/nairobits.png');
    this.org5Url = this.urlInterpolationService.getStaticImageUrl(
      '/partner_logos/edri.png');
    this.org6Url = this.urlInterpolationService.getStaticImageUrl(
      '/partner_logos/globalCommunities.png');
    this.partner1 = this.urlInterpolationService.getStaticImageUrl(
      '/general/partner1.png');
    this.partner2 = this.urlInterpolationService.getStaticImageUrl(
      '/general/partner2.png');
    this.partner3 = this.urlInterpolationService.getStaticImageUrl(
      '/general/partner3.png');
    this.learner1 = this.urlInterpolationService.getStaticImageUrl(
      '/general/learner1.png');
    this.learner2 = this.urlInterpolationService.getStaticImageUrl(
      '/general/learner2.png');
    this.learner3 = this.urlInterpolationService.getStaticImageUrl(
      '/general/learner3.png');
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive(
  'partnershipsPage',
  downgradeComponent({component: PartnershipsPageComponent}));
