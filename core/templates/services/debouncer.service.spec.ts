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
import { TestBed } from '@angular/core/testing';
import { DebouncerService } from 'services/debouncer.service';
import { LoggerService } from 'services/contextual/logger.service';

describe('Debouncer service', () => {
  let ds: DebouncerService;
  let ls: LoggerService;
  let loggerServiceSpy: jasmine.Spy<(msg: string) => void>;

  beforeEach(() => {
    ds = TestBed.get(DebouncerService);
    ls = TestBed.get(LoggerService);

    loggerServiceSpy = spyOn(ls, 'log').and.callThrough();
  });

  it('should call a debounced function after a non-zero given wait time',
    () => {
      // Ref: https://github.com/gruntjs/grunt-contrib-jasmine/issues/213.
      jasmine.clock().uninstall();
      jasmine.clock().install();
      const fnToBeCalled = () => ls.log('function was called');
      ds.debounce(fnToBeCalled, 5)();
      // Ticks for 10 seconds so all the setTimeout calls will be executed.
      jasmine.clock().tick(10000);
      jasmine.clock().uninstall();
      expect(loggerServiceSpy).toHaveBeenCalled();
    });

  it('should instantly call a debounced function with wait time as zero',
    () => {
      jasmine.clock().uninstall();
      jasmine.clock().install();
      const fnToBeCalled = () => ls.log('function was called');
      ds.debounce(fnToBeCalled, 0)();
      jasmine.clock().tick(0);
      jasmine.clock().uninstall();
      expect(loggerServiceSpy).toHaveBeenCalled();
    });
});
