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
 * @fileoverview Unit tests for for PromoBarComponent.
 */

import { async, ComponentFixture, fakeAsync, TestBed, tick } from
  '@angular/core/testing';
import { PromoBarComponent } from 'components/common-layout-directives/common-elements/promo-bar.component';
import { PromoBarBackendApiService } from 'services/promo-bar-backend-api.service';
import { WindowRef } from 'services/contextual/window-ref.service';

describe('Promo Bar Component', () => {
  let component: PromoBarComponent;
  let fixture: ComponentFixture<PromoBarComponent>;
  let promoBarBackendApiService: PromoBarBackendApiService;

  class MockPromoBarBackendApiService {
    async getPromoBarDataAsync() {
      return new Promise((resolve) => {
        resolve({
          promoBarEnabled: true,
          promoBarMessage: 'Promo bar message.'
        });
      });
    }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PromoBarComponent],
      providers: [
        WindowRef,
        {
          provide: PromoBarBackendApiService,
          useClass: MockPromoBarBackendApiService
        }]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PromoBarComponent);
    component = fixture.componentInstance;
    promoBarBackendApiService = TestBed.inject(PromoBarBackendApiService);
    fixture.detectChanges();
  });

  it('should intialize the component and set values', fakeAsync(() => {
    const promoBarSpy = spyOn(
      promoBarBackendApiService, 'getPromoBarDataAsync').and.callThrough();
    expect(component.promoBarIsEnabled).toBeUndefined;
    expect(component.promoBarMessage).toBeUndefined;

    component.ngOnInit();
    tick(150);
    fixture.detectChanges();

    expect(promoBarSpy).toHaveBeenCalled();
    expect(component.promoBarIsEnabled).toBe(true);
    expect(component.promoBarMessage).toBe('Promo bar message.');
  }));

  it('should return true if session storage is available when calling ' +
    'isSessionStorageAvailable', fakeAsync(() => {
    const setItemSpy = spyOn(
      window.sessionStorage, 'setItem').and.callThrough();
    const removeItemSpy = spyOn(
      window.sessionStorage, 'removeItem').and.callThrough();

    let isSessionStorageAvailable = component.isSessionStorageAvailable();

    expect(setItemSpy).toHaveBeenCalled();
    expect(removeItemSpy).toHaveBeenCalled();
    expect(isSessionStorageAvailable).toBe(true);
  }));

  it('should return false if session storage is not available when calling ' +
    'isSessionStorageAvailable', () => {
    const setItemSpy = spyOn(
      window.sessionStorage, 'setItem').and.callFake(() => {
      throw new Error('Session storage not available.');
    });
    const removeItemSpy = spyOn(
      window.sessionStorage, 'removeItem').and.callThrough();

    let isSessionStorageAvailable = component.isSessionStorageAvailable();

    expect(setItemSpy).toHaveBeenCalled();
    expect(removeItemSpy).not.toHaveBeenCalled();
    expect(isSessionStorageAvailable).toBe(false);
  });

  it('should return false if session storage is not available when calling ' +
    'isPromoDismissed', () => {
    const sessionStorageSpy = spyOn(
      component, 'isSessionStorageAvailable').and.callFake(() => {
      return false;
    });
    let isPromoDismissed = component.isPromoDismissed();

    expect(sessionStorageSpy).toHaveBeenCalled();
    expect(isPromoDismissed).toBe(false);
  });

  it('should return true if promo bar is dismissed when calling' +
    'isPromoDismissed', () => {
    const sessionStorageSpy = spyOn(
      component, 'isSessionStorageAvailable').and.callFake(() => {
      return true;
    });
    window.sessionStorage.promoIsDismissed = true;

    let isPromoDismissed = component.isPromoDismissed();

    expect(sessionStorageSpy).toHaveBeenCalled();
    expect(isPromoDismissed).toBe(true);
  });

  it('should return false if promo bar is not dismissed when calling ' +
    'isPromoDismissed', () => {
    const sessionStorageSpy = spyOn(
      component, 'isSessionStorageAvailable').and.callFake(() => {
      return true;
    });
    window.sessionStorage.promoIsDismissed = false;

    let isPromoDismissed = component.isPromoDismissed();

    expect(sessionStorageSpy).toHaveBeenCalled();
    expect(isPromoDismissed).toBe(false);
  });

  it('should return false if session storage is not ' +
    'available when calling setPromoDismissed', () => {
    let isPromoDismissed = false;
    const sessionStorageSpy = spyOn(
      component, 'isSessionStorageAvailable').and.callFake(() => {
      return false;
    });
    let setPromoDismissed = component.setPromoDismissed(isPromoDismissed);

    expect(sessionStorageSpy).toHaveBeenCalled();
    expect(setPromoDismissed).toBe(false);
  });

  it('should set the value of promoIsDismissed as true in session storage ' +
    'when calling setPromoDismissed', () => {
    let isPromoDismissed = true;
    const sessionStorageSpy = spyOn(
      component, 'isSessionStorageAvailable').and.callFake(() => {
      return true;
    });

    expect(window.sessionStorage.promoIsDismissed).toBeUndefined;
    component.setPromoDismissed(isPromoDismissed);

    expect(sessionStorageSpy).toHaveBeenCalled();
    expect(window.sessionStorage.promoIsDismissed).toBe('true');
  });

  it('should set the value of promoIsDismissed as false in session storage ' +
    'when calling setPromoDismissed', () => {
    let isPromoDismissed = false;
    const sessionStorageSpy = spyOn(
      component, 'isSessionStorageAvailable').and.callFake(() => {
      return true;
    });

    expect(window.sessionStorage.promoIsDismissed).toBeUndefined;
    component.setPromoDismissed(isPromoDismissed);

    expect(sessionStorageSpy).toHaveBeenCalled();
    expect(window.sessionStorage.promoIsDismissed).toBe('false');
  });

  it('should dismiss the promo bar when calling dismissPromo', () => {
    expect(component.promoIsVisible).toBeUndefined;
    const sessionStorageSpy = spyOn(
      component, 'setPromoDismissed').and.callThrough();

    expect(window.sessionStorage.promoIsDismissed).toBeUndefined;
    component.dismissPromo();

    expect(component.promoIsVisible).toBe(false);
    expect(sessionStorageSpy).toHaveBeenCalledWith(true);
  });
});
