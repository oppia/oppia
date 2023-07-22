// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview test for insert script service
 */
import { Renderer2 } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { InsertScriptService, KNOWN_SCRIPTS } from 'services/insert-script.service';

class MockRenderer {
  appendChild() {
    return;
  }
}

describe('InsertScriptService', () => {
  let insertScriptService: InsertScriptService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{
        provide: Renderer2,
        useValue: MockRenderer,
      }]});
    insertScriptService = TestBed.get(InsertScriptService);
  });

  it('should insert script into html', () => {
    // First time load script.
    expect(insertScriptService.loadScript(KNOWN_SCRIPTS.DONORBOX)).toBe(true);
    // Load script again.
    expect(insertScriptService.loadScript(KNOWN_SCRIPTS.DONORBOX)).toBe(false);
    expect(insertScriptService.loadScript(KNOWN_SCRIPTS.UNKNOWN)).toBe(false);
  });
});
