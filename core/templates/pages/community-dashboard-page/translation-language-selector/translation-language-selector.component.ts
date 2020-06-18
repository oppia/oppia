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
  'core/templates/pages/community-dashboard-page/services/contribution-opportunities-backend-api.service';
import { FeaturedTranslationLanguage } from
  'domain/opportunity/FeaturedTranslationLanguageFactory';

@Component({
  selector: 'translation-language-selector',
  templateUrl: './translation-language-selector.component.html'
})
export class TranslationLanguageSelectorComponent implements OnInit {
  @Input() options: {id: string, description: string}[];
  @Input() value: string;
  @Output() setValue: EventEmitter<string> = new EventEmitter();
  @ViewChild('dropdown', {'static': false}) dropdownRef;

  featuredLanguages: FeaturedTranslationLanguage[] = [];
  languageIdToDescription: {[id: string]: string} = {};
  dropdownShown = false;
  descriptionPopupShown = false;
  descriptionPopupPxOffsetY = 0;
  descriptionPopupContent = '';

  constructor(
    private contributionOpportunitiesBackendApiService:
      ContributionOpportunitiesBackendApiService
  ) {}

  ngOnInit() {
    this.options.forEach(({id, description}) =>
      this.languageIdToDescription[id] = description);
    try {
      this.contributionOpportunitiesBackendApiService
        .fetchFeaturedTranslationLanguages()
        .then((data: FeaturedTranslationLanguage[]) => {
          this.featuredLanguages = data;
        });
    } catch {}
  }

  toggleDropdown() {
    this.dropdownShown = !this.dropdownShown;
  }

  selectOption(value: string) {
    this.setValue.emit(value);
    this.dropdownShown = false;
  }

  showDescriptionPopup(index: number) {
    this.descriptionPopupPxOffsetY = 75 + 30 * index;
    this.descriptionPopupContent = (
      this.featuredLanguages[index].description);
    this.descriptionPopupShown = true;
  }

  hideDescriptionPopup() {
    this.descriptionPopupShown = false;
  }

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
    inputs: ['options', 'value'],
    outputs: ['setValue']
  }));
