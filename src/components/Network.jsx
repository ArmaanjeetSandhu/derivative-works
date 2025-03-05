import React, { useState, useRef, useEffect, useCallback } from "react";

const Network = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [uniqueString, setUniqueString] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [validNextNodes, setValidNextNodes] = useState([]);

  const svgRef = useRef(null);

  useEffect(() => {
    generateNetwork(10);
  }, []);

  const generateNetwork = (n) => {
    const radius = 150;
    const centerX = 250;
    const centerY = 250;
    const newNodes = [];

    for (let i = 0; i < n; i++) {
      const angle = (i / n) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      newNodes.push({ id: i, x, y, label: String.fromCharCode(65 + i) });
    }

    const newEdges = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        newEdges.push({ source: i, target: j, id: `${i}-${j}` });
      }
    }

    setNodes(newNodes);
    setEdges(newEdges);
  };

  useEffect(() => {
    if (selectedNodes.length === 0) {
      setUniqueString("");
      return;
    }

    const sortedNodes = [...selectedNodes].sort((a, b) => a - b);

    const nodeLabels = sortedNodes
      .map((id) => nodes.find((node) => node.id === id)?.label || "")
      .join("");

    let hash = 0;
    for (let i = 0; i < nodeLabels.length; i++) {
      hash = (hash << 5) - hash + nodeLabels.charCodeAt(i);
      hash |= 0;
    }

    const wordLists = [
      [
        "azure",
        "crimson",
        "emerald",
        "golden",
        "indigo",
        "lavender",
        "midnight",
        "olive",
        "purple",
        "ruby",
        "sapphire",
        "teal",
        "violet",
      ],
      [
        "arrow",
        "beacon",
        "crystal",
        "diamond",
        "echo",
        "flame",
        "glacier",
        "horizon",
        "island",
        "jungle",
        "kingdom",
        "lagoon",
        "mountain",
      ],
      [
        "adventure",
        "butterfly",
        "cascade",
        "discovery",
        "enchanted",
        "freedom",
        "guardian",
        "harmony",
        "infinity",
        "journey",
        "kaleidoscope",
        "labyrinth",
        "mystical",
      ],
    ];

    const word1 = wordLists[0][Math.abs(hash % wordLists[0].length)];
    const word2 = wordLists[1][Math.abs((hash >> 4) % wordLists[1].length)];
    const word3 = wordLists[2][Math.abs((hash >> 8) % wordLists[2].length)];

    setUniqueString(`${word1}-${word2}-${word3}`);
  }, [selectedNodes, nodes]);

  const areNodesConnected = useCallback(
    (nodeId1, nodeId2) => {
      return edges.some(
        (edge) =>
          (edge.source === nodeId1 && edge.target === nodeId2) ||
          (edge.source === nodeId2 && edge.target === nodeId1)
      );
    },
    [edges]
  );

  useEffect(() => {
    if (selectedNodes.length === 0) {
      setValidNextNodes([]);
      return;
    }

    const lastNode = selectedNodes[selectedNodes.length - 1];
    const connectedNodes = nodes
      .filter(
        (node) =>
          node.id !== lastNode &&
          areNodesConnected(lastNode, node.id) &&
          (selectedNodes.length < 2 ||
            node.id !== selectedNodes[selectedNodes.length - 2])
      )
      .map((node) => node.id);

    setValidNextNodes(connectedNodes);
  }, [selectedNodes, nodes, areNodesConnected]);

  const findClosestNode = (x, y, maxDistance = 40) => {
    let closestNode = null;
    let minDistance = maxDistance;

    nodes.forEach((node) => {
      const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      if (distance < minDistance) {
        minDistance = distance;
        closestNode = node;
      }
    });

    return closestNode;
  };

  const findClosestEdge = (x, y, maxDistance = 20) => {
    let closestEdge = null;
    let minDistance = maxDistance;

    edges.forEach((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);

      if (sourceNode && targetNode) {
        const distance = distanceToLineSegment(
          x,
          y,
          sourceNode.x,
          sourceNode.y,
          targetNode.x,
          targetNode.y
        );

        if (distance < minDistance) {
          minDistance = distance;
          closestEdge = edge;
        }
      }
    });

    return closestEdge;
  };

  const distanceToLineSegment = (px, py, x1, y1, x2, y2) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;

    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleNodeMouseDown = (nodeId, e) => {
    e.stopPropagation();

    if (selectedNodes.includes(nodeId)) {
      const index = selectedNodes.indexOf(nodeId);
      if (index < selectedNodes.length - 1) {
        setSelectedNodes(selectedNodes.slice(0, index + 1));
      }
      else if (selectedNodes.length === 1) {
        setSelectedNodes([]);
      }
    } else {
      setSelectedNodes([nodeId]);
    }

    setIsDragging(true);
  };

  const handleEdgeClick = (edge, e) => {
    e.stopPropagation();

    const sourceNode = edge.source;
    const targetNode = edge.target;

    if (selectedNodes.length === 0) {
      setSelectedNodes([sourceNode, targetNode]);
      return;
    }

    const lastNode = selectedNodes[selectedNodes.length - 1];

    if (lastNode === sourceNode) {
      setSelectedNodes([...selectedNodes, targetNode]);
    } else if (lastNode === targetNode) {
      setSelectedNodes([...selectedNodes, sourceNode]);
    } else {
      setSelectedNodes([sourceNode, targetNode]);
    }
  };

  const handleMouseMove = (e) => {
    if (!svgRef.current) return;

    const svgRect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;

    setMousePosition({ x: mouseX, y: mouseY });

    const closestNode = findClosestNode(mouseX, mouseY);
    const closestEdge = findClosestEdge(mouseX, mouseY);

    setHoveredNode(closestNode ? closestNode.id : null);
    setHoveredEdge(closestEdge ? closestEdge.id : null);

    if (isDragging && selectedNodes.length > 0) {
      if (closestNode) {
        const lastNode = selectedNodes[selectedNodes.length - 1];

        if (
          areNodesConnected(lastNode, closestNode.id) &&
          validNextNodes.includes(closestNode.id)
        ) {
          const nodeIndex = selectedNodes.indexOf(closestNode.id);
          if (nodeIndex !== -1) {
            setSelectedNodes(selectedNodes.slice(0, nodeIndex + 1));
          } else {
            setSelectedNodes([...selectedNodes, closestNode.id]);
          }
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleClearSelection = () => {
    setSelectedNodes([]);
  };

  const isEdgeSelected = (source, target) => {
    for (let i = 0; i < selectedNodes.length - 1; i++) {
      const a = selectedNodes[i];
      const b = selectedNodes[i + 1];
      if ((source === a && target === b) || (source === b && target === a)) {
        return true;
      }
    }
    return false;
  };

  const isValidNextNode = (nodeId) => {
    if (selectedNodes.length === 0) return true;
    const lastNode = selectedNodes[selectedNodes.length - 1];
    return (
      areNodesConnected(lastNode, nodeId) && validNextNodes.includes(nodeId)
    );
  };

  return (
    <div className="flex flex-col items-center w-full select-none">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4 text-center">
          Interactive Network Selection
        </h2>
        <p className="mb-4 text-center">
          Click a node and drag along connected nodes to create a path
        </p>

        <div className="relative border border-gray-200 rounded-lg mb-4">
          <svg
            ref={svgRef}
            width="500"
            height="500"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ userSelect: "none" }}
          >
            {edges.map((edge) => {
              const source = nodes.find((n) => n.id === edge.source);
              const target = nodes.find((n) => n.id === edge.target);
              const isSelected = isEdgeSelected(edge.source, edge.target);
              const isHighlighted =
                selectedNodes.length > 0 &&
                ((edge.source === selectedNodes[selectedNodes.length - 1] &&
                  validNextNodes.includes(edge.target)) ||
                  (edge.target === selectedNodes[selectedNodes.length - 1] &&
                    validNextNodes.includes(edge.source)));
              const isHovered = edge.id === hoveredEdge;

              return source && target ? (
                <g
                  key={`edge-${edge.id}`}
                  onClick={(e) => handleEdgeClick(edge, e)}
                >
                  {isHighlighted && !isSelected && (
                    <line
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke="rgba(74, 222, 128, 0.4)"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                  )}

                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={
                      isSelected
                        ? "#2563eb"
                        : isHovered
                        ? "#93c5fd"
                        : isHighlighted
                        ? "#4ade80"
                        : "#d1d5db"
                    }
                    strokeWidth={
                      isSelected
                        ? "4"
                        : isHovered
                        ? "3"
                        : isHighlighted
                        ? "2"
                        : "1"
                    }
                    strokeLinecap="round"
                    className="cursor-pointer"
                  />
                </g>
              ) : null;
            })}

            {isDragging && selectedNodes.length > 0 && (
              <line
                x1={
                  nodes.find(
                    (n) => n.id === selectedNodes[selectedNodes.length - 1]
                  )?.x || 0
                }
                y1={
                  nodes.find(
                    (n) => n.id === selectedNodes[selectedNodes.length - 1]
                  )?.y || 0
                }
                x2={mousePosition.x}
                y2={mousePosition.y}
                stroke="rgba(59, 130, 246, 0.6)"
                strokeWidth="3"
                strokeDasharray="5,5"
              />
            )}

            {nodes.map((node) => {
              const isSelected = selectedNodes.includes(node.id);
              const isHovered = hoveredNode === node.id;
              const isValidNext = isValidNextNode(node.id) && !isSelected;

              return (
                <g
                  key={`node-${node.id}`}
                  onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                  className="cursor-pointer"
                >
                  {isValidNext && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="26"
                      fill="rgba(74, 222, 128, 0.3)"
                    />
                  )}

                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="22"
                    fill="transparent"
                    stroke={
                      isSelected
                        ? "#3b82f6"
                        : isValidNext
                        ? "#4ade80"
                        : "transparent"
                    }
                    strokeWidth="2"
                    strokeDasharray={isValidNext ? "3,3" : "0"}
                  />

                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="20"
                    fill={
                      isSelected
                        ? "#3b82f6"
                        : isHovered
                        ? "#dbeafe"
                        : isValidNext
                        ? "#ecfdf5"
                        : "#f3f4f6"
                    }
                    stroke={
                      isSelected
                        ? "#2563eb"
                        : isHovered
                        ? "#93c5fd"
                        : isValidNext
                        ? "#4ade80"
                        : "#d1d5db"
                    }
                    strokeWidth="2"
                  />

                  <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isSelected ? "white" : "black"}
                    fontSize="16"
                    fontWeight="bold"
                    pointerEvents="none"
                    style={{ userSelect: "none" }}
                  >
                    {node.label}
                  </text>

                </g>
              );
            })}
          </svg>
        </div>

        <div className="p-4 bg-gray-100 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Selected Path:</h3>
            <button
              onClick={handleClearSelection}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
            >
              Clear
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {selectedNodes.length > 0 ? (
              selectedNodes.map((nodeId, index) => {
                const node = nodes.find((n) => n.id === nodeId);
                return node ? (
                  <div
                    key={`selected-${nodeId}`}
                    className={`
                      flex items-center justify-center w-8 h-8 rounded-full text-white font-bold
                      ${
                        index === selectedNodes.length - 1
                          ? "bg-blue-700"
                          : "bg-blue-500"
                      }
                    `}
                  >
                    {node.label}
                  </div>
                ) : null;
              })
            ) : (
              <p className="text-gray-500 italic">No nodes selected</p>
            )}
          </div>

          <h3 className="font-bold mb-2">Unique String for Selection:</h3>
          <p className="bg-blue-100 p-3 rounded text-center font-mono text-lg">
            {uniqueString || "(Select nodes to generate)"}
          </p>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm border border-blue-200">
          <p className="font-semibold mb-1">Tips:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Click on any node to start a path</li>
            <li>
              Drag through{" "}
              <span className="text-green-500 font-medium">
                highlighted edges and nodes
              </span>{" "}
              to extend your path
            </li>
            <li>Click directly on edges to select both connected nodes</li>
            <li>Move back to a previous node to backtrack along your path</li>
            <li>Each unique selection creates a different code</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Network;
