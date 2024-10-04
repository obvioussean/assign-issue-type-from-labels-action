import { ClearProjectV2ItemFieldValueInput, CreateIssueInput, CreateIssuePayload, IssueConnection, IssueEdge, ProjectV2, ProjectV2Field, ProjectV2FieldConfiguration, ProjectV2Item, ProjectV2ItemConnection, ProjectV2ItemFieldIterationValue, ProjectV2ItemFieldSingleSelectValue, ProjectV2IterationField, ProjectV2IterationFieldIteration, ProjectV2SingleSelectField, ProjectV2SingleSelectFieldOption, Repository, UpdateIssueInput, UpdateIssuePayload, UpdateProjectV2ItemFieldValueInput } from '@octokit/graphql-schema';
import { GraphQlResponse } from '@octokit/graphql/types';
import { RequestHeaders, RequestParameters } from '@octokit/types';
import { Issue, IssueType, IssueTypeConnection } from "./types.js";

type graphql = <ResponseData>(query: string, parameters?: RequestParameters) => GraphQlResponse<ResponseData>;

export class IssueTypeManager {
    constructor(private graphql: graphql, private owner: string, private repositoryName: string) { }

    public async getIssueTypes(): Promise<IssueType[]> {
        const query = `
            query ($owner: String!, $name: String!, $cursor: String) {
                repository(owner: $owner, name: $name) {
                    issueTypes(first: 100, after: $cursor) {
                        nodes {
                            id
                            name
                        }
                        pageInfo {
                            endCursor
                            hasNextPage
                        }
                    }
                }
            }
        `;

        return await this.pageIssueTypes(query);
    }

    private async pageIssueTypes(query: string, cursor?: string): Promise<IssueType[]> {
        const items: IssueType[] = [];

        const results = await this.graphql<{ repository: { issueTypes: IssueTypeConnection } }>(query, {
            owner: this.owner,
            name: this.repositoryName,
            cursor: cursor ?? null,
        });

        const { nodes, pageInfo } = results.repository.issueTypes;

        items.push(...nodes as IssueType[]);

        if (nodes!.length === 100 && cursor != pageInfo.endCursor) {
            const nextPage = await this.pageIssueTypes(query, pageInfo.endCursor!);
            items.push(...nextPage);
        }

        return items;
    }
}