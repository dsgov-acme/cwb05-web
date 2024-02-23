import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NuverialSectionHeaderComponent, NuverialSelectComponent, NuverialTextInputComponent } from '@dsg/shared/ui/nuverial';
import { FormioBaseCustomComponent } from '../../../base';
import { FormlyAddressFieldProperties } from '../formly/formly-address.model';
import { GoogleMapsAutocompleteComponent } from '../google-maps-autocomplete/google-maps-autocomplete.component';
import { GooglePlace } from '../models/googleplaces.api.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    GoogleMapsAutocompleteComponent,
    NuverialSectionHeaderComponent,
    NuverialTextInputComponent,
    NuverialSelectComponent,
  ],
  selector: 'dsg-formio-address',
  standalone: true,
  styleUrls: ['./formio-address.component.scss'],
  templateUrl: './formio-address.component.html',
})
export class FormioAddressComponent extends FormioBaseCustomComponent<string, FormlyAddressFieldProperties> {
  public addressForm: FormGroup = new FormGroup({
    addressLine1: new FormControl(''),
    addressLine2: new FormControl(''),
    city: new FormControl(''),
    countryCode: new FormControl(''),
    postalCode: new FormControl(''),
    postalCodeExtension: new FormControl(''),
    stateCode: new FormControl(''),
  });

  public setAutocompleteFields(address: GooglePlace) {
    if (!address) return;

    this.components?.forEach(component => {
      const componentId = component.props?.componentId;

      if (!componentId) return;

      this.addressForm.get(componentId)?.setValue(address[componentId as keyof GooglePlace]);
    });
  }
}
