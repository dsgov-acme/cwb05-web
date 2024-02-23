import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { FormlyListBaseComponent } from './formly-list-base.component';

describe('FormlyListBaseComponent', () => {
  let component: FormlyListBaseComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FormlyListBaseComponent],
    });
    component = TestBed.inject(FormlyListBaseComponent);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return the value of formState.mode', () => {
    const mode = 'mode1';
    jest.spyOn(component, 'formState', 'get').mockReturnValue({ mode });
    const result = component.mode;
    expect(result).toBe(mode);
  });

  it('should return the index for trackByFn', () => {
    const index = 0;
    const result = component.trackByFn(index);
    expect(result).toBe(index);
  });

  it('should not call add() method in ngOnInit if formControl has value', () => {
    const addSpy = jest.spyOn(component, 'add');
    jest.spyOn(component, 'formControl', 'get').mockReturnValue(new FormControl([{ test: 'value' }]));
    component.ngOnInit();
    expect(addSpy).not.toHaveBeenCalled();
  });

  it('should call add() method in ngOnInit if formControl has no value', () => {
    const addMock = jest.fn();
    component.add = addMock;
    const addSpy = jest.spyOn(component, 'add');
    jest.spyOn(component, 'formControl', 'get').mockReturnValue(new FormControl([]));
    component.ngOnInit();
    expect(addSpy).toHaveBeenCalled();
  });
});
