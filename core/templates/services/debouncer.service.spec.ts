// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for DebouncerService.
 */
import { TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { DebouncerService } from 'services/debouncer.service';
import { LoggerService } from 'services/contextual/logger.service';

describe('Debouncer service', () => {
  let ds;
  let ls;
  var loggerServiceSpy;

  beforeEach(() => {
    ds = TestBed.get(DebouncerService);
    ls = TestBed.get(LoggerService);

    loggerServiceSpy = spyOn(ls, 'log').and.callThrough();
  });

  it('should call function after 5 seconds', fakeAsync(() => {
    const fnToBeCalled = () => ls.log('function was called');
    ds.debounce(fnToBeCalled, 5)();
    // Flush 500 times. The number 500 was choosen because after 500
    // times all the possible setTimeout calls will be already executated.
    flush(500);

    expect(loggerServiceSpy).toHaveBeenCalled();
  }));

  it('should call function instantly', fakeAsync(() => {
    const fnToBeCalled = () => ls.log('function was called');
    ds.debounce(fnToBeCalled, 0)();
    flush(1);

    expect(loggerServiceSpy).toHaveBeenCalled();
  }));
});
