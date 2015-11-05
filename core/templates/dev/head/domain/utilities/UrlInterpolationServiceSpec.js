// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for UrlInterpolationService.
 *
 * @author henning.benmax@gmail.com (Ben Henning)
 */

describe('URL Interpolation Service', function() {
  var uis = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    uis = $injector.get('UrlInterpolationService');
  }));

  it('should return the same URL for erroneous URLs', function() {
    expect(uis.interpolateUrl()).toBe(undefined);
    expect(uis.interpolateUrl(null, {})).toBe(null);
    expect(uis.interpolateUrl(undefined, {})).toBe(undefined);
    expect(uis.interpolateUrl('', {})).toBe('');
    expect(uis.interpolateUrl('')).toBe('');
  });

  it('should return null for erroneous interpolation values', function() {
    expect(uis.interpolateUrl('url', null)).toBe(null);
    expect(uis.interpolateUrl('url', undefined)).toBe(null);
    expect(uis.interpolateUrl('/test_url/<param>', 'value')).toBe(null);
    expect(uis.interpolateUrl('/test_url/<param>', ['value'])).toBe(null);
  });

  it('should interpolate URLs not requiring parameters', function() {
    expect(uis.interpolateUrl('/test_url/', {})).toBe('/test_url/');
    expect(uis.interpolateUrl('/test_url/', {'param': 'value'})).toBe(
      '/test_url/');
  });

  it('should interpolate URLs requiring one or more parameters', function() {
    expect(uis.interpolateUrl('/test_url/<fparam>', {'fparam': 'value'})).toBe(
      '/test_url/value');
    expect(uis.interpolateUrl(
      '/test_url/<first_param>/<second_param>/<third_param>', {
        'first_param': 'value1',
        'second_param': 'value2',
        'third_param': 'value3'
      })).toBe('/test_url/value1/value2/value3');
  });

  it('should interpolate parameters within words or adjacent to other parameters', function() {
    // It also doesn't need to have '/' prefixing the URL.
    expect(uis.interpolateUrl(
      'word<with_param>', {'with_param': '_with_value'}))
    .toBe('word_with_value');
    expect(uis.interpolateUrl('Eating_<param1><param2>_with_syrup', {
      'param1': 'pan', 'param2': 'cakes'
    })).toBe('Eating_pancakes_with_syrup');
  });

  it('should interpolate parameters beginning, ending, or composing the URL', function() {
    expect(uis.interpolateUrl('<prefix>_with_words', {'prefix': 'Signs'})).toBe(
      'Signs_with_words');
    expect(uis.interpolateUrl('Neither_here_nor_<suffix>', {
      'suffix': 'anywhere'
    })).toBe('Neither_here_nor_anywhere');
    expect(uis.interpolateUrl('<param>', {'param': 'value'})).toBe('value');
  });

  it('should sanitize parameters but not URLs', function() {
    expect(uis.interpolateUrl('URL with a space', {})).toBe(
      'URL with a space');
    expect(uis.interpolateUrl(
      '/test_url/<first_param>?<query_name>=<query_value>', {
        'first_param': 'SEARCH',
        'query_name': 'title or website',
        'query_value': 'http://oppia.org/'
      })).toBe('/test_url/SEARCH?title%20or%20website=http%3A//oppia.org/');
  });

  it('should not interpolate bad parameter names', function() {
    // An empty parameter name should be treated as a non-parameter (the angle
    // brackets should be kept and sanitized).
    expect(uis.interpolateUrl('/test_url/<>', {})).toBe('/test_url/<>');
    expect(uis.interpolateUrl('/test_url/<>', {'': 'value'})).toBe(
      '/test_url/<>');

    // Non alpha-numeric will not match the pattern matching for finding a
    // parameter name.
    expect('/test_url/<b@d!#$%^&*() p@r@m n@m3`~[]{}>', {}).toBe(
      '/test_url/<b@d!#$%^&*() p@r@m n@m3`~[]{}>');

    // Parameter names cannot have spaces.
    expect(uis.interpolateUrl('/test_url/<parameter with spaces>', {
      'parameter with spaces': 'value'
    })).toBe('/test_url/<parameter with spaces>');
  });

  it('should return null for missing parameters', function() {
    expect(uis.interpolateUrl('/test_url/<page>', {})).toBe(null);
    expect(uis.interpolateUrl('/test_url/<page1>', {'page2': 'v'})).toBe(null);
  });
});
