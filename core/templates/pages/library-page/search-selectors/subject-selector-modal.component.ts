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
 * @fileoverview Component for the SubjectSelectorModal.
 */

import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {Component, OnInit} from '@angular/core';
import {downgradeComponent} from '@angular/upgrade/static';
import {SearchService, SelectionDetails} from 'services/search.service';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'oppia-subject-selector-modal',
  templateUrl: './subject-selector-modal.component.html',
})
export class SubjectSelectorModalComponent implements OnInit {
  translationData: Record<string, number> = {};
  tempSelectionDetails: SelectionDetails = {
    categories: {
      description: '',
      itemsName: 'categories',
      masterList: [], // Should be initialized by the component.
      selections: {},
      numSelections: 0,
      summary: '',
    },
    languageCodes: {
      description: '',
      itemsName: 'languages',
      masterList: [], // Should be initialized by the component.
      selections: {},
      numSelections: 0,
      summary: '',
    },
  };

  constructor(
    public activeModal: NgbActiveModal,
    private searchService: SearchService,
    private translateService: TranslateService
  ) {}

  closeModal(): void {
    this.clearAll();
    this.activeModal.dismiss();
  }

  applySelections(): void {
    this.searchService.selectionDetails = JSON.parse(
      JSON.stringify(this.tempSelectionDetails)
    );
    this.searchService.triggerSearch();
    this.closeModal();
  }

  clearAll(): void {
    this.tempSelectionDetails.categories.selections = {};
    this.tempSelectionDetails.categories.numSelections = 0;
  }

  // Update the description, numSelections and summary fields of the
  // relevant entry of selectionDetails.
  updateSelectionDetails(itemsType: string): void {
    let selectionDetails = this.tempSelectionDetails;
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
    let selectionDetails = this.tempSelectionDetails;
    let selections = selectionDetails[itemsType].selections;

    if (!selections.hasOwnProperty(optionName)) {
      // Initialize the selection as false if it doesn't exist.
      selections[optionName] = false;
    }

    // Toggle the selection state.
    selections[optionName] = !selections[optionName];

    this.updateSelectionDetails(itemsType);
  }

  ngOnInit(): void {
    let selectionDetails = this.selectionDetails;

    // Non-translatable parts of the html strings, like numbers or user
    // names.
    this.translationData = {};

    this.tempSelectionDetails = JSON.parse(JSON.stringify(selectionDetails));
  }
}

angular.module('oppia').directive(
  'oppiaSubjectSelectorModal',
  downgradeComponent({
    component: SubjectSelectorModalComponent,
  }) as angular.IDirectiveFactory
);
