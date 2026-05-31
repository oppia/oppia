// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Story section for the redesigned topic viewer page.
 */

import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';

import {StorySummary} from 'domain/story/story-summary.model';
import {Subtopic} from 'domain/topic/subtopic.model';
import {UrlService} from 'services/contextual/url.service';

import {TopicContentTab} from '../topic-content-filter/topic-content-filter.component';
import {TopicFlowOrderingService} from '../services/topic-flow-ordering.service';
import {TopicProgressNode} from '../topic-progress/topic-progress.component';

import './topic-story-section.component.css';

@Component({
  selector: 'topic-story-section',
  templateUrl: './topic-story-section.component.html',
  styleUrls: ['./topic-story-section.component.css'],
})
export class TopicStorySectionComponent implements OnInit, OnChanges {
  @Input() storySummary!: StorySummary;
  @Input() subtopics!: Subtopic[];
  @Input() nodes: TopicProgressNode[] = [];
  @Input() activeNodeId = '';
  @Input() activeTab: TopicContentTab = 'all';

  classroomUrlFragment = '';
  topicUrlFragment = '';

  lessonCount = 0;
  practiceCount = 0;
  visibleNodes: TopicProgressNode[] = [];

  constructor(
    private topicFlowOrderingService: TopicFlowOrderingService,
    private urlService: UrlService
  ) {}

  ngOnInit(): void {
    this.classroomUrlFragment =
      this.urlService.getClassroomUrlFragmentFromLearnerUrl();
    this.topicUrlFragment = this.urlService.getTopicUrlFragmentFromLearnerUrl();
    this.lessonCount = this.storySummary.getNodeTitles().length;
    this.practiceCount = this.getPracticeCount();

    if (!this.nodes.length) {
      this.nodes = this.topicFlowOrderingService
        .buildTopicProgressData([this.storySummary], this.subtopics)
        .nodes.filter(
          node => node.storySummary?.getId() === this.storySummary.getId()
        );
    }

    this.updateVisibleNodes();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['activeTab'] !== undefined ||
      changes['nodes'] !== undefined ||
      changes['storySummary'] !== undefined
    ) {
      this.updateVisibleNodes();
    }
  }

  // Open the Study Skills modal or navigate to study skills page.
  // For now this is a placeholder that can be wired to a real modal or
  // navigation handler in a follow-up change.
  onOpenStudySkills(): void {
    // TODO: integrate with Study Skills flow. Emit event or navigate.
    // For now we simply log to console for manual verification in UI.
    try {
      // eslint-disable-next-line no-console
      console.log('Open Study Skills for story', this.storySummary.getId());
    } catch (e) {
      // ignore
    }
  }

  getPracticeCount(): number {
    return this.subtopics.filter(
      subtopic => subtopic.getSkillSummaries().length > 0
    ).length;
  }

  shouldShowNode(node: TopicProgressNode): boolean {
    if (this.activeTab === 'all') {
      return true;
    }
    if (this.activeTab === 'lessons') {
      return node.type === 'lesson';
    }
    return node.type === 'practice';
  }

  private updateVisibleNodes(): void {
    this.visibleNodes = this.nodes.filter(node => this.shouldShowNode(node));
  }
}
