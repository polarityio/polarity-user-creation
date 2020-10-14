const Polarity = require('polarity-node-rest-api');
const { getUsers } = require('./lib/filesystem');
const Stopwatch = require('statman-stopwatch');

const stopwatch = new Stopwatch();
const Logger = require('./lib/logger');

const loadCmd = {
  command: 'create',
  desc: 'Create users based on CSV input ',
  builder: (yargs) => {
    return yargs
      .option('username', {
        type: 'string',
        demand: 'You must provide the Polarity "username" to upload data as',
        nargs: 1,
        describe: 'Username to login as'
      })
      .option('password', {
        type: 'string',
        demand: 'You must provide the password for the provided Polarity username',
        nargs: 1,
        describe: 'Password for the given Polarity username'
      })
      .option('url', {
        type: 'string',
        demand: 'You must provide Polarity url to include schema (e.g., https://my.polarity.internal)',
        nargs: 1,
        describe: 'Polarity server url to include schema'
      })
      .option('csv', {
        type: 'string',
        demand: 'You must provide the path to the CSV file to load',
        nargs: 1,
        describe: 'Directory to read CSV files from'
      })
      .option('simulate', {
        type: 'boolean',
        default: false,
        describe:
          'If provided, the loader will log a preview of the actions it would take but no actions will be taken.'
      })
      .option('ignoreErrors', {
        type: 'boolean',
        default: false,
        describe:
          'If provided, the user creation tool will attempt to create all users in the CSV rather than stop on the first failure.'
      });
  },
  handler: async (argv) => {
    stopwatch.start();
    const { url, username, password, csv, simulate, ignoreErrors } = argv;
    const successUsernames = [];
    const failedUsernames = [];

    Logger.info('Starting', { url, username, password: '**********', csv });
    try {
      const users = await getUsers(csv);
      Logger.info(`Creating ${users.length} new user accounts`);

      const polarity = new Polarity();

      await polarity.connect({
        host: url,
        username: username,
        password: password,
        request: {
          rejectUnauthorized: false
        }
      });

      for (const user of users) {
        const error = validateUser(user);
        if (error) {
          Logger.error('Failed to create user', error);
          failedUsernames.push(user.username);
        } else {
          const parsedUser = parseUser(user);
          Logger.info('Creating user', { parsedUser });
          if (!simulate) {
            try {
              if (parsedUser.password) {
                await polarity.createUser(parsedUser);
                Logger.info(`Created user ${parsedUser.username} with provided password`);
              } else {
                await polarity.createUser(parsedUser, true);
                Logger.info(`Created user ${parsedUser.username} and emailed new password`);
              }
              successUsernames.push(parsedUser.username);
            } catch (creationError) {
              Logger.error(`Failed to create user ${parsedUser.username}`, creationError);
              failedUsernames.push(parsedUser.username);
              if (!ignoreErrors) {
                throw creationError;
              }
            }
          }
        }
      }
    } catch (e) {
      Logger.error('Error loading users', e);
    } finally {
      Logger.info(`Total Time to Load: ${stopwatch.read()}`);
      Logger.info(`Created ${successUsernames.length} users, failed on ${failedUsernames.length} users`, {
        failedUsernames,
        successUsernames
      });
      Logger.info('Disconnecting from Polarity');
    }
  }
};

function parseUser(user) {
  let parsedUser = { ...user };
  if (parsedUser.isAdmin) {
    parsedUser.isAdmin = parsedUser.isAdmin === 'true' ? true : false;
  }
  if (parsedUser.isLocal) {
    parsedUser.isLocal = parsedUser.isLocal === 'true' ? true : false;
  }
  if (parsedUser.enabled) {
    parsedUser.enabled = parsedUser.enabled === 'true' ? true : false;
  }
  return parsedUser;
}

function validateUser(user) {
  let errors = [];
  if (!user.username) {
    errors.push('Missing username');
  }

  if (!user.email) {
    errors.push('Missing email');
  }

  if (!user.fullName) {
    errors.push('Missing fullName');
  }

  if (user.isAdmin && user.isAdmin !== 'true' && user.isAdmin !== 'false') {
    errors.push('Invalid valid for `isAdmin`.  Must be `true` or `false`');
  }

  if (user.isLocal && user.isLocal !== 'true' && user.isLocal !== 'false') {
    errors.push('Invalid valid for `isLocal`.  Must be `true` or `false`');
  }

  if (user.enabled && user.enabled !== 'true' && user.enabled !== 'false') {
    errors.push('Invalid valid for `enabled`.  Must be `true` or `false`');
  }

  if (errors.length > 0) {
    return {
      errors,
      user
    };
  }
}

require('yargs')
  .usage('Usage: $0 <command> [options]')
  .command(loadCmd)
  .help()
  .wrap(null)
  .version('Polarity User Creation Tool v' + require('./package.json').version)
  // help
  .epilog('(C) 2020 Polarity.io, Inc.').argv;
