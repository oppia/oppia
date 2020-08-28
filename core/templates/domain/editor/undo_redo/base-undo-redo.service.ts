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
 * @fileoverview Service which maintains a stack of changes to a domain object.
 * Changes may be undone, redone, or replaced.
 */

import { EventEmitter } from '@angular/core';

/**
 * Stores a stack of changes to a domain object. Please note that only one
 * instance of this service exists at a time, so multiple undo/redo stacks are
 * not currently supported.
 */
angular.module('oppia').factory('BaseUndoRedoService', [
  function() {
    var BaseUndoRedoService = {};

    this._appliedChanges = [];
    this._undoneChanges = [];
    var _undoRedoChangeEventEmitter = new EventEmitter();

    var _dispatchMutation = () => {
      _undoRedoChangeEventEmitter.emit();
    };
    var _applyChange = (changeObject, domainObject) => {
      changeObject.applyChange(domainObject);
      _dispatchMutation();
    };
    var _reverseChange = (changeObject, domainObject) => {
      changeObject.reverseChange(domainObject);
      _dispatchMutation();
    };

    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    BaseUndoRedoService['init'] = function() {
      /* eslint-enable dot-notation */
      this._appliedChanges = [];
      this._undoneChanges = [];
      _undoRedoChangeEventEmitter = new EventEmitter();
    };

    /**
     * Pushes a change domain object onto the change stack and applies it to the
     * provided domain object. When a new change is applied, all undone changes
     * are lost and cannot be redone. This will fire an event as defined by the
     * constant EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED.
     */
    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    BaseUndoRedoService['applyChange'] = function(changeObject, domainObject) {
    /* eslint-enable dot-notation */
      _applyChange(changeObject, domainObject);
      this._appliedChanges.push(changeObject);
      this._undoneChanges = [];
    };

    /**
     * Undoes the last change to the provided domain object. This function
     * returns false if there are no changes to undo, and true otherwise. This
     * will fire an event as defined by the constant
     * EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED.
     */
    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    BaseUndoRedoService['undoChange'] = function(domainObject) {
      /* eslint-enable dot-notation */
      if (this._appliedChanges.length !== 0) {
        var change = this._appliedChanges.pop();
        this._undoneChanges.push(change);
        _reverseChange(change, domainObject);
        return true;
      }
      return false;
    };

    /**
     * Reverses an undo for the given domain object. This function returns false
     * if there are no changes to redo, and true if otherwise. This will fire an
     * event as defined by the constant EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED.
     */
    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    BaseUndoRedoService['redoChange'] = function(domainObject) {
      /* eslint-enable dot-notation */
      if (this._undoneChanges.length !== 0) {
        var change = this._undoneChanges.pop();
        this._appliedChanges.push(change);
        _applyChange(change, domainObject);
        return true;
      }
      return false;
    };

    /**
     * Returns the current list of changes applied to the provided domain
     * object. This list will not contain undone actions. Changes to the
     * returned list will not be reflected in this service.
     */
    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    BaseUndoRedoService['getChangeList'] = function() {
      /* eslint-enable dot-notation */
      // TODO(bhenning): Consider integrating something like Immutable.js to
      // avoid the slice here and ensure the returned object is truly an
      // immutable copy.
      return this._appliedChanges.slice();
    };

    /**
     * Returns a list of commit dict updates representing all chosen changes in
     * this service. Changes to the returned list will not affect this service.
     * Furthermore, the returned list is ready to be sent to the backend.
     */
    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    BaseUndoRedoService['getCommittableChangeList'] = function() {
      /* eslint-enable dot-notation */
      var committableChangeList = [];
      for (var i = 0; i < this._appliedChanges.length; i++) {
        committableChangeList[i] =
          this._appliedChanges[i].getBackendChangeObject();
      }
      return committableChangeList;
    };

    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    BaseUndoRedoService['setChangeList'] = function(changeList) {
      /* eslint-enable dot-notation */
      this._appliedChanges = angular.copy(changeList);
    };

    /**
     * Returns the number of changes that have been applied to the domain
     * object.
     */
    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    BaseUndoRedoService['getChangeCount'] = function() {
      /* eslint-enable dot-notation */
      return this._appliedChanges.length;
    };

    /**
     * Returns whether this service has any applied changes.
     */
    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    BaseUndoRedoService['hasChanges'] = function() {
    /* eslint-enable dot-notation */
      return this._appliedChanges.length !== 0;
    };

    /**
     * Clears the change history. This does not reverse any of the changes
     * applied from applyChange() or redoChange(). This will fire an event as
     * defined by the constant EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED.
     */
    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    BaseUndoRedoService['clearChanges'] = function() {
      /* eslint-enable dot-notation */
      this._appliedChanges = [];
      this._undoneChanges = [];
      this._undoRedoChangeAppliedEventEmitter = new EventEmitter();
      _dispatchMutation();
    };

    /* eslint-disable dot-notation */
    BaseUndoRedoService['onUndoRedoChangeApplied'] = function() {
      /* eslint-enable dot-notation */
      return _undoRedoChangeEventEmitter;
    };

    return BaseUndoRedoService;
  }
]);
