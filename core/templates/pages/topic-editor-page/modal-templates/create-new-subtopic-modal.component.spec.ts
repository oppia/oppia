// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the create new subtopic modal controller.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Topic, TopicObjectFactory } from 'domain/topic/TopicObjectFactory';
import { SubtopicValidationService } from '../services/subtopic-validation.service';
import { CreateNewSubtopicModalComponent } from './create-new-subtopic-modal.component';

describe('Create new subtopic modal', () => {
  let topicObjectFactory: TopicObjectFactory;
  let subtopicValidationService: SubtopicValidationService;
  let topic: Topic;
  let component: CreateNewSubtopicModalComponent;
  let fixture: ComponentFixture<CreateNewSubtopicModalComponent>;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(() => {
    topicObjectFactory = TestBed.inject(TopicObjectFactory);
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    subtopicValidationService = TestBed.inject(SubtopicValidationService);
    topic = topicObjectFactory.createInterstitialTopic();
  });

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        CreateNewSubtopicModalComponent,
      ],
      providers: [
        SubtopicValidationService,
        TopicObjectFactory
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateNewSubtopicModalComponent);
    component = fixture.componentInstance;
  });


  it('should initialize controller properties after its initialization',
    () => {
      component.ngOnInit();
      expect(component.topic).toEqual(topic);
      expect(component.SUBTOPIC_PAGE_SCHEMA).toEqual({
        type: 'html',
        ui_config: {
          rows: 100
        }});
      expect(component.allowedBgColors).toEqual(['#FFFFFF']);
      expect(component.MAX_CHARS_IN_SUBTOPIC_TITLE).toEqual(64);
    });

  it('should close the modal and save the subtopicId', function() {
    component.subtopicTitle = 'Subtopic1';
    component.subtopicId = 1;
    component.save();
    expect(ngbActiveModal.close).toHaveBeenCalledWith(1);
  });

  it('should show schema editor', function() {
    expect(component.schemaEditorIsShown).toEqual(false);
    component.showSchemaEditor();
    expect(component.schemaEditorIsShown).toEqual(true);
  });

  it('should show error message if subtopic name is invalid', function() {
    expect(component.errorMsg).toEqual(null);
    spyOn(
      subtopicValidationService,
      'checkValidSubtopicName').and.returnValue(false);
    component.subtopicTitle = 'Subtopic1';
    component.save();

    let errorMessage = 'A subtopic with this title already exists';
    expect(component.errorMsg).toEqual(errorMessage);
  });

  it('should show reset the error message', function() {
    expect(component.errorMsg).toEqual(null);
    spyOn(
      subtopicValidationService,
      'checkValidSubtopicName').and.returnValue(false);
    component.subtopicTitle = 'Subtopic1';
    component.save();

    let errorMessage = 'A subtopic with this title already exists';
    expect(component.errorMsg).toEqual(errorMessage);

    component.resetErrorMsg();
    expect(component.errorMsg).toEqual(null);
  });

  it('should check if subtopic with url fragment exists', function() {
    expect(component.subtopicUrlFragmentExists).toEqual(false);
    spyOn(
      subtopicValidationService,
      'doesSubtopicWithUrlFragmentExist').and.returnValue(true);
    component.checkSubtopicExistence();
    expect(component.subtopicUrlFragmentExists).toEqual(true);
  });

  it('should return the validity of the subtopic', function() {
    // Fails when all fields are empty.
    component.editableThumbnailFilename = '';
    component.subtopicTitle = '';
    component.htmlData = '';
    component.editableUrlFragment = '';
    expect(component.isSubtopicValid()).toEqual(false);

    // Fails when subtopicTitle is empty but other fields are valid.
    component.htmlData = 'Subtopic description';
    component.editableThumbnailFilename = 'img_316_512.svg';
    component.editableUrlFragment = 'subtopic-url';
    expect(component.isSubtopicValid()).toEqual(false);

    // Fails when editableThumbnailFilename is empty but other fields
    // are valid.
    component.editableThumbnailFilename = '';
    component.subtopicTitle = 'Subtopic1';
    expect(component.isSubtopicValid()).toEqual(false);

    // Fails when htmlData is empty but other fields are valid.
    component.htmlData = '';
    component.editableThumbnailFilename = 'img_316_512.svg';
    expect(component.isSubtopicValid()).toEqual(false);

    // Fails when editableUrlFragment is empty but other fields are valid.
    component.htmlData = 'Subtopic description';
    component.editableUrlFragment = '';
    expect(component.isSubtopicValid()).toEqual(false);

    // Fails when editableUrlFragment contains an invalid character.
    component.editableUrlFragment = 'ABC 123';
    expect(component.isSubtopicValid()).toEqual(false);

    // Fails when only editableThumbnailFilename and subtopicTitle are
    // valid but others are empty.
    component.editableThumbnailFilename = 'img_316_512.svg';
    component.subtopicTitle = 'Subtopic1';
    component.htmlData = '';
    component.editableUrlFragment = '';
    expect(component.isSubtopicValid()).toEqual(false);

    // Fails when only editableThumbnailFilename and htmlData are
    // valid but others are empty.
    component.editableThumbnailFilename = 'img_316_512.svg';
    component.subtopicTitle = '';
    component.htmlData = 'Subtopic description';
    component.editableUrlFragment = '';
    expect(component.isSubtopicValid()).toEqual(false);

    // Fails when only editableThumbnailFilename and editableUrlFragment are
    // valid but others are empty.
    component.editableThumbnailFilename = 'img_316_512.svg';
    component.subtopicTitle = '';
    component.htmlData = '';
    component.editableUrlFragment = 'subtopic-url';
    expect(component.isSubtopicValid()).toEqual(false);

    // Fails when only subtopicTitle and htmlData are
    // valid but others are empty.
    component.editableThumbnailFilename = '';
    component.subtopicTitle = 'Subtopic1';
    component.htmlData = 'Subtopic description';
    component.editableUrlFragment = '';
    expect(component.isSubtopicValid()).toEqual(false);

    // Fails when only subtopicTitle and editableUrlFragment are
    // valid but others are empty.
    component.editableThumbnailFilename = '';
    component.subtopicTitle = 'Subtopic1';
    component.htmlData = '';
    component.editableUrlFragment = 'subtopic-url';
    expect(component.isSubtopicValid()).toEqual(false);

    // Fails when only htmlData and editableUrlFragment are
    // valid but others are empty.
    component.editableThumbnailFilename = '';
    component.subtopicTitle = '';
    component.htmlData = 'Subtopic description';
    component.editableUrlFragment = 'subtopic-url';
    expect(component.isSubtopicValid()).toEqual(false);

    // Fails validation if only subtopicTitle is valid.
    component.subtopicTitle = 'Subtopic1';
    component.htmlData = '';
    component.editableThumbnailFilename = '';
    component.editableUrlFragment = '';
    expect(component.isSubtopicValid()).toEqual(false);

    // Fails validation if only htmlData is valid.
    component.subtopicTitle = '';
    component.htmlData = 'Subtopic description';
    component.editableThumbnailFilename = '';
    component.editableUrlFragment = '';
    expect(component.isSubtopicValid()).toEqual(false);

    // Fails validation if only editableThumbnailFilename is valid.
    component.subtopicTitle = '';
    component.htmlData = '';
    component.editableThumbnailFilename = 'img_316_512.svg';
    component.editableUrlFragment = '';
    expect(component.isSubtopicValid()).toEqual(false);

    // Fails validation if only editableUrlFragment is valid.
    component.subtopicTitle = '';
    component.htmlData = '';
    component.editableThumbnailFilename = '';
    component.editableUrlFragment = 'subtopic-url';
    expect(component.isSubtopicValid()).toEqual(false);

    // Passes validation when all fields are valid.
    component.subtopicTitle = 'Subtopic1';
    component.htmlData = 'Subtopic description';
    component.editableThumbnailFilename = 'img_316_512.svg';
    component.editableUrlFragment = 'subtopic-url';
    expect(component.isSubtopicValid()).toEqual(true);
  });

  it('should dismiss the modal on cancel', function() {
    component.cancel();
    expect(ngbActiveModal.dismiss).toHaveBeenCalledWith('cancel');
  });

  it('should update the subtopic thumbnail filename', function() {
    expect(component.editableThumbnailFilename).toEqual('');
    component.updateSubtopicThumbnailFilename('img_512.svg');
    expect(component.editableThumbnailFilename).toEqual('img_512.svg');
  });

  it('should update the subtopic thumbnail bg color', function() {
    expect(component.editableThumbnailBgColor).toEqual('');
    component.updateSubtopicThumbnailBgColor('#FFFFFF');
    expect(component.editableThumbnailBgColor).toEqual('#FFFFFF');
  });
});
