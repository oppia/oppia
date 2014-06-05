// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for services for the exploration player page.
 *
 * @author sll@google.com (Sean Lip)
 */

describe('Timer service', function() {
  beforeEach(module('oppia'));

  describe('timer service', function() {
    var timerService = null;
    var errorLog = [];

    beforeEach(inject(function($injector) {
      timerService = $injector.get('timerService');
      spyOn($injector.get('$log'), 'error').andCallFake(function(errorMessage) {
        errorLog.push(errorMessage);
      });
    }));

    var changeCurrentTime = function(desiredCurrentTime) {
      timerService._getCurrentTime = function() {
        return desiredCurrentTime;
      };
    };

    it('should correctly record time intervals', function() {
      changeCurrentTime(0);
      timerService.resetTimer();
      changeCurrentTime(500);
      expect(timerService.getTimeInSecs()).toEqual(0.5);
    });

    it('should not reset the timer when the current time is retrieved', function() {
      changeCurrentTime(0);
      timerService.resetTimer();
      changeCurrentTime(500);
      expect(timerService.getTimeInSecs()).toEqual(0.5);
      expect(timerService.getTimeInSecs()).toEqual(0.5);
    });

    it('should correctly reset the timer', function() {
      changeCurrentTime(0);
      timerService.resetTimer();
      changeCurrentTime(500);
      expect(timerService.getTimeInSecs()).toEqual(0.5);
      timerService.resetTimer();
      expect(timerService.getTimeInSecs()).toEqual(0);
      changeCurrentTime(800);
      expect(timerService.getTimeInSecs()).toEqual(0.3);
    });

    it('should raise an error if getTimeInSecs() is called prior to resetTimer()', function() {
      changeCurrentTime(29);
      expect(timerService.getTimeInSecs()).toBeNull();
      expect(errorLog).toEqual([
        'Tried to retrieve the elapsed time, but no start time was set.']);
    });
  });
});
