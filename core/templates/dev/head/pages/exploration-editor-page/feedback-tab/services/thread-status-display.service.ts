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

import * as cloneDeep from 'lodash/cloneDeep';

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

@Injectable({
  providedIn: 'root'
})
export class ThreadStatusDisplayService {
  private readonly _STATUS_CHOICES = [{
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

  private readonly STATUS_CHOICES = cloneDeep(this._STATUS_CHOICES);

  getLabelClass(status: string): string {
    if (status === 'open') {
      return 'label label-info';
    } else if (status === 'compliment') {
      return 'label label-success';
    } else {
      return 'label label-default';
    }
  }

  getHumanReadableStatus(status: string): string {
    for (var i = 0; i < this._STATUS_CHOICES.length; i++) {
      if (this._STATUS_CHOICES[i].id === status) {
        return this._STATUS_CHOICES[i].text;
      }
    }
    return '';
  }
}

var oppia = require('AppInit.ts').module;

oppia.factory(
  'ThreadStatusDisplayService',
  downgradeInjectable(ThreadStatusDisplayService));
