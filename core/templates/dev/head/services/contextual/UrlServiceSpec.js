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
  var sampleHash = 'sampleHash';
  var window = {
    href: 'http://sample.com/embed' + parameterList,
    pathname: 'sample.com/embed',
    hash: sampleHash
  };

  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    UrlService = $injector.get('UrlService');
    spyOn(UrlService, 'getCurrentUrl').and.returnValue(window);
  }));

  it('should correctly get last url parameter', function() {
    window.href = 'http://sample.com' + parameterList;
    expect(UrlService.getUrlParams()).toEqual({parent: 'parent2'});
  });

  it('should correctly parameter list based on key value', function() {
    var expectedList = ['parent1', 'parent2'];
    expect(UrlService.getParamValuesAsList('parent')).toEqual(expectedList);
    window.href = 'http://sample.com/embed';
    expect(UrlService.getParamValuesAsList('parent')).toBe(null);
  });

  it('should correctly add parameter values to url', function() {
    expect(UrlService.addParams('/sample', 'parent', 'parent1')).toBe(
      '/sample?parent=parent1'
    );
    expect(UrlService.addParams(
      '/sample?parent=parent1', 'parent', 'parent2')).toBe(
      '/sample?parent=parent1&parent=parent2'
    );
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
