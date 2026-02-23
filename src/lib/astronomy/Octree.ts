import * as THREE from 'three';

export interface OctreeNode {
    center: THREE.Vector3;
    size: number;
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

        const initialIndices = Array.from({ length: count }, (_, i) => i);
        this.root = this.buildNode(center, size, initialIndices, positions, 0);
    }

    private buildNode(center: THREE.Vector3, size: number, indices: number[], positions: Float32Array, depth: number): OctreeNode {
        const node: OctreeNode = { center, size, indices, children: null };

        if (indices.length <= this.maxStarsPerNode || depth >= this.maxDepth) {
            return node;
        }

        node.children = [];
        node.indices = []; // Los nodos intermedios no guardan índices

        const half = size / 2;
        const quarter = size / 4;

        for (let i = 0; i < 8; i++) {
            const childCenter = new THREE.Vector3(
                center.x + (i & 1 ? quarter : -quarter),
                center.y + (i & 2 ? quarter : -quarter),
                center.z + (i & 4 ? quarter : -quarter)
            );

            const childIndices = indices.filter(idx => {
                const px = positions[idx * 3];
                const py = positions[idx * 3 + 1];
                const pz = positions[idx * 3 + 2];
                return (
                    Math.abs(px - childCenter.x) <= quarter &&
                    Math.abs(py - childCenter.y) <= quarter &&
                    Math.abs(pz - childCenter.z) <= quarter
                );
            });

            if (childIndices.length > 0) {
                node.children.push(this.buildNode(childCenter, half, childIndices, positions, depth + 1));
            }
        }

        return node;
    }

    public search(frustum: THREE.Frustum, result: number[]) {
        this.recursiveSearch(this.root, frustum, result);
    }

    private recursiveSearch(node: OctreeNode, frustum: THREE.Frustum, result: number[]) {
        // Test de caja (AABB) contra frustum
        const box = new THREE.Box3().setFromCenterAndSize(node.center, new THREE.Vector3(node.size, node.size, node.size));

        if (!frustum.intersectsBox(box)) return;

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
