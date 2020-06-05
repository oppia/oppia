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
  '../services/contribution-opportunities-backend-api.service';
import { ReadOnlyFeaturedTranslationLanguage } from
  'domain/community_dashboard/ReadOnlyFeaturedTranslationLanguageObjectFactory';

@Component({
  selector: 'translation-language-select',
  template: require('./translation-language-select.component.html')
})
export class TranslationLanguageSelectComponent implements OnInit {
  @Input() options: {id: string, description: string}[];
  @Input() value: string;
  @Output() setValue: EventEmitter<string> = new EventEmitter();
  @ViewChild('dropdown', {'static': false}) dropdownRef;

  featuredLanguages: ReadOnlyFeaturedTranslationLanguage[] = [];
  languageIdToDescription: {[id: string]: string} = {};
  dropdownShown = true;
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

    this.contributionOpportunitiesBackendApiService
      .fetchFeaturedTranslationLanguages()
      .then((data: ReadOnlyFeaturedTranslationLanguage[]) => {
        this.featuredLanguages = data;
      });
  }

  _toggleDropdown() {
    this.dropdownShown = !this.dropdownShown;
  }

  _selectOption(value: string) {
    this.setValue.emit(value);
    this.dropdownShown = false;
  }

  _showDescriptionPopup(index: number) {
    this.descriptionPopupPxOffsetY = 75 + 30 * index;
    this.descriptionPopupContent = (
      this.featuredLanguages[index].getDescription());
    this.descriptionPopupShown = true;
  }

  _hideDescriptionPopup() {
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
  'translationLanguageSelect',
  downgradeComponent({
    component: TranslationLanguageSelectComponent,
    inputs: ['options', 'value'],
    outputs: ['setValue']
  }));
