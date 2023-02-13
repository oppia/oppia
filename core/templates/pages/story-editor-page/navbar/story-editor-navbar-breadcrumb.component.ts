// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the navbar breadcrumb of the story editor.
 */

import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UndoRedoService } from 'domain/editor/undo_redo/undo-redo.service';
import { Story } from 'domain/story/story.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { Subscription } from 'rxjs';
import { WindowRef } from 'services/contextual/window-ref.service';
import { SavePendingChangesModalComponent } from 'components/save-pending-changes/save-pending-changes-modal.component';
import { StoryEditorStateService } from '../services/story-editor-state.service';

 @Component({
   selector: 'oppia-story-editor-navbar-breadcrumb',
   templateUrl: './story-editor-navbar-breadcrumb.component.html'
 })
export class StoryEditorNavbarBreadcrumbComponent {
  constructor(
     private undoRedoService: UndoRedoService,
     private ngbModal: NgbModal,
     private storyEditorStateService: StoryEditorStateService,
     private windowRef: WindowRef,
     private urlInterpolationService: UrlInterpolationService
  ) {}

  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  topicName!: string;
  story!: Story;
  directiveSubscriptions = new Subscription();
  TOPIC_EDITOR_URL_TEMPLATE = '/topic_editor/<topicId>';

  returnToTopicEditorPage(): void {
    if (this.undoRedoService.getChangeCount() > 0) {
      const modalRef = this.ngbModal.open(
        SavePendingChangesModalComponent,
        {backdrop: true}
      );

      modalRef.componentInstance.body = (
        'Please save all pending changes before returning to the topic.');

      modalRef.result.then(() => {}, () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      });
    } else {
      this.windowRef.nativeWindow.open(
        this.urlInterpolationService.interpolateUrl(
          this.TOPIC_EDITOR_URL_TEMPLATE, {
            topicId: this.story.getCorrespondingTopicId()
          }
        ),
        '_self'
      );
    }
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.storyEditorStateService.onStoryInitialized.subscribe(
        () => {
          this.topicName = this.storyEditorStateService.getTopicName();
          this.story = this.storyEditorStateService.getStory();
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('oppiaStoryEditorNavbarBreadcrumb',
  downgradeComponent({component: StoryEditorNavbarBreadcrumbComponent}));
