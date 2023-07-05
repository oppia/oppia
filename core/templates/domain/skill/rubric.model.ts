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
 * @fileoverview Model for creating frontend instances of
 * rubrics.
 */

export interface RubricBackendDict {
  difficulty: string;
  explanations: string[];
}

import cloneDeep from 'lodash/cloneDeep';

export class Rubric {
  _difficulty: string;
  _explanations: string[];

  constructor(difficulty: string, explanations: string[]) {
    this._difficulty = difficulty;
    this._explanations = explanations;
  }

  toBackendDict(): RubricBackendDict {
    return {
      difficulty: this._difficulty,
      explanations: this._explanations
    };
  }

  getDifficulty(): string {
    return this._difficulty;
  }

  getExplanations(): string[] {
    return this._explanations.slice();
  }

  setExplanations(newExplanations: string[]): void {
    this._explanations = cloneDeep(newExplanations);
  }

  static createFromBackendDict(rubricBackendDict: RubricBackendDict): Rubric {
    return new Rubric(
      rubricBackendDict.difficulty,
      rubricBackendDict.explanations);
  }

  static create(difficulty: string, explanations: string[]): Rubric {
    return new Rubric(difficulty, explanations);
  }
}
