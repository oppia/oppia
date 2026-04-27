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
 * @fileoverview Initialization of Google Analytics (gtag.js).
 */


import analyticsConstants from 'analytics-constants';

const GTAG_SCRIPT_BASE_URL = 'https://www.googletagmanager.com/gtag/js?id=';
const GTM_SCRIPT_BASE_URL = 'https://www.googletagmanager.com/gtm.js?id=';

initializeGoogleAnalytics();

function ensureScriptIsLoaded(scriptUrl: string): void {
  const scriptElement = window.document.querySelector(
    `script[src="${scriptUrl}"]`
  );
  if (scriptElement !== null) {
    return;
  }

  const analyticsScriptElement = window.document.createElement('script');
  analyticsScriptElement.async = true;
  analyticsScriptElement.src = scriptUrl;
  const headElement = window.document.head;
  if (headElement === null) {
    return;
  }
  headElement.appendChild(analyticsScriptElement);
}

export function initializeGoogleAnalytics() {
  if (!analyticsConstants.CAN_SEND_ANALYTICS_EVENTS) {
    // Mock gtag function will prevent sending analytics to google.
    window.gtag = function() {}
    return;
  }

  if (analyticsConstants.SITE_NAME_FOR_ANALYTICS) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(): void {
      window.dataLayer.push(arguments);
    }

    if (analyticsConstants.GA_ANALYTICS_ID) {
      ensureScriptIsLoaded(
        `${GTAG_SCRIPT_BASE_URL}${analyticsConstants.GA_ANALYTICS_ID}`
      );
      // The following is for gtag.js. Reference doc:
      // https://developers.google.com/analytics/devguides/collection/gtagjs
      gtag('set', 'linker', {
        'domains': [analyticsConstants.SITE_NAME_FOR_ANALYTICS]
      });
      gtag('js', new Date());
      gtag('config', analyticsConstants.GA_ANALYTICS_ID, {
        'anonymize_ip': true,
        'forceSSL': true,
      });
    }

    if (analyticsConstants.GTM_ANALYTICS_ID) {
      ensureScriptIsLoaded(
        `${GTM_SCRIPT_BASE_URL}${analyticsConstants.GTM_ANALYTICS_ID}`
      );
      // The following is for Google Tag Manager (gtm.js).
      window.dataLayer.push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js'
      });
    }
  }
}
