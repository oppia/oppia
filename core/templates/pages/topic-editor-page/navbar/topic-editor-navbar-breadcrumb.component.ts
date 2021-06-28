// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the navbar breadcrumb of the topic editor.
 */

import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { Topic } from 'domain/topic/TopicObjectFactory';
import { TopicEditorRoutingService } from '../services/topic-editor-routing.service';
import { TopicEditorStateService } from '../services/topic-editor-state.service';

@Component({
  selector: 'oppia-topic-editor-navbar-breadcrumb',
  templateUrl: './topic-editor-navbar-breadcrumb.component.html'
})
export class TopicEditorNavbarBreadcrumbComponent {
  topic: Topic;

  constructor(
    private topicEditorRoutingService: TopicEditorRoutingService,
    private topicEditorStateService: TopicEditorStateService
  ) {}

  canNavigateToTopicEditorPage(): boolean {
    const activeTab = this.topicEditorRoutingService.getActiveTabName();
    return (
      activeTab.startsWith('subtopic') ||
      this.topicEditorRoutingService.getLastTabVisited() === 'subtopic');
  }

  navigateToMainTab(): void {
    this.topicEditorRoutingService.navigateToMainTab();
  }

  ngOnInit(): void {
    this.topic = this.topicEditorStateService.getTopic();
  }
}

angular.module('oppia').directive('oppiaTopicEditorNavbarBreadcrumb',
  downgradeComponent({
    component: TopicEditorNavbarBreadcrumbComponent
  }) as angular.IDirectiveFactory);
