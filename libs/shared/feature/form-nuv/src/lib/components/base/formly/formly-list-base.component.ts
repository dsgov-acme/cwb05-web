import { Directive, OnInit } from '@angular/core';
import { FieldArrayType, FieldTypeConfig } from '@ngx-formly/core';
import { FormStateMode } from '../../forms/renderer/renderer.model';
import { BaseListFormlyFieldProperties } from './formly-base.model';

// base components are decorated with @Directive()
@Directive()
export class FormlyListBaseComponent<T = BaseListFormlyFieldProperties> extends FieldArrayType<FieldTypeConfig<T>> implements OnInit {
  public formStateMode = FormStateMode;

  public get mode(): FormStateMode {
    return this.formState.mode;
  }

  public trackByFn(index: number): number {
    return index;
  }

  public ngOnInit(): void {
    if (!this.formControl.value.length) {
      // NOTE: Create the first entry
      this.add();
    }
  }
}
