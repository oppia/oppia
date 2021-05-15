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
 * @fileoverview Data and directive for the Oppia contributors' library page.
 */
import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';

import { Component, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';

import constants from 'assets/constants';
import { ClassroomBackendApiService } from 'domain/classroom/classroom-backend-api.service';
import { CollectionSummaryBackendDict } from 'domain/collection/collection-summary.model';
import { CreatorExplorationSummaryBackendDict } from 'domain/summary/creator-exploration-summary.model';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { LibraryPageConstants } from 'pages/library-page/library-page.constants';
import { LoaderService } from 'services/loader.service';
import { LoggerService } from 'services/contextual/logger.service';
import { PageTitleService } from 'services/page-title.service';
import { SearchService } from 'services/search.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { UserService } from 'services/user.service'
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { WindowRef } from 'services/contextual/window-ref.service';

interface LibraryPageGroupData {
  'activity_list': ActivityDicts[],
  'header_i18n_id': string,
  'preferred_language_codes': string[],
}

interface ActivityDicts {  
    'activity_type': string                                        
    'category': string,
    'community_owned': boolean,
    'id': string,
    'language_code': string,
    'num_views': number,
    'objective': string,
    'status': string,
    'tags': [],
    'thumbnail_bg_color': string,
    'thumbnail_icon_url': string,
    'title': string,
}
interface SummaryDicts {
  'activity_summary_dicts': ActivityDicts[],
  'categories': [],
  'header_i18n_id': string,
  'has_full_results_page': boolean,
  'full_results_url': string,
  'protractor_id' ?: string,
}

interface LibraryIndexData {
  'activity_summary_dicts_by_category': SummaryDicts[],
  'preferred_language_codes': string[]
}

interface Activities {
  explorations: {},
  collections: {}
}

interface CreatorDashboardData {
  'explorations_list': CreatorExplorationSummaryBackendDict[];
  'collections_list': CollectionSummaryBackendDict[];
}

interface LibraryPageModes {
    GROUP: string,
    INDEX: string,
    SEARCH: string
}

@Component({
  selector: 'library-page',
  templateUrl: './library-page.component.html'
})

export class LibraryPageComponent implements OnInit, OnDestroy {
  activeGroupIndex: null | number;
  activitiesOwned: Activities;
  activityList: ActivityDicts[];
  bannerImageFilename: string;
  bannerImageFileUrl: string;
  groupName: string;
  groupHeaderI18nId: string;
  isAnyCarouselCurrentlyScrolling: boolean = false;
  index: number;
  leftmostCardIndices: number[];
  libraryGroups: LibraryIndexData['activity_summary_dicts_by_category'];
  libraryWindowIsNarrow: boolean;
  pageMode: string;
  possibleBannerFilenames: Array<string>;
  resizeSubscription: any;
  tileDisplayCount: number;
  CLASSROOM_PROMOS_ARE_ENABLED: boolean;
  // If the value below is changed, the following CSS values in
  // oppia.css must be changed:
  // - .oppia-exp-summary-tiles-container: max-width
  // - .oppia-library-carousel: max-width.
  MAX_NUM_TILES_PER_ROW: number = 4;
  LIBRARY_PAGE_MODES: LibraryPageModes;  

  constructor(
    private http: HttpClient,
    private classroomBackendApiService: ClassroomBackendApiService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private loaderService: LoaderService,
    private loggerService: LoggerService,
    private pageTitleService: PageTitleService,
    private searchService: SearchService,
    private urlInterpolationService: UrlInterpolationService,
    private userService: UserService,
    private windowDimensionsService: WindowDimensionsService,
    private windowRef: WindowRef,
  ) {}

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  };

  setActiveGroup(groupIndex): void {
    this.activeGroupIndex = groupIndex;
  };


  clearActiveGroup(): void {
    this.activeGroupIndex = null;
  };

  getLibraryPageGroupData(): void {
    this.http.get<LibraryPageGroupData>('/librarygrouphandler', {
      params: {
        group_name: this.groupName
      }
    }).toPromise().then((response) => {
        this.activityList = response.activity_list;

        this.groupHeaderI18nId = response.header_i18n_id;

        this.i18nLanguageCodeService.onPreferredLanguageCodesLoaded.emit(
          response.preferred_language_codes);

        this.loaderService.hideLoadingScreen();
      })
  }

  getCreatorDashboardPageData(): void {
    this.http.get<CreatorDashboardData>('/creatordashboardhandler/data').toPromise()
    .then((response) => {
      console.log(response)
      this.libraryGroups.forEach((libraryGroup) => {
        var activitySummaryDicts = (
          libraryGroup.activity_summary_dicts);

        var ACTIVITY_TYPE_EXPLORATION = 'exploration';
        var ACTIVITY_TYPE_COLLECTION = 'collection';
        activitySummaryDicts.forEach((
            activitySummaryDict) => {
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
        response.explorations_list
        .forEach((ownedExplorations) => {
          this.activitiesOwned.explorations[
            ownedExplorations.id] = true;
        });
        response.collections_list
        .forEach((ownedCollections)  =>{
          this.activitiesOwned.collections[
            ownedCollections.id] = true;
        });
    });
    this.loaderService.hideLoadingScreen();
  });
}
  getLibraryIndexPageData(): void {
    this.http.get<LibraryIndexData>('/libraryindexhandler').toPromise().then(
      (response) => {
      this.libraryGroups =
        response.activity_summary_dicts_by_category;
      this.userService.getUserInfoAsync().then((userInfo) => {
        this.activitiesOwned = {explorations: {}, collections: {}};
        if (userInfo.isLoggedIn()) {
          this.getCreatorDashboardPageData()
        } else {
          this.loaderService.hideLoadingScreen();
        }
      });

      this.i18nLanguageCodeService.onPreferredLanguageCodesLoaded.emit(
        response.preferred_language_codes);
      // // Initialize the carousel(s) on the library index page.
      // // Pause is necessary to ensure all elements have loaded.
      // setTimeout(this.initCarousels(), 390);
      // this.keyboardShortcutService.bindLibraryPageShortcuts();


      // Check if actual and expected widths are the same.
      // If not produce an error that would be caught by e2e tests.
      setTimeout(function() {
        var actualWidth = $('exploration-summary-tile').width();
        if (actualWidth && actualWidth !== constants.LIBRARY_TILE_WIDTH_PX) {
          this.loggerService.error(
            'The actual width of tile is different than the ' +
            'expected width. Actual size: ' + actualWidth +
            ', Expected size: ' + constants.LIBRARY_TILE_WIDTH_PX);
        }
      }, 3000);
      // The following initializes the tracker to have all
      // elements flush left.
      // Transforms the group names into translation ids.
      this.leftmostCardIndices = [];
      for (var i = 0; i < this.libraryGroups.length; i++) {
        this.leftmostCardIndices.push(0);
      }
    });
  }

  initCarousels(): void {
    // This prevents unnecessary execution of this method immediately
    // after a window resize event is fired.
    if (!this.libraryGroups) {
      return;
    }
    var windowWidth = this.windowDimensionsService.getWidth() * 0.85;
    // The number 20 is added to constants.LIBRARY_TILE_WIDTH_PX in order to
    // compensate for padding and margins. 20 is just an arbitrary
    // number.
    this.tileDisplayCount = Math.min(
      Math.floor(windowWidth / (constants.LIBRARY_TILE_WIDTH_PX + 20)),
      this.MAX_NUM_TILES_PER_ROW);

    $('.oppia-library-carousel').css({
      width: (this.tileDisplayCount * constants.LIBRARY_TILE_WIDTH_PX) + 'px'
    });

    // The following determines whether to enable left scroll after
    // resize.
    for (var i = 0; i < this.libraryGroups.length; i++) {
      var carouselJQuerySelector = (
        '.oppia-library-carousel-tiles:eq(n)'.replace(
          'n', String(i)));
      var carouselScrollPositionPx = $(
        carouselJQuerySelector).scrollLeft();
      var index = Math.ceil(
        carouselScrollPositionPx / constants.LIBRARY_TILE_WIDTH_PX);
      this.leftmostCardIndices[i] = index;
    }
  };

  // scroll(ind, isLeftScroll): void{
  //   if (this.isAnyCarouselCurrentlyScrolling) {
  //     return;
  //   }
  //   var carouselJQuerySelector = (
  //     '.oppia-library-carousel-tiles:eq(n)'.replace('n', ind));

  //   var direction = isLeftScroll ? -1 : 1;
  //   var carouselScrollPositionPx = $(
  //     carouselJQuerySelector).scrollLeft();

  //   // Prevent scrolling if there more carousel pixed widths than
  //   // there are tile widths.
  //   if (this.libraryGroups[ind].activity_summary_dicts.length <=
  //       this.tileDisplayCount) {
  //     return;
  //   }
  //   carouselScrollPositionPx = Math.max(0, carouselScrollPositionPx);
  //   if (isLeftScroll) {
  //     this.leftmostCardIndices[ind] = Math.max(
  //       0, this.leftmostCardIndices[ind] - this.tileDisplayCount);
  //   } else {
  //     this.leftmostCardIndices[ind] = Math.min(
  //       this.libraryGroups[ind].activity_summary_dicts.length -
  //         this.tileDisplayCount + 1,
  //       this.leftmostCardIndices[ind] + this.tileDisplayCount);
  //   }
  //   var newScrollPositionPx = carouselScrollPositionPx +
  //     (this.tileDisplayCount * constants.LIBRARY_TILE_WIDTH_PX * direction);

  //   $(carouselJQuerySelector).animate({
  //     scrollLeft: newScrollPositionPx
  //   }, {
  //     duration: 800,
  //     queue: false,
  //     start: function() {
  //       this.isAnyCarouselCurrentlyScrolling = true;
  //     },
  //     complete: function() {
  //       this.isAnyCarouselCurrentlyScrolling = false;
  //     }
  //   });
  // };

  // The following loads explorations belonging to a particular group.
  // If fullResultsUrl is given it loads the page corresponding to
  // the url. Otherwise, it will initiate a search query for the
  // given list of categories.
  showFullResultsPage(categories, fullResultsUrl): void{
    if (fullResultsUrl) {
      this.windowRef.nativeWindow.location.href = fullResultsUrl;
    } else {
      var selectedCategories = {};
      for (var i = 0; i < categories.length; i++) {
        selectedCategories[categories[i]] = true;
      }

      var targetSearchQueryUrl = this.searchService.getSearchUrlQueryString(
        '', selectedCategories, {});
      this.windowRef.nativeWindow.location.href = '/search/find?q=' + targetSearchQueryUrl;
    }
  };

  // The carousels do not work when the width is 1 card long, so we need
  // to handle this case discretely and also prevent swiping past the
  // first and last card.
  incrementLeftmostCardIndex(ind): void{
    var lastItem = ((
      this.libraryGroups[ind].activity_summary_dicts.length -
      this.tileDisplayCount) <= this.leftmostCardIndices[ind]);
    if (!lastItem) {
      this.leftmostCardIndices[ind]++;
    }
  };

  decrementLeftmostCardIndex(ind): void{
    this.leftmostCardIndices[ind] = (
      Math.max(this.leftmostCardIndices[ind] - 1, 0));
  };

  ngOnInit(): void {
    var currentPath = this.windowRef.nativeWindow.location.pathname;
    var title = 'Community Library Lessons | Oppia';
    this.loaderService.showLoadingScreen('I18N_LIBRARY_LOADING');
    this.CLASSROOM_PROMOS_ARE_ENABLED = false;
    this.activeGroupIndex = null;
    var libraryWindowCutoffPx = 530;
    this.libraryGroups=[];
    this.activitiesOwned = {
      explorations: {},
      collections: {}
    }
    this.possibleBannerFilenames = [
      'banner1.svg', 'banner2.svg', 'banner3.svg', 'banner4.svg'];
    this.pageMode = LibraryPageConstants.LIBRARY_PATHS_TO_MODES[currentPath];
    this.LIBRARY_PAGE_MODES = LibraryPageConstants.LIBRARY_PAGE_MODES;
    this.bannerImageFilename = this.possibleBannerFilenames[
      Math.floor(Math.random() * this.possibleBannerFilenames.length)];
      this.bannerImageFileUrl = this.getStaticImageUrl(
        '/library/' + this.bannerImageFilename);
        this.classroomBackendApiService.fetchClassroomPromosAreEnabledStatusAsync().then(
          (classroomPromosAreEnabled) => {
            this.CLASSROOM_PROMOS_ARE_ENABLED = classroomPromosAreEnabled;
          });
          if (!LibraryPageConstants.LIBRARY_PATHS_TO_MODES.hasOwnProperty(currentPath)) {
            this.loggerService.error('INVALID URL PATH: ' + currentPath);
          }
          if (this.pageMode === this.LIBRARY_PAGE_MODES.GROUP ||
            this.pageMode === this.LIBRARY_PAGE_MODES.SEARCH) {
          title = 'Find explorations to learn from - Oppia';
        }
        this.pageTitleService.setPageTitle(title);
    
        // Keeps track of the index of the left-most visible card of each
        // group.
        this.leftmostCardIndices = [];
    
        if (this.pageMode === this.LIBRARY_PAGE_MODES.GROUP) {
          var pathnameArray = this.windowRef.nativeWindow.location.pathname.split('/');
          this.groupName = pathnameArray[2];
          this.getLibraryPageGroupData();
        } else {
          this.getLibraryIndexPageData();
        }
        this.tileDisplayCount = 0;
        this.libraryWindowIsNarrow = (
          this.windowDimensionsService.getWidth() <= libraryWindowCutoffPx);
    
        this.resizeSubscription = this.windowDimensionsService.getResizeEvent().
          subscribe(evt => {
            this.initCarousels();
            this.libraryWindowIsNarrow = (
              this.windowDimensionsService.getWidth() <= libraryWindowCutoffPx);
          });
      }
    
      ngOnDestroy() {
        if (this.resizeSubscription) {
          this.resizeSubscription.unsubscribe();
        }
      };
    }
    
angular.module('oppia').directive(
  'libraryPage', downgradeComponent({component: LibraryPageComponent}));
