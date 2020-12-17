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
 * @fileoverview Service that handles routing for the topic editor page.
 */

import { Location } from '@angular/common';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { PageTitleService } from 'services/page-title.service';
import { WindowRef } from 'services/contextual/window-ref.service';

@Injectable({
  providedIn: 'root'
})
export class TopicEditorRoutingService {
  currentPath: string = '';
  MAIN_TAB: string = 'main';
  SUBTOPIC_EDITOR_TAB: string = 'subtopic_editor';
  SUBTOPIC_PREVIEW_TAB: string = 'subtopic_preview';
  TOPIC_PREVIEW_TAB: string = 'topic_preview';
  QUESTIONS_TAB: string = 'questions';
  lastTabVisited: string = 'main';
  lastSubtopicId: number = null;
  // This variable checks whether the file is running
  // in testing or in server. If running in testing mode the whole
  // URL of the window is not used (ex-URL : /questions),
  // which clashes with running on the server where whole URL is used.
  // (ex-URL : http://localhost:8181/topic_editor/6xposGcAZShX#/questions).
  inSpecMode: boolean = false;

  activeTabName: string = this.MAIN_TAB;

  constructor(
    private location: Location,
    private pageTitleService: PageTitleService,
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef) {
    this.currentPath = this.location.path();
    this.location.onUrlChange((newPath: string, state: unknown) => {
      if (!this.inSpecMode) {
        newPath = newPath.split('#')[1];
      }
      if (newPath === '') {
        this.location.go(this.currentPath);
        return;
      }
      if (newPath === '/') {
        this.activeTabName = this.MAIN_TAB;
      } else if (newPath === '/questions') {
        this.activeTabName = this.QUESTIONS_TAB;
      } else if (newPath.startsWith('/subtopic_editor')) {
        this.activeTabName = this.SUBTOPIC_EDITOR_TAB;
      } else if (newPath.startsWith('/subtopic_preview')) {
        this.activeTabName = this.SUBTOPIC_PREVIEW_TAB;
      } else if (newPath.startsWith('/topic_preview')) {
        this.activeTabName = this.TOPIC_PREVIEW_TAB;
      }
    });
    this.location.go(this.currentPath);
  }

  getActiveTabName(): string {
    return this.activeTabName;
  }

  getLastTabVisited(): string {
    return this.lastTabVisited;
  }

  getLastSubtopicIdVisited(): number {
    return this.lastSubtopicId;
  }

  navigateToMainTab(): void {
    this.lastTabVisited = 'topic';
    this.location.go('/');
  }

  navigateToSubtopicPreviewTab(subtopicId: string | number): void {
    this.lastTabVisited = 'subtopic';
    this.pageTitleService.setPageTitleForMobileView('Subtopic Preview');
    this.location.go('/subtopic_preview/' + subtopicId);
  }

  navigateToTopicPreviewTab(): void {
    this.lastTabVisited = 'topic';
    this.pageTitleService.setPageTitleForMobileView('Topic Preview');
    this.location.go('/topic_preview/');
  }

  navigateToSubtopicEditorWithId(subtopicId: string | number): void {
    this.lastTabVisited = 'subtopic';
    this.pageTitleService.setPageTitleForMobileView('Subtopic Editor');
    this.location.go('/subtopic_editor/' + subtopicId);
  }

  navigateToQuestionsTab(): void {
    this.lastSubtopicId = this.getSubtopicIdFromUrl();
    this.pageTitleService.setPageTitleForMobileView('Question Editor');
    this.location.go('/questions');
  }

  getSubtopicIdFromUrl(): number {
    return parseInt(this.location.path().split('/')[2]);
  }

  navigateToSkillEditorWithId(skillId: string): void {
    const SKILL_EDITOR_URL_TEMPLATE = '/skill_editor/<skill_id>';

    const skillEditorUrl = this.urlInterpolationService.interpolateUrl(
      SKILL_EDITOR_URL_TEMPLATE, {
        skill_id: skillId
      });
    this.windowRef.nativeWindow.open(skillEditorUrl);
  }
}

angular.module('oppia').factory(
  'TopicEditorRoutingService', downgradeInjectable(TopicEditorRoutingService));
