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
 * @fileoverview Unit tests for LoggerService.
 */
import { TestBed } from '@angular/core/testing';
import { LoggerService } from 'services/contextual/logger.service';

describe('Logger Service', () => {
  let ls: LoggerService;

  beforeEach(() => {
    ls = TestBed.get(LoggerService);
  });

  it('should display debug message on the console', () => {
    const debugSpy = spyOn(console, 'debug').and.stub();
    ls.debug('Debug message');

    expect(debugSpy).toHaveBeenCalled();
  });

  it('should display info message on the console', () => {
    const infoSpy = spyOn(console, 'info').and.stub();
    ls.info('Info message');

    expect(infoSpy).toHaveBeenCalled();
  });

  it('should display warn message on the console', () => {
    const warnSpy = spyOn(console, 'warn').and.stub();
    ls.warn('Warn message');

    expect(warnSpy).toHaveBeenCalled();
  });

  it('should display error message on the console', () => {
    const errorSpy = spyOn(console, 'error').and.stub();
    ls.error('Error message');

    expect(errorSpy).toHaveBeenCalled();
  });

  it('should display message on the console', () => {
    const logSpy = spyOn(console, 'log').and.stub();
    ls.log('Log message');

    expect(logSpy).toHaveBeenCalled();
  });
});
