import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { render } from '@testing-library/angular';
import { MockBuilder } from 'ng-mocks';
import { NuverialStepperComponent } from '../../components';
import { NuverialStepperKeyDirective } from './stepper-key.directive';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NuverialStepperKeyDirective],
  selector: 'nuverial-test-stepper-key',
  template: ` <ng-template nuverialStepperKey="Stepper Key 1"></ng-template>`,
})
class TestComponent {
  @ViewChild(NuverialStepperKeyDirective, { static: true }) public directive!: NuverialStepperKeyDirective;
}

const dependencies = MockBuilder(NuverialStepperKeyDirective).mock(NuverialStepperComponent).keep(CommonModule).build();

const getFixture = async (props: Record<string, Record<string, unknown>>) => {
  const { fixture } = await render(TestComponent, {
    ...dependencies,
    providers: [
      {
        provide: NuverialStepperComponent,
        useValue: {
          addTemplate: jest.fn(),
        },
      },
    ],
    ...props,
  });

  return { fixture };
};

describe('NuverialStepperKeyDirective', () => {
  it('should add the template to the stepper component', async () => {
    const { fixture } = await getFixture({});
    const component = fixture.componentInstance;
    fixture.detectChanges();
    const tabsComponent = component.directive['_stepperComponent'];
    jest.spyOn(tabsComponent, 'addTemplate');

    component.directive.ngAfterViewChecked();

    expect(tabsComponent.addTemplate).toHaveBeenCalledWith('Stepper Key 1', component.directive['_templateRef']);
  });
});
