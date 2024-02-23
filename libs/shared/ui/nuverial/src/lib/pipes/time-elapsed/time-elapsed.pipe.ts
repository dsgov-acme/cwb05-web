import { Pipe, PipeTransform } from '@angular/core';
import getTimeDifferenceMessage from './time-difference-message';

/**
 * A pipe that calculates the time elapsed between the current date and a given date.
 * Returns the time elapsed in days, hours, minutes, or seconds.
 *
 * usage: {{dateString or Date | nuverialTimeElapsed}
 */
@Pipe({
  name: 'nuverialTimeElapsed',
  standalone: true,
})
export class NuverialTimeElapsedPipe implements PipeTransform {
  /**
   * Transforms the given end date into a string representing the time elapsed.
   * @param date - The end date or string representation of the end date.
   * @returns A string representing the time elapsed.
   */
  public transform(date: string | Date): string {
    const startDate = new Date();
    const refDate = new Date(date);

    if (!(refDate instanceof Date)) {
      return 'Invalid date';
    }

    const timeDifference = Math.max(0, startDate.getTime() - refDate.getTime());

    return getTimeDifferenceMessage(timeDifference);
  }
}
