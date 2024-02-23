import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { action } from '@storybook/addon-actions';
import { applicationConfig, componentWrapperDecorator, Meta, moduleMetadata, StoryFn } from '@storybook/angular';
import { SharedUtilsLoggingModule } from '@dsg/shared/utils/logging';
import { importProvidersFrom } from '@angular/core';
import { NuverialCardContentDirective } from '../../directives';
import { NuverialRadioCardComponent } from './radio-card.component';

type StoryType = NuverialRadioCardComponent & { content?: string; displayImage?: boolean; title?: string };

export default {
  argTypes: {
    change: {
      action: 'change',
      defaultValue: '',
      description: 'Checkbox select event',
    },
  },
  component: NuverialRadioCardComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(SharedUtilsLoggingModule.useConsoleLoggingAdapter())],
    }),
    moduleMetadata({
      imports: [FormsModule, ReactiveFormsModule, NuverialCardContentDirective],
    }),
    componentWrapperDecorator(story => `<div style="margin: 0 auto">${story}</div>`),
  ],
  parameters: {
    actions: { change: { action: 'change' } },
  },
  tags: ['autodocs'],
  title: 'DSG/Nuverial/Components/RadioCard',
} as Meta<NuverialRadioCardComponent>;

const Template: StoryFn<StoryType> = args => {
  return {
    props: {
      ...args,
      onCardChange: (event: unknown) => action('change')(event),
      onValidationErrors: (event: unknown) => action('change')(event),
    },
    template: `
        <nuverial-radio-card
            ariaDescribedBy="${args.ariaDescribedBy}"
            ariaLabel="${args.ariaLabel}"
            [disabled]="${args.disabled}"
            imagePosition="${args.imagePosition}"
            (change)="onCardChange($event)">
            <div nuverialCardContentType="title">${args.title}</div>
            <div nuverialCardContentType="content">${args.content}</div>
            <img *ngIf="displayImage" nuverialCardContentType="image" src="/assets/painted-hall.webp" alt="painted hall"/>
          </nuverial-radio-card>`,
  };
};

export const RadioCard = Template.bind({});
RadioCard.args = {
  ariaDescribedBy: '',
  ariaLabel: '',
  checked: false,
  content: '<div>Lorem Ipsum dolor sit amet consectetur adipiscing elit</div>',
  disabled: false,
  displayImage: false,
  imagePosition: 'top',
  title: '<div>Lorem Ipsum dolor</div>',
  value: '',
};
