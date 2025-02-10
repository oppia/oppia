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
 * @fileoverview Frontend Model for skill difficulty.
 */

export interface SkillDifficultyBackendDict {
  id: string;
  description: string;
  difficulty: number;
}

export class SkillDifficulty {
  _id: string;
  _description: string;
  _difficulty: number;

  constructor(id: string, description: string, difficulty: number) {
    this._id = id;
    this._description = description;
    this._difficulty = difficulty;
  }

  static create(
    id: string,
    description: string,
    difficulty: number
  ): SkillDifficulty {
    return new SkillDifficulty(id, description, difficulty);
  }

  toBackendDict(): SkillDifficultyBackendDict {
    return {
      id: this._id,
      description: this._description,
      difficulty: this._difficulty,
    };
  }

  getId(): string {
    return this._id;
  }

  getDescription(): string {
    return this._description;
  }

  setDescription(newDescription: string): void {
    this._description = newDescription;
  }

  getDifficulty(): number {
    return this._difficulty;
  }

  setDifficulty(newDifficulty: number): void {
    this._difficulty = newDifficulty;
  }
}
