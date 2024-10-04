import * as core from '@actions/core';
import * as github from '@actions/github';
import { throttling } from '@octokit/plugin-throttling';
import { Octokit } from '@octokit/core';

const ThrottledOctokit = Octokit.plugin(throttling);

async function run(): Promise<void> {
    const token = `${process.env.PAT_TOKEN}`;
    const octoKit = new ThrottledOctokit({
        auth: token,
        previews: ["cloak"],
        throttle: {
            onRateLimit: (retryAfter: number, options: any, octokit: any) => {
                octokit.log.warn(
                    `Request quota exhausted for request ${options.method} ${options.url}`
                );

                octokit.log.info(`Retrying after ${retryAfter} seconds for the ${options.request.retryCount} time!`);

                return true;
            },
            onSecondaryRateLimit: (retryAfter: number, options: any, octokit: any) => {
                // does not retry, only logs a warning
                octokit.log.warn(
                    `Abuse detected for request ${options.method} ${options.url}`
                );

                octokit.log.info(`Retrying after ${retryAfter} seconds for the ${options.request.retryCount} time!`);

                return true;
            },
        },
    });
    const graphql = octoKit.graphql.defaults({
        headers: {
            "GraphQL-Features": "issue_types"
        }
    })

    const owner = core.getInput("owner", { required: true });
    const repositoryName = core.getInput("repository-name", { required: true });
}

run();