// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the BackgroundMaskService.
 */

describe('Url Service', function() {
  var UrlService = null;
  var parameterList = '?parent=parent1&parent=parent2';
  var location = {
    href: 'http://sample.com' + parameterList,
    search: parameterList
  };

  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    UrlService = $injector.get('UrlService');
    spyOn(UrlService, 'getCurrentUrl').and.returnValue(location);
  }));

  it('should get correct parameters', function() {
    expect(UrlService.getParameters()).toBe(parameterList);
  });

  it('should correctly get last parent id if parent id present', function() {
    expect(UrlService.getParentExplorationId()).toBe('parent2');
  });

  it('should return null if parent id not present', function() {
    location.href = 'http://sample.com';
    expect(UrlService.getParentExplorationId()).toBe(null);
  });

  it('should correctly get last url parameter', function() {
    var lastParameter = {
      parent: 'parent2'
    };
    location.href = 'http://sample.com' + parameterList;
    expect(UrlService.getUrlParams()).toEqual(lastParameter);
  });
});
