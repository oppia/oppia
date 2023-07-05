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
  Component, OnInit, Input, Output, EventEmitter, HostListener, ViewChild,
  ElementRef
} from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { ContributionOpportunitiesBackendApiService } from
  // eslint-disable-next-line max-len
  'pages/contributor-dashboard-page/services/contribution-opportunities-backend-api.service';

@Component({
  selector: 'translation-topic-selector',
  templateUrl: './translation-topic-selector.component.html'
})
export class TranslationTopicSelectorComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() activeTopicName!: string;
  @Output() setActiveTopicName: EventEmitter<string> = new EventEmitter();
  @ViewChild('dropdown', {'static': false}) dropdownRef!: ElementRef;

  options!: string[];
  dropdownShown = false;

  constructor(
    private contributionOpportunitiesBackendApiService:
      ContributionOpportunitiesBackendApiService
  ) {}

  ngOnInit(): void {
    this.contributionOpportunitiesBackendApiService
      .fetchTranslatableTopicNamesAsync()
      .then((topicNames) => {
        this.options = topicNames;
      });
  }

  toggleDropdown(): void {
    this.dropdownShown = !this.dropdownShown;
  }

  selectOption(activeTopicName: string): void {
    this.setActiveTopicName.emit(activeTopicName);
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

angular.module('oppia').directive(
  'translationTopicSelector',
  downgradeComponent({
    component: TranslationTopicSelectorComponent,
    inputs: ['activeTopicName'],
    outputs: ['setActiveTopicName']
  }));
