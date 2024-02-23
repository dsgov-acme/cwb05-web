const getTimeDifferenceMessage = (timeDifference: number) => {
  const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);
  let message = '';

  if (days > 0) {
    message += `${days} day`;

    if (days > 1) {
      message += 's';
    }

    return message.trim();
  }

  if (hours > 0) {
    message += ` ${hours} hour`;

    if (hours > 1) {
      message += 's';
    }

    return message.trim();
  }

  if (minutes > 0) {
    message += ` ${minutes} minute`;

    if (minutes > 1) {
      message += 's';
    }
  }

  if (seconds > 0 && !message.length) {
    message = `${seconds} second`;

    if (seconds > 1) {
      message += 's';
    }
  }

  return message.trim() || '0 time';
};

export default getTimeDifferenceMessage;
