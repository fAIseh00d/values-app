export interface LinkedListNode {
  id: string;
  prevId: string | null;
  nextId: string | null;
}

export interface LinkedListState {
  nodes: Record<string, LinkedListNode>;
  headId: string | null;
  tailId: string | null;
  length: number;
}

export function createLinkedListFromOrder(ids: string[]): LinkedListState {
  const nodes: Record<string, LinkedListNode> = {};
  let prevId: string | null = null;

  ids.forEach((id) => {
    nodes[id] = {
      id,
      prevId,
      nextId: null,
    };

    if (prevId) {
      nodes[prevId]!.nextId = id;
    }

    prevId = id;
  });

  const headId = ids[0] ?? null;
  const tailId = ids[ids.length - 1] ?? null;

  return {
    nodes,
    headId,
    tailId,
    length: ids.length,
  };
}

export function linkedListToArray(list: LinkedListState): string[] {
  const result: string[] = [];
  const visited = new Set<string>();
  let currentId = list.headId;

  while (currentId) {
    if (visited.has(currentId)) {
      break;
    }

    visited.add(currentId);
    result.push(currentId);
    currentId = list.nodes[currentId]?.nextId ?? null;
  }

  return result;
}
