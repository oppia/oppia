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
 *
 * @fileoverview Extra utilities used by webpack
 */

var PageMeta = function(name, description) {
  this.name = name;
  this.description = description;
  this['og:title'] = {
    property: 'og:title',
    content: name
  };
  this['og:description'] = {
    property: 'og:description',
    content: description
  };
};

PageMeta.prototype.toHTML = function() {
  var html = '';
  for (var meta in this) {
    if (this.hasOwnProperty(meta)) {
      if (typeof this[meta] === 'object') {
        html += '<meta ' + Object.keys(this[meta])[0] + '="' +
        Object.values(this[meta])[0] + '" ' + Object.keys(this[meta])[1] +
        '="' + Object.values(this[meta])[1] + '">\n';
      } else {
        html += '<meta name="' + meta + '" content="' + this[meta] + '">\n';
      }
    }
  }
  return html;
};

var utilities = {
  getMetas: function() {
    var getStarted = new PageMeta(
      'Personalized Online Learning from Oppia',
      'Learn how to get started using Oppia.');
    return {
      getStarted
    };
  },
};

module.exports = utilities;
