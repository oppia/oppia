// Copyright 2018 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Component for list of tabs editor.
 */

// Every editor component should implement an alwaysEditable option. There
// may be additional customization options for the editor that should be passed
// in via initArgs.
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { SchemaDefaultValue } from 'services/schema-default-value.service';

interface ListOfTabsEditorSchema {
  type: 'list';
  items: {
    type: 'dict';
    properties: [{
      name: 'title';
      description: 'Tab title';
      schema: {
        type: 'unicode';
        validators: [{
          id: 'is_nonempty';
        }];
      };
    }, {
      name: 'content';
      description: 'Tab content';
      schema: {
        type: 'html';
        ui_config: {
          hide_complex_extensions: true;
        };
      };
    }];
  };
  ui_config: {
    add_element_text: 'Add new tab';
  };
}

@Component({
  selector: 'list-of-tabs-editor',
  templateUrl: './list-editor.component.html',
  styleUrls: []
})
export class ListOfTabsEditorComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() modalId!: symbol;
  @Input() value!: SchemaDefaultValue;
  @Output() valueChanged = new EventEmitter();
  SCHEMA: ListOfTabsEditorSchema = {
    type: 'list',
    items: {
      type: 'dict',
      properties: [{
        name: 'title',
        description: 'Tab title',
        schema: {
          type: 'unicode',
          validators: [{
            id: 'is_nonempty'
          }]
        }
      }, {
        name: 'content',
        description: 'Tab content',
        schema: {
          type: 'html',
          ui_config: {
            hide_complex_extensions: true
          }
        }
      }]
    },
    ui_config: {
      add_element_text: 'Add new tab'
    }
  };

  ngOnInit(): void {
    if (!this.value) {
      this.value = [];
      this.valueChanged.emit(this.value);
    }
  }

  getSchema(): ListOfTabsEditorSchema {
    return this.SCHEMA;
  }

  updateValue(value: SchemaDefaultValue): void {
    if (this.value === value) {
      return;
    }

    this.value = value;
    this.valueChanged.emit(this.value);
  }
}

angular.module('oppia').directive('listOfTabsEditor', downgradeComponent({
  component: ListOfTabsEditorComponent
}) as angular.IDirectiveFactory);
