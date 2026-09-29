import { App } from "aws-cdk-lib";

import { PipelineStack } from "../lib/pipeline-stack";

const app = new App();

/** Reads a string from cdk.json or `-c key=value`; blank counts as unset. */
function context(key: string) {
  const value: unknown = app.node.tryGetContext(key);
  return typeof value === "string" && value !== "" ? value : undefined;
}

const vercelTeamSlug = context("vercelTeamSlug");
const vercelProjectName = context("vercelProjectName");

// The account comes from whichever AWS credentials run `cdk deploy`.
new PipelineStack(app, "FinsightPipeline", {
  env: { region: "us-east-1" },
  scheduleEnabled: String(app.node.tryGetContext("scheduleEnabled")) === "true",
  bedrockModelId: String(app.node.getContext("bedrockModelId")),
  vercel:
    vercelTeamSlug && vercelProjectName
      ? {
          teamSlug: vercelTeamSlug,
          projectName: vercelProjectName,
          oidcProviderArn: context("vercelOidcProviderArn"),
        }
      : undefined,
});
