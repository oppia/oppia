// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for home tab in the Learner Dashboard page.
 */

import { Component, Input } from '@angular/core';
import { LearnerTopicSummary } from 'domain/topic/learner-topic-summary.model';

 @Component({
   selector: 'oppia-home-tab',
   templateUrl: './home-tab.component.html'
 })
export class HomeTabComponent {
  @Input() currentGoals: LearnerTopicSummary[];
  @Input() newTopics: LearnerTopicSummary[];
  @Input() username: string;
  nextIncompleteNodeTitles: string[] = [];

  ngOnInit(): void {
  }

  getTimeOfDay(): string {
    let now = new Date();
    let time = now.getHours();

    if (time <= 12) {
      return 'morning';
    } else if (time <= 18) {
      return 'afternoon';
    }
    return 'evening';
  }
}
