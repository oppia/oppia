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
 * @fileoverview Unit tests for Sanitization filter for Oppia.
 */

import { async, TestBed } from '@angular/core/testing';
import { SafePipe } from 'filters/safe-pipe';
import { DomSanitizer } from '@angular/platform-browser';
import { SecurityContext } from '@angular/core';

describe('Safe pipe', () => {
  let pipe: SafePipe;
  let sanitizer: DomSanitizer;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [SafePipe]
    }).compileComponents();
    pipe = TestBed.get(SafePipe);
    sanitizer = TestBed.get(DomSanitizer);
  }));

  it('should return a safe html object', () => {
    spyOn(sanitizer, 'bypassSecurityTrustHtml').and.callThrough();
    let data = '<script>suspicious code</script>';
    let req = pipe.transform(data, 'html');
    let sanitizedbypassedvalue = sanitizer.sanitize(SecurityContext.HTML, req);
    expect(sanitizedbypassedvalue).toBe(data);
    expect(sanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith(data);
  });

  it('should return a safe style object', () => {
    spyOn(sanitizer, 'bypassSecurityTrustStyle').and.callThrough();
    let data = '<script>suspicious code</script>';
    let req = pipe.transform(data, 'style');
    let sanitizedbypassedvalue = sanitizer.sanitize(SecurityContext.STYLE, req);
    expect(sanitizedbypassedvalue).toBe(data);
    expect(sanitizer.bypassSecurityTrustStyle).toHaveBeenCalledWith(data);
  });

  it('should return a safe url object', () => {
    spyOn(sanitizer, 'bypassSecurityTrustUrl').and.callThrough();
    let data = 'javascript:alert(Suspicious)';
    let req = pipe.transform(data, 'url');
    let sanitizedbypassedvalue = sanitizer.sanitize(SecurityContext.URL, req);
    expect(sanitizedbypassedvalue).toBe(data);
  });

  it('should return a safe script object', () => {
    spyOn(sanitizer, 'bypassSecurityTrustScript').and.callThrough();
    let data = '<script src="suspicious code"></script>';
    let req = pipe.transform(data, 'script');
    let sanitizedbypassedvalue = sanitizer.sanitize(
      SecurityContext.SCRIPT, req);
    expect(sanitizedbypassedvalue).toBe(data);
    expect(sanitizer.bypassSecurityTrustScript).toHaveBeenCalledWith(data);
  });

  it('should return a safe resourceUrl object', () => {
    spyOn(sanitizer, 'bypassSecurityTrustResourceUrl').and.callThrough();
    let data = 'malicious.htm';
    let req = pipe.transform(data, 'resourceUrl');
    let sanitizedbypassedvalue = sanitizer.sanitize(
      SecurityContext.RESOURCE_URL, req);
    expect(sanitizedbypassedvalue).toBe(data);
    expect(sanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith(data);
  });

  it('should give an error with incorrect type', () => {
    try {
      pipe.transform('ErrorTest', 'wrongtype');
    } catch (error) {
      expect(error.name).toBe('Error');
      expect(error.message).toBe('Invalid safe type specified: wrongtype');
    }
  });
});
