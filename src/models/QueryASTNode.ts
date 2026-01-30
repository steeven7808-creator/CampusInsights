export class QueryASTNode {
	public key: string;
	public children: QueryASTNode[] | string | number;

	constructor(key: any, children: QueryASTNode[] | string | number) {
		this.key = key;
		this.children = children;
	}

	// function should only add child to node with list of QueryASTNodes as children
	public addChild(childNode: QueryASTNode) {
		if (Array.isArray(this.children)) {
			this.children.push(childNode);
		} else {
			throw new Error("trying to add child nodes to a leaf node");
		}
	}
}
