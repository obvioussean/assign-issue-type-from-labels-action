import { Issue as GraphQLIssue, PageInfo, Scalars } from "@octokit/graphql-schema";

export interface IssueType {
    id: string;
    name: string;
}

export type Issue = GraphQLIssue & {
    issueType: IssueType;
}

export type IssueTypeConnection = {
    __typename?: 'IssueTypeConnection';
    nodes: IssueType[];
    pageInfo: PageInfo;
    totalCount: Scalars['Int']['output'];
}
