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
import { TestBed, fakeAsync, flush, tick } from '@angular/core/testing';

import { HintObjectFactory } from 'domain/exploration/HintObjectFactory.ts';
import { SolutionObjectFactory } from 'domain/exploration/SolutionObjectFactory.ts';
import { HintsAndSolutionManagerService } from 'pages/exploration-player-page/services/hints-and-solution-manager.service.ts';
import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service.ts';

describe('HintsAndSolutionManager service', () => {
  let hasms;
  let hof;
  let sof;
  let firstHint, secondHint, thirdHint;
  let solution;
  let pps;

  let mockNewCardAvailableEmitter = new EventEmitter();

  const ACCELERATED_HINT_WAIT_TIME_MSEC: number = 10000;
  const WAIT_FOR_FIRST_HINT_MSEC: number = 60000;
  const WAIT_FOR_SUBSEQUENT_HINTS_MSEC: number = 30000;
  const WAIT_FOR_TOOLTIP_TO_BE_SHOWN_MSEC: number = 60000;

  beforeEach(fakeAsync(() => {
    pps = TestBed.get(PlayerPositionService);
    spyOnProperty(pps, 'onNewCardAvailable').and.returnValue(
      mockNewCardAvailableEmitter);
    hasms = TestBed.get(HintsAndSolutionManagerService);
    hof = TestBed.get(HintObjectFactory);
    sof = TestBed.get(SolutionObjectFactory);

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
  }));

  it('should display hints at the right times', fakeAsync(() => {
    // Initialize the service with two hints and a solution.
    hasms.reset([firstHint, secondHint], solution);

    expect(hasms.isHintTooltipOpen()).toBe(false);
    expect(hasms.isHintViewable(0)).toBe(false);
    expect(hasms.isHintViewable(1)).toBe(false);
    expect(hasms.isSolutionViewable()).toBe(false);
    expect(hasms.isHintConsumed(0)).toBe(false);
    expect(hasms.isHintConsumed(1)).toBe(false);

    // For releaseHint.
    tick(WAIT_FOR_FIRST_HINT_MSEC);
    // For showTooltip (called only in the first call of releaseHint).
    tick(WAIT_FOR_TOOLTIP_TO_BE_SHOWN_MSEC);

    expect(hasms.isHintTooltipOpen()).toBe(true);
    expect(hasms.isHintViewable(0)).toBe(true);
    expect(hasms.isHintViewable(1)).toBe(false);
    expect(hasms.isSolutionViewable()).toBe(false);
    expect(hasms.displayHint(0).getHtml()).toBe('one');
    expect(hasms.isHintConsumed(0)).toBe(true);
    expect(hasms.isHintConsumed(1)).toBe(false);

    tick(WAIT_FOR_SUBSEQUENT_HINTS_MSEC);

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

    tick(WAIT_FOR_SUBSEQUENT_HINTS_MSEC);

    expect(hasms.isSolutionViewable()).toBe(true);
  }));

  it('should not continue to display hints after after a correct answer is' +
     'submitted', fakeAsync(() => {
    // Initialize the service with two hints and a solution.
    hasms.reset([firstHint, secondHint], solution);

    expect(hasms.isHintViewable(0)).toBe(false);
    expect(hasms.isHintViewable(1)).toBe(false);
    expect(hasms.isSolutionViewable()).toBe(false);
    expect(hasms.isHintConsumed(0)).toBe(false);
    expect(hasms.isHintConsumed(1)).toBe(false);

    tick(WAIT_FOR_FIRST_HINT_MSEC);

    expect(hasms.isHintViewable(0)).toBe(true);
    expect(hasms.isHintViewable(1)).toBe(false);
    expect(hasms.isSolutionViewable()).toBe(false);
    expect(hasms.displayHint(0).getHtml()).toBe('one');
    expect(hasms.isHintConsumed(0)).toBe(true);
    expect(hasms.isHintConsumed(1)).toBe(false);

    mockNewCardAvailableEmitter.emit();
    tick(WAIT_FOR_SUBSEQUENT_HINTS_MSEC);

    expect(hasms.isHintViewable(0)).toBe(true);
    expect(hasms.isHintViewable(1)).toBe(false);
    expect(hasms.displayHint(0).getHtml()).toBe('one');
    expect(hasms.displayHint(1)).toBeNull();
    expect(hasms.isHintConsumed(0)).toBe(true);
    expect(hasms.isHintConsumed(1)).toBe(false);
    expect(hasms.isSolutionViewable()).toBe(false);
  }));

  it('should show the correct number of hints', () => {
    // Initialize the service with two hints and a solution.
    hasms.reset([firstHint, secondHint], solution);

    expect(hasms.getNumHints()).toBe(2);
  });

  it('should correctly retrieve the solution', fakeAsync(() => {
    // Initialize the service with two hints and a solution.
    hasms.reset([firstHint, secondHint], solution);

    tick(WAIT_FOR_FIRST_HINT_MSEC);

    expect(hasms.isSolutionConsumed()).toBe(false);
    expect(hasms.displaySolution().correctAnswer).toBe(
      'This is a correct answer!');
    expect(hasms.isSolutionConsumed()).toBe(true);
  }));

  it('should reset the service', fakeAsync(() => {
    // Initialize the service with two hints and a solution.
    hasms.reset([firstHint, secondHint], solution);

    hasms.reset([firstHint, secondHint, thirdHint], solution);
    expect(hasms.getNumHints()).toBe(3);

    expect(hasms.isHintViewable(0)).toBe(false);
    expect(hasms.isHintViewable(1)).toBe(false);
    expect(hasms.isHintViewable(2)).toBe(false);
    expect(hasms.isSolutionViewable()).toBe(false);

    tick(WAIT_FOR_FIRST_HINT_MSEC);

    expect(hasms.isHintViewable(0)).toBe(true);
    expect(hasms.isHintViewable(1)).toBe(false);
    expect(hasms.isHintViewable(2)).toBe(false);
    expect(hasms.isSolutionViewable()).toBe(false);
    expect(hasms.displayHint(0).getHtml()).toBe('one');

    tick(WAIT_FOR_SUBSEQUENT_HINTS_MSEC);

    expect(hasms.isHintViewable(0)).toBe(true);
    expect(hasms.isHintViewable(1)).toBe(true);
    expect(hasms.isHintViewable(2)).toBe(false);
    expect(hasms.isSolutionViewable()).toBe(false);
    expect(hasms.displayHint(0).getHtml()).toBe('one');
    expect(hasms.displayHint(1).getHtml()).toBe('two');

    tick(WAIT_FOR_SUBSEQUENT_HINTS_MSEC);

    expect(hasms.isHintViewable(0)).toBe(true);
    expect(hasms.isHintViewable(1)).toBe(true);
    expect(hasms.isHintViewable(2)).toBe(true);
    expect(hasms.isSolutionViewable()).toBe(false);
    expect(hasms.displayHint(0).getHtml()).toBe('one');
    expect(hasms.displayHint(1).getHtml()).toBe('two');
    expect(hasms.displayHint(2).getHtml()).toBe('three');

    tick(WAIT_FOR_SUBSEQUENT_HINTS_MSEC);

    expect(hasms.isSolutionViewable()).toBe(true);
  }));

  it('should reset the service when timeouts was called before',
    fakeAsync(() => {
      // Initialize the service with two hints and a solution.
      hasms.reset([firstHint, secondHint], solution);

      // Set timeout.
      tick(WAIT_FOR_FIRST_HINT_MSEC);
      // Set tooltipTimeout.
      tick(WAIT_FOR_TOOLTIP_TO_BE_SHOWN_MSEC);

      // Reset service to 0 solutions so releaseHint timeout won't be called.
      hasms.reset([], solution);

      // There is no timeout to flush. timeout and tooltipTimeout variables
      // were cleaned.
      expect(flush()).toBe(0);
    }));

  it('should not record the wrong answer when a hint is already released',
    fakeAsync(() => {
      // Initialize the service with two hints and a solution.
      hasms.reset([firstHint, secondHint], solution);

      expect(hasms.isHintTooltipOpen()).toBe(false);
      expect(hasms.isHintViewable(0)).toBe(false);
      expect(hasms.isHintViewable(1)).toBe(false);
      expect(hasms.isSolutionViewable()).toBe(false);

      tick(WAIT_FOR_FIRST_HINT_MSEC);
      tick(WAIT_FOR_TOOLTIP_TO_BE_SHOWN_MSEC);

      expect(hasms.isHintTooltipOpen()).toBe(true);
      // It only changes hint visibility.
      expect(hasms.isHintViewable(0)).toBe(true);
      expect(hasms.isHintViewable(1)).toBe(false);
      expect(hasms.isHintViewable(2)).toBe(false);
      expect(hasms.isSolutionViewable()).toBe(false);

      hasms.recordWrongAnswer();

      expect(hasms.isHintTooltipOpen()).toBe(true);
      expect(hasms.isHintViewable(0)).toBe(true);
      expect(hasms.isHintViewable(1)).toBe(false);
      expect(hasms.isSolutionViewable()).toBe(false);
    }));

  it('should record the wrong answer twice', fakeAsync(() => {
    // Initialize the service with two hints and a solution.
    hasms.reset([firstHint, secondHint], solution);

    expect(hasms.isHintTooltipOpen()).toBe(false);
    expect(hasms.isHintViewable(0)).toBe(false);
    expect(hasms.isHintViewable(1)).toBe(false);
    expect(hasms.isSolutionViewable()).toBe(false);

    hasms.recordWrongAnswer();
    hasms.recordWrongAnswer();
    tick(ACCELERATED_HINT_WAIT_TIME_MSEC);
    tick(WAIT_FOR_TOOLTIP_TO_BE_SHOWN_MSEC);
    expect(hasms.isHintTooltipOpen()).toBe(true);

    hasms.displayHint(0);

    hasms.recordWrongAnswer();
    tick(ACCELERATED_HINT_WAIT_TIME_MSEC);

    tick(WAIT_FOR_TOOLTIP_TO_BE_SHOWN_MSEC);

    expect(hasms.isHintTooltipOpen()).toBe(false);
    expect(hasms.isHintViewable(0)).toBe(true);
    expect(hasms.isHintViewable(1)).toBe(true);
    expect(hasms.isSolutionViewable()).toBe(false);
  }));

  it('should send the solution viewed event emitter', () => {
    let mockSolutionViewedEventEmitter = new EventEmitter();
    expect(hasms.onSolutionViewedEventEmitter).toEqual(
      mockSolutionViewedEventEmitter);
  });

  it('should fetch EventEmitter for consumption of hint', () => {
    let mockHintConsumedEvent = new EventEmitter();
    expect(hasms.onHintConsumed).toEqual(mockHintConsumedEvent);
  });
});
