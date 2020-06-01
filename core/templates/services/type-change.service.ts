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
 * @fileoverview Service to change the type of a variable. (for ts compiler)
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { INumberWithUnitsBackendDict } from
  'domain/objects/NumberWithUnitsObjectFactory';
import { IFractionDict } from
  'domain/objects/FractionObjectFactory.ts';
/* eslint-disable max-len */
import { INote } from 'extensions/interactions/MusicNotesInput/directives/music-notes-input-rules.service';
/* eslint-enable max-len */
import { IGraphBackendDict } from
  'extensions/interactions/GraphInput/directives/graph-detail.service';

/**
 * The purpose of this service is to change the type of any object to the
 * types listed here. This was needed because of the variables which could be
 * of many types.
 */

@Injectable({
  providedIn: 'root'
})
export class TypeChangeService {
  /**
   * These functions exist to make the ts compiler believe that the variable
   * is of the given type.
   */
  _changeToGraphBackendDict(variable: Object): variable is IGraphBackendDict {
    return true;
  }

  _changeToNoteArray(variable: Object): variable is INote[] {
    return true;
  }

  _changeToNumberWithUnitsBackendDict(
      variable: Object): variable is INumberWithUnitsBackendDict {
    return true;
  }

  _changeToFractionDict(variable: Object): variable is IFractionDict {
    return true;
  }

  _changeToString(variable: Object): variable is string {
    return true;
  }

  _changeToNumber(variable: Object): variable is number {
    return true;
  }

  _changeToStringArray(variable: Object): variable is string[] {
    return true;
  }

  _changeToStringArrayArray(variable: Object): variable is string[][] {
    return true;
  }

  _changeToNumberArray(variable: Object): variable is number[] {
    return true;
  }

  /**
   * These functions are the functions to be used to change the type of the
   * objects.
   */
  changeTypeToGraphBackendDict(variable: Object): IGraphBackendDict {
    if (this._changeToGraphBackendDict(variable)) {
      return variable;
    }
  }

  changeTypeToNoteArray(variable: Object): INote[] {
    if (this._changeToNoteArray(variable)) {
      return variable;
    }
  }

  changeTypeToNumberWithUnitsBackendDict(
      variable: Object): INumberWithUnitsBackendDict {
    if (this._changeToNumberWithUnitsBackendDict(variable)) {
      return variable;
    }
  }

  changeTypeToFractionDict(variable: Object): IFractionDict {
    if (this._changeToFractionDict(variable)) {
      return variable;
    }
  }

  changeTypeToString(variable: Object): string {
    if (this._changeToString(variable)) {
      return variable;
    }
  }

  changeTypeToNumber(variable: Object): number {
    if (this._changeToNumber(variable)) {
      return variable;
    }
  }

  changeTypeToStringArray(variable: Object): string[] {
    if (this._changeToStringArray(variable)) {
      return variable;
    }
  }

  changeTypeToStringArrayArray(variable: Object): string[][] {
    if (this._changeToStringArrayArray(variable)) {
      return variable;
    }
  }

  changeTypeToNumberArray(variable: Object): number[] {
    if (this._changeToNumberArray(variable)) {
      return variable;
    }
  }
}

angular.module('oppia').factory('TypeChangeService',
  downgradeInjectable(TypeChangeService));
