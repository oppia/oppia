(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["collection_editor~creator_dashboard~skill_editor~story_editor~topic_editor"],{

/***/ "./core/templates/dev/head/domain/editor/undo_redo/BaseUndoRedoService.ts":
/*!********************************************************************************!*\
  !*** ./core/templates/dev/head/domain/editor/undo_redo/BaseUndoRedoService.ts ***!
  \********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
oppia.constant('EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED', 'undoRedoServiceChangeApplied');
/**
 * Stores a stack of changes to a domain object. Please note that only one
 * instance of this service exists at a time, so multiple undo/redo stacks are
 * not currently supported.
 */
oppia.factory('BaseUndoRedoService', [
    '$rootScope', 'EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED',
    function ($rootScope, EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED) {
        var BaseUndoRedoService = {};
        this._appliedChanges = [];
        this._undoneChanges = [];
        var _dispatchMutation = function () {
            $rootScope.$broadcast(EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED);
        };
        var _applyChange = function (changeObject, domainObject) {
            changeObject.applyChange(domainObject);
            _dispatchMutation();
        };
        var _reverseChange = function (changeObject, domainObject) {
            changeObject.reverseChange(domainObject);
            _dispatchMutation();
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        BaseUndoRedoService['init'] = function () {
            /* eslint-enable dot-notation */
            this._appliedChanges = [];
            this._undoneChanges = [];
        };
        /**
         * Pushes a change domain object onto the change stack and applies it to the
         * provided domain object. When a new change is applied, all undone changes
         * are lost and cannot be redone. This will fire an event as defined by the
         * constant EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED.
         */
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        BaseUndoRedoService['applyChange'] = function (changeObject, domainObject) {
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
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        BaseUndoRedoService['undoChange'] = function (domainObject) {
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
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        BaseUndoRedoService['redoChange'] = function (domainObject) {
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
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        BaseUndoRedoService['getChangeList'] = function () {
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
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        BaseUndoRedoService['getCommittableChangeList'] = function () {
            /* eslint-enable dot-notation */
            var committableChangeList = [];
            for (var i = 0; i < this._appliedChanges.length; i++) {
                committableChangeList[i] =
                    this._appliedChanges[i].getBackendChangeObject();
            }
            return committableChangeList;
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        BaseUndoRedoService['setChangeList'] = function (changeList) {
            /* eslint-enable dot-notation */
            this._appliedChanges = angular.copy(changeList);
        };
        /**
         * Returns the number of changes that have been applied to the domain
         * object.
         */
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        BaseUndoRedoService['getChangeCount'] = function () {
            /* eslint-enable dot-notation */
            return this._appliedChanges.length;
        };
        /**
         * Returns whether this service has any applied changes.
         */
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        BaseUndoRedoService['hasChanges'] = function () {
            /* eslint-enable dot-notation */
            return this._appliedChanges.length !== 0;
        };
        /**
         * Clears the change history. This does not reverse any of the changes
         * applied from applyChange() or redoChange(). This will fire an event as
         * defined by the constant EVENT_UNDO_REDO_SERVICE_CHANGE_APPLIED.
         */
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        BaseUndoRedoService['clearChanges'] = function () {
            /* eslint-enable dot-notation */
            this._appliedChanges = [];
            this._undoneChanges = [];
            _dispatchMutation();
        };
        return BaseUndoRedoService;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/editor/undo_redo/ChangeObjectFactory.ts":
/*!********************************************************************************!*\
  !*** ./core/templates/dev/head/domain/editor/undo_redo/ChangeObjectFactory.ts ***!
  \********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating and mutating instances of frontend change
 * domain objects. This frontend object represents both CollectionChange and
 * ExplorationChange backend domain objects.
 */
// TODO(bhenning): Consolidate the backend ExplorationChange and
// CollectionChange domain objects.
oppia.factory('ChangeObjectFactory', [function () {
        var Change = function (backendChangeObject, applyChangeToObject, reverseChangeToObject) {
            this._backendChangeObject = angular.copy(backendChangeObject);
            this._applyChangeToObject = applyChangeToObject;
            this._reverseChangeToObject = reverseChangeToObject;
        };
        // Instance methods
        // Returns the JSON object which represents a backend python dict of this
        // change. Changes to this object are not reflected in this domain object.
        Change.prototype.getBackendChangeObject = function () {
            return angular.copy(this._backendChangeObject);
        };
        Change.prototype.setBackendChangeObject = function (backendChangeObject) {
            return this._backendChangeObject = angular.copy(backendChangeObject);
        };
        // Applies this change to the related object (such as a frontend collection
        // domain object).
        Change.prototype.applyChange = function (domainObject) {
            this._applyChangeToObject(this._backendChangeObject, domainObject);
        };
        // Reverse-applies this change to the related object (such as a frontend
        // collection domain object). This method should only be used to reverse a
        // change that was previously applied by calling the applyChange() method.
        Change.prototype.reverseChange = function (domainObject) {
            this._reverseChangeToObject(this._backendChangeObject, domainObject);
        };
        // Static class methods. Note that "this" is not available in static
        // contexts. The first parameter is a JSON representation of a backend
        // python dict for the given change. The second parameter is a callback
        // which will receive both the backend change object dictionary (as
        // read-only) and the domain object in which to apply the change. The third
        // parameter is a callback which behaves in the same way as the second
        // parameter and takes the same inputs, except it should reverse the change
        // for the provided domain object.
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        Change['create'] = function (
        /* eslint-enable dot-notation */
        backendChangeObject, applyChangeToObject, reverseChangeToObject) {
            return new Change(backendChangeObject, applyChangeToObject, reverseChangeToObject);
        };
        return Change;
    }]);


/***/ }),

/***/ "./core/templates/dev/head/domain/editor/undo_redo/UndoRedoService.ts":
/*!****************************************************************************!*\
  !*** ./core/templates/dev/head/domain/editor/undo_redo/UndoRedoService.ts ***!
  \****************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
__webpack_require__(/*! domain/editor/undo_redo/BaseUndoRedoService.ts */ "./core/templates/dev/head/domain/editor/undo_redo/BaseUndoRedoService.ts");
oppia.factory('UndoRedoService', [
    'BaseUndoRedoService', function (BaseUndoRedoService) {
        var child = Object.create(BaseUndoRedoService);
        child.init();
        return child;
    }
]);


/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vZWRpdG9yL3VuZG9fcmVkby9CYXNlVW5kb1JlZG9TZXJ2aWNlLnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9lZGl0b3IvdW5kb19yZWRvL0NoYW5nZU9iamVjdEZhY3RvcnkudHMiLCJ3ZWJwYWNrOi8vLy4vY29yZS90ZW1wbGF0ZXMvZGV2L2hlYWQvZG9tYWluL2VkaXRvci91bmRvX3JlZG8vVW5kb1JlZG9TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQixpQ0FBaUM7QUFDNUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQ3RLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7Ozs7Ozs7Ozs7O0FDOURMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyxnSUFBZ0Q7QUFDeEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiY29sbGVjdGlvbl9lZGl0b3J+Y3JlYXRvcl9kYXNoYm9hcmR+c2tpbGxfZWRpdG9yfnN0b3J5X2VkaXRvcn50b3BpY19lZGl0b3IuYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBTZXJ2aWNlIHdoaWNoIG1haW50YWlucyBhIHN0YWNrIG9mIGNoYW5nZXMgdG8gYSBkb21haW4gb2JqZWN0LlxuICogQ2hhbmdlcyBtYXkgYmUgdW5kb25lLCByZWRvbmUsIG9yIHJlcGxhY2VkLlxuICovXG5vcHBpYS5jb25zdGFudCgnRVZFTlRfVU5ET19SRURPX1NFUlZJQ0VfQ0hBTkdFX0FQUExJRUQnLCAndW5kb1JlZG9TZXJ2aWNlQ2hhbmdlQXBwbGllZCcpO1xuLyoqXG4gKiBTdG9yZXMgYSBzdGFjayBvZiBjaGFuZ2VzIHRvIGEgZG9tYWluIG9iamVjdC4gUGxlYXNlIG5vdGUgdGhhdCBvbmx5IG9uZVxuICogaW5zdGFuY2Ugb2YgdGhpcyBzZXJ2aWNlIGV4aXN0cyBhdCBhIHRpbWUsIHNvIG11bHRpcGxlIHVuZG8vcmVkbyBzdGFja3MgYXJlXG4gKiBub3QgY3VycmVudGx5IHN1cHBvcnRlZC5cbiAqL1xub3BwaWEuZmFjdG9yeSgnQmFzZVVuZG9SZWRvU2VydmljZScsIFtcbiAgICAnJHJvb3RTY29wZScsICdFVkVOVF9VTkRPX1JFRE9fU0VSVklDRV9DSEFOR0VfQVBQTElFRCcsXG4gICAgZnVuY3Rpb24gKCRyb290U2NvcGUsIEVWRU5UX1VORE9fUkVET19TRVJWSUNFX0NIQU5HRV9BUFBMSUVEKSB7XG4gICAgICAgIHZhciBCYXNlVW5kb1JlZG9TZXJ2aWNlID0ge307XG4gICAgICAgIHRoaXMuX2FwcGxpZWRDaGFuZ2VzID0gW107XG4gICAgICAgIHRoaXMuX3VuZG9uZUNoYW5nZXMgPSBbXTtcbiAgICAgICAgdmFyIF9kaXNwYXRjaE11dGF0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEVWRU5UX1VORE9fUkVET19TRVJWSUNFX0NIQU5HRV9BUFBMSUVEKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIF9hcHBseUNoYW5nZSA9IGZ1bmN0aW9uIChjaGFuZ2VPYmplY3QsIGRvbWFpbk9iamVjdCkge1xuICAgICAgICAgICAgY2hhbmdlT2JqZWN0LmFwcGx5Q2hhbmdlKGRvbWFpbk9iamVjdCk7XG4gICAgICAgICAgICBfZGlzcGF0Y2hNdXRhdGlvbigpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgX3JldmVyc2VDaGFuZ2UgPSBmdW5jdGlvbiAoY2hhbmdlT2JqZWN0LCBkb21haW5PYmplY3QpIHtcbiAgICAgICAgICAgIGNoYW5nZU9iamVjdC5yZXZlcnNlQ2hhbmdlKGRvbWFpbk9iamVjdCk7XG4gICAgICAgICAgICBfZGlzcGF0Y2hNdXRhdGlvbigpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBCYXNlVW5kb1JlZG9TZXJ2aWNlWydpbml0J10gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICAgICAgdGhpcy5fYXBwbGllZENoYW5nZXMgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX3VuZG9uZUNoYW5nZXMgPSBbXTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFB1c2hlcyBhIGNoYW5nZSBkb21haW4gb2JqZWN0IG9udG8gdGhlIGNoYW5nZSBzdGFjayBhbmQgYXBwbGllcyBpdCB0byB0aGVcbiAgICAgICAgICogcHJvdmlkZWQgZG9tYWluIG9iamVjdC4gV2hlbiBhIG5ldyBjaGFuZ2UgaXMgYXBwbGllZCwgYWxsIHVuZG9uZSBjaGFuZ2VzXG4gICAgICAgICAqIGFyZSBsb3N0IGFuZCBjYW5ub3QgYmUgcmVkb25lLiBUaGlzIHdpbGwgZmlyZSBhbiBldmVudCBhcyBkZWZpbmVkIGJ5IHRoZVxuICAgICAgICAgKiBjb25zdGFudCBFVkVOVF9VTkRPX1JFRE9fU0VSVklDRV9DSEFOR0VfQVBQTElFRC5cbiAgICAgICAgICovXG4gICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIEJhc2VVbmRvUmVkb1NlcnZpY2VbJ2FwcGx5Q2hhbmdlJ10gPSBmdW5jdGlvbiAoY2hhbmdlT2JqZWN0LCBkb21haW5PYmplY3QpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICBfYXBwbHlDaGFuZ2UoY2hhbmdlT2JqZWN0LCBkb21haW5PYmplY3QpO1xuICAgICAgICAgICAgdGhpcy5fYXBwbGllZENoYW5nZXMucHVzaChjaGFuZ2VPYmplY3QpO1xuICAgICAgICAgICAgdGhpcy5fdW5kb25lQ2hhbmdlcyA9IFtdO1xuICAgICAgICB9O1xuICAgICAgICAvKipcbiAgICAgICAgICogVW5kb2VzIHRoZSBsYXN0IGNoYW5nZSB0byB0aGUgcHJvdmlkZWQgZG9tYWluIG9iamVjdC4gVGhpcyBmdW5jdGlvblxuICAgICAgICAgKiByZXR1cm5zIGZhbHNlIGlmIHRoZXJlIGFyZSBubyBjaGFuZ2VzIHRvIHVuZG8sIGFuZCB0cnVlIG90aGVyd2lzZS4gVGhpc1xuICAgICAgICAgKiB3aWxsIGZpcmUgYW4gZXZlbnQgYXMgZGVmaW5lZCBieSB0aGUgY29uc3RhbnRcbiAgICAgICAgICogRVZFTlRfVU5ET19SRURPX1NFUlZJQ0VfQ0hBTkdFX0FQUExJRUQuXG4gICAgICAgICAqL1xuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBCYXNlVW5kb1JlZG9TZXJ2aWNlWyd1bmRvQ2hhbmdlJ10gPSBmdW5jdGlvbiAoZG9tYWluT2JqZWN0KSB7XG4gICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICAgICAgaWYgKHRoaXMuX2FwcGxpZWRDaGFuZ2VzLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgIHZhciBjaGFuZ2UgPSB0aGlzLl9hcHBsaWVkQ2hhbmdlcy5wb3AoKTtcbiAgICAgICAgICAgICAgICB0aGlzLl91bmRvbmVDaGFuZ2VzLnB1c2goY2hhbmdlKTtcbiAgICAgICAgICAgICAgICBfcmV2ZXJzZUNoYW5nZShjaGFuZ2UsIGRvbWFpbk9iamVjdCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXZlcnNlcyBhbiB1bmRvIGZvciB0aGUgZ2l2ZW4gZG9tYWluIG9iamVjdC4gVGhpcyBmdW5jdGlvbiByZXR1cm5zIGZhbHNlXG4gICAgICAgICAqIGlmIHRoZXJlIGFyZSBubyBjaGFuZ2VzIHRvIHJlZG8sIGFuZCB0cnVlIGlmIG90aGVyd2lzZS4gVGhpcyB3aWxsIGZpcmUgYW5cbiAgICAgICAgICogZXZlbnQgYXMgZGVmaW5lZCBieSB0aGUgY29uc3RhbnQgRVZFTlRfVU5ET19SRURPX1NFUlZJQ0VfQ0hBTkdFX0FQUExJRUQuXG4gICAgICAgICAqL1xuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBCYXNlVW5kb1JlZG9TZXJ2aWNlWydyZWRvQ2hhbmdlJ10gPSBmdW5jdGlvbiAoZG9tYWluT2JqZWN0KSB7XG4gICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICAgICAgaWYgKHRoaXMuX3VuZG9uZUNoYW5nZXMubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNoYW5nZSA9IHRoaXMuX3VuZG9uZUNoYW5nZXMucG9wKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fYXBwbGllZENoYW5nZXMucHVzaChjaGFuZ2UpO1xuICAgICAgICAgICAgICAgIF9hcHBseUNoYW5nZShjaGFuZ2UsIGRvbWFpbk9iamVjdCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm5zIHRoZSBjdXJyZW50IGxpc3Qgb2YgY2hhbmdlcyBhcHBsaWVkIHRvIHRoZSBwcm92aWRlZCBkb21haW5cbiAgICAgICAgICogb2JqZWN0LiBUaGlzIGxpc3Qgd2lsbCBub3QgY29udGFpbiB1bmRvbmUgYWN0aW9ucy4gQ2hhbmdlcyB0byB0aGVcbiAgICAgICAgICogcmV0dXJuZWQgbGlzdCB3aWxsIG5vdCBiZSByZWZsZWN0ZWQgaW4gdGhpcyBzZXJ2aWNlLlxuICAgICAgICAgKi9cbiAgICAgICAgLy8gVE9ETyAoYW5raXRhMjQwNzk2KSBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgQmFzZVVuZG9SZWRvU2VydmljZVsnZ2V0Q2hhbmdlTGlzdCddID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgICAgIC8vIFRPRE8oYmhlbm5pbmcpOiBDb25zaWRlciBpbnRlZ3JhdGluZyBzb21ldGhpbmcgbGlrZSBJbW11dGFibGUuanMgdG9cbiAgICAgICAgICAgIC8vIGF2b2lkIHRoZSBzbGljZSBoZXJlIGFuZCBlbnN1cmUgdGhlIHJldHVybmVkIG9iamVjdCBpcyB0cnVseSBhblxuICAgICAgICAgICAgLy8gaW1tdXRhYmxlIGNvcHkuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fYXBwbGllZENoYW5nZXMuc2xpY2UoKTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybnMgYSBsaXN0IG9mIGNvbW1pdCBkaWN0IHVwZGF0ZXMgcmVwcmVzZW50aW5nIGFsbCBjaG9zZW4gY2hhbmdlcyBpblxuICAgICAgICAgKiB0aGlzIHNlcnZpY2UuIENoYW5nZXMgdG8gdGhlIHJldHVybmVkIGxpc3Qgd2lsbCBub3QgYWZmZWN0IHRoaXMgc2VydmljZS5cbiAgICAgICAgICogRnVydGhlcm1vcmUsIHRoZSByZXR1cm5lZCBsaXN0IGlzIHJlYWR5IHRvIGJlIHNlbnQgdG8gdGhlIGJhY2tlbmQuXG4gICAgICAgICAqL1xuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBCYXNlVW5kb1JlZG9TZXJ2aWNlWydnZXRDb21taXR0YWJsZUNoYW5nZUxpc3QnXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICB2YXIgY29tbWl0dGFibGVDaGFuZ2VMaXN0ID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX2FwcGxpZWRDaGFuZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29tbWl0dGFibGVDaGFuZ2VMaXN0W2ldID1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYXBwbGllZENoYW5nZXNbaV0uZ2V0QmFja2VuZENoYW5nZU9iamVjdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvbW1pdHRhYmxlQ2hhbmdlTGlzdDtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gVE9ETyAoYW5raXRhMjQwNzk2KSBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgQmFzZVVuZG9SZWRvU2VydmljZVsnc2V0Q2hhbmdlTGlzdCddID0gZnVuY3Rpb24gKGNoYW5nZUxpc3QpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICB0aGlzLl9hcHBsaWVkQ2hhbmdlcyA9IGFuZ3VsYXIuY29weShjaGFuZ2VMaXN0KTtcbiAgICAgICAgfTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJldHVybnMgdGhlIG51bWJlciBvZiBjaGFuZ2VzIHRoYXQgaGF2ZSBiZWVuIGFwcGxpZWQgdG8gdGhlIGRvbWFpblxuICAgICAgICAgKiBvYmplY3QuXG4gICAgICAgICAqL1xuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBCYXNlVW5kb1JlZG9TZXJ2aWNlWydnZXRDaGFuZ2VDb3VudCddID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9hcHBsaWVkQ2hhbmdlcy5sZW5ndGg7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm5zIHdoZXRoZXIgdGhpcyBzZXJ2aWNlIGhhcyBhbnkgYXBwbGllZCBjaGFuZ2VzLlxuICAgICAgICAgKi9cbiAgICAgICAgLy8gVE9ETyAoYW5raXRhMjQwNzk2KSBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgQmFzZVVuZG9SZWRvU2VydmljZVsnaGFzQ2hhbmdlcyddID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9hcHBsaWVkQ2hhbmdlcy5sZW5ndGggIT09IDA7XG4gICAgICAgIH07XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDbGVhcnMgdGhlIGNoYW5nZSBoaXN0b3J5LiBUaGlzIGRvZXMgbm90IHJldmVyc2UgYW55IG9mIHRoZSBjaGFuZ2VzXG4gICAgICAgICAqIGFwcGxpZWQgZnJvbSBhcHBseUNoYW5nZSgpIG9yIHJlZG9DaGFuZ2UoKS4gVGhpcyB3aWxsIGZpcmUgYW4gZXZlbnQgYXNcbiAgICAgICAgICogZGVmaW5lZCBieSB0aGUgY29uc3RhbnQgRVZFTlRfVU5ET19SRURPX1NFUlZJQ0VfQ0hBTkdFX0FQUExJRUQuXG4gICAgICAgICAqL1xuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBCYXNlVW5kb1JlZG9TZXJ2aWNlWydjbGVhckNoYW5nZXMnXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICB0aGlzLl9hcHBsaWVkQ2hhbmdlcyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5fdW5kb25lQ2hhbmdlcyA9IFtdO1xuICAgICAgICAgICAgX2Rpc3BhdGNoTXV0YXRpb24oKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIEJhc2VVbmRvUmVkb1NlcnZpY2U7XG4gICAgfVxuXSk7XG4iLCIvLyBDb3B5cmlnaHQgMjAxNiBUaGUgT3BwaWEgQXV0aG9ycy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vL1xuLy8gICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vXG4vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTLUlTXCIgQkFTSVMsXG4vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IEZhY3RvcnkgZm9yIGNyZWF0aW5nIGFuZCBtdXRhdGluZyBpbnN0YW5jZXMgb2YgZnJvbnRlbmQgY2hhbmdlXG4gKiBkb21haW4gb2JqZWN0cy4gVGhpcyBmcm9udGVuZCBvYmplY3QgcmVwcmVzZW50cyBib3RoIENvbGxlY3Rpb25DaGFuZ2UgYW5kXG4gKiBFeHBsb3JhdGlvbkNoYW5nZSBiYWNrZW5kIGRvbWFpbiBvYmplY3RzLlxuICovXG4vLyBUT0RPKGJoZW5uaW5nKTogQ29uc29saWRhdGUgdGhlIGJhY2tlbmQgRXhwbG9yYXRpb25DaGFuZ2UgYW5kXG4vLyBDb2xsZWN0aW9uQ2hhbmdlIGRvbWFpbiBvYmplY3RzLlxub3BwaWEuZmFjdG9yeSgnQ2hhbmdlT2JqZWN0RmFjdG9yeScsIFtmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBDaGFuZ2UgPSBmdW5jdGlvbiAoYmFja2VuZENoYW5nZU9iamVjdCwgYXBwbHlDaGFuZ2VUb09iamVjdCwgcmV2ZXJzZUNoYW5nZVRvT2JqZWN0KSB7XG4gICAgICAgICAgICB0aGlzLl9iYWNrZW5kQ2hhbmdlT2JqZWN0ID0gYW5ndWxhci5jb3B5KGJhY2tlbmRDaGFuZ2VPYmplY3QpO1xuICAgICAgICAgICAgdGhpcy5fYXBwbHlDaGFuZ2VUb09iamVjdCA9IGFwcGx5Q2hhbmdlVG9PYmplY3Q7XG4gICAgICAgICAgICB0aGlzLl9yZXZlcnNlQ2hhbmdlVG9PYmplY3QgPSByZXZlcnNlQ2hhbmdlVG9PYmplY3Q7XG4gICAgICAgIH07XG4gICAgICAgIC8vIEluc3RhbmNlIG1ldGhvZHNcbiAgICAgICAgLy8gUmV0dXJucyB0aGUgSlNPTiBvYmplY3Qgd2hpY2ggcmVwcmVzZW50cyBhIGJhY2tlbmQgcHl0aG9uIGRpY3Qgb2YgdGhpc1xuICAgICAgICAvLyBjaGFuZ2UuIENoYW5nZXMgdG8gdGhpcyBvYmplY3QgYXJlIG5vdCByZWZsZWN0ZWQgaW4gdGhpcyBkb21haW4gb2JqZWN0LlxuICAgICAgICBDaGFuZ2UucHJvdG90eXBlLmdldEJhY2tlbmRDaGFuZ2VPYmplY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gYW5ndWxhci5jb3B5KHRoaXMuX2JhY2tlbmRDaGFuZ2VPYmplY3QpO1xuICAgICAgICB9O1xuICAgICAgICBDaGFuZ2UucHJvdG90eXBlLnNldEJhY2tlbmRDaGFuZ2VPYmplY3QgPSBmdW5jdGlvbiAoYmFja2VuZENoYW5nZU9iamVjdCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2JhY2tlbmRDaGFuZ2VPYmplY3QgPSBhbmd1bGFyLmNvcHkoYmFja2VuZENoYW5nZU9iamVjdCk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIEFwcGxpZXMgdGhpcyBjaGFuZ2UgdG8gdGhlIHJlbGF0ZWQgb2JqZWN0IChzdWNoIGFzIGEgZnJvbnRlbmQgY29sbGVjdGlvblxuICAgICAgICAvLyBkb21haW4gb2JqZWN0KS5cbiAgICAgICAgQ2hhbmdlLnByb3RvdHlwZS5hcHBseUNoYW5nZSA9IGZ1bmN0aW9uIChkb21haW5PYmplY3QpIHtcbiAgICAgICAgICAgIHRoaXMuX2FwcGx5Q2hhbmdlVG9PYmplY3QodGhpcy5fYmFja2VuZENoYW5nZU9iamVjdCwgZG9tYWluT2JqZWN0KTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gUmV2ZXJzZS1hcHBsaWVzIHRoaXMgY2hhbmdlIHRvIHRoZSByZWxhdGVkIG9iamVjdCAoc3VjaCBhcyBhIGZyb250ZW5kXG4gICAgICAgIC8vIGNvbGxlY3Rpb24gZG9tYWluIG9iamVjdCkuIFRoaXMgbWV0aG9kIHNob3VsZCBvbmx5IGJlIHVzZWQgdG8gcmV2ZXJzZSBhXG4gICAgICAgIC8vIGNoYW5nZSB0aGF0IHdhcyBwcmV2aW91c2x5IGFwcGxpZWQgYnkgY2FsbGluZyB0aGUgYXBwbHlDaGFuZ2UoKSBtZXRob2QuXG4gICAgICAgIENoYW5nZS5wcm90b3R5cGUucmV2ZXJzZUNoYW5nZSA9IGZ1bmN0aW9uIChkb21haW5PYmplY3QpIHtcbiAgICAgICAgICAgIHRoaXMuX3JldmVyc2VDaGFuZ2VUb09iamVjdCh0aGlzLl9iYWNrZW5kQ2hhbmdlT2JqZWN0LCBkb21haW5PYmplY3QpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBTdGF0aWMgY2xhc3MgbWV0aG9kcy4gTm90ZSB0aGF0IFwidGhpc1wiIGlzIG5vdCBhdmFpbGFibGUgaW4gc3RhdGljXG4gICAgICAgIC8vIGNvbnRleHRzLiBUaGUgZmlyc3QgcGFyYW1ldGVyIGlzIGEgSlNPTiByZXByZXNlbnRhdGlvbiBvZiBhIGJhY2tlbmRcbiAgICAgICAgLy8gcHl0aG9uIGRpY3QgZm9yIHRoZSBnaXZlbiBjaGFuZ2UuIFRoZSBzZWNvbmQgcGFyYW1ldGVyIGlzIGEgY2FsbGJhY2tcbiAgICAgICAgLy8gd2hpY2ggd2lsbCByZWNlaXZlIGJvdGggdGhlIGJhY2tlbmQgY2hhbmdlIG9iamVjdCBkaWN0aW9uYXJ5IChhc1xuICAgICAgICAvLyByZWFkLW9ubHkpIGFuZCB0aGUgZG9tYWluIG9iamVjdCBpbiB3aGljaCB0byBhcHBseSB0aGUgY2hhbmdlLiBUaGUgdGhpcmRcbiAgICAgICAgLy8gcGFyYW1ldGVyIGlzIGEgY2FsbGJhY2sgd2hpY2ggYmVoYXZlcyBpbiB0aGUgc2FtZSB3YXkgYXMgdGhlIHNlY29uZFxuICAgICAgICAvLyBwYXJhbWV0ZXIgYW5kIHRha2VzIHRoZSBzYW1lIGlucHV0cywgZXhjZXB0IGl0IHNob3VsZCByZXZlcnNlIHRoZSBjaGFuZ2VcbiAgICAgICAgLy8gZm9yIHRoZSBwcm92aWRlZCBkb21haW4gb2JqZWN0LlxuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBDaGFuZ2VbJ2NyZWF0ZSddID0gZnVuY3Rpb24gKFxuICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBiYWNrZW5kQ2hhbmdlT2JqZWN0LCBhcHBseUNoYW5nZVRvT2JqZWN0LCByZXZlcnNlQ2hhbmdlVG9PYmplY3QpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ2hhbmdlKGJhY2tlbmRDaGFuZ2VPYmplY3QsIGFwcGx5Q2hhbmdlVG9PYmplY3QsIHJldmVyc2VDaGFuZ2VUb09iamVjdCk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBDaGFuZ2U7XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTUgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbnJlcXVpcmUoJ2RvbWFpbi9lZGl0b3IvdW5kb19yZWRvL0Jhc2VVbmRvUmVkb1NlcnZpY2UudHMnKTtcbm9wcGlhLmZhY3RvcnkoJ1VuZG9SZWRvU2VydmljZScsIFtcbiAgICAnQmFzZVVuZG9SZWRvU2VydmljZScsIGZ1bmN0aW9uIChCYXNlVW5kb1JlZG9TZXJ2aWNlKSB7XG4gICAgICAgIHZhciBjaGlsZCA9IE9iamVjdC5jcmVhdGUoQmFzZVVuZG9SZWRvU2VydmljZSk7XG4gICAgICAgIGNoaWxkLmluaXQoKTtcbiAgICAgICAgcmV0dXJuIGNoaWxkO1xuICAgIH1cbl0pO1xuIl0sInNvdXJjZVJvb3QiOiIifQ==