import { Meta, moduleMetadata, StoryFn } from '@storybook/angular';
import { NuverialIconComponent } from './icon.component';

export default {
  component: NuverialIconComponent,
  decorators: [
    moduleMetadata({
      imports: [],
    }),
  ],
  tags: ['autodocs'],
  title: 'DSG/Nuverial/Components/Icon',
} as Meta<NuverialIconComponent>;

const Template: StoryFn<NuverialIconComponent> = args => {
  return {
    args,
    template: `<nuverial-icon [ariaHidden]="${args.ariaHidden}" iconName="${args.iconName}"></nuverial-icon>`,
  };
};

export const Icon = Template.bind({});
Icon.args = {
  ariaHidden: true,
  iconName: 'error_outline',
};
