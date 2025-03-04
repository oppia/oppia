import { TestBed } from '@angular/core/testing';
import { UndoRedoService } from './undo-redo.service';
import { Change } from 'domain/editor/undo_redo/change.model';

describe('UndoRedoService', () => {
  let undoRedoService: UndoRedoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UndoRedoService]
    });
    undoRedoService = TestBed.inject(UndoRedoService);
  });

  const createBackendChangeObject = (value: string) => {
    return { property_name: value };
  };

  const createChangeDomainObject = (
    backendObj: any,
    applyFunc: () => void = () => {},
    reverseFunc: () => void = () => {}
  ) => {
    return new Change(backendObj, applyFunc, reverseFunc);
  };

  it('should apply a single change', () => {
    const applyFunc = jasmine.createSpy('applyChange');
    expect(undoRedoService.hasChanges()).toBeFalse();

    const fakeDomainObject = { domain_property_name: 'fake value' };
    const backendChangeObject = createBackendChangeObject('value');
    const changeDomainObject = createChangeDomainObject(
      backendChangeObject, applyFunc
    );

    undoRedoService.applyChange(changeDomainObject, fakeDomainObject);
    expect(undoRedoService.hasChanges()).toBeTrue();
    expect(applyFunc).toHaveBeenCalledWith(backendChangeObject, fakeDomainObject);
  });

  it('should be able to undo an applied change', () => {
    const applyFunc = jasmine.createSpy('applyChange');
    const reverseFunc = jasmine.createSpy('reverseChange');
    expect(undoRedoService.hasChanges()).toBeFalse();

    const fakeDomainObject = { domain_property_name: 'fake value' };
    const backendChangeObject = createBackendChangeObject('value');
    const changeDomainObject = createChangeDomainObject(
      backendChangeObject, applyFunc, reverseFunc
    );
    undoRedoService.applyChange(changeDomainObject, fakeDomainObject);

    expect(undoRedoService.undoChange(fakeDomainObject)).toBeTrue();
    expect(undoRedoService.hasChanges()).toBeFalse();
    expect(reverseFunc).toHaveBeenCalledWith(backendChangeObject, fakeDomainObject);
  });

  it('should be able to redo an undone change', () => {
    const applyFunc = jasmine.createSpy('applyChange');
    const reverseFunc = jasmine.createSpy('reverseChange');
    expect(undoRedoService.hasChanges()).toBeFalse();

    const fakeDomainObject = { domain_property_name: 'fake value' };
    const backendChangeObject = createBackendChangeObject('value');
    const changeDomainObject = createChangeDomainObject(
      backendChangeObject, applyFunc, reverseFunc
    );

    undoRedoService.applyChange(changeDomainObject, fakeDomainObject);
    undoRedoService.undoChange(fakeDomainObject);
    expect(undoRedoService.redoChange(fakeDomainObject)).toBeTrue();
    expect(undoRedoService.hasChanges()).toBeTrue();
    expect(applyFunc.calls.count()).toEqual(2);
  });

  it('should not undo anything if no changes are applied', () => {
    const fakeDomainObject = { domain_property_name: 'fake value' };
    expect(undoRedoService.undoChange(fakeDomainObject)).toBeFalse();
  });

  it('should not redo anything if no changes are undone', () => {
    const fakeDomainObject = { domain_property_name: 'fake value' };
    expect(undoRedoService.redoChange(fakeDomainObject)).toBeFalse();
  });

  it('should clear changes without undoing them', () => {
    const applyFunc = jasmine.createSpy('applyChange');
    const fakeDomainObject = { domain_property_name: 'fake value' };
    const backendChangeObject = createBackendChangeObject('value');
    const changeDomainObject = createChangeDomainObject(backendChangeObject, applyFunc);

    undoRedoService.applyChange(changeDomainObject, fakeDomainObject);
    expect(undoRedoService.getChangeCount()).toEqual(1);

    undoRedoService.clearChanges();
    expect(undoRedoService.getChangeCount()).toEqual(0);
    expect(applyFunc.calls.count()).toEqual(1);
  });
});
