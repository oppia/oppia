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


describe('List directive', function() {
  var elm, scope;

  LIST_COMPONENT_HTML_PATH = 'extensions/objects/templates/list_editor.html';

  beforeEach(module('oppia', LIST_COMPONENT_HTML_PATH));

  beforeEach(inject(function($templateCache) {
    template = $templateCache.get(LIST_COMPONENT_HTML_PATH);
    $templateCache.put('/object_editor_template/List', template);
  }));

  // TODO(sll): Add E2E tests.

  it('should have a new item by default', inject(function($rootScope, $compile) {
    scope = $rootScope;
    scope.val = [];

    elm = $compile('<list-editor value="val"></list-editor>')($rootScope);
    scope.$apply();

    var listControllerScope = elm.scope();
    expect(listControllerScope.items).toEqual(['']);
  }));

  it('should add a new item when asked', inject(function($rootScope, $compile) {
    scope = $rootScope;
    scope.val = ['abc', 'def'];

    elm = $compile('<list-editor value="val"></list-editor>')($rootScope);
    scope.$apply();

    var listControllerScope = elm.scope();
    listControllerScope.addItem();
    expect(listControllerScope.items).toEqual(['abc', 'def', '']);
  }));

  it('should replace a list item', inject(function($rootScope, $compile) {
    scope = $rootScope;
    scope.val = ['first item'];

    elm = $compile('<list-editor value="val"></list-editor>')($rootScope);
    scope.$apply();

    var listControllerScope = elm.scope();
    expect(listControllerScope.items).toEqual(['first item']);
    listControllerScope.replaceItem(0, 'replacement item');
    expect(listControllerScope.items).toEqual(['replacement item']);
  }));
});

