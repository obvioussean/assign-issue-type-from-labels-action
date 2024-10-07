import { throttling } from '@octokit/plugin-throttling';
import { Octokit } from '@octokit/core';
import { IssueManager } from './issueManager.js';
import { Issue } from './types.js';
import { IssueTypeManager } from './issueTypeManager.js';

const ThrottledOctokit = Octokit.plugin(throttling);

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
});

(async () => {
    const owner = `${process.env.OWNER}`;
    const repositoryName = `${process.env.REPOSITORY_NAME}`;
    const issueManager = new IssueManager(graphql, owner, repositoryName);
    const issueTypesManager = new IssueTypeManager(graphql, owner, repositoryName);
    const issues = await issueManager.getIssues();
    const issueTypes = await issueTypesManager.getIssueTypes();

    for (const issue of issues) {
        const labels = issueManager.getLabels(issue);
        const issueType = issueTypes.find(i => labels.find(l => i.name.toLocaleLowerCase() === l));
        if (issueType && issue.issueType?.name !== issueType.name) {
            await issueManager.updateIssueIssueType(issue.id, issueType.id);
            console.log(`Updated issue ${issue.number} to issue type ${issueType.name}`);
        }
    }
})();