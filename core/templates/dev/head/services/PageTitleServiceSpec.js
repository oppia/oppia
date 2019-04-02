// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for the page title service.
 */

describe('Page title service', function() {
  beforeEach(module('oppia'));
  var pts = null;
  var $document = null;

  beforeEach(inject(function($injector) {
    $document = $injector.get('$document');
    pts = $injector.get('PageTitleService');
  }));

  it('should correctly set the page title', function() {
    expect($document[0].title).toEqual('');
    pts.setPageTitle('Test title');
    expect($document[0].title).toEqual('Test title');
  });
});
