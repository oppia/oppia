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
 * @fileoverview Unit tests for Stopwatch model.
 */

import { Stopwatch } from 'domain/utilities/stopwatch.model';

describe('Stopwatch model', () => {
  let nowSpy: jasmine.Spy<() => number>;

  beforeEach(() => {
    nowSpy = spyOn(Date, 'now');
  });

  const changeCurrentTime = (desiredCurrentTime: number) => {
    nowSpy.and.returnValue(desiredCurrentTime);
  };

  it('should correctly record time intervals', () => {
    let stopwatch = Stopwatch.create();
    changeCurrentTime(0);
    expect(stopwatch._getCurrentTime()).toBe(0);
    stopwatch.reset();
    changeCurrentTime(500);
    expect(stopwatch._getCurrentTime()).toBe(500);
    expect(stopwatch.getTimeInSecs()).toEqual(0.5);
  });

  it('should not reset stopwatch when current time is retrieved', () => {
    let stopwatch = Stopwatch.create();
    changeCurrentTime(0);
    expect(stopwatch._getCurrentTime()).toBe(0);
    stopwatch.reset();
    changeCurrentTime(500);
    expect(stopwatch._getCurrentTime()).toBe(500);
    expect(stopwatch.getTimeInSecs()).toEqual(0.5);
    expect(stopwatch.getTimeInSecs()).toEqual(0.5);
  });

  it('should correctly reset the stopwatch', () => {
    let stopwatch = Stopwatch.create();
    changeCurrentTime(0);
    expect(stopwatch._getCurrentTime()).toBe(0);
    stopwatch.reset();
    changeCurrentTime(500);
    expect(stopwatch._getCurrentTime()).toBe(500);
    expect(stopwatch.getTimeInSecs()).toEqual(0.5);
    stopwatch.reset();
    expect(stopwatch.getTimeInSecs()).toEqual(0);
    changeCurrentTime(800);
    expect(stopwatch._getCurrentTime()).toBe(800);
    expect(stopwatch.getTimeInSecs()).toEqual(0.3);
  });

  it('should error if getTimeInSecs() is called before reset()', () => {
    // LoggerService is private, so to check if it's being called
    // console.error needs to be spied.
    const errorLog = spyOn(console, 'error').and.callThrough();
    let stopwatch = Stopwatch.create();
    changeCurrentTime(29);
    expect(stopwatch._getCurrentTime()).toBe(29);
    expect(stopwatch.getTimeInSecs()).toBe(0);
    expect(errorLog).toHaveBeenCalledWith(
      'Tried to retrieve the elapsed time, but no start time was set.');
  });

  it('should error if the start time is later than the current time', () => {
    // LoggerService is private, so to check if it's being called
    // console.error needs to be spied.
    const errorLog = spyOn(console, 'error').and.callThrough();
    let stopwatch = Stopwatch.create();

    changeCurrentTime(1000);
    expect(stopwatch._getCurrentTime()).toBe(1000);
    stopwatch.reset();

    changeCurrentTime(10);

    expect(stopwatch._getCurrentTime()).toBe(10);
    expect(stopwatch.getTimeInSecs()).toEqual(0);
    expect(errorLog).toHaveBeenCalledWith(
      'Start time was set incorrectly.');
  });

  it('should instantiate independent stopwatches', () => {
    let stopwatch1 = Stopwatch.create();
    let stopwatch2 = Stopwatch.create();

    changeCurrentTime(0);
    expect(stopwatch1._getCurrentTime()).toBe(0);
    expect(stopwatch2._getCurrentTime()).toBe(0);
    stopwatch1.reset();

    changeCurrentTime(50);
    expect(stopwatch1._getCurrentTime()).toBe(50);
    expect(stopwatch2._getCurrentTime()).toBe(50);
    stopwatch2.reset();

    changeCurrentTime(100);
    expect(stopwatch1._getCurrentTime()).toBe(100);
    expect(stopwatch2._getCurrentTime()).toBe(100);
    expect(stopwatch1.getTimeInSecs()).toEqual(0.1);
    expect(stopwatch2.getTimeInSecs()).toEqual(0.05);
  });
});
