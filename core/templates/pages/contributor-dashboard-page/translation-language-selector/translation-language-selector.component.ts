// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the translation language select.
 */

import {
  Component, OnInit, Input, Output, EventEmitter, HostListener, ViewChild
} from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { ContributionOpportunitiesBackendApiService } from
  // eslint-disable-next-line max-len
  'pages/contributor-dashboard-page/services/contribution-opportunities-backend-api.service';
import { FeaturedTranslationLanguage } from
  'domain/opportunity/featured-translation-language.model';
import { LanguageUtilService } from 'domain/utilities/language-util.service';

@Component({
  selector: 'translation-language-selector',
  templateUrl: './translation-language-selector.component.html'
})
export class TranslationLanguageSelectorComponent implements OnInit {
  @Input() activeLanguageCode: string;
  @Output() setActiveLanguageCode: EventEmitter<string> = new EventEmitter();
  @ViewChild('dropdown', {'static': false}) dropdownRef;

  options: {id: string, description: string}[];
  languageIdToDescription: {[id: string]: string} = {};
  featuredLanguages: FeaturedTranslationLanguage[] = [];

  dropdownShown = false;
  explanationPopupShown = false;
  explanationPopupPxOffsetY = 0;
  explanationPopupContent = '';

  constructor(
    private contributionOpportunitiesBackendApiService:
      ContributionOpportunitiesBackendApiService,
    private languageUtilService: LanguageUtilService
  ) {}

  ngOnInit(): void {
    this.options = this.languageUtilService
      .getAllVoiceoverLanguageCodes().map(languageCode => {
        const description = this.languageUtilService
          .getAudioLanguageDescription(languageCode);
        this.languageIdToDescription[languageCode] = description;
        return { id: languageCode, description };
      });

    this.contributionOpportunitiesBackendApiService
      .fetchFeaturedTranslationLanguages()
      .then((featuredLanguages: FeaturedTranslationLanguage[]) => {
        this.featuredLanguages = featuredLanguages;
      });
  }

  toggleDropdown(): void {
    this.dropdownShown = !this.dropdownShown;
  }

  selectOption(activeLanguageCode: string): void {
    this.setActiveLanguageCode.emit(activeLanguageCode);
    this.dropdownShown = false;
  }

  showExplanationPopup(index: number): void {
    /**
     * Align popup to mouse-overed info icon.
     * 75: approximate height of selector and featured languages label.
     * 30: approximate height of each dropdown element.
     */
    this.explanationPopupPxOffsetY = 75 + 30 * index;
    this.explanationPopupContent = (
      this.featuredLanguages[index].explanation);
    this.explanationPopupShown = true;
  }

  hideExplanationPopup(): void {
    this.explanationPopupShown = false;
  }

  /**
   * Close dropdown when outside elements are clicked
   * @param event mouse click event
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const targetElement = event.target as HTMLElement;
    if (
      targetElement &&
      !this.dropdownRef.nativeElement.contains(targetElement)
    ) {
      this.dropdownShown = false;
    }
  }
}

angular.module('oppia').directive(
  'translationLanguageSelector',
  downgradeComponent({
    component: TranslationLanguageSelectorComponent,
    inputs: ['activeLanguageCode'],
    outputs: ['setActiveLanguageCode']
  }));
