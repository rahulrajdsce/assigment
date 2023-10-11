const fs = require('fs');
const csv = require('csv-parser');

// Define constants for column names based on the given format
const EMPLOYEE_NAME = 'Employee Name';
const POSITION = 'Position ID';
const TIME_IN = 'Time';
const TIME_OUT = 'Time Out';

// Define the criteria for analysis
const CONSECUTIVE_DAYS = 7;
const MIN_HOURS_BETWEEN_SHIFTS = 1;
const MAX_HOURS_IN_SINGLE_SHIFT = 14;

function timeDifferenceInHours(time1, time2) {
  const [hours1, minutes1] = time1.split(':').map(Number);
  const [hours2, minutes2] = time2.split(':').map(Number);
  const minutesDiff = (hours2 - hours1) * 60 + (minutes2 - minutes1);
  return minutesDiff / 60;
}

function analyzeEmployeeData(file) {
  let employees = {};
  let currentEmployee = null;
  let consecutiveWorkDays = 0;

  fs.createReadStream(file)
    .pipe(csv())
    .on('data', (row) => {
      const employeeName = row[EMPLOYEE_NAME];
      const position = row[POSITION];
      const timeIn = row[TIME_IN];
      const timeOut = row[TIME_OUT];

      if (currentEmployee !== employeeName) {
        currentEmployee = employeeName;
        consecutiveWorkDays = 1;
        employees[currentEmployee] = { position, shifts: [] };
      } else {
        consecutiveWorkDays++;
      }

      employees[currentEmployee].shifts.push({ timeIn, timeOut });

      if (consecutiveWorkDays === CONSECUTIVE_DAYS) {
        console.log(`${currentEmployee} (Position: ${position}) worked for ${CONSECUTIVE_DAYS} consecutive days`);
      }
    })
    .on('end', () => {
      analyzeShifts(employees);
    });
}

function analyzeShifts(employees) {
  for (const employee in employees) {
    const { position, shifts } = employees[employee];
    for (let i = 0; i < shifts.length - 1; i++) {
      const timeOut1 = shifts[i].timeOut;
      const timeIn2 = shifts[i + 1].timeIn;
      const hoursBetweenShifts = timeDifferenceInHours(timeOut1, timeIn2);

      if (hoursBetweenShifts > MIN_HOURS_BETWEEN_SHIFTS && hoursBetweenShifts < MAX_HOURS_IN_SINGLE_SHIFT) {
        console.log(`${employee} (Position: ${position}) has less than 10 hours but greater than 1 hour between shifts (between shift ${i + 1} and ${i + 2})`);
      }

      if (timeDifferenceInHours(shifts[i].timeIn, timeOut1) > MAX_HOURS_IN_SINGLE_SHIFT) {
        console.log(`${employee} (Position: ${position}) worked for more than 14 hours in a single shift (shift ${i + 1})`);
      }
    }
  }
}

const inputFile = 'Assignment_Timecard.csv'; // Replace with the actual file path
analyzeEmployeeData(inputFile);
