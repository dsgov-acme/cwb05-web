import { Meta, moduleMetadata, StoryFn } from '@storybook/angular';
import { NuverialCardComponent } from './card.component';

export default {
  component: NuverialCardComponent,
  decorators: [
    moduleMetadata({
      imports: [],
    }),
  ],
  parameters: {},
  tags: ['autodocs'],
  title: 'DSG/Nuverial/Components/Card',
} as Meta<NuverialCardComponent>;

const Template: StoryFn<NuverialCardComponent> = args => {
  return {
    args,
    template: `
    <nuverial-card>
      <div nuverialCardContentType="title">Lorem Ipsum dolor</div>
      <div nuverialCardContentType="content">
        <p>Lorem Ipsum dolor sit amet consectetur adipiscing elit</p>
        <p>Lorem Ipsum dolor sit amet consectetur adipiscing elit</p>
       </div>
      <div nuverialCardContentType="footer">Lorem Ipsum dolor</div>
    </nuverial-card>`,
  };
};

export const Card = Template.bind({});
Card.args = {};
