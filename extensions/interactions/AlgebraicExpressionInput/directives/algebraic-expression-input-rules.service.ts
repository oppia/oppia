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
 * @fileoverview Rules service for the AlgebraicExpressionInput interaction.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

const nerdamer = require('nerdamer');

@Injectable({
  providedIn: 'root'
})
export class AlgebraicExpressionInputRulesService {
  MatchesExactlyWith(answer: string, inputs: {x: string}): boolean {
    return nerdamer(answer).eq(inputs.x);
  }

  IsEquivalentTo(answer: string, inputs: {x: string}): boolean {
    let expandedLearnerAnswer = nerdamer(`expand(${answer})`);
    let simplifiedLearnerAnswer = nerdamer(
      `simplify(${expandedLearnerAnswer})`);

    let expandedCreatorAnswer = nerdamer(`expand(${inputs.x})`);
    let simplifiedCreatorAnswer = nerdamer(
      `simplify(${expandedCreatorAnswer})`);

    return nerdamer(simplifiedLearnerAnswer).eq(simplifiedCreatorAnswer);
  }
}

angular.module('oppia').factory(
  'AlgebraicExpressionInputRulesService',
  downgradeInjectable(AlgebraicExpressionInputRulesService));
