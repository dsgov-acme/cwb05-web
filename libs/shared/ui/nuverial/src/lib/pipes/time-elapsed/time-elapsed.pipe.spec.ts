import { NuverialTimeElapsedPipe } from './time-elapsed.pipe';

describe('NuverialTimeElapsedPipe', () => {
  let pipe: NuverialTimeElapsedPipe;

  beforeEach(() => {
    pipe = new NuverialTimeElapsedPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return "1 day" message', () => {
    const refDate = new Date(); // Example of a past date
    refDate.setDate(refDate.getDate() - 1); // Set the end date to be 1 day in the past
    refDate.setSeconds(refDate.getSeconds() - 2); // 2 seconds to handle a race condition
    const result = pipe.transform(refDate);
    expect(result).toBe('1 day');
  });

  it('should return "2 days" message', () => {
    const refDate = new Date(); // Example of a past date
    refDate.setDate(refDate.getDate() - 2); // Set the end date to be 1 day in the past
    refDate.setSeconds(refDate.getSeconds() - 2); // 2 seconds to handle a race condition
    const result = pipe.transform(refDate);
    expect(result).toBe('2 days');
  });

  it('should return "0 time" when no time has elapsed', () => {
    const refDate = new Date(); // Example of a past date
    const result = pipe.transform(refDate);
    expect(result).toBe('0 time');
  });

  it('should return "1 hour" when 1 hour has elapsed', () => {
    const refDate = new Date();
    refDate.setHours(refDate.getHours() - 1); // Set the end date to be 1 hour in the past
    refDate.setSeconds(refDate.getSeconds() - 2); // 2 seconds to handle a race condition
    const result = pipe.transform(refDate);
    expect(result).toBe('1 hour');
  });

  it('should return "2 hours" when 2 hours have elapsed', () => {
    const refDate = new Date();
    refDate.setHours(refDate.getHours() - 2); // Set the end date to be 2 hours in the past
    refDate.setSeconds(refDate.getSeconds() - 2); // 2 seconds to handle a race condition
    const result = pipe.transform(refDate);
    expect(result).toBe('2 hours');
  });

  it('should return "1 minute" when 1 minute has elapsed', () => {
    const refDate = new Date();
    refDate.setMinutes(refDate.getMinutes() - 1); // Set the end date to be 1 minute in the past
    refDate.setSeconds(refDate.getSeconds() - 2); // 2 seconds to handle a race condition
    const result = pipe.transform(refDate);
    expect(result).toBe('1 minute');
  });

  it('should return "2 minutes" when 2 minutes have elapsed', () => {
    const refDate = new Date();
    refDate.setMinutes(refDate.getMinutes() - 2); // Set the end date to be 2 minutes in the past
    refDate.setSeconds(refDate.getSeconds() - 2); // 2 seconds to handle a race condition
    const result = pipe.transform(refDate);
    expect(result).toBe('2 minutes');
  });

  it('should return "1 second" when 1 second has elapsed', () => {
    const refDate = new Date();
    refDate.setSeconds(refDate.getSeconds() - 1); // Set the end date to be 1 second in the past
    const result = pipe.transform(refDate);
    expect(result).toBe('1 second');
  });

  it('should return "2 seconds" when 2 seconds have elapsed', () => {
    const refDate = new Date();
    refDate.setSeconds(refDate.getSeconds() - 2); // Set the end date to be 2 seconds in the past
    const result = pipe.transform(refDate);
    expect(result).toBe('2 seconds');
  });
});
