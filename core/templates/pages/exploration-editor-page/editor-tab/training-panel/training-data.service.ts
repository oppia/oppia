// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for training data that adds a new
 * answer to training data and verifies that training data answers are unique
 * across all answer groups.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { ExplorationStatesService } from 'pages/exploration-editor-page/services/exploration-states.service';
import { GraphDataService } from 'pages/exploration-editor-page/services/graph-data.service';
import { ResponsesService } from 'pages/exploration-editor-page/editor-tab/services/responses.service';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import cloneDeep from 'lodash/cloneDeep';
import { AnswerGroup } from 'domain/exploration/AnswerGroupObjectFactory';
import { InteractionAnswer } from 'interactions/answer-defs';
import { State } from 'domain/state/StateObjectFactory';
import { Outcome } from 'domain/exploration/OutcomeObjectFactory';

interface AnswerGroupData {
  answerGroupIndex: number;
  answers: readonly InteractionAnswer[];
}

@Injectable({
  providedIn: 'root'
})
export class TrainingDataService {
  constructor(
    private explorationStatesService: ExplorationStatesService,
    private graphDataService: GraphDataService,
    private responsesService: ResponsesService,
    private stateEditorService: StateEditorService,
  ) { }

  _getIndexOfTrainingData(
      answer: InteractionAnswer, trainingData: InteractionAnswer[]): number {
    let index = -1;
    for (let i = 0; i < trainingData.length; i++) {
      if (trainingData[i] === answer) {
        index = i;
        break;
      }
    }
    return index;
  }

  // Attempts to remove a given answer from a list of trained answers. This
  // function returns the index of the answer that was removed if it was
  // successfully removed from the training data, or -1 otherwise.
  _removeAnswerFromTrainingData(
      answer: InteractionAnswer, trainingData: InteractionAnswer[]): number {
    let index = this._getIndexOfTrainingData(answer, trainingData);
    if (index !== -1) {
      trainingData.slice(index, 1);
    }
    return index;
  }

  // This removes any occurrences of the answer from any training data inputs
  // or the confirmed unclassified answer list. It also removes the answer
  // from the training data being presented to the user so that it does not
  // show up again.
  _removeAnswer(answer: InteractionAnswer): void {
    let answerGroups = this.responsesService.getAnswerGroups();
    let confirmedUnclassifiedAnswers = [...(
      this.responsesService.getConfirmedUnclassifiedAnswers())];
    let updatedAnswerGroups = false;
    let updatedConfirmedUnclassifiedAnswers = false;

    // Remove the answer from all answer groups.
    for (let i = 0; i < answerGroups.length; i++) {
      let answerGroup = answerGroups[i];
      let trainingData = answerGroup.trainingData;
      if (trainingData &&
        this._removeAnswerFromTrainingData(
          answer, [...trainingData]) !== -1) {
        updatedAnswerGroups = true;
      }
    }

    // Remove the answer from the confirmed unclassified answers.
    updatedConfirmedUnclassifiedAnswers = (this._removeAnswerFromTrainingData(
      answer, confirmedUnclassifiedAnswers) !== -1);

    if (updatedAnswerGroups) {
      this.responsesService.save(
        answerGroups, this.responsesService.getDefaultOutcome(),
        (newAnswerGroups, newDefaultOutcome) => {
          let stateName = this.stateEditorService.getActiveStateName();
          if (stateName) {
            this.explorationStatesService.saveInteractionAnswerGroups(
              stateName, cloneDeep(newAnswerGroups));

            this.explorationStatesService.saveInteractionDefaultOutcome(
              stateName, cloneDeep(newDefaultOutcome) as Outcome);
          }

          this.graphDataService.recompute();
        });
    }

    if (updatedConfirmedUnclassifiedAnswers) {
      this.responsesService.updateConfirmedUnclassifiedAnswers(
        confirmedUnclassifiedAnswers);
      let stateName = this.stateEditorService.getActiveStateName();
      if (stateName) {
        this.explorationStatesService.saveConfirmedUnclassifiedAnswers(
          stateName, confirmedUnclassifiedAnswers);
      }
    }
  }

  getTrainingDataAnswers(): AnswerGroupData[] {
    let trainingDataAnswers: AnswerGroupData[] = [];
    let answerGroups = this.responsesService.getAnswerGroups();

    for (let i = 0; i < answerGroups.length; i++) {
      let answerGroup = answerGroups[i];
      trainingDataAnswers.push({
        answerGroupIndex: i,
        answers: answerGroup.trainingData
      });
    }
    return trainingDataAnswers;
  }

  getTrainingDataOfAnswerGroup(answerGroupIndex: number): InteractionAnswer[] {
    return [
      ...this.responsesService.getAnswerGroup(answerGroupIndex).trainingData];
  }

  getAllPotentialOutcomes(state: State): Outcome[] {
    let potentialOutcomes = [];
    let interaction = state.interaction;

    for (let i = 0; i < interaction.answerGroups.length; i++) {
      potentialOutcomes.push(interaction.answerGroups[i].outcome);
    }

    if (interaction.defaultOutcome) {
      potentialOutcomes.push(interaction.defaultOutcome);
    }

    return potentialOutcomes;
  }

  associateWithAnswerGroup(
      answerGroupIndex: number, answer: InteractionAnswer): void {
    // Remove answer from traning data of any answer group or
    // confirmed unclassified answers.
    this._removeAnswer(answer);

    let answerGroups: AnswerGroup[] = this.responsesService.getAnswerGroups();
    let answerGroup: AnswerGroup = answerGroups[answerGroupIndex];

    // Train the rule to include this answer.
    answerGroup.trainingData = [
      ...answerGroup.trainingData,
      answer];

    this.responsesService.updateAnswerGroup(answerGroupIndex, {
      trainingData: answerGroup.trainingData
    } as AnswerGroup, (newAnswerGroups) => {
      let stateName = this.stateEditorService.getActiveStateName();
      if (stateName) {
        this.explorationStatesService.saveInteractionAnswerGroups(
          stateName, newAnswerGroups);
      }

      this.graphDataService.recompute();
    });
  }

  associateWithDefaultResponse(answer: InteractionAnswer): void {
    // Remove answer from traning data of any answer group or
    // confirmed unclassified answers.
    this._removeAnswer(answer);

    let confirmedUnclassifiedAnswers = [...(
      this.responsesService.getConfirmedUnclassifiedAnswers())];

    confirmedUnclassifiedAnswers.push(answer);
    this.responsesService.updateConfirmedUnclassifiedAnswers(
      confirmedUnclassifiedAnswers);

    let stateName = this.stateEditorService.getActiveStateName();
    if (stateName) {
      this.explorationStatesService.saveConfirmedUnclassifiedAnswers(
        stateName, confirmedUnclassifiedAnswers);
    }
  }

  isConfirmedUnclassifiedAnswer(answer: InteractionAnswer): boolean {
    return (this._getIndexOfTrainingData(
      answer,
      [...this.responsesService.getConfirmedUnclassifiedAnswers()]) !== -1);
  }

  removeAnswerFromAnswerGroupTrainingData(
      answer: InteractionAnswer, answerGroupIndex: number): void {
    let trainingData = [...this.responsesService.getAnswerGroup(
      answerGroupIndex).trainingData];
    this._removeAnswerFromTrainingData(answer, trainingData);

    let answerGroups = this.responsesService.getAnswerGroups();
    answerGroups[answerGroupIndex].trainingData = trainingData;

    this.responsesService.updateAnswerGroup(
      answerGroupIndex, {} as AnswerGroup, (newAnswerGroups) => {
        let stateName = this.stateEditorService.getActiveStateName();
        if (stateName) {
          this.explorationStatesService.saveInteractionAnswerGroups(
            stateName, newAnswerGroups);
        }

        this.graphDataService.recompute();
      });
  }
}

angular.module('oppia').factory(
  'TrainingDataService', downgradeInjectable(TrainingDataService));
