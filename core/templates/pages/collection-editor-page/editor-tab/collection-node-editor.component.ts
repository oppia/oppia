// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for displaying and editing a collection node. This
 * directive allows creators to shift nodes to left or right
 * and also delete the collection node represented by this directive.
 */

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { CollectionNode } from 'domain/collection/collection-node.model';
import { Collection } from 'domain/collection/collection.model';
import { AlertsService } from 'services/alerts.service';
import { CollectionEditorStateService } from '../services/collection-editor-state.service';
import { CollectionLinearizerService } from '../services/collection-linearizer.service';

@Component({
  selector: 'oppia-collection-node-editor',
  templateUrl: './collection-node-editor.component.html'
})
export class CollectionNodeEditorComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() collectionNode!: CollectionNode;
  @Input() linearIndex!: number;
  explorationId!: string;
  collection!: Collection;
  hrefUrl!: string;

  constructor(
    private collectionLinearizerService: CollectionLinearizerService,
    private alertsService: AlertsService,
    private collectionEditorStateService: CollectionEditorStateService,
  ) {}

  // Deletes this collection node from the frontend collection
  // object and also updates the changelist.
  deleteNode(): void {
    this.explorationId = this.collectionNode.getExplorationId();
    if (!this.collectionLinearizerService.removeCollectionNode(
      this.collection, this.explorationId)) {
      this.alertsService.fatalWarning(
        'Internal collection editor error. Could not delete ' +
        'exploration by ID: ' + this.explorationId);
    }
  }

  // Shifts this collection node left in the linearized list of the
  // collection, if possible.
  shiftNodeLeft(): void {
    this.explorationId = this.collectionNode.getExplorationId();
    if (!this.collectionLinearizerService.shiftNodeLeft(
      this.collection, this.explorationId)) {
      this.alertsService.fatalWarning(
        'Internal collection editor error. Could not shift node left ' +
        'with ID: ' + this.explorationId);
    }
  }

  // Shifts this collection node right in the linearized list of the
  // collection, if possible.
  shiftNodeRight(): void {
    this.explorationId = this.collectionNode.getExplorationId();
    if (!this.collectionLinearizerService.shiftNodeRight(
      this.collection, this.explorationId)) {
      this.alertsService.fatalWarning(
        'Internal collection editor error. Could not shift node ' +
        'right with ID: ' + this.explorationId);
    }
  }

  ngOnInit(): void {
    this.collection = this.collectionEditorStateService.getCollection();
    this.hrefUrl = '/create/' + this.collection.getExplorationIds();
  }
}

angular.module('oppia').directive(
  'oppiaCollectionNodeEditor', downgradeComponent(
    {component: CollectionNodeEditorComponent}));
