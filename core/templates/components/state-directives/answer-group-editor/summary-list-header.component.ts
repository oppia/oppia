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

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

/**
 * @fileoverview Component for the header of items in a list.
 */

interface DeleteSummaryEventData {
  index: number,
  event: Event
}

@Component({
  selector: 'oppia-summary-list-header',
  templateUrl: './summary-list-header.component.html'
})
export class SummaryListHeaderComponent {
 @Input() disableSorting: boolean;
 @Input() index: number;
 @Input() summary: string;
 @Input() shortSummary: string;
 @Input() isActive: boolean;
 @Output() summaryDelete:
 EventEmitter<DeleteSummaryEventData> = (new EventEmitter());
 @Input() isDeleteAvailable: boolean;
 @Input() numItems: number;

 deleteItem(evt: Event): void {
   let eventData = {
     index: this.index,
     event: evt
   };
   this.summaryDelete.emit(eventData);
 }
}

angular.module('oppia').directive(
  'oppiaSummaryListHeader', downgradeComponent({
    component: SummaryListHeaderComponent
  }
  ));
