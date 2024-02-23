import { CommonModule } from '@angular/common';
import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom, Injector } from '@angular/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { provideAnimations } from '@angular/platform-browser/animations';
import { SharedUtilsLoggingModule } from '@dsg/shared/utils/logging';
import { makeDecorator } from '@storybook/addons';
import { applicationConfig, Meta, moduleMetadata, StoryFn } from '@storybook/angular';
import { ICollection } from '@storybook/angular/dist/client/types';
import { NuverialButtonComponent } from '../button';
import { NuverialIconComponent } from '../icon';
import { NuverialSnackbarComponent } from './snackbar.component';
import { NuverialSnackBarService } from './snackbar.service';

const injectInjectorToProps = makeDecorator({
  name: 'injectInjectorToProps',
  parameterName: 'injectInjectorToProps',
  skipIfNoParametersOrOptions: true,
  wrapper: (getStory, context) => {
    const story = getStory(context) as { props: ICollection; applicationConfig: ApplicationConfig };

    if (!story.applicationConfig.providers) {
      story.applicationConfig.providers = [];
    }

    story.applicationConfig.providers.push({
      deps: [Injector],
      provide: APP_INITIALIZER,
      useFactory: (injector: Injector): void => {
        Object.assign(story.props, { injector });
      },
    });

    return story;
  },
});

export default {
  argTypes: {
    change: {
      action: 'change',
      defaultValue: '',
      description: 'Checkbox select event',
    },
  },
  component: NuverialSnackbarComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(SharedUtilsLoggingModule.useConsoleLoggingAdapter()), provideAnimations(), importProvidersFrom(MatSnackBarModule)],
    }),
    moduleMetadata({
      imports: [CommonModule, MatSnackBarModule, NuverialButtonComponent, NuverialIconComponent],
    }),
    injectInjectorToProps,
  ],
  parameters: {
    injectInjectorToProps: true,
  },
  tags: ['autodocs'],
  title: 'DSG/Nuverial/Components/SnackBar',
} as Meta<NuverialSnackbarComponent>;

const Template: StoryFn<NuverialSnackbarComponent> = args => {
  const lbl = `Open snackbar ${args.nuverialSnackBarConfiguration.type}`;

  return {
    props: {
      ...args,
      onClickOpenSnackbar: (injector: Injector) => {
        injector.get<NuverialSnackBarService>(NuverialSnackBarService).openConfigured(args.nuverialSnackBarConfiguration);
      },
    },
    template: `
      <nuverial-button (click)="onClickOpenSnackbar(injector)" buttonStyle="outlined" ariaLabel="example snackbar">${lbl}</nuverial-button>
    `,
  };
};

export const SnackBarSuccess = Template.bind({});
SnackBarSuccess.args = {
  nuverialSnackBarConfiguration: {
    ariaLabelDismiss: 'Close snackbar',
    dismissible: true,
    message: 'Message sub title',
    nuverialActions: [
      {
        ariaLabel: 'action-label',
        buttonStyle: 'filled',
        colorTheme: 'primary',
        context: 'action-action',
        label: 'Action',
        uppercaseText: true,
      },
    ],
    title: 'Message title',
    type: 'success',
  },
};

export const SnackBarWarn = Template.bind({});
SnackBarWarn.args = {
  nuverialSnackBarConfiguration: {
    ariaLabelDismiss: 'Close snackbar',
    dismissible: true,
    message: 'Warn message sub title',
    title: 'Warn message title',
    type: 'warn',
  },
};

export const SnackBarError = Template.bind({});
SnackBarError.args = {
  nuverialSnackBarConfiguration: {
    ariaLabelDismiss: 'Close snackbar',
    dismissible: true,
    message: 'Error message sub title',
    title: 'Error message title',
    type: 'error',
  },
};
