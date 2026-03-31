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
 * @fileoverview Unit tests for Interactive Map rules.
 */

import {InteractiveMapRulesService} from 'interactions/InteractiveMap/directives/interactive-map-rules.service';

describe('Numeric Input service', () => {
  let imrs: InteractiveMapRulesService;
  beforeEach(() => {
    imrs = new InteractiveMapRulesService();
  });

  var RADIUS_OF_EARTH_KM: number = 6371.0;
  var QUARTER_CIRCUMFERENCE_KM: number = 0.5 * Math.PI * RADIUS_OF_EARTH_KM;
  var HALF_CIRCUMFERENCE_KM: number = 2 * QUARTER_CIRCUMFERENCE_KM;
  var DELTA_KM: number = 5;
  var NORTH_POLE: number[] = [90, 0];
  var SOUTH_POLE: number[] = [-90, 0];
  var EQUATOR_ORIGIN: number[] = [0, 0];

  it("should have a correct 'within' rule", () => {
    expect(
      imrs.Within(EQUATOR_ORIGIN, {
        p: [0, 180],
        d: HALF_CIRCUMFERENCE_KM + DELTA_KM,
      })
    ).toBe(true);
    expect(
      imrs.Within(EQUATOR_ORIGIN, {
        p: [0, 90],
        d: QUARTER_CIRCUMFERENCE_KM + DELTA_KM,
      })
    ).toBe(true);
    expect(
      imrs.Within(EQUATOR_ORIGIN, {
        p: [0, -90],
        d: QUARTER_CIRCUMFERENCE_KM + DELTA_KM,
      })
    ).toBe(true);
    expect(
      imrs.Within(EQUATOR_ORIGIN, {
        p: [0, -180],
        d: HALF_CIRCUMFERENCE_KM + DELTA_KM,
      })
    ).toBe(true);
    expect(
      imrs.Within(EQUATOR_ORIGIN, {
        p: [0, 180],
        d: HALF_CIRCUMFERENCE_KM - DELTA_KM,
      })
    ).toBe(false);
    expect(
      imrs.Within(EQUATOR_ORIGIN, {
        p: [0, 90],
        d: QUARTER_CIRCUMFERENCE_KM - DELTA_KM,
      })
    ).toBe(false);
    expect(
      imrs.Within(EQUATOR_ORIGIN, {
        p: [0, -90],
        d: QUARTER_CIRCUMFERENCE_KM - DELTA_KM,
      })
    ).toBe(false);
    expect(
      imrs.Within(EQUATOR_ORIGIN, {
        p: [0, -180],
        d: HALF_CIRCUMFERENCE_KM - DELTA_KM,
      })
    ).toBe(false);
    expect(
      imrs.Within(NORTH_POLE, {
        p: [90, 180],
        d: 0.1,
      })
    ).toBe(true);
    expect(
      imrs.Within(NORTH_POLE, {
        p: [90, -180],
        d: 0.1,
      })
    ).toBe(true);
    expect(
      imrs.Within(SOUTH_POLE, {
        p: [-90, -180],
        d: 0.1,
      })
    ).toBe(true);
    expect(
      imrs.Within(SOUTH_POLE, {
        p: [-90, 180],
        d: 0.1,
      })
    ).toBe(true);
    expect(
      imrs.Within([-37, -97], {
        p: [55, -45],
        d: 11370,
      })
    ).toBe(true);
    expect(
      imrs.Within([47, -17], {
        p: [-81, 117],
        d: 15890,
      })
    ).toBe(true);
    expect(
      imrs.Within([16, -142], {
        p: [-42, 3],
        d: 15500,
      })
    ).toBe(false);
    expect(
      imrs.Within([83, -127], {
        p: [27, -123],
        d: 6220,
      })
    ).toBe(false);
  });

  it("should have a correct 'not within' rule", () => {
    expect(
      imrs.NotWithin(EQUATOR_ORIGIN, {
        p: [0, 180],
        d: HALF_CIRCUMFERENCE_KM + DELTA_KM,
      })
    ).toBe(false);
    expect(
      imrs.NotWithin(EQUATOR_ORIGIN, {
        p: [0, 90],
        d: QUARTER_CIRCUMFERENCE_KM + DELTA_KM,
      })
    ).toBe(false);
    expect(
      imrs.NotWithin(EQUATOR_ORIGIN, {
        p: [0, -90],
        d: QUARTER_CIRCUMFERENCE_KM + DELTA_KM,
      })
    ).toBe(false);
    expect(
      imrs.NotWithin(EQUATOR_ORIGIN, {
        p: [0, -180],
        d: HALF_CIRCUMFERENCE_KM + DELTA_KM,
      })
    ).toBe(false);
    expect(
      imrs.NotWithin(EQUATOR_ORIGIN, {
        p: [0, 180],
        d: HALF_CIRCUMFERENCE_KM - DELTA_KM,
      })
    ).toBe(true);
    expect(
      imrs.NotWithin(EQUATOR_ORIGIN, {
        p: [0, 90],
        d: QUARTER_CIRCUMFERENCE_KM - DELTA_KM,
      })
    ).toBe(true);
    expect(
      imrs.NotWithin(EQUATOR_ORIGIN, {
        p: [0, -90],
        d: QUARTER_CIRCUMFERENCE_KM - DELTA_KM,
      })
    ).toBe(true);
    expect(
      imrs.NotWithin(EQUATOR_ORIGIN, {
        p: [0, -180],
        d: HALF_CIRCUMFERENCE_KM - DELTA_KM,
      })
    ).toBe(true);
    expect(
      imrs.NotWithin(NORTH_POLE, {
        p: [90, 180],
        d: 0.1,
      })
    ).toBe(false);
    expect(
      imrs.NotWithin(NORTH_POLE, {
        p: [90, -180],
        d: 0.1,
      })
    ).toBe(false);
    expect(
      imrs.NotWithin(SOUTH_POLE, {
        p: [-90, -180],
        d: 0.1,
      })
    ).toBe(false);
    expect(
      imrs.NotWithin(SOUTH_POLE, {
        p: [-90, 180],
        d: 0.1,
      })
    ).toBe(false);
    expect(
      imrs.NotWithin([-37, -97], {
        p: [55, -45],
        d: 11370,
      })
    ).toBe(false);
    expect(
      imrs.NotWithin([47, -17], {
        p: [-81, 117],
        d: 15890,
      })
    ).toBe(false);
    expect(
      imrs.NotWithin([16, -142], {
        p: [-42, 3],
        d: 15500,
      })
    ).toBe(true);
    expect(
      imrs.NotWithin([83, -127], {
        p: [27, -123],
        d: 6220,
      })
    ).toBe(true);
  });
});
