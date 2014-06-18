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

describe('Stopwatch service', function() {
  beforeEach(module('oppia'));

  describe('stopwatch service', function() {
    var stopwatchProviderService = null;
    var errorLog = [];

    beforeEach(inject(function($injector) {
      stopwatchProviderService = $injector.get('stopwatchProviderService');
      spyOn($injector.get('$log'), 'error').andCallFake(function(errorMessage) {
        errorLog.push(errorMessage);
      });
    }));

    var changeCurrentTime = function(stopwatch, desiredCurrentTime) {
      stopwatch._getCurrentTime = function() {
        return desiredCurrentTime;
      };
    };

    it('should correctly record time intervals', function() {
      var stopwatch = stopwatchProviderService.getInstance();
      changeCurrentTime(stopwatch, 0);
      stopwatch.resetStopwatch();
      changeCurrentTime(stopwatch, 500);
      expect(stopwatch.getTimeInSecs()).toEqual(0.5);
    });

    it('should not reset the stopwatch when the current time is retrieved', function() {
      var stopwatch = stopwatchProviderService.getInstance();
      changeCurrentTime(stopwatch, 0);
      stopwatch.resetStopwatch();
      changeCurrentTime(stopwatch, 500);
      expect(stopwatch.getTimeInSecs()).toEqual(0.5);
      expect(stopwatch.getTimeInSecs()).toEqual(0.5);
    });

    it('should correctly reset the stopwatch', function() {
      var stopwatch = stopwatchProviderService.getInstance();
      changeCurrentTime(stopwatch, 0);
      stopwatch.resetStopwatch();
      changeCurrentTime(stopwatch, 500);
      expect(stopwatch.getTimeInSecs()).toEqual(0.5);
      stopwatch.resetStopwatch();
      expect(stopwatch.getTimeInSecs()).toEqual(0);
      changeCurrentTime(stopwatch, 800);
      expect(stopwatch.getTimeInSecs()).toEqual(0.3);
    });

    it('should raise an error if getTimeInSecs() is called prior to resetStopwatch()', function() {
      var stopwatch = stopwatchProviderService.getInstance();
      changeCurrentTime(stopwatch, 29);
      expect(stopwatch.getTimeInSecs()).toBeNull();
      expect(errorLog).toEqual([
        'Tried to retrieve the elapsed time, but no start time was set.']);
    });

    it('should instantiate independent stopwatches', function() {
      var stopwatch1 = stopwatchProviderService.getInstance();
      var stopwatch2 = stopwatchProviderService.getInstance();

      changeCurrentTime(stopwatch1, 0);
      changeCurrentTime(stopwatch2, 0);
      stopwatch1.resetStopwatch();

      changeCurrentTime(stopwatch1, 50);
      changeCurrentTime(stopwatch2, 50);
      stopwatch2.resetStopwatch();

      changeCurrentTime(stopwatch1, 100);
      changeCurrentTime(stopwatch2, 100);
      expect(stopwatch1.getTimeInSecs()).toEqual(0.1);
      expect(stopwatch2.getTimeInSecs()).toEqual(0.05);
    });
  });
});
