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
 * @fileoverview Controller for RearrangeSkillsInSubtopicsModal.
 */

import { Subscription } from 'rxjs';

import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TopicUpdateService } from 'domain/topic/topic-update.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { Topic } from 'domain/topic/TopicObjectFactory';
import { Subtopic } from 'domain/topic/subtopic.model';
import { ShortSkillSummary } from 'domain/skill/short-skill-summary.model';
import { downgradeComponent } from '@angular/upgrade/static';
import { CDK_DRAG_CONFIG } from '@angular/cdk/drag-drop';

const DragConfig = {
  dragStartThreshold: 0,
  pointerDirectionChangeThreshold: 5,
  zIndex: 10000
};
@Component({
  selector: 'rearrange-skills-in-subtopics-modal',
  templateUrl: './rearrange-skills-in-subtopics-modal.component.html',
  providers: [{ provide: CDK_DRAG_CONFIG, useValue: DragConfig }],
  encapsulation: ViewEncapsulation.None
})
export class RearrangeSkillsInSubtopicsModalComponent
  extends ConfirmOrCancelModal implements OnInit, OnDestroy {
  private _SKILL_EDITOR_URL_TEMPLATE = '/skill_editor/<skillId>';
  private componentSubscriptions = new Subscription();
  @Input() subtopicValidationService;
  @Input() topicEditorStateService;
  topic: Topic;
  subtopics: Subtopic[] = [];
  uncategorizedSkillSummaries: ShortSkillSummary[] = [];
  skillSummaryToMove: ShortSkillSummary;
  oldSubtopicId: number | null;
  editableName: string;
  errorMsg: string;
  selectedSubtopicId: number;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private topicUpdateService: TopicUpdateService,
    private urlInterpolationService: UrlInterpolationService
  ) {
    super(ngbActiveModal);
  }

  ngOnInit(): void {
    this.editableName = '';
    this.componentSubscriptions.add(
      this.topicEditorStateService.onTopicInitialized.subscribe(
        () => this.initEditor()
      ));
    this.componentSubscriptions.add(
      this.topicEditorStateService.onTopicReinitialized.subscribe(
        () => this.initEditor()
      ));
    this.initEditor();
  }

  initEditor(): void {
    this.topic = this.topicEditorStateService.getTopic();
    this.subtopics = this.topic.getSubtopics();
    this.uncategorizedSkillSummaries = (
      this.topic.getUncategorizedSkillSummaries());
  }

  getSkillEditorUrl(skillId: string): string {
    return this.urlInterpolationService.interpolateUrl(
      this._SKILL_EDITOR_URL_TEMPLATE, {
        skillId: skillId
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
      oldSubtopicId: number, skillSummary: ShortSkillSummary): void {
    this.skillSummaryToMove = skillSummary;
    this.oldSubtopicId = oldSubtopicId ? oldSubtopicId : null;
  }

  /**
   * @param {string|null} newSubtopicId - The subtopic to which the
   *    skill is to be moved, or null if the destination is the
   *    uncategorized section.
   */
  onMoveSkillEnd(newSubtopicId: number): void {
    if (newSubtopicId === this.oldSubtopicId) {
      return;
    }

    if (newSubtopicId === null) {
      this.topicUpdateService.removeSkillFromSubtopic(
        this.topic, this.oldSubtopicId, this.skillSummaryToMove);
    } else {
      this.topicUpdateService.moveSkillToSubtopic(
        this.topic, this.oldSubtopicId, newSubtopicId,
        this.skillSummaryToMove);
    }
    this.initEditor();
  }


  updateSubtopicTitle(subtopicId: number): void {
    if (!this.subtopicValidationService.checkValidSubtopicName(
      this.editableName)) {
      this.errorMsg = 'A subtopic with this title already exists';
      return;
    }

    this.topicUpdateService.setSubtopicTitle(
      this.topic, subtopicId, this.editableName);
    this.editNameOfSubtopicWithId(null);
  }

  editNameOfSubtopicWithId(subtopicId: number): void {
    if (!subtopicId) {
      this.editableName = '';
    }
    this.selectedSubtopicId = subtopicId;
  }

  ngOnDestroy(): void {
    this.componentSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive(
  'rearrangeSkillsInSubtopicsModalComponent',
  downgradeComponent({
    component: RearrangeSkillsInSubtopicsModalComponent
  }) as angular.IDirectiveFactory
);
