import { FormioUtils } from '@formio/angular';

import { createCustomFormioComponent } from './create-custom-component';
import { FormioCustomComponentInfo } from './elements.common';

describe('createCustomFormioComponent', () => {
  const customComponentOptions: FormioCustomComponentInfo = {
    extraValidators: ['required'],
    group: 'groupA',
    icon: 'folder',
    selector: 'test selector',
    title: 'test title',
    type: 'custom',
  };

  describe('createCustomFormioComponent()', () => {
    const formioUtilsSpy = jest.spyOn(FormioUtils, 'getRandomComponentId').mockReturnValue('mockId');
    let result = createCustomFormioComponent(customComponentOptions);
    let resultInstance = new result({ defaultValue: 'default' }, {}, {});

    it('should be defined with provided options', () => {
      expect(result).toBeDefined();
      expect(formioUtilsSpy).toBeCalled;
      expect(resultInstance.id).toEqual('mockId');
      expect(resultInstance.type).toEqual('custom');
    });

    describe('emptyValue', () => {
      it('should return null if options does not provide emptyValue', () => {
        expect(resultInstance.emptyValue).toEqual(null);
      });

      it('should return emptyValue from customComponentOptions if provided', () => {
        customComponentOptions.emptyValue = 'blank';
        result = createCustomFormioComponent(customComponentOptions);
        resultInstance = new result({}, {}, {});
        expect(resultInstance.emptyValue).toEqual('blank');
      });
    });

    describe('attach', () => {
      const element: HTMLElement = document.createElement('test');
      const spy = jest.spyOn(element, 'querySelector');

      resultInstance.attach(element);

      expect(spy).toBeCalledWith(customComponentOptions.selector);
    });

    describe('defaultValue', () => {
      it('should return component.defaultValue if it is not null', () => {
        customComponentOptions.emptyValue = null;
        result = createCustomFormioComponent(customComponentOptions);
        resultInstance = new result({ defaultValue: 'default' }, {}, {});
        expect(resultInstance.emptyValue).toBe(null);
        expect(resultInstance.defaultValue).toEqual('default');
      });

      it('should return result of evaluate if options.preview is false', () => {
        resultInstance = new result({ customDefaultValue: 'custom', defaultValue: 'default' }, { preview: false }, {});
        jest.spyOn(resultInstance, 'evaluate').mockReturnValue('return');

        expect(resultInstance.emptyValue).toBe(null);
        expect(resultInstance.defaultValue).toEqual('return');
      });
    });
  });
});
