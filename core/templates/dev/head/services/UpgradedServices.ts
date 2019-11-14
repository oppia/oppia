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
import { ChangesInHumanReadableFormService } from
  // eslint-disable-next-line max-len
  'pages/exploration-editor-page/services/changes-in-human-readable-form.service';
import { ComputeGraphService } from 'services/compute-graph.service';
import { DateTimeFormatService } from 'services/date-time-format.service';
import { DebouncerService } from 'services/debouncer.service';
import { DeviceInfoService } from 'services/contextual/device-info.service';
import { DocumentAttributeCustomizationService } from
  'services/contextual/document-attribute-customization.service';
import { EditorFirstTimeEventsService } from
  'pages/exploration-editor-page/services/editor-first-time-events.service';
import { ExplorationDiffService } from
  'pages/exploration-editor-page/services/exploration-diff.service';
import { ExtensionTagAssemblerService }
  from 'services/extension-tag-assembler.service';
import { FractionObjectFactory } from
  'domain/objects/FractionObjectFactory';
import { GenerateContentIdService } from 'services/generate-content-id.service';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { IdGenerationService } from 'services/id-generation.service';
import { LoggerService } from 'services/contextual/logger.service';
import { MetaTagCustomizationService } from
  'services/contextual/meta-tag-customization.service';
import { NumberWithUnitsObjectFactory } from
  'domain/objects/NumberWithUnitsObjectFactory';
import { SidebarStatusService } from 'domain/sidebar/sidebar-status.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { UrlService } from 'services/contextual/url.service';
import { UtilsService } from 'services/utils.service';
import { UnitsObjectFactory } from
  'domain/objects/UnitsObjectFactory';
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
    'ChangesInHumanReadableFormService': new ChangesInHumanReadableFormService(
      new UtilsService(), document),
    'DateTimeFormatService': new DateTimeFormatService(),
    'DebouncerService': new DebouncerService(),
    'DeviceInfoService': new DeviceInfoService(new WindowRef()),
    'DocumentAttributeCustomizationService':
        new DocumentAttributeCustomizationService(new WindowRef()),
    'EditorFirstTimeEventsService': new EditorFirstTimeEventsService(
      new SiteAnalyticsService(new WindowRef())),
    'ExplorationDiffService': new ExplorationDiffService(),
    'ExtensionTagAssemblerService': new ExtensionTagAssemblerService(
      new HtmlEscaperService(new LoggerService()),
      new CamelCaseToHyphensPipe()),
    'GenerateContentIdService': new GenerateContentIdService(),
    'HtmlEscaperService': new HtmlEscaperService(
      new LoggerService()),
    'IdGenerationService': new IdGenerationService(),
    'MetaTagCustomizationService': new MetaTagCustomizationService(
      new WindowRef()),
    'SidebarStatusService': new SidebarStatusService(
      new WindowDimensionsService()),
    'SiteAnalyticsService': new SiteAnalyticsService(new WindowRef()),
    'UrlService': new UrlService(new WindowRef()),
    'UtilsService': new UtilsService(),
    'NumberWithUnitsObjectFactory': new NumberWithUnitsObjectFactory(
      new UnitsObjectFactory(), new FractionObjectFactory()),
    'WindowDimensionsService': new WindowDimensionsService()
  };
}

angular.module('oppia').factory(
  'UpgradedServices',
  downgradeInjectable(UpgradedServices));
