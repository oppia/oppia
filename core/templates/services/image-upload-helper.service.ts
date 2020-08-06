// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Image upload helper service.
 */

require('services/assets-backend-api.service.ts');

// TODO(#9186): Change variable name to 'constants' once this file
// is migrated to Angular.
const Constants = require('constants.ts');

angular.module('oppia').factory('ImageUploadHelperService', [
  '$sce', 'AssetsBackendApiService',
  function($sce, AssetsBackendApiService) {
    var _generateDateTimeStringForFilename = function() {
      var date = new Date();
      return date.getFullYear() +
        ('0' + (date.getMonth() + 1)).slice(-2) +
        ('0' + date.getDate()).slice(-2) + '_' +
        ('0' + date.getHours()).slice(-2) +
        ('0' + date.getMinutes()).slice(-2) +
        ('0' + date.getSeconds()).slice(-2) + '_' +
        Math.random().toString(36).substr(2, 10);
    };
    return {
      convertImageDataToImageFile: function(dataURI) {
        // Convert base64/URLEncoded data component to raw binary data
        // held in a string.
        var byteString = atob(dataURI.split(',')[1]);

        // Separate out the mime component.
        var mime = dataURI.split(',')[0].split(':')[1].split(';')[0];

        // Write the bytes of the string to a typed array.
        var ia = new Uint8Array(byteString.length);
        for (var i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }

        var blob = new Blob([ia], { type: mime });
        if (blob.type.match('image') &&
          blob.size > 0) {
          return blob;
        } else {
          return null;
        }
      },

      getInvalidSvgTagsAndAttrs: function(dataURI) {
        // Convert base64/URLEncoded data component to raw binary data
        // held in a string.
        var svgString = atob(dataURI.split(',')[1]);
        var domParser = new DOMParser();
        var doc = domParser.parseFromString(svgString, 'image/svg+xml');
        var invalidTags = [];
        var invalidAttrs = [];
        var allowedTags = Object.keys(Constants.SVG_ATTRS_WHITELIST);
        var nodeTagName = null;
        doc.querySelectorAll('*').forEach((node) => {
          nodeTagName = node.tagName.toLowerCase();
          if (allowedTags.indexOf(nodeTagName) !== -1) {
            for (var i = 0; i < node.attributes.length; i++) {
              if (Constants.SVG_ATTRS_WHITELIST[nodeTagName].indexOf(
                node.attributes[i].name.toLowerCase()) === -1) {
                invalidAttrs.push(
                  node.tagName + ':' + node.attributes[i].name);
              }
            }
          } else {
            invalidTags.push(node.tagName);
          }
        });
        return { tags: invalidTags, attrs: invalidAttrs };
      },

      getTrustedResourceUrlForThumbnailFilename: function(
          imageFileName, entityType, entityId) {
        var encodedFilepath = window.encodeURIComponent(imageFileName);
        return $sce.trustAsResourceUrl(
          AssetsBackendApiService.getThumbnailUrlForPreview(
            entityType, entityId, encodedFilepath));
      },

      generateImageFilename: function(height, width, extension) {
        return 'img_' +
          _generateDateTimeStringForFilename() +
          '_height_' + height +
          '_width_' + width +
          '.' + extension;
      },

      cleanMathExpressionSvgString: function(svgString) {
        // We need to modify/remove unnecessary attributes added by mathjax
        // from the svg tag.
        var domParser = new DOMParser();
        var cleanedSvgString = '';
        var doc = domParser.parseFromString(svgString, 'image/svg+xml');
        doc.querySelectorAll('*').forEach((node) => {
          if (node.tagName.toLowerCase() === 'svg') {
            node.removeAttribute('xmlns:xlink');
            node.removeAttribute('role');
            // We are removing this attribute, because currently it is not in
            // the white list of valid attributes.
            node.removeAttribute('aria-hidden');
            node.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
          }
          // Remove the custom data attributes added by MathJax.
          // These custom attributes don't affect the rendering of the SVGs,
          // and they are not present in the white list for allowed attributes.
          for (var i = 0; i < node.attributes.length; i++) {
            if (node.attributes[i].name.toLowerCase().startsWith('data-')) {
              node.removeAttribute(node.attributes[i].name.toLowerCase());
            }
          }
        });
        return doc.documentElement.outerHTML;
      },

      extractDimensionsFromMathExpressionSvgString: function(svgString) {
        // The method below extracts the dimensions from the attributes of a
        // math SVG string generated by mathJax.
        var domParser = new DOMParser();
        var dimensions = {
          height: '',
          width: '',
          verticalPadding: ''
        };
        var doc = domParser.parseFromString(svgString, 'image/svg+xml');
        doc.querySelectorAll('*').forEach((node) => {
          // Mathjax SVGs have relative dimensions in the unit of 'ex' rather
          // than 'px'(pixels). Hence the dimesions have decimal points in them,
          // we need to replace these decimals with a letter so that it's easier
          // to process and validate the filnames.
          if (node.tagName.toLowerCase() === 'svg') {
            dimensions.height = (
              (node.getAttribute('height').match(/\d+\.*\d*/g)[0]).replace(
                '.', 'd'));
            dimensions.width = (
              (node.getAttribute('width').match(/\d+\.*\d*/g)[0]).replace(
                '.', 'd'));
            // This attribute is useful for the vertical allignment of the
            // Math SVG while displaying inline with other text.
            // Math SVGs don't necessarily have a vertical allignment, in that
            // case we assign it zero.
            var styleValue = node.getAttribute('style').match(/\d+\.*\d*/g);
            if (styleValue) {
              dimensions.verticalPadding = styleValue[0].replace('.', 'd');
            } else {
              dimensions.verticalPadding = '0';
            }
          }
        });
        return dimensions;
      },

      generateMathExpressionImageFilename: function(
          height, width, verticalPadding) {
        var date = new Date();
        return 'mathImg_' +
          _generateDateTimeStringForFilename() +
          '_height_' + height +
          '_width_' + width +
          '_vertical_' + verticalPadding +
          '.' + 'svg';
      }
    };
  }
]);
