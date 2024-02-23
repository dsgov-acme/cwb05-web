import { FormlyFieldConfig } from '@ngx-formly/core';
import { FormStateMode } from '../../forms/renderer/renderer.model';
import { FormlyBaseComponent } from './formly-base.component';

describe('FormlyBaseComponent', () => {
  let component: FormlyBaseComponent;

  beforeEach(() => {
    component = new FormlyBaseComponent();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return the mode of formState', () => {
    const mode = FormStateMode.Review;
    jest.spyOn(component, 'formState', 'get').mockReturnValue({ mode: mode });

    expect(component.mode).toEqual(mode);
  });

  describe('_generateId', () => {
    component = new FormlyBaseComponent();

    it('should return empty string when no field.key or field.parent', () => {
      const field: FormlyFieldConfig = {};
      const result = component['_generateId'](field);
      expect(result).toEqual('');
    });

    it('should add field.key', () => {
      const field: FormlyFieldConfig = { key: '1341' };
      const result = component['_generateId'](field);
      expect(result).toEqual('1341');
    });

    it('should add parent keys', () => {
      const field: FormlyFieldConfig = { parent: { key: 'parent' }, key: '1341' };
      const result = component['_generateId'](field);
      expect(result).toEqual('parent.1341');
    });
  });
});
