import { FormControl } from '@angular/forms';
import { DateRangeErrorStateMatcher } from './date-range-picker.error-state-matcher';

describe('DateRangeErrorStateMatcher', () => {
  let errorStateMatcher: DateRangeErrorStateMatcher;

  beforeEach(() => {
    errorStateMatcher = new DateRangeErrorStateMatcher();
  });

  it('should return true if parentControl is invalid and control is touched', () => {
    const parentControl = new FormControl('', {
      validators: () => ({ alwaysInvalid: true }),
    });
    const control = new FormControl();
    control.markAsTouched();
    parentControl.markAsTouched();
    errorStateMatcher.parentControl = parentControl;
    const result = errorStateMatcher.isErrorState(control, null);
    expect(result).toBe(true);
  });

  it('should return false if parentControl and control are valid', () => {
    const control = new FormControl();
    control.markAsTouched();
    const result = errorStateMatcher.isErrorState(control, null);
    expect(result).toBe(false);
  });

  it('should return false if control is not touched and valid', () => {
    const control = new FormControl();
    const result = errorStateMatcher.isErrorState(control, null);
    expect(result).toBe(false);
  });

  it('should return true if control is not touched but is invalid and dirty', () => {
    const control = new FormControl('', {
      validators: () => ({ alwaysInvalid: true }),
    });
    control.markAsDirty();
    const result = errorStateMatcher.isErrorState(control, null);
    expect(result).toBe(true);
  });

  it('should return true if parentControl is invalid but control is invalid and touched', () => {
    const parentControl = new FormControl();
    parentControl.markAsTouched();
    errorStateMatcher.parentControl = parentControl;
    const control = new FormControl('', {
      validators: () => ({ alwaysInvalid: true }),
    });
    control.markAsTouched();
    control.markAsPristine();
    const result = errorStateMatcher.isErrorState(control, null);
    expect(result).toBe(true);
  });

  it('should return false if parentControl is invalid but control is null', () => {
    const parentControl = new FormControl('', {
      validators: () => ({ alwaysInvalid: true }),
    });
    parentControl.markAsTouched();
    errorStateMatcher.parentControl = parentControl;
    const result = errorStateMatcher.isErrorState(null, null);
    expect(result).toBe(false);
  });

  it('should return false if control is null', () => {
    const result = errorStateMatcher.isErrorState(null, null);
    expect(result).toBe(false);
  });
});
