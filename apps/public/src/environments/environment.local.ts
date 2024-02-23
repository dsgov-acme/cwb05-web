import { IEnvironment, WindowWithEnvironment } from '@dsg/shared/utils/environment';
import { FeatureFlags } from '@dsg/shared/utils/feature-flagging';

declare let window: WindowWithEnvironment;

const _environment: IEnvironment<Partial<FeatureFlags>> = {
  authenticationConfiguration: {
    firebaseConfiguration: {
      firebase: {
        apiKey: 'AIzaSyBb5I7J5yd_e0vL0iuiPrlykv-WQMtgAbw',
        authDomain: 'dsgov-dev.firebaseapp.com',
        emulatorUrl: 'http://localhost:4200/auth',
      },
      providerFlow: 'redirect',
      providerId: 'oidc.public',
      tenantId: 'public-portal-a2kyb',
    },
    sessionExpiration: {
      idleTimeSeconds: 60 * 30,
      sessionTimeSeconds: 60 * 60 * 18,
    },
  },
  featureFlags: {},
  googlePlacesApiConfiguration: {
    googleApiKey: 'AIzaSyBBYWQ7k1N7RYgOJGfTI462AhPoFemDK5A',
  },
  httpConfiguration: {
    baseUrl: 'http://api.dsgov.test',
  },
};

export const environment: IEnvironment = {
  ..._environment,
  ...window.environment, // must be last
};
