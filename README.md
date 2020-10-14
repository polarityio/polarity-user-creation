# Polarity User Creation

![image](https://img.shields.io/badge/status-beta-green.svg)

This is a Node.js based CLI tool for bulk creation of local Polarity accounts from a CSV file.

This tool is currently in `beta`.  If you're interested in using this tool please contact us at support@polarity.io for assistance.

# Installation

This script can be run from any server with Node.js 10+ installed.  In most cases it will be easiest to install onto your Polarity Server.  You can install by downloading the release `tgz` file under the `releases` page on github or you can install via `git`.  If installing via `git` you would use the following commands:  

```
git clone https://github.com/polarityio/polarity-user-creation
cd polarity-user-creation
npm install
chmod u+x polarity-user-creation.sh
```

# Overview

The Polarity User Creation CLI tool will create user accounts based on a CSV file.  The CSV file must include the following required headers:

* username
* email
* fullName

Optionally, the CSV can include the following headers:

* isAdmin
* isLocal
* enabled
* password

> The `password` header is required if SMTP is not configured

> Valid values for `isAdmin`, `isLocal`, and `enabled` are `true` or `false`

For example, a basic CSV file would look like this:

```
username,email,fullName
bob,bob@polarity.io,Bob Bobby
alice,alice@polarity.io,Alice Alicen 
charles,charles@polarity.io,Charles Charley
```

In the example above, each account would default to a non-admin, local account that is enabled.  In addition, the users will have the password generated and sent to them by the server.  For this configuration to work, SMTP must be configured and enabled on the Polarity Server.

A CSV that makes use of the optional headers would look like this:

```
username,email,fullName,isAdmin,enabled,password
bob,bob@polarity.io,Bob Bobby,true,true,PolarityServer1234!
alice,alice@polarity.io,Alice Alicen,false,true,PolarityServer5678! 
charles,charles@polarity.io,Charles Charley,false,false,PolarityServer9101!
```

Note that the boolean headers `isAdmin`, `isLocal`, and `enabled` must have a value of `true` or `false`.

### CLI Options

To view all available options user the `help` command with the script:

```
./polarity-user-creation.sh help
```

This will output the following available options:

```
Create users based on CSV input

Options:
  --help          Show help  [boolean]
  --version       Show version number  [boolean]
  --username      Username to login as  [string] [required]
  --password      Password for the given Polarity username  [string] [required]
  --url           Polarity server url to include schema  [string] [required]
  --csv           Directory to read CSV files from  [string] [required]
  --simulate      If provided, the loader will log a preview of the actions it would take but no actions will be taken.  [boolean] [default: false]
  --ignoreErrors  If provided, the user creation tool will attempt to create all users in the CSV rather than stop on the first failure.  [boolean] [default: false]
```

### Example Script Usage

Basic usage:

```
./polarity-user-creation.sh -username admin --password password123 --url https://polarity.dev --csv /root/users.csv 
```

If you would like to continue creating users even if one user fails to be created then you can include the `ignoreErrors` flag (by default, the CLI tool will exist on the first failure).

```
./polarity-user-creation.sh -username admin --password password123 --url https://polarity.dev --csv /root/users.csv --ignoreErrors
```

If you'd like to test the script without actually creating the user accounts use the `--simulate` command:

```
./polarity-user-creation.sh -username admin --password password123 --url https://polarity.dev --csv /root/users.csv --simulate
```