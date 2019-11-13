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
import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
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
import { ExplorationHtmlFormatterService } from
  'services/exploration-html-formatter.service';
import { ExtensionTagAssemblerService }
  from 'services/extension-tag-assembler.service';
import { FormatTimePipe } from 'filters/format-timer.pipe';
import { FractionObjectFactory } from
  'domain/objects/FractionObjectFactory';
import { GenerateContentIdService } from 'services/generate-content-id.service';
import { HintObjectFactory } from 'domain/exploration/HintObjectFactory';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { InteractionObjectFactory } from
  'domain/exploration/InteractionObjectFactory';
import { LoggerService } from 'services/contextual/logger.service';
import { MetaTagCustomizationService } from
  'services/contextual/meta-tag-customization.service';
import { NormalizeWhitespacePipe } from
  'filters/string-utility-filters/normalize-whitespace.pipe';
import { NumberWithUnitsObjectFactory } from
  'domain/objects/NumberWithUnitsObjectFactory';
import { OutcomeObjectFactory } from 'domain/exploration/OutcomeObjectFactory';
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory';
import { SidebarStatusService } from 'domain/sidebar/sidebar-status.service';
import { SolutionObjectFactory } from
  'domain/exploration/SolutionObjectFactory';
import { SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory';
import { UnitsObjectFactory } from
  'domain/objects/UnitsObjectFactory';
import { UrlService } from 'services/contextual/url.service';
import { UtilsService } from 'services/utils.service';
import { ValidatorsService } from 'services/validators.service';
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
    'ExplorationHtmlFormatterService': new ExplorationHtmlFormatterService(
      new CamelCaseToHyphensPipe(), new ExtensionTagAssemblerService(
        new HtmlEscaperService(new LoggerService()),
        new CamelCaseToHyphensPipe()), new HtmlEscaperService(
        new LoggerService())),
    'ExtensionTagAssemblerService': new ExtensionTagAssemblerService(
      new HtmlEscaperService(new LoggerService()),
      new CamelCaseToHyphensPipe()),
    'GenerateContentIdService': new GenerateContentIdService(),
    'HtmlEscaperService': new HtmlEscaperService(
      new LoggerService()),
    'InteractionObjectFactory': new InteractionObjectFactory(
      new AnswerGroupObjectFactory(new OutcomeObjectFactory(
        new SubtitledHtmlObjectFactory()),
      new RuleObjectFactory()), new HintObjectFactory(
        new SubtitledHtmlObjectFactory()), new SolutionObjectFactory(
        new SubtitledHtmlObjectFactory(), new ExplorationHtmlFormatterService(
          new CamelCaseToHyphensPipe(), new ExtensionTagAssemblerService(
            new HtmlEscaperService(new LoggerService()),
            new CamelCaseToHyphensPipe()), new HtmlEscaperService(
            new LoggerService()))), new OutcomeObjectFactory(
        new SubtitledHtmlObjectFactory())
    ),
    'MetaTagCustomizationService': new MetaTagCustomizationService(
      new WindowRef()),
    'NumberWithUnitsObjectFactory': new NumberWithUnitsObjectFactory(
      new UnitsObjectFactory(), new FractionObjectFactory()),
    'SidebarStatusService': new SidebarStatusService(
      new WindowDimensionsService()),
    'SolutionObjectFactory': new SolutionObjectFactory(
      new SubtitledHtmlObjectFactory(), new ExplorationHtmlFormatterService(
        new CamelCaseToHyphensPipe(), new ExtensionTagAssemblerService(
          new HtmlEscaperService(new LoggerService()),
          new CamelCaseToHyphensPipe()), new HtmlEscaperService(
          new LoggerService()))),
    'UrlService': new UrlService(new WindowRef()),
    'UtilsService': new UtilsService(),
    'ValidatorsService': new ValidatorsService(
      new AlertsService(new LoggerService()), new NormalizeWhitespacePipe(
        new UtilsService())),
    'WindowDimensionsService': new WindowDimensionsService()
  };
}

angular.module('oppia').factory(
  'UpgradedServices',
  downgradeInjectable(UpgradedServices));
