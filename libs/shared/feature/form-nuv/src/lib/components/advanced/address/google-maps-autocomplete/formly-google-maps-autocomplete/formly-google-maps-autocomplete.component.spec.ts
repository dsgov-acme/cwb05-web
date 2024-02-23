/* eslint-disable @typescript-eslint/naming-convention */
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { LoggingService } from '@dsg/shared/utils/logging';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { render } from '@testing-library/angular';
import { axe } from 'jest-axe';
import { MockProvider } from 'ng-mocks';
import { MockDefaultComponentProperties, MockDefaultFormlyModuleConfiguration, MockTemplate } from '../../../../../test';
import { FormlySectionHeaderComponent } from '../../../../section-header';
import { FormlySelectComponent } from '../../../../select';
import { FormlyTextInputComponent } from '../../../../text-input';
import { FormlyAddressComponent } from '../../formly/formly-address.component';
import { COUNTRY_OPTIONS, STATE_OPTIONS } from '../../formly/formly-address.model';
import { GoogleMapsAutocompleteComponent } from '../google-maps-autocomplete.component';
import { FormlyGoogleMapsAutocompleteComponent } from './formly-google-maps-autocomplete.component';

const mockFields: FormlyFieldConfig[] = [
  {
    className: 'flex-full',
    fieldGroup: [
      {
        key: 'personalInformation.currentAddress.addressLine1',
        props: {
          componentId: 'addressLine1',
          label: 'Address Line 1',
          required: true,
        },
      },
      {
        key: 'personalInformation.currentAddress.addressLine2',
        props: {
          componentId: 'addressLine2',
          label: 'Address Line 2 (optional)',
        },
      },
      {
        key: 'personalInformation.currentAddress.city',
        props: {
          componentId: 'city',
          label: 'City',
          required: true,
        },
      },
      {
        key: 'personalInformation.currentAddress.stateCode',
        props: {
          componentId: 'stateCode',
          label: 'State',
          required: true,
          selectOptions: STATE_OPTIONS,
        },
      },
      {
        key: 'personalInformation.currentAddress.postalCode',
        props: {
          componentId: 'postalCode',
          label: 'Zip Code',
          required: true,
        },
      },
      {
        key: 'personalInformation.currentAddress.postalCodeExtension',
        props: {
          componentId: 'postalCodeExtension',
          label: 'Ext. (Optional)',
        },
      },
      {
        key: 'personalInformation.currentAddress.countryCode',
        props: {
          componentId: 'countryCode',
          label: 'Country',
          required: true,
          selectOptions: COUNTRY_OPTIONS,
        },
      },
    ],
    key: 'personalInformation.currentAddress',
    props: {
      label: 'Current Address',
    },
    type: 'nuverialAddress',
  },
];

const setupGoogleMock = () => {
  /*** Mock Google Maps JavaScript API ***/
  const google = {
    maps: {
      places: {
        Autocomplete: class {
          public addListener() {
            // handle event
          }
        },
        AutocompleteService: () => {
          // handle event
        },
      },
    } as any,
  };
  global.window.google = google;
};

const getFixtureByTemplate = async (props?: Record<string, unknown>) => {
  const template = MockTemplate;
  const { fixture } = await render(template, {
    componentProperties: {
      ...MockDefaultComponentProperties,
      fields: mockFields,
      ...props,
    },
    imports: [
      ReactiveFormsModule,
      GoogleMapsAutocompleteComponent,
      FormlyModule.forRoot({
        ...MockDefaultFormlyModuleConfiguration,
        types: [
          { component: FormlyAddressComponent, name: 'nuverialAddress' },
          { component: FormlySectionHeaderComponent, name: 'nuverialSectionHeader' },
          { component: FormlyGoogleMapsAutocompleteComponent, name: 'nuverialGoogleMapsAutocomplete' },
          { component: FormlyTextInputComponent, name: 'nuverialTextInput' },
          { component: FormlySelectComponent, name: 'nuverialSelect' },
          { component: FormlySelectComponent, name: 'nuverialCheckbox' },
        ],
      }),
    ],
    providers: [MockProvider(LoggingService)],
  });

  const component = fixture.componentInstance;
  // const component = fixture.debugElement.query(By.directive(FormlyGoogleMapsAutocompleteComponent)).componentInstance;

  return { component, fixture };
};

describe('FormlyGoogleMapsAutocmpleteComponent', () => {
  beforeAll(() => {
    setupGoogleMock();
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting(),
      { teardown: { destroyAfterEach: false } }, // required in formly tests
    );
  });

  it('should create', async () => {
    const { fixture } = await getFixtureByTemplate();

    expect(fixture).toBeTruthy();
  });

  describe('Accessibility', () => {
    it('should have no violations', async () => {
      const { fixture } = await getFixtureByTemplate();
      const axeResults = await axe(fixture.nativeElement);

      expect(axeResults).toHaveNoViolations();
    });
  });

  it('should verify the that only the current address line 1 field is loaded', async () => {
    const { fixture } = await getFixtureByTemplate();

    expect(fixture.nativeElement.querySelector('#personalInformation\\.currentAddress\\.addressLine1-field mat-label').innerHTML).toEqual('Address Line 1');
  });
});
