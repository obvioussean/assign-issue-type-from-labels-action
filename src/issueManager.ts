import { ClearProjectV2ItemFieldValueInput, CreateIssueInput, CreateIssuePayload, IssueConnection, IssueEdge, ProjectV2, ProjectV2Field, ProjectV2FieldConfiguration, ProjectV2Item, ProjectV2ItemConnection, ProjectV2ItemFieldIterationValue, ProjectV2ItemFieldSingleSelectValue, ProjectV2IterationField, ProjectV2IterationFieldIteration, ProjectV2SingleSelectField, ProjectV2SingleSelectFieldOption, Repository, UpdateIssueInput, UpdateIssuePayload, UpdateProjectV2ItemFieldValueInput } from '@octokit/graphql-schema';
import { GraphQlResponse } from '@octokit/graphql/types';
import { RequestHeaders, RequestParameters } from '@octokit/types';
import { Issue } from "./types.js";

type graphql = <ResponseData>(query: string, parameters?: RequestParameters) => GraphQlResponse<ResponseData>;

export class IssueManager {
    constructor(private graphql: graphql, private owner: string, private repositoryName: string) { }

    public async getIssues(): Promise<Issue[]> {
        const query = `
            query ($owner: String!, $name: String!, $cursor: String) {
                repository(owner: $owner, name: $name) {
                    issues(first: 100, after: $cursor) {
                        nodes {
                            id
                            number
                            title
                            state
                            url
                            labels(first:100) {
                                nodes {
                                    id
                                    name
                                }
                            }
                            issueType {
                                id
                                name
                            }
                        }
                        pageInfo {
                            endCursor
                            hasNextPage
                        }
                    }
                }
            }
        `;

        return await this.pageIssues(query);
    }

    public async updateIssueIssueType(issueId: string, issueTypeId: string): Promise<void> {
        const query = `
            mutation UpdateIssueIssueTypeMutation($input: UpdateIssueIssueTypeInput!) {
                updateIssueIssueType(input: $input) {
                    issue {
                        issueType {
                            id
                        }
                    }
            }
        }
        `;

        await this.graphql(
            query,
            {
                input: {
                    issueId,
                    issueTypeId
                }
            }
        );
    }

    private async pageIssues(query: string, cursor?: string): Promise<Issue[]> {
        const items: Issue[] = [];

        const results = await this.graphql<{ repository: { issues: IssueConnection } }>(query, {
            owner: this.owner,
            name: this.repositoryName,
            cursor: cursor ?? null,
        });

        const { nodes, pageInfo } = results.repository.issues;

        items.push(...nodes as Issue[]);

        if (nodes!.length === 100 && cursor != pageInfo.endCursor) {
            const nextPage = await this.pageIssues(query, pageInfo.endCursor!);
            items.push(...nextPage);
        }

        return items;
    }
}