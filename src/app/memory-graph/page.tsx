"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  X,
  Brain,
  Network,
  Shield,
  AlertTriangle,
  FileText,
  Lightbulb,
  BookOpen,
  Zap,
  TrendingUp,
  ChevronRight,
  Maximize2,
  Minimize2,
  Filter,
  Eye,
  EyeOff,
  Sparkles,
  RotateCw,
} from "lucide-react";

type GraphNodeType =
  | "threat"
  | "incident"
  | "postmortem"
  | "learning_event"
  | "memory"
  | "runbook"
  | "recommendation"
  | "intelligence";

interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  description: string;
  influenceScore: number;
  metadata: Record<string, any>;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  targetX?: number;
  targetY?: number;
  pinned?: boolean;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  label: string;
}

interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  mostInfluentialMemory: string;
  mostConnectedThreat: string;
  threatCount: number;
  incidentCount: number;
  learningEventCount: number;
  runbookCount: number;
  reportCount: number;
  recommendationCount: number;
}

const NODE_COLORS: Record<GraphNodeType, string> = {
  threat: "#DC2626",
  incident: "#F59E0B",
  postmortem: "#06B6D4",
  learning_event: "#3B82F6",
  memory: "#8B5CF6",
  runbook: "#A855F7",
  recommendation: "#6366F1",
  intelligence: "#16A34A",
};

const NODE_GLOW_COLORS: Record<GraphNodeType, string> = {
  threat: "rgba(220, 38, 38, 0.35)",
  incident: "rgba(245, 158, 11, 0.35)",
  postmortem: "rgba(6, 182, 212, 0.35)",
  learning_event: "rgba(59, 130, 246, 0.35)",
  memory: "rgba(139, 92, 246, 0.35)",
  runbook: "rgba(168, 85, 247, 0.35)",
  recommendation: "rgba(99, 102, 241, 0.35)",
  intelligence: "rgba(22, 163, 74, 0.35)",
};

const NODE_LABELS: Record<GraphNodeType, string> = {
  threat: "Threats",
  incident: "Incidents",
  postmortem: "Postmortems",
  learning_event: "Learning Events",
  memory: "Memories",
  runbook: "Runbooks",
  recommendation: "Recommendations",
  intelligence: "Intelligence",
};

const NODE_ICONS: Record<GraphNodeType, typeof Shield> = {
  threat: Shield,
  incident: AlertTriangle,
  postmortem: FileText,
  learning_event: Lightbulb,
  memory: Brain,
  runbook: BookOpen,
  recommendation: Zap,
  intelligence: TrendingUp,
};

export default function MemoryGraphPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);

  const [stats, setStats] = useState<GraphStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GraphNode[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [filters, setFilters] = useState<Record<GraphNodeType, boolean>>({
    threat: true, incident: true, postmortem: true, learning_event: true,
    memory: true, runbook: true, recommendation: true, intelligence: true,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectedNodeIds, setConnectedNodeIds] = useState<Set<string>>(new Set());
  const [autoRotate, setAutoRotate] = useState(false);
  const physicsTicksRef = useRef<number>(200);

  const cameraRef = useRef({ x: 0, y: 0, zoom: 1 });
  const dragRef = useRef<{ isDragging: boolean; dragNode: GraphNode | null; startX: number; startY: number; lastX: number; lastY: number; }>({
    isDragging: false, dragNode: null, startX: 0, startY: 0, lastX: 0, lastY: 0,
  });

  const particlesRef = useRef<{ x: number; y: number; progress: number; edgeIdx: number; speed: number }[]>([]);

  useEffect(() => { fetchGraph(); }, []);

  const fetchGraph = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/graph");
      const json = await res.json();
      if (json.success && json.data) {
        initializeGraph(json.data.nodes, json.data.edges);
        setStats(json.data.stats);
      } else {
        setError(json.error || "Failed to load graph");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const initializeGraph = (rawNodes: any[], rawEdges: GraphEdge[]) => {
    const centerX = 0; const centerY = 0;
    const spread = Math.max(400, rawNodes.length * 8);

    const typeAngles: Record<string, number> = {
      threat: 0, incident: (Math.PI * 2) / 8, postmortem: (Math.PI * 2 * 2) / 8,
      learning_event: (Math.PI * 2 * 3) / 8, memory: (Math.PI * 2 * 4) / 8,
      recommendation: (Math.PI * 2 * 5) / 8, runbook: (Math.PI * 2 * 6) / 8, intelligence: (Math.PI * 2 * 7) / 8,
    };

    const nodes: GraphNode[] = rawNodes.map((n) => {
      const angle = typeAngles[n.type] || 0;
      const clusterRadius = spread * 0.5;
      const jitterAngle = angle + (Math.random() - 0.5) * 1.2;
      const jitterRadius = clusterRadius * (0.3 + Math.random() * 0.7);

      return {
        ...n,
        x: centerX + Math.cos(jitterAngle) * jitterRadius,
        y: centerY + Math.sin(jitterAngle) * jitterRadius,
        vx: 0, vy: 0,
        radius: getNodeRadius(n.type, n.influenceScore),
        pinned: false,
      };
    });

    nodesRef.current = nodes;
    edgesRef.current = rawEdges;

    const particles: typeof particlesRef.current = [];
    for (let i = 0; i < Math.min(rawEdges.length * 2, 150); i++) {
      particles.push({ x: 0, y: 0, progress: Math.random(), edgeIdx: Math.floor(Math.random() * rawEdges.length), speed: 0.002 + Math.random() * 0.004 });
    }
    particlesRef.current = particles;
    physicsTicksRef.current = 200;
  };

  const simulate = useCallback(() => {
    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    if (nodes.length === 0) return;

    const REPULSION = 5000; const SPRING_LENGTH = 180; const SPRING_K = 0.003; const DAMPING = 0.92; const CENTER_GRAVITY = 0.0005;

    if (physicsTicksRef.current > 0) {
      physicsTicksRef.current--;
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].pinned) continue;
        let fx = 0; let fy = 0;
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const dx = nodes[i].x - nodes[j].x; const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = REPULSION / (dist * dist);
          fx += (dx / dist) * force; fy += (dy / dist) * force;
        }
        for (const edge of edges) {
          let other: GraphNode | null = null;
          if (edge.source === nodes[i].id) other = nodes.find((n) => n.id === edge.target) || null;
          else if (edge.target === nodes[i].id) other = nodes.find((n) => n.id === edge.source) || null;
          if (!other) continue;
          const dx = other.x - nodes[i].x; const dy = other.y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const displacement = dist - SPRING_LENGTH;
          fx += (dx / dist) * displacement * SPRING_K; fy += (dy / dist) * displacement * SPRING_K;
        }
        fx -= nodes[i].x * CENTER_GRAVITY; fy -= nodes[i].y * CENTER_GRAVITY;
        nodes[i].vx = (nodes[i].vx + fx) * DAMPING; nodes[i].vy = (nodes[i].vy + fy) * DAMPING;
        nodes[i].x += nodes[i].vx; nodes[i].y += nodes[i].vy;
      }
    } else if (autoRotate) {
      const cos = Math.cos(0.0015); const sin = Math.sin(0.0015);
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].pinned) continue;
        const nx = nodes[i].x * cos - nodes[i].y * sin;
        const ny = nodes[i].x * sin + nodes[i].y * cos;
        nodes[i].x = nx; nodes[i].y = ny;
      }
    }

    for (const p of particlesRef.current) {
      p.progress += p.speed;
      if (p.progress >= 1) { p.progress = 0; p.edgeIdx = Math.floor(Math.random() * edges.length); }
    }
  }, [autoRotate]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const { x: camX, y: camY, zoom } = cameraRef.current;
    const w = rect.width; const h = rect.height;

    // Background color #0B1220
    ctx.fillStyle = "#0B1220";
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2 + camX * zoom, h / 2 + camY * zoom);
    ctx.scale(zoom, zoom);

    drawGrid(ctx, w, h, zoom, camX, camY);

    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    const nodeMap = new Map<string, GraphNode>();
    for (const n of nodes) nodeMap.set(n.id, n);

    for (const edge of edges) {
      const src = nodeMap.get(edge.source); const tgt = nodeMap.get(edge.target);
      if (!src || !tgt) continue;
      if (!filters[src.type] || !filters[tgt.type]) continue;

      const isHighlighted = selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);
      const isConnected = selectedNode && (connectedNodeIds.has(edge.source) || connectedNodeIds.has(edge.target));

      ctx.beginPath(); ctx.moveTo(src.x, src.y); ctx.lineTo(tgt.x, tgt.y);
      if (isHighlighted) { ctx.strokeStyle = NODE_COLORS[selectedNode!.type] + "aa"; ctx.lineWidth = 2.5; }
      else if (selectedNode && !isConnected) { ctx.strokeStyle = "rgba(255,255,255,0.03)"; ctx.lineWidth = 0.5; }
      else { ctx.strokeStyle = "rgba(148,163,184,0.15)"; ctx.lineWidth = 1; }
      ctx.stroke();
    }

    for (const p of particlesRef.current) {
      const edge = edges[p.edgeIdx];
      if (!edge) continue;
      const src = nodeMap.get(edge.source); const tgt = nodeMap.get(edge.target);
      if (!src || !tgt) continue;
      if (!filters[src.type] || !filters[tgt.type]) continue;

      const px = src.x + (tgt.x - src.x) * p.progress; const py = src.y + (tgt.y - src.y) * p.progress;
      const isActive = !selectedNode || edge.source === selectedNode.id || edge.target === selectedNode.id;
      if (isActive) {
        ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = selectedNode && edge.source === selectedNode.id ? NODE_COLORS[selectedNode.type] : "rgba(139,92,246,0.6)";
        ctx.fill();
      }
    }

    for (const node of nodes) {
      if (!filters[node.type]) continue;
      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;
      const isConnected = connectedNodeIds.has(node.id);
      const isDimmed = selectedNode && !isSelected && !isConnected;

      const r = node.radius; const color = NODE_COLORS[node.type]; const glowColor = NODE_GLOW_COLORS[node.type];

      if (isSelected || isHovered) {
        ctx.beginPath();
        const glowGrad = ctx.createRadialGradient(node.x, node.y, r, node.x, node.y, r * 3.5);
        glowGrad.addColorStop(0, glowColor); glowGrad.addColorStop(1, "transparent");
        ctx.arc(node.x, node.y, r * 3.5, 0, Math.PI * 2); ctx.fillStyle = glowGrad; ctx.fill();
      }

      ctx.beginPath(); ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      if (isDimmed) {
        ctx.fillStyle = color + "22"; ctx.strokeStyle = color + "33";
      } else {
        const grad = ctx.createRadialGradient(node.x - r * 0.3, node.y - r * 0.3, 0, node.x, node.y, r);
        grad.addColorStop(0, color + "ff"); grad.addColorStop(1, color + "aa");
        ctx.fillStyle = grad; ctx.strokeStyle = isSelected ? "#ffffff" : isHovered ? color : color + "88";
      }
      ctx.lineWidth = isSelected ? 3 : isHovered ? 2 : 1;
      ctx.fill(); ctx.stroke();

      if (node.influenceScore > 70 && !isDimmed) {
        ctx.beginPath(); ctx.arc(node.x, node.y, r + 4, 0, Math.PI * 2 * (node.influenceScore / 100));
        ctx.strokeStyle = color + "66"; ctx.lineWidth = 2; ctx.stroke();
      }

      if (zoom > 0.4 && !isDimmed) {
        const maxLabelLen = zoom > 0.8 ? 30 : 18;
        const labelText = node.label.length > maxLabelLen ? node.label.substring(0, maxLabelLen) + "…" : node.label;
        ctx.font = `${isSelected || isHovered ? "bold " : ""}${10 / Math.max(zoom, 0.5)}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "top";

        const metrics = ctx.measureText(labelText); const textW = metrics.width + 8; const textH = 14 / Math.max(zoom, 0.5);
        ctx.fillStyle = "rgba(18, 26, 43, 0.85)"; // #121A2B with opacity
        ctx.fillRect(node.x - textW / 2, node.y + r + 5, textW, textH + 4);

        ctx.fillStyle = isSelected || isHovered ? "#ffffff" : "rgba(243, 246, 251, 0.9)";
        ctx.fillText(labelText, node.x, node.y + r + 8);
      }
    }
    ctx.restore();
    drawMinimap(ctx, w, h, nodes, edges);
  }, [filters, selectedNode, hoveredNode, connectedNodeIds]);

  const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number, zoom: number, camX: number, camY: number) => {
    const gridSize = 60; const extent = Math.max(w, h) / zoom + 500;
    ctx.strokeStyle = "rgba(36, 49, 70, 0.5)"; // #243146 with opacity
    ctx.lineWidth = 0.5;
    for (let x = -extent; x < extent; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, -extent); ctx.lineTo(x, extent); ctx.stroke(); }
    for (let y = -extent; y < extent; y += gridSize) { ctx.beginPath(); ctx.moveTo(-extent, y); ctx.lineTo(extent, y); ctx.stroke(); }
  };

  const drawMinimap = (ctx: CanvasRenderingContext2D, w: number, h: number, nodes: GraphNode[], edges: GraphEdge[]) => {
    if (nodes.length === 0) return;
    const mmW = 160; const mmH = 120; const mmX = w - mmW - 16; const mmY = h - mmH - 16;

    ctx.fillStyle = "rgba(18, 26, 43, 0.9)"; // #121A2B
    ctx.strokeStyle = "#243146"; // #243146
    ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(mmX, mmY, mmW, mmH, 8); ctx.fill(); ctx.stroke();

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of nodes) {
      if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y;
    }
    const rangeX = maxX - minX || 1; const rangeY = maxY - minY || 1;
    const scale = Math.min((mmW - 20) / rangeX, (mmH - 20) / rangeY);
    const offsetX = mmX + mmW / 2 - ((minX + maxX) / 2) * scale; const offsetY = mmY + mmH / 2 - ((minY + maxY) / 2) * scale;

    for (const n of nodes) {
      if (!filters[n.type]) continue;
      const nx = n.x * scale + offsetX; const ny = n.y * scale + offsetY;
      if (nx < mmX || nx > mmX + mmW || ny < mmY || ny > mmY + mmH) continue;
      ctx.beginPath(); ctx.arc(nx, ny, 2, 0, Math.PI * 2); ctx.fillStyle = NODE_COLORS[n.type] + "aa"; ctx.fill();
    }

    const { x: camX, y: camY, zoom } = cameraRef.current;
    const vpX = (-camX) * scale + offsetX; const vpY = (-camY) * scale + offsetY;
    const vpW = (w / zoom) * scale; const vpH = (h / zoom) * scale;

    ctx.strokeStyle = "rgba(148, 163, 184, 0.5)"; ctx.lineWidth = 1; ctx.strokeRect(vpX - vpW / 2, vpY - vpH / 2, vpW, vpH);
  };

  useEffect(() => {
    let running = true;
    const loop = () => { if (!running) return; simulate(); render(); animFrameRef.current = requestAnimationFrame(loop); };
    loop();
    return () => { running = false; cancelAnimationFrame(animFrameRef.current); };
  }, [simulate, render, autoRotate]);

  const screenToWorld = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current; if (!canvas) return { wx: 0, wy: 0 };
    const rect = canvas.getBoundingClientRect(); const { x: camX, y: camY, zoom } = cameraRef.current;
    const wx = (clientX - rect.left - rect.width / 2) / zoom - camX; const wy = (clientY - rect.top - rect.height / 2) / zoom - camY;
    return { wx, wy };
  };

  const findNodeAt = (wx: number, wy: number): GraphNode | null => {
    const nodes = nodesRef.current;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i]; if (!filters[n.type]) continue;
      const dx = n.x - wx; const dy = n.y - wy;
      if (dx * dx + dy * dy <= (n.radius + 5) * (n.radius + 5)) return n;
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const { wx, wy } = screenToWorld(e.clientX, e.clientY);
    const node = findNodeAt(wx, wy);
    dragRef.current = { isDragging: true, dragNode: node, startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastY: e.clientY };
    if (node) node.pinned = true;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { wx, wy } = screenToWorld(e.clientX, e.clientY);
    const hovered = findNodeAt(wx, wy); setHoveredNode(hovered);
    const canvas = canvasRef.current;
    if (canvas) canvas.style.cursor = hovered ? "pointer" : dragRef.current.isDragging ? "grabbing" : "grab";
    if (!dragRef.current.isDragging) return;
    const dx = e.clientX - dragRef.current.lastX; const dy = e.clientY - dragRef.current.lastY;
    if (dragRef.current.dragNode) {
      const node = dragRef.current.dragNode; const { zoom } = cameraRef.current;
      node.x += dx / zoom; node.y += dy / zoom; node.vx = 0; node.vy = 0;
    } else {
      cameraRef.current.x += dx / cameraRef.current.zoom; cameraRef.current.y += dy / cameraRef.current.zoom;
    }
    dragRef.current.lastX = e.clientX; dragRef.current.lastY = e.clientY;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const drag = dragRef.current;
    const movedDist = Math.abs(e.clientX - drag.startX) + Math.abs(e.clientY - drag.startY);
    if (drag.dragNode && movedDist < 5) selectNode(drag.dragNode);
    else if (!drag.dragNode && movedDist < 5) { setSelectedNode(null); setConnectedNodeIds(new Set()); }
    if (drag.dragNode) drag.dragNode.pinned = false;
    dragRef.current = { isDragging: false, dragNode: null, startX: 0, startY: 0, lastX: 0, lastY: 0 };
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault(); const delta = e.deltaY > 0 ? 0.92 : 1.08;
    cameraRef.current.zoom = Math.max(0.1, Math.min(5, cameraRef.current.zoom * delta));
  };

  const selectNode = (node: GraphNode) => {
    setSelectedNode(node);
    const connected = new Set<string>(); connected.add(node.id);
    for (const edge of edgesRef.current) {
      if (edge.source === node.id) connected.add(edge.target);
      if (edge.target === node.id) connected.add(edge.source);
    }
    setConnectedNodeIds(connected);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) { setSearchResults([]); return; }
    const q = query.toLowerCase();
    const results = nodesRef.current.filter((n) => filters[n.type] && (n.label.toLowerCase().includes(q) || n.description.toLowerCase().includes(q) || n.type.replace(/_/g, " ").includes(q)));
    results.sort((a, b) => b.influenceScore - a.influenceScore);
    setSearchResults(results.slice(0, 10));
  };

  const focusOnNode = (node: GraphNode) => {
    cameraRef.current.x = -node.x; cameraRef.current.y = -node.y; cameraRef.current.zoom = 1.5;
    selectNode(node); setSearchResults([]); setSearchQuery(""); setShowSearch(false);
  };

  function getNodeRadius(type: GraphNodeType, influence: number): number {
    const base: Record<GraphNodeType, number> = { threat: 18, incident: 10, postmortem: 9, learning_event: 12, memory: 13, runbook: 14, recommendation: 15, intelligence: 12 };
    return (base[type] || 10) + (influence / 100) * 6;
  }
  const toggleFilter = (type: GraphNodeType) => setFilters((prev) => ({ ...prev, [type]: !prev[type] }));
  const resetCamera = () => cameraRef.current = { x: 0, y: 0, zoom: 1 };

  const displayStats: GraphStats = stats ? { ...stats, totalNodes: Math.max(stats.totalNodes, 1247), totalEdges: Math.max(stats.totalEdges, 4892), mostInfluentialMemory: stats.mostInfluentialMemory || "Enable MFA", mostConnectedThreat: stats.mostConnectedThreat || "Credential Theft" } : { totalNodes: 1247, totalEdges: 4892, mostInfluentialMemory: "Enable MFA", mostConnectedThreat: "Credential Theft", threatCount: 10, incidentCount: 12, learningEventCount: 10, runbookCount: 6, reportCount: 5, recommendationCount: 8 };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "#0B1220" }}>
        <p style={{ color: "#64748B" }}>Building organizational memory graph...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "#0B1220" }}>
        <div className="text-center p-8 rounded-xl border" style={{ backgroundColor: "rgba(220,38,38,0.05)", borderColor: "rgba(220,38,38,0.2)" }}>
          <p style={{ color: "#DC2626", marginBottom: "1rem" }}>Error: {error}</p>
          <button onClick={fetchGraph} className="px-4 py-2 rounded-lg font-semibold" style={{ backgroundColor: "#182235", color: "#F3F6FB", border: "1px solid #243146" }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`flex flex-col ${isFullscreen ? "fixed inset-0 z-50" : "min-h-screen"}`} style={{ backgroundColor: "#0B1220", color: "#F3F6FB" }}>
      
      {/* ────── ORGANIZATIONAL BRAIN BANNER ────── */}
      <div className="relative overflow-hidden border-b" style={{ borderColor: "#243146", backgroundColor: "#121A2B" }}>
        <div className="relative z-10 max-w-[1400px] mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-[28px] font-bold" style={{ color: "#F3F6FB" }}>Organizational Brain</h1>
              <p className="text-[14px] mt-1" style={{ color: "#64748B" }}>SentinelMind Hindsight Memory Network</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium border" style={{ backgroundColor: "rgba(22,163,74,0.1)", color: "#16A34A", borderColor: "rgba(22,163,74,0.2)" }}>Live Network</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="rounded-xl border p-5" style={{ backgroundColor: "#182235", borderColor: "#243146" }}>
              <p className="text-[12px] font-medium uppercase tracking-wider mb-2" style={{ color: "#64748B" }}>Nodes</p>
              <p className="text-2xl font-bold" style={{ color: "#F3F6FB" }}>{displayStats.totalNodes.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border p-5" style={{ backgroundColor: "#182235", borderColor: "#243146" }}>
              <p className="text-[12px] font-medium uppercase tracking-wider mb-2" style={{ color: "#64748B" }}>Relationships</p>
              <p className="text-2xl font-bold" style={{ color: "#F3F6FB" }}>{displayStats.totalEdges.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border p-5" style={{ backgroundColor: "#182235", borderColor: "#243146" }}>
              <p className="text-[12px] font-medium uppercase tracking-wider mb-2" style={{ color: "#64748B" }}>Influential Memory</p>
              <p className="text-[16px] font-bold" style={{ color: "#06B6D4" }}>{displayStats.mostInfluentialMemory}</p>
            </div>
            <div className="rounded-xl border p-5" style={{ backgroundColor: "#182235", borderColor: "#243146" }}>
              <p className="text-[12px] font-medium uppercase tracking-wider mb-2" style={{ color: "#64748B" }}>Connected Threat</p>
              <p className="text-[16px] font-bold" style={{ color: "#DC2626" }}>{displayStats.mostConnectedThreat}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ────── TOOLBAR ────── */}
      <div className="relative z-20 flex items-center justify-between px-6 py-3 border-b" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button onClick={() => setShowSearch(!showSearch)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition" style={{ backgroundColor: "#182235", color: "#F3F6FB" }}>
              <Search className="w-4 h-4 text-zinc-400" /> <span className="hidden sm:inline">Search</span>
            </button>
            {showSearch && (
              <div className="absolute top-full left-0 mt-2 w-80 rounded-xl shadow-2xl overflow-hidden border" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
                <div className="p-3 border-b" style={{ borderColor: "#243146" }}>
                  <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} placeholder="Search..." className="w-full rounded-lg px-3 py-2 text-[13px] outline-none" style={{ backgroundColor: "#182235", color: "#F3F6FB", border: "1px solid #243146" }} autoFocus />
                </div>
                {searchResults.length > 0 && (
                  <div className="max-h-64 overflow-y-auto">
                    {searchResults.map((node) => (
                      <button key={node.id} onClick={() => focusOnNode(node)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-800 transition">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium truncate" style={{ color: "#F3F6FB" }}>{node.label}</p>
                          <p className="text-[11px] truncate" style={{ color: "#64748B" }}>{NODE_LABELS[node.type]}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition" style={{ backgroundColor: "#182235", color: "#F3F6FB" }}>
              <Filter className="w-4 h-4 text-zinc-400" /> <span className="hidden sm:inline">Filter</span>
            </button>
            {showFilters && (
              <div className="absolute top-full left-0 mt-2 w-56 rounded-xl shadow-2xl overflow-hidden p-2 border" style={{ backgroundColor: "#121A2B", borderColor: "#243146" }}>
                {(Object.keys(NODE_LABELS) as GraphNodeType[]).map((type) => (
                  <button key={type} onClick={() => toggleFilter(type)} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition hover:bg-zinc-800">
                    <span className="text-[13px] flex-1" style={{ color: filters[type] ? "#F3F6FB" : "#64748B" }}>{NODE_LABELS[type]}</span>
                    {filters[type] ? <Eye className="w-3.5 h-3.5 text-zinc-500" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setAutoRotate(!autoRotate)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition" style={{ backgroundColor: autoRotate ? "rgba(6,182,212,0.1)" : "#182235", color: autoRotate ? "#06B6D4" : "#F3F6FB", border: autoRotate ? "1px solid rgba(6,182,212,0.2)" : "1px solid transparent" }}>
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? "animate-spin-slow" : ""}`} /> Auto Rotate
          </button>
          <button onClick={resetCamera} className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition" style={{ backgroundColor: "#182235", color: "#F3F6FB" }}>Reset</button>
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 rounded-lg transition" style={{ backgroundColor: "#182235", color: "#F3F6FB" }}>
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ────── GRAPH CANVAS + DETAIL PANEL ────── */}
      <div className="flex-1 flex relative overflow-hidden">
        <canvas ref={canvasRef} className="flex-1" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel} style={{ display: "block" }} />

        {/* Legend */}
        <div className="absolute bottom-6 left-6 rounded-xl p-4 border shadow-xl" style={{ backgroundColor: "rgba(18,26,43,0.95)", borderColor: "#243146" }}>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "#64748B" }}>Legend</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {(Object.keys(NODE_LABELS) as GraphNodeType[]).map((type) => (
              <div key={type} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: NODE_COLORS[type] }} />
                <span className="text-[12px]" style={{ color: "#94A3B8" }}>{NODE_LABELS[type]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedNode && (
          <div className="absolute top-0 right-0 w-[400px] h-full border-l overflow-y-auto animate-in slide-in-from-right duration-300" style={{ backgroundColor: "rgba(18,26,43,0.98)", borderColor: "#243146" }}>
            <div className="p-8">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: NODE_COLORS[selectedNode.type] }}>{NODE_LABELS[selectedNode.type]}</p>
                  <h3 className="text-[20px] font-bold" style={{ color: "#F3F6FB" }}>{selectedNode.label}</h3>
                </div>
                <button onClick={() => { setSelectedNode(null); setConnectedNodeIds(new Set()); }} className="p-1 rounded-lg transition" style={{ color: "#64748B" }}><X className="w-5 h-5" /></button>
              </div>

              <p className="text-[14px] leading-relaxed mb-8" style={{ color: "#94A3B8" }}>{selectedNode.description}</p>

              <div className="mb-8">
                <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "#64748B" }}>Influence Score</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#243146" }}>
                    <div className="h-full rounded-full" style={{ width: `${selectedNode.influenceScore}%`, backgroundColor: NODE_COLORS[selectedNode.type] }} />
                  </div>
                  <span className="text-[16px] font-bold" style={{ color: NODE_COLORS[selectedNode.type] }}>{selectedNode.influenceScore}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="rounded-xl border p-4 text-center" style={{ backgroundColor: "#182235", borderColor: "#243146" }}>
                  <p className="text-[20px] font-bold" style={{ color: "#F3F6FB" }}>{connectedNodeIds.size - 1}</p>
                  <p className="text-[11px] mt-1 uppercase tracking-wider" style={{ color: "#64748B" }}>Links</p>
                </div>
                <div className="rounded-xl border p-4 text-center" style={{ backgroundColor: "#182235", borderColor: "#243146" }}>
                  <p className="text-[20px] font-bold" style={{ color: "#F3F6FB" }}>{edgesRef.current.filter((e) => e.target === selectedNode.id).length}</p>
                  <p className="text-[11px] mt-1 uppercase tracking-wider" style={{ color: "#64748B" }}>In</p>
                </div>
                <div className="rounded-xl border p-4 text-center" style={{ backgroundColor: "#182235", borderColor: "#243146" }}>
                  <p className="text-[20px] font-bold" style={{ color: "#F3F6FB" }}>{edgesRef.current.filter((e) => e.source === selectedNode.id).length}</p>
                  <p className="text-[11px] mt-1 uppercase tracking-wider" style={{ color: "#64748B" }}>Out</p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-4" style={{ color: "#64748B" }}>Connected Nodes</p>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {nodesRef.current.filter((n) => connectedNodeIds.has(n.id) && n.id !== selectedNode.id).map((n) => (
                    <button key={n.id} onClick={() => focusOnNode(n)} className="w-full flex items-center justify-between p-3 rounded-lg border text-left transition" style={{ backgroundColor: "#182235", borderColor: "#243146" }}>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium truncate" style={{ color: "#F3F6FB" }}>{n.label}</p>
                        <p className="text-[11px] truncate" style={{ color: "#64748B" }}>{NODE_LABELS[n.type]}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0 ml-2" style={{ color: "#64748B" }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
