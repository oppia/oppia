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
 * @fileoverview Service that provides information about how to display the
 * cards and data in the improvements tab of the exploration editor.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

@Injectable({providedIn: 'root'})
export class ImprovementsDisplayService {
  static STATUS_CHOICES = {
    open: {text: 'Open', cssClass: 'label label-info'},
    fixed: {text: 'Fixed', cssClass: 'label label-default'},
    ignored: {text: 'Ignored', cssClass: 'label label-default'},
    compliment: {text: 'Compliment', cssClass: 'label label-success'},
    not_actionable: {text: 'Not Actionable', cssClass: 'label label-default'},
  };

  isOpen(status: string): boolean {
    return status === 'open';
  }

  getStatusCssClass(status: string): string {
    return ImprovementsDisplayService.STATUS_CHOICES[status].cssClass ||
      'label label-default';
  }

  getHumanReadableStatus(status: string): string {
    return ImprovementsDisplayService.STATUS_CHOICES[status].text || '';
  }
}

angular.module('oppia').factory(
  'ImprovementsDisplayService',
  downgradeInjectable(ImprovementsDisplayService));
