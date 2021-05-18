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
 * @fileoverview Directive for showing search results.
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { SearchService } from 'services/search.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { UserService } from 'services/user.service';
import { LoaderService } from 'services/loader.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'search-results',
  templateUrl: './search-results.component.html'
})

export class SearchResultsComponent implements OnInit, OnDestroy{
  someResultsExist: boolean;
  userIsLoggedIn: boolean;
  directiveSubscriptions: Subscription = new Subscription();
  constructor(
    private searchService: SearchService,
    private loaderService: LoaderService,
    private urlInterpolationService: UrlInterpolationService,
    private userService: UserService,
    private windowRef: WindowRef,
    private siteAnalyticsService: SiteAnalyticsService,
  ){}

  getStaticImageUrl(imagePath): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  };

  onRedirectToLogin(destinationUrl): boolean {
    this.siteAnalyticsService.registerStartLoginEvent('noSearchResults');
    setTimeout(() => {
      this.windowRef.nativeWindow.location = destinationUrl;
    }, 150);
    return false;
  };

  ngOnInit(): void {
    this.someResultsExist = false;
    this.userIsLoggedIn = false;
    this.loaderService.showLoadingScreen('Loading');
    this.userService.getUserInfoAsync().then((userInfo) => {
      this.userIsLoggedIn = userInfo.isLoggedIn();
    });

  // Called when the first batch of search results is retrieved from
  // the server.
    this.directiveSubscriptions.add(
      this.searchService.onInitialSearchResultsLoaded.subscribe(
        (activityList) => {
          this.someResultsExist = activityList.length > 0;
          this.userService.getUserInfoAsync().then((userInfo) => {
            this.userIsLoggedIn = userInfo.isLoggedIn();
            this.loaderService.hideLoadingScreen();
          });
        })
    );
  };

  ngOnDestroy = function() {
    this.directiveSubscriptions.unsubscribe();
  };
}

angular.module('oppia').directive(
  'searchResults', downgradeComponent({component: SearchResultsComponent}));