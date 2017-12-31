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
  var parameterList = '#?parent=parent1&parent=parent2';
  var location = null;
  var sampleHash = 'sampleHash';
  var window = {
    href: 'http://sample.com/embed',
    pathname: 'sample.com/embed',
    hash: sampleHash
  };

  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    UrlService = $injector.get('UrlService');
    location = $injector.get('$location');
    spyOn(UrlService, 'getCurrentUrl').and.returnValue(window);
  }));

  it('should correctly get last url parameter', function() {
    window.href = 'http://sample.com' + parameterList;
    expect(UrlService.getUrlParams()).toEqual({parent: 'parent2'});
  });

  it('should correctly get parent id list when list has more than 1 elements',
    function() {
      var parentList = ['parent1', 'parent2'];
      spyOn(location, 'search').and.returnValue({parent: parentList});
      expect(UrlService.getParentExplorationIds()).toEqual(parentList);
    });

  it('should correctly get a single element array when a single string of ' +
     'parent id is present',
    function() {
      spyOn(location, 'search').and.returnValue({parent: 'parent1'});
      expect(UrlService.getParentExplorationIds()).toEqual(['parent1']);
    });

  it('should correctly return null when list has no elements',
    function() {
      spyOn(location, 'search').and.returnValue([]);
      expect(UrlService.getParentExplorationIds()).toBe(null);
    });

  it('should pop last parent id and return correct parameter string',
    function() {
      var parameterList = ['parent1', 'parent2'];
      var expectedString = '#?parent=parent1';
      expect(UrlService.updateParameterList(parameterList)).toBe(
        expectedString);
    });

  it('should correctly push a parent id to url stack', function() {
    spyOn(location, 'search');
    UrlService.pushParentIdToUrl('parent1');
    expect(location.search).toHaveBeenCalledWith({parent: 'parent1'});
  });

  it('should correctly return true if embed present in pathname', function() {
    expect(UrlService.isIframed()).toBe(true);
  });

  it('should correctly return false if embed not in pathname', function() {
    window.pathname = '/sample.com';
    expect(UrlService.isIframed()).toBe(false);
  });

  it('should correctly return hash value of window.location', function() {
    expect(UrlService.getHash()).toBe(sampleHash);
  });
});
