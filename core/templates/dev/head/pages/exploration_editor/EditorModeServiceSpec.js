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
 * @fileoverview Unit tests for the EditorModeService.js
 */
describe('Editor Mode Service', function() {
  var editorModeService;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    editorModeService = $injector.get('EditorModeService');
  }));

  it('should default to full mode', function() {
    expect(editorModeService.isEditorInFullMode()).toEqual(true);
  });

  it('should change to simple mode', function() {
    editorModeService.setModeToSimple();
    expect(editorModeService.isEditorInSimpleMode()).toEqual(true);
  });

  it('should change to full mode', function() {
    editorModeService.setModeToFull();
    expect(editorModeService.isEditorInFullMode()).toEqual(true);
  });
});
