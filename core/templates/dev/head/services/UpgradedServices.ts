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

import { AlertsService } from 'services/alerts.service';
import { BackgroundMaskService } from
  'services/stateful/background-mask.service';
import { CamelCaseToHyphensPipe } from
  'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import { ComputeGraphService } from 'services/compute-graph.service';
import { DateTimeFormatService } from 'services/date-time-format.service';
import { DebouncerService } from 'services/debouncer.service';
import { DeviceInfoService } from 'services/contextual/device-info.service';
import { DocumentAttributeCustomizationService } from
  'services/contextual/document-attribute-customization.service';
import { ExtensionTagAssemblerService }
  from 'services/extension-tag-assembler.service';
import { FormatTimePipe } from 'filters/format-timer.pipe';
import { GenerateContentIdService } from 'services/generate-content-id.service';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { LoggerService } from 'services/contextual/logger.service';
import { MetaTagCustomizationService } from
  'services/contextual/meta-tag-customization.service';
import { SidebarStatusService } from 'domain/sidebar/sidebar-status.service';
import { UrlService } from 'services/contextual/url.service';
import { UtilsService } from 'services/utils.service';
import { WindowDimensionsService } from
  'services/contextual/window-dimensions.service';
import { WindowRef } from 'services/contextual/window-ref.service';

@Injectable({
  providedIn: 'root'
})
export class UpgradedServices {
  /* eslint-disable quote-props */
  upgradedServices = {
    'AlertsService': new AlertsService(new LoggerService()),
    'BackgroundMaskService': new BackgroundMaskService(),
    'ComputeGraphService': new ComputeGraphService(),
    'DateTimeFormatService': new DateTimeFormatService(new FormatTimePipe()),
    'DebouncerService': new DebouncerService(),
    'DeviceInfoService': new DeviceInfoService(new WindowRef()),
    'DocumentAttributeCustomizationService':
        new DocumentAttributeCustomizationService(new WindowRef()),
    'ExtensionTagAssemblerService': new ExtensionTagAssemblerService(
      new HtmlEscaperService(new LoggerService()),
      new CamelCaseToHyphensPipe()),
    'GenerateContentIdService': new GenerateContentIdService(),
    'HtmlEscaperService': new HtmlEscaperService(
      new LoggerService()),
    'MetaTagCustomizationService': new MetaTagCustomizationService(
      new WindowRef()),
    'SidebarStatusService': new SidebarStatusService(
      new WindowDimensionsService()),
    'UrlService': new UrlService(new WindowRef()),
    'UtilsService': new UtilsService(),
    'WindowDimensionsService': new WindowDimensionsService(),
  };
}

angular.module('oppia').factory(
  'UpgradedServices',
  downgradeInjectable(UpgradedServices));
