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

import {Subscription} from 'rxjs';
import {Subject} from 'rxjs';
import {AppConstants} from 'app.constants';
import {EventToCodes, NavigationService} from 'services/navigation.service';
import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ClassroomBackendApiService} from 'domain/classroom/classroom-backend-api.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {SearchService, SelectionDetails} from 'services/search.service';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';
import {WindowRef} from 'services/contextual/window-ref.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {UrlService} from 'services/contextual/url.service';
import {ConstructTranslationIdsService} from 'services/construct-translation-ids.service';
import {LanguageUtilService} from 'domain/utilities/language-util.service';
import {TranslateService} from '@ngx-translate/core';
import './search-bar.component.css';

interface SearchDropDownCategories {
  id: string;
  text: string;
}

interface LanguageIdAndText {
  id: string;
  text: string;
}

@Component({
  selector: 'oppia-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.css'],
})
export class SearchBarComponent implements OnInit, OnDestroy {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  searchBarPlaceholder!: string;
  categoryButtonText!: string;
  languageButtonText!: string;
  ACTION_OPEN!: string;
  ACTION_CLOSE!: string;
  SUPPORTED_CONTENT_LANGUAGES!: LanguageIdAndText[];
  selectionDetails!: SelectionDetails;
  SEARCH_DROPDOWN_CATEGORIES!: SearchDropDownCategories[];
  KEYBOARD_EVENT_TO_KEY_CODES!: {};
  directiveSubscriptions: Subscription = new Subscription();
  classroomPageIsActive: boolean = false;
  searchButtonIsActive: boolean = false;
  searchQuery: string = '';
  searchQueryChanged: Subject<string> = new Subject<string>();
  translationData: Record<string, number> = {};
  activeMenuName: string = '';
  @Input() enableDropup: boolean = false;

  constructor(
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private windowRef: WindowRef,
    private windowDimensionsService: WindowDimensionsService,
    private searchService: SearchService,
    private urlService: UrlService,
    private navigationService: NavigationService,
    private classroomBackendApiService: ClassroomBackendApiService,
    private languageUtilService: LanguageUtilService,
    private constructTranslationIdsService: ConstructTranslationIdsService,
    private translateService: TranslateService
  ) {
    this.classroomPageIsActive = this.urlService
      .getPathname()
      .startsWith('/learn');
    this.isSearchButtonActive();
  }

  isMobileViewActive(): boolean {
    return this.windowDimensionsService.getWidth() <= 766;
  }

  isSearchButtonActive(): boolean {
    this.searchButtonIsActive =
      this.classroomPageIsActive || this.isMobileViewActive();
    return this.searchButtonIsActive;
  }

  isSearchInProgress(): boolean {
    return this.searchService.isSearchInProgress();
  }

  searchToBeExec(e: {target: {value: string}}): void {
    if (!this.searchButtonIsActive) {
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
    eventsTobeHandled: EventToCodes
  ): void {
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
      if (this.selectionDetails[itemsType].selections[masterList[i].id]) {
        selectedItems.push(masterList[i].text);
      }
    }

    let totalCount = selectedItems.length;
    this.selectionDetails[itemsType].numSelections = totalCount;

    this.selectionDetails[itemsType].summary =
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
      this.selectionDetails[itemsType].description = translatedItems.join(', ');
    } else {
      this.selectionDetails[itemsType].description =
        'I18N_LIBRARY_ALL_' + itemsName.toUpperCase() + '_SELECTED';
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
    this.refreshSearchBarLabels();
  }

  deselectAll(itemsType: string): void {
    this.selectionDetails[itemsType].selections = {};
    this.updateSelectionDetails(itemsType);
    this.refreshSearchBarLabels();
  }

  onSearchQueryChangeExec(): void {
    let searchUrlQueryString = this.searchService.getSearchUrlQueryString(
      this.searchQuery,
      this.selectionDetails.categories.selections,
      this.selectionDetails.languageCodes.selections
    );
    this.searchService.executeSearchQuery(
      this.searchQuery,
      this.selectionDetails.categories.selections,
      this.selectionDetails.languageCodes.selections,
      () => {
        let url = new URL(this.windowRef.nativeWindow.location.toString());
        let siteLangCode: string | null = url.searchParams.get('lang');
        url.search = '?q=' + searchUrlQueryString;
        if (this.windowRef.nativeWindow.location.pathname === '/search/find') {
          if (siteLangCode) {
            url.searchParams.append('lang', siteLangCode);
          }
          this.windowRef.nativeWindow.history.pushState({}, '', url.toString());
        } else {
          url.pathname = '/search/find';
          if (siteLangCode) {
            url.searchParams.append('lang', siteLangCode);
          }
          this.windowRef.nativeWindow.location.href = url.toString();
        }
      }
    );
  }

  updateSearchFieldsBasedOnUrlQuery(): void {
    this.selectionDetails.categories.selections = {};
    this.selectionDetails.languageCodes.selections = {};

    let newQuery = this.searchService.updateSearchFieldsBasedOnUrlQuery(
      this.windowRef.nativeWindow.location.search,
      this.selectionDetails
    );

    if (this.searchQuery !== newQuery) {
      this.searchQuery = newQuery;
      this.onSearchQueryChangeExec();
    }

    this.updateSelectionDetails('categories');
    this.updateSelectionDetails('languageCodes');
    this.refreshSearchBarLabels();
  }

  refreshSearchBarLabels(): void {
    // If you translate these strings in the html, then you must use a
    // filter because only the first 14 characters are displayed. That
    // would generate FOUC for languages other than English. As an
    // exception, we translate them here and update the translation
    // every time the language is changed.
    this.searchBarPlaceholder = this.translateService.instant(
      'I18N_LIBRARY_SEARCH_PLACEHOLDER'
    );
    // 'messageformat' is the interpolation method for plural forms.
    // http://angular-translate.github.io/docs/#/guide/14_pluralization.
    this.categoryButtonText = this.translateService.instant(
      this.selectionDetails.categories.summary,
      {...this.translationData, messageFormat: true}
    );
    this.languageButtonText = this.translateService.instant(
      this.selectionDetails.languageCodes.summary,
      {...this.translationData, messageFormat: true}
    );
  }

  searchDropdownCategories(): SearchDropDownCategories[] {
    return AppConstants.SEARCH_DROPDOWN_CATEGORIES.map(categoryName => {
      return {
        id: categoryName,
        text: this.constructTranslationIdsService.getLibraryId(
          'categories',
          categoryName
        ),
      };
    });
  }

  ngOnInit(): void {
    this.SEARCH_DROPDOWN_CATEGORIES = this.searchDropdownCategories();
    this.KEYBOARD_EVENT_TO_KEY_CODES =
      this.navigationService.KEYBOARD_EVENT_TO_KEY_CODES;
    this.ACTION_OPEN = this.navigationService.ACTION_OPEN;
    this.ACTION_CLOSE = this.navigationService.ACTION_CLOSE;
    this.SUPPORTED_CONTENT_LANGUAGES =
      this.languageUtilService.getLanguageIdsAndTexts();
    this.selectionDetails = {
      categories: {
        description: '',
        itemsName: 'categories',
        masterList: this.SEARCH_DROPDOWN_CATEGORIES,
        numSelections: 0,
        selections: {},
        summary: '',
      },
      languageCodes: {
        description: '',
        itemsName: 'languages',
        masterList: this.SUPPORTED_CONTENT_LANGUAGES,
        numSelections: 0,
        selections: {},
        summary: '',
      },
    };

    // Non-translatable parts of the html strings, like numbers or user
    // names.
    this.translationData = {};
    // Initialize the selection descriptions and summaries.
    for (let itemsType in this.selectionDetails) {
      this.updateSelectionDetails(itemsType);
    }

    this.refreshSearchBarLabels();

    this.searchQueryChanged
      .pipe(debounceTime(1000), distinctUntilChanged())
      .subscribe(model => {
        this.searchQuery = model;
        this.onSearchQueryChangeExec();
      });

    this.directiveSubscriptions.add(
      this.i18nLanguageCodeService.onPreferredLanguageCodesLoaded.subscribe(
        preferredLanguageCodesList => {
          preferredLanguageCodesList.forEach(languageCode => {
            let selections = this.selectionDetails.languageCodes.selections;
            if (!selections.hasOwnProperty(languageCode)) {
              selections[languageCode] = true;
            } else {
              selections[languageCode] = !selections[languageCode];
            }
          });

          let selections = this.selectionDetails.languageCodes.selections;
          selections[
            this.i18nLanguageCodeService.getCurrentI18nLanguageCode()
          ] = true;

          this.updateSelectionDetails('languageCodes');

          if (this.urlService.getUrlParams().hasOwnProperty('q')) {
            this.updateSearchFieldsBasedOnUrlQuery();
          }

          if (
            this.windowRef.nativeWindow.location.pathname === '/search/find'
          ) {
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
      this.translateService.onLangChange.subscribe(() =>
        this.refreshSearchBarLabels()
      )
    );

    this.directiveSubscriptions.add(
      this.classroomBackendApiService.onInitializeTranslation.subscribe(() =>
        this.refreshSearchBarLabels()
      )
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
