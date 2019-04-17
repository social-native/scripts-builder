# About

This repo provides microservices with core features.

TODO add features:

 - [ ] `Typescript` for typing `snpkg-snapi-common type-check`
 - [ ] `TSLint` for linting `snpkg-snapi-common lint`
 - [ ] `Prettier` for making the code beautiful `snpkg-snapi-common prettier`
 - [ ] `Depcheck` for dependency checking `snpkg-snapi-common dep-check`
 - [ ] `CircleCI` for CI. You will need to enable the CI on the CircleCI site.
 - [ ] `Jest` for testing and test coverage reporting `snpkg-snapi-common test`

# Usage

- To add one of these features to your service, reference the feature in your `package.json` scripts. Example:

`snpkg-snapi-common test` will run Jest tests.

- Each configuration (say Jest or TSLint, for instance) can be overrriden by placing a configuration file in the root folder.

- You can `eject` on a feature-by-feature level. Ex: `snpkg-snapi-common eject test`. This will replace the scripts entry, install the relevant packages in the `node_modules`, and add a configuration file.

