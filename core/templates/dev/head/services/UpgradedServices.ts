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
import { HttpClient, HttpEvent, HttpHandler, HttpRequest } from
  '@angular/common/http';
import { Observable } from 'rxjs';

import { AdminDataService } from 'pages/admin-page/services/admin-data.service';
import { AlertsService } from 'services/alerts.service';
import { BackgroundMaskService } from
  'services/stateful/background-mask.service';
import { BaseUndoRedoService } from
  'domain/editor/undo_redo/base-undo-redo.service';
import { CamelCaseToHyphensPipe } from
  'filters/string-utility-filters/camel-case-to-hyphens.pipe';
import { ContextService } from 'services/context.service';
import { ContributionAndReviewServices } from
  'pages/community-dashboard-page/services/contribution-and-review.services';
import { ContributionOpportunitiesBackendApiService } from
  // eslint-disable-next-line max-len
  'pages/community-dashboard-page/services/contribution-opportunities-backend-api.service';
import { ContributionOpportunitiesService } from
  'pages/community-dashboard-page/services/contribution-opportunities.service';
import { ChangesInHumanReadableFormService } from
  // eslint-disable-next-line max-len
  'pages/exploration-editor-page/services/changes-in-human-readable-form.service';
import { ComputeGraphService } from 'services/compute-graph.service';
import { CsrfTokenService } from 'services/csrf-token.service';
import { DateTimeFormatService } from 'services/date-time-format.service';
import { DebouncerService } from 'services/debouncer.service';
import { DeviceInfoService } from 'services/contextual/device-info.service';
import { DocumentAttributeCustomizationService } from
  'services/contextual/document-attribute-customization.service';
import { EditorFirstTimeEventsService } from
  'pages/exploration-editor-page/services/editor-first-time-events.service';
import { ExplorationDiffService } from
  'pages/exploration-editor-page/services/exploration-diff.service';
import { EventService } from 'services/event-service';
import { ExplorationDraftObjectFactory } from
  'domain/exploration/ExplorationDraftObjectFactory';
import { ExtensionTagAssemblerService }
  from 'services/extension-tag-assembler.service';
import { FormatTimePipe } from 'filters/format-timer.pipe';
import { FractionObjectFactory } from
  'domain/objects/FractionObjectFactory';
import { GenerateContentIdService } from 'services/generate-content-id.service';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { IdGenerationService } from 'services/id-generation.service';
import { LocalStorageService } from 'services/local-storage.service';
import { LoggerService } from 'services/contextual/logger.service';
import { MetaTagCustomizationService } from
  'services/contextual/meta-tag-customization.service';
import { NumberWithUnitsObjectFactory } from
  'domain/objects/NumberWithUnitsObjectFactory';
import { QuestionUndoRedoService } from
  'domain/editor/undo_redo/question-undo-redo.service';
import { SidebarStatusService } from 'domain/sidebar/sidebar-status.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { UrlService } from 'services/contextual/url.service';
import { UtilsService } from 'services/utils.service';
import { StopwatchObjectFactory } from
  'domain/utilities/StopwatchObjectFactory';
import { TranslateTextService } from
  'pages/community-dashboard-page/services/translate-text.service';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { UnitsObjectFactory } from
  'domain/objects/UnitsObjectFactory';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { WindowDimensionsService } from
  'services/contextual/window-dimensions.service';
import { WindowRef } from 'services/contextual/window-ref.service';

// Can be used to inject HttpCLient, will help in redundancy
const HttpDependency = new HttpClient(
    <HttpHandler> new class extends HttpHandler {
      handle(req: HttpRequest<any>): Observable<HttpEvent<any>> {
        return undefined;
      }
    });

@Injectable({
  providedIn: 'root'
})
export class UpgradedServices {
  /* eslint-disable quote-props */
  upgradedServices = {
    'AdminDataService': new AdminDataService(HttpDependency),
    'AlertsService': new AlertsService(new LoggerService()),
    'BackgroundMaskService': new BackgroundMaskService(),
    'BaseUndoRedoService': new BaseUndoRedoService(new EventService()),
    'ComputeGraphService': new ComputeGraphService(),
    'ChangesInHumanReadableFormService': new ChangesInHumanReadableFormService(
      new UtilsService(), document),
    'ContextService': new ContextService(new UrlService(new WindowRef())),
    'ContributionAndReviewServices': new ContributionAndReviewServices(
      new UrlInterpolationService(new AlertsService(
        new LoggerService()), new UrlService(
        new WindowRef()), new UtilsService()), HttpDependency),
    'ContributionOpportunitiesBackendApiService':
          new ContributionOpportunitiesBackendApiService(
            HttpDependency, new UrlInterpolationService(new AlertsService(
              new LoggerService()), new UrlService(
              new WindowRef()), new UtilsService()) ),
    'ContributionOpportunitiesService': new ContributionOpportunitiesService(
      new ContributionOpportunitiesBackendApiService(
        HttpDependency, new UrlInterpolationService(new AlertsService(
          new LoggerService()), new UrlService(
          new WindowRef()), new UtilsService()) )),
    'CsrfTokenService': new CsrfTokenService(),
    'DateTimeFormatService': new DateTimeFormatService(new FormatTimePipe()),
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
    'LocalStorageService': new LocalStorageService(
      new ExplorationDraftObjectFactory()),
    'MetaTagCustomizationService': new MetaTagCustomizationService(
      new WindowRef()),
    'NumberWithUnitsObjectFactory': new NumberWithUnitsObjectFactory(
      new UnitsObjectFactory(), new FractionObjectFactory()),
    'QuestionUndoRedoService': new QuestionUndoRedoService(new EventService()),
    'SidebarStatusService': new SidebarStatusService(
      new WindowDimensionsService()),
    'SiteAnalyticsService': new SiteAnalyticsService(new WindowRef()),
    'StopwatchObjectFactory': new StopwatchObjectFactory(),
    'TranslateTextService': new TranslateTextService(HttpDependency),
    'UndoRedoService': new UndoRedoService(new EventService()),
    'UrlService': new UrlService(new WindowRef()),
    'UrlInterpolationService': new UrlInterpolationService(new AlertsService(
      new LoggerService()), new UrlService(
      new WindowRef()), new UtilsService()),
    'UtilsService': new UtilsService(),
    'WindowDimensionsService': new WindowDimensionsService(),
  };
}

angular.module('oppia').factory(
  'UpgradedServices',
  downgradeInjectable(UpgradedServices));
