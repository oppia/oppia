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
 * @fileoverview Undo Redo Service.
 */

import { BaseUndoRedo } from './base-undo-redo.service';

const undoRedoServiceFactory = (): BaseUndoRedo => {
  var child = new BaseUndoRedo();
  child.init();
  return child;
};

class UndoRedoService extends BaseUndoRedo {}

export const provide = {
  provide: UndoRedoService, useFactory: undoRedoServiceFactory};

// TODO(#7222): Remove the following lines after all the files have been
// migrated to Angular.
angular.module('oppia').factory('UndoRedoService', [
  function() {
    return undoRedoServiceFactory();
  }
]);
