import { App } from "aws-cdk-lib";

import { PipelineStack } from "../lib/pipeline-stack";

const app = new App();

// The account comes from whichever AWS credentials run `cdk deploy`.
new PipelineStack(app, "FinsightPipeline", { env: { region: "us-east-1" } });
