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
import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { IInteractionBackendDict, Interaction, InteractionObjectFactory } from
  'domain/exploration/InteractionObjectFactory';
import { IParamChangeBackendDict, ParamChange } from
  'domain/exploration/ParamChangeObjectFactory';
import { ParamChangesObjectFactory } from
  'domain/exploration/ParamChangesObjectFactory';
import {
  IRecordedVoiceOverBackendDict,
  RecordedVoiceovers,
  RecordedVoiceoversObjectFactory
} from 'domain/exploration/RecordedVoiceoversObjectFactory';
import {
  ISubtitledHtmlBackendDict,
  SubtitledHtml,
  SubtitledHtmlObjectFactory
} from 'domain/exploration/SubtitledHtmlObjectFactory';
import {
  IWrittenTranslationsBackendDict,
  WrittenTranslations,
  WrittenTranslationsObjectFactory
} from 'domain/exploration/WrittenTranslationsObjectFactory';

const constants = require('constants.ts');

export interface IStateBackendDict {
  'classifier_model_id': string;
  'content': ISubtitledHtmlBackendDict;
  'interaction': IInteractionBackendDict;
  'param_changes': IParamChangeBackendDict[];
  'recorded_voiceovers': IRecordedVoiceOverBackendDict;
  'solicit_answer_details': boolean;
  'written_translations': IWrittenTranslationsBackendDict;
}

export class State {
  name: string;
  classifierModelId: string;
  content: SubtitledHtml;
  interaction: Interaction;
  paramChanges: ParamChange[];
  recordedVoiceovers: RecordedVoiceovers;
  solicitAnswerDetails: boolean;
  writtenTranslations: WrittenTranslations;
  constructor(
      name: string, classifierModelId: string, content: SubtitledHtml,
      interaction: Interaction, paramChanges: ParamChange[],
      recordedVoiceovers: RecordedVoiceovers, solicitAnswerDetails: boolean,
      writtenTranslations: WrittenTranslations) {
    this.name = name;
    this.classifierModelId = classifierModelId;
    this.content = content;
    this.interaction = interaction;
    this.paramChanges = paramChanges;
    this.recordedVoiceovers = recordedVoiceovers;
    this.solicitAnswerDetails = solicitAnswerDetails;
    this.writtenTranslations = writtenTranslations;
  }
  setName(newName: string): void {
    this.name = newName;
  }

  toBackendDict(): IStateBackendDict {
    return {
      content: this.content.toBackendDict(),
      classifier_model_id: this.classifierModelId,
      interaction: this.interaction.toBackendDict(),
      param_changes: this.paramChanges.map((paramChange) => {
        return paramChange.toBackendDict();
      }),
      recorded_voiceovers: this.recordedVoiceovers.toBackendDict(),
      solicit_answer_details: this.solicitAnswerDetails,
      written_translations: this.writtenTranslations.toBackendDict()
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
    this.writtenTranslations = otherState.writtenTranslations;
  }
}

@Injectable({
  providedIn: 'root'
})
export class StateObjectFactory {
  constructor(
    private interactionObject: InteractionObjectFactory,
    private paramchangesObject: ParamChangesObjectFactory,
    private recordedVoiceoversObject: RecordedVoiceoversObjectFactory,
    private subtitledHtmlObject: SubtitledHtmlObjectFactory,
    private writtenTranslationsObject: WrittenTranslationsObjectFactory) {}

  createDefaultState(newStateName: string): State {
    var newStateTemplate = constants.NEW_STATE_TEMPLATE;
    var newState = this.createFromBackendDict(newStateName, {
      classifier_model_id: newStateTemplate.classifier_model_id,
      content: newStateTemplate.content,
      interaction: newStateTemplate.interaction,
      param_changes: newStateTemplate.param_changes,
      recorded_voiceovers: newStateTemplate.recorded_voiceovers,
      solicit_answer_details: newStateTemplate.solicit_answer_details,
      written_translations: newStateTemplate.written_translations
    });
    newState.interaction.defaultOutcome.dest = newStateName;
    return newState;
  }

  createFromBackendDict(
      stateName: string, stateDict: IStateBackendDict): State {
    return new State(
      stateName,
      stateDict.classifier_model_id,
      this.subtitledHtmlObject.createFromBackendDict(stateDict.content),
      this.interactionObject.createFromBackendDict(stateDict.interaction),
      this.paramchangesObject.createFromBackendList(
        stateDict.param_changes),
      this.recordedVoiceoversObject.createFromBackendDict(
        stateDict.recorded_voiceovers),
      stateDict.solicit_answer_details,
      this.writtenTranslationsObject.createFromBackendDict(
        stateDict.written_translations));
  }
}

angular.module('oppia').factory(
  'StateObjectFactory',
  downgradeInjectable(StateObjectFactory));
