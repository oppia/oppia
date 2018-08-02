// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview unit tests for the Rich-text-editor Service.
 */

describe('RteHelperService', function() {
  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    RteHelperService = $injector.get('RteHelperService');
  }));

  it('should return text with no extra new lines or spaces', function() {
    var testData = [[
      '<p>abc</p>', '<p>abc</p>'
    ], [
      '<p>abc</p><p><br></p><p>abc</p>', '<p>abc</p><p><br></p><p>abc</p>'
    ], [
      '<p>abc</p><p><br></p><p>abc</p><p><br></p>',
      '<p>abc</p><p><br></p><p>abc</p>'
    ], [
      '<p>abc</p><p><br></p><p>abc</p><p><br></p><p><br></p>',
      '<p>abc</p><p><br></p><p>abc</p>'
    ], [
      '<p>abc</p><p><br><br></p>', '<p>abc</p>'
    ], [
      '<p>abc</p><p>abc<br></p>', '<p>abc</p><p>abc</p>'
    ], [
      '<p>abc</p><br><br>', '<p>abc</p>'
    ], [
      '<p>abc<br>abc<br></p>', '<p>abc<br>abc</p>'
    ], [
      '<p><p></p></p>', ''
    ], [
      '<p>abc<p></p></p>', '<p>abc</p>'
    ], [
      '<p>abc<p><br></p></p>', '<p>abc</p>'
    ], [
      '<p>abc<p><p><br></p></p></p>', '<p>abc</p>'
    ]];
    for (var i = 0; i < testData.length; i++) {
      expect(RteHelperService.convertRteToHtml(testData[i][0]))
        .toEqual(testData[i][1]);
    }
  });
});
