import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, HostBinding } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  selector: 'nuverial-pill',
  standalone: true,
  styleUrls: ['./pill.component.scss'],
  templateUrl: './pill.component.html',
})
export class NuverialPillComponent {
  @HostBinding('class') public get componentClass() {
    return 'nuverial-pill';
  }
}
