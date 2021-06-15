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
 * @fileoverview Component for the Search Bar.
 */

import { Subscription } from 'rxjs';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import constants from 'assets/constants';
import { EventToCodes, NavigationService } from 'services/navigation.service';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { ClassroomBackendApiService } from 'domain/classroom/classroom-backend-api.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { SearchService } from 'services/search.service';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';
import { WindowRef } from 'services/contextual/window-ref.service';
import { UrlService } from 'services/contextual/url.service';
import { ConstructTranslationIdsService } from 'services/construct-translation-ids.service';
import { LanguageUtilService } from 'domain/utilities/language-util.service';
import { TranslateService } from '@ngx-translate/core';

interface SearchDropDownCategories {
  id: string;
  text: string;
}

interface LanguageIdAndText {
  id: string;
  text: string;
}

interface SelectionDetails {
  categories: {
    description: string,
    itemsName: string,
    masterList: SearchDropDownCategories[],
    numSelections: number,
    selections: {},
    summary: string,
  },

  languageCodes: {
    description: string,
    itemsName: string,
    masterList: LanguageIdAndText[],
    numSelections: number,
    selections: {},
    summary: string,
  }
}

@Component({
  selector: 'oppia-search-bar',
  templateUrl: './search-bar.component.html'
})
export class SearchBarComponent implements OnInit, OnDestroy {
  @Input() enableDropup: boolean = false;
  directiveSubscriptions: Subscription = new Subscription();
  classroomPageIsActive: boolean;
  ACTION_OPEN: string;
  ACTION_CLOSE: string;
  SEARCH_DROPDOWN_CATEGORIES: SearchDropDownCategories[];
  KEYBOARD_EVENT_TO_KEY_CODES: {};
  searchQuery: string = '';
  searchQueryChanged: Subject<string> = new Subject<string>();
  SUPPORTED_CONTENT_LANGUAGES: LanguageIdAndText[];
  selectionDetails: SelectionDetails;
  translationData = {};
  activeMenuName: string='';
  searchBarPlaceholder: string;
  categoryButtonText: string;
  languageButtonText: string;

  constructor(
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private windowRef: WindowRef,
    private searchService: SearchService,
    private urlService: UrlService,
    private navigationService: NavigationService,
    private classroomBackendApiService: ClassroomBackendApiService,
    private languageUtilService: LanguageUtilService,
    private constructTranslationIdsService: ConstructTranslationIdsService,
    private translateService: TranslateService,
  ) {
    this.classroomPageIsActive = (
      this.urlService.getPathname().startsWith('/learn'));
  }

  isSearchInProgress(): boolean {
    return this.searchService.isSearchInProgress();
  }

  searchToBeExec(e: {target: {value: string}}): void {
    if (this.classroomPageIsActive) {
      return null;
    } else {
      this.searchQueryChanged.next(e.target.value);
    }
  }

  /**
   * Opens the submenu.
   * @param {KeyboardEvent} evt
   * @param {String} menuName - name of menu, on which
   * open/close action to be performed (category,language).
   */
  openSubmenu(evt: KeyboardEvent, menuName: string): void {
    this.navigationService.openSubmenu(evt, menuName);
  }

  /**
   * Handles keydown events on menus.
   * @param {KeyboardEvent} evt
   * @param {String} menuName - name of menu to perform action
   * on(category/language)
   * @param {EventToCodes} eventsTobeHandled - Map keyboard events('Enter') to
   * corresponding actions to be performed(open/close).
   *
   * @example
   *  onMenuKeypress($event, 'category', {enter: 'open'})
   */

  onMenuKeypress(
      evt: KeyboardEvent,
      menuName: string,
      eventsTobeHandled: EventToCodes): void {
    this.navigationService.onMenuKeypress(evt, menuName, eventsTobeHandled);
    this.activeMenuName = this.navigationService.activeMenuName;
  }

  // Update the description, numSelections and summary fields of the
  // relevant entry of selectionDetails.
  updateSelectionDetails(itemsType: string): void {
    let itemsName = this.selectionDetails[itemsType].itemsName;
    let masterList = this.selectionDetails[itemsType].masterList;

    let selectedItems = [];
    for (let i = 0; i < masterList.length; i++) {
      if (this.selectionDetails[itemsType]
        .selections[masterList[i].id]) {
        selectedItems.push(masterList[i].text);
      }
    }

    let totalCount = selectedItems.length;
    this.selectionDetails[itemsType].numSelections = totalCount;

    this.selectionDetails[itemsType].summary = (
      totalCount === 0 ? 'I18N_LIBRARY_ALL_' + itemsName.toUpperCase() :
      totalCount === 1 ? selectedItems[0] :
      'I18N_LIBRARY_N_' + itemsName.toUpperCase());
    this.translationData[itemsName + 'Count'] = totalCount;

    // TODO(milit): When the language changes, the translations won't
    // change until the user changes the selection and this function is
    // re-executed.
    if (selectedItems.length > 0) {
      let translatedItems = [];
      for (let i = 0; i < selectedItems.length; i++) {
        translatedItems.push(this.translateService.instant(selectedItems[i]));
      }
      this.selectionDetails[itemsType].description = (
        translatedItems.join(', '));
    } else {
      this.selectionDetails[itemsType].description = (
        'I18N_LIBRARY_ALL_' + itemsName.toUpperCase() + '_SELECTED');
    }
  }

  toggleSelection(itemsType: string, optionName: string): void {
    let selections = this.selectionDetails[itemsType].selections;
    if (!selections.hasOwnProperty(optionName)) {
      selections[optionName] = true;
    } else {
      selections[optionName] = !selections[optionName];
    }

    this.updateSelectionDetails(itemsType);
    this.onSearchQueryChangeExec();
  }

  deselectAll(itemsType: string): void {
    this.selectionDetails[itemsType].selections = {};
    this.updateSelectionDetails(itemsType);
    this.onSearchQueryChangeExec();
  }

  onSearchQueryChangeExec(): void {
    this.searchService.executeSearchQuery(
      this.searchQuery, this.selectionDetails.categories.selections,
      this.selectionDetails.languageCodes.selections, () => {
        let searchUrlQueryString = this.searchService.getSearchUrlQueryString(
          this.searchQuery, this.selectionDetails.categories.selections,
          this.selectionDetails.languageCodes.selections
        );
        if (
          this.windowRef.nativeWindow.location.pathname === ('/search/find')) {
          let url = new URL(this.windowRef.nativeWindow.location.toString());
          url.search = '?q=' + searchUrlQueryString;
          this.windowRef.nativeWindow.history.pushState({}, '', url.toString());
        } else {
          this.windowRef.nativeWindow.location.href = '/search/find?q=' +
            searchUrlQueryString;
        }
      });
  }

  updateSearchFieldsBasedOnUrlQuery(): void {
    this.selectionDetails.categories.selections = {};
    this.selectionDetails.languageCodes.selections = {};

    this.updateSelectionDetails('categories');
    this.updateSelectionDetails('languageCodes');

    let newQuery = (
      this.searchService.updateSearchFieldsBasedOnUrlQuery(
        this.windowRef.nativeWindow.location.search, this.selectionDetails));

    if (this.searchQuery !== newQuery) {
      this.searchQuery = newQuery;
      this.onSearchQueryChangeExec();
    }
  }

  refreshSearchBarLabels(): void {
    // If you translate these strings in the html, then you must use a
    // filter because only the first 14 characters are displayed. That
    // would generate FOUC for languages other than English. As an
    // exception, we translate them here and update the translation
    // every time the language is changed.
    this.searchBarPlaceholder = this.translateService.instant(
      'I18N_LIBRARY_SEARCH_PLACEHOLDER');
    // 'messageformat' is the interpolation method for plural forms.
    // http://angular-translate.github.io/docs/#/guide/14_pluralization.
    this.categoryButtonText = this.translateService.instant(
      this.selectionDetails.categories.summary,
      {...this.translationData, messageFormat: true});
    this.languageButtonText = this.translateService.instant(
      this.selectionDetails.languageCodes.summary,
      {...this.translationData, messageFormat: true});
  }

  searchDropdownCategories(): SearchDropDownCategories[] {
    return constants.SEARCH_DROPDOWN_CATEGORIES.map((categoryName) => {
      return {
        id: categoryName,
        text: this.constructTranslationIdsService.getLibraryId(
          'categories', categoryName)
      };
    });
  }

  ngOnInit(): void {
    this.SEARCH_DROPDOWN_CATEGORIES = this.searchDropdownCategories();
    this.KEYBOARD_EVENT_TO_KEY_CODES = (
      this.navigationService.KEYBOARD_EVENT_TO_KEY_CODES);
    this.ACTION_OPEN = this.navigationService.ACTION_OPEN;
    this.ACTION_CLOSE = this.navigationService.ACTION_CLOSE;
    this.SUPPORTED_CONTENT_LANGUAGES = (
      this.languageUtilService.getLanguageIdsAndTexts());
    this.selectionDetails = {
      categories: {
        description: '',
        itemsName: 'categories',
        masterList: this.SEARCH_DROPDOWN_CATEGORIES,
        numSelections: 0,
        selections: {},
        summary: ''
      },
      languageCodes: {
        description: '',
        itemsName: 'languages',
        masterList: this.SUPPORTED_CONTENT_LANGUAGES,
        numSelections: 0,
        selections: {},
        summary: ''
      }
    };

    // Non-translatable parts of the html strings, like numbers or user
    // names.
    this.translationData = {};
    // Initialize the selection descriptions and summaries.
    for (let itemsType in this.selectionDetails) {
      this.updateSelectionDetails(itemsType);
    }

    this.searchQueryChanged
      .pipe(debounceTime(1000), distinctUntilChanged())
      .subscribe(model => {
        this.searchQuery = model;
        this.onSearchQueryChangeExec();
      });

    // this.directiveSubscriptions.add(
    //   this.router.events.subscribe(() => {
    //     if (this.urlService.getUrlParams().hasOwnProperty('q')) {
    //       this.updateSearchFieldsBasedOnUrlQuery();
    //     }
    //   })
    // );

    this.directiveSubscriptions.add(
      this.i18nLanguageCodeService.onPreferredLanguageCodesLoaded.subscribe(
        (preferredLanguageCodesList) => {
          preferredLanguageCodesList.forEach((languageCode) => {
            let selections =
              this.selectionDetails.languageCodes.selections;
            if (!selections.hasOwnProperty(languageCode)) {
              selections[languageCode] = true;
            } else {
              selections[languageCode] = !selections[languageCode];
            }
          });

          this.updateSelectionDetails('languageCodes');

          if (this.urlService.getUrlParams().hasOwnProperty('q')) {
            this.updateSearchFieldsBasedOnUrlQuery();
          }

          if (
            this.windowRef.nativeWindow.location.pathname === '/search/find') {
            this.onSearchQueryChangeExec();
          }

          this.refreshSearchBarLabels();

          // Notify the function that handles overflow in case the
          // search elements load after it has already been run.
          this.searchService.onSearchBarLoaded.emit();
        }
      )
    );

    this.directiveSubscriptions.add(
      this.translateService.onLangChange
        .subscribe(() => this.refreshSearchBarLabels()));

    this.directiveSubscriptions.add(
      this.classroomBackendApiService.onInitializeTranslation
        .subscribe(() => this.refreshSearchBarLabels()));
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaSearchBar',
  downgradeComponent({
    component: SearchBarComponent
  }) as angular.IDirectiveFactory);

// angular.module('oppia').component('searchBar', {
//   bindings: {
//     enableDropup: '&'
//   },
//   template: require('./search-bar.component.html'),
//   controller: [
//     '$location', '$rootScope', '$scope', '$translate', '$window',
//     'ConstructTranslationIdsService', 'I18nLanguageCodeService',
//     'LanguageUtilService', 'NavigationService', 'SearchService', 'UrlService',
//     'SEARCH_DROPDOWN_CATEGORIES',
//     function(
//         $location, $rootScope, $scope, $translate, $window,
//         ConstructTranslationIdsService, I18nLanguageCodeService,
//         LanguageUtilService, NavigationService, SearchService, UrlService,
//         SEARCH_DROPDOWN_CATEGORIES) {
//       var ctrl = this;

//       ctrl.directiveSubscriptions = new Subscription();

//       ctrl.classroomBackendApiService = (
//         OppiaAngularRootComponent.classroomBackendApiService);

//       ctrl.classroomPageIsActive = (
//         UrlService.getPathname().startsWith('/learn'));

//       ctrl.isSearchInProgress = function() {
//         return SearchService.isSearchInProgress();
//       };
//       /**
//        * Opens the submenu.
//        * @param {object} evt
//        * @param {String} menuName - name of menu, on which
//        * open/close action to be performed (category,language).
//        */
//       ctrl.openSubmenu = function(evt, menuName) {
//         NavigationService.openSubmenu(evt, menuName);
//       };
//       /**
//        * Handles keydown events on menus.
//        * @param {object} evt
//        * @param {String} menuName - name of menu to perform action
//        * on(category/language)
//        * @param {object} eventsTobeHandled - Map keyboard events('Enter') to
//        * corresponding actions to be performed(open/close).
//        *
//        * @example
//        *  onMenuKeypress($event, 'category', {enter: 'open'})
//        */

//       ctrl.onMenuKeypress = function(evt, menuName, eventsTobeHandled) {
//         NavigationService.onMenuKeypress(evt, menuName, eventsTobeHandled);
//         ctrl.activeMenuName = NavigationService.activeMenuName;
//       };

//       // Update the description, numSelections and summary fields of the
//       // relevant entry of ctrl.selectionDetails.
//       var updateSelectionDetails = function(itemsType) {
//         var itemsName = ctrl.selectionDetails[itemsType].itemsName;
//         var masterList = ctrl.selectionDetails[itemsType].masterList;

//         var selectedItems = [];
//         for (var i = 0; i < masterList.length; i++) {
//           if (ctrl.selectionDetails[itemsType]
//             .selections[masterList[i].id]) {
//             selectedItems.push(masterList[i].text);
//           }
//         }

//         var totalCount = selectedItems.length;
//         ctrl.selectionDetails[itemsType].numSelections = totalCount;

//         ctrl.selectionDetails[itemsType].summary = (
//           totalCount === 0 ? 'I18N_LIBRARY_ALL_' + itemsName.toUpperCase() :
//           totalCount === 1 ? selectedItems[0] :
//           'I18N_LIBRARY_N_' + itemsName.toUpperCase());
//         ctrl.translationData[itemsName + 'Count'] = totalCount;

//         // TODO(milit): When the language changes, the translations won't
//         // change until the user changes the selection and this function is
//         // re-executed.
//         if (selectedItems.length > 0) {
//           var translatedItems = [];
//           for (var i = 0; i < selectedItems.length; i++) {
//             translatedItems.push($translate.instant(selectedItems[i]));
//           }
//           ctrl.selectionDetails[itemsType].description = (
//             translatedItems.join(', '));
//         } else {
//           ctrl.selectionDetails[itemsType].description = (
//             'I18N_LIBRARY_ALL_' + itemsName.toUpperCase() + '_SELECTED');
//         }
//       };

//       ctrl.toggleSelection = function(itemsType, optionName) {
//         var selections = ctrl.selectionDetails[itemsType].selections;
//         if (!selections.hasOwnProperty(optionName)) {
//           selections[optionName] = true;
//         } else {
//           selections[optionName] = !selections[optionName];
//         }

//         updateSelectionDetails(itemsType);
//         ctrl.onSearchQueryChangeExec();
//       };

//       ctrl.deselectAll = function(itemsType) {
//         ctrl.selectionDetails[itemsType].selections = {};
//         updateSelectionDetails(itemsType);
//         ctrl.onSearchQueryChangeExec();
//       };

//       ctrl.onSearchQueryChangeExec = function() {
//         SearchService.executeSearchQuery(
//           ctrl.searchQuery, ctrl.selectionDetails.categories.selections,
//           ctrl.selectionDetails.languageCodes.selections, () => {
//             var searchUrlQueryString = SearchService.getSearchUrlQueryString(
//               ctrl.searchQuery, ctrl.selectionDetails.categories.selections,
//               ctrl.selectionDetails.languageCodes.selections
//             );
//             if ($window.location.pathname === '/search/find') {
//               $location.url('/find?q=' + searchUrlQueryString);
//             } else {
//               $window.location.href = '/search/find?q=' + searchUrlQueryString;
//             }
//           });
//       };

//       var updateSearchFieldsBasedOnUrlQuery = function() {
//         ctrl.selectionDetails.categories.selections = {};
//         ctrl.selectionDetails.languageCodes.selections = {};

//         updateSelectionDetails('categories');
//         updateSelectionDetails('languageCodes');

//         var newQuery = (
//           SearchService.updateSearchFieldsBasedOnUrlQuery(
//             $window.location.search, ctrl.selectionDetails));

//         if (ctrl.searchQuery !== newQuery) {
//           ctrl.searchQuery = newQuery;
//           ctrl.onSearchQueryChangeExec();
//         }
//       };

//       var refreshSearchBarLabels = function() {
//         // If you translate these strings in the html, then you must use a
//         // filter because only the first 14 characters are displayed. That
//         // would generate FOUC for languages other than English. As an
//         // exception, we translate them here and update the translation
//         // every time the language is changed.
//         ctrl.searchBarPlaceholder = $translate.instant(
//           'I18N_LIBRARY_SEARCH_PLACEHOLDER');
//         // 'messageformat' is the interpolation method for plural forms.
//         // http://angular-translate.github.io/docs/#/guide/14_pluralization.
//         ctrl.categoryButtonText = $translate.instant(
//           ctrl.selectionDetails.categories.summary,
//           ctrl.translationData, 'messageformat');
//         ctrl.languageButtonText = $translate.instant(
//           ctrl.selectionDetails.languageCodes.summary,
//           ctrl.translationData, 'messageformat');
//       };

//       ctrl.$onInit = function() {
//         ctrl.SEARCH_DROPDOWN_CATEGORIES = (
//           SEARCH_DROPDOWN_CATEGORIES.map(
//             function(categoryName) {
//               return {
//                 id: categoryName,
//                 text: ConstructTranslationIdsService.getLibraryId(
//                   'categories', categoryName)
//               };
//             }
//           )
//         );
//         ctrl.ACTION_OPEN = NavigationService.ACTION_OPEN;
//         ctrl.ACTION_CLOSE = NavigationService.ACTION_CLOSE;
//         ctrl.KEYBOARD_EVENT_TO_KEY_CODES =
//         NavigationService.KEYBOARD_EVENT_TO_KEY_CODES;
//         ctrl.SUPPORTED_CONTENT_LANGUAGES = (
//           LanguageUtilService.getLanguageIdsAndTexts());
//         ctrl.searchQuery = '';
//         ctrl.selectionDetails = {
//           categories: {
//             description: '',
//             itemsName: 'categories',
//             masterList: ctrl.SEARCH_DROPDOWN_CATEGORIES,
//             numSelections: 0,
//             selections: {},
//             summary: ''
//           },
//           languageCodes: {
//             description: '',
//             itemsName: 'languages',
//             masterList: ctrl.SUPPORTED_CONTENT_LANGUAGES,
//             numSelections: 0,
//             selections: {},
//             summary: ''
//           }
//         };

//         // Non-translatable parts of the html strings, like numbers or user
//         // names.
//         ctrl.translationData = {};
//         // Initialize the selection descriptions and summaries.
//         for (var itemsType in ctrl.selectionDetails) {
//           updateSelectionDetails(itemsType);
//         }
//         $scope.$on('$locationChangeSuccess', function() {
//           if (UrlService.getUrlParams().hasOwnProperty('q')) {
//             updateSearchFieldsBasedOnUrlQuery();
//           }
//         });

//         ctrl.directiveSubscriptions.add(
//           I18nLanguageCodeService.onPreferredLanguageCodesLoaded.subscribe(
//             (preferredLanguageCodesList) => {
//               preferredLanguageCodesList.forEach(function(languageCode) {
//                 var selections =
//                  ctrl.selectionDetails.languageCodes.selections;
//                 if (!selections.hasOwnProperty(languageCode)) {
//                   selections[languageCode] = true;
//                 } else {
//                   selections[languageCode] = !selections[languageCode];
//                 }
//               });

//               updateSelectionDetails('languageCodes');

//               if (UrlService.getUrlParams().hasOwnProperty('q')) {
//                 updateSearchFieldsBasedOnUrlQuery();
//               }

//               if ($window.location.pathname === '/search/find') {
//                 ctrl.onSearchQueryChangeExec();
//               }

//               refreshSearchBarLabels();

//               // Notify the function that handles overflow in case the
//               // search elements load after it has already been run.
//               SearchService.onSearchBarLoaded.emit();
//             }
//           )
//         );
//         $rootScope.$on('$translateChangeSuccess', refreshSearchBarLabels);
//         ctrl.directiveSubscriptions.add(
//           ctrl.classroomBackendApiService.onInitializeTranslation
//             .subscribe(() => refreshSearchBarLabels()));
//       };
//       ctrl.$onDestroy = function() {
//         ctrl.directiveSubscriptions.unsubscribe();
//       };
//     }
//   ]
// });
