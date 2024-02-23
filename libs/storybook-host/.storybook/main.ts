import { StorybookConfig } from '@storybook/angular';
import { default as rootMain } from '../../../.storybook/main';

const storybookConfig: StorybookConfig = {
  ...rootMain,
  addons: rootMain.addons ? [...rootMain.addons] : [],
  core: {
    ...rootMain.core,
  },
  docs: {
    autodocs: 'tag',
    defaultName: 'Docs',
  },
  managerHead: (head, { configType }) => {
    if (configType === 'PRODUCTION') {
      return `
        ${head}
        <base href="/dsgov-web/">
      `;
    }

    return `
      ${head}
      <base href="/">
    `;
  },
  staticDirs: [{ from: '../../shared/ui/theme/.storybook/assets', to: '/assets' }],
  stories: [
    ...rootMain.stories,
    // get all stories in all libraries
    '../../**/*.standalone.mdx',
    '../../**/*.stories.@(js|jsx|ts|tsx|mdx)',
  ],
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
