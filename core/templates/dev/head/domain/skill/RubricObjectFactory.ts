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

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export class Rubric {
  _difficulty: string;
  _explanation: string;

  constructor(difficulty: string, explanation: string) {
    this._difficulty = difficulty;
    this._explanation = explanation;
  }

  toBackendDict(): {difficulty: string; explanation: string;} {
    return {
      difficulty: this._difficulty,
      explanation: this._explanation
    };
  }

  getDifficulty(): string {
    return this._difficulty;
  }

  getExplanation(): string {
    return this._explanation;
  }

  setExplanation(newExplanation: string): void {
    this._explanation = newExplanation;
  }
}

@Injectable({
  providedIn: 'root'
})
export class RubricObjectFactory {
  createFromBackendDict(rubricBackendDict: {
      difficulty: string; explanation: string;
    }): Rubric {
    return new Rubric(
      rubricBackendDict.difficulty,
      rubricBackendDict.explanation);
  }
  create(difficulty: string, explanation: string): Rubric {
    return new Rubric(difficulty, explanation);
  }
}

angular.module('oppia').factory(
  'RubricObjectFactory',
  downgradeInjectable(RubricObjectFactory));
