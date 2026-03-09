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
 * @fileoverview Oppia root component.
 */

import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import {Subscription} from 'rxjs';
import {LoaderService} from 'services/loader.service';

@Component({
  selector: 'oppia-root',
  templateUrl: './oppia-root.component.html',
})
export class OppiaRootComponent implements OnInit, OnDestroy {
  loadingMessage: string = '';
  private directiveSubscriptions = new Subscription();

  constructor(
    private loaderService: LoaderService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Show loader during route transitions to prevent blank screen
    // while lazy-loaded modules are loading (see issue #24279).
    this.directiveSubscriptions.add(
      this.router.events.subscribe(event => {
        if (event instanceof NavigationStart) {
          this.loaderService.showLoadingScreen('Loading');
        } else if (event instanceof NavigationError) {
          this.loaderService.showLoadingScreen(
            'Failed to load. Try reloading.'
          );
        } else if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel
        ) {
          this.loaderService.hideLoadingScreen();
        }
      })
    );

    // Subscribe to LoaderService so the root-level loader stays visible
    // when page components call showLoadingScreen for data fetching.
    this.directiveSubscriptions.add(
      this.loaderService.onLoadingMessageChange.subscribe((message: string) => {
        this.loadingMessage = message;
        this.changeDetectorRef.detectChanges();
      })
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
