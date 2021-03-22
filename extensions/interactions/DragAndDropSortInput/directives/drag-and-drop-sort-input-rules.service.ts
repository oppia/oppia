// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Rules service for the interaction.
 */

// Rules Service for DragAndDropSortInput interaction.

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { DragAndDropAnswer } from 'interactions/answer-defs';
import {
  DragAndDropCheckEqualityRuleInputs,
  DragAndDropHasElementXAtPositionYRuleInputs,
  DragAndDropHasElementXBeforeElementYRuleInputs
} from 'interactions/rule-input-defs';

@Injectable({
  providedIn: 'root'
})
export class DragAndDropSortInputRulesService {
  static checkEquality(
      answer: DragAndDropAnswer,
      inputs: DragAndDropCheckEqualityRuleInputs): boolean {
    for (var i: number = 0; i < answer.length; i++) {
      if (answer[i].length === inputs.x[i].length) {
        for (var j: number = 0; j < answer[i].length; j++) {
          if (inputs.x[i].indexOf(answer[i][j]) === -1) {
            return false;
          }
        }
      } else {
        return false;
      }
    }
    return true;
  }

  static checkEqualityWithIncorrectPositions(
      answer: DragAndDropAnswer,
      inputs: DragAndDropCheckEqualityRuleInputs): boolean {
    var noOfMismatches: number = 0;
    for (var i: number = 0; i < Math.min(inputs.x.length, answer.length); i++) {
      for (
        var j: number = 0; j < Math.max(answer[i].length,
          inputs.x[i].length); j++) {
        if (inputs.x[i].length > answer[i].length) {
          if (answer[i].indexOf(inputs.x[i][j]) === -1) {
            noOfMismatches += 1;
          }
        } else {
          if (inputs.x[i].indexOf(answer[i][j]) === -1) {
            noOfMismatches += 1;
          }
        }
      }
    }
    return noOfMismatches === 1;
  }

  IsEqualToOrdering(
      answer: DragAndDropAnswer,
      inputs: DragAndDropCheckEqualityRuleInputs): boolean {
    return answer.length === inputs.x.length && (
      DragAndDropSortInputRulesService.checkEquality(
        answer, inputs));
  }

  IsEqualToOrderingWithOneItemAtIncorrectPosition(
      answer: DragAndDropAnswer,
      inputs: DragAndDropCheckEqualityRuleInputs): boolean {
    return DragAndDropSortInputRulesService.checkEqualityWithIncorrectPositions(
      answer, inputs);
  }

  HasElementXAtPositionY(
      answer: DragAndDropAnswer,
      inputs: DragAndDropHasElementXAtPositionYRuleInputs): boolean {
    for (var i: number = 0; i < answer.length; i++) {
      var index = answer[i].indexOf(inputs.x);
      if (index !== -1) {
        return ((i + 1) === inputs.y);
      }
    }
    return false;
  }

  HasElementXBeforeElementY(
      answer: DragAndDropAnswer,
      inputs: DragAndDropHasElementXBeforeElementYRuleInputs): boolean {
    var indX = -1;
    var indY = -1;
    for (var i: number = 0; i < answer.length; i++) {
      var index = answer[i].indexOf(inputs.x);
      if (index !== -1) {
        indX = i;
      }
      index = answer[i].indexOf(inputs.y);
      if (index !== -1) {
        indY = i;
      }
    }
    return indX < indY;
  }
}


angular.module('oppia').factory(
  'DragAndDropSortInputRulesService',
  downgradeInjectable(DragAndDropSortInputRulesService));
