// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Topic filter component for the blog home page.
 */

import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter} from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'oppia-topic-filter',
  templateUrl: './topic-filter.component.html'
})

export class TopicFilterComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() defaultTopicNames!: string[];
  @Input() selectedTopicNames: string[] = [];
  @Output() selectionsChange: EventEmitter<string[]> = (
    new EventEmitter());

  separatorKeysCodes: number[] = [ENTER, COMMA];
  topicFilter = new FormControl('');
  searchDropDownTopics: string[] = [];
  filteredTopics!: Observable<string[]>;

  @ViewChild('topicFilterInput') topicFilterInput!: (
    ElementRef<HTMLInputElement>);

  @ViewChild('trigger') autoTrigger!: MatAutocompleteTrigger;

  constructor() {
    this.filteredTopics = this.topicFilter.valueChanges.pipe(
      startWith(null),
      map((topic: string | null) => (
        topic ? this.filter(topic) : this.searchDropDownTopics.slice())),
    );
  }

  filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.searchDropDownTopics.filter(
      topic => topic.toLowerCase().includes(filterValue));
  }

  removeTopic(topic: string, topicsList: string[]): void {
    const index = topicsList.indexOf(topic);
    if (index >= 0) {
      topicsList.splice(index, 1);
    }
  }

  deselectTopic(topic: string): void {
    this.removeTopic(topic, this.selectedTopicNames);
    this.searchDropDownTopics.push(topic);
    this.refreshSearchDropDownTopics();
    this.topicFilter.setValue(null);
  }

  selectTopic(event: { option: { viewValue: string}}): void {
    this.selectedTopicNames.push(event.option.viewValue);
    this.refreshSearchDropDownTopics();
    this.topicFilterInput.nativeElement.value = '';
    this.topicFilter.setValue(null);
  }

  refreshSearchDropDownTopics(): void {
    this.searchDropDownTopics = this.defaultTopicNames;
    if (this.selectedTopicNames.length > 0) {
      for (let topic of this.selectedTopicNames) {
        this.removeTopic(topic, this.searchDropDownTopics);
      }
    }
  }

  ngOnInit(): void {
    this.refreshSearchDropDownTopics();
    this.filteredTopics.pipe(
      debounceTime(1500), distinctUntilChanged()
    ).subscribe(() => {
      this.selectionsChange.emit(this.selectedTopicNames);
    });
  }
}
