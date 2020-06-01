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
 * @fileoverview Controllers for the about page.
 */

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { TranslateService } from 'services/translate.service';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service.ts';
import { WindowRef } from
  'services/contextual/window-ref.service.ts';

@Component({
  selector: 'about-page',
  templateUrl: './about-page.component.html'
})
export class AboutPageComponent implements OnInit {
  listOfNames: string;
  aboutPageMascotImgUrl: string;
  activeTabName: string;
  listOfNamesToThank = [
    'Alex Kauffmann', 'Allison Barros',
    'Amy Latten', 'Brett Barros',
    'Crystal Kwok', 'Daniel Hernandez',
    'Divya Siddarth', 'Ilwon Yoon',
    'Jennifer Chen', 'John Cox',
    'John Orr', 'Katie Berlent',
    'Michael Wawszczak', 'Mike Gainer',
    'Neil Fraser', 'Noah Falstein',
    'Nupur Jain', 'Peter Norvig',
    'Philip Guo', 'Piotr Mitros',
    'Rachel Chen', 'Rahim Nathwani',
    'Robyn Choo', 'Tricia Ngoon',
    'Vikrant Nanda', 'Vinamrata Singal',
    'Yarin Feigenbaum'];
  // Define constant for each tab on the page.
  TAB_ID_ABOUT: string = 'about';
  TAB_ID_FOUNDATION: string = 'foundation';
  TAB_ID_CREDITS: string = 'credits';
  ALLOWED_TABS: Array<string>;
  constructor(
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private urlInterpolationService: UrlInterpolationService,
    private translate: TranslateService,
    private windowRef: WindowRef) {
    translate.use('en');
  }

  onTabClick(tabName: string) {
    this.windowRef.nativeWindow.location.hash = '#' + tabName;
    this.activeTabName = tabName;
    return this.windowRef.nativeWindow;
  }

  getStaticImageUrl(imagePath: string) {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  ngOnInit() {
    this.activeTabName = this.TAB_ID_ABOUT;
    this.translate.use(
      this.i18nLanguageCodeService.getCurrentI18nLanguageCode());
    this.i18nLanguageCodeService.onI18nLanguageCodeChange().subscribe(
      (code) => this.translate.use(code)
    );
    this.ALLOWED_TABS = [
      this.TAB_ID_ABOUT, this.TAB_ID_FOUNDATION, this.TAB_ID_CREDITS];
    const hash = this.windowRef.nativeWindow.location.hash.slice(1);
    if (hash === 'license') {
      this.activeTabName = this.TAB_ID_FOUNDATION;
    } else if (this.ALLOWED_TABS.includes(hash)) {
      this.activeTabName = hash;
    }

    this.listOfNames = this.listOfNamesToThank
      .slice(0, this.listOfNamesToThank.length - 1).join(', ') +
      ' & ' + this.listOfNamesToThank[this.listOfNamesToThank.length - 1];
    this.aboutPageMascotImgUrl = this.urlInterpolationService
      .getStaticImageUrl('/general/about_page_mascot.png');

    this.windowRef.nativeWindow.onhashchange = () => {
      const hashChange = this.windowRef.nativeWindow.location.hash.slice(1);
      if (hashChange === 'license') {
        this.activeTabName = this.TAB_ID_FOUNDATION;
        this.windowRef.nativeWindow.location.reload(true);
      } else if (this.ALLOWED_TABS.includes(hashChange)) {
        this.activeTabName = hashChange;
      }
    };
  }
}
angular.module('oppia').directive(
  'aboutPage', downgradeComponent({component: AboutPageComponent}));
