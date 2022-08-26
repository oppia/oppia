import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ClassroomEditorConfirmModalComponent } from './classroom-editor-confirm-modal.component';

describe('Classroom Editor Close Confirmation Modal', () => {
  let fixture: ComponentFixture<ClassroomEditorConfirmModalComponent>;
  let componentInstance: ClassroomEditorConfirmModalComponent;
  let closeSpy: jasmine.Spy;
  let ngbActiveModal: NgbActiveModal;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        ClassroomEditorConfirmModalComponent
      ],
      providers: [
        NgbActiveModal,
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClassroomEditorConfirmModalComponent);
    componentInstance = fixture.componentInstance;
    ngbActiveModal = TestBed.inject(NgbActiveModal);
    closeSpy = spyOn(ngbActiveModal, 'close').and.callThrough();

  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should be able to close modal', () => {
    componentInstance.close();
    expect(closeSpy).toHaveBeenCalled();
  });
});
