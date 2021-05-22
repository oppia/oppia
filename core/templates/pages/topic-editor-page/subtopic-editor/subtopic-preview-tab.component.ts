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
 * @fileoverview Component for the subtopic preview tab directive.
 */

import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { SubtopicPageContents } from 'domain/topic/subtopic-page-contents.model';
import { SubtopicPage } from 'domain/topic/subtopic-page.model';
import { Subtopic } from 'domain/topic/subtopic.model';
import { Topic } from 'domain/topic/TopicObjectFactory';
import { Subscription } from 'rxjs';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { TopicEditorRoutingService } from '../services/topic-editor-routing.service';
import { TopicEditorStateService } from '../services/topic-editor-state.service';

@Component({
  selector: 'oppia-subtopic-preview-tab',
  templateUrl: './subtopic-preview-tab.component.html'
})
export class SubtopicPreviewTab {
  directiveSubscriptions = new Subscription();
  topic: Topic;
  subtopicId: number;
  subtopic: Subtopic;
  editableTitle: string;
  editableThumbnailFilename: string;
  editableThumbnailBgColor: string;
  subtopicPage: SubtopicPage;
  pageContents: SubtopicPageContents;
  htmlData: string;
  THUMBNAIL: string = 'thumbnail';
  CONTENT: string = 'content';
  thumbnailIsShown: boolean;

  constructor(
    private topicEditorRoutingService: TopicEditorRoutingService,
    private topicEditorStateService: TopicEditorStateService,
    private windowDimensionsService: WindowDimensionsService
  ) {}

  private _initEditor(): void {
    this.topic = this.topicEditorStateService.getTopic();
    this.subtopicId = (
      this.topicEditorRoutingService.getSubtopicIdFromUrl());
    this.subtopic = (
      this.topic.getSubtopicById(this.subtopicId));

    if (this.topic.getId() && this.subtopic) {
      this.topicEditorStateService.loadSubtopicPage(
        this.topic.getId(), this.subtopicId);
      this.editableTitle = this.subtopic.getTitle();
      this.editableThumbnailFilename = (
        this.subtopic.getThumbnailFilename());
      this.editableThumbnailBgColor = (
        this.subtopic.getThumbnailBgColor());
      this.subtopicPage = (
        this.topicEditorStateService.getSubtopicPage());
      this.pageContents = this.subtopicPage.getPageContents();
      if (this.pageContents) {
        this.htmlData = this.pageContents.getHtml();
      }
    }
  }

  navigateToSubtopic(): void {
    this.topicEditorRoutingService.navigateToSubtopicEditorWithId(
      this.subtopicId);
  }

  changeContent(itemToDisplay: string): void {
    if (itemToDisplay === this.THUMBNAIL) {
      this.thumbnailIsShown = true;
      return;
    }
    this.thumbnailIsShown = false;
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.topicEditorStateService.onSubtopicPageLoaded.subscribe(() => {
        this.subtopicPage = this.topicEditorStateService.getSubtopicPage();
        this.pageContents = this.subtopicPage.getPageContents();
        this.htmlData = this.pageContents.getHtml();
      })
    );

    this.directiveSubscriptions.add(
      this.topicEditorStateService.onTopicInitialized.subscribe(
        () => this._initEditor()
      ));

    this.directiveSubscriptions.add(
      this.topicEditorStateService.onTopicReinitialized.subscribe(
        () => this._initEditor()
      ));

    this.thumbnailIsShown = !this.windowDimensionsService.isWindowNarrow();
    this._initEditor();
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaSubtopicPreviewTab',
  downgradeComponent({
    component: SubtopicPreviewTab
  }) as angular.IDirectiveFactory);

// angular.module('oppia').component('subtopicPreviewTab', {
//   template: require('./subtopic-preview-tab.component.html'),
//   controller: [
//     '$scope', 'TopicEditorRoutingService', 'TopicEditorStateService',
//     'WindowDimensionsService',
//     function(
//         $scope, TopicEditorRoutingService, TopicEditorStateService,
//         WindowDimensionsService) {
//       var ctrl = this;
//       ctrl.directiveSubscriptions = new Subscription();
//       var _initEditor = function() {
//         $scope.topic = TopicEditorStateService.getTopic();
//         $scope.subtopicId = (
//           TopicEditorRoutingService.getSubtopicIdFromUrl());
//         $scope.subtopic = (
//           $scope.topic.getSubtopicById(parseInt($scope.subtopicId)));

//         if ($scope.topic.getId() && $scope.subtopic) {
//           TopicEditorStateService.loadSubtopicPage(
//             $scope.topic.getId(), $scope.subtopicId);
//           $scope.editableTitle = $scope.subtopic.getTitle();
//           $scope.editableThumbnailFilename = (
//             $scope.subtopic.getThumbnailFilename());
//           $scope.editableThumbnailBgColor = (
//             $scope.subtopic.getThumbnailBgColor());
//           $scope.subtopicPage = (
//             TopicEditorStateService.getSubtopicPage());
//           $scope.pageContents = $scope.subtopicPage.getPageContents();
//           if ($scope.pageContents) {
//             $scope.htmlData = $scope.pageContents.getHtml();
//           }
//         }
//       };

//       $scope.navigateToSubtopic = function() {
//         TopicEditorRoutingService.navigateToSubtopicEditorWithId(
//           $scope.subtopicId);
//       };

//       ctrl.directiveSubscriptions.add(
//         TopicEditorStateService.onSubtopicPageLoaded.subscribe(
//           () => {
//             $scope.subtopicPage = TopicEditorStateService.getSubtopicPage();
//             $scope.pageContents = $scope.subtopicPage.getPageContents();
//             $scope.htmlData = $scope.pageContents.getHtml();
//           }
//         )
//       );

//       $scope.changeContent = function(itemToDisplay) {
//         if (itemToDisplay === $scope.THUMBNAIL) {
//           $scope.thumbnailIsShown = true;
//           return;
//         }
//         $scope.thumbnailIsShown = false;
//       };

//       ctrl.directiveSubscriptions.add(
//         TopicEditorStateService.onTopicInitialized.subscribe(
//           () => _initEditor()
//         ));
//       ctrl.directiveSubscriptions.add(
//         TopicEditorStateService.onTopicReinitialized.subscribe(
//           () => _initEditor()
//         ));

//       ctrl.$onInit = function() {
//         $scope.THUMBNAIL = 'thumbnail';
//         $scope.CONTENT = 'content';
//         $scope.thumbnailIsShown = (
//           !WindowDimensionsService.isWindowNarrow());
//         _initEditor();
//       };

//       ctrl.$onDestroy = function() {
//         ctrl.directiveSubscriptions.unsubscribe();
//       };
//     }
//   ]
// });
