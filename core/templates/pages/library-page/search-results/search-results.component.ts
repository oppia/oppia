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
 * @fileoverview Component for showing search results.
 */

import {Component} from '@angular/core';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {Subscription} from 'rxjs';
import {WindowRef} from 'services/contextual/window-ref.service';
import {LoaderService} from 'services/loader.service';
import {SearchService} from 'services/search.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {UserService} from 'services/user.service';

@Component({
  selector: 'oppia-search-results',
  templateUrl: './search-results.component.html',
})
export class SearchResultsComponent {
  directiveSubscriptions = new Subscription();
  someResultsExist: boolean = true;
  userIsLoggedIn: boolean = false;

  constructor(
    private windowRef: WindowRef,
    private loaderService: LoaderService,
    private searchService: SearchService,
    private siteAnalyticsService: SiteAnalyticsService,
    private urlInterpolationService: UrlInterpolationService,
    private userService: UserService
  ) {}

  getStaticCopyrightedImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticCopyrightedImageUrl(imagePath);
  }

  onRedirectToLogin(destinationUrl: string): boolean {
    this.siteAnalyticsService.registerStartLoginEvent('noSearchResults');
    setTimeout(() => {
      this.windowRef.nativeWindow.location.href = destinationUrl;
    }, 150);
    return false;
  }

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading');
    let userInfoPromise = this.userService.getUserInfoAsync();
    userInfoPromise.then(userInfo => {
      this.userIsLoggedIn = userInfo.isLoggedIn();
    });

    // Called when the first batch of search results is retrieved from
    // the server.
    this.directiveSubscriptions.add(
      this.searchService.onInitialSearchResultsLoaded.subscribe(
        activityList => {
          this.someResultsExist = activityList.length > 0;
          userInfoPromise.then(userInfo => {
            this.userIsLoggedIn = userInfo.isLoggedIn();
            this.loaderService.hideLoadingScreen();
            this.siteAnalyticsService.registerSearchResultsViewedEvent();
          });
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
