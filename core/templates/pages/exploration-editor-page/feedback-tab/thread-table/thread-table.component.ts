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
 * @fileoverview Component for displaying the list of threads in the feedback
 * tab of the exploration editor.
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { SuggestionThread } from 'domain/suggestion/suggestion-thread-object.model';
import { DateTimeFormatService } from 'services/date-time-format.service';
import { ThreadStatusDisplayService } from '../services/thread-status-display.service';

@Component({
  selector: 'oppia-thread-table',
  templateUrl: './thread-table.component.html'
})
export class ThreadTableComponent {
  @Output() rowClick: EventEmitter<string> = (
    new EventEmitter());

  @Input() threads: SuggestionThread[] = [];
  constructor(
    private dateTimeFormatService: DateTimeFormatService,
    private threadStatusDisplayService: ThreadStatusDisplayService
  ) { }

  onRowClick(threadId: string): void {
    this.rowClick.emit(threadId);
  }

  getLabelClass(status: string): string {
    return this.threadStatusDisplayService.getLabelClass(status);
  }

  getHumanReadableStatus(status: string): string {
    return this.threadStatusDisplayService.getHumanReadableStatus(status);
  }

  getLocaleAbbreviatedDateTimeString(millisSinceEpoch: number): string {
    return this.dateTimeFormatService
      .getLocaleAbbreviatedDatetimeString(millisSinceEpoch);
  }
}

angular.module('oppia').directive(
  'oppiaThreadTable', downgradeComponent(
    {component: ThreadTableComponent}));
