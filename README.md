# CPSC 310 Project Repository


## Configuring your environment

To start using this project, you need to get your development environment configured so that you can build and execute the code.
To do this, follow these steps; the specifics of each step will vary based on your operating system:

1. [Install Node LTS](https://nodejs.org/en/download/) (LTS: v18.X), which will also install NPM (you should be able to execute `node --version` and `npm --version` on the command line).

1. [Install Yarn](https://yarnpkg.com/en/docs/install) (1.22.X). You should be able to execute `yarn --version`.


## Project commands

Once your environment is configured you need to further prepare the project's tooling and dependencies.
In the project folder:

1. `yarn install` to download the packages specified in the project's *package.json* to the *node_modules* directory.

1. `yarn build` to compile the project.

1. `yarn test` to run the test suite.

1. `yarn lint` to lint the project code.

1. `yarn pretty` to prettify the project code.
