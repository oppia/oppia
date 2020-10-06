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
 * @fileoverview Component for the topic viewer stories list.
 */

import { Component, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { StorySummary } from 'domain/story/story-summary.model';

@Component({
  selector: 'stories-list',
  templateUrl: './topic-viewer-stories-list.component.html',
  styleUrls: []
})
export class StoriesListComponent {
  @Input() canonicalStorySummaries: StorySummary[];
  @Input() classroomUrlFragment: string;
  @Input() topicUrlFragment: string;
  @Input() topicName: string;
  @Input() topicDescription: string;
  constructor() {}
}
angular.module('oppia').directive(
  'storiesList', downgradeComponent(
    {component: StoriesListComponent}));
