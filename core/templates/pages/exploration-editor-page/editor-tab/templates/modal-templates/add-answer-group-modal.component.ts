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
 * @fileoverview Component for add answer group modal.
 */

import { EventBusGroup, EventBusService } from 'app-events/event-bus.service';
import { ObjectFormValidityChangeEvent } from 'app-events/app-events';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ContextService } from 'services/context.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { EditorFirstTimeEventsService } from 'pages/exploration-editor-page/services/editor-first-time-events.service';
import { PopulateRuleContentIdsService } from 'pages/exploration-editor-page/services/populate-rule-content-ids.service';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import { Rule, RuleObjectFactory } from 'domain/exploration/RuleObjectFactory';
import { GenerateContentIdService } from 'services/generate-content-id.service';
import { Outcome, OutcomeObjectFactory } from 'domain/exploration/OutcomeObjectFactory';
import { AppConstants } from 'app.constants';
import { EditabilityService } from 'services/editability.service';

interface TaggedMisconception {
  skillId: string;
  misconceptionId: number;
}

@Component({
  selector: 'add-answer-group-modal-component',
  templateUrl: './add-answer-group-modal.component.html'
})
export class AddAnswerGroupModalComponent
  extends ConfirmOrCancelModal implements OnInit, OnDestroy {
  @Output() addState: EventEmitter<string> = new EventEmitter<string>();
  @Input() currentInteractionId: string;
  @Input() stateName;

  isEditable: boolean;
  eventBusGroup: EventBusGroup;
  feedbackEditorIsOpen: boolean;
  tmpRule: Rule;
  tmpOutcome: Outcome;
  tmpTaggedSkillMisconceptionId: any;
  addAnswerGroupForm: any;
  questionModeEnabled: boolean;
  isInvalid: boolean;
  modalId: any;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private urlInterpolationService: UrlInterpolationService,
    private contextService: ContextService,
    private windowRef: WindowRef,
    private eventBusService: EventBusService,
    private populateRuleContentIdsService: PopulateRuleContentIdsService,
    private stateEditorService: StateEditorService,
    private editorFirstTimeEventsService: EditorFirstTimeEventsService,
    private ruleObjectFactory: RuleObjectFactory,
    private generateContentIdService: GenerateContentIdService,
    private outcomeObjectFactory: OutcomeObjectFactory,
    private editabilityService: EditabilityService,
  ) {
    super(ngbActiveModal);
    this.eventBusGroup = new EventBusGroup(this.eventBusService);
  }

  updateState(event: string): void {
    this.addState.emit(event);
  }

  updateTaggedMisconception(
      taggedMisconception: TaggedMisconception): void {
    this.tmpTaggedSkillMisconceptionId = (
      `${taggedMisconception.skillId}-${
        taggedMisconception.misconceptionId}`);
  }

  isSelfLoopWithNoFeedback(tmpOutcome: Outcome): boolean {
    return (
      tmpOutcome.dest ===
      this.stateName && !tmpOutcome.hasNonemptyFeedback());
  }

  openFeedbackEditor(): void {
    this.feedbackEditorIsOpen = true;
  }

  isCorrectnessFeedbackEnabled(): boolean {
    return this.stateEditorService.getCorrectnessFeedbackEnabled();
  }

  // This returns false if the current interaction ID is null.
  isCurrentInteractionLinear(): boolean {
    return (
      this.currentInteractionId &&
      INTERACTION_SPECS[this.currentInteractionId].is_linear);
  }

  isFeedbackLengthExceeded(tmpOutcome: Outcome): boolean {
    // TODO(#13764): Edit this check after appropriate limits are found.
    return (tmpOutcome.feedback._html.length > 10000);
  }

  saveResponse(reopen: any): void {
    this.populateRuleContentIdsService.populateNullRuleContentIds(this.tmpRule);
    this.stateEditorService.onSaveOutcomeDestDetails.emit();

    this.editorFirstTimeEventsService.registerFirstSaveRuleEvent();

    // Close the modal and save it afterwards.
    this.ngbActiveModal.close({
      tmpRule: angular.copy(this.tmpRule),
      tmpOutcome: angular.copy(this.tmpOutcome),
      tmpTaggedSkillMisconceptionId: (
        this.tmpOutcome.labelledAsCorrect ? null : (
          this.tmpTaggedSkillMisconceptionId)),
      reopen: reopen
    });
  }

  ngOnInit(): void {
    this.isEditable = this.editabilityService.isEditable();

    this.eventBusGroup.on(
      ObjectFormValidityChangeEvent,
      event => {
        if (event.message.modalId === this.modalId) {
          this.isInvalid = event.message.value;
        }
      });

    this.tmpTaggedSkillMisconceptionId = null;
    this.addAnswerGroupForm = {};

    this.modalId = Symbol();
    this.isInvalid = false;
    this.feedbackEditorIsOpen = false;
    this.questionModeEnabled = (
      this.stateEditorService.isInQuestionMode());
    this.tmpRule = this.ruleObjectFactory.createNew(null, {}, {});
    var feedbackContentId = this.generateContentIdService.getNextStateId(
      AppConstants.COMPONENT_NAME_FEEDBACK);
    this.tmpOutcome = this.outcomeObjectFactory.createNew(
        this.questionModeEnabled ? null : this.stateName,
        feedbackContentId, '', []);
  }

  updateAnswerGroupFeedback(outcome: Outcome): void {
    this.openFeedbackEditor();
    this.tmpOutcome.feedback = outcome.feedback;
  }

  ngOnDestroy(): void {
    this.eventBusGroup.unsubscribe();
  }
}

angular.module('oppia').directive('addAnswerGroupModalComponent',
  downgradeComponent({
    component: AddAnswerGroupModalComponent
  }) as angular.IDirectiveFactory);
