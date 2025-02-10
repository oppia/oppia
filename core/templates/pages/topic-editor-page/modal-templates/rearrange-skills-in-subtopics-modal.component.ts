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
 * @fileoverview Component for RearrangeSkillsInSubtopicsModal.
 */

import {Component, OnDestroy, OnInit} from '@angular/core';
import {ShortSkillSummary} from 'domain/skill/short-skill-summary.model';
import {TopicUpdateService} from 'domain/topic/topic-update.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {Subscription} from 'rxjs';
import {SubtopicValidationService} from '../services/subtopic-validation.service';
import {TopicEditorStateService} from '../services/topic-editor-state.service';
import {Topic} from 'domain/topic/topic-object.model';
import {Subtopic} from 'domain/topic/subtopic.model';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import {AppConstants} from 'app.constants';

@Component({
  selector: 'oppia-rearrange-skills-in-subtopics-modal',
  templateUrl: './rearrange-skills-in-subtopics-modal.component.html',
})
export class RearrangeSkillsInSubtopicsModalComponent
  extends ConfirmOrCancelModal
  implements OnInit, OnDestroy
{
  topic: Topic;
  subtopics: Subtopic[];
  uncategorizedSkillSummaries: ShortSkillSummary[];
  skillSummaryToMove: ShortSkillSummary;
  oldSubtopicId: number | null = null;
  errorMsg: string;
  editableName: string;
  selectedSubtopicId: number;
  maxCharsInSubtopicTitle: number = AppConstants.MAX_CHARS_IN_SUBTOPIC_TITLE;

  SKILL_EDITOR_URL_TEMPLATE = '/skill_editor/<skillId>';
  directiveSubscriptions = new Subscription();

  constructor(
    private subtopicValidationService: SubtopicValidationService,
    private topicEditorStateService: TopicEditorStateService,
    private topicUpdateService: TopicUpdateService,
    private urlInterpolationService: UrlInterpolationService,
    private ngbActiveModal: NgbActiveModal
  ) {
    super(ngbActiveModal);
  }

  initEditor(): void {
    this.topic = this.topicEditorStateService.getTopic();
    this.subtopics = this.topic.getSubtopics();
    this.uncategorizedSkillSummaries =
      this.topic.getUncategorizedSkillSummaries();
  }

  getSkillEditorUrl(skillId: string): string {
    return this.urlInterpolationService.interpolateUrl(
      this.SKILL_EDITOR_URL_TEMPLATE,
      {
        skillId: skillId,
      }
    );
  }

  /**
   * @param {string|null} oldSubtopicId - The id of the subtopic from
   *    which the skill is to be moved, or null if the origin is the
   *    uncategorized section.
   * @param {SkillSummary} skillSummary - The summary of the skill that
   *    is to be moved.
   */
  onMoveSkillStart(
    oldSubtopicId: number | null,
    skillSummary: ShortSkillSummary
  ): void {
    this.skillSummaryToMove = skillSummary;
    this.oldSubtopicId = oldSubtopicId ? oldSubtopicId : null;
  }

  /**
   * @param {string|null} newSubtopicId - The subtopic to which the
   *    skill is to be moved, or null if the destination is the
   *    uncategorized section.
   */
  onMoveSkillEnd(
    event: CdkDragDrop<ShortSkillSummary[]>,
    newSubtopicId: number | null
  ): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      if (newSubtopicId === this.oldSubtopicId) {
        return;
      }

      if (newSubtopicId === null) {
        this.topicUpdateService.removeSkillFromSubtopic(
          this.topic,
          this.oldSubtopicId,
          this.skillSummaryToMove
        );
      } else {
        this.topicUpdateService.moveSkillToSubtopic(
          this.topic,
          this.oldSubtopicId,
          newSubtopicId,
          this.skillSummaryToMove
        );
      }
    }
    this.initEditor();
  }

  updateSubtopicTitle(subtopicId: number): void {
    if (
      !this.subtopicValidationService.checkValidSubtopicName(this.editableName)
    ) {
      this.errorMsg = 'A subtopic with this title already exists';
      return;
    }

    this.topicUpdateService.setSubtopicTitle(
      this.topic,
      subtopicId,
      this.editableName
    );
    this.editNameOfSubtopicWithId(null);
  }

  editNameOfSubtopicWithId(subtopicId: number): void {
    if (!subtopicId) {
      this.editableName = '';
    }
    this.selectedSubtopicId = subtopicId;
  }

  isSkillDeleted(skillSummary: ShortSkillSummary): boolean {
    return skillSummary.getDescription() === null;
  }

  ngOnInit(): void {
    this.editableName = '';
    this.directiveSubscriptions.add(
      this.topicEditorStateService.onTopicInitialized.subscribe(() =>
        this.initEditor()
      )
    );
    this.directiveSubscriptions.add(
      this.topicEditorStateService.onTopicReinitialized.subscribe(() =>
        this.initEditor()
      )
    );
    this.initEditor();
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
