import { Injector } from '@angular/core';
import { CustomTagsService } from '@formio/angular';
import * as RegisterCustomComponent from './register-custom-component';

describe('Register Custom Component', () => {
  let injectorMock: Injector;
  let customTagsServiceMock: CustomTagsService;

  beforeEach(() => {
    customTagsServiceMock = {
      addCustomTag: jest.fn(),
      tags: ['test'],
    };

    injectorMock = {
      get: jest.fn().mockReturnValue(customTagsServiceMock),
    } as Injector;
  });

  describe('registerCustomTag', () => {
    it('should call addCustomTag on injector.get(CustomTagsService)', () => {
      const tag = 'test tag';
      const injectorSpy = jest.spyOn(injectorMock, 'get');
      const tagSpy = jest.spyOn(customTagsServiceMock, 'addCustomTag');
      RegisterCustomComponent.registerCustomTag(tag, injectorMock);
      expect(injectorSpy).toBeCalledWith(CustomTagsService);
      expect(tagSpy).toBeCalledWith(tag);
    });
  });
});
