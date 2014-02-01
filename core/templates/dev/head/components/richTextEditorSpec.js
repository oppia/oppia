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
 * @fileoverview Tests for the RTE component.
 *
 * @author sll@google.com (Sean Lip)
 */

describe('RTE directive', function() {
  var elm, scope, $httpBackend;

  beforeEach(module('oppia'));
  beforeEach(inject(function($rootScope, $compile, _$httpBackend_) {
    $httpBackend = _$httpBackend_;
    $httpBackend.expectGET('/widgetrepository/data/noninteractive').respond({
      data: {
        widgets: {
          'Basic Input': [{
            frontend_name: 'image',
            name: 'Image',
            tooltip: 'Insert image',
            icon_data_url: 'data:123'
          }]
        }
      }
    });

    elm = $compile('<rich-text-editor></rich-text-editor>')($rootScope);
    scope = $rootScope;
    scope.$digest();
  }));

  it('should convert correctly between HTML and RTE', inject(function($rootScope, $compile) {
    var testData = [
      ['<div></div>', '<div></div>'],
      ['<div>abc</div>', '<div>abc</div>'],
      ['<div>abc</div><br>', '<div>abc</div><br>'],
      ['<div>abc<span>def</span></div><b>ghi</b>', '<div>abc<span>def</span></div><b>ghi</b>'],
      ['<oppia-noninteractive-image></oppia-noninteractive-image>',
       '<img class="oppia-noninteractive-image" src="data:123">'],
      ['<oppia-noninteractive-image image_id-with-value="&amp;quot;T&amp;quot;"></oppia-noninteractive-image>',
       '<img image_id-with-value="&amp;quot;T&amp;quot;" class="oppia-noninteractive-image" src="data:123">']
    ];

    var rteControllerScope = elm.scope();

    // TODO(sll): Why isn't this being auto-populated?
    rteControllerScope._NONINTERACTIVE_WIDGETS = [{
        name: 'image',
        backendName: 'Image',
        tooltip: 'Insert image',
        iconDataUrl: 'data:123'
    }];

    for (var i = 0; i < testData.length; i++) {
      expect(rteControllerScope._convertHtmlToRte(testData[i][0]))
          .toEqual(testData[i][1]);
      expect(rteControllerScope._convertRteToHtml(testData[i][1]))
          .toEqual(testData[i][0]);
    }
  }));
});
