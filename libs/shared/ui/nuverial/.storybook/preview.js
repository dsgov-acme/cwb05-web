const preview = {
  parameters: {
    html: {
      removeEmptyComments: true,
      transform: code => code.replace(/(?:_nghost|ng-reflect|_ngcontent).*?="[\S\s]*?"/g, ''),
    },
    options: {
      storySort: {
        method: 'alphabetical',
        order: ['About'],
      },
    },
  },
};
export default preview;
