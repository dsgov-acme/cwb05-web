import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { INuverialSelectOption, NuverialSectionHeaderComponent, NuverialTextInputComponent } from '@dsg/shared/ui/nuverial';
import { FormlyExtension, FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { defaultPrePopulateAdvancedComponent, FormlyBaseComponent, isPrePopulated } from '../../../base';
import { FormlyGoogleMapsAutocompleteComponent } from '../google-maps-autocomplete/formly-google-maps-autocomplete/formly-google-maps-autocomplete.component';
import { GooglePlace } from '../models/googleplaces.api.model';
import { FormlyAddressFieldProperties } from './formly-address.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormlyModule, NuverialSectionHeaderComponent, FormlyGoogleMapsAutocompleteComponent, NuverialTextInputComponent],
  selector: 'dsg-formly-address',
  standalone: true,
  styleUrls: ['./formly-address.component.scss'],
  templateUrl: './formly-address.component.html',
})
export class FormlyAddressComponent extends FormlyBaseComponent<FormlyAddressFieldProperties> implements FormlyExtension, OnInit {
  public countrySelectLabels = new Map();
  public reviewDetailsMap = new Map<string, string>();

  public get reviewDetails() {
    this.reviewDetailsMap.set('countryLabel', this.countrySelectLabels.get(this.reviewDetailsMap.get('countryCode')));
    const model = Object.fromEntries(this.reviewDetailsMap);

    return model;
  }

  public prePopulate(field: FormlyFieldConfig<FormlyAddressFieldProperties>): void {
    if (isPrePopulated(field)) return;

    defaultPrePopulateAdvancedComponent(field);

    const labelField: FormlyFieldConfig = {
      className: 'flex-full',
      props: {
        label: field.props?.label,
      },
      type: 'nuverialSectionHeader',
    };

    const fieldGroup = [field.props?.label ? labelField : {}, ...(field.fieldGroup || [])].map(childField => {
      return this._populateAddressConfiguration(field, childField);
    });

    field.fieldGroup = fieldGroup;
  }

  public ngOnInit(): void {
    this.field.fieldGroup?.forEach(field => {
      this.reviewDetailsMap.set(field.props?.['componentId'], this.form.get(field?.key?.toString() || '')?.value);
    });
    this.field.fieldGroup
      ?.find(field => field.props?.['componentId'] === `countryCode`)
      ?.props?.['selectOptions']?.forEach((option: INuverialSelectOption) => this.countrySelectLabels.set(option.key, option.displayTextValue));
  }

  public trackByFn(_index: number, item: FormlyFieldConfig) {
    return item.id;
  }

  private _populateAddressConfiguration(parentField: FormlyFieldConfig<FormlyAddressFieldProperties>, childField: FormlyFieldConfig): FormlyFieldConfig {
    const componentId = childField.props?.['componentId'];

    if (componentId === 'addressLine1') {
      return this._populateAddressLine1(parentField, childField);
    } else if (componentId === 'addressLine2') {
      return this._populateAddressField({ autocomplete: 'address-line2', field: childField });
    } else if (componentId === 'city') {
      return this._populateAddressField({ autocomplete: 'address-level2', field: childField });
    } else if (componentId === 'stateCode') {
      return this._populateAddressField({ autocomplete: 'address-level1', field: childField, type: 'nuverialSelect' });
    } else if (componentId === 'postalCode') {
      return this._populateAddressField({ autocomplete: 'postal-code', className: 'flex-quarter', field: childField });
    } else if (componentId === 'postalCodeExtension') {
      return this._populateAddressField({ className: 'flex-quarter', field: childField });
    } else if (componentId === 'countryCode') {
      return this._populateAddressField({ autocomplete: 'country', field: childField, type: 'nuverialSelect' });
    } else {
      return childField;
    }
  }

  private _populateAddressLine1(parentField: FormlyFieldConfig<FormlyAddressFieldProperties>, addressField: FormlyFieldConfig): FormlyFieldConfig {
    return {
      ...addressField,
      className: 'flex-half',
      props: {
        ...addressField.props,
        autocomplete: 'address-line1',
        ...(parentField.props?.addressValidationEnabled && {
          gotGoogleAddress: (address: GooglePlace) => this._gotGoogleAddress(address, parentField),
        }),
        type: 'text',
      },
      type: parentField.props?.addressValidationEnabled ? 'nuverialGoogleMapsAutocomplete' : 'nuverialTextInput',
    };
  }

  private _gotGoogleAddress(address: GooglePlace, field: FormlyFieldConfig<FormlyAddressFieldProperties>) {
    if (!address) return;

    field.fieldGroup?.forEach(formField => {
      const componentId: string = formField.props?.['componentId'];

      if (!componentId) return;

      formField.formControl?.setValue(address[componentId as keyof GooglePlace]);
    });
  }

  private _populateAddressField({
    autocomplete,
    className = 'flex-half',
    field,
    type = 'nuverialTextInput',
  }: {
    autocomplete?: string;
    className?: string;
    field: FormlyFieldConfig;
    type?: string;
  }): FormlyFieldConfig {
    return {
      ...field,
      className,
      props: {
        ...field.props,
        ...(autocomplete ? { autocomplete } : {}),
        type: 'text',
      },
      type,
    };
  }
}
