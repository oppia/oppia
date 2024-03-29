
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { AppConstants } from 'app.constants';
import { PageHeadService } from 'services/page-head.service';
import { CollectionEditorPageRootComponent } from './collection-editor-page-root.component';

fdescribe('CollectionEditorPageRootComponent', () => {
  let fixture: ComponentFixture<CollectionEditorPageRootComponent>;
  let component: CollectionEditorPageRootComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), HttpClientTestingModule],
      declarations: [CollectionEditorPageRootComponent],
      providers: [PageHeadService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CollectionEditorPageRootComponent);
    component = fixture.componentInstance;
  });

  it('should have the title and meta tags set', () => {
    expect(component.title).toEqual(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.COLLECTION_EDITOR.TITLE);
    expect(component.meta).toEqual(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.COLLECTION_EDITOR.META);
  });
});