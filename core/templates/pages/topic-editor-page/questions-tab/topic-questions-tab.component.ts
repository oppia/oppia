// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the questions tab.
 */

import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {Topic} from 'domain/topic/topic-object.model';
import {TopicRights} from 'domain/topic/topic-rights.model';
import {
  CategorizedSkills,
  TopicsAndSkillsDashboardBackendApiService,
} from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-backend-api.service';
import {Subscription} from 'rxjs';
import {QuestionsListService} from 'services/questions-list.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {TopicEditorStateService} from '../services/topic-editor-state.service';
import {SkillSummary} from 'domain/skill/skill-summary.model';
import {ShortSkillSummary} from 'domain/skill/short-skill-summary.model';

@Component({
  selector: 'oppia-topic-questions-tab',
  templateUrl: './topic-questions-tab.component.html',
})
export class TopicQuestionsTabComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  topic!: Topic;
  topicRights!: TopicRights;
  groupedSkillSummaries!: object;
  skillIdToRubricsObject!: object;
  allSkillSummaries!: ShortSkillSummary[];
  canEditQuestion!: boolean;
  questionEditorOpened: boolean = false;
  newQuestionEditor: boolean = false;
  selectedSkillName!: string;
  selectedSkillId!: string;
  getSkillsCategorizedByTopics!: CategorizedSkills;
  getUntriagedSkillSummaries!: SkillSummary[];

  constructor(
    private focusManagerService: FocusManagerService,
    private questionsListService: QuestionsListService,
    private topicsAndSkillsDashboardBackendApiService: TopicsAndSkillsDashboardBackendApiService,
    private topicEditorStateService: TopicEditorStateService
  ) {}

  directiveSubscriptions = new Subscription();

  _initTab(): void {
    this.topic = this.topicEditorStateService.getTopic();
    this.topicRights = this.topicEditorStateService.getTopicRights();
    this.groupedSkillSummaries =
      this.topicEditorStateService.getGroupedSkillSummaries();
    this.skillIdToRubricsObject =
      this.topicEditorStateService.getSkillIdToRubricsObject();
    this.allSkillSummaries = [];
    this.allSkillSummaries = this.allSkillSummaries.concat(
      this.topic.getUncategorizedSkillSummaries()
    );
    for (let i = 0; i < this.topic.getSubtopics().length; i++) {
      let subtopic = this.topic.getSubtopics()[i];
      this.allSkillSummaries = this.allSkillSummaries.concat(
        subtopic.getSkillSummaries()
      );
    }
    this.topicsAndSkillsDashboardBackendApiService
      .fetchDashboardDataAsync()
      .then(response => {
        this.getSkillsCategorizedByTopics = response.categorizedSkillsDict;
        this.getUntriagedSkillSummaries = response.untriagedSkillSummaries;
      });
    this.canEditQuestion = this.topicRights.canEditTopic();
    this.questionEditorOpened =
      this.topicEditorStateService.isQuestionEditorOpened();
    this.newQuestionEditor = this.topicEditorStateService.isNewQuestionEditor();
    this.selectedSkillName = this.topicEditorStateService.getSelectedSkillName(
      this.selectedSkillId,
      this.allSkillSummaries
    );
  }

  getEditorAction(): string {
    return this.newQuestionEditor ? 'Creating new' : 'Editing';
  }

  reinitializeQuestionsList(skillId: string): void {
    this.selectedSkillId = skillId;
    this.questionsListService.resetPageNumber();
    this.questionsListService.getQuestionSummariesAsync(skillId, true, true);
  }

  ngAfterViewInit(): void {
    // To set autofocus when screen loads.
    this.focusManagerService.setFocus('selectSkillField');
  }

  ngOnInit(): void {
    // To-set autofocus when user navigates to editor using
    // question-editor-tab.
    this.focusManagerService.setFocus('selectSkillField');
    this.directiveSubscriptions.add(
      this.topicEditorStateService.onTopicInitialized.subscribe(() =>
        this._initTab()
      )
    );
    this.directiveSubscriptions.add(
      this.topicEditorStateService.onTopicReinitialized.subscribe(() =>
        this._initTab()
      )
    );
    this.directiveSubscriptions.add(
      this.topicEditorStateService.onQuestionEditorOpened.subscribe(() =>
        this._initTab()
      )
    );
    this._initTab();
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
    this.topicEditorStateService.toggleQuestionEditor(false);
  }
}
