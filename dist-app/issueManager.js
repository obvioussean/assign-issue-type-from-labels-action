export class IssueManager {
    graphql;
    owner;
    repositoryName;
    constructor(graphql, owner, repositoryName) {
        this.graphql = graphql;
        this.owner = owner;
        this.repositoryName = repositoryName;
    }
    async getIssues() {
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
    async updateIssueIssueType(issueId, issueTypeId) {
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
        await this.graphql(query, {
            input: {
                issueId,
                issueTypeId
            }
        });
    }
    getLabels(issue) {
        const labels = [];
        if (issue.labels && issue.labels.nodes) {
            labels.push(...issue.labels.nodes.map(l => l.name.toLocaleLowerCase()));
        }
        return labels;
    }
    async pageIssues(query, cursor) {
        const items = [];
        const results = await this.graphql(query, {
            owner: this.owner,
            name: this.repositoryName,
            cursor: cursor ?? null,
        });
        const { nodes, pageInfo } = results.repository.issues;
        items.push(...nodes);
        if (nodes.length === 100 && cursor != pageInfo.endCursor) {
            const nextPage = await this.pageIssues(query, pageInfo.endCursor);
            items.push(...nextPage);
        }
        return items;
    }
}
//# sourceMappingURL=issueManager.js.map