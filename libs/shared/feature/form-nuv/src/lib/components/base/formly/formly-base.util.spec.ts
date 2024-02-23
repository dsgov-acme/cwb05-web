import { FormlyFieldConfig } from '@ngx-formly/core';
import { BaseAdvancedFormlyFieldProperties } from './formly-base.model';
import {
  defaultPrePopulateAdvancedComponent,
  defaultPrePopulateDisplayOnlyComponent,
  defaultPrePopulateListComponent,
  isPrePopulated,
} from './formly-base.util';

describe('formly-base utils', () => {
  const field: FormlyFieldConfig<BaseAdvancedFormlyFieldProperties> = {
    key: 'sampleKey',
    props: {},
    fieldGroup: [
      { key: 'field1', type: 'input' },
      { key: 'field2', type: 'input' },
    ],
    fieldArray: {
      fieldGroup: [{ key: 'nestedField1', type: 'input' }],
    },
  };
  describe('defaultPrePopulateAdvancedComponent', () => {
    it('should modify field if not populated', () => {
      const fieldAfter = { ...field, key: undefined, props: { key: 'sampleKey', populated: true } };
      defaultPrePopulateAdvancedComponent(field);
      expect(field).toEqual(fieldAfter);
    });

    it('should return if field is already populated', () => {
      const fieldBefore = { ...field };
      defaultPrePopulateAdvancedComponent(field);
      expect(field).toEqual(fieldBefore);
    });
  });

  describe('defaultPrePopulateDisplayOnlyComponent', () => {
    it('should modify field if not populated', () => {
      field.props = {};
      const fieldAfter = { ...field, key: undefined, props: { populated: true } };
      defaultPrePopulateDisplayOnlyComponent(field);
      expect(field).toEqual(fieldAfter);
    });

    it('should return if field is already populated', () => {
      const fieldBefore = { ...field };
      defaultPrePopulateDisplayOnlyComponent(field);
      expect(field).toEqual(fieldBefore);
    });
  });

  describe('defaultPrePopulateListComponent', () => {
    it('should modify field if not populated', () => {
      field.props = {};
      const fieldAfter = {
        ...field,
        props: { populated: true },
        fieldArray: {
          fieldGroup: [
            { key: 'field1', type: 'input' },
            { key: 'field2', type: 'input' },
          ],
        },
        fieldGroup: undefined,
      };
      defaultPrePopulateListComponent(field);
      expect(field).toEqual(fieldAfter);
    });

    it('should return if field is already populated', () => {
      const fieldBefore = { ...field };
      defaultPrePopulateListComponent(field);
      expect(field).toEqual(fieldBefore);
    });
  });

  describe('isPrePopulated', () => {
    it('should return false if props is empty', () => {
      field.props = {};
      const result = isPrePopulated(field);
      expect(result).toBe(false);
    });

    it('should return false if props is undefined', () => {
      field.props = undefined;
      const result = isPrePopulated(field);
      expect(result).toBe(false);
    });

    it('should return false if field is not populated', () => {
      field.props = { populated: false };
      const result = isPrePopulated(field);
      expect(result).toBe(false);
    });

    it('should return true if field is populated', () => {
      field.props = { populated: true };
      const result = isPrePopulated(field);
      expect(result).toBe(true);
    });
  });
});
