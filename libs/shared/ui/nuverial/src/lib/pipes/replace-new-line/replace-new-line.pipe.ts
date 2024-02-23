import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'nuverialReplaceNewline',
  standalone: true,
})
export class ReplaceNewlinePipe implements PipeTransform {
  public transform(value: string): string {
    if (typeof value !== 'string') {
      return value;
    }

    return value.replace(/\n/g, '<br/>');
  }
}
