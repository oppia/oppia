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
 * @fileoverview Component for creating a new collection node.
 */

import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { ExplorationCreationBackendApiService } from 'components/entity-creation-services/exploration-creation-backend-api.service';
import { Collection } from 'domain/collection/collection.model';
import { SearchExplorationsBackendApiService } from 'domain/collection/search-explorations-backend-api.service';
import { ExplorationSummaryBackendApiService } from 'domain/summary/exploration-summary-backend-api.service';
import { NormalizeWhitespacePipe } from 'filters/string-utility-filters/normalize-whitespace.pipe';
import { Observable, OperatorFunction } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { AlertsService } from 'services/alerts.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { ValidatorsService } from 'services/validators.service';
import { CollectionEditorStateService } from '../services/collection-editor-state.service';
import { CollectionLinearizerService } from '../services/collection-linearizer.service';

@Component({
  selector: 'oppia-collection-node-creator',
  templateUrl: './collection-node-creator.component.html'
})
export class CollectionNodeCreatorComponent {
  collection: Collection;
  newExplorationId: string = '';
  newExplorationTitle: string = '';
  searchQueryHasError: boolean = false;

  constructor(
    private alertsService: AlertsService,
    private collectionEditorStateService: CollectionEditorStateService,
    private collectionLinearizerService: CollectionLinearizerService,
    private explorationCreationBackendApiService:
    ExplorationCreationBackendApiService,
    private explorationSummaryBackendApiService:
    ExplorationSummaryBackendApiService,
    private searchExplorationsBackendApiService:
    SearchExplorationsBackendApiService,
    private siteAnalyticsService: SiteAnalyticsService,
    private validatorsService: ValidatorsService,
    private normalizeWhitespacePipe: NormalizeWhitespacePipe
  ) {}

  ngOnInit(): void {
    this.collection = this.collectionEditorStateService.getCollection();
  }

  /**
   * Fetches a list of exploration metadata dicts from backend, given
   * a search query. It then extracts the title and id of the
   * exploration to prepare typeahead options.
   */
  fetchTypeaheadResults(
      searchQuery: string
  ): Promise<string[]> {
    const that = this;
    if (this.isValidSearchQuery(searchQuery)) {
      this.searchQueryHasError = false;
      return this.searchExplorationsBackendApiService.fetchExplorationsAsync(
        searchQuery
      ).then((explorationMetadataList) => {
        let options: string[] = [];
        explorationMetadataList.map(function(item) {
          if (!that.collection.containsCollectionNode(item.id)) {
            options.push(item.title + ' (' + item.id + ')');
          }
        });
        return options;
      }, () => {
        this.alertsService.addWarning(
          'There was an error when searching for matching ' +
          'explorations.');
        return [];
      });
    } else {
      this.searchQueryHasError = true;
    }
  }

  searchTypeheadResults: OperatorFunction<string, readonly string[]>= (
      searchText$: Observable<string>) => {
    return searchText$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((text) => this.fetchTypeaheadResults(text))
    );
  };

  isValidSearchQuery(searchQuery: string): boolean {
    // Allow underscores because they are allowed in exploration IDs.
    let INVALID_SEARCH_CHARS = (
      AppConstants.INVALID_NAME_CHARS.filter((item) => {
        return item !== '_';
      }));
    for (let i = 0; i < INVALID_SEARCH_CHARS.length; i++) {
      if (searchQuery.indexOf(INVALID_SEARCH_CHARS[i]) !== -1) {
        return false;
      }
    }
    return true;
  }

  addExplorationToCollection(newExplorationId: string): void {
    if (!newExplorationId) {
      this.alertsService.addWarning('Cannot add an empty exploration ID.');
      return;
    }
    if (this.collection.containsCollectionNode(newExplorationId)) {
      this.alertsService.addWarning(
        'There is already an exploration in this collection ' +
        'with that id.');
      return;
    }

    this.explorationSummaryBackendApiService
      .loadPublicAndPrivateExplorationSummariesAsync([newExplorationId])
      .then((responseObject) => {
        var summaries = responseObject.summaries;
        var summaryBackendObject = null;
        if (summaries.length !== 0 &&
            summaries[0].id === newExplorationId) {
          summaryBackendObject = summaries[0];
        }

        if (summaryBackendObject) {
          this.collectionLinearizerService.appendCollectionNode(
            this.collection, newExplorationId, summaryBackendObject);
        } else {
          this.alertsService.addWarning(
            'That exploration does not exist or you do not have edit ' +
            'access to it.');
        }
      }, () => {
        this.alertsService.addWarning(
          'There was an error while adding an exploration to the ' +
          'collection.');
      });
  }

  convertTypeaheadToExplorationId(typeaheadOption: string): string {
    let matchResults = typeaheadOption.match(/\((.*?)\)$/);
    if (matchResults === null) {
      return typeaheadOption;
    }
    return matchResults[1];
  }

  // Creates a new exploration, then adds it to the collection.
  createNewExploration(): void {
    let title = (
      this.normalizeWhitespacePipe.transform(this.newExplorationTitle));

    if (!this.validatorsService.isValidExplorationTitle(title, true)) {
      return;
    }

    // Create a new exploration with the given title.
    // this.httpClient.post('/contributehandler/create_new', {
    //   title: title
    // }).toPromise()
    this.explorationCreationBackendApiService.registerNewExplorationAsync({
      title: title
    }).then((response) => {
      this.newExplorationTitle = '';
      let newExplorationId = response.explorationId;

      this.siteAnalyticsService
        .registerCreateNewExplorationInCollectionEvent(
          newExplorationId);
      this.addExplorationToCollection(newExplorationId);
    });
  }

  // Checks whether the user has left a '#' at the end of their ID
  // by accident (which can happen if it's being copy/pasted from the
  // editor page.
  isMalformedId(typedExplorationId: string): boolean {
    return (
      typedExplorationId &&
      typedExplorationId.lastIndexOf('#') ===
      typedExplorationId.length - 1);
  }


  addExploration(): void {
    this.addExplorationToCollection(this.convertTypeaheadToExplorationId(
      this.newExplorationId));
    this.newExplorationId = '';
  }
}

angular.module('oppia').directive('oppiaCollectionNodeCreator',
  downgradeComponent({
    component: CollectionNodeCreatorComponent
  }) as angular.IDirectiveFactory);
