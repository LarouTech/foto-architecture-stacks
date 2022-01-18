#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { devStackBuilder, steStackBuilder } from './functions/environment-stacks';
import { STAGE } from './functions/cdk-functions';
require("dotenv").config();

const app = new App();

if (process.env.STAGE_ENV === STAGE.DEV) {
  devStackBuilder(app, STAGE.DEV)
}

if (process.env.STAGE_ENV === STAGE.STE) {
  steStackBuilder(app, STAGE.STE)
}







