// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating instances of ExplorationDraft
 * domain objects.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

export interface IAddStateNameChangeList {
  'cmd': 'add_state';
  'state_name': string;
}

export interface IDeleteStateChangeList {
  'cmd': 'delete_state';
  'state_name': string;
}

export interface IEditExplorationPropertyChangeList {
  'cmd': 'edit_exploration_property';
  'new_value': Object;
  'old_value': Object;
  'property_name': string;
}

export interface IEditStatePropertyChangeList {
  'cmd': 'edit_state_property';
  'new_value': Object;
  'old_value': Object;
  'property_name': string;
  'state_name': string;
}

export interface IRenameStateChangeList {
  'cmd': 'rename_state';
  'new_state_name': string;
  'old_state_name': string;
}

export interface IRevertChangeList {
  'cmd': 'AUTO_revert_version_number';
  'version_number': number;
}

export interface ICreateChangeList {
  cmd: 'create_new';
  category: string;
  title: string;
}

export interface IMigrateStatesVersionChangeList {
  'cmd': 'migrate_states_schema_to_latest_version';
  'from_version': number;
  'to_version': number;
}

export type IExplorationChangeList = (
  IAddStateNameChangeList |
  IDeleteStateChangeList |
  IEditExplorationPropertyChangeList |
  IEditStatePropertyChangeList |
  IRenameStateChangeList |
  IRevertChangeList |
  ICreateChangeList |
  IMigrateStatesVersionChangeList);

export interface IExplorationDraftDict {
  draftChanges: IExplorationChangeList[];
  draftChangeListId: number
}

export class ExplorationDraft {
  draftChanges: IExplorationChangeList[];
  draftChangeListId: number;

  constructor(
      draftChanges: IExplorationChangeList[], draftChangeListId: number) {
    this.draftChanges = draftChanges;
    this.draftChangeListId = draftChangeListId;
  }
  /**
   * Checks whether the draft object has been overwritten by another
   * draft which has been committed to the back-end. If the supplied draft id
   * has a different value then a newer changeList must have been committed
   * to the back-end.
   * @param {Integer} - currentDraftId. The id of the draft changes whch was
   *  retrieved from the back-end.
   * @returns {Boolean} - True iff the currentDraftId is the same as the
   * draftChangeListId corresponding to this draft.
   */
  isValid(currentDraftId: number): boolean {
    return (currentDraftId === this.draftChangeListId);
  }

  getChanges(): IExplorationChangeList[] {
    return this.draftChanges;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ExplorationDraftObjectFactory {
  createFromLocalStorageDict(
      explorationDraftDict: IExplorationDraftDict): ExplorationDraft {
    return new ExplorationDraft(
      explorationDraftDict.draftChanges,
      explorationDraftDict.draftChangeListId);
  }
  toLocalStorageDict(
      changeList: IExplorationChangeList[],
      draftChangeListId: number): IExplorationDraftDict {
    return {
      draftChanges: changeList,
      draftChangeListId: draftChangeListId
    };
  }
}

angular.module('oppia').factory(
  'ExplorationDraftObjectFactory',
  downgradeInjectable(ExplorationDraftObjectFactory));
