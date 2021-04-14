// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the select topics viewer.
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'oppia-select-topics',
  templateUrl: './select-topics.component.html'
})
export class SelectTopicsComponent {
   @Input() topicSummaries: { isSelected: boolean }[];
   @Input() selectedTopicIds: string[];
   @Output() selectedTopicIdsChange: EventEmitter<string[]> = (
     new EventEmitter());

   ngOnInit(): void {
     console.log(this.topicSummaries);
   }

   selectOrDeselectTopic(topicId: string, index: number): void {
     if (!this.topicSummaries[index].isSelected) {
       this.selectedTopicIds.push(topicId);
       this.topicSummaries[index].isSelected = true;
     } else {
       let idIndex: number = this.selectedTopicIds.indexOf(topicId);
       this.selectedTopicIds.splice(idIndex, 1);
       this.topicSummaries[index].isSelected = false;
     }
     this.selectedTopicIdsChange.emit(this.selectedTopicIds);
   }
}

angular.module('oppia').directive('oppiaSelectTopics',
  downgradeComponent({ component: SelectTopicsComponent }));
