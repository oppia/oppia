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
 * @fileoverview Component for the translation topic select.
 */

import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ViewChild,
  ElementRef,
} from '@angular/core';

import {ContributorDashboardConstants} from 'pages/contributor-dashboard-page/contributor-dashboard-page.constants';
import {
  ALL_TOPICS_OPTION,
  ContributionOpportunitiesBackendApiService,
  TranslatableTopic,
  // eslint-disable-next-line max-len
} from 'pages/contributor-dashboard-page/services/contribution-opportunities-backend-api.service';

@Component({
  selector: 'translation-topic-selector',
  templateUrl: './translation-topic-selector.component.html',
  styleUrls: ['./translation-topic-selector.component.css'],
})
export class TranslationTopicSelectorComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() activeTopicId!: string;
  @Output() setActiveTopicId: EventEmitter<string> = new EventEmitter();
  @ViewChild('dropdown', {static: false}) dropdownRef!: ElementRef;

  dropdownShown = false;
  topicsPerClassroomMap: Record<string, TranslatableTopic[]> = {};
  // Maps topic IDs to topic names, so that the name of the active topic can
  // be displayed while only its ID is tracked.
  private topicIdToName: Record<string, string> = {
    [ALL_TOPICS_OPTION.id]: ALL_TOPICS_OPTION.name,
  };

  constructor(
    private contributionOpportunitiesBackendApiService: ContributionOpportunitiesBackendApiService
  ) {}

  ngOnInit(): void {
    this.contributionOpportunitiesBackendApiService
      .fetchTranslatableTopicsPerClassroomAsync()
      .then(topicsPerClassroom => {
        topicsPerClassroom.forEach(({classroom, topics}) => {
          this.topicsPerClassroomMap[classroom] = topics;
          topics.forEach(topic => {
            this.topicIdToName[topic.id] = topic.name;
          });
        });
      });

    // Set the initial active topic to "All".
    this.activeTopicId = ContributorDashboardConstants.TOPIC_SENTINEL_ID_ALL;
    this.setActiveTopicId.emit(this.activeTopicId);
  }

  getActiveTopicName(): string {
    return this.topicIdToName[this.activeTopicId] ?? '';
  }

  toggleDropdown(): void {
    this.dropdownShown = !this.dropdownShown;
  }

  selectOption(activeTopicId: string): void {
    this.setActiveTopicId.emit(activeTopicId);
    this.dropdownShown = false;
  }

  /**
   * Close dropdown when outside elements are clicked
   * @param event mouse click event
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const targetElement = event.target as HTMLElement;
    if (
      targetElement &&
      !this.dropdownRef.nativeElement.contains(targetElement)
    ) {
      this.dropdownShown = false;
    }
  }
}
