import { StorybookConfig } from '@storybook/angular';
import { default as rootMain } from '../../../../../.storybook/main';

const storybookConfig: StorybookConfig = {
  ...rootMain,
  addons: [...rootMain.addons],
  core: { ...rootMain.core },
  stories: [...rootMain.stories, '../**/*.stories.mdx', '../**/*.stories.@(js|jsx|ts|tsx)'],
  webpackFinal: async (config, configType) => {
    // apply any global webpack configs that might have been specified in .storybook/main.js
    if (rootMain.webpackFinal) {
      return rootMain.webpackFinal(config, configType);
    }

    // add your own webpack tweaks if needed

    return config;
  },
};
export default storybookConfig;
