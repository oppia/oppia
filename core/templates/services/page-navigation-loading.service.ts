// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to manage loading state during page navigation.
 * This service shows a loading indicator when navigating between routes
 * (especially during lazy-loaded module transitions) and handles edge cases
 * like navigation cancellation and errors.
 *
 * Why this service exists at the root level:
 * The existing LoaderService displays via oppia-loading-message inside
 * BaseContentComponent, which is part of each lazy-loaded page module.
 * During route navigation, the current page's BaseContentComponent is
 * destroyed before the new module loads, leaving no component to render
 * the loader. This service provides a root-level loading state that
 * persists across navigation transitions.
 */

import {Injectable, OnDestroy} from '@angular/core';
import {
  Router,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
  RouterEvent,
  Event,
} from '@angular/router';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PageNavigationLoadingService implements OnDestroy {
  // Minimum loading time in ms to prevent flash of loading indicator
  // for fast navigations.
  private readonly MINIMUM_LOADING_DURATION_MS = 200;
  // Maximum time to show loading indicator before auto-hiding (safety timeout).
  private readonly LOADING_TIMEOUT_MS = 30000;

  // Start with loading=true to prevent blank screen gap when Angular
  // bootstraps and replaces the static loader. The initial navigation
  // will trigger NavigationEnd which hides the loader.
  private isLoadingSubject = new BehaviorSubject<boolean>(true);
  private routerSubscription: Subscription | null = null;
  private loadingStartTime: number | null = Date.now();
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private minimumDurationTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private pendingHide = false;

  /**
   * Observable that emits the current loading state.
   * True when navigation is in progress, false otherwise.
   */
  get isLoading$(): Observable<boolean> {
    return this.isLoadingSubject.asObservable();
  }

  /**
   * Synchronously returns the current loading state.
   */
  get isLoading(): boolean {
    return this.isLoadingSubject.value;
  }

  constructor(private router: Router) {
    this.initializeRouterListener();
  }

  /**
   * Initializes the router event listener to track navigation state.
   */
  private initializeRouterListener(): void {
    this.routerSubscription = this.router.events.subscribe((event: Event) => {
      this.handleRouterEvent(event as RouterEvent);
    });
  }

  /**
   * Handles router events and updates loading state accordingly.
   */
  private handleRouterEvent(event: RouterEvent): void {
    if (event instanceof NavigationStart) {
      this.showLoading();
    } else if (
      event instanceof NavigationEnd ||
      event instanceof NavigationCancel ||
      event instanceof NavigationError
    ) {
      this.hideLoading();
    }
  }

  /**
   * Shows the loading indicator and starts the safety timeout.
   */
  private showLoading(): void {
    // Clear any pending hide operation from a previous navigation.
    this.pendingHide = false;
    if (this.minimumDurationTimeoutId !== null) {
      clearTimeout(this.minimumDurationTimeoutId);
      this.minimumDurationTimeoutId = null;
    }

    this.loadingStartTime = Date.now();
    this.isLoadingSubject.next(true);

    // Safety timeout to prevent infinite loading state.
    this.clearTimeouts();
    this.timeoutId = setTimeout(() => {
      if (this.isLoadingSubject.value) {
        this.isLoadingSubject.next(false);
      }
    }, this.LOADING_TIMEOUT_MS);
  }

  /**
   * Hides the loading indicator, respecting minimum duration.
   */
  private hideLoading(): void {
    if (this.loadingStartTime === null) {
      this.isLoadingSubject.next(false);
      this.clearTimeouts();
      return;
    }

    const elapsedTime = Date.now() - this.loadingStartTime;
    const remainingTime = this.MINIMUM_LOADING_DURATION_MS - elapsedTime;

    if (remainingTime > 0) {
      // Wait for minimum duration to prevent loading indicator flash.
      this.pendingHide = true;
      this.minimumDurationTimeoutId = setTimeout(() => {
        if (this.pendingHide) {
          this.isLoadingSubject.next(false);
          this.loadingStartTime = null;
          this.pendingHide = false;
        }
      }, remainingTime);
    } else {
      this.isLoadingSubject.next(false);
      this.loadingStartTime = null;
    }

    // Clear safety timeout since navigation completed.
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * Clears all active timeouts.
   */
  private clearTimeouts(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.minimumDurationTimeoutId !== null) {
      clearTimeout(this.minimumDurationTimeoutId);
      this.minimumDurationTimeoutId = null;
    }
  }

  ngOnDestroy(): void {
    this.clearTimeouts();
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
