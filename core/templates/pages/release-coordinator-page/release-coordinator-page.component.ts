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
 * @fileoverview Component for the release coordinator page.
 */

import { Component, OnInit, } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { downgradeComponent } from '@angular/upgrade/static';

import { PromoBarBackendApiService } from 'services/promo-bar-backend-api.service';
import { PlatformFeatureService } from 'services/platform-feature.service';

import { ReleaseCoordinatorBackendApiService } from './services/release-coordinator-backend-api.service';
import { ReleaseCoordinatorPageConstants } from './release-coordinator-page.constants';

interface MemoryCacheProfile {
  totalAllocatedInBytes: string;
  peakAllocatedInBytes: string;
  totalKeysStored: string;
}


@Component({
  selector: 'oppia-release-coordinator-page',
  templateUrl: './release-coordinator-page.component.html',
})
export class ReleaseCoordinatorPageComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  statusMessage!: string;
  activeTab!: string;
  memoryCacheProfile!: MemoryCacheProfile;
  promoBarConfigForm!: FormGroup;
  memoryCacheDataFetched: boolean = false;
  submitButtonDisabled: boolean = false;

  TAB_ID_BEAM_JOBS: string = ReleaseCoordinatorPageConstants.TAB_ID_BEAM_JOBS;
  TAB_ID_FEATURES: string = ReleaseCoordinatorPageConstants.TAB_ID_FEATURES;
  TAB_ID_MISC: string = ReleaseCoordinatorPageConstants.TAB_ID_MISC;

  constructor(
    private formBuilder: FormBuilder,
    private platformFeatureService: PlatformFeatureService,
    private backendApiService: ReleaseCoordinatorBackendApiService,
    private promoBarBackendApiService: PromoBarBackendApiService) {}

  flushMemoryCache(): void {
    this.backendApiService.flushMemoryCacheAsync().then(() => {
      this.statusMessage = 'Success! Memory Cache Flushed.';
      this.memoryCacheDataFetched = false;
    }, errorResponse => {
      this.statusMessage = 'Server error: ' + errorResponse;
    });
  }

  getMemoryCacheProfile(): void {
    this.backendApiService.getMemoryCacheProfileAsync().then(response => {
      this.memoryCacheProfile = {
        totalAllocatedInBytes: response.total_allocation,
        peakAllocatedInBytes: response.peak_allocation,
        totalKeysStored: response.total_keys_stored
      };
      this.memoryCacheDataFetched = true;
      this.statusMessage = 'Success!';
    }, errorResponse => {
      this.statusMessage = 'Server error: ' + errorResponse;
    });
  }

  updatePromoBarParameter(): void {
    this.statusMessage = 'Updating promo-bar platform parameter...';
    this.promoBarBackendApiService.updatePromoBarDataAsync(
      this.promoBarConfigForm.controls.enabled.value,
      this.promoBarConfigForm.controls.message.value).then(() => {
      this.statusMessage = 'Success!';
      this.promoBarConfigForm.markAsPristine();
    }, errorResponse => {
      this.statusMessage = 'Server error: ' + errorResponse;
    });
  }

  ngOnInit(): void {
    this.statusMessage = '';
    this.submitButtonDisabled = true;
    this.promoBarConfigForm = this.formBuilder.group({
      enabled: false,
      message: ''
    });
    this.promoBarConfigForm.valueChanges.subscribe(() => {
      this.submitButtonDisabled = false;
    });
    this.memoryCacheDataFetched = false;
    this.activeTab = ReleaseCoordinatorPageConstants.TAB_ID_BEAM_JOBS;
    this.promoBarBackendApiService.getPromoBarDataAsync().then((promoBar) => {
      this.promoBarConfigForm.patchValue({
        enabled: promoBar.promoBarEnabled,
        message: promoBar.promoBarMessage
      });
    });
  }
}

angular.module('oppia').directive(
  'oppiaReleaseCoordinatorPage', downgradeComponent(
    {component: ReleaseCoordinatorPageComponent}));
