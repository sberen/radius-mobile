export const allNumbers: string[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Parser for displaying phone numbers
 * @param {string} phoneNum
 * @return {string} parsed phone number
 */
export function parsePhoneNum(phoneNum : string) : string {
  if (phoneNum.length <= 3) {
    return phoneNum;
  } else {
    phoneNum = '(' + phoneNum.substring(0, 3) + ')' + phoneNum.substring(3);
  }

  if (phoneNum.length > 8) {
    phoneNum = phoneNum.substring(0, 8) + '-' + phoneNum.substring(8);
  }
  return phoneNum;
};

/**
 * Parses Name for customer side display
 * @param {string} firstName first name of customer
 * @param {string} lastName last name of customer
 * @return {string} display name
 */
export function parseShortName(firstName: string, lastName: String) : string {
  if (lastName.length < 1) {
    return firstName.substring(0, 1).toUpperCase();
  }
  return firstName.substring(0, 1).toUpperCase() + ' ' +
      lastName.substring(0, 1).toUpperCase();
};

/**
 * Parses a date object to get just the hours and minutes
 * portion.
 * @param {Date} date date object to be parsed
 * @return {string} the final parsed string
 */
export function parseTimeString(date: Date) {
  return date.toTimeString().slice(0, 8);
};

/**
 * Converts a military time string to a normal time string.
 * 
 * @param militaryTime string in the form HH:mm:ss
 * @return string in from of h:mm:ss
 */
export function toStandardTime(militaryTime) {
  militaryTime = militaryTime.split(':');
  if (militaryTime[0].charAt(0) == 1 && militaryTime[0].charAt(1) > 2) {
    return (militaryTime[0] - 12) + ':' + militaryTime[1] + ':' + militaryTime[2] + ' pm ';
  } else {
    return militaryTime.join(':') + ' am ';
  }
};

/**
 * Converts a Date object to string format suited for operation hours display.
 * @param {Date} date date object to be converted to operation hours format
 * @return string in form h:mm am/pm
 */
export function dateToOperationHours(date: Date) {
  const hours = date.getHours();
  const mins = date.getMinutes();
  const hourDisplay = hours == 0 ? 12 : (hours < 12 ? hours : hours - 12);
  // const hourDisplayWithZero = hourDisplay < 10 ? '0' + hourDisplay : hourDisplay
  const minsWithZero = mins < 10 ? '0' + mins : mins;
  const amPm = hours < 12 ? 'am' : 'pm';
  return `${hourDisplay}:` + `${minsWithZero}` + ` ${amPm}`;
};

/**
 * Returns the correct suffix for the users position number.
 * @param {number} position Their position in line
 * @return {string} The suffix
 */
export function getSuffix(position: number) {
  const ones = position % 10;
  const tens = position % 100;
  if (ones === 1 && tens !== 11) {
    return "st";
  }
  if (ones === 2 && tens !== 12) {
    return "nd";
  }
  if (ones === 3 && tens !== 13) {
    return "rd";
  }
  return "th";
}
