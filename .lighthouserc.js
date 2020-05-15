// Copyright 2020 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Config for lighthouse-ci
 */

 // To run Lighthouse Checks type lhci autorun
 module.exports = {
    ci: {
      collect: {
        numberOfRuns: 1,
        startServerCommand: 'python -m scripts.start',
        url: [
          'http://127.0.0.1:8181/splash',
          'http://127.0.0.1:8181/get_started',
          'http://127.0.0.1:8181/teach',
          'http://127.0.0.1:8181/library',
          'http://127.0.0.1:8181/donate',
          'http://127.0.0.1:8181/privacy',
          'http://127.0.0.1:8181/contact',
          'http://127.0.0.1:8181/about',
          'http://127.0.0.1:8181/terms',
          'http://127.0.0.1:8181/thanks',
  
        ],
        settings: {
          chromeFlags: ['--proxy-server=http://127.0.0.1:9999', '--allow-insecure-localhost'],
        }
      },
      assert: {
        assertMatrix: [
          {
            // All Webpages
            matchingUrlPattern: '.*',
            assertions: {
              // Performance Audits
              // maxNumericValue unit is in miliseconds
              'first-contentful-paint': ['warn', {maxNumericValue: 1230000}],
              'first-meaningful-paint': ['warn', {maxNumericValue: 1280000}],
              'first-cpu-idle': ['warn', {maxNumericValue: 1460000}],
              'speed-index': ['warn', {maxNumericValue: 1230000}],
              'interactive': ['warn', {maxNumericValue: 1540000}],
              'max-potential-fid': ["warn", {maxNumericValue: 130000}],
              // Performance Opportunities
              'uses-responsive-images': ['warn', {minScore: 1}],
              'offscreen-images': ['warn', {minScore: 1}],
              'uses-optimized-images': ['warn', {minScore: 1}],
              'uses-webp-images': ['warn', {minScore: 1}],
              'uses-rel-preconnect': ['warn', {minScore: 1}],
              'time-to-first-byte': ['warn', {minScore: 1}],
              'redirects': ['warn', {minScore: 1}],
              'uses-rel-preload': ['warn', {minScore: 1}],
              'efficient-animated-content': ['warn', {minScore: 1}],
              // Best Practice Audits
              'appcache-manifest': ['error', {minScore: 1}],
              'is-on-https': ['error', {minScore: 1}],
              'uses-passive-event-listeners': ['error', {minScore: 1}],
              'no-document-write': ['error', {minScore: 1}],
              'external-anchors-use-rel-noopener': ['error', {minScore: 1}],
              'geolocation-on-start': ['error', {minScore: 1}],
              'doctype': ['error', {minScore: 1}],
              'no-vulnerable-libraries': ['error', {minScore: 1}],
              'js-libraries': ['error', {minScore: 1}],
              'notification-on-start': ['error', {minScore: 1}],
              'deprecations': ['error', {minScore: 1}],
              'password-inputs-can-be-pasted-into': ['error', {minScore: 1}],
              'image-aspect-ratio': ['error', {minScore: 1}]
            }
          },
          {
            matchingUrlPattern: 'http://[^/]+/library',
            assertions: {
               // Performance Opportunities
              'render-blocking-resources': ['warn', {minScore: 0}], // failing
              'unminified-css': ['warn', {minScore: 0}], // failing 
              'unminified-javascript': ['warn', {minScore: 0}], // failing
              'unused-css-rules': ['warn', {minScore: 0}], // failing
              'uses-text-compression': ['warn', {minScore: 0}], // failing
              // Best Practice Audits
              'uses-http2': ['error', {minScore: 0}], // failing
              'errors-in-console': ['error', {minScore: 0}], //failing
            }
          },
          {
            matchingUrlPattern: 'http://[^/]+/get_started',
            assertions: {
               // Performance Opportunities
               'render-blocking-resources': ['warn', {minScore: 0}], // failing
               'unminified-css': ['warn', {minScore: 0}], // failing 
               'unminified-javascript': ['warn', {minScore: 0}], // failing
               'unused-css-rules': ['warn', {minScore: 0}], // failing
               'uses-text-compression': ['warn', {minScore: 0}], // failing
               // Best Practice Audits
               'uses-http2': ['error', {minScore: 0}], // failing
               'errors-in-console': ['error', {minScore: 0}], //failing
  
            }
          },
          {
            matchingUrlPattern: 'http://[^/]+/donate',
            assertions: {
               // Performance Opportunities
               'render-blocking-resources': ['warn', {minScore: 0}], // failing
               'unminified-css': ['warn', {minScore: 0}], // failing 
               'unminified-javascript': ['warn', {minScore: 0}], // failing
               'unused-css-rules': ['warn', {minScore: 0}], // failing
               'uses-text-compression': ['warn', {minScore: 0}], // failing
               // Best Practice Audits
               'uses-http2': ['error', {minScore: 0}], // failing
               'errors-in-console': ['error', {minScore: 0}], //failing
  
            }
          },
          {
            matchingUrlPattern: 'http://[^/]+/teach',
            assertions: {
               // Performance Opportunities
               'render-blocking-resources': ['warn', {minScore: 0}], // failing
               'unminified-css': ['warn', {minScore: 0}], // failing 
               'unminified-javascript': ['warn', {minScore: 0}], // failing
               'unused-css-rules': ['warn', {minScore: 0}], // failing
               'uses-text-compression': ['warn', {minScore: 0}], // failing
               // Best Practice Audits
               'uses-http2': ['error', {minScore: 0}], // failing
               'errors-in-console': ['error', {minScore: 0}], //failing
  
            }
          },
          {
            matchingUrlPattern: 'http://[^/]+/privacy',
            assertions: {
               // Performance Opportunities
               'render-blocking-resources': ['warn', {minScore: 0}], // failing
               'unminified-css': ['warn', {minScore: 0}], // failing 
               'unminified-javascript': ['warn', {minScore: 0}], // failing
               'unused-css-rules': ['warn', {minScore: 0}], // failing
               'uses-text-compression': ['warn', {minScore: 0}], // failing
               // Best Practice Audits
               'uses-http2': ['error', {minScore: 0}], // failing
               'errors-in-console': ['error', {minScore: 0}], //failing
  
            }
          },
          {
            matchingUrlPattern: 'http://[^/]+/contact',
            assertions: {
               // Performance Opportunities
               'render-blocking-resources': ['warn', {minScore: 0}], // failing
               'unminified-css': ['warn', {minScore: 0}], // failing 
               'unminified-javascript': ['warn', {minScore: 0}], // failing
               'unused-css-rules': ['warn', {minScore: 0}], // failing
               'uses-text-compression': ['warn', {minScore: 0}], // failing
               // Best Practice Audits
               'uses-http2': ['error', {minScore: 0}], // failing
               'errors-in-console': ['error', {minScore: 0}], //failing
  
            }
          },
          {
            matchingUrlPattern: 'http://[^/]+/about',
            assertions: {
               // Performance Opportunities
               'render-blocking-resources': ['warn', {minScore: 0}], // failing
               'unminified-css': ['warn', {minScore: 0}], // failing 
               'unminified-javascript': ['warn', {minScore: 0}], // failing
               'unused-css-rules': ['warn', {minScore: 0}], // failing
               'uses-text-compression': ['warn', {minScore: 0}], // failing
               // Best Practice Audits
               'uses-http2': ['error', {minScore: 0}], // failing
               'errors-in-console': ['error', {minScore: 0}], //failing
  
            }
          },
          {
            matchingUrlPattern: 'http://[^/]+/terms',
            assertions: {
               // Performance Opportunities
               'render-blocking-resources': ['warn', {minScore: 0}], // failing
               'unminified-css': ['warn', {minScore: 0}], // failing 
               'unminified-javascript': ['warn', {minScore: 0}], // failing
               'unused-css-rules': ['warn', {minScore: 0}], // failing
               'uses-text-compression': ['warn', {minScore: 0}], // failing
               // Best Practice Audits
               'uses-http2': ['error', {minScore: 0}], // failing
               'errors-in-console': ['error', {minScore: 0}], //failing
  
            }
          },
          {
            matchingUrlPattern: 'http://[^/]+/thanks',
            assertions: {
               // Performance Opportunities
               'render-blocking-resources': ['warn', {minScore: 0}], // failing
               'unminified-css': ['warn', {minScore: 0}], // failing 
               'unminified-javascript': ['warn', {minScore: 0}], // failing
               'unused-css-rules': ['warn', {minScore: 0}], // failing
               'uses-text-compression': ['warn', {minScore: 0}], // failing
               // Best Practice Audits
               'uses-http2': ['error', {minScore: 0}], // failing
               'errors-in-console': ['error', {minScore: 0}], //failing
            }
          },
        ]
      },
      upload: {
        target: 'temporary-public-storage'
      },
      server: {
        // server options here
      },
      wizard: {
        // wizard options here
      },
    },
  };
