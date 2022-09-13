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
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() topicSummaries!:
    { id: string; name: string; isSelected: boolean }[];

  @Input() selectedTopicIds!: string[];
  @Output() selectedTopicIdsChange: EventEmitter<string[]> = (
    new EventEmitter());

  topicsSelected: string[] = [];
  topicFilterText: string = '';
  filteredTopics: { id: string; name: string; isSelected: boolean }[] = [];

  selectOrDeselectTopic(topicId: string): void {
    let topic = this.topicSummaries.find(
      topic => topic.id === topicId);
    if (topic === undefined) {
      throw new Error('No Topic with given topicId exists!');
    }
    let index: number = this.topicSummaries.indexOf(topic);
    if (!this.topicSummaries[index].isSelected) {
      this.selectedTopicIds.push(topicId);
      this.topicSummaries[index].isSelected = true;
      this.topicsSelected.push(this.topicSummaries[index].name);
    } else {
      let idIndex: number = this.selectedTopicIds.indexOf(topicId);
      let nameIndex = this.topicsSelected.indexOf(
        this.topicSummaries[index].name);
      this.selectedTopicIds.splice(idIndex, 1);
      this.topicSummaries[index].isSelected = false;
      this.topicsSelected.splice(nameIndex, 1);
    }
    this.selectedTopicIdsChange.emit(this.selectedTopicIds);
  }

  searchInTopics(searchText: string):
  { id: string; name: string; isSelected: boolean }[] {
    this.filteredTopics = this.topicSummaries.filter(
      topic => topic.name.toLowerCase().indexOf(
        searchText.toLowerCase()) !== -1);
    return this.filteredTopics;
  }
}

angular.module('oppia').directive('oppiaSelectTopics',
  downgradeComponent({ component: SelectTopicsComponent }));
