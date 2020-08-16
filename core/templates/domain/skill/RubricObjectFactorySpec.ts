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
 * @fileoverview Unit tests for RubricObjectFactory.
 */

import { RubricObjectFactory } from 'domain/skill/RubricObjectFactory';

describe('Rubric object factory', () => {
  let rubricObjectFactory: RubricObjectFactory;
  let rubricDict: {
    difficulty: string; explanations: string[];
  };

  beforeEach(() => {
    rubricObjectFactory = new RubricObjectFactory();
    rubricDict = {
      difficulty: 'easy',
      explanations: ['test explanation']
    };
  });

  it('should create a new rubric from backend dict', () => {
    const rubric = rubricObjectFactory.createFromBackendDict(rubricDict);
    expect(rubric.getDifficulty()).toEqual('easy');
    expect(rubric.getExplanations()).toEqual(['test explanation']);
  });

  it('should convert to a backend dictionary', () => {
    const rubric = rubricObjectFactory.createFromBackendDict(rubricDict);
    expect(rubric.toBackendDict()).toEqual(rubricDict);
  });

  it('should create a new rubric', () => {
    const rubric = rubricObjectFactory.create(
      'medium', ['This is an explanation']);
    expect(rubric.getDifficulty()).toEqual('medium');
    expect(rubric.getExplanations()).toEqual(['This is an explanation']);
  });

  it('should change explanation in a rubric', () => {
    const rubric = rubricObjectFactory.create('easy', ['test explanation']);
    expect(rubric.getExplanations()).toEqual(['test explanation']);

    rubric.setExplanations(['new explanation']);
    expect(rubric.getExplanations()).toEqual(['new explanation']);
  });
});
