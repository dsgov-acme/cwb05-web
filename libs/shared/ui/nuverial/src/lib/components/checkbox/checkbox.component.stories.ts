import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedUtilsLoggingModule } from '@dsg/shared/utils/logging';
import { action } from '@storybook/addon-actions';
import { Meta, componentWrapperDecorator, moduleMetadata, applicationConfig, StoryFn } from '@storybook/angular';
import { importProvidersFrom } from '@angular/core';
import { NuverialContentDirective } from '../../directives';
import { NuverialCheckboxComponent } from './index';

type StoryType = NuverialCheckboxComponent;

export default {
  argTypes: {
    change: {
      action: 'change',
      defaultValue: '',
      description: 'Checkbox select event',
    },
  },
  component: NuverialCheckboxComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(SharedUtilsLoggingModule.useConsoleLoggingAdapter())],
    }),
    moduleMetadata({
      imports: [FormsModule, ReactiveFormsModule, NuverialContentDirective],
    }),
    componentWrapperDecorator(story => `<div style="margin: 0 auto">${story}</div>`),
  ],
  parameters: {
    actions: { change: { action: 'change' } },
    componentSubtitle: 'Checkbox card component.',
  },
  tags: ['autodocs'],
  title: 'DSG/Nuverial/Components/Checkbox',
} as Meta<NuverialCheckboxComponent>;

const Template: StoryFn<StoryType> = args => {
  const formModel = { isValid: true };

  return {
    props: {
      ...args,
      formModel,
      onValidationErrors: (event: unknown) => {
        return action('change')(event);
      },
    },
    template: `
        <nuverial-checkbox
            [(ngModel)]="formModel.isValid"
            ariaDescribedBy="${args.ariaDescribedBy}"
            ariaLabel="${args.ariaLabel}"
            colorTheme="${args.colorTheme}"
            [disabled]="${args.disabled}"
            [indeterminate]="${args.indeterminate}"
            [invalid]="${args.invalid}"
            [required]="${args.required}"
            [labelPosition]="${args.labelPosition}"
            (change)="onCardChange($event)"
            (validationErrors)="onValidationErrors($event)">
          </nuverial-checkbox>`,
  };
};

export const Checkbox = Template.bind({});
Checkbox.args = {
  ariaDescribedBy: '',
  ariaLabel: '',
  checked: false,
  colorTheme: 'primary',
  disabled: false,
  indeterminate: false,
  invalid: false,
  labelPosition: 'after',
  required: false,
};
