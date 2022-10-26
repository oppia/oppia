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
 * @fileoverview Component for exploration metadata modal.
 */

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { AppConstants } from 'app.constants';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { ExplorationCategoryService } from '../services/exploration-category.service';
import { ExplorationLanguageCodeService } from '../services/exploration-language-code.service';
import { ExplorationObjectiveService } from '../services/exploration-objective.service';
import { ExplorationTagsService } from '../services/exploration-tags.service';
import { ExplorationTitleService } from '../services/exploration-title.service';
import { AlertsService } from 'services/alerts.service';
import { ExplorationStatesService } from '../services/exploration-states.service';


interface CategoryChoices {
  id: string;
  text: string;
}

@Component({
  selector: 'oppia-exploration-metadata-modal',
  templateUrl: './exploration-metadata-modal.component.html'
})
export class ExplorationMetadataModalComponent
  extends ConfirmOrCancelModal implements OnInit {
  categoryLocalValue: string;
  objectiveHasBeenPreviouslyEdited: boolean;
  requireTitleToBeSpecified: boolean;
  requireObjectiveToBeSpecified: boolean;
  requireCategoryToBeSpecified: boolean;
  askForLanguageCheck: boolean;
  isValueHasbeenUpdated: boolean = false;
  askForTags: boolean;
  addOnBlur: boolean = true;
  explorationTags: string[] = [];
  CATEGORY_LIST_FOR_SELECT2;
  filteredChoices: CategoryChoices[] = [];
  newCategory: CategoryChoices;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  constructor(
    private alertsService: AlertsService,
    private explorationCategoryService: ExplorationCategoryService,
    private explorationLanguageCodeService: ExplorationLanguageCodeService,
    private explorationObjectiveService: ExplorationObjectiveService,
    private explorationStatesService: ExplorationStatesService,
    private explorationTagsService: ExplorationTagsService,
    private explorationTitleService: ExplorationTitleService,
    private ngbActiveModal: NgbActiveModal,
  ) {
    super(ngbActiveModal);
  }

  updateCategoryListWithUserData(): void {
    if (this.newCategory) {
      this.CATEGORY_LIST_FOR_SELECT2.push(this.newCategory);
    }
  }

  filterChoices(searchTerm: string): void {
    this.newCategory = {
      id: searchTerm,
      text: searchTerm
    };

    this.filteredChoices = this.CATEGORY_LIST_FOR_SELECT2.filter(
      value => value.text.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1);

    this.filteredChoices.push(this.newCategory);

    if (searchTerm === '') {
      this.filteredChoices = this.CATEGORY_LIST_FOR_SELECT2;
    }
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    // Add our explorationTags.
    if (value) {
      if (!(this.explorationTagsService.displayed) ||
        (this.explorationTagsService.displayed as []).length < 10) {
        if (
          (this.explorationTagsService.displayed as string[]).includes(value)) {
          // Clear the input value.
          event.input.value = '';
          return;
        }

        this.explorationTags.push(value.toLowerCase());
      }
    }

    // Clear the input value.
    event.input.value = '';

    this.explorationTagsService.displayed = this.explorationTags;
  }

  remove(explorationTags: string): void {
    const index = this.explorationTags.indexOf(explorationTags);

    if (index >= 0) {
      this.explorationTags.splice(index, 1);
    }

    this.explorationTagsService.displayed = this.explorationTags;
  }

  save(): void {
    if (!this.areRequiredFieldsFilled()) {
      return;
    }

    // Record any fields that have changed.
    let metadataList = [];
    if (this.explorationTitleService.hasChanged()) {
      metadataList.push('title');
    }
    if (this.explorationObjectiveService.hasChanged()) {
      metadataList.push('objective');
    }
    if (this.explorationCategoryService.hasChanged()) {
      metadataList.push('category');
    }
    if (this.explorationLanguageCodeService.hasChanged()) {
      metadataList.push('language');
    }
    if (this.explorationTagsService.hasChanged()) {
      metadataList.push('tags');
    }

    // Save all the displayed values.
    this.explorationTitleService.saveDisplayedValue();
    this.explorationObjectiveService.saveDisplayedValue();
    this.explorationCategoryService.saveDisplayedValue();
    this.explorationLanguageCodeService.saveDisplayedValue();
    this.explorationTagsService.saveDisplayedValue();

    // TODO(sll): Get rid of the $timeout here.
    // It's currently used because there is a race condition: the
    // saveDisplayedValue() calls above result in autosave calls.
    // These race with the discardDraft() call that
    // will be called when the draft changes entered here
    // are properly saved to the backend.
    setTimeout(() => {
      this.ngbActiveModal.close(metadataList);
    }, 500);
  }

  areRequiredFieldsFilled(): boolean {
    if (!this.explorationTitleService.displayed) {
      this.alertsService.addWarning('Please specify a title');
      return false;
    }
    if (!this.explorationObjectiveService.displayed) {
      this.alertsService.addWarning('Please specify an objective');
      return false;
    }
    if (!this.explorationCategoryService.displayed) {
      this.alertsService.addWarning('Please specify a category');
      return false;
    }

    return true;
  }

  isSavingAllowed(): boolean {
    return Boolean(
      this.explorationTitleService.displayed &&
      this.explorationObjectiveService.displayed &&
      // TODO(#13015): Remove use of unknown as a type.
      (this.explorationObjectiveService.displayed as unknown[]).length >= 15 &&
      this.explorationCategoryService.displayed &&
      this.explorationLanguageCodeService.displayed);
  }

  ngOnInit(): void {
    this.CATEGORY_LIST_FOR_SELECT2 = [];
    this.objectiveHasBeenPreviouslyEdited = (
      // TODO(#13015): Remove use of unknown as a type.
      (this.explorationObjectiveService.savedMemento as unknown[]).length > 0);

    this.requireTitleToBeSpecified = (
      !this.explorationTitleService.savedMemento);
    this.requireObjectiveToBeSpecified = (
      // TODO(#13015): Remove use of unknown as a type.
      (this.explorationObjectiveService.savedMemento as unknown[]).length < 15);
    this.requireCategoryToBeSpecified = (
      !this.explorationCategoryService.savedMemento);
    this.askForLanguageCheck = (
      this.explorationLanguageCodeService.savedMemento ===
      AppConstants.DEFAULT_LANGUAGE_CODE);
    this.askForTags = (
      // TODO(#13015): Remove use of unknown as a type.
      (this.explorationTagsService.savedMemento as unknown[]).length === 0);

    for (let i = 0; i < AppConstants.ALL_CATEGORIES.length; i++) {
      this.CATEGORY_LIST_FOR_SELECT2.push({
        id: AppConstants.ALL_CATEGORIES[i],
        text: AppConstants.ALL_CATEGORIES[i]
      });
    }

    if (this.explorationStatesService.isInitialized()) {
      let categoryIsInSelect2 = this.CATEGORY_LIST_FOR_SELECT2
        .some(
          (categoryItem) => {
            return categoryItem.id ===
            this.explorationCategoryService.savedMemento;
          }
        );

      // If the current category is not in the dropdown, add it
      // as the first option.
      if (!categoryIsInSelect2 &&
            this.explorationCategoryService.savedMemento) {
        this.CATEGORY_LIST_FOR_SELECT2.unshift({
          id: this.explorationCategoryService.savedMemento,
          text: this.explorationCategoryService.savedMemento
        });
      }
    }

    this.filteredChoices = this.CATEGORY_LIST_FOR_SELECT2;
    this.explorationTags = (this.explorationTagsService.displayed) as string[];

    // This logic has been used here to
    // solve ExpressionChangedAfterItHasBeenCheckedError error.
    setTimeout(() => {
      this.isValueHasbeenUpdated = true;
    });
  }
}

angular.module('oppia').directive('oppiaExplorationMetadataModal',
  downgradeComponent({
    component: ExplorationMetadataModalComponent
  }) as angular.IDirectiveFactory);
