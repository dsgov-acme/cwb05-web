import { TemplateRef } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { ReplaceNewlinePipe } from './replace-new-line.pipe';

describe('ReplaceNewlinePipe', () => {
  const pipe = new ReplaceNewlinePipe();

  it('transforms "Hello\nWorld" to "Hello<br/>World"', () => {
    expect(pipe.transform('Hello\nWorld')).toBe('Hello<br/>World');
  });

  it('transforms "Line1\nLine2\nLine3" to "Line1<br/>Line2<br/>Line3"', () => {
    expect(pipe.transform('Line1\nLine2\nLine3')).toBe('Line1<br/>Line2<br/>Line3');
  });

  it('should not transform if value is not a string', () => {
    expect(pipe.transform(10 as any)).toBe(10);
  });

  function renderPipe() {
    return render(`<div data-testid="property" [innerHTML]="'Hello\nWorld' | nuverialReplaceNewline"></div>`, {
      imports: [ReplaceNewlinePipe],
      providers: [{ provide: TemplateRef, useValue: {} }],
    });
  }

  it('should check if pipe is working in DOM', async () => {
    const { fixture } = await renderPipe();

    fixture.detectChanges();

    expect(screen.getByTestId('property').innerHTML).toBe('Hello<br>World');
  });
});
