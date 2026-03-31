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
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ViewChild,
  ElementRef,
} from '@angular/core';

import {
  ContributionOpportunitiesBackendApiService,
  // eslint-disable-next-line max-len
} from 'pages/contributor-dashboard-page/services/contribution-opportunities-backend-api.service';
import {FeaturedTranslationLanguage} from 'domain/opportunity/featured-translation-language.model';
import {LanguageUtilService} from 'domain/utilities/language-util.service';
import {TranslationLanguageService} from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';

interface Options {
  id: string;
  description: string;
}

@Component({
  selector: 'translation-language-selector',
  templateUrl: './translation-language-selector.component.html',
})
export class TranslationLanguageSelectorComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() activeLanguageCode!: string | null;
  @Output() setActiveLanguageCode: EventEmitter<string> = new EventEmitter();
  @ViewChild('dropdown', {static: false}) dropdownRef!: ElementRef;
  @ViewChild('filterDiv') filterDivRef!: ElementRef;

  options!: Options[];
  filteredOptions: Options[] = [];
  optionsFilter: string = '';
  languageSelection!: string;
  languageIdToDescription: {[id: string]: string} = {};
  featuredLanguages: FeaturedTranslationLanguage[] = [];

  dropdownShown = false;
  explanationPopupShown = false;
  explanationPopupPxOffsetY = 0;
  explanationPopupContent = '';

  constructor(
    private contributionOpportunitiesBackendApiService: ContributionOpportunitiesBackendApiService,
    private languageUtilService: LanguageUtilService,
    private readonly translationLanguageService: TranslationLanguageService
  ) {}

  ngOnInit(): void {
    this.translationLanguageService.onActiveLanguageChanged.subscribe(() => {
      this.languageSelection =
        this.languageIdToDescription[
          this.translationLanguageService.getActiveLanguageCode()
        ];
    });
    this.filteredOptions = this.options = this.languageUtilService
      .getAllVoiceoverLanguageCodes()
      .map(languageCode => {
        const description =
          this.languageUtilService.getAudioLanguageDescription(languageCode);
        this.languageIdToDescription[languageCode] = description;
        return {id: languageCode, description};
      });

    this.contributionOpportunitiesBackendApiService
      .fetchFeaturedTranslationLanguagesAsync()
      .then((featuredLanguages: FeaturedTranslationLanguage[]) => {
        this.featuredLanguages = featuredLanguages;
      });

    this.languageSelection = this.activeLanguageCode
      ? this.languageIdToDescription[this.activeLanguageCode]
      : 'Language';

    this.contributionOpportunitiesBackendApiService
      .getPreferredTranslationLanguageAsync()
      .then((preferredLanguageCode: string | null) => {
        if (preferredLanguageCode) {
          this.populateLanguageSelection(preferredLanguageCode);
        }
      });
  }

  toggleDropdown(): void {
    this.dropdownShown = !this.dropdownShown;
    if (this.dropdownShown) {
      this.optionsFilter = '';
      this.filteredOptions = this.options;
      setTimeout(() => {
        this.filterDivRef.nativeElement.focus();
      }, 1);
    }
  }

  populateLanguageSelection(languageCode: string): void {
    this.setActiveLanguageCode.emit(languageCode);
    this.languageSelection = this.languageIdToDescription[languageCode];
  }

  selectOption(activeLanguageCode: string): void {
    this.populateLanguageSelection(activeLanguageCode);
    this.dropdownShown = false;
    this.contributionOpportunitiesBackendApiService.savePreferredTranslationLanguageAsync(
      activeLanguageCode
    );
  }

  showExplanationPopup(index: number): void {
    /**
     * Align popup to mouse-overed info icon.
     * 75: approximate height of selector and featured languages label.
     * 30: approximate height of each dropdown element.
     */
    this.explanationPopupPxOffsetY = 75 + 30 * index;
    this.explanationPopupContent = this.featuredLanguages[index].explanation;
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

  filterOptions(): void {
    this.filteredOptions = this.options.filter(option =>
      option.description
        .toLowerCase()
        .includes(this.optionsFilter.toLowerCase())
    );
  }
}
