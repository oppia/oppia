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
 * @fileoverview Component for displaying and editing a collection details.
 * Edit options include: changing the title, objective, and category, and also
 * adding a new exploration.
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { AppConstants } from 'app.constants';
import { CollectionUpdateService } from 'domain/collection/collection-update.service';
import { CollectionValidationService } from 'domain/collection/collection-validation.service';
import { Collection } from 'domain/collection/collection.model';
import { Subscription } from 'rxjs';
import { AlertsService } from 'services/alerts.service';
import { CollectionEditorPageConstants } from '../collection-editor-page.constants';
import { CollectionEditorStateService } from '../services/collection-editor-state.service';

@Component({
  selector: 'collection-details-editor',
  templateUrl: './collection-details-editor.component.html'
})
export class CollectionDetailsEditorComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  collection!: Collection;
  // The following properties are used to display the collection settings.
  // These are null until collection data is entered by the user.
  displayedCollectionTitle!: string | null;
  displayedCollectionObjective!: string | null;
  displayedCollectionCategory!: string | null;
  displayedCollectionLanguage!: string | null;
  COLLECTION_TITLE_INPUT_FOCUS_LABEL = (
    CollectionEditorPageConstants.COLLECTION_TITLE_INPUT_FOCUS_LABEL);

  CATEGORY_LIST: string[] = [...AppConstants.ALL_CATEGORIES];
  languageListForSelect = AppConstants.SUPPORTED_CONTENT_LANGUAGES;
  TAG_REGEX = AppConstants.TAG_REGEX;
  displayedCollectionTags: string[] | null = [];

  constructor(
    private alertsService: AlertsService,
    private collectionEditorStateService: CollectionEditorStateService,
    private collectionUpdateService: CollectionUpdateService,
    private collectionValidationService: CollectionValidationService
  ) {}

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.collectionEditorStateService.onCollectionInitialized.subscribe(
        () => this.refreshSettingsTab()
      ));
    this.collection = this.collectionEditorStateService.getCollection();
  }

  refreshSettingsTab(): void {
    this.displayedCollectionTitle = this.collection.getTitle();
    this.displayedCollectionObjective = this.collection.getObjective();
    this.displayedCollectionCategory = this.collection.getCategory();
    this.displayedCollectionLanguage = this.collection.getLanguageCode();
    this.displayedCollectionTags = this.collection.getTags();

    let categoryIsInList = this.CATEGORY_LIST.some((categoryItem) => {
      return categoryItem === this.collection.getCategory();
    });

    // If the current category is not in the dropdown, add it
    // as the first option.
    let category = this.collection.getCategory();
    if (!categoryIsInList && category) {
      this.CATEGORY_LIST.unshift(category);
    }
  }

  hasPageLoaded(): boolean {
    return this.collectionEditorStateService.hasLoadedCollection();
  }

  // Normalize the tags for the collection.
  normalizeTags(tags: string[] | null): string[] {
    if (tags === null) {
      return [];
    }
    for (let i = 0; i < tags.length; i++) {
      tags[i] = tags[i].trim().replace(/\s+/g, ' ');
    }
    return tags;
  }

  updateCollectionTitle(): void {
    this.collectionUpdateService.setCollectionTitle(
      this.collection, this.displayedCollectionTitle);
  }

  updateCollectionObjective(): void {
    this.collectionUpdateService.setCollectionObjective(
      this.collection, this.displayedCollectionObjective);
  }

  updateCollectionCategory(): void {
    this.collectionUpdateService.setCollectionCategory(
      this.collection, this.displayedCollectionCategory);
  }

  updateCollectionLanguageCode(): void {
    this.collectionUpdateService.setCollectionLanguageCode(
      this.collection, this.displayedCollectionLanguage);
  }

  updateCollectionTags(): void {
    this.displayedCollectionTags = this.normalizeTags(
      this.displayedCollectionTags
    );

    if (!this.collectionValidationService.isTagValid(
      this.displayedCollectionTags)) {
      this.alertsService.addWarning(
        'Please ensure that there are no duplicate tags and that all ' +
                'tags contain only lower case and spaces.');
      return;
    }
    this.collectionUpdateService.setCollectionTags(
      this.collection, this.displayedCollectionTags);
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
