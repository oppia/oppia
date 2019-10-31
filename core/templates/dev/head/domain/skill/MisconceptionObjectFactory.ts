// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Object factory for creating frontend instances of
 * misconceptions.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export class Misconception {
  _id: string;
  _name: string;
  _notes: string;
  _feedback: string;

  constructor(id: string, name: string, notes: string, feedback: string) {
    this._id = id;
    this._name = name;
    this._notes = notes;
    this._feedback = feedback;
  }

  toBackendDict(): {
    id: string; name: string; notes: string; feedback: string;} {
    return {
      id: this._id,
      name: this._name,
      notes: this._notes,
      feedback: this._feedback
    };
  }

  getId(): string {
    return this._id;
  }

  getName(): string {
    return this._name;
  }

  setName(newName: string): void {
    this._name = newName;
  }

  getNotes(): string {
    return this._notes;
  }

  setNotes(newNotes: string): void {
    this._notes = newNotes;
  }

  getFeedback(): string {
    return this._feedback;
  }

  setFeedback(newFeedback: string): void {
    this._feedback = newFeedback;
  }
}

@Injectable({
  providedIn: 'root'
})
export class MisconceptionObjectFactory {
  createFromBackendDict(misconceptionBackendDict: {
      id: string; name: string; notes: string; feedback: string;
    }): Misconception {
    return new Misconception(
      misconceptionBackendDict.id,
      misconceptionBackendDict.name,
      misconceptionBackendDict.notes,
      misconceptionBackendDict.feedback);
  }
  create(
      id: string, name: string, notes: string,
      feedback: string): Misconception {
    return new Misconception(id, name, notes, feedback);
  }
}

angular.module('oppia').factory(
  'MisconceptionObjectFactory',
  downgradeInjectable(MisconceptionObjectFactory));
