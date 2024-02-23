import { AbstractControl, FormControl, FormRecord, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Observable, Subject } from 'rxjs';

export interface FileValidationErrors {
  name: string;
  errors: ValidationErrors;
}

export class FileUploadControl {
  /** Dynamic FormControl collection to track and validate uploaded files */
  private readonly _form: FormRecord<FormControl<File>> = new FormRecord({});

  private readonly _valueChanges: Subject<File[]> = new Subject<File[]>();

  /** Emits the new state whenever files are added or removed */
  public valueChanges$: Observable<File[]> = this._valueChanges.asObservable();

  /** Returns the number of files */
  public get size(): number {
    return Object.keys(this._form.controls).length;
  }

  /** Returns a list of files in the control*/
  public get value(): File[] {
    return Object.values(this._form.controls).map(control => control.value);
  }

  /** The max file size is set by maxFileSizeBytes, which validates on every new file added  */
  constructor(private readonly _maxFileSizeBytes: number, public showList = true, public multiple: boolean = false) {}

  /**
   * Adds a single file.
   */
  public addFile(file: File): void {
    this.addFiles([file]);
  }

  /**
   * Adds a list of files, emitting the newly added files. If multiple is false, the list is truncated to the first file.
   * @param files The list of files to add
   * @param emit Whether to emit the new state. Set to false if populating pre-existing files without user interaction.
   */
  public addFiles(files: File[], emit = true): void {
    if (!files.length) return;

    const addedFiles = [];

    if (!this.multiple) {
      this.clear();
      this._form.addControl(files[0].name, this._createFileFormControl(files[0]));
      addedFiles.push(files[0]);
    } else {
      for (const file of files) {
        if (!this._form.controls[file.name]) {
          this._form.addControl(file.name, this._createFileFormControl(file));
          addedFiles.push(file);
        }
      }
    }

    if (emit) this._valueChanges.next(addedFiles);
  }

  /** Remove a file by its name and emits the new state */
  public removeFile(name: string): void {
    this._form.removeControl(name);
    this._form.updateValueAndValidity();
  }

  /** Returns a list invalid file names along with their errors */
  public getErrors(): FileValidationErrors[] {
    const errors: FileValidationErrors[] = [];

    Object.keys(this._form.controls).forEach(fileName => {
      const controlErrors = this._form.controls[fileName].errors;
      if (controlErrors) {
        errors.push({ errors: controlErrors, name: fileName });
      }
    });

    return errors;
  }

  /**
   *  Clears all files by removing all their controls.
   *  Unfortunately this is required because Angular does not support FormRecord#clear()
   */
  public clear() {
    while (Object.keys(this._form.controls).length) {
      const toRemove = Object.keys(this._form.controls)[0];
      this._form.removeControl(toRemove);
    }
  }

  private _createFileFormControl(file: File) {
    const control = new FormControl(file, { nonNullable: true });
    control.addValidators(fileSizeValidator(this._maxFileSizeBytes));
    control.updateValueAndValidity();

    return control;
  }
}

export function fileSizeValidator(maxFileSizeBytes: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value.size || control.value.size > maxFileSizeBytes) {
      return { [`fileSize-${control.value.name}`]: true };
    }

    return null;
  };
}
