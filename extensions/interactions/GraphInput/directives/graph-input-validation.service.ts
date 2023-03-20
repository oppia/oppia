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
 * @fileoverview Validator service for the interaction.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AnswerGroup } from
  'domain/exploration/AnswerGroupObjectFactory';
import { Warning, baseInteractionValidationService } from
  'interactions/base-interaction-validation.service';
import { GraphInputCustomizationArgs } from
  'interactions/customization-args-defs';
import { Outcome } from
  'domain/exploration/OutcomeObjectFactory';
import { GraphAnswer } from 'interactions/answer-defs';

import { AppConstants } from 'app.constants';

@Injectable({
  providedIn: 'root'
})
export class GraphInputValidationService {
  constructor(
      private baseInteractionValidationServiceInstance:
        baseInteractionValidationService) {}

  VERTICES_LIMIT = 50;

  getCustomizationArgsWarnings(
      customizationArgs: GraphInputCustomizationArgs): Warning[] {
    var warningsList = [];
    this.baseInteractionValidationServiceInstance.requireCustomizationArguments(
      customizationArgs,
      ['graph', 'canEditEdgeWeight', 'canEditVertexLabel']);

    if (customizationArgs.graph.value.vertices.length > this.VERTICES_LIMIT) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.CRITICAL,
        message: (
          'The graph used in customization exceeds supported ' +
          'maximum number of vertices of ' + this.VERTICES_LIMIT + '.')
      });
    }

    if (!customizationArgs.graph.value.isWeighted &&
        customizationArgs.canEditEdgeWeight.value) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.CRITICAL,
        message: (
          'The learner cannot edit edge weights for an unweighted graph.')
      });
    }

    if (!customizationArgs.graph.value.isLabeled &&
        customizationArgs.canEditVertexLabel.value) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.CRITICAL,
        message: (
          'The learner cannot edit vertex labels for an unlabeled graph.')
      });
    }
    return warningsList;
  }

  getAllWarnings(
      stateName: string, customizationArgs: GraphInputCustomizationArgs,
      answerGroups: AnswerGroup[], defaultOutcome: Outcome): Warning[] {
    var ISOMORPHISM_VERTICES_LIMIT = 10;

    var warningsList: Warning[] = [];

    warningsList = warningsList.concat(
      this.getCustomizationArgsWarnings(customizationArgs));

    warningsList = warningsList.concat(
      this.baseInteractionValidationServiceInstance.getAllOutcomeWarnings(
        answerGroups, defaultOutcome, stateName));

    for (var i = 0; i < answerGroups.length; i++) {
      var rules = answerGroups[i].rules;
      for (var j = 0; j < rules.length; j++) {
        var rule = rules[j];
        var gInputs = rule.inputs.g as GraphAnswer;
        try {
          if (rule.type === 'HasGraphProperty') {
            continue;
          } else if (rule.type === 'IsIsomorphicTo' &&
              gInputs.vertices.length > ISOMORPHISM_VERTICES_LIMIT) {
            warningsList.push({
              type: AppConstants.WARNING_TYPES.CRITICAL,
              message: (
                'The graph used in the learner answer ' + (j + 1) +
                ' in Oppia response ' + (i + 1) +
                ' exceeds supported maximum number of vertices ' + 'of ' +
                ISOMORPHISM_VERTICES_LIMIT + ' for isomorphism check.')
            });
          } else if (gInputs.vertices.length > this.VERTICES_LIMIT) {
            warningsList.push({
              type: AppConstants.WARNING_TYPES.CRITICAL,
              message: (
                'The graph used in the learner answer ' + (j + 1) +
                ' in Oppia response ' + (i + 1) +
                ' exceeds supported maximum number of vertices ' +
                'of ' + this.VERTICES_LIMIT + '.')
            });
          }
        } catch (e) {
          warningsList.push({
            type: AppConstants.WARNING_TYPES.CRITICAL,
            message: (
              'Learner answer ' + (j + 1) + ' in Oppia response ' + (i + 1) +
              ' is invalid.')
          });
        }
      }
    }
    return warningsList;
  }
}

angular.module('oppia').factory(
  'GraphInputValidationService',
  downgradeInjectable(GraphInputValidationService));
