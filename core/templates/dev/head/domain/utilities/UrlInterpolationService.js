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
 * @fileoverview Service to construct URLs by inserting variables within them as
 * necessary to have a fully-qualified URL.
 */

oppia.factory('UrlInterpolationService', [
  'AlertsService', 'UtilsService', function(AlertsService, UtilsService) {
    var validateResourcePath = function(resourcePath) {
      if (!resourcePath) {
        AlertsService.fatalWarning('Empty path passed in method.');
      }

      var RESOURCE_PATH_STARTS_WITH_FORWARD_SLASH = /^\//;
      // Ensure that resourcePath starts with a forward slash.
      if (!resourcePath.match(RESOURCE_PATH_STARTS_WITH_FORWARD_SLASH)) {
        AlertsService.fatalWarning(
          'Path must start with \'\/\': \'' + resourcePath + '\'.');
      }
    };

    /**
     * Given a resource path relative to subfolder in /,
     * returns resource path with cache slug.
     */
    var getUrlWithSlug = function(resourcePath) {
      if (!GLOBALS.DEV_MODE) {
        if (hashes[resourcePath]) {
          var index = resourcePath.lastIndexOf('.');
          return (resourcePath.slice(0, index) + '.' + hashes[resourcePath] +
                  resourcePath.slice(index));
        }
      }
      return resourcePath;
    };

    /**
     * Given a resource path relative to subfolder in /,
     * returns complete resource path with cache slug and prefixed with url
     * depending on dev/prod mode.
     */
    var getCompleteUrl = function(prefix, path) {
      if (GLOBALS.DEV_MODE) {
        return prefix + getUrlWithSlug(path);
      } else {
        return '/build' + prefix + getUrlWithSlug(path);
      }
    };

    /**
     * Given a resource path relative to extensions folder,
     * returns the complete url path to that resource.
     */
    var getExtensionResourceUrl = function(resourcePath) {
      validateResourcePath(resourcePath);
      return getCompleteUrl('/extensions', resourcePath);
    };

    return {
      /**
       * Given a formatted URL, interpolates the URL by inserting values the URL
       * needs using the interpolationValues object. For example, urlTemplate
       * might be:
       *
       *   /createhandler/resolved_answers/<exploration_id>/<escaped_state_name>
       *
       * interpolationValues is an object whose keys are variables within the
       * URL. For the above example, interpolationValues may look something
       * like:
       *
       *   { 'exploration_id': '0', 'escaped_state_name': 'InputBinaryNumber' }
       *
       * If a URL requires a value which is not keyed within the
       * interpolationValues object, this will return null.
       */
      interpolateUrl: function(urlTemplate, interpolationValues) {
        if (!urlTemplate) {
          AlertsService.fatalWarning(
            'Invalid or empty URL template passed in: \'' + urlTemplate + '\'');
          return null;
        }

        // http://stackoverflow.com/questions/4775722
        if (!(interpolationValues instanceof Object) || (
          Object.prototype.toString.call(
            interpolationValues) === '[object Array]')) {
          AlertsService.fatalWarning(
            'Expected an object of interpolation values to be passed into ' +
            'interpolateUrl.');
          return null;
        }

        // Valid pattern: <alphanum>
        var INTERPOLATION_VARIABLE_REGEX = /<(\w+)>/;

        // Invalid patterns: <<stuff>>, <stuff>>>, <>
        var EMPTY_VARIABLE_REGEX = /<>/;
        var INVALID_VARIABLE_REGEX = /(<{2,})(\w*)(>{2,})/;

        // Parameter values can only contain alphanumerical characters, spaces,
        // hyphens, underscores, periods or the equal to symbol.
        var VALID_URL_PARAMETER_VALUE_REGEX = /^(\w| |_|-|[.]|=|\(|\))+$/;

        if (urlTemplate.match(INVALID_VARIABLE_REGEX) ||
            urlTemplate.match(EMPTY_VARIABLE_REGEX)) {
          AlertsService.fatalWarning(
            'Invalid URL template received: \'' + urlTemplate + '\'');
          return null;
        }

        var escapedInterpolationValues = {};
        for (var varName in interpolationValues) {
          var value = interpolationValues[varName];
          if (!UtilsService.isString(value)) {
            AlertsService.fatalWarning(
              'Parameters passed into interpolateUrl must be strings.');
            return null;
          }

          // Ensure the value is valid.
          if (!value.match(VALID_URL_PARAMETER_VALUE_REGEX)) {
            AlertsService.fatalWarning(
              'Parameter values passed into interpolateUrl must only contain ' +
              'alphanumerical characters, hyphens, underscores, parentheses ' +
              'or spaces: \'' + value + '\'');
            return null;
          }

          escapedInterpolationValues[varName] = encodeURIComponent(value);
        }

        // Ensure the URL has no nested brackets (which would lead to
        // indirection in the interpolated variables).
        var filledUrl = angular.copy(urlTemplate);
        var match = filledUrl.match(INTERPOLATION_VARIABLE_REGEX);
        while (match) {
          var varName = match[1];
          if (!escapedInterpolationValues.hasOwnProperty(varName)) {
            AlertsService.fatalWarning('Expected variable \'' + varName +
              '\' when interpolating URL.');
            return null;
          }
          filledUrl = filledUrl.replace(
            INTERPOLATION_VARIABLE_REGEX,
            escapedInterpolationValues[varName]);
          match = filledUrl.match(INTERPOLATION_VARIABLE_REGEX);
        }
        return filledUrl;
      },

      /**
       * Given an image path relative to /assets/images folder,
       * returns the complete url path to that image.
       */
      getStaticImageUrl: function(imagePath) {
        validateResourcePath(imagePath);
        return getCompleteUrl('/assets', '/images' + imagePath);
      },

      /**
       * Given a path relative to /assets folder, returns the complete url path
       * to that asset.
       */
      getStaticAssetUrl: function(assetPath) {
        validateResourcePath(assetPath);
        return getCompleteUrl('/assets', assetPath);
      },

      /**
       * Given an interaction id, returns the complete url path to
       * the thumbnail image for the interaction.
       */
      getInteractionThumbnailImageUrl: function(interactionId) {
        if (!interactionId) {
          AlertsService.fatalWarning(
            'Empty interactionId passed in getInteractionThumbnailImageUrl.');
        }
        return getExtensionResourceUrl('/interactions/' + interactionId +
          '/static/' + interactionId + '.png');
      },

      /**
       * Given a directive path relative to head folder,
       * returns the complete url path to that directive.
       */
      getDirectiveTemplateUrl: function(path) {
        validateResourcePath(path);
        if (GLOBALS.DEV_MODE) {
          return '/templates/dev/head' + getUrlWithSlug(path);
        } else {
          return '/build/templates/head' + getUrlWithSlug(path);
        }
      },

      getExtensionResourceUrl: getExtensionResourceUrl,

      _getUrlWithSlug: getUrlWithSlug,
      _getCompleteUrl: getCompleteUrl
    };
  }
]);
