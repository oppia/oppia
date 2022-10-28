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

import { Injectable, EventEmitter } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { PageTitleService } from 'services/page-title.service';

@Injectable({
  providedIn: 'root'
})
export class TopicEditorRoutingService {
  private _MAIN_TAB = 'main';
  private _SUBTOPIC_EDITOR_TAB = 'subtopic_editor';
  private _SUBTOPIC_PREVIEW_TAB = 'subtopic_preview';
  private _TOPIC_PREVIEW_TAB = 'topic_preview';
  private _QUESTIONS_TAB = 'questions';
  private _lastTabVisited = 'main';
  // This property is initialized using private methods and we need to do
  // non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  private _lastSubtopicId!: number;
  private _activeTabName = this._MAIN_TAB;
  private _updateViewEventEmitter: EventEmitter<void> = new EventEmitter();

  constructor(
    private windowRef: WindowRef,
    private pageTitleService: PageTitleService,
    private urlInterpolationService: UrlInterpolationService
  ) {
    let currentHash: string = this.windowRef.nativeWindow.location.hash;
    this._changeTab(currentHash.substring(1, currentHash.length));
  }

  private _changeTab(newHash: string) {
    if (newHash === '') {
      this._changeTab('/');
    }
    this.windowRef.nativeWindow.location.hash = newHash;
    if (newHash === '/') {
      this._activeTabName = this._MAIN_TAB;
    } else if (newHash === '/questions') {
      this._activeTabName = this._QUESTIONS_TAB;
    } else if (newHash.startsWith('/subtopic_editor')) {
      this._activeTabName = this._SUBTOPIC_EDITOR_TAB;
    } else if (newHash.startsWith('/subtopic_preview')) {
      this._activeTabName = this._SUBTOPIC_PREVIEW_TAB;
    } else if (newHash.startsWith('/topic_preview')) {
      this._activeTabName = this._TOPIC_PREVIEW_TAB;
    }
    this._updateViewEventEmitter.emit();
  }

  getActiveTabName(): string {
    return this._activeTabName;
  }

  getLastTabVisited(): string {
    return this._lastTabVisited;
  }

  getLastSubtopicIdVisited(): number {
    return this._lastSubtopicId;
  }

  navigateToMainTab(): void {
    this._lastTabVisited = 'topic';
    this.pageTitleService.setNavbarTitleForMobileView('Topic Editor');
    this._changeTab('/');
  }

  navigateToSubtopicPreviewTab(subtopicId: number): void {
    this._lastTabVisited = 'subtopic';
    this.pageTitleService.setNavbarTitleForMobileView('Subtopic Preview');
    this._changeTab('/subtopic_preview/' + subtopicId);
  }

  navigateToTopicPreviewTab(): void {
    this._lastTabVisited = 'topic';
    this.pageTitleService.setNavbarTitleForMobileView('Topic Preview');
    this._changeTab('/topic_preview');
  }

  navigateToSubtopicEditorWithId(subtopicId: number): void {
    this._lastTabVisited = 'subtopic';
    this.pageTitleService.setNavbarTitleForMobileView('Subtopic Editor');
    this._changeTab('/subtopic_editor/' + subtopicId);
  }

  navigateToQuestionsTab(): void {
    this._lastSubtopicId = this.getSubtopicIdFromUrl();
    this.pageTitleService.setNavbarTitleForMobileView('Question Editor');
    this._changeTab('/questions');
  }

  getSubtopicIdFromUrl(): number {
    return parseInt(
      this.windowRef.nativeWindow.location.hash.split('/')[2]);
  }

  navigateToSkillEditorWithId(skillId: string): void {
    let SKILL_EDITOR_URL_TEMPLATE = '/skill_editor/<skill_id>';

    let skillEditorUrl = this.urlInterpolationService.interpolateUrl(
      SKILL_EDITOR_URL_TEMPLATE, {
        skill_id: skillId
      });
    this.windowRef.nativeWindow.open(skillEditorUrl);
  }

  get updateViewEventEmitter(): EventEmitter<void> {
    return this._updateViewEventEmitter;
  }
}

angular.module('oppia').factory('TopicEditorRoutingService',
  downgradeInjectable(TopicEditorRoutingService));
