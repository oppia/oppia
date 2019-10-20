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

import { ErrorHandler, Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { SidebarStatusService } from 'domain/sidebar/SidebarStatusService';
import { CamelCaseToHyphensPipe } from
  '../filters/string-utility-filters/camel-case-to-hyphens.pipe';
import { ExtensionTagAssemblerService } from './ExtensionTagAssemblerService';
import { HtmlEscaperService } from './HtmlEscaperService';
import { LoggerService } from './LoggerService';
import { UtilsService } from 'services/UtilsService';
import { WindowDimensionsService } from './contextual/WindowDimensionsService';

@Injectable({
  providedIn: 'root'
})
export class UpgradedServices {
  /* eslint-disable quote-props */
  upgradedServices = {
    'UtilsService': new UtilsService(),
    'WindowDimensionsService': new WindowDimensionsService(),
    'HtmlEscaperService': new HtmlEscaperService(
      new LoggerService(new ErrorHandler())),
    'ExtensionTagAssemblerService': new ExtensionTagAssemblerService(
      new HtmlEscaperService(new LoggerService(new ErrorHandler())),
      new CamelCaseToHyphensPipe()),
    'SidebarStatusService': new SidebarStatusService(
      new WindowDimensionsService())
  };
}

angular.module('oppia').factory(
  'UpgradedServices',
  downgradeInjectable(UpgradedServices));
