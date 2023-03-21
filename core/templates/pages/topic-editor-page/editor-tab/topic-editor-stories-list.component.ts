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
 * @fileoverview Component for the stories list viewer.
 */

import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SavePendingChangesModalComponent } from 'components/save-pending-changes/save-pending-changes-modal.component';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { StorySummary } from 'domain/story/story-summary.model';
import { TopicUpdateService } from 'domain/topic/topic-update.service';
import { Topic } from 'domain/topic/topic-object.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { DeleteStoryModalComponent } from '../modal-templates/delete-story-modal.component';

@Component({
  selector: 'oppia-topic-editor-stories-list',
  templateUrl: './topic-editor-stories-list.component.html'
})
export class TopicEditorStoriesListComponent implements OnInit {
  @Input() storySummaries: StorySummary[];
  @Input() topic: Topic;

  STORY_TABLE_COLUMN_HEADINGS: string[];

  constructor(
    private ngbModal: NgbModal,
    private topicUpdateService: TopicUpdateService,
    private undoRedoService: UndoRedoService,
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef
  ) {}

  STORY_EDITOR_URL_TEMPLATE = '/story_editor/<story_id>';

  drop(event: CdkDragDrop<StorySummary[]>): void {
    moveItemInArray(
      this.storySummaries,
      event.previousIndex, event.currentIndex);

    this.topicUpdateService.rearrangeCanonicalStory(
      this.topic, event.previousIndex, event.currentIndex);
  }

  openStoryEditor(storyId: string): void {
    if (this.undoRedoService.getChangeCount() > 0) {
      const modalRef = this.ngbModal.open(
        SavePendingChangesModalComponent, {
          backdrop: true
        });

      modalRef.componentInstance.body = (
        'Please save all pending changes ' +
        'before exiting the topic editor.');

      modalRef.result.then(() => {}, () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      });
    } else {
      this.windowRef.nativeWindow.open(
        this.urlInterpolationService.interpolateUrl(
          this.STORY_EDITOR_URL_TEMPLATE, {
            story_id: storyId
          }), '_self');
    }
  }

  deleteCanonicalStory(storyId: string): void {
    this.ngbModal.open(DeleteStoryModalComponent, {
      backdrop: true
    }).result.then(() => {
      this.topicUpdateService.removeCanonicalStory(
        this.topic, storyId);
      for (let i = 0; i < this.storySummaries.length; i++) {
        if (this.storySummaries[i].getId() === storyId) {
          this.storySummaries.splice(i, 1);
        }
      }
    }, () => {
      // Note to developers:
      // This callback is triggered when the Cancel button is clicked.
      // No further action is needed.
    });
  }

  ngOnInit(): void {
    this.STORY_TABLE_COLUMN_HEADINGS = [
      'title', 'node_count', 'publication_status'];
  }
}

angular.module('oppia').directive('oppiaTopicEditorStoriesList',
  downgradeComponent({
    component: TopicEditorStoriesListComponent
  }) as angular.IDirectiveFactory);
