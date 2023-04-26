// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Data and component for the Oppia contributors' library page.
 */

import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { AppConstants } from 'app.constants';
import { ClassroomBackendApiService } from 'domain/classroom/classroom-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { LoggerService } from 'services/contextual/logger.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { KeyboardShortcutService } from 'services/keyboard-shortcut.service';
import { LoaderService } from 'services/loader.service';
import { PageTitleService } from 'services/page-title.service';
import { SearchService } from 'services/search.service';
import { UserService } from 'services/user.service';
import { LibraryPageConstants } from './library-page.constants';
import { ActivityDict,
  LibraryPageBackendApiService,
  SummaryDict } from './services/library-page-backend-api.service';

import './library-page.component.css';


interface MobileLibraryGroupProperties {
  inCollapsedState: boolean;
  buttonText: string;
}

@Component({
  selector: 'oppia-library-page',
  templateUrl: './library-page.component.html',
  styleUrls: ['./library-page.component.css']
})
export class LibraryPageComponent {
  possibleBannerFilenames: string[] = [
    'banner1.svg', 'banner2.svg', 'banner3.svg', 'banner4.svg'];

  // If the value below is changed, the following CSS values in
  // oppia.css must be changed:
  // - .oppia-exp-summary-tiles-container: max-width
  // - .oppia-library-carousel: max-width.
  MAX_NUM_TILES_PER_ROW: number = 4;
  isAnyCarouselCurrentlyScrolling: boolean = false;
  tileDisplayCount: number = 0;
  leftmostCardIndices: number[] = [];
  LIBRARY_PAGE_MODES = LibraryPageConstants.LIBRARY_PAGE_MODES;
  activitiesOwned: {[key: string]: {[key: string]: boolean}} = {
    explorations: {},
    collections: {}
  };

  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  translateSubscription!: Subscription;
  resizeSubscription!: Subscription;
  // The following property will be assigned null when user
  // has not selected any active group index.
  activeGroupIndex!: number | null;
  activityList!: ActivityDict[];
  bannerImageFilename!: string;
  bannerImageFileUrl!: string;
  currentPath!: string;
  groupName!: string;
  groupHeaderI18nId!: string;
  libraryGroups!: SummaryDict[];
  libraryWindowIsNarrow!: boolean;
  mobileLibraryGroupsProperties!: MobileLibraryGroupProperties[];
  pageMode!: string;

  constructor(
    private loggerService: LoggerService,
    private windowRef: WindowRef,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private keyboardShortcutService: KeyboardShortcutService,
    private libraryPageBackendApiService: LibraryPageBackendApiService,
    private loaderService: LoaderService,
    private searchService: SearchService,
    private urlInterpolationService: UrlInterpolationService,
    private userService: UserService,
    private windowDimensionsService: WindowDimensionsService,
    private classroomBackendApiService: ClassroomBackendApiService,
    private pageTitleService: PageTitleService,
    private translateService: TranslateService
  ) {}

  setActiveGroup(groupIndex: number): void {
    this.activeGroupIndex = groupIndex;
  }

  clearActiveGroup(): void {
    this.activeGroupIndex = null;
  }

  initCarousels(): void {
    if (this.libraryWindowIsNarrow) {
      return;
    }

    // This prevents unnecessary execution of this method immediately
    // after a window resize event is fired.
    if (!this.libraryGroups) {
      return;
    }

    // The number 0 here is just to make sure that the type of width is number,
    // it is never assigned as the width will never be undefined.
    let width = $(window).width() || 0;

    let windowWidth = width * 0.85;
    // The number 20 is added to LIBRARY_TILE_WIDTH_PX in order to
    // compensate for padding and margins. 20 is just an arbitrary
    // number.
    this.tileDisplayCount = Math.min(
      Math.floor(windowWidth / (AppConstants.LIBRARY_TILE_WIDTH_PX + 20)),
      this.MAX_NUM_TILES_PER_ROW);

    $('.oppia-library-carousel').css({
      'max-width': (
        this.tileDisplayCount * AppConstants.LIBRARY_TILE_WIDTH_PX) + 'px'
    });

    // The following determines whether to enable left scroll after
    // resize.
    for (let i = 0; i < this.libraryGroups.length; i++) {
      let carouselJQuerySelector = (
        '.oppia-library-carousel-tiles:eq(n)'.replace(
          'n', String(i)));
      // The number 0 here is just to make sure that the type of width is
      // number, it is never assigned as the selector will never be undefined.
      let carouselScrollPositionPx = $(
        carouselJQuerySelector).scrollLeft() || 0;
      let index = Math.ceil(
        carouselScrollPositionPx / AppConstants.LIBRARY_TILE_WIDTH_PX);
      this.leftmostCardIndices[i] = index;
    }
  }

  scroll(ind: number, isLeftScroll: boolean): void {
    if (this.isAnyCarouselCurrentlyScrolling) {
      return;
    }
    let carouselJQuerySelector = (
      '.oppia-library-carousel-tiles:eq(n)'.replace('n', ind.toString()));

    let direction = isLeftScroll ? -1 : 1;
    // The number 0 here is just to make sure that the type of width is
    // number, it is never assigned as the selector will never be undefined.
    let carouselScrollPositionPx = $(
      carouselJQuerySelector).scrollLeft() || 0;

    // Prevent scrolling if there more carousel pixed widths than
    // there are tile widths.
    if (this.libraryGroups[ind].activity_summary_dicts.length <=
        this.tileDisplayCount) {
      return;
    }

    carouselScrollPositionPx = Math.max(0, carouselScrollPositionPx);

    if (isLeftScroll) {
      this.leftmostCardIndices[ind] = Math.max(
        0, this.leftmostCardIndices[ind] - this.tileDisplayCount);
    } else {
      this.leftmostCardIndices[ind] = Math.min(
        this.libraryGroups[ind].activity_summary_dicts.length -
          this.tileDisplayCount + 1,
        this.leftmostCardIndices[ind] + this.tileDisplayCount);
    }

    let newScrollPositionPx = carouselScrollPositionPx +
      (this.tileDisplayCount * AppConstants.LIBRARY_TILE_WIDTH_PX * direction);

    $(carouselJQuerySelector).animate({
      scrollLeft: newScrollPositionPx
    }, {
      duration: 800,
      queue: false,
      start: () => {
        this.isAnyCarouselCurrentlyScrolling = true;
      },
      complete: () => {
        this.isAnyCarouselCurrentlyScrolling = false;
      }
    });
  }


  // The carousels do not work when the width is 1 card long, so we need
  // to handle this case discretely and also prevent swiping past the
  // first and last card.
  incrementLeftmostCardIndex(ind: number): void {
    let lastItem = ((
      this.libraryGroups[ind].activity_summary_dicts.length -
      this.tileDisplayCount) <= this.leftmostCardIndices[ind]);
    if (!lastItem) {
      this.leftmostCardIndices[ind]++;
    }
  }

  decrementLeftmostCardIndex(ind: number): void {
    this.leftmostCardIndices[ind] = (
      Math.max(this.leftmostCardIndices[ind] - 1, 0));
  }

  // The following loads explorations belonging to a particular group.
  // If fullResultsUrl is given it loads the page corresponding to
  // the url. Otherwise, it will initiate a search query for the
  // given list of categories.
  showFullResultsPage(categories: string[], fullResultsUrl: string): void {
    if (fullResultsUrl) {
      this.windowRef.nativeWindow.location.href = fullResultsUrl;
    } else {
      let selectedCategories: Record<string, boolean> = {};
      for (let i = 0; i < categories.length; i++) {
        selectedCategories[categories[i]] = true;
      }

      let targetSearchQueryUrl = this.searchService.getSearchUrlQueryString(
        '', selectedCategories, {});
      this.windowRef.nativeWindow.location.href = (
        '/search/find?q=' + targetSearchQueryUrl);
    }
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  toggleButtonText(idx: number): void {
    if (this.mobileLibraryGroupsProperties[idx].buttonText === 'See More') {
      this.mobileLibraryGroupsProperties[idx].buttonText = 'Collapse Section';
    } else {
      this.mobileLibraryGroupsProperties[idx].buttonText = 'See More';
    }
  }

  toggleCardContainerHeightInMobileView(idx: number): void {
    this.mobileLibraryGroupsProperties[idx].inCollapsedState =
      !this.mobileLibraryGroupsProperties[idx].inCollapsedState;
    this.toggleButtonText(idx);
  }

  setPageTitle(): void {
    let titleKey = 'I18N_LIBRARY_PAGE_TITLE';
    if (this.pageMode === LibraryPageConstants.LIBRARY_PAGE_MODES.GROUP ||
      this.pageMode === LibraryPageConstants.LIBRARY_PAGE_MODES.SEARCH) {
      titleKey = 'I18N_LIBRARY_PAGE_BROWSE_MODE_TITLE';
    }

    this.pageTitleService.setDocumentTitle(
      this.translateService.instant(titleKey));
  }

  ngOnInit(): void {
    let libraryWindowCutoffPx = 536;
    this.libraryWindowIsNarrow = (
      this.windowDimensionsService.getWidth() <= libraryWindowCutoffPx);

    this.loaderService.showLoadingScreen('I18N_LIBRARY_LOADING');
    this.bannerImageFilename = this.possibleBannerFilenames[
      Math.floor(Math.random() * this.possibleBannerFilenames.length)];
    this.bannerImageFileUrl = this.urlInterpolationService.getStaticImageUrl(
      '/library/' + this.bannerImageFilename);

    let currentPath = this.windowRef.nativeWindow.location.pathname;

    if (!LibraryPageConstants.LIBRARY_PATHS_TO_MODES.hasOwnProperty(
      currentPath)) {
      this.loggerService.error('INVALID URL PATH: ' + currentPath);
    }

    const libraryContants: Record<string, string> = (
      LibraryPageConstants.LIBRARY_PATHS_TO_MODES);
    this.pageMode = libraryContants[currentPath];
    this.LIBRARY_PAGE_MODES = LibraryPageConstants.LIBRARY_PAGE_MODES;

    this.translateSubscription = this.translateService.onLangChange.subscribe(
      () => {
        this.setPageTitle();
      });

    // Keeps track of the index of the left-most visible card of each
    // group.
    this.leftmostCardIndices = [];

    // Keeps track of the state of each library group when in mobile view
    // i.e. if they are in a collapsed state or not.
    this.mobileLibraryGroupsProperties = [];

    if (this.pageMode === LibraryPageConstants.LIBRARY_PAGE_MODES.GROUP) {
      let pathnameArray = (
        this.windowRef.nativeWindow.location.pathname.split('/'));
      this.groupName = pathnameArray[2];

      this.libraryPageBackendApiService.fetchLibraryGroupDataAsync(
        this.groupName).then((response) => {
        this.activityList = response.activity_list;
        this.groupHeaderI18nId = response.header_i18n_id;
        this.i18nLanguageCodeService.onPreferredLanguageCodesLoaded.emit(
          response.preferred_language_codes);
        this.loaderService.hideLoadingScreen();
        this.initCarousels();
      });
    } else {
      this.libraryPageBackendApiService.fetchLibraryIndexDataAsync()
        .then((response) => {
          this.libraryGroups = response.activity_summary_dicts_by_category;
          this.userService.getUserInfoAsync().then((userInfo) => {
            this.activitiesOwned = {explorations: {}, collections: {}};
            if (userInfo.isLoggedIn()) {
              this.libraryPageBackendApiService.fetchCreatorDashboardDataAsync()
                .then((response) => {
                  this.libraryGroups.forEach((libraryGroup) => {
                    let activitySummaryDicts = (
                      libraryGroup.activity_summary_dicts);

                    let ACTIVITY_TYPE_EXPLORATION = 'exploration';
                    let ACTIVITY_TYPE_COLLECTION = 'collection';

                    activitySummaryDicts.forEach((activitySummaryDict) => {
                      if (activitySummaryDict.activity_type === (
                        ACTIVITY_TYPE_EXPLORATION)) {
                        this.activitiesOwned.explorations[
                          activitySummaryDict.id] = false;
                      } else if (activitySummaryDict.activity_type === (
                        ACTIVITY_TYPE_COLLECTION)) {
                        this.activitiesOwned.collections[
                          activitySummaryDict.id] = false;
                      } else {
                        this.loggerService.error(
                          'INVALID ACTIVITY TYPE: Activity' +
                          '(id: ' + activitySummaryDict.id +
                          ', name: ' + activitySummaryDict.title +
                          ', type: ' + activitySummaryDict.activity_type +
                          ') has an invalid activity type, which could ' +
                          'not be recorded as an exploration or a ' +
                          'collection.'
                        );
                      }
                    });

                    response.explorations_list.forEach(
                      (ownedExplorations) => {
                        this.activitiesOwned.explorations[
                          ownedExplorations.id] = true;
                      });

                    response.collections_list.forEach((ownedCollections) => {
                      this.activitiesOwned.collections[
                        ownedCollections.id] = true;
                    });
                  });
                  this.loaderService.hideLoadingScreen();
                  this.initCarousels();
                });
            } else {
              this.loaderService.hideLoadingScreen();
              this.initCarousels();
            }
          });

          this.i18nLanguageCodeService.onPreferredLanguageCodesLoaded.emit(
            response.preferred_language_codes);

          this.keyboardShortcutService.bindLibraryPageShortcuts();

          // Check if actual and expected widths are the same.
          // If not produce an error that would be caught by e2e tests.
          setTimeout(() => {
            let actualWidth = $('oppia-exploration-summary-tile').width();
            if (actualWidth &&
              (actualWidth !== AppConstants.LIBRARY_TILE_WIDTH_PX &&
               actualWidth !== AppConstants.LIBRARY_MOBILE_TILE_WIDTH_PX)) {
              this.loggerService.error(
                'The actual width of tile is different than either of the ' +
                'expected widths. Actual size: ' + actualWidth +
                ', Expected sizes: ' + AppConstants.LIBRARY_TILE_WIDTH_PX +
                '/' + AppConstants.LIBRARY_MOBILE_TILE_WIDTH_PX);
            }
          }, 3000);
          // The following initializes the tracker to have all
          // elements flush left.
          // Transforms the group names into translation ids.
          this.leftmostCardIndices = [];
          for (let i = 0; i < this.libraryGroups.length; i++) {
            this.leftmostCardIndices.push(0);
          }
          // The following initializes the array so that every group
          // (in mobile view) loads in with a limit on the number of cards
          // displayed, and with the button text being "See More".
          for (let i = 0; i < this.libraryGroups.length; i++) {
            this.mobileLibraryGroupsProperties.push({
              inCollapsedState: true,
              buttonText: 'See More'
            });
          }
        });
    }

    this.resizeSubscription = this.windowDimensionsService.getResizeEvent()
      .subscribe(evt => {
        this.initCarousels();

        this.libraryWindowIsNarrow = (
          this.windowDimensionsService.getWidth() <= libraryWindowCutoffPx);
      });
  }

  ngOnDestroy(): void {
    if (this.translateSubscription) {
      this.translateSubscription.unsubscribe();
    }
    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
    }
  }
}
