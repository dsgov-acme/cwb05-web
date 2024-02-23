import { Renderer2 } from '@angular/core';
import { ExtendedComponentSchema, FormioForm } from '@formio/angular';

export interface FormIOChangeEvent {
  type: 'addComponent' | 'saveComponent' | 'updateComponent' | 'deleteComponent';
  component: ExtendedComponentSchema;
  form?: FormioForm;
}

/**
 * Retrieves a list of errors in a FormIO component JSON editor
 * @param component FormIO component retrieved the form builder (change) event
 * @returns a list of errors in the JSON editor
 */
export function getFormIOComponentErrors(component: object) {
  const errorList = [];

  if (typeof component === 'string' || Object.keys(component).length === 0) {
    errorList.push('Invalid JSON');

    return errorList;
  }
  // List of required properties: https://github.com/formio/formio.js/wiki/Components-JSON-Schema
  if (!('key' in component) || !component.key) {
    errorList.push("missing property 'key'");
  }
  if (!('type' in component) || !component.type) {
    errorList.push("missing property 'type'");
  }

  return errorList;
}

/**
 * Applys error styling to the form builder JSON editor and disables the save button if there are errors in the JSON
 * @param component FormIO component retrieved the form builder (change) event
 * @returns true if there are errors in the JSON & styling was applied, false otherwise
 */
export function applyJsonEditorErrors(component: object, renderer: Renderer2) {
  const saveJsonBtn = document.querySelector<HTMLButtonElement>("button[ref='saveButton'][class='btn btn-success']");
  const errorParentDiv = document.querySelector<HTMLDivElement>("div.formio-component.formio-component-form div[ref='webform'][class='formio-form']");
  if (!(saveJsonBtn && errorParentDiv)) return false;

  let errorText = document.getElementById('jsonErrorText');
  if (errorText) renderer.removeChild(errorParentDiv, errorText);

  const errors = getFormIOComponentErrors(component);
  if (errors.length > 0) {
    saveJsonBtn.disabled = true;

    errorText = renderer.createElement('p');
    renderer.setAttribute(errorText, 'id', 'jsonErrorText');
    renderer.setProperty(errorText, 'textContent', `Errors in JSON: ${errors.join(', ')}`);
    renderer.appendChild(errorParentDiv, errorText);

    return true;
  } else {
    saveJsonBtn.disabled = false;

    return false;
  }
}
