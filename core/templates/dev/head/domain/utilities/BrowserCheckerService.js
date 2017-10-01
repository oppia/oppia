// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utility service for checking web browser type.
 */

oppia.factory('BrowserCheckerService', function() {
  var isChromium = window.chrome;
  var winNav = window.navigator;
  var vendorName = winNav.vendor;
  var isOpera = winNav.userAgent.indexOf('OPR') > -1;
  var isIEedge = winNav.userAgent.indexOf('Edge') > -1;
  var isIOSChrome = winNav.userAgent.match('CriOS');

  var _isChrome = function() {
    // For details on the reliability of this check, see
    // https://stackoverflow.com/questions/4565112/
    // javascript-how-to-find-out-if-the-user-browser-is-chrome
    if (isIOSChrome ||
        (isChromium !== null &&
        isChromium !== undefined &&
        vendorName === 'Google Inc.' &&
        isOpera == false &&
        isIEedge == false)) {
      return true;
    } else {
      return false;
    }
  };

  return {
    isChrome: function() {
      return _isChrome();
    }
  };
});
