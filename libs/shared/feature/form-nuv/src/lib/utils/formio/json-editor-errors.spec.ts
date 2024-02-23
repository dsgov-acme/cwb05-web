import { RendererFactory2 } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { applyJsonEditorErrors, getFormIOComponentErrors } from './json-editor-errors';

describe('jsonEditorErrorsUtils', () => {
  describe('getFormIOComponentErrors', () => {
    it('should return a list of errors in the JSON editor', () => {
      // Invalid JSON (FormIO returns the editor text as a string)
      const invalidJsonComponent = 'not a valid JSON' as unknown as object;
      const errors = getFormIOComponentErrors(invalidJsonComponent);
      expect(errors).toEqual(['Invalid JSON']);

      // No errors
      const componentWithoutErrors = {
        key: 'mock-key',
        type: 'mock-type',
      };
      const noErrors = getFormIOComponentErrors(componentWithoutErrors);
      expect(noErrors).toEqual([]);

      // Missing key property
      const componentWithMissingKey = {
        type: 'mock-type',
      };
      const missingKeyError = getFormIOComponentErrors(componentWithMissingKey);
      expect(missingKeyError).toEqual(["missing property 'key'"]);

      // Missing type property
      const componentWithMissingType = {
        key: 'mock-key',
      };
      const missingTypeError = getFormIOComponentErrors(componentWithMissingType);
      expect(missingTypeError).toEqual(["missing property 'type'"]);
    });
  });

  describe('applyJsonEditorErrors', () => {
    it('should apply error styling and return true if there are errors in the JSON', () => {
      TestBed.configureTestingModule({});
      const rendererFactory = TestBed.inject(RendererFactory2);
      const renderer = rendererFactory.createRenderer(null, null);

      // Create the elements that are queried in the function
      const saveBtn = document.createElement('button');
      saveBtn.setAttribute('class', 'btn btn-success');
      saveBtn.setAttribute('ref', 'saveButton');

      const parentDiv = document.createElement('div');
      parentDiv.setAttribute('class', 'formio-component formio-component-form');

      const errorParentDiv = document.createElement('div');
      errorParentDiv.setAttribute('class', 'formio-form');
      errorParentDiv.setAttribute('ref', 'webform');

      document.body.appendChild(parentDiv);
      document.body.appendChild(saveBtn);
      renderer.appendChild(parentDiv, errorParentDiv);

      const componentWithErrors = {
        key: 'mock-key',
      };
      const componentWithoutErrors = {
        key: 'mock-key',
        type: 'mock-type',
      };

      let errors;
      let errorText;

      // With errors
      errors = applyJsonEditorErrors(componentWithErrors, renderer);

      expect(errors).toBe(true);
      expect(saveBtn.disabled).toBe(true);
      errorText = document.getElementById('jsonErrorText');
      expect(errorText).toBeTruthy();
      expect(errorText).toHaveTextContent("Errors in JSON: missing property 'type'");

      // Without errors
      errors = applyJsonEditorErrors(componentWithoutErrors, renderer);

      expect(errors).toBe(false);
      expect(saveBtn.disabled).toBe(false);
      errorText = document.getElementById('jsonErrorText');
      expect(errorText).toBeFalsy();

      // Clean up document
      renderer.removeChild(parentDiv, errorParentDiv);
      document.body.removeChild(parentDiv);
      document.body.removeChild(saveBtn);
      errorText = document.getElementById('jsonErrorText');
      if (errorText) {
        document.body.removeChild(errorText);
      }
    });
  });
});
