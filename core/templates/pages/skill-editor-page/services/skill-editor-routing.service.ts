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
 * @fileoverview Service that handles routing for the skill editor page.
 */

import {Injectable} from '@angular/core';
import {WindowRef} from 'services/contextual/window-ref.service';

@Injectable({
  providedIn: 'root',
})
export class SkillEditorRoutingService {
  MAIN_TAB = 'main';
  QUESTIONS_TAB = 'questions';
  PREVIEW_TAB = 'preview';
  activeTab = this.MAIN_TAB;
  questionIsBeingCreated: boolean = false;

  constructor(private windowRef: WindowRef) {
    let currentHash: string = this.windowRef.nativeWindow.location.hash;
    this._changeTab(currentHash.substring(1, currentHash.length));
  }

  _changeTab(newPath: string): void {
    if (newPath === '') {
      this._changeTab('/');
      return;
    }

    this.windowRef.nativeWindow.location.hash = newPath;

    if (newPath === '/') {
      this.activeTab = this.MAIN_TAB;
    } else if (newPath === '/questions') {
      this.activeTab = this.QUESTIONS_TAB;
    } else if (newPath === '/preview') {
      this.activeTab = this.PREVIEW_TAB;
    }
  }

  getActiveTabName(): string {
    return this.activeTab;
  }

  getTabStatuses(): string {
    return this.activeTab;
  }

  navigateToMainTab(): void {
    this._changeTab('');
  }

  navigateToQuestionsTab(): void {
    this._changeTab('/questions');
  }

  navigateToPreviewTab(): void {
    this._changeTab('/preview');
  }

  // To navigate directly to question-editor interface
  // from skill editor page.
  creatingNewQuestion(editorIsOpen: boolean): void {
    if (editorIsOpen) {
      this.questionIsBeingCreated = true;
    } else {
      this.questionIsBeingCreated = false;
    }
  }

  navigateToQuestionEditor(): boolean {
    return this.questionIsBeingCreated;
  }
}
