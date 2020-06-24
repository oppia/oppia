// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Object factory for creating frontend instances of
 * rubrics.
 */

export interface IRubricBackendDict {
  difficulty: string,
  explanations: Array<string>
}

import cloneDeep from 'lodash/cloneDeep';

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

export class Rubric {
  _difficulty: string;
  _explanations: Array<string>;

  constructor(difficulty: string, explanations: Array<string>) {
    this._difficulty = difficulty;
    this._explanations = explanations;
  }

  toBackendDict(): IRubricBackendDict {
    return {
      difficulty: this._difficulty,
      explanations: this._explanations
    };
  }

  getDifficulty(): string {
    return this._difficulty;
  }

  getExplanations(): Array<string> {
    return this._explanations.slice();
  }

  setExplanations(newExplanations: Array<string>): void {
    this._explanations = cloneDeep(newExplanations);
  }
}

@Injectable({
  providedIn: 'root'
})
export class RubricObjectFactory {
  createFromBackendDict(rubricBackendDict: IRubricBackendDict): Rubric {
    return new Rubric(
      rubricBackendDict.difficulty,
      rubricBackendDict.explanations);
  }
  create(difficulty: string, explanations: Array<string>): Rubric {
    return new Rubric(difficulty, explanations);
  }
}

angular.module('oppia').factory(
  'RubricObjectFactory',
  downgradeInjectable(RubricObjectFactory));
