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
 * @fileoverview Unit tests for GenerateContentIdService.
 */

import { GenerateContentIdService } from 'services/generate-content-id.service';

describe('GenerateContentIdService', () => {
  let gcis: GenerateContentIdService;

  beforeEach(() => {
    gcis = new GenerateContentIdService();
  });

  it('should generate content id for new feedbacks', () => {
    expect(
      gcis.getNextId(['feedback_1'], 'feedback')).toEqual(
      'feedback_2');
  });

  it('should generate content id for new hint', () => {
    expect(
      gcis.getNextId(['hint_1'], 'hint')).toEqual(
      'hint_2');
  });

  it('should generate content id for new worked example', () => {
    expect(gcis.getNextId(['worked_example_1'], 'worked_example')).toEqual(
      'worked_example_2');
  });

  it('should throw error for unknown content id', () => {
    expect(function() {
      gcis.getNextId(['xyz'], 'random_component_name');
    }).toThrowError('Unknown component name provided.');
  });
});
