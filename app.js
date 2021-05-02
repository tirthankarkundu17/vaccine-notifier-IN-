const moment = require('moment');
const cron = require('node-cron'); // A node based cron manager
const axios = require('axios'); // For REST calls
const notifier = require('./notifier');

const PIN = process.env.PIN; // Fill this with the PIN you want to check
const EMAIL = process.env.EMAIL; // Fill this with your email
const AGE = process.env.AGE; // Fill this with the minimum age limit

async function schedule() {
  try {
    // Will check every minute
    cron.schedule('* * * * *', async () => {
      console.log('Running now...');
      await checkAvailabeSlots(PIN);
    });
  } catch (e) {
    console.log('Error occured', e);
    throw e;
  }
}

async function checkAvailabeSlots(pinCode) {
  let dates = await fetchNext5Days();
  dates.forEach((date) => {
    getSlotsForDateandPin(pinCode, date);
  });
}

function getSlotsForDateandPin(pinCode, date) {
  let config = {
    method: 'get',
    url:
      'https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByPin?pincode=' +
      pinCode +
      '&date=' +
      date,
    headers: {
      accept: 'application/json',
      'Accept-Language': 'hi_IN',
    },
  };

  axios(config)
    .then(function (slots) {
      let sessions = slots.data.sessions;
      let validSlots = sessions.filter(
        (slot) => slot.min_age_limit <= AGE && slot.available_capacity > 0
      );
      if (validSlots.length > 0) {
        notifyAvailability(validSlots);
      }
    })
    .catch(function (error) {
      console.log(error);
    });
}

async function notifyAvailability(validSlots) {
  let details = '';
  validSlots.forEach((value, index) => {
    details =
      details +
      value.name +
      '\t' +
      value.block_name +
      '\t' +
      value.vaccine +
      '\t' +
      value.fee_type +
      '\n';
  });

  notifier.sendEmail(EMAIL, 'Vaccine is Available', details, (err, result) => {
    if (err) {
      console.error({ err });
    }
  });
}

async function fetchNext5Days() {
  let dates = [];
  let today = moment();
  for (let i = 0; i < 5; i++) {
    let dateString = today.format('DD-MM-YYYY');
    dates.push(dateString);
    today.add(1, 'day');
  }
  return dates;
}

schedule().then(() => {
  console.log('-----App has started-----');
});
