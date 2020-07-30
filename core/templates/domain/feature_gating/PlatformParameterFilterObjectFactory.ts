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
 * @fileoverview Factory for creating PlatformParameterFilter domain objects.
 */

import cloneDeep from 'lodash/cloneDeep';

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

const constants = require('constants.ts');


export enum PlatformParameterFilterType {
  ServerMode = 'server_mode',
  UserLocale = 'user_locale',
  ClientType = 'client_type',
  BrowserType = 'browser_type',
  AppVersion = 'app_version',
}

export enum ServerMode {
  Dev = 'dev',
  Test = 'test',
  Prod = 'prod',
}

export const ALLOWED_SERVER_MODE = [
  ServerMode.Dev, ServerMode.Test, ServerMode.Prod].map(e => e.toString());

export const SUPPORTED_SITE_LANGUAGE_IDS = (
  constants.SUPPORTED_SITE_LANGUAGES.map((lang: {id: string}) => lang.id)
);

export const ALLOWED_CLIENT_TYPE = ['Android', 'Web'];

export const ALLOWED_BROWSER_TYPE = [
  'Chrome', 'Edge', 'Safari', 'Firefox', 'Others'];

export const APP_VERSION_REGEXP = /^\d+(?:\.\d+)*$/;

export const ALLOWED_OP_FOR_TYPE = {
  [PlatformParameterFilterType.ServerMode]: ['='],
  [PlatformParameterFilterType.UserLocale]: ['='],
  [PlatformParameterFilterType.ClientType]: ['='],
  [PlatformParameterFilterType.BrowserType]: ['='],
  [PlatformParameterFilterType.AppVersion]: ['=', '<', '>', '<=', '>='],
};

export interface PlatformParameterFilterBackendDict {
    'type': PlatformParameterFilterType;
    'conditions': Array<[string, string]>;
}

export class PlatformParameterFilter {
  type: PlatformParameterFilterType;
  conditions: Array<[string, string]>;

  constructor(
      type: PlatformParameterFilterType, conditions: Array<[string, string]>) {
    this.type = type;
    this.conditions = conditions;
  }

  /**
   * Creates a dict representation of the instance.
   *
   * @returns {PlatformParameterFilterBackendDict} - The dict representation
   * of the instance.
   */
  toBackendDict(): PlatformParameterFilterBackendDict {
    return {
      type: this.type,
      conditions: cloneDeep(this.conditions)
    };
  }

  /**
   * Validates the PlatformParameterFilter instance.
   *
   * @returns {string[]} The issue messages found during validation, if any.
   */
  validate(): string[] {
    const issues = [];

    for (const [op, _] of this.conditions) {
      if (!ALLOWED_OP_FOR_TYPE[this.type].includes(op)) {
        issues.push(
          `Unsupported comparison operator '${op}' for ${this.type} filter, ` +
          `expected one of [${ALLOWED_OP_FOR_TYPE[this.type]}]`);
      }
    }

    switch (this.type) {
      case PlatformParameterFilterType.ServerMode:
        for (const [_, value] of this.conditions) {
          if (!ALLOWED_SERVER_MODE.includes(value)) {
            issues.push(
              `Invalid server mode value, got '${value}' but expected one of` +
              ` [${ALLOWED_SERVER_MODE}]`);
          }
        }
        break;
      case PlatformParameterFilterType.UserLocale:
        for (const [_, value] of this.conditions) {
          if (!SUPPORTED_SITE_LANGUAGE_IDS.includes(value)) {
            issues.push(
              `Invalid user locale value, got '${value}' but expected one of` +
              ` [${SUPPORTED_SITE_LANGUAGE_IDS}]`);
          }
        }
        break;
      case PlatformParameterFilterType.ClientType:
        for (const [_, value] of this.conditions) {
          if (!ALLOWED_CLIENT_TYPE.includes(value)) {
            issues.push(
              `Invalid client type value, got '${value}' but expected one of` +
              ` [${ALLOWED_CLIENT_TYPE}]`);
          }
        }
        break;
      case PlatformParameterFilterType.BrowserType:
        for (const [_, value] of this.conditions) {
          if (!ALLOWED_BROWSER_TYPE.includes(value)) {
            issues.push(
              `Invalid browser type value, got '${value}' but expected one` +
              ` of [${ALLOWED_BROWSER_TYPE}]`);
          }
        }
        break;
      case PlatformParameterFilterType.AppVersion:
        for (const [_, value] of this.conditions) {
          if (!APP_VERSION_REGEXP.test(value)) {
            issues.push(
              `Invalid app version value, got '${value}' but expected to` +
              ` match regexp '${APP_VERSION_REGEXP}'`);
          }
        }
        break;
    }

    return issues;
  }
}

@Injectable({
  providedIn: 'root'
})
export class PlatformParameterFilterObjectFactory {
  createFromBackendDict(
      platformParameterFiliterBackendDict: PlatformParameterFilterBackendDict):
      PlatformParameterFilter {
    return new PlatformParameterFilter(
      platformParameterFiliterBackendDict.type,
      platformParameterFiliterBackendDict.conditions);
  }
}

angular.module('oppia').factory(
  'PlatformParameterFilterObjectFactory',
  downgradeInjectable(PlatformParameterFilterObjectFactory));
