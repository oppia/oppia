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
  Component, OnInit, Input, Output, EventEmitter, HostListener, ViewChild,
  ElementRef
} from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { ContributionOpportunitiesBackendApiService } from
  // eslint-disable-next-line max-len
  'pages/contributor-dashboard-page/services/contribution-opportunities-backend-api.service';
import { LanguageUtilService } from 'domain/utilities/language-util.service';
import { TranslationLanguageService } from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import { UserService } from 'services/user.service';

interface Options {
  id: string;
  description: string;
}

@Component({
  selector: 'review-translation-language-selector',
  templateUrl: './review-translation-language-selector.component.html'
})
export class ReviewTranslationLanguageSelectorComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() activeLanguageCode!: string | null;
  @Output() setActiveLanguageCode: EventEmitter<string> = new EventEmitter();
  @ViewChild('dropdown', {'static': false}) dropdownRef!: ElementRef;
  @ViewChild('filterDiv') filterDivRef!: ElementRef;

  options!: Options[];
  filteredOptions: Options[] = [];
  optionsFilter: string = '';
  languageSelection: string = 'Language';
  languageIdToDescription: {[id: string]: string} = {};

  dropdownShown = false;

  constructor(
    private contributionOpportunitiesBackendApiService:
      ContributionOpportunitiesBackendApiService,
    private languageUtilService: LanguageUtilService,
    private readonly translationLanguageService: TranslationLanguageService,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.translationLanguageService.onActiveLanguageChanged.subscribe(
      () => {
        this.languageSelection = this.languageIdToDescription[
          this.translationLanguageService.getActiveLanguageCode()];
      });

    this.userService.getUserContributionRightsDataAsync()
      .then(userContributionRights => {
        if (!userContributionRights) {
          throw new Error('User contribution rights not found.');
        }

        this.filteredOptions = this.options = userContributionRights
          .can_review_translation_for_language_codes.map(languageCode => {
            const description = this.languageUtilService
              .getAudioLanguageDescription(languageCode);
            this.languageIdToDescription[languageCode] = description;
            return { id: languageCode, description };
          });

        if (this.activeLanguageCode) {
          this.languageSelection = this.languageIdToDescription[
            this.activeLanguageCode];
        }
      });

    this.contributionOpportunitiesBackendApiService
      .getPreferredTranslationLanguageAsync()
      .then((preferredLanguageCode: string|null) => {
        if (
          preferredLanguageCode && this.languageSelection === 'Language'
        ) {
          this.populateLanguageSelection(
            preferredLanguageCode);
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
      }
      , 1);
    }
  }

  populateLanguageSelection(languageCode: string): void {
    this.setActiveLanguageCode.emit(languageCode);
    this.languageSelection = (
      this.languageIdToDescription[languageCode]);
  }

  selectOption(activeLanguageCode: string): void {
    this.populateLanguageSelection(activeLanguageCode);
    this.dropdownShown = false;
    this.contributionOpportunitiesBackendApiService
      .savePreferredTranslationLanguageAsync(activeLanguageCode);
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
    this.filteredOptions = this.options.filter(
      option => option.description.toLowerCase().includes(
        this.optionsFilter.toLowerCase()));
  }
}

angular.module('oppia').directive(
  'reviewTranslationLanguageSelector',
  downgradeComponent({
    component: ReviewTranslationLanguageSelectorComponent,
    inputs: ['activeLanguageCode'],
    outputs: ['setActiveLanguageCode']
  }));
