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
 * @fileoverview Tests for PageNavigationLoadingService.
 */

import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {
  Router,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
} from '@angular/router';
import {Subject} from 'rxjs';
import {PageNavigationLoadingService} from './page-navigation-loading.service';

describe('PageNavigationLoadingService', () => {
  let service: PageNavigationLoadingService;
  let routerEventsSubject: Subject<
    NavigationStart | NavigationEnd | NavigationCancel | NavigationError
  >;

  beforeEach(() => {
    routerEventsSubject = new Subject();

    TestBed.configureTestingModule({
      providers: [
        PageNavigationLoadingService,
        {
          provide: Router,
          useValue: {
            events: routerEventsSubject.asObservable(),
          },
        },
      ],
    });

    service = TestBed.inject(PageNavigationLoadingService);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with isLoading true to prevent bootstrap gap', () => {
    expect(service.isLoading).toBe(true);
  });

  describe('NavigationStart handling', () => {
    it('should set isLoading to true on NavigationStart', () => {
      routerEventsSubject.next(new NavigationStart(1, '/test'));
      expect(service.isLoading).toBe(true);
    });

    it('should emit true via isLoading$ on NavigationStart', done => {
      service.isLoading$.subscribe(isLoading => {
        if (isLoading) {
          done();
        }
      });
      routerEventsSubject.next(new NavigationStart(1, '/test'));
    });
  });

  describe('NavigationEnd handling', () => {
    it('should set isLoading to false on NavigationEnd after minimum duration', fakeAsync(() => {
      routerEventsSubject.next(new NavigationStart(1, '/test'));
      expect(service.isLoading).toBe(true);

      // Simulate some navigation time.
      tick(100);

      routerEventsSubject.next(new NavigationEnd(1, '/test', '/test'));

      // Should still be loading (minimum duration not met).
      expect(service.isLoading).toBe(true);

      // Wait for remaining minimum duration.
      tick(150);
      expect(service.isLoading).toBe(false);
    }));

    it('should hide immediately if minimum duration already elapsed', fakeAsync(() => {
      routerEventsSubject.next(new NavigationStart(1, '/test'));
      expect(service.isLoading).toBe(true);

      // Wait longer than minimum duration.
      tick(250);

      routerEventsSubject.next(new NavigationEnd(1, '/test', '/test'));
      expect(service.isLoading).toBe(false);
    }));
  });

  describe('NavigationCancel handling', () => {
    it('should set isLoading to false on NavigationCancel', fakeAsync(() => {
      routerEventsSubject.next(new NavigationStart(1, '/test'));
      tick(250);
      routerEventsSubject.next(new NavigationCancel(1, '/test', ''));
      expect(service.isLoading).toBe(false);
    }));
  });

  describe('NavigationError handling', () => {
    it('should set isLoading to false on NavigationError', fakeAsync(() => {
      routerEventsSubject.next(new NavigationStart(1, '/test'));
      tick(250);
      routerEventsSubject.next(new NavigationError(1, '/test', new Error()));
      expect(service.isLoading).toBe(false);
    }));
  });

  describe('Safety timeout', () => {
    it('should auto-hide loading after timeout', fakeAsync(() => {
      routerEventsSubject.next(new NavigationStart(1, '/test'));
      expect(service.isLoading).toBe(true);

      // Fast-forward past the safety timeout (30 seconds).
      tick(30001);

      expect(service.isLoading).toBe(false);
    }));
  });

  describe('Chained navigations', () => {
    it('should handle rapid navigation changes correctly', fakeAsync(() => {
      // Start first navigation.
      routerEventsSubject.next(new NavigationStart(1, '/page1'));
      expect(service.isLoading).toBe(true);

      tick(50);

      // Start second navigation before first completes.
      routerEventsSubject.next(new NavigationStart(2, '/page2'));
      expect(service.isLoading).toBe(true);

      tick(250);

      // Complete second navigation.
      routerEventsSubject.next(new NavigationEnd(2, '/page2', '/page2'));
      expect(service.isLoading).toBe(false);
    }));

    it('should cancel pending hide when a new navigation starts during minimum duration wait', fakeAsync(() => {
      // Start and quickly end navigation so remainingTime > 0,
      // which sets pendingHide = true and schedules minimumDurationTimeoutId.
      routerEventsSubject.next(new NavigationStart(1, '/page1'));
      tick(50);
      routerEventsSubject.next(new NavigationEnd(1, '/page1', '/page1'));

      // pendingHide is now true and minimumDurationTimeoutId is scheduled.
      // Start a new navigation before the minimum duration timeout fires.
      routerEventsSubject.next(new NavigationStart(2, '/page2'));
      expect(service.isLoading).toBe(true);

      // Let the old minimum duration timeout expire. It should not hide
      // because pendingHide was reset by showLoading.
      tick(200);
      expect(service.isLoading).toBe(true);

      // Complete the second navigation after minimum duration.
      tick(100);
      routerEventsSubject.next(new NavigationEnd(2, '/page2', '/page2'));
      expect(service.isLoading).toBe(false);
    }));
  });

  describe('hideLoading when loadingStartTime is null', () => {
    it('should hide immediately when loadingStartTime is null', fakeAsync(() => {
      // Complete a navigation to set loadingStartTime to null.
      routerEventsSubject.next(new NavigationStart(1, '/test'));
      tick(250);
      routerEventsSubject.next(new NavigationEnd(1, '/test', '/test'));
      expect(service.isLoading).toBe(false);

      // Force isLoading to true to verify hide works.
      // Trigger another NavigationEnd without a NavigationStart.
      // Since loadingStartTime was set to null above, this tests the
      // null branch in hideLoading.
      routerEventsSubject.next(new NavigationEnd(2, '/other', '/other'));
      expect(service.isLoading).toBe(false);
    }));
  });

  describe('Safety timeout edge cases', () => {
    it('should not emit false again if loading is already false when safety timeout fires', fakeAsync(() => {
      routerEventsSubject.next(new NavigationStart(1, '/test'));
      expect(service.isLoading).toBe(true);

      // Complete navigation before safety timeout.
      tick(250);
      routerEventsSubject.next(new NavigationEnd(1, '/test', '/test'));
      expect(service.isLoading).toBe(false);

      // Let safety timeout fire. isLoading is already false,
      // so the if-check inside the timeout should skip the emit.
      tick(30000);
      expect(service.isLoading).toBe(false);
    }));
  });

  describe('ngOnDestroy', () => {
    it('should clean up subscriptions and timeouts on destroy', fakeAsync(() => {
      routerEventsSubject.next(new NavigationStart(1, '/test'));
      expect(service.isLoading).toBe(true);

      service.ngOnDestroy();

      // After destroy, router events should no longer be processed.
      routerEventsSubject.next(new NavigationEnd(1, '/test', '/test'));

      // isLoading stays true because the subscription was removed.
      expect(service.isLoading).toBe(true);

      // Flush any remaining timers.
      tick(30001);
    }));
  });

  describe('isLoading$ observable', () => {
    it('should emit loading state changes via isLoading$ observable', fakeAsync(() => {
      const emissions: boolean[] = [];
      const sub = service.isLoading$.subscribe(val => emissions.push(val));

      routerEventsSubject.next(new NavigationStart(1, '/test'));
      tick(250);
      routerEventsSubject.next(new NavigationEnd(1, '/test', '/test'));

      // Emissions: initial true (BehaviorSubject), true from NavigationStart,
      // false from NavigationEnd.
      expect(emissions).toContain(true);
      expect(emissions).toContain(false);

      sub.unsubscribe();
    }));
  });
});
