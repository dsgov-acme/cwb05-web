import { applicationConfig, Meta, StoryFn } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { NuverialBreadcrumbComponent } from './breadcrumb.component';

export default {
  component: NuverialBreadcrumbComponent,
  decorators: [
    applicationConfig({
      providers: [provideRouter([])],
    }),
  ],
  parameters: {},
  tags: ['autodocs'],
  title: 'DSG/Nuverial/Components/Breadcrumb',
} as Meta<NuverialBreadcrumbComponent>;

const Template: StoryFn<NuverialBreadcrumbComponent> = args => {
  return {
    args,
    template: `<nuverial-breadcrumb [breadCrumbs]='breadCrumbs'></nuverial-breadcrumb>`,
  };
};

export const Breadcrumb = Template.bind({});
Breadcrumb.args = {};
