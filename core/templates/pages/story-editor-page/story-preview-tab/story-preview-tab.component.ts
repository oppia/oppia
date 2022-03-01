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
 * @fileoverview Component for the story preview tab.
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { StoryNode } from 'domain/story/story-node.model';
import { StoryContents } from 'domain/story/story-contents-object.model';
import { Story } from 'domain/story/StoryObjectFactory';
import { Subscription } from 'rxjs';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { UrlService } from 'services/contextual/url.service';
import { StoryEditorStateService } from '../services/story-editor-state.service';

interface IconsArray {
    'thumbnailIconUrl': string;
    'thumbnailBgColor': string;
}

@Component({
  selector: 'oppia-story-preview-tab',
  templateUrl: './story-preview-tab.component.html'
})
export class StoryPreviewTabComponent implements OnInit, OnDestroy {
  story: Story;
  storyId: string;
  storyContents: StoryContents;
  nodes: StoryNode[];
  pathIconParameters: IconsArray[];
  constructor(
    private storyEditorStateService: StoryEditorStateService,
    private assetsBackendApiService: AssetsBackendApiService,
    private urlService: UrlService,
  ) {}

  directiveSubscriptions = new Subscription();
  initEditor(): void {
    this.story = this.storyEditorStateService.getStory();
    this.storyId = this.story.getId();
    this.storyContents = this.story.getStoryContents();
    if (this.storyContents &&
        this.storyContents.getNodes().length > 0) {
      this.nodes = this.storyContents.getNodes();
      this.pathIconParameters = this.generatePathIconParameters();
    }
  }

  generatePathIconParameters(): IconsArray[] {
    var storyNodes = this.nodes;
    var iconParametersArray = [];
    let thumbnailIconUrl = storyNodes[0].getThumbnailFilename() ? (
            this.assetsBackendApiService.getThumbnailUrlForPreview(
              'story', this.storyId,
              storyNodes[0].getThumbnailFilename())) : null;
    iconParametersArray.push({
      thumbnailIconUrl: thumbnailIconUrl,
      thumbnailBgColor: storyNodes[0].getThumbnailBgColor()
    });

    for (
      var i = 1; i < this.nodes.length; i++) {
      thumbnailIconUrl = storyNodes[i].getThumbnailFilename() ? (
          this.assetsBackendApiService.getThumbnailUrlForPreview(
            'story', this.storyId,
            storyNodes[i].getThumbnailFilename())) : null;
      iconParametersArray.push({
        thumbnailIconUrl: thumbnailIconUrl,
        thumbnailBgColor: storyNodes[i].getThumbnailBgColor()
      });
    }
    return iconParametersArray;
  }

  getExplorationUrl(node: {
     getExplorationId: () => string;
     getId: () => string; }): string {
    var result = '/explore/' + node.getExplorationId();
    result = this.urlService.addField(
      result, 'story_id', this.storyId);
    result = this.urlService.addField(
      result, 'node_id', node.getId());
    return result;
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.storyEditorStateService.onStoryInitialized.subscribe(
        () => this.initEditor()
      )
    );
    this.directiveSubscriptions.add(
      this.storyEditorStateService.onStoryReinitialized.subscribe(
        () => this.initEditor()
      )
    );
    this.initEditor();
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
angular.module('oppia').directive(
  'oppiaStoryPreviewTab', downgradeComponent(
    {component: StoryPreviewTabComponent}));
