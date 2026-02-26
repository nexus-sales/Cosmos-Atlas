import * as THREE from 'three';

export interface OctreeNode {
    center: THREE.Vector3;
    size: number;
    box: THREE.Box3; // Cache the box for fast frustum intersection
    indices: number[]; // Indices of stars in the main data array
    children: OctreeNode[] | null;
}

export class StarOctree {
    public root: OctreeNode;
    private maxStarsPerNode = 500;
    private maxDepth = 10;

    constructor(positions: Float32Array, count: number) {
        // Encontrar los límites. Como es una esfera, podemos usar [-100, -100, -100] a [100, 100, 100]
        const size = 200;
        const center = new THREE.Vector3(0, 0, 0);

        const initialIndices: number[] = [];
        for (let i = 0; i < count; i++) initialIndices.push(i);

        this.root = this.buildNode(center, size, initialIndices, positions, 0);
    }

    private buildNode(center: THREE.Vector3, size: number, indices: number[], positions: Float32Array, depth: number): OctreeNode {
        const box = new THREE.Box3().setFromCenterAndSize(center, new THREE.Vector3(size, size, size));
        const node: OctreeNode = { center, size, box, indices, children: null };

        if (indices.length <= this.maxStarsPerNode || depth >= this.maxDepth) {
            return node;
        }

        node.children = [];
        node.indices = []; // Los nodos intermedios no guardan índices

        const half = size / 2;
        const quarter = size / 4;

        // Bucket assignment (O(N) instead of O(8*N))
        const buckets: number[][] = Array.from({ length: 8 }, () => []);

        for (const idx of indices) {
            const px = positions[idx * 3];
            const py = positions[idx * 3 + 1];
            const pz = positions[idx * 3 + 2];

            const ix = px >= center.x ? 1 : 0;
            const iy = py >= center.y ? 2 : 0;
            const iz = pz >= center.z ? 4 : 0;
            buckets[ix + iy + iz].push(idx);
        }

        for (let i = 0; i < 8; i++) {
            if (buckets[i].length === 0) continue;

            const childCenter = new THREE.Vector3(
                center.x + (i & 1 ? quarter : -quarter),
                center.y + (i & 2 ? quarter : -quarter),
                center.z + (i & 4 ? quarter : -quarter)
            );

            node.children.push(this.buildNode(childCenter, half, buckets[i], positions, depth + 1));
        }

        return node;
    }

    public search(frustum: THREE.Frustum, result: number[]) {
        this.recursiveSearch(this.root, frustum, result);
    }

    private recursiveSearch(node: OctreeNode, frustum: THREE.Frustum, result: number[]) {
        // Reuse cached box - NO ALLOCATIONS here!
        if (!frustum.intersectsBox(node.box)) return;

        if (node.children) {
            for (const child of node.children) {
                this.recursiveSearch(child, frustum, result);
            }
        } else {
            // Nodo hoja: añadir todos sus índices
            for (const idx of node.indices) {
                result.push(idx);
            }
        }
    }
}
