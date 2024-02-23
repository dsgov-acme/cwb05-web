import { FormlyFormOptions } from '@ngx-formly/core';

export enum FormStateMode {
  Edit = 'edit',
  Review = 'review',
}

export enum FormStateStepperMode {
  Steps = 'steps',
  Inline = 'inline',
}

export enum FormStateContext {
  AdminBuilder = 'admin-builder',
  PublicPortal = 'public-portal',
  AgencyDetails = 'agency-details',
}

export interface NuvalenceFormRendererOptions extends FormlyFormOptions {
  formState: {
    mode: FormStateMode;
    stepperMode: FormStateStepperMode;
    context: FormStateContext;
  };
}
export const AdminBuilderIntakeRendererOptions: NuvalenceFormRendererOptions = {
  formState: {
    context: FormStateContext.AdminBuilder,
    mode: FormStateMode.Edit,
    stepperMode: FormStateStepperMode.Steps,
  },
};

export const AdminBuilderReviewRendererOptions: NuvalenceFormRendererOptions = {
  formState: {
    context: FormStateContext.AdminBuilder,
    mode: FormStateMode.Review,
    stepperMode: FormStateStepperMode.Inline,
  },
};

export const PublicPortalIntakeRendererOptions: NuvalenceFormRendererOptions = {
  formState: {
    context: FormStateContext.PublicPortal,
    mode: FormStateMode.Edit,
    stepperMode: FormStateStepperMode.Steps,
  },
};

export const PublicPortalReviewRendererOptions: NuvalenceFormRendererOptions = {
  formState: {
    context: FormStateContext.PublicPortal,
    mode: FormStateMode.Review,
    stepperMode: FormStateStepperMode.Inline,
  },
};

export const AgencyDetailsIntakeRendererOptions: NuvalenceFormRendererOptions = {
  formState: {
    context: FormStateContext.AgencyDetails,
    mode: FormStateMode.Review,
    stepperMode: FormStateStepperMode.Inline,
  },
};

export const AgencyDetailsReviewRendererOptions: NuvalenceFormRendererOptions = {
  formState: {
    context: FormStateContext.AgencyDetails,
    mode: FormStateMode.Review,
    stepperMode: FormStateStepperMode.Inline,
  },
};
