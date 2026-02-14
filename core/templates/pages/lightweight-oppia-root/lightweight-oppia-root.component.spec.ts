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
 * @fileoverview Unit tests for LightweightOppiaRootComponent.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {BehaviorSubject} from 'rxjs';
import {PageNavigationLoadingService} from '../../services/page-navigation-loading.service';
import {LightweightOppiaRootComponent} from './lightweight-oppia-root.component';

describe('LightweightOppiaRootComponent', () => {
  let fixture: ComponentFixture<LightweightOppiaRootComponent>;
  let component: LightweightOppiaRootComponent;
  let isLoadingSubject: BehaviorSubject<boolean>;

  beforeEach(waitForAsync(() => {
    isLoadingSubject = new BehaviorSubject<boolean>(false);

    TestBed.configureTestingModule({
      declarations: [LightweightOppiaRootComponent],
      providers: [
        {
          provide: PageNavigationLoadingService,
          useValue: {
            isLoading$: isLoadingSubject.asObservable(),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LightweightOppiaRootComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeDefined();
  });

  it('should initialize isNavigationLoading to false', () => {
    expect(component.isNavigationLoading).toBe(false);
  });

  it('should subscribe to isLoading$ on init and update isNavigationLoading', () => {
    component.ngOnInit();

    expect(component.isNavigationLoading).toBe(false);

    isLoadingSubject.next(true);
    expect(component.isNavigationLoading).toBe(true);

    isLoadingSubject.next(false);
    expect(component.isNavigationLoading).toBe(false);
  });

  it('should unsubscribe from loading subscription on destroy', () => {
    component.ngOnInit();

    // Verify subscription is active by checking updates work.
    isLoadingSubject.next(true);
    expect(component.isNavigationLoading).toBe(true);

    component.ngOnDestroy();

    // After destroy, changes should not be reflected.
    isLoadingSubject.next(false);
    expect(component.isNavigationLoading).toBe(true);
  });

  it('should handle ngOnDestroy when no subscription exists', () => {
    // Call ngOnDestroy without ngOnInit, so loadingSubscription is null.
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
