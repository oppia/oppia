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

import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { Collection } from 'domain/collection/collection.model';
import { SearchExplorationsBackendApiService } from 'domain/collection/search-explorations-backend-api.service';
import { ExplorationSummaryBackendApiService } from 'domain/summary/exploration-summary-backend-api.service';
import { NormalizeWhitespacePipe } from 'filters/string-utility-filters/normalize-whitespace.pipe';
import { Observable, of, OperatorFunction } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { AlertsService } from 'services/alerts.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { ValidatorsService } from 'services/validators.service';
import { CollectionEditorStateService } from '../services/collection-editor-state.service';
import { CollectionLinearizerService } from '../services/collection-linearizer.service';

@Component({
  selector: 'collection-node-creator',
  templateUrl: './collection-node-creator.component.html'
})
export class CollectionNodeCreatorComponent {
  collection: Collection;
  newExplorationId: string = '';
  newExplorationTitle: string = '';
  searchQueryHasError: boolean = false;

  constructor(
    private httpClient: HttpClient,
    private alertsService: AlertsService,
    private collectionEditorStateService: CollectionEditorStateService,
    private collectionLinearizerService: CollectionLinearizerService,
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
  ): Promise<void | string[]> {
    if (this.isValidSearchQuery(searchQuery)) {
      this.searchQueryHasError = false;
      return this.searchExplorationsBackendApiService.fetchExplorationsAsync(
        searchQuery
      ).then((explorationMetadataList) => {
        let options: string[] = [];
        explorationMetadataList.map(function(item) {
          if (!this.collection.containsCollectionNode(item.id)) {
            options.push(item.title + ' (' + item.id + ')');
          }
        });
        return options;
      }, () => {
        this.alertsService.addWarning(
          'There was an error when searching for matching ' +
          'explorations.');
      });
    } else {
      this.searchQueryHasError = true;
    }
  }

  search(
      text$: Observable<string>
  ): OperatorFunction<string, readonly string[]> {
  }

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
    this.httpClient.post('/contributehandler/create_new', {
      title: title
    }).toPromise().then((response) => {
      this.newExplorationTitle = '';
      let newExplorationId = response.exploration_id;

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

angular.module('oppia').directive('collectionNodeCreator',
  downgradeComponent({
    component: CollectionNodeCreatorComponent
  }) as angular.IDirectiveFactory);

//   'UrlInterpolationService', function(UrlInterpolationService) {
//     return {
//       restrict: 'E',
//       scope: {},
//       bindToController: {},
//       templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
//         '/pages/collection-editor-page/editor-tab/' +
//         'collection-node-creator.directive.html'),
//       controllerAs: '$ctrl',
//       controller: [
//         '$filter', '$http', '$rootScope', 'AlertsService',
//         'CollectionEditorStateService', 'CollectionLinearizerService',
//         'ExplorationSummaryBackendApiService',
//         'SearchExplorationsBackendApiService', 'SiteAnalyticsService',
//         'ValidatorsService', 'INVALID_NAME_CHARS',
//         function(
//             $filter, $http, $rootScope, AlertsService,
//             CollectionEditorStateService, CollectionLinearizerService,
//             ExplorationSummaryBackendApiService,
//             SearchExplorationsBackendApiService, SiteAnalyticsService,
//             ValidatorsService, INVALID_NAME_CHARS) {
//           var ctrl = this;
//           /**
//            * Fetches a list of exploration metadata dicts from backend, given
//            * a search query. It then extracts the title and id of the
//            * exploration to prepare typeahead options.
//            */
//           ctrl.fetchTypeaheadResults = function(searchQuery) {
//             if (isValidSearchQuery(searchQuery)) {
//               ctrl.searchQueryHasError = false;
//               return SearchExplorationsBackendApiService.fetchExplorationsAsync(
//                 searchQuery
//               ).then(function(explorationMetadataList) {
//                 var options = [];
//                 explorationMetadataList.map(function(item) {
//                   if (!ctrl.collection.containsCollectionNode(item.id)) {
//                     options.push(item.title + ' (' + item.id + ')');
//                   }
//                 });
//                 return options;
//               }, function() {
//                 AlertsService.addWarning(
//                   'There was an error when searching for matching ' +
//                   'explorations.');
//               });
//             } else {
//               ctrl.searchQueryHasError = true;
//             }
//           };

//           var isValidSearchQuery = function(searchQuery) {
//             // Allow underscores because they are allowed in exploration IDs.
//             var INVALID_SEARCH_CHARS = (
//               INVALID_NAME_CHARS.filter(function(item) {
//                 return item !== '_';
//               }));
//             for (var i = 0; i < INVALID_SEARCH_CHARS.length; i++) {
//               if (searchQuery.indexOf(INVALID_SEARCH_CHARS[i]) !== -1) {
//                 return false;
//               }
//             }
//             return true;
//           };

//           var addExplorationToCollection = function(newExplorationId) {
//             if (!newExplorationId) {
//               AlertsService.addWarning('Cannot add an empty exploration ID.');
//               return;
//             }
//             if (ctrl.collection.containsCollectionNode(newExplorationId)) {
//               AlertsService.addWarning(
//                 'There is already an exploration in this collection ' +
//                 'with that id.');
//               return;
//             }

//             ExplorationSummaryBackendApiService
//               .loadPublicAndPrivateExplorationSummariesAsync([newExplorationId])
//               .then(function(responseObject) {
//                 var summaries = responseObject.summaries;
//                 var summaryBackendObject = null;
//                 if (summaries.length !== 0 &&
//                     summaries[0].id === newExplorationId) {
//                   summaryBackendObject = summaries[0];
//                 }
//                 if (summaryBackendObject) {
//                   CollectionLinearizerService.appendCollectionNode(
//                     ctrl.collection, newExplorationId, summaryBackendObject);
//                 } else {
//                   AlertsService.addWarning(
//                     'That exploration does not exist or you do not have edit ' +
//                     'access to it.');
//                 }
//                 $rootScope.$applyAsync();
//               }, function() {
//                 AlertsService.addWarning(
//                   'There was an error while adding an exploration to the ' +
//                   'collection.');
//               });
//           };

//           var convertTypeaheadToExplorationId = function(typeaheadOption) {
//             var matchResults = typeaheadOption.match(/\((.*?)\)$/);
//             if (matchResults === null) {
//               return typeaheadOption;
//             }
//             return matchResults[1];
//           };

//           // Creates a new exploration, then adds it to the collection.
//           ctrl.createNewExploration = function() {
//             var title = $filter('normalizeWhitespace')(
//               ctrl.newExplorationTitle);

//             if (!ValidatorsService.isValidExplorationTitle(title, true)) {
//               return;
//             }

//             // Create a new exploration with the given title.
//             $http.post('/contributehandler/create_new', {
//               title: title
//             }).then(function(response) {
//               ctrl.newExplorationTitle = '';
//               var newExplorationId = response.data.exploration_id;

//               SiteAnalyticsService
//                 .registerCreateNewExplorationInCollectionEvent(
//                   newExplorationId);
//               addExplorationToCollection(newExplorationId);
//             });
//           };

//           // Checks whether the user has left a '#' at the end of their ID
//           // by accident (which can happen if it's being copy/pasted from the
//           // editor page.
//           ctrl.isMalformedId = function(typedExplorationId) {
//             return (
//               typedExplorationId &&
//               typedExplorationId.lastIndexOf('#') ===
//               typedExplorationId.length - 1);
//           };

//           ctrl.addExploration = function() {
//             addExplorationToCollection(convertTypeaheadToExplorationId(
//               ctrl.newExplorationId));
//             ctrl.newExplorationId = '';
//           };
//           ctrl.$onInit = function() {
//             ctrl.collection = CollectionEditorStateService.getCollection();
//             ctrl.newExplorationId = '';
//             ctrl.newExplorationTitle = '';
//             ctrl.searchQueryHasError = false;
//           };
//         }
//       ]
//     };
//   }]);
