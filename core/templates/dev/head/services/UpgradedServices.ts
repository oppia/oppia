// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for storing all upgraded services
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { BackgroundMaskService } from 'services/stateful/BackgroundMaskService';
import { DeviceInfoService } from 'services/contextual/DeviceInfoService';
import { DocumentAttributeCustomizationService } from
  'services/contextual/DocumentAttributeCustomizationService';
import { MetaTagCustomizationService } from
  'services/contextual/MetaTagCustomizationService';
import { SidebarStatusService } from 'domain/sidebar/sidebar-status.service';
import { UtilsService } from 'services/UtilsService';
import { WindowDimensionsService } from
  'services/contextual/WindowDimensionsService';
import { WindowRef } from 'services/contextual/WindowRefService';

@Injectable({
  providedIn: 'root'
})
export class UpgradedServices {
  /* eslint-disable quote-props */
  upgradedServices = {
    'BackgroundMaskService': new BackgroundMaskService(),
    'DeviceInfoService': new DeviceInfoService(new WindowRef()),
    'DocumentAttributeCustomizationService':
        new DocumentAttributeCustomizationService(new WindowRef()),
    'MetaTagCustomizationService': new MetaTagCustomizationService(
      new WindowRef()),
    'SidebarStatusService': new SidebarStatusService(
      new WindowDimensionsService()),
    'UtilsService': new UtilsService(),
    'WindowDimensionsService': new WindowDimensionsService()
  };
}

angular.module('oppia').factory(
  'UpgradedServices',
  downgradeInjectable(UpgradedServices));
