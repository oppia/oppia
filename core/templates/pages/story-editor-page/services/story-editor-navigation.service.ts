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
 * @fileoverview Service to handle navigation in story editor page.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { WindowRef } from 'services/contextual/window-ref.service';

const STORY_EDITOR = 'story_editor';
const CHAPTER_EDITOR = 'chapter_editor';
const STORY_PREVIEW = 'story_preview';

@Injectable({
  providedIn: 'root'
})
export class StoryEditorNavigationService {
    activeTab: string = 'story_editor';
    chapterId: string = null;
    chapterIndex: number = null;
    constructor(private windowRef: WindowRef) {}

    getActiveTab() {
      return this.activeTab;
    }
    setChapterId(id) {
      this.chapterId = id;
    }
    getChapterIndex() {
      return this.chapterIndex;
    }
    getChapterId() {
      return this.chapterId;
    }
    navigateToChapterEditorWithId(id, index) {
      this.activeTab = CHAPTER_EDITOR;
      this.setChapterId(id);
      this.chapterIndex = index;
      this.windowRef.nativeWindow.location.hash = '/chapter_editor/' + id;
    }
    checkIfPresentInChapterEditor() {
      const chapterId = this.windowRef.nativeWindow.location.hash.split('/')[2];
      if (chapterId) {
        this.chapterId = chapterId;
        return true;
      }
      return false;
    }
    checkIfPresentInStoryPreviewTab() {
      return (
        this.windowRef.nativeWindow.location.hash.split('/')[1] ===
          'story_preview');
    }
    navigateToChapterEditor() {
      this.navigateToChapterEditorWithId(this.chapterId, null);
    }
    navigateToStoryEditor() {
      this.activeTab = STORY_EDITOR;
      this.windowRef.nativeWindow.location.hash = '';
    }
    navigateToStoryPreviewTab() {
      this.windowRef.nativeWindow.location.hash = '/story_preview/';
      this.activeTab = STORY_PREVIEW;
    }
}

angular.module('oppia').factory(
  'StoryEditorNavigationService',
  downgradeInjectable(StoryEditorNavigationService));
