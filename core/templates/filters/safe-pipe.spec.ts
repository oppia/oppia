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

fdescribe('Safe pipe', () => {
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
    spyOn(sanitizer, 'bypassSecurityTrustHtml');
    pipe.transform('HTMLTest', 'html');
    expect(sanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith('HTMLTest');
  });

  it('should return a safe style object', () => {
    spyOn(sanitizer, 'bypassSecurityTrustStyle');
    pipe.transform('StyleTest', 'style');
    expect(sanitizer.bypassSecurityTrustStyle).toHaveBeenCalledWith(
      'StyleTest');
  });

  it('should return a safe url object', () => {
    spyOn(sanitizer, 'bypassSecurityTrustUrl');
    pipe.transform('UrlTest', 'url');
    expect(sanitizer.bypassSecurityTrustUrl).toHaveBeenCalledWith('UrlTest');
  });

  it('should return a safe script object', () => {
    spyOn(sanitizer, 'bypassSecurityTrustScript');
    pipe.transform('ScriptTest', 'script');
    expect(sanitizer.bypassSecurityTrustScript).toHaveBeenCalledWith(
      'ScriptTest');
  });

  it('should return a safe resourceUrl object', () => {
    spyOn(sanitizer, 'bypassSecurityTrustResourceUrl');
    pipe.transform('ResourceUrl', 'resourceUrl');
    expect(sanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith(
      'ResourceUrl');
  });
});
