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
 * @fileoverview Initialization of Google Analytics..
 */

const constants = require('constants.ts');

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})
(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

(function() {
  if (constants.ANALYTICS_ID && constants.SITE_NAME_FOR_ANALYTICS) {
    ga('create', constants.ANALYTICS_ID, 'auto', {allowLinker: true});
    ga('set', 'anonymizeIp', true);
    ga('set', 'forceSSL', true);
    ga('require', 'linker');
    ga('linker:autoLink', [constants.SITE_NAME_FOR_ANALYTICS]);
    ga('send', 'pageview');
  }
})()
