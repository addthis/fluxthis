import {CHILD_STORES} from '../symbols/protected';

const EDGES = Symbol('EDGES');
const NODES = Symbol('NODES');

export default class StoreGraph {
	static copy(storeGraph) {
		return new StoreGraph(storeGraph[NODES]);
	}

	constructor(stores = []) {
		this[EDGES] = new Map();
		this[NODES] = new Set();
		stores.forEach(store => this.addStore(store));
	}

	getOutgoingEdges(a) {
		return this[EDGES].get(a);
	}

	getIncomingEdges(a) {
		const incoming = new Set();
		
		for (let n of this[NODES]) {
			if (this[EDGES].get(n).has(a)) {
				incoming.add(n);
			}
		}
		
		return incoming;
	}

	removeEdgeBetween(a, b) {
		this[EDGES].get(a).delete(b);
	}

	getEdgeCount() {
		let count = 0;
		
		for (let edges in this[EDGES]) {
			count += edges.size;
		}

		return count;
	}

	/**
	 * Adds a store and all of its children to the graph
	 * @param {Store} store
	 */
	addStore(store, visited = new Set()) {
		if (visited.has(store)) {
			return;
		}
		
		visited.add(store);	
		
		this[EDGES].set(store, new Set());
		this[NODES].add(store);

		store[CHILD_STORES].forEach(child => {
			this.addStore(child, visited);
			this[EDGES].get(child).add(store);
		});
	}

	/**
	 * Removes a store and all of its children from the graph
	 * @param  {Store} store
	 */
	removeStore(store, visited = new Set()) {
		if (visited.has(store)) {
			return;
		}

		visited.add(store);

		this[EDGES].delete(store);
		this[NODES].delete(store);

		store[CHILD_STORES].forEach(child => {
			this.removeStore(child);
		});

		this[EDGES].forEach(edge => {
			edge.delete(store);
		});

		this[NODES].delete(store);
	}

	// L ← Empty list that will contain the sorted elements
	// S ← Set of all nodes with no incoming edges
	// while S is non-empty do
	//     remove a node n from S
	//     add n to tail of L
	//     for each node m with an edge e from n to m do
	//         remove edge e from the graph
	//         if m has no other incoming edges then
	//             insert m into S
	// if graph has edges then
	//     return error (graph has at least one cycle)
	// else 
	//     return L (a topologically sorted order)
	getSortedNodes() {
		const copy = StoreGraph.copy(this);
		const l = [];
		const s = Array.from(copy[NODES]).filter(node => copy.getIncomingEdges(node).size === 0);

		while (s.length > 0) {
			const n = s.pop();
			const edges = copy.getOutgoingEdges(n);
			l.push(n);  

			for (let m of edges) {
			  copy.removeEdgeBetween(n, m)
				
				if (copy.getIncomingEdges(m).size === 0) {
					s.push(m);
				}
			}
		}

		if (copy.getEdgeCount() !== 0) {
			throw new Error('Cycle detected in store graph')
		}

		return l;
	}

	[Symbol.iterator]() {
		return this.getSortedNodes()[Symbol.iterator]();
	};

	toString() {
		return this[EDGES].toString();
	}
}