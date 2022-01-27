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
 * @fileoverview Component for the main page of the story viewer.
 */

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { StoryViewerBackendApiService } from 'domain/story_viewer/story-viewer-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { UrlService } from 'services/contextual/url.service';
import { downgradeComponent } from '@angular/upgrade/static';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { UserService } from 'services/user.service';
import { AppConstants } from 'app.constants';
import { WindowRef } from 'services/contextual/window-ref.service';
import { LoaderService } from 'services/loader.service';
import { PageTitleService } from 'services/page-title.service';
import { AlertsService } from 'services/alerts.service';
import { StoryPlaythrough } from 'domain/story_viewer/story-playthrough.model';
import { ReadOnlyStoryNode } from 'domain/story_viewer/read-only-story-node.model';

interface IconParametersArray {
  thumbnailIconUrl: string;
  left: string;
  top: string;
  thumbnailBgColor: string;
}

@Component({
  selector: 'oppia-story-viewer-page',
  templateUrl: './story-viewer-page.component.html'
})
export class StoryViewerPageComponent implements OnInit {
  @ViewChild('overlay') overlay: ElementRef<HTMLDivElement>;
  @ViewChild('skip') skipButton: ElementRef<HTMLButtonElement>;
  showLoginOverlay: boolean = true;
  storyPlaythroughObject: StoryPlaythrough;
  storyId: string;
  storyIsLoaded: boolean;
  isLoggedIn: boolean;
  topicUrlFragment: string;
  classroomUrlFragment: string;
  storyUrlFragment: string;
  storyTitle: string;
  storyDescription: string;
  pathIconParameters: IconParametersArray[];
  topicName: string;
  thumbnailFilename: string;
  thumbnailBgColor: string;
  storyNodes: ReadOnlyStoryNode[];
  iconUrl: string;
  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private assetsBackendApiService: AssetsBackendApiService,
    private userService: UserService,
    private windowRef: WindowRef,
    private urlService: UrlService,
    private loaderService: LoaderService,
    private storyViewerBackendApiService: StoryViewerBackendApiService,
    private pageTitleService: PageTitleService,
    private alertsService: AlertsService
  ) {}

  focusSkipButton(eventTarget: Element, isLoggedIn: boolean): void {
    if (isLoggedIn || !this.showLoginOverlay) {
      return;
    }
    const target = eventTarget;
    if (target.closest('.story-viewer-login-container') !==
        this.overlay.nativeElement) {
      this.skipButton.nativeElement.focus();
    }
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  showChapters(): boolean {
    if (!this.storyPlaythroughObject) {
      return false;
    }
    return this.storyPlaythroughObject.getStoryNodeCount() > 0;
  }

  generatePathIconParameters(): IconParametersArray[] {
    let iconParametersArray: IconParametersArray[] = [];
    for (
      let i = 0; i < this.storyPlaythroughObject.getStoryNodeCount();
      i++) {
      this.thumbnailFilename = this.storyNodes[i].getThumbnailFilename();
      this.thumbnailBgColor = this.storyNodes[i].getThumbnailBgColor();
      if (this.thumbnailFilename === null) {
        this.iconUrl = '';
        this.thumbnailFilename = '';
      } else {
        this.iconUrl = this.assetsBackendApiService.getThumbnailUrlForPreview(
          AppConstants.ENTITY_TYPE.STORY, this.storyId,
          this.thumbnailFilename);
      }
      iconParametersArray.push({
        thumbnailIconUrl: this.iconUrl,
        left: '225px',
        top: '35px',
        thumbnailBgColor: this.thumbnailBgColor,
      });
    }
    return iconParametersArray;
  }

  hideLoginOverlay(): void {
    this.showLoginOverlay = false;
  }

  signIn(): void {
    this.userService.getLoginUrlAsync().then(
      (loginUrl) => {
        loginUrl ? this.windowRef.nativeWindow.location.href = loginUrl : (
          this.windowRef.nativeWindow.location.reload());
      });
  }

  getExplorationUrl(
      node: { getExplorationId: () => string;
              getId: () => string; }): string {
    let result = '/explore/' + node.getExplorationId();
    result = this.urlService.addField(
      result, 'topic_url_fragment',
      this.urlService.getTopicUrlFragmentFromLearnerUrl());
    result = this.urlService.addField(
      result, 'classroom_url_fragment',
      this.urlService.getClassroomUrlFragmentFromLearnerUrl());
    result = this.urlService.addField(
      result, 'story_url_fragment',
      this.urlService.getStoryUrlFragmentFromLearnerUrl());
    result = this.urlService.addField(
      result, 'node_id', node.getId());
    return result;
  }

  ngOnInit(): void {
    this.storyIsLoaded = false;
    this.isLoggedIn = false;
    this.userService.getUserInfoAsync().then((userInfo) => {
      this.isLoggedIn = userInfo.isLoggedIn();
    });
    this.topicUrlFragment = (
      this.urlService.getTopicUrlFragmentFromLearnerUrl());
    this.classroomUrlFragment = (
      this.urlService.getClassroomUrlFragmentFromLearnerUrl());
    this.storyUrlFragment = (
      this.urlService.getStoryUrlFragmentFromLearnerUrl());
    this.loaderService.showLoadingScreen('Loading');
    this.storyViewerBackendApiService.fetchStoryDataAsync(
      this.topicUrlFragment,
      this.classroomUrlFragment,
      this.storyUrlFragment).then(
      (storyDataDict) => {
        this.storyIsLoaded = true;
        this.storyPlaythroughObject = storyDataDict;
        this.storyNodes = this.storyPlaythroughObject.getStoryNodes();
        this.storyId = this.storyPlaythroughObject.getStoryId();
        this.topicName = this.storyPlaythroughObject.topicName;
        this.pageTitleService.setDocumentTitle(
          `Learn ${this.topicName} | ${storyDataDict.title} | Oppia`);
        this.pageTitleService.updateMetaTag(
          storyDataDict.getMetaTagContent());
        this.storyTitle = storyDataDict.title;
        this.storyDescription = storyDataDict.description;

        this.loaderService.hideLoadingScreen();
        this.pathIconParameters = this.generatePathIconParameters();
      },
      (errorResponse) => {
        let errorCodes = AppConstants.FATAL_ERROR_CODES;
        if (errorCodes.indexOf(errorResponse.status) !== -1) {
          this.alertsService.addWarning('Failed to get dashboard data');
        }
      }
    );

    // The pathIconParameters is an array containing the co-ordinates,
    // background color and icon url for the icons generated on the
    // path.
    this.pathIconParameters = [];
  }
}

angular.module('oppia').directive('oppiaStoryViewerPage',
  downgradeComponent({component: StoryViewerPageComponent}));
