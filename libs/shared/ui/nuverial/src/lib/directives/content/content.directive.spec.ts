import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { NuverialContentDirective } from './content.directive';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NuverialContentDirective],
  selector: 'nuverial-test-content',
  template: `<div data-testid="test-content" [nuverialContentType]="contentType"></div>`,
})
class TestComponent {
  @ViewChild(NuverialContentDirective, { static: true }) public directive!: NuverialContentDirective;
  public contentType: 'content' | 'footer' | 'image' | 'title' | 'label' = 'content';
}

const getFixture = async (props: Record<string, Record<string, unknown>>) => {
  const { fixture } = await render(TestComponent, {
    imports: [NuverialContentDirective],
    providers: [],
    ...props,
  });

  return { fixture };
};

describe('NuverialContentDirective', () => {
  it('should create an instance', async () => {
    const { fixture } = await getFixture({});
    const component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should return nuverial-content-content on default', async () => {
    const { fixture } = await getFixture({});
    const element = screen.queryByTestId('test-content');

    fixture.detectChanges();
    expect(element).toHaveClass('nuverial-content-content');
  });

  it('should return nuverial-content-footer if content type is footer', async () => {
    const { fixture } = await getFixture({ componentProperties: { contentType: 'footer' } });
    fixture.detectChanges();

    const element = screen.queryByTestId('test-content');
    expect(element).toHaveClass('nuverial-content-footer');
  });

  it('should return nuverial-content-image if content type is image', async () => {
    const { fixture } = await getFixture({ componentProperties: { contentType: 'image' } });
    fixture.detectChanges();

    const element = screen.queryByTestId('test-content');
    expect(element).toHaveClass('nuverial-content-image');
  });

  it('should return nuverial-content-title if content type is title', async () => {
    const { fixture } = await getFixture({ componentProperties: { contentType: 'title' } });
    fixture.detectChanges();

    const element = screen.queryByTestId('test-content');
    expect(element).toHaveClass('nuverial-content-title');
  });

  it('should return nuverial-content-label if content type is label', async () => {
    const { fixture } = await getFixture({ componentProperties: { contentType: 'label' } });
    fixture.detectChanges();

    const element = screen.queryByTestId('test-content');
    expect(element).toHaveClass('nuverial-content-label');
  });
});
