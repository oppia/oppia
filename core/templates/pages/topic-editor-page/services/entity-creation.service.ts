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
 * @fileoverview Service to help with creating various entities. This is needed
 * so that we don't have to write redundant code every time we want to create
 * an entity.
 */

import {Injectable} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {CreateNewSubtopicModalComponent} from 'pages/topic-editor-page/modal-templates/create-new-subtopic-modal.component';
import {CreateNewSkillModalService} from './create-new-skill-modal.service';
import {TopicEditorRoutingService} from './topic-editor-routing.service';
import {TopicEditorStateService} from './topic-editor-state.service';

@Injectable({
  providedIn: 'root',
})
export class EntityCreationService {
  constructor(
    private createNewSkillModalService: CreateNewSkillModalService,
    private ngbModal: NgbModal,
    private topicEditorRoutingService: TopicEditorRoutingService,
    private topicEditorStateService: TopicEditorStateService
  ) {}

  createSubtopic(): void {
    this.ngbModal
      .open(CreateNewSubtopicModalComponent, {
        backdrop: 'static',
        windowClass: 'create-new-subtopic',
      })
      .result.then(
        subtopicId => {
          this.topicEditorRoutingService.navigateToSubtopicEditorWithId(
            subtopicId
          );
        },
        () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        }
      );
  }

  createSkill(): void {
    let topicId = this.topicEditorStateService.getTopic().getId();
    this.createNewSkillModalService.createNewSkill([topicId]);
  }
}
