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

import {
  EventBusGroup,
  EventBusService,
  Newable,
} from 'app-events/event-bus.service';
import {ObjectFormValidityChangeEvent} from 'app-events/app-events';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ElementRef,
  ViewChild,
} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {ContextService} from 'services/context.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {ConfirmOrCancelModal} from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {EditorFirstTimeEventsService} from 'pages/exploration-editor-page/services/editor-first-time-events.service';
import {PopulateRuleContentIdsService} from 'pages/exploration-editor-page/services/populate-rule-content-ids.service';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import {Rule} from 'domain/exploration/rule.model';
import {GenerateContentIdService} from 'services/generate-content-id.service';
import {
  Outcome,
  OutcomeObjectFactory,
} from 'domain/exploration/OutcomeObjectFactory';
import {AppConstants} from 'app.constants';
import {EditabilityService} from 'services/editability.service';
import cloneDeep from 'lodash/cloneDeep';
import {InteractionSpecsKey} from 'pages/interaction-specs.constants';
import {PlatformFeatureService} from 'services/platform-feature.service';

interface TaggedMisconception {
  skillId: string;
  misconceptionId: number;
}

interface DestValidation {
  isCreatingNewState: boolean;
  value: string;
}

@Component({
  selector: 'oppia-add-answer-group-modal-component',
  templateUrl: './add-answer-group-modal.component.html',
})
export class AddAnswerGroupModalComponent
  extends ConfirmOrCancelModal
  implements OnInit, OnDestroy
{
  @Output() addState = new EventEmitter();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() currentInteractionId!: string;
  @Input() stateName!: string;
  @ViewChild('addResponse') addResponseRef!: ElementRef;

  eventBusGroup!: EventBusGroup;
  tmpRule!: Rule;
  tmpOutcome!: Outcome;
  // Below property(temporary value) is null until the user clicks on the 'Add'
  // button in the answer group modal to add a new answer group. This is to
  // prevent the user from adding an answer group without having selected an
  // answer group type.
  tmpTaggedSkillMisconceptionId!: string | null;
  addAnswerGroupForm!: object;
  modalId = Symbol();
  isEditable: boolean = false;
  feedbackEditorIsOpen: boolean = false;
  questionModeEnabled: boolean = false;
  isInvalid: boolean = false;
  validation: boolean = false;
  tagMisconceptionsFeatureFlagIsEnabled: boolean = false;

  constructor(
    private ngbActiveModal: NgbActiveModal,
    private urlInterpolationService: UrlInterpolationService,
    private contextService: ContextService,
    private windowRef: WindowRef,
    private eventBusService: EventBusService,
    private populateRuleContentIdsService: PopulateRuleContentIdsService,
    private stateEditorService: StateEditorService,
    private editorFirstTimeEventsService: EditorFirstTimeEventsService,
    private generateContentIdService: GenerateContentIdService,
    private outcomeObjectFactory: OutcomeObjectFactory,
    private platformFeatureService: PlatformFeatureService,
    private editabilityService: EditabilityService
  ) {
    super(ngbActiveModal);
    this.eventBusGroup = new EventBusGroup(this.eventBusService);
  }

  updateState(event: string): void {
    this.addState.emit(event);
  }

  updateTaggedMisconception(taggedMisconception: TaggedMisconception): void {
    this.tmpTaggedSkillMisconceptionId = `${taggedMisconception.skillId}-${taggedMisconception.misconceptionId}`;
  }

  isSelfLoopWithNoFeedback(tmpOutcome: Outcome): boolean {
    return (
      tmpOutcome.dest === this.stateName && !tmpOutcome.hasNonemptyFeedback()
    );
  }

  openFeedbackEditor(): void {
    this.feedbackEditorIsOpen = true;
  }

  // This returns false if the current interaction ID is null.
  isCurrentInteractionLinear(): boolean {
    return (
      Boolean(this.currentInteractionId) &&
      INTERACTION_SPECS[this.currentInteractionId as InteractionSpecsKey]
        .is_linear
    );
  }

  isFeedbackLengthExceeded(tmpOutcome: Outcome): boolean {
    // TODO(#13764): Edit this check after appropriate limits are found.
    return tmpOutcome.feedback._html.length > 10000;
  }

  validateChanges(value: DestValidation): void {
    if (value.isCreatingNewState === true) {
      if (
        value.value === '' ||
        value.value === undefined ||
        value.value === null
      ) {
        this.validation = true;
        return;
      }
    }

    this.validation = false;
  }

  saveResponse(reopen: boolean): void {
    this.populateRuleContentIdsService.populateNullRuleContentIds(this.tmpRule);
    this.stateEditorService.onSaveOutcomeDestDetails.emit();
    this.stateEditorService.onSaveOutcomeDestIfStuckDetails.emit();

    this.editorFirstTimeEventsService.registerFirstSaveRuleEvent();

    // Close the modal and save it afterwards.
    this.ngbActiveModal.close({
      tmpRule: cloneDeep(this.tmpRule),
      tmpOutcome: cloneDeep(this.tmpOutcome),
      tmpTaggedSkillMisconceptionId: this.tmpOutcome.labelledAsCorrect
        ? null
        : this.tmpTaggedSkillMisconceptionId,
      reopen: reopen,
    });
  }

  ngOnInit(): void {
    this.eventBusGroup.on(
      ObjectFormValidityChangeEvent as Newable<ObjectFormValidityChangeEvent>,
      event => {
        if (event.message.modalId === this.modalId) {
          this.isInvalid = event.message.value;
        }
      }
    );

    this.tmpTaggedSkillMisconceptionId = null;
    this.addAnswerGroupForm = {};
    this.modalId = Symbol();
    this.isInvalid = false;
    this.feedbackEditorIsOpen = false;
    this.isEditable = this.editabilityService.isEditable();
    this.questionModeEnabled = this.stateEditorService.isInQuestionMode();

    this.tmpRule = Rule.createNew(null, {}, {});
    var feedbackContentId = this.generateContentIdService.getNextStateId(
      AppConstants.COMPONENT_NAME_FEEDBACK
    );
    this.tmpOutcome = this.outcomeObjectFactory.createNew(
      this.questionModeEnabled ? null : this.stateName,
      feedbackContentId,
      '',
      []
    );
    this.tagMisconceptionsFeatureFlagIsEnabled =
      this.platformFeatureService.status.ExplorationEditorCanTagMisconceptions.isEnabled;
  }

  updateAnswerGroupFeedback(outcome: Outcome): void {
    this.openFeedbackEditor();
    this.tmpOutcome.feedback = outcome.feedback;
  }

  ngAfterViewInit(): void {
    this.addResponseRef.nativeElement.focus();
  }

  ngOnDestroy(): void {
    this.eventBusGroup.unsubscribe();
  }
}
