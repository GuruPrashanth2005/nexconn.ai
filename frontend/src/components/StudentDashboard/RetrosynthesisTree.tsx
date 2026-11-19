/* eslint-disable */
import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  Handle,
  Position,
  BaseEdge,
  getBezierPath,
  EdgeLabelRenderer
} from 'reactflow';
import type { Connection, Edge, Node, EdgeProps } from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

// ----------------------------------------------------
// Custom Molecule Node
// ----------------------------------------------------
const MoleculeNode = ({ data }: { data: any }) => {
  return (
    <div style={{
      background: 'linear-gradient(145deg, rgba(34, 211, 238, 0.15) 0%, rgba(34, 211, 238, 0.05) 100%)',
      border: '1px solid rgba(34, 211, 238, 0.4)',
      borderRadius: '12px',
      padding: '12px 20px',
      color: 'var(--text-main)',
      boxShadow: '0 0 20px rgba(34, 211, 238, 0.2), inset 0 0 10px rgba(34, 211, 238, 0.1)',
      backdropFilter: 'blur(12px)',
      minWidth: '150px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px'
    }}>
      <Handle type="target" position={Position.Top} style={{ background: 'var(--accent-cyan)', width: '8px', height: '8px' }} />
      
      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
        {data.label}
      </div>
      
      {data.molecularWeight && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          MW: {data.molecularWeight}
        </div>
      )}
      
      {data.iupacName && (
        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', textAlign: 'center', marginTop: '2px' }}>
          {data.iupacName}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: 'var(--accent-purple)', width: '8px', height: '8px' }} />
    </div>
  );
};

// ----------------------------------------------------
// Custom Reaction Edge
// ----------------------------------------------------
const ReactionEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, stroke: 'var(--accent-purple)', strokeWidth: 2 }} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: 'rgba(10, 15, 29, 0.8)',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            pointerEvents: 'all',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 10
          }}
          className="nodrag nopan"
        >
          {data?.temperature && <div><strong style={{color: 'var(--text-main)'}}>T:</strong> {data.temperature}</div>}
          {data?.solvent && <div><strong style={{color: 'var(--text-main)'}}>Solvent:</strong> {data.solvent}</div>}
          {data?.catalyst && <div><strong style={{color: 'var(--text-main)'}}>Cat:</strong> {data.catalyst}</div>}
          {data?.yield && <div><strong style={{color: 'var(--accent-cyan)'}}>Yield:</strong> {data.yield}</div>}
          {(!data || Object.keys(data).length === 0) && <div>Reaction</div>}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

// ----------------------------------------------------
// Layout Algorithm (Dagre)
// ----------------------------------------------------
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction, nodesep: 100, ranksep: 150 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 200, height: 100 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? Position.Left : Position.Top;
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;
    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - 200 / 2,
      y: nodeWithPosition.y - 100 / 2,
    };
    return node;
  });

  return { nodes, edges };
};

// ----------------------------------------------------
// Main Component
// ----------------------------------------------------
interface RetrosynthesisTreeProps {
  data: {
    nodes: Node[];
    edges: Edge[];
  };
}

export const RetrosynthesisTree: React.FC<RetrosynthesisTreeProps> = ({ data }) => {
  const nodeTypes = useMemo(() => ({ customMolecule: MoleculeNode }), []);
  const edgeTypes = useMemo(() => ({ customReaction: ReactionEdge }), []);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    // Map data to use custom types
    const mappedNodes = (data.nodes || []).map(n => ({ ...n, type: 'customMolecule' }));
    const mappedEdges = (data.edges || []).map(e => ({ ...e, type: 'customReaction', animated: true }));
    return getLayoutedElements(mappedNodes, mappedEdges);
  }, [data]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Sync state if props change
  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge({ ...params, type: 'customReaction', animated: true }, eds)),
    [setEdges]
  );

  return (
    <div className="glass-card" style={{ marginTop: '16px', padding: '0', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
        <h3 className="glass-card-title" style={{ margin: 0, fontSize: '0.9rem', color: 'var(--accent-cyan)' }}>Interactive Retrosynthesis Flow</h3>
      </div>
      <div style={{ width: '100%', height: '450px', background: 'rgba(5, 5, 10, 0.5)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls style={{ fill: 'var(--text-muted)' }} />
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="rgba(255,255,255,0.05)" />
        </ReactFlow>
      </div>
    </div>
  );
};
