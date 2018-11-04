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
 * @fileoverview Service which maintains a stack of changes to a domain object.
 * Changes may be undone, redone, or replaced.
 */

oppia.constant(
  'EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED', 'undoRedoServiceChangeApplied');

/**
 * Stores a stack of changes to a domain object. Please note that only one
 * instance of this service exists at a time, so multiple undo/redo stacks are
 * not currently supported.
 */
oppia.factory('UndoRedoService', [
  '$rootScope', 'EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED',
  function($rootScope, EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED) {
    var UndoRedoService = {};

    var _appliedChanges = [];
    var _undoneChanges = [];

    var _dispatchMutation = function() {
      $rootScope.$broadcast(EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED);
    };
    var _applyChange = function(changeObject, domainObject) {
      changeObject.applyChange(domainObject);
      _dispatchMutation();
    };
    var _reverseChange = function(changeObject, domainObject) {
      changeObject.reverseChange(domainObject);
      _dispatchMutation();
    };

    /**
     * Pushes a change domain object onto the change stack and applies it to the
     * provided domain object. When a new change is applied, all undone changes
     * are lost and cannot be redone. This will fire an event as defined by the
     * constant EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED.
     */
    UndoRedoService.applyChange = function(changeObject, domainObject) {
      _applyChange(changeObject, domainObject);
      _appliedChanges.push(changeObject);
      _undoneChanges = [];
    };

    /**
     * Undoes the last change to the provided domain object. This function
     * returns false if there are no changes to undo, and true otherwise. This
     * will fire an event as defined by the constant
     * EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED.
     */
    UndoRedoService.undoChange = function(domainObject) {
      if (_appliedChanges.length !== 0) {
        var change = _appliedChanges.pop();
        _undoneChanges.push(change);
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
    UndoRedoService.redoChange = function(domainObject) {
      if (_undoneChanges.length !== 0) {
        var change = _undoneChanges.pop();
        _appliedChanges.push(change);
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
    UndoRedoService.getChangeList = function() {
      // TODO(bhenning): Consider integrating something like Immutable.js to
      // avoid the slice here and ensure the returned object is truly an
      // immutable copy.
      return _appliedChanges.slice();
    };

    /**
     * Returns a list of commit dict updates representing all chosen changes in
     * this service. Changes to the returned list will not affect this service.
     * Furthermore, the returned list is ready to be sent to the backend.
     */
    UndoRedoService.getCommittableChangeList = function() {
      var committableChangeList = [];
      for (var i = 0; i < _appliedChanges.length; i++) {
        committableChangeList[i] = _appliedChanges[i].getBackendChangeObject();
      }
      return committableChangeList;
    };

    UndoRedoService.setChangeList = function(changeList) {
      _appliedChanges = angular.copy(changeList);
    };

    /**
     * Returns the number of changes that have been applied to the domain
     * object.
     */
    UndoRedoService.getChangeCount = function() {
      return _appliedChanges.length;
    };

    /**
     * Returns whether this service has any applied changes.
     */
    UndoRedoService.hasChanges = function() {
      return _appliedChanges.length !== 0;
    };

    /**
     * Clears the change history. This does not reverse any of the changes
     * applied from applyChange() or redoChange(). This will fire an event as
     * defined by the constant EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED.
     */
    UndoRedoService.clearChanges = function() {
      _appliedChanges = [];
      _undoneChanges = [];
      _dispatchMutation();
    };

    return UndoRedoService;
  }
]);
