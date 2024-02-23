import { Pipe, PipeTransform } from '@angular/core';
import getTimeDifferenceMessage from '../time-elapsed/time-difference-message';

/**
 * A pipe that calculates the time remaining between the current date and a given end date.
 * Returns the time remaining in days, hours, minutes, or seconds.
 *
 * usage: {{dateString or Date | nuverialTimeRemaining}
 */
@Pipe({
  name: 'nuverialTimeRemaining',
  standalone: true,
})
export class NuverialTimeRemainingPipe implements PipeTransform {
  /**
   * Transforms the given end date into a string representing the time remaining.
   * @param end - The end date or string representation of the end date.
   * @returns A string representing the time remaining.
   */
  public transform(end: string | Date): string {
    const startDate = new Date();
    const endDate = new Date(end);

    if (!(endDate instanceof Date)) {
      return 'Invalid date';
    }

    const timeDifference = Math.max(0, endDate.getTime() - startDate.getTime());

    return getTimeDifferenceMessage(timeDifference);
  }
}
