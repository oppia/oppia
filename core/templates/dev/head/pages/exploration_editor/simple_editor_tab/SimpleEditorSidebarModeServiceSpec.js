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
 * @fileoverview Unit tests for the SimpleEditorSidebarModeService.js
 */

describe('Simple Editor Sidebar Mode Service', function() {
  var simpleEditorSidebarModeService;

  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    simpleEditorSidebarModeService = $injector
      .get('SimpleEditorSidebarModeService');
  }));

  describe('isSidebarInReadonlyMode', function() {
    it('should return true when mode is set to readonly', function() {
      simpleEditorSidebarModeService.setModeToReadonly();
      expect(simpleEditorSidebarModeService.isSidebarInReadonlyMode())
        .toBe(true);
    });

    it('should return false when mode is set to edit', function() {
      simpleEditorSidebarModeService.setModeToEdit();
      expect(simpleEditorSidebarModeService.isSidebarInReadonlyMode())
        .toBe(false);
    });
  });

  describe('isSidebarInEditMode', function() {
    it('should return false when mode is set to readonly', function() {
      simpleEditorSidebarModeService.setModeToReadonly();
      expect(simpleEditorSidebarModeService.isSidebarInEditMode()).toBe(false);
    });

    it('should return true when mode is set to edit', function() {
      simpleEditorSidebarModeService.setModeToEdit();
      expect(simpleEditorSidebarModeService.isSidebarInEditMode()).toBe(true);
    });
  });

  describe('setModeToReadonly', function() {
    it('should set the mode to readonly', function() {
      simpleEditorSidebarModeService.setModeToReadonly();
      expect(simpleEditorSidebarModeService.isSidebarInReadonlyMode())
        .toBe(true);
    });
  });

  describe('setModeToEdit', function() {
    it('should set the mode to edit', function() {
      simpleEditorSidebarModeService.setModeToEdit();
      expect(simpleEditorSidebarModeService.isSidebarInEditMode()).toBe(true);
    });
  });
});
