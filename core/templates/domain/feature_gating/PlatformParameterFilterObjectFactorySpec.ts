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
 * @fileoverview Unit tests for PlatformParameterFilterObjectFactory.
 */

import { TestBed } from '@angular/core/testing';

import {
  ALLOWED_BROWSER_TYPE,
  ALLOWED_CLIENT_TYPE,
  ALLOWED_OP_FOR_TYPE,
  ALLOWED_SERVER_MODE,
  APP_VERSION_REGEXP,
  PlatformParameterFilterBackendDict,
  PlatformParameterFilterObjectFactory,
  PlatformParameterFilterType,
  ServerMode,
  SUPPORTED_SITE_LANGUAGE_IDS,
} from 'domain/feature_gating/PlatformParameterFilterObjectFactory';

describe('PlatformParameterFilterObjectFactory', () => {
  let factory: PlatformParameterFilterObjectFactory;

  beforeEach(() => {
    factory = TestBed.get(PlatformParameterFilterObjectFactory);
  });

  it('should create an instance from a backend dict.', () => {
    const filter = factory.createFromBackendDict({
      type: PlatformParameterFilterType.ServerMode,
      conditions: [['=', ServerMode.Dev.toString()]]
    });

    expect(filter.type).toEqual(PlatformParameterFilterType.ServerMode);
    expect(filter.conditions).toEqual([['=', ServerMode.Dev.toString()]]);
  });

  it('should convert an instance back to a dict.', () => {
    const backendDict: PlatformParameterFilterBackendDict = {
      type: PlatformParameterFilterType.ServerMode,
      conditions: [['=', ServerMode.Dev.toString()]]
    };

    const instance = factory.createFromBackendDict(backendDict);

    expect(instance.toBackendDict()).toEqual(backendDict);
  });

  describe('.validate', () => {
    it('should not generate any issue with valid filter', () => {
      const filter = factory.createFromBackendDict({
        type: PlatformParameterFilterType.ServerMode,
        conditions: [['=', ServerMode.Dev.toString()]]
      });
      expect(filter.validate()).toEqual([]);
    });

    it('should generate issue for invalid comparison operator', () => {
      const filter = factory.createFromBackendDict({
        type: PlatformParameterFilterType.ServerMode,
        conditions: [['!=', ServerMode.Dev.toString()]]
      });
      expect(filter.validate()).toEqual([
        `Unsupported comparison operator '!=' for ${filter.type} filter, ` +
        `expected one of [${ALLOWED_OP_FOR_TYPE[filter.type]}]`]);
    });

    it('should generate issue for invalid server mode', () => {
      const filter = factory.createFromBackendDict({
        type: PlatformParameterFilterType.ServerMode,
        conditions: [['=', 'InvalidMode']]
      });
      expect(filter.validate()).toEqual([
        'Invalid server mode value, got \'InvalidMode\' but expected one of' +
        ` [${ALLOWED_SERVER_MODE}]`]);
    });

    it('should generate issue for invalid user locale', () => {
      const filter = factory.createFromBackendDict({
        type: PlatformParameterFilterType.UserLocale,
        conditions: [['=', 'InvalidLocale']]
      });
      expect(filter.validate()).toEqual([
        'Invalid user locale value, got \'InvalidLocale\' but expected one' +
        ` of [${SUPPORTED_SITE_LANGUAGE_IDS}]`]);
    });

    it('should generate issue for invalid client type', () => {
      const filter = factory.createFromBackendDict({
        type: PlatformParameterFilterType.ClientType,
        conditions: [['=', 'InvalidClient']]
      });
      expect(filter.validate()).toEqual([
        'Invalid client type value, got \'InvalidClient\' but expected one' +
        ` of [${ALLOWED_CLIENT_TYPE}]`]);
    });

    it('should generate issue for invalid browser type', () => {
      const filter = factory.createFromBackendDict({
        type: PlatformParameterFilterType.BrowserType,
        conditions: [['=', 'InvalidBrowser']]
      });
      expect(filter.validate()).toEqual([
        'Invalid browser type value, got \'InvalidBrowser\' but expected one' +
        ` of [${ALLOWED_BROWSER_TYPE}]`]);
    });

    it('should generate issue for invalid app version', () => {
      const filter = factory.createFromBackendDict({
        type: PlatformParameterFilterType.AppVersion,
        conditions: [['>=', '1.a.x']]
      });
      expect(filter.validate()).toEqual([
        'Invalid app version value, got \'1.a.x\' but expected to match' +
        ` regexp '${APP_VERSION_REGEXP}'`]);
    });
  });
});
