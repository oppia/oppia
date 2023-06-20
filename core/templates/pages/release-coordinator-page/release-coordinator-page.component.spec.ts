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
 * @fileoverview Unit tests for release coordinator page component.
 */

import { TestBed, waitForAsync, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder } from '@angular/forms';
import { PromoBarBackendApiService } from 'services/promo-bar-backend-api.service';
import { ReleaseCoordinatorBackendApiService } from './services/release-coordinator-backend-api.service';
import { ReleaseCoordinatorPageConstants } from './release-coordinator-page.constants';
import { ReleaseCoordinatorPageComponent } from './release-coordinator-page.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PromoBar } from 'domain/promo_bar/promo-bar.model';

describe('Release coordinator page', () => {
  let component: ReleaseCoordinatorPageComponent;
  let fixture: ComponentFixture<ReleaseCoordinatorPageComponent>;
  let pbbas: PromoBarBackendApiService;
  let rcbas: ReleaseCoordinatorBackendApiService;

  let testPromoBarData = new PromoBar(true, 'Hello');
  let testMemoryCacheProfile = {
    peak_allocation: '1430120',
    total_allocation: '1014112',
    total_keys_stored: '2'
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      declarations: [
        ReleaseCoordinatorPageComponent
      ],
      providers: [
        PromoBarBackendApiService,
        ReleaseCoordinatorBackendApiService,
        FormBuilder
      ],
      schemas: [
        NO_ERRORS_SCHEMA
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReleaseCoordinatorPageComponent);
    component = fixture.componentInstance;
    pbbas = TestBed.inject(PromoBarBackendApiService);
    rcbas = TestBed.inject(ReleaseCoordinatorBackendApiService);
  });

  beforeEach(() => {
    spyOn(pbbas, 'getPromoBarDataAsync').and.returnValue(
      Promise.resolve(testPromoBarData));
    component.ngOnInit();
  });

  it('should load the component with the correct properties' +
  'when user navigates to release coordinator page', fakeAsync(() => {
    expect(component.statusMessage).toEqual('');
    expect(component.submitButtonDisabled).toBeTrue();
    expect(component.memoryCacheDataFetched).toBeFalse();
    expect(component.activeTab).toEqual(
      ReleaseCoordinatorPageConstants.TAB_ID_BEAM_JOBS);

    tick();

    expect(pbbas.getPromoBarDataAsync).toHaveBeenCalled();
    expect(component.promoBarConfigForm.enabled).toBeTrue();
  }));

  it('should update promo bar parameter and set success status',
    fakeAsync(() => {
      spyOn(pbbas, 'updatePromoBarDataAsync').and.returnValue(
        Promise.resolve());

      component.updatePromoBarParameter();

      expect(component.statusMessage).toEqual(
        'Updating promo-bar platform parameter...');

      tick();

      expect(pbbas.updatePromoBarDataAsync).toHaveBeenCalled();
      expect(component.statusMessage).toEqual('Success!');
    }));

  it('should set error status when update promo bar parameter fails',
    fakeAsync(() => {
      spyOn(pbbas, 'updatePromoBarDataAsync').and.returnValue(
        Promise.reject('failed to update'));

      component.updatePromoBarParameter();

      expect(component.statusMessage).toEqual(
        'Updating promo-bar platform parameter...');

      tick();

      expect(pbbas.updatePromoBarDataAsync).toHaveBeenCalled();
      expect(component.statusMessage).toEqual('Server error: failed to update');
    }));

  it('should flush memory cache and set success status',
    fakeAsync(() => {
      spyOn(rcbas, 'flushMemoryCacheAsync').and.returnValue(Promise.resolve());

      component.flushMemoryCache();
      tick();

      expect(rcbas.flushMemoryCacheAsync).toHaveBeenCalled();
      expect(component.statusMessage).toEqual('Success! Memory Cache Flushed.');
      expect(component.memoryCacheDataFetched).toBeFalse();
    }));

  it('should set error status when failed to flush memory cache',
    fakeAsync(() => {
      spyOn(rcbas, 'flushMemoryCacheAsync').and.returnValue(
        Promise.reject('failed to flush'));

      component.flushMemoryCache();
      tick();

      expect(rcbas.flushMemoryCacheAsync).toHaveBeenCalled();
      expect(component.statusMessage).toEqual('Server error: failed to flush');
    }));

  it('should fetch memory cache profile and set success status',
    fakeAsync(() => {
      spyOn(rcbas, 'getMemoryCacheProfileAsync').and.returnValue(
        Promise.resolve(testMemoryCacheProfile));

      component.getMemoryCacheProfile();
      tick();

      expect(rcbas.getMemoryCacheProfileAsync).toHaveBeenCalled();
      expect(component.memoryCacheProfile.totalAllocatedInBytes)
        .toEqual(testMemoryCacheProfile.total_allocation);
      expect(component.memoryCacheProfile.peakAllocatedInBytes)
        .toEqual(testMemoryCacheProfile.peak_allocation);
      expect(component.memoryCacheProfile.totalKeysStored)
        .toEqual(testMemoryCacheProfile.total_keys_stored);
      expect(component.memoryCacheDataFetched).toBeTrue();
      expect(component.statusMessage).toBe('Success!');
    }));

  it('should set error status when fetching memory cache profile fails',
    fakeAsync(() => {
      spyOn(rcbas, 'getMemoryCacheProfileAsync').and.returnValue(
        Promise.reject('failed to fetch'));

      component.getMemoryCacheProfile();
      tick();

      expect(rcbas.getMemoryCacheProfileAsync).toHaveBeenCalled();
      expect(component.statusMessage).toBe('Server error: failed to fetch');
    }));
});
