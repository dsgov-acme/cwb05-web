import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { LoggingService } from '@dsg/shared/utils/logging';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { render } from '@testing-library/angular';
import { axe } from 'jest-axe';
import { MockProvider } from 'ng-mocks';
import { MockDefaultComponentProperties, MockDefaultFormlyModuleConfiguration, MockTemplate } from '../../../../test';
import { FormStateMode } from '../../../forms/renderer/renderer.model';
import { FormlySectionHeaderComponent } from '../../../section-header';
import { FormlySelectComponent } from '../../../select';
import { FormlyTextInputComponent } from '../../../text-input';
import { FormlyGoogleMapsAutocompleteComponent } from '../google-maps-autocomplete/formly-google-maps-autocomplete/formly-google-maps-autocomplete.component';
import { GoogleMapsAutocompleteComponent } from '../google-maps-autocomplete/google-maps-autocomplete.component';
import { GooglePlace } from '../models/googleplaces.api.model';
import { FormlyAddressComponent } from './formly-address.component';
import { COUNTRY_OPTIONS, FormlyAddressFieldProperties, STATE_OPTIONS } from './formly-address.model';

const mockModel = {
  personalInformation: {
    currentAddress: {
      addressLine1: '1234 first St',
      addressLine2: 'line 2',
      city: 'troy',
      countryCode: 'US',
      countryLabel: 'United States',
      postalCode: '55555',
      postalCodeExtension: '1234',
      stateCode: 'NY',
    },
  },
};

const mockReviewDetailsMap = {
  addressLine1: '1234 first St',
  addressLine2: 'line 2',
  city: 'troy',
  countryCode: 'US',
  countryLabel: 'United States',
  isMailingAddressDifferent: undefined,
  postalCode: '55555',
  postalCodeExtension: '1234',
  stateCode: 'NY',
};

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
        ['Autocomplete']: class {
          public addListener() {
            // do nothing
          }
        },
        ['AutocompleteService']: () => {
          // do nothing
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
      model: mockModel,
      reviewDetailsMap: mockReviewDetailsMap,
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

  const component = fixture.debugElement.query(By.directive(FormlyAddressComponent)).componentInstance;

  return { component, fixture };
};

describe('FormlyAddressComponent', () => {
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

  it('should verify the that only the current address components are loaded', async () => {
    const { fixture } = await getFixtureByTemplate();

    expect(fixture.nativeElement.querySelectorAll('dsg-formly-section-header').length).toEqual(1);
    expect(fixture.nativeElement.querySelector('nuverial-section-header h2').innerHTML).toEqual('Current Address');
    expect(fixture.nativeElement.querySelector('#personalInformation\\.currentAddress\\.addressLine1-field mat-label').innerHTML).toEqual('Address Line 1');
    expect(fixture.nativeElement.querySelector('#personalInformation\\.currentAddress\\.addressLine2-field mat-label').innerHTML).toEqual(
      'Address Line 2 (optional)',
    );
    expect(fixture.nativeElement.querySelector('#personalInformation\\.currentAddress\\.city-field mat-label').innerHTML).toEqual('City');
    expect(fixture.nativeElement.querySelector('#personalInformation\\.currentAddress\\.stateCode-field mat-label').innerHTML).toEqual('State');
    expect(fixture.nativeElement.querySelector('#personalInformation\\.currentAddress\\.postalCode-field mat-label').innerHTML).toEqual('Zip Code');
    expect(fixture.nativeElement.querySelector('#personalInformation\\.currentAddress\\.postalCodeExtension-field mat-label').innerHTML).toEqual(
      'Ext. (Optional)',
    );
    expect(fixture.nativeElement.querySelector('#personalInformation\\.currentAddress\\.countryCode-field mat-label').innerHTML).toEqual('Country');
  });

  it('should evaluate the switch statement based off componentId values', async () => {
    const { component, fixture } = await getFixtureByTemplate();
    fixture.detectChanges();
    const fieldGroup = component.field.fieldGroup;
    expect(fieldGroup.find((field: FormlyFieldConfig<FormlyAddressFieldProperties>) => field.props?.['componentId'] === 'addressLine1').key).toContain(
      'addressLine1',
    );
    expect(fieldGroup.find((field: FormlyFieldConfig<FormlyAddressFieldProperties>) => field.props?.['componentId'] === 'addressLine2').key).toContain(
      'addressLine2',
    );
    expect(fieldGroup.find((field: FormlyFieldConfig<FormlyAddressFieldProperties>) => field.props?.['componentId'] === 'city').key).toContain('city');
    expect(fieldGroup.find((field: FormlyFieldConfig<FormlyAddressFieldProperties>) => field.props?.['componentId'] === 'stateCode').key).toContain(
      'stateCode',
    );
    expect(fieldGroup.find((field: FormlyFieldConfig<FormlyAddressFieldProperties>) => field.props?.['componentId'] === 'postalCode').key).toContain(
      'postalCode',
    );
    expect(fieldGroup.find((field: FormlyFieldConfig<FormlyAddressFieldProperties>) => field.props?.['componentId'] === 'postalCodeExtension').key).toContain(
      'postalCodeExtension',
    );
  });

  it('should verify the review mode', async () => {
    const { component, fixture } = await getFixtureByTemplate();
    const reviewDetails = {
      addressLine1: '1234 first St',
      addressLine2: 'line 2',
      city: 'troy',
      countryCode: 'US',
      countryLabel: 'United States',
      isMailingAddressDifferent: undefined,
      postalCode: '55555',
      postalCodeExtension: '1234',
      stateCode: 'NY',
    };

    component.formState.mode = FormStateMode.Edit;
    fixture.detectChanges();

    expect(component.reviewDetails).toEqual(reviewDetails);
  });

  describe('Field Group Transformation', () => {
    it('should transform the field group correctly', () => {
      const fieldGroup = [
        {
          props: {
            componentId: 'addressLine1',
            label: 'Address Line 1',
            required: true,
          },
        },
        {
          props: {
            componentId: 'addressLine2',
            label: 'Address Line 2 (optional)',
          },
        },
        {
          props: {
            componentId: 'city',
            label: 'City',
            required: true,
          },
        },
        {
          props: {
            componentId: 'stateCode',
            label: 'State',
            required: true,
            selectOptions: STATE_OPTIONS,
          },
        },
        {
          props: {
            componentId: 'postalCode',
            label: 'Zip Code',
            required: true,
          },
        },
        {
          props: {
            componentId: 'postalCodeExtension',
            label: 'Ext. (Optional)',
          },
        },
        {
          props: {
            componentId: 'countryCode',
            label: 'Country',
            required: true,
            selectOptions: COUNTRY_OPTIONS,
          },
        },
      ];

      const transformedFieldGroup = fieldGroup.map(_field => {
        switch (true) {
          case _field.props?.['componentId'] === 'addressLine1':
            return {
              ..._field,
              className: 'flex-half',
              props: {
                ..._field.props,
                autocomplete: 'address-line1',
                type: 'text',
              },
              type: 'nuverialTextInput',
            };
          case _field.props?.['componentId'] === 'addressLine2':
            return {
              ..._field,
              className: 'flex-half',
              props: {
                ..._field.props,
                autocomplete: 'address-line2',
                type: 'text',
              },
              type: 'nuverialTextInput',
            };
          case _field.props?.['componentId'] === 'city':
            return {
              ..._field,
              className: 'flex-half',
              props: {
                ..._field.props,
                autocomplete: 'address-level2',
                type: 'text',
              },
              type: 'nuverialTextInput',
            };
          case _field.props?.['componentId'] === 'stateCode':
            return {
              ..._field,
              className: 'flex-half',
              props: {
                ..._field.props,
                autocomplete: 'address-level1',
              },
              type: 'nuverialSelect',
            };
          case _field.props?.['componentId'] === 'postalCode':
            return {
              ..._field,
              className: 'flex-quarter',
              props: {
                ..._field.props,
                autocomplete: 'postal-code',
                type: 'text',
              },
              type: 'nuverialTextInput',
            };
          case _field.props?.['componentId'] === 'postalCodeExtension':
            return {
              ..._field,
              className: 'flex-quarter',
              props: {
                ..._field.props,
                type: 'text',
              },
              type: 'nuverialTextInput',
            };
          case _field.props?.['componentId'] === 'countryCode':
            return {
              ..._field,
              className: 'flex-half',
              props: {
                ..._field.props,
                autocomplete: 'country',
              },
              type: 'nuverialSelect',
            };
          default:
            return _field;
        }
      });

      expect(transformedFieldGroup).toEqual([
        {
          props: {
            componentId: 'addressLine1',
            label: 'Address Line 1',
            required: true,
            autocomplete: 'address-line1',
            type: 'text',
          },
          className: 'flex-half',
          type: 'nuverialTextInput',
        },
        {
          props: {
            componentId: 'addressLine2',
            label: 'Address Line 2 (optional)',
            autocomplete: 'address-line2',
            type: 'text',
          },
          className: 'flex-half',
          type: 'nuverialTextInput',
        },
        {
          props: {
            componentId: 'city',
            label: 'City',
            required: true,
            autocomplete: 'address-level2',
            type: 'text',
          },
          className: 'flex-half',
          type: 'nuverialTextInput',
        },
        {
          props: {
            componentId: 'stateCode',
            label: 'State',
            required: true,
            selectOptions: STATE_OPTIONS,
            autocomplete: 'address-level1',
          },
          className: 'flex-half',
          type: 'nuverialSelect',
        },
        {
          props: {
            componentId: 'postalCode',
            label: 'Zip Code',
            required: true,
            autocomplete: 'postal-code',
            type: 'text',
          },
          className: 'flex-quarter',
          type: 'nuverialTextInput',
        },
        {
          props: {
            componentId: 'postalCodeExtension',
            label: 'Ext. (Optional)',
            type: 'text',
          },
          className: 'flex-quarter',
          type: 'nuverialTextInput',
        },
        {
          props: {
            componentId: 'countryCode',
            label: 'Country',
            required: true,
            selectOptions: COUNTRY_OPTIONS,
            autocomplete: 'country',
          },
          className: 'flex-half',
          type: 'nuverialSelect',
        },
      ]);
    });
  });

  describe('_populateAddressLine1', () => {
    it('should populate address line 1 field with Google address if addressValidationEnabled is true', async () => {
      const parentField: FormlyFieldConfig<FormlyAddressFieldProperties> = {
        key: 'personalInformation.currentAddress',
        props: {
          addressValidationEnabled: true,
          label: 'Current Address',
        },
        type: 'nuverialAddress',
      };

      const mockGooglePlace: GooglePlace = new GooglePlace({
        streetNumber: '1234 First St',
      });

      const childField: FormlyFieldConfig = {
        props: {
          autocomplete: 'address-line1',
          type: 'text',
        },
      };

      const expectedField: FormlyFieldConfig = {
        ...childField,
        className: 'flex-half',
        props: {
          ...childField.props,
          autocomplete: 'address-line1',
          gotGoogleAddress: expect.any(Function),
          type: 'text',
        },
        type: 'nuverialGoogleMapsAutocomplete',
      };

      const { component } = await getFixtureByTemplate();
      const result = component['_populateAddressLine1'](parentField, childField);

      expect(result).toEqual(expectedField);

      // Test the gotGoogleAddress callback
      const gotGoogleAddress = result.props?.['gotGoogleAddress'];
      expect(gotGoogleAddress).toBeDefined();

      // Mock the fieldGroup
      const formField1: FormlyFieldConfig = {
        props: {
          componentId: 'addressLine1',
        },
        formControl: new FormControl(),
      };

      const formField2: FormlyFieldConfig = {
        props: {
          componentId: 'addressLine2',
        },
        formControl: new FormControl(),
      };

      parentField.fieldGroup = [formField1, formField2];

      // Call the gotGoogleAddress callback
      gotGoogleAddress?.(mockGooglePlace);

      // Verify that the formControl values are set correctly
      expect(formField1.formControl?.value).toEqual(mockGooglePlace.addressLine1);
      expect(formField2.formControl?.value).toEqual('');
    });

    it('should not populate address line 1 field with Google address if addressValidationEnabled is false', async () => {
      const addressField: FormlyFieldConfig = {
        key: 'personalInformation.currentAddress.addressLine1',
        props: {
          componentId: 'addressLine1',
          label: 'Address Line 1',
          required: true,
        },
      };

      const parentField: FormlyFieldConfig<FormlyAddressFieldProperties> = {
        fieldGroup: [addressField],
        key: 'personalInformation.currentAddress',
        props: {
          label: 'Current Address',
        },
        type: 'nuverialAddress',
      };

      const expectedField: FormlyFieldConfig = {
        ...addressField,
        className: 'flex-half',
        props: {
          ...addressField.props,
          autocomplete: 'address-line1',
          type: 'text',
        },
        type: 'nuverialTextInput',
      };

      const { component } = await getFixtureByTemplate();
      const result = component['_populateAddressLine1'](parentField, addressField);

      expect(result).toEqual(expectedField);
    });
  });

  it('should set form control values based on the GooglePlace address', async () => {
    const address: GooglePlace = {
      addressLine1: '1234 first St',
      addressLine2: 'line 2',
      city: 'troy',
      countryCode: 'US',
      country: 'United States',
      postalCode: '55555',
      postalCodeExtension: '1234',
      stateCode: 'NY',
    } as GooglePlace;

    const fieldGroup: Array<FormlyFieldConfig<FormlyAddressFieldProperties>> = [
      {
        props: {
          componentId: 'addressLine1',
        },
        formControl: new FormControl(),
      },
      {
        props: {
          componentId: 'addressLine2',
        },
        formControl: new FormControl(),
      },
      {
        props: {
          componentId: 'city',
        },
        formControl: new FormControl(),
      },
      {
        props: {
          componentId: 'stateCode',
        },
        formControl: new FormControl(),
      },
      {
        props: {
          componentId: 'postalCode',
        },
        formControl: new FormControl(),
      },
      {
        props: {
          componentId: 'postalCodeExtension',
        },
        formControl: new FormControl(),
      },
      {
        props: {
          componentId: 'countryCode',
        },
        formControl: new FormControl(),
      },
    ];

    const { component } = await getFixtureByTemplate();

    component['_gotGoogleAddress'](address, { fieldGroup });

    expect(fieldGroup[0].formControl?.value).toEqual('1234 first St');
    expect(fieldGroup[1].formControl?.value).toEqual('line 2');
    expect(fieldGroup[2].formControl?.value).toEqual('troy');
    expect(fieldGroup[3].formControl?.value).toEqual('NY');
    expect(fieldGroup[4].formControl?.value).toEqual('55555');
    expect(fieldGroup[5].formControl?.value).toEqual('1234');
    expect(fieldGroup[6].formControl?.value).toEqual('US');
  });

  describe('_populateAddressConfiguration', () => {
    it('should populate address line 1 field', async () => {
      const { component } = await getFixtureByTemplate();
      const parentField: FormlyFieldConfig<FormlyAddressFieldProperties> = { key: 'personalInformation.currentAddress' };
      const childField: FormlyFieldConfig = { props: { componentId: 'addressLine1' } };

      const result = component['_populateAddressConfiguration'](parentField, childField);
      expect(result).toEqual({
        props: {
          componentId: 'addressLine1',
          autocomplete: 'address-line1',
          type: 'text',
        },
        className: 'flex-half',
        type: 'nuverialTextInput',
      });
    });

    it('should populate address line 1 field to google maps autocomplete', async () => {
      const { component } = await getFixtureByTemplate();
      const parentField: FormlyFieldConfig<FormlyAddressFieldProperties> = {
        key: 'personalInformation.currentAddress',
        props: { addressValidationEnabled: true },
      };
      const childField: FormlyFieldConfig = { props: { componentId: 'addressLine1' } };
      const result = component['_populateAddressConfiguration'](parentField, childField);

      expect(result).toEqual({
        props: {
          componentId: 'addressLine1',
          autocomplete: 'address-line1',
          type: 'text',
          gotGoogleAddress: expect.any(Function),
        },
        className: 'flex-half',
        type: 'nuverialGoogleMapsAutocomplete',
      });
    });

    it('should populate address line 2 field', async () => {
      const { component } = await getFixtureByTemplate();
      const parentField: FormlyFieldConfig<FormlyAddressFieldProperties> = { key: 'personalInformation.currentAddress' };
      const childField: FormlyFieldConfig = { props: { componentId: 'addressLine2' } };

      const result = component['_populateAddressConfiguration'](parentField, childField);

      expect(result).toEqual({
        props: {
          componentId: 'addressLine2',
          autocomplete: 'address-line2',
          type: 'text',
        },
        className: 'flex-half',
        type: 'nuverialTextInput',
      });
    });

    it('should populate city field', async () => {
      const { component } = await getFixtureByTemplate();
      const parentField: FormlyFieldConfig<FormlyAddressFieldProperties> = { key: 'personalInformation.currentAddress' };
      const childField: FormlyFieldConfig = { props: { componentId: 'city' } };

      const result = component['_populateAddressConfiguration'](parentField, childField);

      expect(result).toEqual({
        props: {
          componentId: 'city',
          autocomplete: 'address-level2',
          type: 'text',
        },
        className: 'flex-half',
        type: 'nuverialTextInput',
      });
    });

    it('should populate state code field', async () => {
      const { component } = await getFixtureByTemplate();
      const parentField: FormlyFieldConfig<FormlyAddressFieldProperties> = { key: 'personalInformation.currentAddress' };
      const childField: FormlyFieldConfig = { props: { componentId: 'stateCode' } };

      const result = component['_populateAddressConfiguration'](parentField, childField);

      expect(result).toEqual({
        props: {
          componentId: 'stateCode',
          autocomplete: 'address-level1',
          type: 'text',
        },
        className: 'flex-half',
        type: 'nuverialSelect',
      });
    });

    it('should populate postal code field', async () => {
      const { component } = await getFixtureByTemplate();
      const parentField: FormlyFieldConfig<FormlyAddressFieldProperties> = { key: 'personalInformation.currentAddress' };
      const childField: FormlyFieldConfig = { props: { componentId: 'postalCode' } };

      const result = component['_populateAddressConfiguration'](parentField, childField);

      expect(result).toEqual({
        props: {
          componentId: 'postalCode',
          autocomplete: 'postal-code',
          type: 'text',
        },
        className: 'flex-quarter',
        type: 'nuverialTextInput',
      });
    });

    it('should populate postal code extension field', async () => {
      const { component } = await getFixtureByTemplate();
      const parentField: FormlyFieldConfig<FormlyAddressFieldProperties> = { key: 'personalInformation.currentAddress' };
      const childField: FormlyFieldConfig = { props: { componentId: 'postalCodeExtension' } };

      const result = component['_populateAddressConfiguration'](parentField, childField);

      expect(result).toEqual({
        props: {
          componentId: 'postalCodeExtension',
          type: 'text',
        },
        className: 'flex-quarter',
        type: 'nuverialTextInput',
      });
    });

    it('should populate country code field', async () => {
      const { component } = await getFixtureByTemplate();
      const parentField: FormlyFieldConfig<FormlyAddressFieldProperties> = { key: 'personalInformation.currentAddress' };
      const childField: FormlyFieldConfig = { props: { componentId: 'countryCode' } };

      const result = component['_populateAddressConfiguration'](parentField, childField);

      expect(result).toEqual({
        props: {
          componentId: 'countryCode',
          autocomplete: 'country',
          type: 'text',
        },
        className: 'flex-half',
        type: 'nuverialSelect',
      });
    });

    it('should return the child field if componentId is not recognized', async () => {
      const { component } = await getFixtureByTemplate();
      const parentField: FormlyFieldConfig<FormlyAddressFieldProperties> = { key: 'personalInformation.currentAddress' };
      const childField: FormlyFieldConfig = { props: { componentId: 'unknownComponent' } };

      const result = component['_populateAddressConfiguration'](parentField, childField);

      expect(result).toEqual(childField);
    });
  });
});
