import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { NuverialCardContentDirective } from './card-content.directive';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NuverialCardContentDirective],
  selector: 'nuverial-test-card-content',
  template: `<div data-testid="test-card-content" [nuverialCardContentType]="contentType"></div>`,
})
class TestComponent {
  @ViewChild(NuverialCardContentDirective, { static: true }) public directive!: NuverialCardContentDirective;
  public contentType: 'content' | 'footer' | 'image' | 'title' = 'content';
}

const getFixture = async (props: Record<string, Record<string, unknown>>) => {
  const { fixture } = await render(TestComponent, {
    imports: [NuverialCardContentDirective],
    providers: [],
    ...props,
  });

  return { fixture };
};

describe('NuverialCardContentDirective', () => {
  it('should create an instance', async () => {
    const { fixture } = await getFixture({});
    const component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should return nuverial-card-content on default', async () => {
    const { fixture } = await getFixture({});
    const element = screen.queryByTestId('test-card-content');

    fixture.detectChanges();
    expect(element).toHaveClass('nuverial-card-content');
  });

  it('should return nuverial-card-footer if content type is footer', async () => {
    const { fixture } = await getFixture({ componentProperties: { contentType: 'footer' } });
    fixture.detectChanges();

    const element = screen.queryByTestId('test-card-content');
    expect(element).toHaveClass('nuverial-card-footer');
  });

  it('should return nuverial-card-image if content type is image', async () => {
    const { fixture } = await getFixture({ componentProperties: { contentType: 'image' } });
    fixture.detectChanges();

    const element = screen.queryByTestId('test-card-content');
    expect(element).toHaveClass('nuverial-card-image');
  });

  it('should return nuverial-card-title if content type is title', async () => {
    const { fixture } = await getFixture({ componentProperties: { contentType: 'title' } });
    fixture.detectChanges();

    const element = screen.queryByTestId('test-card-content');
    expect(element).toHaveClass('nuverial-card-title');
  });
});
