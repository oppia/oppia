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


var PageMeta = function(name, description) {
  this.name = name;
  this.description = description;
  this.referrer = 'no-referrer';
  this.viewport = 'width=device-width, initial-scale=1.0, user-scalable=yes';

  this['application-name'] = '<[ siteName ]>';
  this['msapplication-square310x310logo'] = (
    '<[ getAssetUrl(\'/assets/images/logo/msapplication-large.png\') ]>');
  this['msapplication-wide310x150logo'] = (
    '<[ getAssetUrl(\'/assets/images/logo/msapplication-wide.png\') ]>');
  this['msapplication-square150x150logo'] = (
    '<[ getAssetUrl(\'/assets/images/logo/msapplication-square.png\') ]>');
  this['msapplication-square70x70logo'] = (
    '<[ getAssetUrl(\'/assets/images/logo/msapplication-tiny.png\') ]>');

  this['og:type'] = {
    property: 'og:type',
    content: 'article'
  };
  this['og:site_name'] = {
    property: 'og:site_name',
    content: 'Oppia'
  };
  this['og:url'] = {
    property: 'og:url',
    content: '<[pageUrl]>'
  };
  this['og:title'] = {
    property: 'og:title',
    content: name
  };
  this['og:description'] = {
    property: 'og:description',
    content: description
  };
  this['og:image'] = {
    property: 'og:image',
    content: '<[ getAssetUrl(\'/assets/images/logo/288x288_logo_mint.png\') ]>'
  };
};

var utilities = {
  getMetas: function(page) {
    var getStarted = new PageMeta(
      'Personalized Online Learning from Oppia',
      'Learn how to get started using Oppia.');
    return {
      getStarted
    };
  },
};

module.exports = utilities;
