// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating new frontend instances of State
 * domain objects.
 */
import {Injectable} from '@angular/core';

import {
  InteractionBackendDict,
  Interaction,
  InteractionObjectFactory,
} from 'domain/exploration/InteractionObjectFactory';
import {
  ParamChangeBackendDict,
  ParamChange,
} from 'domain/exploration/ParamChangeObjectFactory';
import {ParamChangesObjectFactory} from 'domain/exploration/ParamChangesObjectFactory';
import {
  RecordedVoiceOverBackendDict,
  RecordedVoiceovers,
} from 'domain/exploration/recorded-voiceovers.model';
import {
  SubtitledHtmlBackendDict,
  SubtitledHtml,
} from 'domain/exploration/subtitled-html.model';

import {AppConstants} from 'app.constants';
import {BaseTranslatableObject} from 'domain/objects/BaseTranslatableObject.model';

export interface StateBackendDict {
  // The classifier model ID associated with a state, if applicable,
  // null otherwise.
  classifier_model_id: string | null;
  content: SubtitledHtmlBackendDict;
  interaction: InteractionBackendDict;
  param_changes: readonly ParamChangeBackendDict[];
  recorded_voiceovers: RecordedVoiceOverBackendDict;
  solicit_answer_details: boolean;
  card_is_checkpoint: boolean;
  // This property is null if no skill is linked to the State.
  linked_skill_id: string | null;
  inapplicable_skill_misconception_ids: string[] | null;
}

export class State extends BaseTranslatableObject {
  // Name is null before saving a state.
  name: string | null;
  classifierModelId: string | null;
  linkedSkillId: string | null;
  content: SubtitledHtml;
  interaction: Interaction;
  paramChanges: ParamChange[];
  recordedVoiceovers: RecordedVoiceovers;
  solicitAnswerDetails: boolean;
  cardIsCheckpoint: boolean;
  inapplicableSkillMisconceptionIds: string[] | null;

  constructor(
    name: string | null,
    classifierModelId: string | null,
    linkedSkillId: string | null,
    content: SubtitledHtml,
    interaction: Interaction,
    paramChanges: ParamChange[],
    recordedVoiceovers: RecordedVoiceovers,
    solicitAnswerDetails: boolean,
    cardIsCheckpoint: boolean,
    inapplicableSkillMisconceptionIds: string[] | null
  ) {
    super();
    this.name = name;
    this.classifierModelId = classifierModelId;
    this.linkedSkillId = linkedSkillId;
    this.content = content;
    this.interaction = interaction;
    this.paramChanges = paramChanges;
    this.recordedVoiceovers = recordedVoiceovers;
    this.solicitAnswerDetails = solicitAnswerDetails;
    this.cardIsCheckpoint = cardIsCheckpoint;
    this.inapplicableSkillMisconceptionIds = inapplicableSkillMisconceptionIds;
  }

  getTranslatableFields(): SubtitledHtml[] {
    return [this.content];
  }

  getTranslatableObjects(): BaseTranslatableObject[] {
    return [this.interaction];
  }

  setName(newName: string): void {
    this.name = newName;
  }

  toBackendDict(): StateBackendDict {
    return {
      content: this.content.toBackendDict(),
      classifier_model_id: this.classifierModelId,
      linked_skill_id: this.linkedSkillId,
      interaction: this.interaction.toBackendDict(),
      param_changes: this.paramChanges.map(paramChange => {
        return paramChange.toBackendDict();
      }),
      recorded_voiceovers: this.recordedVoiceovers.toBackendDict(),
      solicit_answer_details: this.solicitAnswerDetails,
      card_is_checkpoint: this.cardIsCheckpoint,
      inapplicable_skill_misconception_ids:
        this.inapplicableSkillMisconceptionIds,
    };
  }

  copy(otherState: State): void {
    this.name = otherState.name;
    this.classifierModelId = otherState.classifierModelId;
    this.content = otherState.content;
    this.interaction.copy(otherState.interaction);
    this.paramChanges = otherState.paramChanges;
    this.recordedVoiceovers = otherState.recordedVoiceovers;
    this.solicitAnswerDetails = otherState.solicitAnswerDetails;
    this.cardIsCheckpoint = otherState.cardIsCheckpoint;
  }
}

@Injectable({
  providedIn: 'root',
})
export class StateObjectFactory {
  constructor(
    private interactionObject: InteractionObjectFactory,
    private paramchangesObject: ParamChangesObjectFactory
  ) {}

  get NEW_STATE_TEMPLATE(): StateBackendDict {
    return AppConstants.NEW_STATE_TEMPLATE as StateBackendDict;
  }

  // TODO(#14313): Remove the createDefaultState so that full state can be
  // created from start.
  // Create a default state until the actual state is saved.
  // Passes name as null before saving a state.
  createDefaultState(
    newStateName: string | null,
    contentIdForContent: string,
    contentIdForDefaultOutcome: string
  ): State {
    var newStateTemplate = this.NEW_STATE_TEMPLATE;
    var newState = this.createFromBackendDict(newStateName, {
      classifier_model_id: newStateTemplate.classifier_model_id,
      linked_skill_id: newStateTemplate.linked_skill_id,
      content: newStateTemplate.content,
      interaction: newStateTemplate.interaction,
      param_changes: newStateTemplate.param_changes,
      recorded_voiceovers: newStateTemplate.recorded_voiceovers,
      solicit_answer_details: newStateTemplate.solicit_answer_details,
      card_is_checkpoint: newStateTemplate.card_is_checkpoint,
      inapplicable_skill_misconception_ids:
        newStateTemplate.inapplicable_skill_misconception_ids,
    });
    newState.content.contentId = contentIdForContent;
    let defaultOutcome = newState.interaction.defaultOutcome;

    if (defaultOutcome) {
      defaultOutcome.feedback.contentId = contentIdForDefaultOutcome;
    }
    if (defaultOutcome !== null && newStateName !== null) {
      defaultOutcome.dest = newStateName as string;
    }
    newState.recordedVoiceovers.addContentId(contentIdForContent);
    newState.recordedVoiceovers.addContentId(contentIdForDefaultOutcome);

    return newState;
  }

  // Passes name as null before saving a state.
  createFromBackendDict(
    stateName: string | null,
    stateDict: StateBackendDict
  ): State {
    return new State(
      stateName,
      stateDict.classifier_model_id,
      stateDict.linked_skill_id,
      SubtitledHtml.createFromBackendDict(stateDict.content),
      this.interactionObject.createFromBackendDict(stateDict.interaction),
      this.paramchangesObject.createFromBackendList(stateDict.param_changes),
      RecordedVoiceovers.createFromBackendDict(stateDict.recorded_voiceovers),
      stateDict.solicit_answer_details,
      stateDict.card_is_checkpoint,
      stateDict.inapplicable_skill_misconception_ids
    );
  }
}
