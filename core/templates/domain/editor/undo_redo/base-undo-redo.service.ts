// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview class which maintains a stack of changes to a domain object.
 * Changes may be undone, redone, or replaced.
 */

import { EventEmitter } from '@angular/core';

import { BackendChangeObject, Change, DomainObject } from './change.model';

/**
 * Stores a stack of changes to a domain object. Please note that only one
 * instance of this class exists at a time, so multiple undo/redo stacks are
 * not currently supported.
 */
export class BaseUndoRedo {
  constructor() {
    this.init();
  }

  private _appliedChanges: Change[] = [];
  private _undoneChanges: Change[] = [];
  _undoRedoChangeEventEmitter: EventEmitter<void> = new EventEmitter();

  private _dispatchMutation(): void {
    this._undoRedoChangeEventEmitter.emit();
  }

  private _applyChange(
      Change: Change, domainObject: DomainObject): void {
    Change.applyChange(domainObject);
    this._dispatchMutation();
  }

  private _reverseChange(
      Change: Change, domainObject: DomainObject): void {
    Change.reverseChange(domainObject);
    this._dispatchMutation();
  }

  init(): void {
    this._appliedChanges = [];
    this._undoneChanges = [];
  }

  /**
   * Pushes a change domain object onto the change stack and applies it to the
   * provided domain object. When a new change is applied, all undone changes
   * are lost and cannot be redone. This fires mutation event.
   */
  applyChange(change: Change, domainObject: DomainObject): void {
    this._applyChange(change, domainObject);
    this._appliedChanges.push(change);
    this._undoneChanges = [];
  }

  /**
   * Undoes the last change to the provided domain object. This function
   * returns false if there are no changes to undo, and true otherwise. This
   * fires mutation event.
   */
  undoChange(domainObject: DomainObject): boolean {
    var change = this._appliedChanges.pop();
    if (change !== undefined) {
      this._undoneChanges.push(change);
      this._reverseChange(change, domainObject);
      return true;
    }
    return false;
  }

  /**
   * Returns the current list of changes applied to the provided domain
   * object. This list will not contain undone actions. Changes to the
   * returned list will not be reflected in this class instance.
   */
  redoChange(domainObject: DomainObject): boolean {
    var change = this._undoneChanges.pop();
    if (change !== undefined) {
      this._appliedChanges.push(change);
      this._applyChange(change, domainObject);
      return true;
    }
    return false;
  }

  /**
   * Returns the current list of changes applied to the provided domain
   * object. This list will not contain undone actions. Changes to the
   * returned list will not be reflected in this class instance.
   */
  getChangeList(): Change[] {
    // TODO(bhenning): Consider integrating something like Immutable.js to
    // avoid the slice here and ensure the returned object is truly an
    // immutable copy.
    return this._appliedChanges.slice();
  }

  /**
   * Returns a list of commit dict updates representing all chosen changes in
   * this class instance. Changes to the returned list will not affect this
   * instance. Furthermore, the returned list is ready to be sent to the
   * backend.
   */
  getCommittableChangeList(): BackendChangeObject[] {
    const committableChangeList: BackendChangeObject[] = [];
    for (let i = 0; i < this._appliedChanges.length; i++) {
      committableChangeList[i] =
        this._appliedChanges[i].getBackendChangeObject();
    }
    return committableChangeList;
  }

  setChangeList(changeList: Change[]): void {
    this._appliedChanges = changeList;
  }

  /**
   * Returns the number of changes that have been applied to the domain
   * object.
   */
  getChangeCount(): number {
    return this._appliedChanges.length;
  }

  /**
   * Returns whether this object has any applied changes.
   */
  hasChanges(): boolean {
    return this._appliedChanges.length !== 0;
  }

  /**
   * Clears the change history. This does not reverse any of the changes
   * applied from applyChange() or redoChange(). This fires mutation event.
   */
  clearChanges(): void {
    this._appliedChanges = [];
    this._undoneChanges = [];
    this._dispatchMutation();
  }

  getUndoRedoChangeEventEmitter(): EventEmitter<void> {
    return this._undoRedoChangeEventEmitter;
  }
}
