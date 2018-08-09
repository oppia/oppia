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

describe('URL Interpolation Service', function() {
  var uis = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    uis = $injector.get('UrlInterpolationService');
  }));

  it('should add hash to url if hash is set', function () {
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

  it('should build complete URL with prefixes and hash', function () {
    expect(uis._getCompleteUrl('/test_folder', '/hash_test.html')).toBe(
      GLOBALS.ASSET_DIR_PREFIX + '/test_folder/hash_test.' +
      hashes['/hash_test.html'] + '.html'
    );
    expect(
      uis._getCompleteUrl('/test_folder', '/path_test/hash_test.html')).toBe(
      GLOBALS.ASSET_DIR_PREFIX + '/test_folder/path_test/hash_test.' +
        hashes['/path_test/hash_test.html'] + '.html'
    );
    expect(uis._getCompleteUrl('/test_folder', '/hash_test.min.js')).toBe(
      GLOBALS.ASSET_DIR_PREFIX + '/test_folder/hash_test.min.' +
      hashes['/hash_test.min.js'] + '.js'
    );
    expect(uis._getCompleteUrl('', '/hash_test.html')).toBe(
      GLOBALS.ASSET_DIR_PREFIX + '/hash_test.' +
      hashes['/hash_test.html'] + '.html'
    );
  });

  it('should throw an error for erroneous URLs', function() {
    expect(uis.interpolateUrl).toThrow(
      new Error('Invalid or empty URL template passed in: \'undefined\''));
    expect(uis.interpolateUrl.bind(null, null, {})).toThrow(
      new Error('Invalid or empty URL template passed in: \'null\''));
    expect(uis.interpolateUrl.bind(null, undefined, {})).toThrow(
      new Error('Invalid or empty URL template passed in: \'undefined\''));
    expect(uis.interpolateUrl.bind(null, '', {})).toThrow(
      new Error('Invalid or empty URL template passed in: \'\''));
    expect(uis.interpolateUrl.bind(null, '')).toThrow(
      new Error('Invalid or empty URL template passed in: \'\''));
  });

  it('should throw an error for erroneous interpolation values', function() {
    expect(uis.interpolateUrl.bind(null, 'url', null)).toThrow(
      new Error('Expected an object of interpolation values to be passed ' +
        'into interpolateUrl.'));
    expect(uis.interpolateUrl.bind(null, 'url', undefined)).toThrow(
      new Error('Expected an object of interpolation values to be passed ' +
        'into interpolateUrl.'));
    expect(
      uis.interpolateUrl.bind(null, '/test_url/<param>', 'value')
    ).toThrow(new Error(
      'Expected an object of interpolation values to be passed into ' +
      'interpolateUrl.'));
    expect(
      uis.interpolateUrl.bind(null, '/test_url/<param>', ['value'])
    ).toThrow(new Error(
      'Expected an object of interpolation values to be passed into ' +
      'interpolateUrl.'));
  });

  it('should interpolate URLs not requiring parameters', function() {
    expect(uis.interpolateUrl('/test_url/', {})).toBe('/test_url/');
    expect(uis.interpolateUrl('/test_url/', {
      param: 'value'
    })).toBe('/test_url/');
  });

  it('should interpolate URLs when parameters have parentheses', function() {
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

  it('should interpolate URLs requiring one or more parameters', function() {
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
     'parameters', function() {
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
     'the URL', function() {
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

  it('should sanitize parameters but not URLs', function() {
    expect(uis.interpolateUrl('URL with a space', {})).toBe(
      'URL with a space');
    expect(uis.interpolateUrl(
      '/test_url/<first_param>?<query_name>=<query_value>', {
        first_param: 'SEARCH',
        query_name: 'title or website',
        query_value: 'oppia'
      })).toBe('/test_url/SEARCH?title%20or%20website=oppia');
  });

  it('should escape the "=" symbol correctly', function() {
    expect(uis.interpolateUrl(
      '/test_url/<first_param>', {
        first_param: 'first=param',
      })).toBe('/test_url/first%3Dparam');
  });

  it('should not interpolate bad parameter names and values', function() {
    // Empty angle brackets indicate a malformed URL.
    expect(uis.interpolateUrl.bind(null, '/test_url/<>', {})).toThrow(
      new Error('Invalid URL template received: \'/test_url/<>\''));
    expect(uis.interpolateUrl.bind(null, '/test_url/<>', {
      '': 'value'
    })).toThrow(new Error('Invalid URL template received: \'/test_url/<>\''));

    // Non alpha-numeric will not match the pattern matching for finding a
    // parameter name.
    expect('/test_url/<b@d!#$%^&*() p@r@m n@m3`~[]{}>', {}).toBe(
      '/test_url/<b@d!#$%^&*() p@r@m n@m3`~[]{}>');

    // Parameter names cannot have spaces.
    expect(uis.interpolateUrl('/test_url/<parameter with spaces>', {
      'parameter with spaces': 'value'
    })).toBe('/test_url/<parameter with spaces>');

    expect(uis.interpolateUrl.bind(null, '/test_url/<<name>>', {
      name: 'value'
    })).toThrow(new Error(
      'Invalid URL template received: \'/test_url/<<name>>\''));

    expect(uis.interpolateUrl.bind(null, '/test_url/<name>', {
      name: '<value>'
    })).toThrow(new Error(
      'Parameter values passed into interpolateUrl must only contain ' +
      'alphanumerical characters, hyphens, underscores, parentheses or ' +
      'spaces: \'<value>\''));

    expect(uis.interpolateUrl.bind(null, '/test_url/<name>', {
      name: '<<value>>'
    })).toThrow(new Error(
      'Parameter values passed into interpolateUrl must only contain ' +
      'alphanumerical characters, hyphens, underscores, parentheses or ' +
      'spaces: \'<<value>>\''));

    expect(uis.interpolateUrl.bind(null, '/test_url/<name>', {
      name: '<>'
    })).toThrow(new Error(
      'Parameter values passed into interpolateUrl must only contain ' +
      'alphanumerical characters, hyphens, underscores, parentheses or ' +
      'spaces: \'<>\''));

    // Values cannot contain non-alphanumerical characters or spaces, including
    // newlines or website symbols.
    expect(function() {
      uis.interpolateUrl('/test_url/?<query_name>=<query_value>', {
        query_name: 'website',
        query_value: 'https://www.oppia.org/'
      });
    }).toThrow(new Error(
      'Parameter values passed into interpolateUrl must only contain ' +
      'alphanumerical characters, hyphens, underscores, parentheses or ' +
      'spaces: \'https://www.oppia.org/\''));

    expect(function() {
      uis.interpolateUrl('/test_url/<name>', {
        name: 'value\nmultiple lines'
      });
    }).toThrow(new Error(
      'Parameter values passed into interpolateUrl must only contain ' +
      'alphanumerical characters, hyphens, underscores, parentheses or ' +
      'spaces: \'value\nmultiple lines\''));
  });

  it('should throw an error for missing parameters', function() {
    expect(uis.interpolateUrl.bind(null, '/test_url/<page>', {})).toThrow(
      new Error('Expected variable \'page\' when interpolating URL.'));
    expect(uis.interpolateUrl.bind(null, '/test_url/<page1>', {
      page2: 'v'
    })).toThrow(new Error(
      'Expected variable \'page1\' when interpolating URL.'));
  });

  it('should throw an error for non-string parameters', function() {
    expect(uis.interpolateUrl.bind(null, '/test_url/<page>', {
      page: 0
    })).toThrow(new Error(
      'Parameters passed into interpolateUrl must be strings.'));
    expect(uis.interpolateUrl.bind(null, '/test_url/<page>', {
      page: {}
    })).toThrow(new Error(
      'Parameters passed into interpolateUrl must be strings.'));
    expect(uis.interpolateUrl.bind(null, '/test_url/<page>', {
      page: []
    })).toThrow(new Error(
      'Parameters passed into interpolateUrl must be strings.'));
    expect(uis.interpolateUrl.bind(null, '/test_url/<page>', {
      page: /abc/
    })).toThrow(new Error(
      'Parameters passed into interpolateUrl must be strings.'));
  });

  it('should interpolate correct path', function() {
    expect(uis.getStaticImageUrl('/test.png')).toBe(
      GLOBALS.ASSET_DIR_PREFIX + '/assets/images/test.png');
    expect(uis.getStaticImageUrl('/test_url/test.png')).toBe(
      GLOBALS.ASSET_DIR_PREFIX + '/assets/images/test_url/test.png');
    expect(uis.getStaticImageUrl('/hash_test.png')).toBe(
      GLOBALS.ASSET_DIR_PREFIX + '/assets/images/hash_test.' +
      hashes['/images/hash_test.png'] + '.png');

    expect(uis.getInteractionThumbnailImageUrl('LogicProof')).toBe(
      GLOBALS.ASSET_DIR_PREFIX + '/extensions/interactions/LogicProof' +
      '/static/LogicProof.png');
    expect(uis.getInteractionThumbnailImageUrl('interTest')).toBe(
      GLOBALS.ASSET_DIR_PREFIX + '/extensions/interactions/interTest' +
      '/static/interTest.' +
      hashes['/interactions/interTest/static/interTest.png'] + '.png');

    expect(uis.getDirectiveTemplateUrl('/test.html')).toBe(
      GLOBALS.TEMPLATE_DIR_PREFIX + '/test.html');
    expect(uis.getDirectiveTemplateUrl('/test_url/test.html')).toBe(
      GLOBALS.TEMPLATE_DIR_PREFIX + '/test_url/test.html');
    expect(uis.getDirectiveTemplateUrl('/pages_test/hash_test.html')).toBe(
      GLOBALS.TEMPLATE_DIR_PREFIX + '/pages_test/hash_test.' +
      hashes['/pages_test/hash_test.html'] + '.html');

    expect(uis.getStaticAssetUrl('/test.json')).toBe(
      GLOBALS.ASSET_DIR_PREFIX + '/assets/test.json');
    expect(uis.getStaticAssetUrl('/test_url/test.json')).toBe(
      GLOBALS.ASSET_DIR_PREFIX + '/assets/test_url/test.json');
    expect(uis.getStaticAssetUrl('/assets_test/hash_test.json')).toBe(
      GLOBALS.ASSET_DIR_PREFIX + '/assets/assets_test/hash_test.' +
      hashes['/assets_test/hash_test.json'] + '.json');

    expect(uis.getExtensionResourceUrl('/test.html')).toBe(
      GLOBALS.ASSET_DIR_PREFIX + '/extensions/test.html');
    expect(uis.getExtensionResourceUrl('/test_url/test.html')).toBe(
      GLOBALS.ASSET_DIR_PREFIX + '/extensions/test_url/test.html');
    expect(uis.getExtensionResourceUrl('/path_test/hash_test.html')).toBe(
      GLOBALS.ASSET_DIR_PREFIX + '/extensions/path_test/hash_test.' +
      hashes['/path_test/hash_test.html'] + '.html');
  });

  it('should interpolate URLs not requiring parameters', function() {
    expect(uis.getStoryUrl('/storyId', {})).toBe('/story/storyId');
    expect(uis.getStoryUrl('/storyId123', {})).toBe('/story/storyId123');
    expect(uis.getStoryUrl('/story&Id', {})).toBe('/story/story&Id');
    expect(function(){
      uis.getStoryUrl('', {});
    }).toThrowError('Empty path passed in method.');
    expect(function(){
      uis.getStoryUrl('storyId', {});
    }).toThrowError('Path must start with \'/\': \'storyId\'.');
  });

  it('should throw an error for empty path', function() {
    expect(uis.getStaticImageUrl.bind(null, null)).toThrow(
      new Error(
        'Empty path passed in method.'));
    expect(uis.getStaticImageUrl.bind(null, '')).toThrow(
      new Error(
        'Empty path passed in method.'));

    expect(uis.getInteractionThumbnailImageUrl.bind(null, null)).toThrow(
      new Error(
        'Empty interactionId passed in getInteractionThumbnailImageUrl.'));
    expect(uis.getInteractionThumbnailImageUrl.bind(null, '')).toThrow(
      new Error(
        'Empty interactionId passed in getInteractionThumbnailImageUrl.'));

    expect(uis.getDirectiveTemplateUrl.bind(null, null)).toThrow(
      new Error('Empty path passed in method.'));
    expect(uis.getDirectiveTemplateUrl.bind(null, '')).toThrow(
      new Error('Empty path passed in method.'));

    expect(uis.getStaticAssetUrl.bind(null, null)).toThrow(
      new Error('Empty path passed in method.'));
    expect(uis.getStaticAssetUrl.bind(null, '')).toThrow(
      new Error('Empty path passed in method.'));

    expect(uis.getExtensionResourceUrl.bind(null, null)).toThrow(
      new Error('Empty path passed in method.'));
    expect(uis.getExtensionResourceUrl.bind(null, '')).toThrow(
      new Error('Empty path passed in method.'));
  });

  it('should throw an error for path not beginning with forward slash',
    function() {
      expect(uis.getStaticImageUrl.bind(null, 'test_fail.png')).toThrow(
        new Error(
          'Path must start with \'\/\': \'' + 'test_fail.png' + '\'.'));
      expect(uis.getStaticImageUrl.bind(null, 'test_url/fail.png')).toThrow(
        new Error(
          'Path must start with \'\/\': \'' + 'test_url/fail.png' + '\'.'));

      expect(uis.getDirectiveTemplateUrl.bind(null, 'test_fail.html')).toThrow(
        new Error(
          'Path must start with \'\/\': \'' + 'test_fail.html' + '\'.'));
      expect(
        uis.getDirectiveTemplateUrl.bind(null, 'test_url/fail.html')).toThrow(
        new Error(
          'Path must start with \'\/\': \'' + 'test_url/fail.html' + '\'.'));

      expect(uis.getStaticAssetUrl.bind(null, 'test_fail.html')).toThrow(
        new Error(
          'Path must start with \'\/\': \'' + 'test_fail.html' + '\'.'));
      expect(uis.getStaticAssetUrl.bind(null, 'test_url/fail.html')).toThrow(
        new Error(
          'Path must start with \'\/\': \'' + 'test_url/fail.html' + '\'.'));

      expect(uis.getExtensionResourceUrl.bind(null, 'test_fail.html')).toThrow(
        new Error(
          'Path must start with \'\/\': \'' + 'test_fail.html' + '\'.'));
      expect(
        uis.getExtensionResourceUrl.bind(null, 'test_url/fail.html')).toThrow(
        new Error(
          'Path must start with \'\/\': \'' + 'test_url/fail.html' + '\'.'));
    });
});
