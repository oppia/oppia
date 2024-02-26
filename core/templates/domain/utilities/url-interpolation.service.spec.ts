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
 */
import { TestBed } from '@angular/core/testing';

import { AlertsService } from 'services/alerts.service';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { UrlService } from 'services/contextual/url.service';

import resourceHashes from 'utility/hashes';
const hashes = {
  '/hash_test.html': 'ijklmopq',
  '/path_test/hash_test.html': '123456789',
  '/hash_test.min.js': 'zyx12345',
  '/assets_test/hash_test.json': '987654321',
  '/pages_test/hash_test.html': 'abcd12345',
  '/images/hash_test.png': '98765fghij',
  '/videos/hash_test.mp4': '12345cxz',
  '/audio/hash_test.mp3': '12345abc',
  '/interactions/interTest/static/interTest.png': '123654789'
};
describe('URL Interpolation Service', () => {
  let uis: UrlInterpolationService;
  let urlService: UrlService;
  let mockLocation: Pick<Location, 'origin'>;
  let _alertsService: AlertsService;
  let alertsObject: Record<'alertsService', AlertsService>;
  beforeEach(() => {
    spyOnProperty(resourceHashes, 'hashes', 'get').and.returnValue(hashes);
    mockLocation = {
      origin: 'http://sample.com'
    };

    uis = TestBed.inject(UrlInterpolationService);
    urlService = TestBed.inject(UrlService);
    _alertsService = TestBed.inject(AlertsService);
    spyOnProperty(uis, 'DEV_MODE', 'get').and.returnValue(false);
    spyOn(urlService, 'getCurrentLocation').and.returnValue(
      mockLocation as Location);
    alertsObject = { alertsService: _alertsService };
  });

  it('should add hash to url if hash is set', () => {
    expect(uis._getUrlWithSlug('/hash_test.html')).toBe(
      '/hash_test.' + hashes['/hash_test.html'] + '.html'
    );
    expect(uis._getUrlWithSlug('/path_test/hash_test.html')).toBe(
      '/path_test/hash_test.' + hashes['/path_test/hash_test.html'] + '.html'
    );
    expect(uis._getUrlWithSlug('/hash_test.min.js')).toBe(
      '/hash_test.min.' + hashes['/hash_test.min.js'] + '.js'
    );
  });

  it('should build complete URL with prefixes and hash', () => {
    expect(uis._getCompleteUrl('/test_folder', '/hash_test.html')).toBe(
      '/build/test_folder/hash_test.' + hashes['/hash_test.html'] + '.html'
    );
    expect(
      uis._getCompleteUrl('/test_folder', '/path_test/hash_test.html')).toBe(
      '/build/test_folder/path_test/hash_test.' +
        hashes['/path_test/hash_test.html'] + '.html'
    );
    expect(uis._getCompleteUrl('/test_folder', '/hash_test.min.js')).toBe(
      '/build/test_folder/hash_test.min.' + hashes['/hash_test.min.js'] + '.js'
    );
    expect(uis._getCompleteUrl('', '/hash_test.html')).toBe(
      '/build/hash_test.' + hashes['/hash_test.html'] + '.html'
    );
  });

  it('should throw an error for erroneous URLs', () => {
    expect(uis.interpolateUrl.bind(uis, '', {}))
      .toThrowError('Invalid or empty URL template passed in: \'\'');
  });

  it('should throw an error for erroneous interpolation values', () => {
    expect(
      // This throws "Type 'string' is not assignable to type
      // 'InterpolationValuesType'." We need to suppress this error
      // because of the need to test validations. This is done because
      // we need to test the validations of the interpolateUrl function.
      // @ts-ignore
      uis.interpolateUrl.bind(alertsObject, '/test_url/<param>', 'value')
    ).toThrowError(
      'Expected an object of interpolation values to be passed into ' +
      'interpolateUrl.');
    expect(
      // This throws "Type 'string[]' is not assignable to type
      // 'InterpolationValuesType'." We need to suppress this error
      // because of the need to test validations. This is done because
      // we need to test the validations of the interpolateUrl function.
      // @ts-ignore
      uis.interpolateUrl.bind(alertsObject, '/test_url/<param>', ['value'])
    ).toThrowError(
      'Expected an object of interpolation values to be passed into ' +
      'interpolateUrl.');
  });

  it('should interpolate URLs not requiring parameters', () => {
    expect(uis.interpolateUrl('/test_url/', {})).toBe('/test_url/');
    expect(uis.interpolateUrl('/test_url/', {
      param: 'value'
    })).toBe('/test_url/');
  });

  it('should interpolate URLs when parameters have parentheses', () => {
    expect(uis.interpolateUrl('/test_url/<param>', {
      param: 'value (1'
    })).toBe('/test_url/value%20(1');
    expect(uis.interpolateUrl('/test_url/<param>', {
      param: 'value 1)'
    })).toBe('/test_url/value%201)');
    expect(uis.interpolateUrl('/test_url/<param>', {
      param: 'value (1)'
    })).toBe('/test_url/value%20(1)');
  });

  it('should interpolate URLs requiring one or more parameters', () => {
    expect(uis.interpolateUrl('/test_url/<fparam>', {
      fparam: 'value'
    })).toBe('/test_url/value');
    expect(uis.interpolateUrl(
      '/test_url/<first_param>/<second_param>/<third_param>', {
        first_param: 'value1',
        second_param: 'value2',
        third_param: 'value3'
      })).toBe('/test_url/value1/value2/value3');
  });

  it('should interpolate parameters within words or adjacent to other ' +
      'parameters', () => {
    // It also doesn't need to have '/' prefixing the URL.
    expect(uis.interpolateUrl('word<with_param>', {
      with_param: '_with_value'
    })).toBe('word_with_value');
    expect(uis.interpolateUrl('Eating_<param1><param2>_with_syrup', {
      param1: 'pan',
      param2: 'cakes'
    })).toBe('Eating_pancakes_with_syrup');
  });

  it('should interpolate parameters beginning, ending, or composing ' +
      'the URL', () => {
    expect(uis.interpolateUrl('<prefix>_with_words', {
      prefix: 'Signs'
    })).toBe('Signs_with_words');
    expect(uis.interpolateUrl('Neither_here_nor_<suffix>', {
      suffix: 'anywhere'
    })).toBe('Neither_here_nor_anywhere');
    expect(uis.interpolateUrl('<param>', {
      param: 'value'
    })).toBe('value');
  });

  it('should sanitize parameters but not URLs', () => {
    expect(uis.interpolateUrl('URL with a space', {})).toBe(
      'URL with a space');
    expect(uis.interpolateUrl(
      '/test_url/<first_param>?<query_name>=<query_value>', {
        first_param: 'SEARCH',
        query_name: 'title or website',
        query_value: 'oppia'
      })).toBe('/test_url/SEARCH?title%20or%20website=oppia');
  });

  it('should escape the "=" symbol correctly', () => {
    expect(uis.interpolateUrl(
      '/test_url/<first_param>', {
        first_param: 'first=param',
      })).toBe('/test_url/first%3Dparam');
  });

  it('should not interpolate bad parameter names and values', () => {
    // Empty angle brackets indicate a malformed URL.
    expect(uis.interpolateUrl.bind(uis, '/test_url/<>', {})).toThrowError(
      'Invalid URL template received: \'/test_url/<>\'');
    expect(uis.interpolateUrl.bind(uis, '/test_url/<>', {
      '': 'value'
    })).toThrowError('Invalid URL template received: \'/test_url/<>\'');

    // Non alpha-numeric will not match the pattern matching for finding a
    // parameter name.
    expect(uis.interpolateUrl(
      '/test_url/<b@d!#$%^&*() p@r@m n@m3`~[]{}>', {}
    )).toBe('/test_url/<b@d!#$%^&*() p@r@m n@m3`~[]{}>');

    // Parameter names cannot have spaces.
    expect(uis.interpolateUrl('/test_url/<parameter with spaces>', {
      'parameter with spaces': 'value'
    })).toBe('/test_url/<parameter with spaces>');

    expect(uis.interpolateUrl.bind(uis, '/test_url/<<name>>', {
      name: 'value'
    })).toThrowError(
      'Invalid URL template received: \'/test_url/<<name>>\'');

    expect(uis.interpolateUrl('/test_url/<name>', {
      name: '<value>'
    })).toEqual('/test_url/%3Cvalue%3E');

    expect(uis.interpolateUrl('/test_url/<name>', {
      name: '<<value>>'
    })).toEqual('/test_url/%3C%3Cvalue%3E%3E');

    expect(uis.interpolateUrl('/test_url/<name>', {
      name: '<>'
    })).toEqual('/test_url/%3C%3E');

    expect(uis.interpolateUrl('/test_url/?<query_name>=<query_value>', {
      query_name: 'website',
      query_value: 'https://www.oppia.org/'
    })).toEqual('/test_url/?website=https%3A%2F%2Fwww.oppia.org%2F');

    expect(uis.interpolateUrl('/test_url/<name>', {
      name: 'value\nmultiple lines'
    })).toEqual('/test_url/value%0Amultiple%20lines');
  });

  it('should throw an error for missing parameters', () => {
    expect(uis.interpolateUrl.bind(uis, '/test_url/<page>', {})).toThrowError(
      'Expected variable \'page\' when interpolating URL.');
    expect(uis.interpolateUrl.bind(uis, '/test_url/<page1>', {
      page2: 'v'
    })).toThrowError(
      'Expected variable \'page1\' when interpolating URL.');
  });

  it('should throw an error for non-string parameters', () => {
    // This throws "Type 'number' is not assignable to type 'string'
    // ." We need to suppress this error because of the need to test
    // validations on invalid parameters. The test is still valid because
    // the error is thrown by the function.
    // @ts-ignore
    expect(uis.interpolateUrl.bind(uis, '/test_url/<page>', {
      page: 0
    })).toThrowError(
      'Every parameter passed into interpolateUrl must have string values, ' +
      'but received: {page: 0}');
    // This throws "Type '{}' is not assignable to type 'string'
    // ." We need to suppress this error because of the need to test
    // validations on invalid parameters. The test is still valid because
    // the error is thrown by the function.
    // @ts-ignore
    expect(uis.interpolateUrl.bind(uis, '/test_url/<page>', {
      page: {}
    })).toThrowError(
      'Every parameter passed into interpolateUrl must have string values, ' +
      'but received: {page: {}}');
    // This throws "Type '[]' is not assignable to type 'string'
    // ." We need to suppress this error because of the need to test
    // validations on invalid parameters. The test is still valid because
    // the error is thrown by the function.
    // @ts-ignore
    expect(uis.interpolateUrl.bind(uis, '/test_url/<page>', {
      page: []
    })).toThrowError(
      'Every parameter passed into interpolateUrl must have string values, ' +
      'but received: {page: []}');
    // This throws "Type 'RegExp' is not assignable to type 'string'
    // ." We need to suppress this error because of the need to test
    // validations on invalid parameters. The test is still valid because
    // the error is thrown by the function. We need to suppress this error
    // because of the need to test validations on invalid parameters. The
    // test is still valid because the error is thrown by the function.
    // @ts-ignore
    expect(uis.interpolateUrl.bind(uis, '/test_url/<page>', {
      page: /abc/
    })).toThrowError(
      'Every parameter passed into interpolateUrl must have string values, ' +
      'but received: {page: {}}');
  });

  it('should interpolate correct path', () => {
    expect(uis.getStaticImageUrl('/test.png')).toBe(
      '/build/assets/images/test.png');
    expect(uis.getStaticImageUrl('/test_url/test.png')).toBe(
      '/build/assets/images/test_url/test.png');
    expect(uis.getStaticImageUrl('/hash_test.png')).toBe(
      '/build/assets/images/hash_test.' + hashes['/images/hash_test.png'] +
        '.png');

    expect(uis.getStaticAudioUrl('/test.mp3')).toBe(
      '/build/assets/audio/test.mp3');
    expect(uis.getStaticAudioUrl('/test_url/test.mp3')).toBe(
      '/build/assets/audio/test_url/test.mp3');
    expect(uis.getStaticAudioUrl('/hash_test.mp3')).toBe(
      '/build/assets/audio/hash_test.' + hashes['/audio/hash_test.mp3'] +
        '.mp3');

    expect(uis.getStaticVideoUrl('/test.mp4')).toBe(
      '/build/assets/videos/test.mp4');
    expect(uis.getStaticVideoUrl('/test_url/test.mp4')).toBe(
      '/build/assets/videos/test_url/test.mp4');
    expect(uis.getStaticVideoUrl('/hash_test.mp4')).toBe(
      '/build/assets/videos/hash_test.' + hashes['/videos/hash_test.mp4'] +
        '.mp4');

    expect(uis.getInteractionThumbnailImageUrl('interTest')).toBe(
      '/build/extensions/interactions/interTest/static/interTest.' +
        hashes['/interactions/interTest/static/interTest.png'] + '.png');

    expect(uis.getStaticAssetUrl('/test.json')).toBe(
      '/build/assets/test.json');
    expect(uis.getStaticAssetUrl('/test_url/test.json')).toBe(
      '/build/assets/test_url/test.json');
    expect(uis.getStaticAssetUrl('/assets_test/hash_test.json')).toBe(
      '/build/assets/assets_test/hash_test.' +
        hashes['/assets_test/hash_test.json'] + '.json');

    expect(uis.getFullStaticAssetUrl(
      '/assets/msapplication-large.png')).toBe(
      'http://sample.com/build/assets/msapplication-large.png');
    expect(uis.getFullStaticAssetUrl(
      '/assets/images/msapplication-large.png')).toBe(
      'http://sample.com/build/assets/images/msapplication-large.png');
    expect(uis.getFullStaticAssetUrl(
      '/assets/images/path/msapplication-large.png')).toBe(
      'http://sample.com/build/assets/images/path/msapplication-large.png');

    expect(uis.getExtensionResourceUrl('/test.html')).toBe(
      '/build/extensions/test.html');
    expect(uis.getExtensionResourceUrl('/test_url/test.html')).toBe(
      '/build/extensions/test_url/test.html');
    expect(uis.getExtensionResourceUrl('/path_test/hash_test.html')).toBe(
      '/build/extensions/path_test/hash_test.' +
        hashes['/path_test/hash_test.html'] + '.html');
  });

  it('should throw an error for empty path', () => {
    expect(uis.getStaticImageUrl.bind(uis, '')).toThrowError(
      'Empty path passed in method.');

    expect(uis.getStaticAudioUrl.bind(uis, '')).toThrowError(
      'Empty path passed in method.');

    expect(uis.getStaticVideoUrl.bind(uis, '')).toThrowError(
      'Empty path passed in method.');

    expect(uis.getInteractionThumbnailImageUrl.bind(uis, '')).toThrowError(
      'Empty interactionId passed in getInteractionThumbnailImageUrl.');

    expect(uis.getStaticAssetUrl.bind(uis, ''))
      .toThrowError('Empty path passed in method.');

    expect(uis.getExtensionResourceUrl.bind(uis, ''))
      .toThrowError('Empty path passed in method.');
  });

  it('should throw an error for path not beginning with forward slash',
    () => {
      expect(uis.getStaticImageUrl.bind(uis, 'test_fail.png')).toThrowError(
        'Path must start with \'\/\': \'' + 'test_fail.png' + '\'.');
      expect(uis.getStaticImageUrl.bind(uis, 'test_url/fail.png')).toThrowError(
        'Path must start with \'\/\': \'' + 'test_url/fail.png' + '\'.');

      expect(uis.getStaticAudioUrl.bind(uis, 'test_fail.mp3')).toThrowError(
        'Path must start with \'\/\': \'' + 'test_fail.mp3' + '\'.');
      expect(uis.getStaticAudioUrl.bind(uis, 'test_url/fail.mp3'))
        .toThrowError(
          'Path must start with \'\/\': \'' + 'test_url/fail.mp3' + '\'.');

      expect(uis.getStaticVideoUrl.bind(uis, 'test_fail.png'))
        .toThrowError(
          'Path must start with \'\/\': \'' + 'test_fail.png' + '\'.');
      expect(uis.getStaticVideoUrl.bind(uis, 'test_url/fail.png'))
        .toThrowError(
          'Path must start with \'\/\': \'' + 'test_url/fail.png' + '\'.');

      expect(uis.getStaticAssetUrl.bind(uis, 'test_fail.html'))
        .toThrowError(
          'Path must start with \'\/\': \'' + 'test_fail.html' + '\'.');
      expect(uis.getStaticAssetUrl.bind(uis, 'test_url/fail.html'))
        .toThrowError(
          'Path must start with \'\/\': \'' + 'test_url/fail.html' + '\'.');

      expect(uis.getExtensionResourceUrl.bind(uis, 'test_fail.html'))
        .toThrowError(
          'Path must start with \'\/\': \'' + 'test_fail.html' + '\'.');
      expect(
        uis.getExtensionResourceUrl.bind(uis, 'test_url/fail.html'))
        .toThrowError(
          'Path must start with \'\/\': \'' + 'test_url/fail.html' + '\'.');
    });
});
