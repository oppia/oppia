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
 * @fileoverview Unit tests for the ImprovementTaskService.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// ImprovementTaskService.ts is upgraded to Angular 8.
import { UpgradedServices } from 'services/UpgradedServices';

require('domain/statistics/AnswerDetailsImprovementTaskObjectFactory.ts');
require('domain/statistics/FeedbackImprovementTaskObjectFactory.ts');
require('domain/statistics/PlaythroughImprovementTaskObjectFactory.ts');
require('domain/statistics/SuggestionImprovementTaskObjectFactory.ts');
require('services/improvement-task.service.ts');

describe('ImprovementTaskService', function() {
  var $q = null;
  var $rootScope = null;
  var ImprovementTaskService = null;
  var AnswerDetailsImprovementTaskObjectFactory = null;
  var FeedbackImprovementTaskObjectFactory = null;
  var PlaythroughImprovementTaskObjectFactory = null;
  var SuggestionImprovementTaskObjectFactory = null;

  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function(
      _$q_, _$rootScope_, _ImprovementTaskService_,
      _AnswerDetailsImprovementTaskObjectFactory_,
      _FeedbackImprovementTaskObjectFactory_,
      _PlaythroughImprovementTaskObjectFactory_,
      _SuggestionImprovementTaskObjectFactory_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    ImprovementTaskService = _ImprovementTaskService_;
    AnswerDetailsImprovementTaskObjectFactory =
      _AnswerDetailsImprovementTaskObjectFactory_;
    FeedbackImprovementTaskObjectFactory =
      _FeedbackImprovementTaskObjectFactory_;
    PlaythroughImprovementTaskObjectFactory =
      _PlaythroughImprovementTaskObjectFactory_;
    SuggestionImprovementTaskObjectFactory =
      _SuggestionImprovementTaskObjectFactory_;

    this.expectedFactories = [
      AnswerDetailsImprovementTaskObjectFactory,
      FeedbackImprovementTaskObjectFactory,
      PlaythroughImprovementTaskObjectFactory,
      SuggestionImprovementTaskObjectFactory,
    ];

    this.scope = $rootScope.$new();
  }));

  describe('.getImprovementTaskObjectFactoryRegistry', function() {
    it('contains all known improvement task object factories', function() {
      var actualFactories =
        ImprovementTaskService.getImprovementTaskObjectFactoryRegistry();

      // The registry should not be modifiable.
      expect(Object.isFrozen(actualFactories)).toBe(true);

      // Ordering isn't important, so allow the checks to be flexible.
      expect(actualFactories.length).toEqual(this.expectedFactories.length);
      this.expectedFactories.forEach(factory => {
        expect(actualFactories).toContain(factory);
      });
    });
  });

  describe('.fetchTasks', function() {
    // NOTE: Each individual factory should test their own fetchTasks function.

    it('returns empty list when each factory returns no tasks', function(done) {
      this.expectedFactories.forEach(factory => {
        spyOn(factory, 'fetchTasks').and.returnValue($q.resolve([]));
      });

      ImprovementTaskService.fetchTasks()
        .then(allTasks => expect(allTasks).toEqual([]))
        .then(done, done.fail);

      // Force all pending promises to evaluate.
      this.scope.$digest();
    });
  });
});
