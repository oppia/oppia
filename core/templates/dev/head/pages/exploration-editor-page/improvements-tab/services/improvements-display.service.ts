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
 * tasks and data in the improvements tab of the exploration editor.
 */
import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { ExplorationEditorPageConstants } from
  'pages/exploration-editor-page/exploration-editor-page.constants';

@Injectable({
  providedIn: 'root'
})
export class ImprovementsDisplayService {
  STATUS_CHOICES = {
    [ExplorationEditorPageConstants.STATUS_COMPLIMENT]: {
      text: 'Compliment',
      cssClass: 'badge badge-success',
    },
    [ExplorationEditorPageConstants.STATUS_FIXED]: {
      text: 'Fixed',
      cssClass: 'badge badge-default',
    },
    [ExplorationEditorPageConstants.STATUS_IGNORED]: {
      text: 'Ignored',
      cssClass: 'badge badge-default',
    },
    [ExplorationEditorPageConstants.STATUS_NOT_ACTIONABLE]: {
      text: 'Not Actionable',
      cssClass: 'badge badge-default',
    },
    [ExplorationEditorPageConstants.STATUS_OPEN]: {
      text: 'Open',
      cssClass: 'badge badge-info',
    },
  };

  isOpen(status: string): boolean {
    return status === ExplorationEditorPageConstants.STATUS_OPEN;
  }
  getStatusCssClass(status: string): string {
    return this.STATUS_CHOICES.hasOwnProperty(status) ?
      this.STATUS_CHOICES[status].cssClass : 'badge badge-default';
  }
  getHumanReadableStatus(status: string): string {
    return this.STATUS_CHOICES.hasOwnProperty(status) ?
      this.STATUS_CHOICES[status].text : '';
  }
}

angular.module('oppia').factory(
  'ImprovementsDisplayService', downgradeInjectable(
    ImprovementsDisplayService));
