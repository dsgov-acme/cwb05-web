import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { action } from '@storybook/addon-actions';
import { applicationConfig, componentWrapperDecorator, Meta, moduleMetadata, StoryFn } from '@storybook/angular';
import { SharedUtilsLoggingModule } from '@dsg/shared/utils/logging';
import { importProvidersFrom } from '@angular/core';
import { NuverialCardContentDirective } from '../../directives';
import { NuverialCheckboxCardComponent } from '../checkbox-card';
import { NuverialRadioCardComponent } from '../radio-card';
import { NuverialCardGroupComponent } from './index';

export default {
  argTypes: {
    change: {
      action: 'change',
      defaultValue: '',
      description: 'Checkbox select event',
    },
  },
  component: NuverialCardGroupComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(SharedUtilsLoggingModule.useConsoleLoggingAdapter())],
    }),
    moduleMetadata({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        NuverialCardContentDirective,
        NuverialCardGroupComponent,
        NuverialCheckboxCardComponent,
        NuverialRadioCardComponent,
      ],
    }),
    componentWrapperDecorator(story => `<div style="display: flex; justify-content: center;">${story}</div>`),
  ],
  parameters: {
    actions: { change: { action: 'change' } },
  },
  tags: ['autodocs'],
  title: 'DSG/Nuverial/Components/CardGroup',
} as Meta<NuverialCardGroupComponent>;

const RadioTemplate: StoryFn<NuverialCardGroupComponent> = args => {
  const formModel = { isValid: null };

  return {
    props: {
      ...args,
      formModel,
      onCardChange: (event: unknown) => action('change')(event),
      onCardGroupChange: (event: unknown) => action('change')(event),
      onChangePoints: (event: unknown) => action('change')(event),
      onValidationErrors: (event: unknown) => action('change')(event),
    },
    template: `
        <nuverial-card-group
            [(ngModel)]="formModel.isValid"
            (change)="onCardGroupChange($event)"
            (changeCard)="onCardChange($event)"
            (changePoints)="onChangePoints($event)"
            (validationErrors)="onValidationErrors($event)">
          <nuverial-radio-card value="card-1" [pointValue]="1">
            <div nuverialCardContentType="title">Radio option 1</div>
           </nuverial-radio-card>
          <nuverial-radio-card value="card-2" [pointValue]="1">
            <div nuverialCardContentType="title">Radio option 2</div>
          </nuverial-radio-card>
        </nuverial-card-group>`,
  };
};

export const RadioCardGroup = RadioTemplate.bind({});
RadioCardGroup.args = {
  maxPoints: 0,
  minPoints: 0,
};

const CheckboxTemplate: StoryFn<NuverialCardGroupComponent> = args => {
  const formModel = { isValid: null };

  return {
    props: {
      ...args,
      formModel,
      onCardChange: (event: unknown) => action('change')(event),
      onCardGroupChange: (event: unknown) => action('change')(event),
      onChangePoints: (event: unknown) => action('change')(event),
      onValidationErrors: (event: unknown) => action('change')(event),
    },
    template: `
        <nuverial-card-group
            [(ngModel)]="formModel.isValid"
            (change)="onCardGroupChange($event)"
            (changeCard)="onCardChange($event)"
            (changePoints)="onChangePoints($event)"
            (validationErrors)="onValidationErrors($event)">
          <nuverial-checkbox-card value="card-1" [pointValue]="1">
            <div nuverialCardContentType="title">Checkbox option 1</div>
           </nuverial-checkbox-card>
          <nuverial-checkbox-card value="card-2" [pointValue]="1">
            <div nuverialCardContentType="title">Checkbox option 2</div>
          </nuverial-checkbox-card>
          <nuverial-checkbox-card value="card-3" [pointValue]="1">
            <div nuverialCardContentType="title">Checkbox option 3</div>
          </nuverial-checkbox-card>
        </nuverial-card-group>`,
  };
};

export const CheckboxCardGroup = CheckboxTemplate.bind({});
CheckboxCardGroup.args = {
  maxPoints: 0,
  minPoints: 0,
};
