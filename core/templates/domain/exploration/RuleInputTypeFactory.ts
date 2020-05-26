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
 * @fileoverview Factory to determine correct type of RuleInputs
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { IRuleInput } from 'domain/exploration/RuleObjectFactory';
import { INumberWithUnitsBackendDict } from
  'domain/objects/NumberWithUnitsObjectFactory';
import { IFractionDict } from
  'domain/objects/FractionObjectFactory.ts';
/* eslint-disable max-len */
import { INote } from 'extensions/interactions/MusicNotesInput/directives/music-notes-input-rules.service';
/* eslint-enable max-len */
import { IGraphBackendDict } from
  'extensions/interactions/GraphInput/directives/graph-detail.service';

@Injectable({
  providedIn: 'root'
})
export class RuleInputTypeFactory {
  _isGraph(variable: Object): variable is IGraphBackendDict {
    if (this._isString(variable) || this._isNumber(variable)) {
      return false;
    }

    return 'vertices' in variable;
  }

  _isNoteArray(variable: Object): variable is INote[] {
    if (Array.isArray(variable)) {
      if (variable.length === 0) {
        return true;
      }

      if (typeof variable[0] === 'string' || typeof variable[0] === 'number') {
        return false;
      }

      return 'readableNoteName' in variable[0];
    }

    return false;
  }

  _isNumberWithUnits(
      variable: Object): variable is INumberWithUnitsBackendDict {
    if (this._isString(variable) || this._isNumber(variable)) {
      return false;
    }

    return 'fraction' in variable;
  }

  _isFraction(variable: Object): variable is IFractionDict {
    if (this._isString(variable) || this._isNumber(variable)) {
      return false;
    }

    return 'numerator' in variable;
  }

  _isString(variable: Object): variable is string {
    return typeof variable === 'string';
  }

  _isNumber(variable: Object): variable is number {
    return typeof variable === 'number';
  }

  _isStringArray(variable: Object): variable is string[] {
    return (Array.isArray(variable) && (
      variable.length === 0 || typeof variable[0] === 'string'));
  }

  _isStringArrayArray(variable: Object): variable is string[][] {
    return (Array.isArray(variable) && (
      variable.length === 0 || (Array.isArray(variable[0]) && (
        variable[0].length === 0 || typeof variable[0][0] === 'string'))));
  }

  _isNumberArray(variable: Object): variable is number[] {
    return (Array.isArray(variable) && (
      variable.length === 0 || typeof variable[0] === 'number'));
  }

  graphInstance(variable: IRuleInput): IGraphBackendDict {
    if (this._isGraph(variable)) {
      return variable;
    }
  }

  notesInstance(variable: IRuleInput): INote[] {
    if (this._isNoteArray(variable)) {
      return variable;
    }
  }

  numberWithUnitsInstance(variable: IRuleInput): INumberWithUnitsBackendDict {
    if (this._isNumberWithUnits(variable)) {
      return variable;
    }
  }

  fractionInstance(variable: IRuleInput): IFractionDict {
    if (this._isFraction(variable)) {
      return variable;
    }
  }

  stringInstance(variable: IRuleInput): string {
    if (this._isString(variable)) {
      return variable;
    }
  }

  numberInstance(variable: IRuleInput): number {
    if (this._isNumber(variable)) {
      return variable;
    }
  }

  stringArrayInstance(variable: IRuleInput): string[] {
    if (this._isStringArray(variable)) {
      return variable;
    }
  }

  stringArrayArrayInstance(variable: IRuleInput): string[][] {
    if (this._isStringArrayArray(variable)) {
      return variable;
    }
  }

  numberArrayInstance(variable: IRuleInput): number[] {
    if (this._isNumberArray(variable)) {
      return variable;
    }
  }
}

angular.module('oppia').factory('RuleInputTypeFactory',
  downgradeInjectable(RuleInputTypeFactory));
