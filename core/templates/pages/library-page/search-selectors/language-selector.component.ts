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
 * @fileoverview Component for the LanguageSelector.
 */

import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {LanguageSelectorModalComponent} from './language-selector-modal.component';
import {Subscription} from 'rxjs';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {downgradeComponent} from '@angular/upgrade/static';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {SearchService, SelectionDetails} from 'services/search.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'oppia-language-selector',
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.css'],
})
export class LanguageSelectorComponent implements OnInit, OnDestroy {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  directiveSubscriptions: Subscription = new Subscription();
  translationData: Record<string, number> = {};

  constructor(
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private windowDimensionsService: WindowDimensionsService,
    private searchService: SearchService,
    private translateService: TranslateService,
    private modalService: NgbModal
  ) {}

  isMobileViewActive(): boolean {
    return this.windowDimensionsService.getWidth() <= 766;
  }

  // Update the description, numSelections and summary fields of the
  // relevant entry of selectionDetails.
  updateSelectionDetails(itemsType: string): void {
    let selectionDetails = this.selectionDetails;
    let itemsName = selectionDetails[itemsType].itemsName;
    let masterList = selectionDetails[itemsType].masterList;

    let selectedItems = [];
    for (let i = 0; i < masterList.length; i++) {
      if (selectionDetails[itemsType].selections[masterList[i].id]) {
        selectedItems.push(masterList[i].text);
      }
    }

    let totalCount = selectedItems.length;
    selectionDetails[itemsType].numSelections = totalCount;

    selectionDetails[itemsType].summary =
      totalCount === 0
        ? 'I18N_LIBRARY_ALL_' + itemsName.toUpperCase()
        : totalCount === 1
          ? selectedItems[0]
          : 'I18N_LIBRARY_N_' + itemsName.toUpperCase();
    this.translationData[itemsName + 'Count'] = totalCount;

    if (selectedItems.length > 0) {
      let translatedItems = [];
      for (let i = 0; i < selectedItems.length; i++) {
        translatedItems.push(this.translateService.instant(selectedItems[i]));
      }
      selectionDetails[itemsType].description = translatedItems.join(', ');
    } else {
      selectionDetails[itemsType].description =
        'I18N_LIBRARY_ALL_' + itemsName.toUpperCase() + '_SELECTED';
    }
  }

  get selectionDetails(): SelectionDetails {
    return this.searchService.selectionDetails;
  }

  toggleSelection(itemsType: string, optionName: string): void {
    let selectionDetails = this.selectionDetails;
    let selections = selectionDetails[itemsType].selections;

    if (!selections.hasOwnProperty(optionName)) {
      // Initialize the selection as false if it doesn't exist.
      selections[optionName] = false;
    }

    // Toggle the selection state.
    selections[optionName] = !selections[optionName];

    this.updateSelectionDetails(itemsType);
    this.searchService.triggerSearch();
  }

  openSelectorModal(): void {
    this.modalService.open(LanguageSelectorModalComponent);
  }

  ngOnInit(): void {
    let selectionDetails = this.selectionDetails;

    // Non-translatable parts of the html strings, like numbers or user
    // names.
    this.translationData = {};
    // Initialize the selection descriptions and summaries.
    for (let itemsType in selectionDetails) {
      this.updateSelectionDetails(itemsType);
    }

    this.directiveSubscriptions.add(
      this.i18nLanguageCodeService.onPreferredLanguageCodesLoaded.subscribe(
        preferredLanguageCodesList => {
          preferredLanguageCodesList.forEach(languageCode => {
            let selections = selectionDetails.languageCodes.selections;
            if (!selections.hasOwnProperty(languageCode)) {
              selections[languageCode] = true;
            } else {
              selections[languageCode] = !selections[languageCode];
            }
          });

          let selections = selectionDetails.languageCodes.selections;
          selections[
            this.i18nLanguageCodeService.getCurrentI18nLanguageCode()
          ] = true;

          this.updateSelectionDetails('languageCodes');
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive(
  'oppiaLanguageSelector',
  downgradeComponent({
    component: LanguageSelectorComponent,
  }) as angular.IDirectiveFactory
);
