// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating instances of exploration metadata objects.
 */

import {Injectable} from '@angular/core';
import {ParamChange, ParamChangeBackendDict} from './ParamChangeObjectFactory';
import {ParamChangesObjectFactory} from './ParamChangesObjectFactory';
import {
  ParamSpecs,
  ParamSpecsBackendDict,
  ParamSpecsObjectFactory,
} from './ParamSpecsObjectFactory';

export interface ExplorationMetadataBackendDict {
  title: string;
  category: string;
  objective: string;
  language_code: string;
  tags: string[];
  blurb: string;
  author_notes: string;
  states_schema_version: number;
  init_state_name: string;
  param_specs: ParamSpecsBackendDict;
  param_changes: ParamChangeBackendDict[];
  auto_tts_enabled: boolean;
  edits_allowed: boolean;
}

export class ExplorationMetadata {
  /**
   * The properties of this domain object are required to be synced with the
   * properties mentioned in constants.METADATA_PROPERTIES. If you have
   * modified constants.METADATA_PROPERTIES, make sure to include them here
   * also or the frontend tests will fail.
   */
  _title: string;
  _category: string;
  _objective: string;
  _languageCode: string;
  _tags: string[];
  _blurb: string;
  _authorNotes: string;
  _statesSchemaVersion: number;
  _initStateName: string;
  _paramSpecs: ParamSpecs;
  _paramChanges: ParamChange[];
  _autoTtsEnabled: boolean;
  _editsAllowed: boolean;

  constructor(
    title: string,
    category: string,
    objective: string,
    languageCode: string,
    tags: string[],
    blurb: string,
    authorNotes: string,
    statesSchemaVersion: number,
    initStateName: string,
    paramSpecs: ParamSpecs,
    paramChanges: ParamChange[],
    autoTtsEnabled: boolean,
    editsAllowed: boolean
  ) {
    this._title = title;
    this._category = category;
    this._objective = objective;
    this._languageCode = languageCode;
    this._tags = tags;
    this._blurb = blurb;
    this._authorNotes = authorNotes;
    this._statesSchemaVersion = statesSchemaVersion;
    this._initStateName = initStateName;
    this._paramSpecs = paramSpecs;
    this._paramChanges = paramChanges;
    this._autoTtsEnabled = autoTtsEnabled;
    this._editsAllowed = editsAllowed;
  }

  toBackendDict(): ExplorationMetadataBackendDict {
    return {
      title: this._title,
      category: this._category,
      objective: this._objective,
      language_code: this._languageCode,
      tags: this._tags,
      blurb: this._blurb,
      author_notes: this._authorNotes,
      states_schema_version: this._statesSchemaVersion,
      init_state_name: this._initStateName,
      param_specs: this._paramSpecs.toBackendDict(),
      param_changes: this._paramChanges.map(paramChange =>
        paramChange.toBackendDict()
      ),
      auto_tts_enabled: this._autoTtsEnabled,
      edits_allowed: this._editsAllowed,
    };
  }
}

// TODO(#15599): Refactor ExplorationMetadataObjectFactory to a model.ts once
// ParamSpecsObjectFactory and ParamChangesObjectFactory are refactored
// into model.ts files.
@Injectable({
  providedIn: 'root',
})
export class ExplorationMetadataObjectFactory {
  constructor(
    private paramChangesObjectFactory: ParamChangesObjectFactory,
    private paramSpecsObjectFactory: ParamSpecsObjectFactory
  ) {}

  createFromBackendDict(
    explorationMetadataBackendDict: ExplorationMetadataBackendDict
  ): ExplorationMetadata {
    const paramChanges = this.paramChangesObjectFactory.createFromBackendList(
      explorationMetadataBackendDict.param_changes
    );
    const paramSpecs = this.paramSpecsObjectFactory.createFromBackendDict(
      explorationMetadataBackendDict.param_specs
    );

    return new ExplorationMetadata(
      explorationMetadataBackendDict.title,
      explorationMetadataBackendDict.category,
      explorationMetadataBackendDict.objective,
      explorationMetadataBackendDict.language_code,
      explorationMetadataBackendDict.tags,
      explorationMetadataBackendDict.blurb,
      explorationMetadataBackendDict.author_notes,
      explorationMetadataBackendDict.states_schema_version,
      explorationMetadataBackendDict.init_state_name,
      paramSpecs,
      paramChanges,
      explorationMetadataBackendDict.auto_tts_enabled,
      explorationMetadataBackendDict.edits_allowed
    );
  }
}
