// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for selecting entity types in translation opportunities.
 */

import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {AppConstants} from 'app.constants';
import {ContributorDashboardConstants} from 'pages/contributor-dashboard-page/contributor-dashboard-page.constants';

export interface EntityTypeOption {
  id: string;
  label: string;
}

// The option shown when the contributor has not narrowed the list down to a
// single content type. It is also the label fallback for an unrecognised
// entity type.
const ENTITY_TYPE_ALL_OPTION: EntityTypeOption = {
  id: ContributorDashboardConstants.ENTITY_TYPE_SENTINEL_ALL,
  label: 'All',
};

@Component({
  selector: 'entity-type-selector',
  templateUrl: './entity-type-selector.component.html',
  styleUrls: ['./entity-type-selector.component.css'],
})
export class EntityTypeSelectorComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() activeEntityType!: string;
  @Output() setActiveEntityType: EventEmitter<string> = new EventEmitter();
  @ViewChild('dropdown', {static: false}) dropdownRef!: ElementRef;

  dropdownShown = false;
  entityTypeOptions: EntityTypeOption[] = [
    ENTITY_TYPE_ALL_OPTION,
    {
      id: AppConstants.ENTITY_TYPE.EXPLORATION,
      label: 'Lessons',
    },
    {
      id: AppConstants.ENTITY_TYPE.SKILL,
      label: 'Skills',
    },
  ];

  ngOnInit(): void {
    if (!this.activeEntityType) {
      this.activeEntityType = ENTITY_TYPE_ALL_OPTION.id;
    }
    this.setActiveEntityType.emit(this.activeEntityType);
  }

  toggleDropdown(): void {
    this.dropdownShown = !this.dropdownShown;
  }

  selectOption(entityTypeId: string): void {
    this.activeEntityType = entityTypeId;
    this.setActiveEntityType.emit(this.activeEntityType);
    this.dropdownShown = false;
  }

  getActiveEntityTypeLabel(): string {
    const activeOption = this.entityTypeOptions.find(
      option => option.id === this.activeEntityType
    );
    return activeOption ? activeOption.label : ENTITY_TYPE_ALL_OPTION.label;
  }

  /**
   * Close dropdown when outside elements are clicked.
   * @param event Mouse click event.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const targetElement = event.target as HTMLElement;
    if (
      targetElement &&
      this.dropdownRef &&
      !this.dropdownRef.nativeElement.contains(targetElement)
    ) {
      this.dropdownShown = false;
    }
  }
}
