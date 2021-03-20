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
 * @fileoverview Service for storing all upgraded services
 */

import { AlertsService } from 'services/alerts.service';
import { BackgroundMaskService } from
  'services/stateful/background-mask.service';
import { ContextService } from 'services/context.service';
import { CsrfTokenService } from 'services/csrf-token.service';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { LoggerService } from 'services/contextual/logger.service';
import { SidebarStatusService } from 'services/sidebar-status.service';
import { StateContentService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-content.service';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowDimensionsService } from
  'services/contextual/window-dimensions.service';
import { WindowRef } from 'services/contextual/window-ref.service';
export class UpgradedServices {
  static ugs: Record<string, unknown> = {};
  static providers;

  constructor() {
    let upgradedServices = {};
    // We are using eslint disable here for multilines because we have not used
    // dot notation at a lot of places so it does not seem practical to use
    // "eslint disable next line" for each of them. Also, we can't use dot
    // notation either because then "Property 'AdminRouterService' does not
    // exist on type '{}'" lint error will be raised by the linter.
    /* eslint-disable-next-line oppia/no-multiline-disable */
    /* eslint-disable dot-notation */
    // Topological level: 0.
    upgradedServices['BackgroundMaskService'] = new BackgroundMaskService();
    upgradedServices['CsrfTokenService'] = new CsrfTokenService();
    upgradedServices['LoggerService'] = new LoggerService();
    upgradedServices['WindowRef'] = new WindowRef();
    upgradedServices['AlertsService'] = new AlertsService(
      upgradedServices['LoggerService']);
    upgradedServices['HtmlEscaperService'] = new HtmlEscaperService(
      upgradedServices['LoggerService']);
    upgradedServices['UrlService'] = new UrlService(
      upgradedServices['WindowRef']);
    upgradedServices['WindowDimensionsService'] = new WindowDimensionsService(
      upgradedServices['WindowRef']);
    upgradedServices['ContextService'] = new ContextService(
      upgradedServices['UrlService']);
    upgradedServices['SidebarStatusService'] = new SidebarStatusService(
      upgradedServices['WindowDimensionsService']);
    upgradedServices['StateContentService'] = new StateContentService(
      upgradedServices['AlertsService'], upgradedServices['UtilsService']);
    upgradedServices['UrlInterpolationService'] = new UrlInterpolationService(
      upgradedServices['AlertsService'], upgradedServices['UrlService'],
      upgradedServices['UtilsService']);

    let providers = [
      {
        provide: AlertsService,
        useValue: upgradedServices['AlertsService']
      },
      {
        provide: BackgroundMaskService,
        useValue: upgradedServices['BackgroundMaskService']
      },
      {
        provide: ContextService,
        useValue: upgradedServices['ContextService']
      },
      {
        provide: CsrfTokenService,
        useValue: upgradedServices['CsrfTokenService']
      },
      {
        provide: HtmlEscaperService,
        useValue: upgradedServices['HtmlEscaperService']
      },
      {
        provide: LoggerService,
        useValue: upgradedServices['LoggerService']
      },
      {
        provide: SidebarStatusService,
        useValue: upgradedServices['SidebarStatusService']
      },
      {
        provide: StateContentService,
        useValue: upgradedServices['StateContentService']
      },
      {
        provide: UrlInterpolationService,
        useValue: upgradedServices['UrlInterpolationService']
      },
      {
        provide: UrlService,
        useValue: upgradedServices['UrlService']
      },
      {
        provide: WindowDimensionsService,
        useValue: upgradedServices['WindowDimensionsService']
      },
      {
        provide: WindowRef,
        useValue: upgradedServices['WindowRef']
      }
    ];
    UpgradedServices.ugs = upgradedServices;
    UpgradedServices.providers = providers;
    /* eslint-enable dot-notation */
  }

  getUpgradedServices(): Record<string, unknown> {
    return UpgradedServices.ugs;
  }
}
