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

describe('ImprovementActionButtonObjectFactory', function() {
  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    this.ImprovementActionButtonObjectFactory =
      $injector.get('ImprovementActionButtonObjectFactory');
  }));

  describe('.createNew', function() {
    it('stores the name and action', function() {
      var flagToSetOnCallback = false;
      var improvementAction =
        this.ImprovementActionButtonObjectFactory.createNew('Test', function() {
          flagToSetOnCallback = true;
        }, 'btn-success');

      expect(improvementAction.getText()).toEqual('Test');
      expect(improvementAction.getCssClass()).toEqual('btn-success');
      expect(flagToSetOnCallback).toBe(false);
      improvementAction.execute();
      expect(flagToSetOnCallback).toBe(true);
    });

    it('uses btn-default as class by default', function() {
      var improvementAction =
        this.ImprovementActionButtonObjectFactory.createNew('Test', function() {
        });

      expect(improvementAction.getCssClass()).toEqual('btn-default');
    });
  });
});
