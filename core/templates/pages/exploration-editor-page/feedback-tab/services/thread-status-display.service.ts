// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * status label for a thread in the feedback tab of the exploration editor.
 */

import cloneDeep from 'lodash/cloneDeep';

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

@Injectable({
  providedIn: 'root'
})
export class ThreadStatusDisplayService {
  static _STATUS_CHOICES = [{
    id: 'open',
    text: 'Open'
  }, {
    id: 'fixed',
    text: 'Fixed'
  }, {
    id: 'ignored',
    text: 'Ignored'
  }, {
    id: 'compliment',
    text: 'Compliment'
  }, {
    id: 'not_actionable',
    text: 'Not Actionable'
  }];

  STATUS_CHOICES = cloneDeep(ThreadStatusDisplayService._STATUS_CHOICES);

  getLabelClass(status: string): string {
    if (status === 'open') {
      return 'badge badge-info';
    } else if (status === 'compliment') {
      return 'badge badge-success';
    } else {
      return 'badge badge-secondary';
    }
  }

  getHumanReadableStatus(status: string): string {
    for (
      var i = 0; i < ThreadStatusDisplayService._STATUS_CHOICES.length; i++) {
      if (ThreadStatusDisplayService._STATUS_CHOICES[i].id === status) {
        return ThreadStatusDisplayService._STATUS_CHOICES[i].text;
      }
    }
    return '';
  }
}

angular.module('oppia').factory(
  'ThreadStatusDisplayService',
  downgradeInjectable(ThreadStatusDisplayService));
