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
  var queryString = '?parent=parent1&parent=parent2';
  var sampleHash = 'sampleHash';
  var pathname = 'sample.com/embed';
  var window = {
    href: 'http://' + pathname + queryString,
    pathname: pathname,
    hash: sampleHash
  };

  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    UrlService = $injector.get('UrlService');
    spyOn(UrlService, 'queryUrlParams').and.returnValue(window);
  }));

  it('should correctly get query values as a single object', function() {
    window.href = 'http://' + pathname + '?field1=value1&field2=value2';
    var expectedObject = {
      field1: 'value1',
      field2: 'value2'
    };
    expect(UrlService.getUrlParams()).toEqual(expectedObject);
  });

  it('should add query fields and return correct object after decoding it',
    function() {
      window.href = 'http://' + pathname;
      window.href = UrlService.addField(window.href, 'field1', 'value1');
      expect(UrlService.getUrlParams()).toEqual({
        field1: 'value1'
      });
      window.href = UrlService.addField(window.href, 'field2', 'value2');
      expect(UrlService.getUrlParams()).toEqual({
        field1: 'value1',
        field2: 'value2'
      });
      window.href = UrlService.addField(window.href, 'field1', 'value3');
      window.href = UrlService.addField(window.href, 'field1', 'value4');
      window.href = UrlService.addField(window.href, 'field2', 'value5');
      window.href = UrlService.addField(window.href, 'field1', 'value6');
      window.href = UrlService.addField(window.href, 'field1', 'value6');
      var expectedList = ['value1', 'value3', 'value4', 'value6', 'value6'];
      expect(
        UrlService.getQueryFieldValuesAsList('field1')).toEqual(expectedList);
      expectedList = ['value2', 'value5'];
      expect(
        UrlService.getQueryFieldValuesAsList('field2')).toEqual(expectedList);
    });

  it('should correctly get parameter list based on key value', function() {
    var expectedList = ['parent1', 'parent2'];
    window.href = 'http://' + pathname + queryString;
    expect(
      UrlService.getQueryFieldValuesAsList('parent')).toEqual(expectedList);
    window.href = 'http://' + pathname;
    expect(UrlService.getQueryFieldValuesAsList('parent')).toEqual([]);
  });

  it('should correctly add parameter values to url', function() {
    expect(UrlService.addField('/sample', 'parent', 'parent1')).toBe(
      '/sample?parent=parent1'
    );
    expect(UrlService.addField(
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
