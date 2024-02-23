import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NuverialIconComponent } from '../icon';
import { ITag } from './tag.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatTooltipModule, NuverialIconComponent],
  selector: 'nuverial-tag',
  standalone: true,
  styleUrls: ['./tag.component.scss'],
  templateUrl: './tag.component.html',
})
export class NuverialTagComponent {
  @Input() public tag!: ITag;

  private readonly _hexRegex = /^#(\w{3}|\w{6})$/;

  public get tagBackgroundColor() {
    if (!this.tag.backgroundColor) return '';

    if (!this._hexRegex.test(this.tag.backgroundColor as string)) {
      return `var(${this.tag.backgroundColor})`;
    }

    return this.tag.backgroundColor;
  }

  public get tagTextColor() {
    if (!this.tag.textColor) return '';

    if (!this._hexRegex.test(this.tag.textColor as string)) {
      return `var(${this.tag.textColor})`;
    }

    return this.tag.textColor;
  }

  public get tagBorderColor() {
    if (!this.tag.borderColor) return '';

    if (!this._hexRegex.test(this.tag.borderColor as string)) {
      return `var(${this.tag.borderColor})`;
    }

    return this.tag.borderColor;
  }

  public get tagIconColor() {
    if (!this.tag.iconColor) return 'var(--theme-color-white)';

    if (!this._hexRegex.test(this.tag.iconColor as string)) {
      return `var(${this.tag.iconColor})`;
    }

    return this.tag.iconColor;
  }
}
