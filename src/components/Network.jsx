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
    const radius = 180;
    const centerX = 300;
    const centerY = 300;
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
      } else if (selectedNodes.length === 1) {
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
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-8 rounded-2xl shadow-xl w-full max-w-3xl mx-auto border border-gray-200">
        <h2 className="text-3xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          Derivative Works
        </h2>
        <p className="mb-6 text-center text-gray-600 font-medium">
          Create unique codes by tracing paths through the network
        </p>

        <div className="relative mb-6 rounded-xl overflow-hidden bg-white border border-gray-200 shadow-md">
          <div className="absolute top-4 left-4 p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm z-10 hidden sm:block">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                <span className="text-xs font-medium text-gray-700">
                  Selected
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="text-xs font-medium text-gray-700">
                  Available
                </span>
              </div>
            </div>
          </div>

          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox="0 0 600 600"
            preserveAspectRatio="xMidYMid meet"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="bg-gray-50"
            style={{ userSelect: "none" }}
          >
            <defs>
              <pattern
                id="grid"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 20 0 L 0 0 0 20"
                  fill="none"
                  stroke="rgba(226, 232, 240, 0.5)"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            <circle cx="300" cy="300" r="220" fill="rgba(236, 246, 255, 0.7)" />
            <circle
              cx="300"
              cy="300"
              r="210"
              fill="none"
              stroke="rgba(96, 165, 250, 0.2)"
              strokeWidth="1"
            />

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
                      strokeWidth="10"
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
                        ? "#3b82f6"
                        : isHovered
                        ? "#93c5fd"
                        : isHighlighted
                        ? "#4ade80"
                        : "#e2e8f0"
                    }
                    strokeWidth={
                      isSelected
                        ? "5"
                        : isHovered
                        ? "4"
                        : isHighlighted
                        ? "3"
                        : "2"
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
                strokeWidth="4"
                strokeDasharray="6,6"
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
                    <>
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="32"
                        fill="rgba(74, 222, 128, 0.15)"
                      />
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="26"
                        fill="rgba(74, 222, 128, 0.3)"
                      />
                    </>
                  )}
                  {isValidNext && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="22"
                      fill="transparent"
                      stroke="#4ade80"
                      strokeWidth="2"
                      strokeDasharray="4,3"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        from="0"
                        to="28"
                        dur="3s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

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
                        : "#f8fafc"
                    }
                    stroke={
                      isSelected
                        ? "#2563eb"
                        : isHovered
                        ? "#93c5fd"
                        : isValidNext
                        ? "#4ade80"
                        : "#cbd5e1"
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

            <defs></defs>
          </svg>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="p-3 sm:p-5 bg-white rounded-xl shadow-md border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800 text-lg">Selected Path</h3>
              <button
                onClick={handleClearSelection}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg text-sm font-medium text-gray-700 transition-colors duration-150 flex items-center gap-1 shadow-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
                Clear
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {selectedNodes.length > 0 ? (
                <div className="flex items-center w-full overflow-x-auto py-2 px-1 flex-wrap sm:flex-nowrap">
                  {selectedNodes.map((nodeId, index) => {
                    const node = nodes.find((n) => n.id === nodeId);
                    return node ? (
                      <React.Fragment key={`selected-${nodeId}`}>
                        <div
                          className={`
                          flex items-center justify-center w-10 h-10 rounded-full text-white font-bold shadow-md
                          bg-blue-600
                        `}
                        >
                          {node.label}
                        </div>
                        {index < selectedNodes.length - 1 && (
                          <svg
                            className="mx-1"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#94a3b8"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M5 12h14"></path>
                            <path d="M12 5l7 7-7 7"></path>
                          </svg>
                        )}
                      </React.Fragment>
                    ) : null;
                  })}
                </div>
              ) : (
                <div className="w-full py-8 flex justify-center items-center">
                  <p className="text-gray-400 italic flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 8v4"></path>
                      <path d="M12 16h.01"></path>
                    </svg>
                    Start by selecting nodes to create a path
                  </p>
                </div>
              )}
            </div>

            <h3 className="font-bold text-gray-800 text-lg mb-2">
              Unique Code
            </h3>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100 relative overflow-hidden">
              <div className="absolute inset-0 flex-none w-1 bg-gradient-to-b from-blue-500 to-indigo-500"></div>
              <p className="text-center font-mono text-lg pl-3 font-semibold tracking-wide text-gray-800">
                {uniqueString || "—————"}
              </p>
            </div>
          </div>

          <div className="p-3 sm:p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md border border-blue-100">
            <div className="flex items-start gap-3 mb-2">
              <div className="flex-none mt-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-blue-800 mb-2">How to Use</h3>
                <ul className="space-y-1 sm:space-y-2">
                  <li className="flex items-start gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#4ade80"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="flex-none mt-0.5"
                    >
                      <path d="M20 6L9 17l-5-5"></path>
                    </svg>
                    <span className="text-gray-700">
                      Click on any node to start a path
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#4ade80"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="flex-none mt-0.5"
                    >
                      <path d="M20 6L9 17l-5-5"></path>
                    </svg>
                    <span className="text-gray-700">
                      Drag through{" "}
                      <span className="text-green-600 font-medium">
                        highlighted nodes
                      </span>{" "}
                      to extend your path
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#4ade80"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="flex-none mt-0.5"
                    >
                      <path d="M20 6L9 17l-5-5"></path>
                    </svg>
                    <span className="text-gray-700">
                      Each selection creates a unique code for sharing
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Network;
