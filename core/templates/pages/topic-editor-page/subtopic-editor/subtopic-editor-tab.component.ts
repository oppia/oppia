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
 * @fileoverview Component for the Subtopic Editor Tab.
 */

import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {AppConstants} from 'app.constants';
import {QuestionBackendApiService} from 'domain/question/question-backend-api.service';
import {ShortSkillSummary} from 'domain/skill/short-skill-summary.model';
import {SubtopicPage} from 'domain/topic/subtopic-page.model';
import {Subtopic} from 'domain/topic/subtopic.model';
import {TopicUpdateService} from 'domain/topic/topic-update.service';
import {Topic} from 'domain/topic/topic-object.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {Subscription} from 'rxjs';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {SubtopicValidationService} from '../services/subtopic-validation.service';
import {TopicEditorRoutingService} from '../services/topic-editor-routing.service';
import {TopicEditorStateService} from '../services/topic-editor-state.service';

@Component({
  selector: 'oppia-subtopic-editor-tab',
  templateUrl: './subtopic-editor-tab.component.html',
})
export class SubtopicEditorTabComponent implements OnInit, OnDestroy {
  hostname: string;
  topic: Topic;
  classroomUrlFragment: string;
  subtopic: Subtopic;
  subtopicId: number;
  errorMsg: string;
  subtopicUrlFragmentIsValid: boolean;
  subtopicUrlFragmentExists: boolean;
  skillIds: string[];
  questionCount: number;
  skillQuestionCountDict: object;
  editableTitle: string;
  editableThumbnailFilename: string;
  editableThumbnailBgColor: string;
  initialSubtopicUrlFragment: string;
  editableUrlFragment: string;
  subtopicPage: SubtopicPage;
  allowedBgColors;
  htmlData: string;
  uncategorizedSkillSummaries: ShortSkillSummary[];
  schemaEditorIsShown: boolean;
  htmlDataBeforeUpdate: string;
  toIndex: number;
  fromIndex: number;
  subtopicPreviewCardIsShown: boolean;
  skillsListIsShown: boolean;
  subtopicEditorCardIsShown: boolean;
  selectedSkillEditOptionsIndex: number;
  maxCharsInSubtopicTitle!: number;
  MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT!: number;
  SUBTOPIC_PAGE_SCHEMA: {type: string; ui_config: {rows: number}};
  generatedUrlPrefix: string;

  constructor(
    private questionBackendApiService: QuestionBackendApiService,
    private subtopicValidationService: SubtopicValidationService,
    private topicEditorRoutingService: TopicEditorRoutingService,
    private topicEditorStateService: TopicEditorStateService,
    private topicUpdateService: TopicUpdateService,
    private urlInterpolationService: UrlInterpolationService,
    private windowDimensionsService: WindowDimensionsService,
    private windowRef: WindowRef
  ) {}

  directiveSubscriptions = new Subscription();
  SKILL_EDITOR_URL_TEMPLATE = '/skill_editor/<skillId>';

  initEditor(): void {
    this.hostname = this.windowRef.nativeWindow.location.hostname;
    this.topic = this.topicEditorStateService.getTopic();
    this.classroomUrlFragment =
      this.topicEditorStateService.getClassroomUrlFragment();
    this.generatedUrlPrefix = `${this.hostname}/learn/${this.classroomUrlFragment}/${this.topic.getUrlFragment()}/revision`;
    this.subtopicId = this.topicEditorRoutingService.getSubtopicIdFromUrl();
    this.subtopic = this.topic.getSubtopicById(this.subtopicId);
    if (!this.subtopic) {
      this.topicEditorRoutingService.navigateToMainTab();
    }
    this.errorMsg = null;
    this.subtopicUrlFragmentExists = false;
    this.subtopicUrlFragmentIsValid = false;
    if (this.topic.getId() && this.subtopic) {
      this.topicEditorStateService.loadSubtopicPage(
        this.topic.getId(),
        this.subtopicId
      );
      this.skillIds = this.subtopic.getSkillIds();
      this.questionCount = 0;
      if (this.skillIds.length) {
        this.questionBackendApiService
          .fetchTotalQuestionCountForSkillIdsAsync(this.skillIds)
          .then(questionCount => {
            this.questionCount = questionCount;
          });
      }
      this.skillQuestionCountDict =
        this.topicEditorStateService.getSkillQuestionCountDict();
      this.editableTitle = this.subtopic.getTitle();
      this.editableThumbnailFilename = this.subtopic.getThumbnailFilename();
      this.editableThumbnailBgColor = this.subtopic.getThumbnailBgColor();
      this.editableUrlFragment = this.subtopic.getUrlFragment();
      this.initialSubtopicUrlFragment = this.subtopic.getUrlFragment();
      this.subtopicPage = this.topicEditorStateService.getSubtopicPage();
      this.allowedBgColors = AppConstants.ALLOWED_THUMBNAIL_BG_COLORS.subtopic;
      var pageContents = this.subtopicPage.getPageContents();
      if (pageContents) {
        this.htmlData = pageContents.getHtml();
      }
      this.uncategorizedSkillSummaries =
        this.topic.getUncategorizedSkillSummaries();
      this.subtopicUrlFragmentIsValid =
        this.subtopicValidationService.isUrlFragmentValid(
          this.editableUrlFragment
        );
    }
  }

  updateSubtopicTitle(title: string): void {
    if (title === this.subtopic.getTitle()) {
      return;
    }

    if (!this.subtopicValidationService.checkValidSubtopicName(title)) {
      this.errorMsg = 'A subtopic with this title already exists';
      return;
    }

    this.topicUpdateService.setSubtopicTitle(
      this.topic,
      this.subtopic.getId(),
      title
    );
    this.editableTitle = title;
  }

  drop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(
      this.subtopic.getSkillSummaries(),
      event.previousIndex,
      event.currentIndex
    );
    this.topicUpdateService.rearrangeSkillInSubtopic(
      this.topic,
      this.subtopic.getId(),
      event.previousIndex,
      event.currentIndex
    );
  }

  onSubtopicUrlFragmentChange(urlFragment: string): void {
    this.editableUrlFragment = urlFragment;
    this.updateSubtopicUrlFragment(urlFragment);
  }

  updateSubtopicUrlFragment(urlFragment: string): void {
    this.subtopicUrlFragmentIsValid =
      this.subtopicValidationService.isUrlFragmentValid(urlFragment);
    if (urlFragment === this.initialSubtopicUrlFragment) {
      this.subtopicUrlFragmentExists = false;
      return;
    }

    this.subtopicUrlFragmentExists =
      this.subtopicValidationService.doesSubtopicWithUrlFragmentExist(
        urlFragment
      );
    if (!this.subtopicUrlFragmentIsValid || this.subtopicUrlFragmentExists) {
      return;
    }

    this.topicUpdateService.setSubtopicUrlFragment(
      this.topic,
      this.subtopic.getId(),
      urlFragment
    );
    this.editableUrlFragment = urlFragment;
  }

  updateSubtopicThumbnailFilename(newThumbnailFilename: string): void {
    var oldThumbnailFilename = this.subtopic.getThumbnailFilename();
    if (newThumbnailFilename === oldThumbnailFilename) {
      return;
    }
    this.topicUpdateService.setSubtopicThumbnailFilename(
      this.topic,
      this.subtopic.getId(),
      newThumbnailFilename
    );
    this.editableThumbnailFilename = newThumbnailFilename;
  }

  updateSubtopicThumbnailBgColor(newThumbnailBgColor: string): void {
    var oldThumbnailBgColor = this.subtopic.getThumbnailBgColor();
    if (newThumbnailBgColor === oldThumbnailBgColor) {
      return;
    }
    this.topicUpdateService.setSubtopicThumbnailBgColor(
      this.topic,
      this.subtopic.getId(),
      newThumbnailBgColor
    );
    this.editableThumbnailBgColor = newThumbnailBgColor;
  }

  resetErrorMsg(): void {
    this.errorMsg = null;
  }

  isSkillDeleted(skillSummary: ShortSkillSummary): boolean {
    return skillSummary.getDescription() === null;
  }

  getSkillEditorUrl(skillId: string): string {
    return this.urlInterpolationService.interpolateUrl(
      this.SKILL_EDITOR_URL_TEMPLATE,
      {
        skillId: skillId,
      }
    );
  }

  updateHtmlData(): void {
    if (this.htmlData !== this.subtopicPage.getPageContents().getHtml()) {
      var subtitledHtml = angular.copy(
        this.subtopicPage.getPageContents().getSubtitledHtml()
      );
      subtitledHtml.html = this.htmlData;
      this.topicUpdateService.setSubtopicPageContentsHtml(
        this.subtopicPage,
        this.subtopic.getId(),
        subtitledHtml
      );
      this.topicEditorStateService.setSubtopicPage(this.subtopicPage);
      this.schemaEditorIsShown = false;
    }
  }

  cancelHtmlDataChange(): void {
    this.htmlData = this.htmlDataBeforeUpdate;
    this.updateHtmlData();
    this.schemaEditorIsShown = false;
  }

  showSchemaEditor(): void {
    this.schemaEditorIsShown = true;
    this.htmlDataBeforeUpdate = angular.copy(this.htmlData);
  }

  toggleSubtopicPreview(): void {
    this.subtopicPreviewCardIsShown = !this.subtopicPreviewCardIsShown;
  }

  togglePreviewSkillCard(): void {
    if (!this.windowDimensionsService.isWindowNarrow()) {
      return;
    }
    this.skillsListIsShown = !this.skillsListIsShown;
  }

  toggleSubtopicEditorCard(): void {
    if (!this.windowDimensionsService.isWindowNarrow()) {
      return;
    }
    this.subtopicEditorCardIsShown = !this.subtopicEditorCardIsShown;
  }

  showSkillEditOptions(index: number): void {
    this.selectedSkillEditOptionsIndex =
      this.selectedSkillEditOptionsIndex === index ? -1 : index;
  }

  removeSkillFromSubtopic(skillSummary: ShortSkillSummary): void {
    this.selectedSkillEditOptionsIndex = -1;
    this.topicUpdateService.removeSkillFromSubtopic(
      this.topic,
      this.subtopicId,
      skillSummary
    );
    this.initEditor();
  }

  removeSkillFromTopic(skillSummary: ShortSkillSummary): void {
    this.selectedSkillEditOptionsIndex = -1;
    this.topicUpdateService.removeSkillFromSubtopic(
      this.topic,
      this.subtopicId,
      skillSummary
    );
    this.topicUpdateService.removeUncategorizedSkill(this.topic, skillSummary);
    this.initEditor();
  }

  navigateToTopicEditor(): void {
    this.topicEditorRoutingService.navigateToMainTab();
  }

  ngOnInit(): void {
    this.SUBTOPIC_PAGE_SCHEMA = {
      type: 'html',
      ui_config: {
        rows: 100,
      },
    };
    this.htmlData = '';
    this.skillsListIsShown = !this.windowDimensionsService.isWindowNarrow();
    this.subtopicPreviewCardIsShown = false;
    this.subtopicEditorCardIsShown = true;
    this.schemaEditorIsShown = false;
    this.directiveSubscriptions.add(
      this.topicEditorStateService.onSubtopicPageLoaded.subscribe(() => {
        this.subtopicPage = this.topicEditorStateService.getSubtopicPage();
        var pageContents = this.subtopicPage.getPageContents();
        this.htmlData = pageContents.getHtml();
      })
    );
    this.directiveSubscriptions.add(
      this.topicEditorStateService.onTopicInitialized.subscribe(() => {
        this.initEditor();
      })
    );
    this.directiveSubscriptions.add(
      this.topicEditorStateService.onTopicReinitialized.subscribe(() => {
        this.initEditor();
      })
    );
    if (this.topicEditorStateService.hasLoadedTopic()) {
      this.initEditor();
    }
    this.maxCharsInSubtopicTitle = AppConstants.MAX_CHARS_IN_SUBTOPIC_TITLE;
    this.MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT =
      AppConstants.MAX_CHARS_IN_SUBTOPIC_URL_FRAGMENT;
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
