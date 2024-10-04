export class IssueTypeManager {
    graphql;
    owner;
    repositoryName;
    constructor(graphql, owner, repositoryName) {
        this.graphql = graphql;
        this.owner = owner;
        this.repositoryName = repositoryName;
    }
    async getIssueTypes() {
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
    async pageIssueTypes(query, cursor) {
        const items = [];
        const results = await this.graphql(query, {
            owner: this.owner,
            name: this.repositoryName,
            cursor: cursor ?? null,
        });
        const { nodes, pageInfo } = results.repository.issueTypes;
        items.push(...nodes);
        if (nodes.length === 100 && cursor != pageInfo.endCursor) {
            const nextPage = await this.pageIssueTypes(query, pageInfo.endCursor);
            items.push(...nextPage);
        }
        return items;
    }
}
//# sourceMappingURL=issueTypeManager.js.map