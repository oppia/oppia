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
import { FormatTimePipe } from 'filters/format-timer.pipe';
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
  static upgradedServices = (() => {
    var upgradedServices = {};
    // Group 1: Services without dependencies.
    upgradedServices['BackgroundMaskService'] = new BackgroundMaskService();
    upgradedServices['CamelCaseToHyphensPipe'] = new CamelCaseToHyphensPipe();
    upgradedServices['ComputeGraphService'] = new ComputeGraphService();
    upgradedServices['DebouncerService'] = new DebouncerService();
    upgradedServices['ExplorationDiffService'] = new ExplorationDiffService();
    upgradedServices['FormatTimePipe'] = new FormatTimePipe();
    upgradedServices['FractionObjectFactory'] = new FractionObjectFactory();
    upgradedServices['GenerateContentIdService'] =
      new GenerateContentIdService();
    upgradedServices['IdGenerationService'] = new IdGenerationService();
    upgradedServices['LoggerService'] = new LoggerService();
    upgradedServices['UnitsObjectFactory'] = new UnitsObjectFactory();
    upgradedServices['UtilsService'] = new UtilsService();
    upgradedServices['WindowDimensionsService'] = new WindowDimensionsService();
    upgradedServices['WindowRef'] = new WindowRef();

    // Group 2: Services depending only on group 1.
    upgradedServices['AlertsService'] =
      new AlertsService(upgradedServices['LoggerService']);
    upgradedServices['ChangesInHumanReadableFormService'] =
      new ChangesInHumanReadableFormService(
        upgradedServices['UtilsService'], document);
    upgradedServices['DateTimeFormatService'] =
      new DateTimeFormatService(upgradedServices['FormatTimePipe']);
    upgradedServices['DeviceInfoService'] =
      new DeviceInfoService(upgradedServices['WindowRef']);
    upgradedServices['DocumentAttributeCustomizationService'] =
      new DocumentAttributeCustomizationService(upgradedServices['WindowRef']);
    upgradedServices['HtmlEscaperService'] =
      new HtmlEscaperService(upgradedServices['LoggerService']);
    upgradedServices['MetaTagCustomizationService'] =
      new MetaTagCustomizationService(upgradedServices['WindowRef']);
    upgradedServices['NumberWithUnitsObjectFactory'] =
      new NumberWithUnitsObjectFactory(
        upgradedServices['UnitsObjectFactory'],
        upgradedServices['FractionObjectFactory']);
    upgradedServices['SidebarStatusService'] =
      new SidebarStatusService(upgradedServices['WindowDimensionsService']);
    upgradedServices['SiteAnalyticsService'] =
      new SiteAnalyticsService(upgradedServices['WindowRef']);
    upgradedServices['UrlService'] =
      new UrlService(upgradedServices['WindowRef']);

    // Group 3: Services depending only on groups 1-2.
    upgradedServices['EditorFirstTimeEventsService'] =
      new EditorFirstTimeEventsService(
        upgradedServices['SiteAnalyticsService']);
    upgradedServices['ExtensionTagAssemblerService'] =
      new ExtensionTagAssemblerService(
        upgradedServices['HtmlEscaperService'],
        upgradedServices['CamelCaseToHyphensPipe']);

    return upgradedServices;
  })();

  getUpgradedServices(): any {
    return UpgradedServices.upgradedServices;
  }
}

angular.module('oppia').factory(
  'UpgradedServices', downgradeInjectable(UpgradedServices));
