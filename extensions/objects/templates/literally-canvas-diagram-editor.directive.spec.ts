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
 * @fileoverview Unit tests for the literally canvas diagram editor.
 */

describe('LiterallyCanvasDiagramEditor', function() {
  var $componentController, LCDiagramEditorCtrl, $timeout;
  var mockLiterallyCanvas = {
    setImageSize: function(width, height) {
      var text = 'The updated diagram width is ' + width +
      ' and height is ' + height;
      return text;
    }
  };


  beforeEach(angular.mock.module('oppia'));

  beforeEach(angular.mock.inject(function($injector) {
    $timeout = $injector.get('$timeout');
  }));

  beforeEach(angular.mock.inject(function(_$componentController_) {
    $componentController = _$componentController_;
    LCDiagramEditorCtrl = $componentController(
      'literallyCanvasDiagramEditor', null, {});
    LCDiagramEditorCtrl.$onInit();
    $timeout.flush();
    LCDiagramEditorCtrl.lc = mockLiterallyCanvas;
  }));

  it('should update diagram size', function() {
    var width = 100;
    var height = 100;
    LCDiagramEditorCtrl.diagramWidth = width;
    LCDiagramEditorCtrl.diagramHeight = height;
    LCDiagramEditorCtrl.onWidthInputBlur();
    expect(LCDiagramEditorCtrl.currentDiagramWidth).toBe(100);
    LCDiagramEditorCtrl.onHeightInputBlur();
    expect(LCDiagramEditorCtrl.currentDiagramHeight).toBe(100);
  });

  it('should return information on diagram size', function() {
    var maxDiagramWidth = 491;
    var maxDiagramHeight = 551;
    var helpText = 'This diagram has a maximum dimension of ' +
    maxDiagramWidth + 'px X ' + maxDiagramHeight +
    'px to ensure that it fits in the card.';
    expect(LCDiagramEditorCtrl.getDiagramSizeHelp()).toBe(helpText);
  });

  it('should validate data', function() {
    // Will be implimented once the data is saved.
    expect(LCDiagramEditorCtrl.validate()).toBe(false);
  });
});
