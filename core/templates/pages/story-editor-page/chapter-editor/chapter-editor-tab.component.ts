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
 * @fileoverview Component for the chapter editor tab.
 */

import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {StoryEditorStateService} from '../services/story-editor-state.service';
import {StoryEditorNavigationService} from '../services/story-editor-navigation.service';
import {StoryUpdateService} from 'domain/story/story-update.service';
import {Story} from 'domain/story/story.model';
import {StoryContents} from 'domain/story/story-contents-object.model';
import {StoryNode} from 'domain/story/story-node.model';

@Component({
  selector: 'oppia-chapter-editor-tab',
  templateUrl: './chapter-editor-tab.component.html',
})
export class ChapterEditorTabComponent implements OnInit, OnDestroy {
  story: Story;
  storyContents: StoryContents;
  chapterIndex: number | null;
  chapterId: string;
  node: StoryNode;
  nodes: StoryNode[];

  constructor(
    private storyUpdateService: StoryUpdateService,
    private storyEditorStateService: StoryEditorStateService,
    private storyEditorNavigationService: StoryEditorNavigationService
  ) {}

  directiveSubscriptions = new Subscription();

  initEditor(): void {
    this.story = this.storyEditorStateService.getStory();
    this.storyContents = this.story.getStoryContents();
    this.chapterIndex = this.storyEditorNavigationService.getChapterIndex();
    this.chapterId = this.storyEditorNavigationService.getChapterId();
    if (this.storyContents && this.storyContents.getNodes().length > 0) {
      this.nodes = this.storyContents.getNodes();
      if (!this.chapterIndex) {
        this.storyContents.getNodes().map((node, index) => {
          if (node.getId() === this.chapterId) {
            this.chapterIndex = index;
            return;
          }
        });
      }
      this.node = this.nodes[this.chapterIndex];
    }
  }

  navigateToStoryEditor(): void {
    this.storyEditorNavigationService.navigateToStoryEditor();
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.storyEditorStateService.onStoryInitialized.subscribe(() =>
        this.initEditor()
      )
    );
    this.directiveSubscriptions.add(
      this.storyEditorStateService.onStoryReinitialized.subscribe(() =>
        this.initEditor()
      )
    );
    this.directiveSubscriptions.add(
      this.storyUpdateService.storyChapterUpdateEventEmitter.subscribe(() => {})
    );
    this.initEditor();
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
