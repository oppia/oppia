// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Configuration for lighthouse-ci desktop runs.
 *
 * This config runs the same pages and assertions as .lighthouserc.js but with
 * desktop emulation. It is executed as a separate `lhci autorun` invocation, so
 * its Lighthouse reports are collected and asserted independently of the mobile
 * runs.
 */

const mobileConfig = require('./.lighthouserc.js');

// Desktop emulation metrics, matching the desktop preset in Lighthouse
// (see node_modules/lighthouse/core/config/constants.js).
const DESKTOP_SCREEN_EMULATION = {
  mobile: false,
  width: 1350,
  height: 940,
  deviceScaleFactor: 1,
  disabled: false,
};

// Throttling for a dense 4G desktop connection, matching the desktopDense4G
// constants in Lighthouse's lantern simulation. The request latency and
// throughput values are set to 0 (meaning unset) so that Lantern derives them
// from rttMs and throughputKbps; otherwise the mobile defaults would persist
// through the settings merge.
const DESKTOP_THROTTLING = {
  rttMs: 40,
  throughputKbps: 10240,
  cpuSlowdownMultiplier: 1,
  requestLatencyMs: 0,
  downloadThroughputKbps: 0,
  uploadThroughputKbps: 0,
};

module.exports = {
  ci: {
    collect: {
      ...mobileConfig['ci']['collect'],
      settings: {
        ...mobileConfig['ci']['collect']['settings'],
        formFactor: 'desktop',
        screenEmulation: DESKTOP_SCREEN_EMULATION,
        throttling: DESKTOP_THROTTLING,
        // Set to true so that Lighthouse uses the user agent associated with
        // the desktop form factor.
        emulatedUserAgent: true,
      },
    },
    assert: {
      assertMatrix: mobileConfig['ci']['assert']['assertMatrix'],
    },
    upload: mobileConfig['ci']['upload'],
  },
};
