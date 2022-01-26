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
 * @fileoverview Unit tests for CustomizeInteractionModalComponent.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal, NgbModal, NgbModalModule, NgbModalRef, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { ChangeDetectorRef, EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import INTERACTION_SPECS from 'interactions/interaction_specs.json';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { CustomizeInteractionModalComponent } from './customize-interaction-modal.component';
import { InteractionDetailsCacheService } from 'pages/exploration-editor-page/editor-tab/services/interaction-details-cache.service';
import { StateCustomizationArgsService } from 'components/state-editor/state-editor-properties-services/state-customization-args.service';
import { StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { StateNextContentIdIndexService } from 'components/state-editor/state-editor-properties-services/state-next-content-id-index.service';
import { EditorFirstTimeEventsService } from 'pages/exploration-editor-page/services/editor-first-time-events.service';
import { ImageClickInputValidationService } from 'interactions/ImageClickInput/directives/image-click-input-validation.service';
import { InteractionObjectFactory } from 'domain/exploration/InteractionObjectFactory';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { SubtitledUnicode, SubtitledUnicodeObjectFactory } from 'domain/exploration/SubtitledUnicodeObjectFactory';
import { ContextService } from 'services/context.service';
import { AppConstants } from 'app.constants';
import { StatePropertyService } from 'components/state-editor/state-editor-properties-services/state-property.service';

class MockStateCustomizationArgsService {
  displayed = {
    placeholder: {
      value: undefined
    },
    numberOfTerms: {
      value: undefined
    }
  };

  get onSchemaBasedFormsShown(): EventEmitter<void> {
    return new EventEmitter<void>();
  }
}

class MockStateInteractionIdService {
  displayed = 'RatioExpressionInput';
}

class MockChangeDetectorRef {
  detectChanges(): void {}
}

// eslint-disable-next-line oppia/no-test-blockers
fdescribe('Customize Interaction Modal Component', () => {
  const schemaBasedFormsSpy = jasmine.createSpy(
    'schemaBasedFormsSpy');
  const stateName = 'Introduction';
  let fixture: ComponentFixture<CustomizeInteractionModalComponent>;
  let component: CustomizeInteractionModalComponent;
  let changeDetectorRef: ChangeDetectorRef;
  let testSubscriptions: Subscription;
  let stateCustomizationArgsService: StateCustomizationArgsService;
  let stateEditorService: StateEditorService;
  let stateInteractionIdService: StateInteractionIdService;
  let interactionDetailsCacheService: InteractionDetailsCacheService;
  let editorFirstTimeEventsService: EditorFirstTimeEventsService;
  let ngbActiveModal: NgbActiveModal;
  let ngbModal: NgbModal;
  let subtitledUnicodeObjectFactory: SubtitledUnicodeObjectFactory;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        NgbModalModule,
        NgbModule
      ],
      declarations: [
        CustomizeInteractionModalComponent,
      ],
      providers: [
        NgbActiveModal,
        {
          provide: ChangeDetectorRef,
          useClass: MockChangeDetectorRef
        },
        {
          provide: StateCustomizationArgsService,
          useClass: MockStateCustomizationArgsService
        },
        {
          provide: StateInteractionIdService,
          useClass: MockStateInteractionIdService
        },
        StateEditorService,
        EditorFirstTimeEventsService,
        InteractionDetailsCacheService,
        SubtitledUnicodeObjectFactory,
        NgbModal
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomizeInteractionModalComponent);
    component = fixture.componentInstance;

    changeDetectorRef = TestBed.inject(ChangeDetectorRef);
    interactionDetailsCacheService =
      TestBed.inject(InteractionDetailsCacheService);
    stateCustomizationArgsService =
      TestBed.inject(StateCustomizationArgsService);
    subtitledUnicodeObjectFactory =
      TestBed.inject(SubtitledUnicodeObjectFactory);

    component.showMarkAllAudioAsNeedingUpdateModalIfRequired = () => {};

    fixture.detectChanges();
  });

  beforeEach(() => {
  });

  it('should be defined', () => {
    const warningListData = [{
      type: 'error',
      message: (
        'The number of terms should be a non-negative integer other than 1.'
      )
    }];

    expect(component).toBeDefined();
    expect(component.getTitle('NumberWithUnits'))
      .toBe('Number With Units');
    expect(component.getDescription('NumericInput'))
      .toBe(
        'Allows learners to enter integers and floating point numbers.');
    let result = component.getSchemaCallback({type: 'bool'});
    expect(result()).toEqual({type: 'bool'});
    expect(component.getCustomizationArgsWarningsList())
      .toEqual(warningListData);
    expect(component.getCustomizationArgsWarningMessage()).toBe(
      'The number of terms should be a non-negative integer other than 1.');
  });

  it('should update view after chagnes', () => {
    spyOn(changeDetectorRef, 'detectChanges');

    component.ngAfterContentChecked();

    expect(changeDetectorRef.detectChanges).not.toHaveBeenCalled();
  });

  it('should update Save interaction Button when userinputs data', () => {
    component.hasCustomizationArgs = true;
    spyOn(component, 'getCustomizationArgsWarningsList').and
      .returnValue([]);

    expect(component.isSaveInteractionButtonEnabled()).toBe(true);
  });

  it('should open intreaction when user click on it', () => {
    spyOn(interactionDetailsCacheService, 'contains').and
      .returnValue(true);
    spyOn(interactionDetailsCacheService, 'get').and
      .returnValue('RatioExpressionInput');

    component.onChangeInteractionId('RatioExpressionInput');

    expect(component.hasCustomizationArgs).toBe(true);
    expect(component.isinteractionOpen).toBeFalse();
  });

  it('should open save intreaction when user click on it', () => {
    spyOn(interactionDetailsCacheService, 'contains').and
      .returnValue(true);
    spyOn(interactionDetailsCacheService, 'get').and
      .returnValue({});
// to resolved.
    component.originalContentIdToContent =
      subtitledUnicodeObjectFactory.createDefault('unicode', 'contentId');
    component.onChangeInteractionId('RatioExpressionInput');

    expect(component.hasCustomizationArgs).toBe(false);
    expect(component.isinteractionOpen).toBeFalse();
  });
});
