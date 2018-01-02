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
  var sampleHash = 'sampleHash';
  var pathname = 'sample.com/embed';
  var mockLocation = {
    href: 'http://' + pathname,
    pathname: pathname,
    hash: sampleHash
  };

  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    UrlService = $injector.get('UrlService');
    spyOn(UrlService, 'getCurrentLocation').and.returnValue(mockLocation);
  }));

  it('should return correct query value list for each query field', function() {
    expect(UrlService.getQueryFieldValuesAsList('field1')).toEqual([]);

    mockLocation.href = 'http://' + pathname + '?field1=value1&' +
      'field2=value2&field1=value3&field1=value4&field2=value5&' +
      'field1=value6&field1=' + encodeURIComponent('value?= &6');
    var expectedList1 = ['value1', 'value3', 'value4', 'value6', 'value?= &6'];
    var expectedList2 = ['value2', 'value5'];
    expect(
      UrlService.getQueryFieldValuesAsList('field1')).toEqual(expectedList1);
    expect(
      UrlService.getQueryFieldValuesAsList('field2')).toEqual(expectedList2);
  });

  it('should correctly decode special characters in query value in url',
    function() {
      var expectedObject = {
        field1: '?value=1',
        field2: '?value&1'
      };
      var queryValue1 = encodeURIComponent(expectedObject.field1);
      var queryValue2 = encodeURIComponent(expectedObject.field2);
      mockLocation.href = 'http://' + pathname + '?field1=' + queryValue1 +
        '&field2=' + queryValue2;
      expect(UrlService.getUrlParams()).toEqual(expectedObject);
    });

  it('should correctly encode and add query field and value to url',
    function() {
      var queryValue = '&value=1?';
      var queryField = 'field 1';
      var baseUrl = '/sample';
      expect(
        UrlService.addField(baseUrl, queryField, queryValue)).toBe(
          baseUrl + '?' + encodeURIComponent(queryField) + '=' +
          encodeURIComponent(queryValue)
      );

      baseUrl = '/sample?field=value';
      expect(
        UrlService.addField(baseUrl, queryField, queryValue)).toBe(
          baseUrl + '&' + encodeURIComponent(queryField) + '=' +
          encodeURIComponent(queryValue)
      );
    });

  it('should correctly return true if embed present in pathname', function() {
    expect(UrlService.isIframed()).toBe(true);
  });

  it('should correctly return false if embed not in pathname', function() {
    mockLocation.pathname = '/sample.com';
    expect(UrlService.isIframed()).toBe(false);
  });

  it('should correctly return hash value of window.location', function() {
    expect(UrlService.getHash()).toBe(sampleHash);
  });
});
