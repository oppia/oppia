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

import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { ClassroomBackendApiService } from 'domain/classroom/classroom-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { Subscription } from 'rxjs';
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

@Component({
  selector: 'oppia-library-page',
  templateUrl: './library-page.component.html'
})
export class LibraryPageComponent {
  possibleBannerFilenames = [
    'banner1.svg', 'banner2.svg', 'banner3.svg', 'banner4.svg'];
  // If the value below is changed, the following CSS values in
  // oppia.css must be changed:
  // - .oppia-exp-summary-tiles-container: max-width
  // - .oppia-library-carousel: max-width.
  MAX_NUM_TILES_PER_ROW = 4;
  isAnyCarouselCurrentlyScrolling = false;
  CLASSROOM_PROMOS_ARE_ENABLED = false;
  tileDisplayCount: number = 0;
  activeGroupIndex;
  libraryGroups;
  leftmostCardIndices: number[] = [];
  currentPath: string;
  pageMode;
  LIBRARY_PAGE_MODES = LibraryPageConstants.LIBRARY_PAGE_MODES;
  bannerImageFilename: string;
  bannerImageFileUrl: string;
  groupName: string;
  activityList;
  groupHeaderI18nId: string;
  activitiesOwned = {
    explorations: {},
    collections: {}
  };
  libraryWindowIsNarrow: boolean;
  resizeSubscription: Subscription;

  constructor(
    private httpClient: HttpClient,
    private loggerService: LoggerService,
    private windowRef: WindowRef,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private keyboardShortcutService: KeyboardShortcutService,
    private loaderService: LoaderService,
    private searchService: SearchService,
    private urlInterpolationService: UrlInterpolationService,
    private userService: UserService,
    private windowDimensionsService: WindowDimensionsService,
    private classroomBackendApiService: ClassroomBackendApiService,
    private pageTitleService: PageTitleService
  ) {}

  setActiveGroup(groupIndex: number): void {
    this.activeGroupIndex = groupIndex;
  }

  clearActiveGroup(): void {
    this.activeGroupIndex = null;
  }

  initCarousels(): void {
    // This prevents unnecessary execution of this method immediately
    // after a window resize event is fired.
    if (!this.libraryGroups) {
      return;
    }

    let windowWidth = $(window).width() * 0.85;
    // The number 20 is added to LIBRARY_TILE_WIDTH_PX in order to
    // compensate for padding and margins. 20 is just an arbitrary
    // number.
    this.tileDisplayCount = Math.min(
      Math.floor(windowWidth / (AppConstants.LIBRARY_TILE_WIDTH_PX + 20)),
      this.MAX_NUM_TILES_PER_ROW);

    $('.oppia-library-carousel').css({
      width: (this.tileDisplayCount * AppConstants.LIBRARY_TILE_WIDTH_PX) + 'px'
    });

    // The following determines whether to enable left scroll after
    // resize.
    for (let i = 0; i < this.libraryGroups.length; i++) {
      let carouselJQuerySelector = (
        '.oppia-library-carousel-tiles:eq(n)'.replace(
          'n', String(i)));
      let carouselScrollPositionPx = $(
        carouselJQuerySelector).scrollLeft();
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
      '.oppia-library-carousel-tiles:eq(n)'.replace('n', ind));

    let direction = isLeftScroll ? -1 : 1;
    let carouselScrollPositionPx = $(
      carouselJQuerySelector).scrollLeft();

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
        console.debug(this);
        this.isAnyCarouselCurrentlyScrolling = true;
      },
      complete: () => {
        console.debug(this);
        this.isAnyCarouselCurrentlyScrolling = false;
      }
    });
  };


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
  showFullResultsPage(categories, fullResultsUrl: string): void {
    if (fullResultsUrl) {
      this.windowRef.nativeWindow.location.href = fullResultsUrl;
    } else {
      let selectedCategories = {};
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

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('I18N_LIBRARY_LOADING');
    this.bannerImageFilename = this.possibleBannerFilenames[
      Math.floor(Math.random() * this.possibleBannerFilenames.length)];
    this.bannerImageFileUrl = this.urlInterpolationService.getStaticImageUrl(
      '/library/' + this.bannerImageFilename);

    this.classroomBackendApiService.fetchClassroomPromosAreEnabledStatusAsync()
      .then((classroomPromosAreEnabled) => {
        this.CLASSROOM_PROMOS_ARE_ENABLED = classroomPromosAreEnabled;
      });

    let currentPath = this.windowRef.nativeWindow.location.pathname;

    if (!LibraryPageConstants.LIBRARY_PATHS_TO_MODES.hasOwnProperty(
      currentPath)) {
      this.loggerService.error('INVALID URL PATH: ' + currentPath);
    }

    this.pageMode = LibraryPageConstants.LIBRARY_PATHS_TO_MODES[currentPath];
    this.LIBRARY_PAGE_MODES = LibraryPageConstants.LIBRARY_PAGE_MODES;

    let title = 'Community Library Lessons | Oppia';
    if (this.pageMode === LibraryPageConstants.LIBRARY_PAGE_MODES.GROUP ||
      this.pageMode === LibraryPageConstants.LIBRARY_PAGE_MODES.SEARCH) {
      title = 'Find explorations to learn from - Oppia';
    }

    this.pageTitleService.setPageTitle(title);

    // Keeps track of the index of the left-most visible card of each
    // group.
    this.leftmostCardIndices = [];

    if (this.pageMode === LibraryPageConstants.LIBRARY_PAGE_MODES.GROUP) {
      let pathnameArray = (
        this.windowRef.nativeWindow.location.pathname.split('/'));
      this.groupName = pathnameArray[2];

      this.httpClient.get('/librarygrouphandler', {
        params: {
          group_name: this.groupName
        }
      }).toPromise().then((response) => {
        this.activityList = response.activity_list;
        this.groupHeaderI18nId = response.header_i18n_id;
        this.i18nLanguageCodeService.onPreferredLanguageCodesLoaded.emit(
          response.preferred_language_code);

        this.loaderService.hideLoadingScreen();
      });
    } else {
      this.httpClient.get('/libraryindexhandler').toPromise()
        .then((response) => {
          this.libraryGroups = response.activity_summary_dicts_by_category;
          this.userService.getUserInfoAsync().then((userInfo) => {
            this.activitiesOwned = {explorations: {}, collections: {}};
            if (userInfo.isLoggedIn()) {
              this.httpClient.get('/creatordashboardhandler/data').toPromise()
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
                });
            } else {
              this.loaderService.hideLoadingScreen();
            }
          });

          this.i18nLanguageCodeService.onPreferredLanguageCodesLoaded.emit(
            response.preferred_language_codes);


          // Initialize the carousel(s) on the library index page.
          // Pause is necessary to ensure all elements have loaded.
          setTimeout(this.initCarousels, 390);
          this.keyboardShortcutService.bindLibraryPageShortcuts();

          // Check if actual and expected widths are the same.
          // If not produce an error that would be caught by e2e tests.
          setTimeout(() => {
            let actualWidth = $('exploration-summary-tile').width();
            if (actualWidth &&
              actualWidth !== AppConstants.LIBRARY_TILE_WIDTH_PX) {
              this.loggerService.error(
                'The actual width of tile is different than the ' +
                'expected width. Actual size: ' + actualWidth +
                ', Expected size: ' + AppConstants.LIBRARY_TILE_WIDTH_PX);
            }
          }, 3000);
          // The following initializes the tracker to have all
          // elements flush left.
          // Transforms the group names into translation ids.
          this.leftmostCardIndices = [];
          for (let i = 0; i < this.libraryGroups.length; i++) {
            this.leftmostCardIndices.push(0);
          }
        });
    }

    let libraryWindowCutoffPx = 530;
    this.libraryWindowIsNarrow = (
      this.windowDimensionsService.getWidth() <= libraryWindowCutoffPx);

    this.resizeSubscription = this.windowDimensionsService.getResizeEvent()
      .subscribe(evt => {
        this.initCarousels();

        this.libraryWindowIsNarrow = (
          this.windowDimensionsService.getWidth() <= libraryWindowCutoffPx);
      });
  }

  ngOnDestroy(): void {
    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
    }
  }
}

angular.module('oppia').directive('oppiaLibraryPage',
  downgradeComponent({
    component: LibraryPageComponent
  }) as angular.IDirectiveFactory);

// angular.module('oppia').component('libraryPage', {
//   template: require('./library-page.component.html'),
//   controller: [
//     '$http', '$log', '$rootScope', '$scope', '$timeout', '$window',
//     'I18nLanguageCodeService', 'KeyboardShortcutService', 'LoaderService',
//     'SearchService', 'UrlInterpolationService',
//     'UserService', 'WindowDimensionsService', 'LIBRARY_PAGE_MODES',
//     'LIBRARY_PATHS_TO_MODES', 'LIBRARY_TILE_WIDTH_PX',
//     function(
//         $http, $log, $rootScope, $scope, $timeout, $window,
//         I18nLanguageCodeService, KeyboardShortcutService, LoaderService,
//         SearchService, UrlInterpolationService,
//         UserService, WindowDimensionsService, LIBRARY_PAGE_MODES,
//         LIBRARY_PATHS_TO_MODES, LIBRARY_TILE_WIDTH_PX) {
//       var ctrl = this;

//       ctrl.classroomBackendApiService = (
//         OppiaAngularRootComponent.classroomBackendApiService);
//       ctrl.pageTitleService = (
//         OppiaAngularRootComponent.pageTitleService);

//       var possibleBannerFilenames = [
//         'banner1.svg', 'banner2.svg', 'banner3.svg', 'banner4.svg'];
//       // If the value below is changed, the following CSS values in
//       // oppia.css must be changed:
//       // - .oppia-exp-summary-tiles-container: max-width
//       // - .oppia-library-carousel: max-width.
//       var MAX_NUM_TILES_PER_ROW = 4;
//       var isAnyCarouselCurrentlyScrolling = false;

//       ctrl.CLASSROOM_PROMOS_ARE_ENABLED = false;

//       ctrl.setActiveGroup = function(groupIndex) {
//         ctrl.activeGroupIndex = groupIndex;
//       };

//       ctrl.clearActiveGroup = function() {
//         ctrl.activeGroupIndex = null;
//       };

//       var initCarousels = function() {
//         // This prevents unnecessary execution of this method immediately
//         // after a window resize event is fired.
//         if (!ctrl.libraryGroups) {
//           return;
//         }

//         var windowWidth = $(window).width() * 0.85;
//         // The number 20 is added to LIBRARY_TILE_WIDTH_PX in order to
//         // compensate for padding and margins. 20 is just an arbitrary
//         // number.
//         ctrl.tileDisplayCount = Math.min(
//           Math.floor(windowWidth / (LIBRARY_TILE_WIDTH_PX + 20)),
//           MAX_NUM_TILES_PER_ROW);

//         $('.oppia-library-carousel').css({
//           width: (ctrl.tileDisplayCount * LIBRARY_TILE_WIDTH_PX) + 'px'
//         });

//         // The following determines whether to enable left scroll after
//         // resize.
//         for (var i = 0; i < ctrl.libraryGroups.length; i++) {
//           var carouselJQuerySelector = (
//             '.oppia-library-carousel-tiles:eq(n)'.replace(
//               'n', String(i)));
//           var carouselScrollPositionPx = $(
//             carouselJQuerySelector).scrollLeft();
//           var index = Math.ceil(
//             carouselScrollPositionPx / LIBRARY_TILE_WIDTH_PX);
//           ctrl.leftmostCardIndices[i] = index;
//         }
//       };

//       ctrl.scroll = function(ind, isLeftScroll) {
//         if (isAnyCarouselCurrentlyScrolling) {
//           return;
//         }
//         var carouselJQuerySelector = (
//           '.oppia-library-carousel-tiles:eq(n)'.replace('n', ind));

//         var direction = isLeftScroll ? -1 : 1;
//         var carouselScrollPositionPx = $(
//           carouselJQuerySelector).scrollLeft();

//         // Prevent scrolling if there more carousel pixed widths than
//         // there are tile widths.
//         if (ctrl.libraryGroups[ind].activity_summary_dicts.length <=
//             ctrl.tileDisplayCount) {
//           return;
//         }

//         carouselScrollPositionPx = Math.max(0, carouselScrollPositionPx);

//         if (isLeftScroll) {
//           ctrl.leftmostCardIndices[ind] = Math.max(
//             0, ctrl.leftmostCardIndices[ind] - ctrl.tileDisplayCount);
//         } else {
//           ctrl.leftmostCardIndices[ind] = Math.min(
//             ctrl.libraryGroups[ind].activity_summary_dicts.length -
//               ctrl.tileDisplayCount + 1,
//             ctrl.leftmostCardIndices[ind] + ctrl.tileDisplayCount);
//         }

//         var newScrollPositionPx = carouselScrollPositionPx +
//           (ctrl.tileDisplayCount * LIBRARY_TILE_WIDTH_PX * direction);

//         $(carouselJQuerySelector).animate({
//           scrollLeft: newScrollPositionPx
//         }, {
//           duration: 800,
//           queue: false,
//           start: function() {
//             isAnyCarouselCurrentlyScrolling = true;
//           },
//           complete: function() {
//             isAnyCarouselCurrentlyScrolling = false;
//           }
//         });
//       };

//       // The carousels do not work when the width is 1 card long, so we need
//       // to handle this case discretely and also prevent swiping past the
//       // first and last card.
//       ctrl.incrementLeftmostCardIndex = function(ind) {
//         var lastItem = ((
//           ctrl.libraryGroups[ind].activity_summary_dicts.length -
//           ctrl.tileDisplayCount) <= ctrl.leftmostCardIndices[ind]);
//         if (!lastItem) {
//           ctrl.leftmostCardIndices[ind]++;
//         }
//       };
//       ctrl.decrementLeftmostCardIndex = function(ind) {
//         ctrl.leftmostCardIndices[ind] = (
//           Math.max(ctrl.leftmostCardIndices[ind] - 1, 0));
//       };

//       // The following loads explorations belonging to a particular group.
//       // If fullResultsUrl is given it loads the page corresponding to
//       // the url. Otherwise, it will initiate a search query for the
//       // given list of categories.
//       ctrl.showFullResultsPage = function(categories, fullResultsUrl) {
//         if (fullResultsUrl) {
//           $window.location.href = fullResultsUrl;
//         } else {
//           var selectedCategories = {};
//           for (var i = 0; i < categories.length; i++) {
//             selectedCategories[categories[i]] = true;
//           }

//           var targetSearchQueryUrl = SearchService.getSearchUrlQueryString(
//             '', selectedCategories, {});
//           $window.location.href = '/search/find?q=' + targetSearchQueryUrl;
//         }
//       };
//       ctrl.$onInit = function() {
//         LoaderService.showLoadingScreen('I18N_LIBRARY_LOADING');
//         ctrl.bannerImageFilename = possibleBannerFilenames[
//           Math.floor(Math.random() * possibleBannerFilenames.length)];

//         ctrl.bannerImageFileUrl = UrlInterpolationService.getStaticImageUrl(
//           '/library/' + ctrl.bannerImageFilename);

//         ctrl.getStaticImageUrl = function(imagePath) {
//           return UrlInterpolationService.getStaticImageUrl(imagePath);
//         };

//         let service = ctrl.classroomBackendApiService;
//         service.fetchClassroomPromosAreEnabledStatusAsync().then(
//           function(classroomPromosAreEnabled) {
//             ctrl.CLASSROOM_PROMOS_ARE_ENABLED = classroomPromosAreEnabled;
//           });

//         ctrl.activeGroupIndex = null;

//         var currentPath = $window.location.pathname;
//         if (!LIBRARY_PATHS_TO_MODES.hasOwnProperty(currentPath)) {
//           $log.error('INVALID URL PATH: ' + currentPath);
//         }
//         ctrl.pageMode = LIBRARY_PATHS_TO_MODES[currentPath];
//         ctrl.LIBRARY_PAGE_MODES = LIBRARY_PAGE_MODES;

//         var title = 'Community Library Lessons | Oppia';
//         if (ctrl.pageMode === LIBRARY_PAGE_MODES.GROUP ||
//             ctrl.pageMode === LIBRARY_PAGE_MODES.SEARCH) {
//           title = 'Find explorations to learn from - Oppia';
//         }
//         ctrl.pageTitleService.setPageTitle(title);

//         // Keeps track of the index of the left-most visible card of each
//         // group.
//         ctrl.leftmostCardIndices = [];

//         if (ctrl.pageMode === LIBRARY_PAGE_MODES.GROUP) {
//           var pathnameArray = $window.location.pathname.split('/');
//           ctrl.groupName = pathnameArray[2];

//           $http.get('/librarygrouphandler', {
//             params: {
//               group_name: ctrl.groupName
//             }
//           }).then(
//             function(response) {
//               ctrl.activityList = response.data.activity_list;

//               ctrl.groupHeaderI18nId = response.data.header_i18n_id;

//               I18nLanguageCodeService.onPreferredLanguageCodesLoaded.emit(
//                 response.data.preferred_language_codes);

//               LoaderService.hideLoadingScreen();
//             });
//         } else {
//           $http.get('/libraryindexhandler').then(function(response) {
//             ctrl.libraryGroups =
//               response.data.activity_summary_dicts_by_category;
//             UserService.getUserInfoAsync().then(function(userInfo) {
//               ctrl.activitiesOwned = {explorations: {}, collections: {}};
//               if (userInfo.isLoggedIn()) {
//                 $http.get('/creatordashboardhandler/data')
//                   .then(function(response) {
//                     ctrl.libraryGroups.forEach(function(libraryGroup) {
//                       var activitySummaryDicts = (
//                         libraryGroup.activity_summary_dicts);

//                       var ACTIVITY_TYPE_EXPLORATION = 'exploration';
//                       var ACTIVITY_TYPE_COLLECTION = 'collection';
//                       activitySummaryDicts.forEach(function(
//                           activitySummaryDict) {
//                         if (activitySummaryDict.activity_type === (
//                           ACTIVITY_TYPE_EXPLORATION)) {
//                           ctrl.activitiesOwned.explorations[
//                             activitySummaryDict.id] = false;
//                         } else if (activitySummaryDict.activity_type === (
//                           ACTIVITY_TYPE_COLLECTION)) {
//                           ctrl.activitiesOwned.collections[
//                             activitySummaryDict.id] = false;
//                         } else {
//                           $log.error(
//                             'INVALID ACTIVITY TYPE: Activity' +
//                             '(id: ' + activitySummaryDict.id +
//                             ', name: ' + activitySummaryDict.title +
//                             ', type: ' + activitySummaryDict.activity_type +
//                             ') has an invalid activity type, which could ' +
//                             'not be recorded as an exploration or a ' +
//                             'collection.'
//                           );
//                         }
//                       });

//                       response.data.explorations_list
//                         .forEach(function(ownedExplorations) {
//                           ctrl.activitiesOwned.explorations[
//                             ownedExplorations.id] = true;
//                         });

//                       response.data.collections_list
//                         .forEach(function(ownedCollections) {
//                           ctrl.activitiesOwned.collections[
//                             ownedCollections.id] = true;
//                         });
//                     });
//                     LoaderService.hideLoadingScreen();
//                   });
//               } else {
//                 LoaderService.hideLoadingScreen();
//               }
//               // TODO(#8521): Remove the use of $rootScope.$apply()
//               // once the controller is migrated to angular.
//               $rootScope.$applyAsync();
//             });

//             I18nLanguageCodeService.onPreferredLanguageCodesLoaded.emit(
//               response.data.preferred_language_codes);

//             // Initialize the carousel(s) on the library index page.
//             // Pause is necessary to ensure all elements have loaded.
//             $timeout(initCarousels, 390);
//             KeyboardShortcutService.bindLibraryPageShortcuts();


//             // Check if actual and expected widths are the same.
//             // If not produce an error that would be caught by e2e tests.
//             $timeout(function() {
//               var actualWidth = $('exploration-summary-tile').width();
//               if (actualWidth && actualWidth !== LIBRARY_TILE_WIDTH_PX) {
//                 $log.error(
//                   'The actual width of tile is different than the ' +
//                   'expected width. Actual size: ' + actualWidth +
//                   ', Expected size: ' + LIBRARY_TILE_WIDTH_PX);
//               }
//             }, 3000);
//             // The following initializes the tracker to have all
//             // elements flush left.
//             // Transforms the group names into translation ids.
//             ctrl.leftmostCardIndices = [];
//             for (var i = 0; i < ctrl.libraryGroups.length; i++) {
//               ctrl.leftmostCardIndices.push(0);
//             }
//           });
//         }
//         ctrl.tileDisplayCount = 0;

//         var libraryWindowCutoffPx = 530;
//         ctrl.libraryWindowIsNarrow = (
//           WindowDimensionsService.getWidth() <= libraryWindowCutoffPx);

//         ctrl.resizeSubscription = WindowDimensionsService.getResizeEvent().
//           subscribe(evt => {
//             initCarousels();

//             ctrl.libraryWindowIsNarrow = (
//               WindowDimensionsService.getWidth() <= libraryWindowCutoffPx);
//             $scope.$applyAsync();
//           });
//       };
//       ctrl.$onDestroy = function() {
//         if (ctrl.resizeSubscription) {
//           ctrl.resizeSubscription.unsubscribe();
//         }
//       };
//     }
//   ]
// });
