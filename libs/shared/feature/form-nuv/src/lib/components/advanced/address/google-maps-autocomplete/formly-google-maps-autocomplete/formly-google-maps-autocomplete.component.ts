import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NuverialTextInputComponent } from '@dsg/shared/ui/nuverial';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyBaseComponent } from '../../../../base';
import { FormlyAddressFieldProperties } from '../../formly/formly-address.model';
import { GooglePlace } from '../../models/googleplaces.api.model';
import { GoogleMapsAutocompleteComponent } from '../google-maps-autocomplete.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormlyModule, GoogleMapsAutocompleteComponent, NuverialTextInputComponent],
  selector: 'dsg-formly-google-maps-autocomplete',
  standalone: true,
  styleUrls: ['./formly-google-maps-autocomplete.component.scss'],
  templateUrl: './formly-google-maps-autocomplete.component.html',
})
export class FormlyGoogleMapsAutocompleteComponent extends FormlyBaseComponent<FormlyAddressFieldProperties> {
  public setAutocompleteFields(address: GooglePlace) {
    if (address && this.field.props.gotGoogleAddress) {
      this.field.props.gotGoogleAddress(address);
    }
  }
}
