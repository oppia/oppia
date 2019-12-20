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
 * @fileoverview Unit tests for the ImprovementActionButtonObjectFactory.
 */

import { ImprovementActionButtonObjectFactory } from
  'domain/statistics/ImprovementActionButtonObjectFactory';

describe('ImprovementActionButtonObjectFactory', () => {
  let improvementActionButtonObjectFactory:
    ImprovementActionButtonObjectFactory = null;

  beforeEach(() => {
    improvementActionButtonObjectFactory =
      new ImprovementActionButtonObjectFactory();
  });

  describe('.createNew', () => {
    it('stores the name and class', () => {
      var improvementAction = improvementActionButtonObjectFactory.createNew(
        'Test', 'btn-success', () => {});

      expect(improvementAction.getText()).toEqual('Test');
      expect(improvementAction.getCssClass()).toEqual('btn-success');
    });
  });

  describe('.execute', () => {
    it('executes the passed function when called', () => {
      var flagToSetOnCallback = false;
      var improvementAction = improvementActionButtonObjectFactory.createNew(
        'Test', 'btn-success', () => flagToSetOnCallback = true);

      expect(flagToSetOnCallback).toBe(false);
      improvementAction.execute();
      expect(flagToSetOnCallback).toBe(true);
    });
  });

  describe('.isEnabled', () => {
    it('is always true when no enabled func is provided', () => {
      var improvementAction = improvementActionButtonObjectFactory.createNew(
        'Test', 'btn-success', () => {});

      expect(improvementAction.isEnabled()).toBe(true);
    });

    it('returns the same value that the enabled func does', () => {
      var boolValue = true;
      var improvementAction = improvementActionButtonObjectFactory.createNew(
        'Test', 'btn-success', () => {}, () => boolValue);

      expect(improvementAction.isEnabled()).toBe(true);
      boolValue = false;
      expect(improvementAction.isEnabled()).toBe(false);
    });
  });
});
