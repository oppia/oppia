// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Hints/Solution Manager service.
 */

import { EventEmitter } from '@angular/core';

// TODO(#7222): Remove the following block of unnnecessary imports once
// hints-and-solution-manager.service.spec.ts is upgraded to Angular 8.
import { FractionObjectFactory } from 'domain/objects/FractionObjectFactory';
import { HintObjectFactory } from 'domain/exploration/HintObjectFactory';
import { SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory';
import { UnitsObjectFactory } from 'domain/objects/UnitsObjectFactory';
import { UpgradedServices } from 'services/UpgradedServices';
// ^^^ This block is to be removed.

require('domain/exploration/HintObjectFactory.ts');
require('domain/exploration/SolutionObjectFactory.ts');
require(
  'pages/exploration-player-page/services/' +
  'hints-and-solution-manager.service.ts');

describe('HintsAndSolutionManager service', function() {
  var $timeout;
  var $rootScope;
  var hasms;
  var hof;
  var sof;
  var firstHint, secondHint, thirdHint;
  var solution;
  var pps;

  var mockNewCardAvailableEmitter = new EventEmitter();

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('FractionObjectFactory', new FractionObjectFactory());
    $provide.value(
      'HintObjectFactory', new HintObjectFactory(
        new SubtitledHtmlObjectFactory()));
    $provide.value(
      'SubtitledHtmlObjectFactory', new SubtitledHtmlObjectFactory());
    $provide.value('UnitsObjectFactory', new UnitsObjectFactory());
  }));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector) {
    $timeout = $injector.get('$timeout');
    $rootScope = $injector.get('$rootScope');
    pps = $injector.get('PlayerPositionService');
    spyOnProperty(pps, 'onNewCardAvailable').and.returnValue(
      mockNewCardAvailableEmitter);
    hasms = $injector.get('HintsAndSolutionManagerService');
    hof = $injector.get('HintObjectFactory');
    sof = $injector.get('SolutionObjectFactory');


    firstHint = hof.createFromBackendDict({
      hint_content: {
        html: 'one',
        audio_translations: {}
      }
    });
    secondHint = hof.createFromBackendDict({
      hint_content: {
        html: 'two',
        audio_translations: {}
      }
    });
    thirdHint = hof.createFromBackendDict({
      hint_content: {
        html: 'three',
        audio_translations: {}
      }
    });
    solution = sof.createFromBackendDict({
      answer_is_exclusive: false,
      correct_answer: 'This is a correct answer!',
      explanation: {
        html: 'This is the explanation to the answer',
        audio_translations: {}
      }
    });

    // Initialize the service with two hints and a solution.
    hasms.reset([firstHint, secondHint], solution);
  }));

  it('should display hints at the right times', function() {
    expect(hasms.isHintTooltipOpen()).toBe(false);
    expect(hasms.isHintViewable(0)).toBe(false);
    expect(hasms.isHintViewable(1)).toBe(false);
    expect(hasms.isSolutionViewable()).toBe(false);
    expect(hasms.isHintConsumed(0)).toBe(false);
    expect(hasms.isHintConsumed(1)).toBe(false);

    // For releaseHint.
    $timeout.flush();
    // For showTooltip (called only in the first call of releaseHint).
    $timeout.flush();

    expect(hasms.isHintTooltipOpen()).toBe(true);
    expect(hasms.isHintViewable(0)).toBe(true);
    expect(hasms.isHintViewable(1)).toBe(false);
    expect(hasms.isSolutionViewable()).toBe(false);
    expect(hasms.displayHint(0).getHtml()).toBe('one');
    expect(hasms.isHintConsumed(0)).toBe(true);
    expect(hasms.isHintConsumed(1)).toBe(false);

    $timeout.flush();

    // Function displayHint hides tooltip.
    expect(hasms.isHintTooltipOpen()).toBe(false);
    expect(hasms.isHintViewable(0)).toBe(true);
    expect(hasms.isHintViewable(1)).toBe(true);
    expect(hasms.isSolutionViewable()).toBe(false);
    expect(hasms.displayHint(0).getHtml()).toBe('one');
    expect(hasms.displayHint(1).getHtml()).toBe('two');
    expect(hasms.displayHint(3)).toBeNull();
    expect(hasms.isHintConsumed(0)).toBe(true);
    expect(hasms.isHintConsumed(1)).toBe(true);

    $timeout.flush();

    expect(hasms.isSolutionViewable()).toBe(true);

    $timeout.verifyNoPendingTasks();
  });

  it('should not continue to display hints after after a correct answer is' +
     'submitted', function() {
    expect(hasms.isHintViewable(0)).toBe(false);
    expect(hasms.isHintViewable(1)).toBe(false);
    expect(hasms.isSolutionViewable()).toBe(false);
    expect(hasms.isHintConsumed(0)).toBe(false);
    expect(hasms.isHintConsumed(1)).toBe(false);

    $timeout.flush();

    expect(hasms.isHintViewable(0)).toBe(true);
    expect(hasms.isHintViewable(1)).toBe(false);
    expect(hasms.isSolutionViewable()).toBe(false);
    expect(hasms.displayHint(0).getHtml()).toBe('one');
    expect(hasms.isHintConsumed(0)).toBe(true);
    expect(hasms.isHintConsumed(1)).toBe(false);

    mockNewCardAvailableEmitter.emit();
    $timeout.flush();

    expect(hasms.isHintViewable(0)).toBe(true);
    expect(hasms.isHintViewable(1)).toBe(false);
    expect(hasms.displayHint(0).getHtml()).toBe('one');
    expect(hasms.displayHint(1)).toBeNull();
    expect(hasms.isHintConsumed(0)).toBe(true);
    expect(hasms.isHintConsumed(1)).toBe(false);
    expect(hasms.isSolutionViewable()).toBe(false);

    $timeout.verifyNoPendingTasks();
  });

  it('should show the correct number of hints', function() {
    expect(hasms.getNumHints()).toBe(2);
  });

  it('should correctly retrieve the solution', function() {
    $timeout.flush();

    expect(hasms.isSolutionConsumed()).toBe(false);
    expect(hasms.displaySolution().correctAnswer).toBe(
      'This is a correct answer!');
    expect(hasms.isSolutionConsumed()).toBe(true);

    $timeout.verifyNoPendingTasks();
  });

  it('should reset the service', function() {
    hasms.reset([firstHint, secondHint, thirdHint], solution);
    expect(hasms.getNumHints()).toBe(3);

    expect(hasms.isHintViewable(0)).toBe(false);
    expect(hasms.isHintViewable(1)).toBe(false);
    expect(hasms.isHintViewable(2)).toBe(false);
    expect(hasms.isSolutionViewable()).toBe(false);

    $timeout.flush();

    expect(hasms.isHintViewable(0)).toBe(true);
    expect(hasms.isHintViewable(1)).toBe(false);
    expect(hasms.isHintViewable(2)).toBe(false);
    expect(hasms.isSolutionViewable()).toBe(false);
    expect(hasms.displayHint(0).getHtml()).toBe('one');

    $timeout.flush();

    expect(hasms.isHintViewable(0)).toBe(true);
    expect(hasms.isHintViewable(1)).toBe(true);
    expect(hasms.isHintViewable(2)).toBe(false);
    expect(hasms.isSolutionViewable()).toBe(false);
    expect(hasms.displayHint(0).getHtml()).toBe('one');
    expect(hasms.displayHint(1).getHtml()).toBe('two');

    $timeout.flush();

    expect(hasms.isHintViewable(0)).toBe(true);
    expect(hasms.isHintViewable(1)).toBe(true);
    expect(hasms.isHintViewable(2)).toBe(true);
    expect(hasms.isSolutionViewable()).toBe(false);
    expect(hasms.displayHint(0).getHtml()).toBe('one');
    expect(hasms.displayHint(1).getHtml()).toBe('two');
    expect(hasms.displayHint(2).getHtml()).toBe('three');

    $timeout.flush();

    expect(hasms.isSolutionViewable()).toBe(true);
  });

  it('should reset the service when timeouts was called before', function() {
    // Set timeout.
    $timeout.flush();
    // Set tooltipTimeout.
    $timeout.flush();

    // Reset service to 0 solutions so releaseHint timeout won't be called.
    hasms.reset([], solution);

    // There is no timeout to flush. timeout and tooltipTimeout variables
    // were cleaned.
    expect(function() {
      $timeout.flush();
    }).toThrowError('No deferred tasks to be flushed');
    $timeout.verifyNoPendingTasks();
  });

  it('should not record the wrong answer when a hint is already released',
    function() {
      expect(hasms.isHintTooltipOpen()).toBe(false);
      expect(hasms.isHintViewable(0)).toBe(false);
      expect(hasms.isHintViewable(1)).toBe(false);
      expect(hasms.isSolutionViewable()).toBe(false);

      $timeout.flush();
      $timeout.flush();

      expect(hasms.isHintTooltipOpen()).toBe(true);
      // It only changes hint visibility.
      expect(hasms.isHintViewable(0)).toBe(true);
      expect(hasms.isHintViewable(1)).toBe(false);
      expect(hasms.isHintViewable(2)).toBe(false);
      expect(hasms.isSolutionViewable()).toBe(false);

      hasms.recordWrongAnswer();
      $timeout.verifyNoPendingTasks();

      expect(hasms.isHintTooltipOpen()).toBe(true);
      expect(hasms.isHintViewable(0)).toBe(true);
      expect(hasms.isHintViewable(1)).toBe(false);
      expect(hasms.isSolutionViewable()).toBe(false);
    });

  it('should record the wrong answer twice', function() {
    expect(hasms.isHintTooltipOpen()).toBe(false);
    expect(hasms.isHintViewable(0)).toBe(false);
    expect(hasms.isHintViewable(1)).toBe(false);
    expect(hasms.isSolutionViewable()).toBe(false);

    hasms.recordWrongAnswer();
    hasms.recordWrongAnswer();
    $timeout.flush(10000);
    $timeout.flush(60000);
    expect(hasms.isHintTooltipOpen()).toBe(true);

    hasms.displayHint(0);

    hasms.recordWrongAnswer();
    $timeout.flush(10000);

    $timeout.flush(60000);

    expect(hasms.isHintTooltipOpen()).toBe(false);
    expect(hasms.isHintViewable(0)).toBe(true);
    expect(hasms.isHintViewable(1)).toBe(true);
    expect(hasms.isSolutionViewable()).toBe(false);

    $timeout.verifyNoPendingTasks();
  });
});
