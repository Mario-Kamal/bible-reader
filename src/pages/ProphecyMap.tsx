import { useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTopics, useUserProgress } from '@/hooks/useTopics';
import { useTopicLinks, useGenerateTopicLinks } from '@/hooks/useTopicLinks';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Sparkles, X, ExternalLink, Check, Loader2 } from 'lucide-react';

const RELATIONSHIP_LABELS: Record<string, string> = {
  fulfillment: 'تحقيق',
  parallel: 'تشابه',
  continuation: 'استمرار',
  contrast: 'تضاد',
  typology: 'رمز',
  related: 'مرتبط',
};

const RELATIONSHIP_COLORS: Record<string, string> = {
  fulfillment: 'hsl(210 90% 50%)',
  parallel: 'hsl(45 95% 50%)',
  continuation: 'hsl(145 70% 42%)',
  contrast: 'hsl(0 80% 55%)',
  typology: 'hsl(275 70% 58%)',
  related: 'hsl(220 10% 55%)',
};

interface NodePosition {
  id: string;
  x: number;
  y: number;
  title: string;
  isCompleted: boolean;
}

export default function ProphecyMap() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: topics, isLoading: topicsLoading } = useTopics();
  const { data: progress } = useUserProgress();
  const { data: links, isLoading: linksLoading } = useTopicLinks();
  const generateLinks = useGenerateTopicLinks();

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);
  const isPanning = useRef(false);
  const lastPan = useRef({ x: 0, y: 0 });

  const publishedTopics = useMemo(
    () => (topics || []).filter(t => t.is_published),
    [topics]
  );

  const completedIds = useMemo(
    () => new Set((progress || []).map(p => p.topic_id)),
    [progress]
  );

  const nodes: NodePosition[] = useMemo(() => {
    const count = publishedTopics.length;
    if (count === 0) return [];

    const centerX = 500;
    const centerY = 400;
    const radius = Math.min(350, 80 + count * 20);

    return publishedTopics.map((topic, i) => {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;
      return {
        id: topic.id,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        title: topic.title.length > 20 ? topic.title.slice(0, 20) + '…' : topic.title,
        isCompleted: completedIds.has(topic.id),
      };
    });
  }, [publishedTopics, completedIds]);

  const nodeMap = useMemo(() => {
    const m = new Map<string, NodePosition>();
    nodes.forEach(n => m.set(n.id, n));
    return m;
  }, [nodes]);

  const validLinks = useMemo(
    () => (links || []).filter(l => nodeMap.has(l.source_topic_id) && nodeMap.has(l.target_topic_id)),
    [links, nodeMap]
  );

  const activeNode = selectedNode || hoveredNode;

  const highlightedLinks = useMemo(() => {
    if (!activeNode) return new Set<string>();
    return new Set(
      validLinks
        .filter(l => l.source_topic_id === activeNode || l.target_topic_id === activeNode)
        .map(l => l.id)
    );
  }, [activeNode, validLinks]);

  const connectedNodes = useMemo(() => {
    if (!activeNode) return new Set<string>();
    const s = new Set<string>();
    validLinks.forEach(l => {
      if (l.source_topic_id === activeNode) s.add(l.target_topic_id);
      if (l.target_topic_id === activeNode) s.add(l.source_topic_id);
    });
    s.add(activeNode);
    return s;
  }, [activeNode, validLinks]);

  const selectedTopic = useMemo(
    () => publishedTopics.find(t => t.id === selectedNode),
    [selectedNode, publishedTopics]
  );

  const selectedConnections = useMemo(
    () => validLinks.filter(l => l.source_topic_id === selectedNode || l.target_topic_id === selectedNode),
    [selectedNode, validLinks]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as SVGElement).closest('.graph-node')) return;
    isPanning.current = true;
    lastPan.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    setPan(prev => ({
      x: prev.x + (e.clientX - lastPan.current.x),
      y: prev.y + (e.clientY - lastPan.current.y),
    }));
    lastPan.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale(prev => Math.max(0.3, Math.min(3, prev - e.deltaY * 0.001)));
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isPanning.current = true;
      lastPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPanning.current || e.touches.length !== 1) return;
    setPan(prev => ({
      x: prev.x + (e.touches[0].clientX - lastPan.current.x),
      y: prev.y + (e.touches[0].clientY - lastPan.current.y),
    }));
    lastPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const isLoading = topicsLoading || linksLoading;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col" dir="rtl">
      {/* Floating Header */}
      <header className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <div className="flex items-center justify-between p-4 pointer-events-auto">
          <div className="flex items-center gap-3 bg-card/80 backdrop-blur-lg rounded-2xl px-4 py-2.5 border shadow-lg">
            <GitBranch className="w-5 h-5 text-primary" />
            <div>
              <h1 className="text-sm font-bold">خريطة النبوات</h1>
              <p className="text-[10px] text-muted-foreground">
                {publishedTopics.length} نبوة · {validLinks.length} رابط
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => generateLinks.mutate(undefined)}
                disabled={generateLinks.isPending}
                className="gap-2 rounded-xl shadow-lg bg-card/80 backdrop-blur-lg border"
              >
                {generateLinks.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                توليد
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate(-1)}
              className="rounded-xl shadow-lg bg-card/80 backdrop-blur-lg border"
            >
              ✕
            </Button>
          </div>
        </div>
      </header>

      {/* Full-screen Graph */}
      <div className="flex-1 relative overflow-hidden">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />

        {nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">لا توجد نبوات منشورة بعد</p>
          </div>
        ) : (
          <svg
            ref={svgRef}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            viewBox="0 0 1000 800"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            <defs>
              {/* Glow filter */}
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {/* Hover glow */}
              <filter id="hover-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {/* Animated gradient for links */}
              <linearGradient id="link-gradient-active" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8">
                  <animate attributeName="stop-opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3">
                  <animate attributeName="stop-opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
                </stop>
              </linearGradient>
            </defs>

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
              {/* Links */}
              {validLinks.map((link, i) => {
                const source = nodeMap.get(link.source_topic_id);
                const target = nodeMap.get(link.target_topic_id);
                if (!source || !target) return null;

                const isHighlighted = highlightedLinks.has(link.id);
                const isDimmed = activeNode && !isHighlighted;
                const color = RELATIONSHIP_COLORS[link.relationship_type] || RELATIONSHIP_COLORS.related;

                const dx = target.x - source.x;
                const dy = target.y - source.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const mx = (source.x + target.x) / 2;
                const my = (source.y + target.y) / 2;
                const offset = 30;
                const cx = mx - dy * offset / dist;
                const cy = my + dx * offset / dist;

                return (
                  <g key={link.id}>
                    {/* Shadow line */}
                    {isHighlighted && (
                      <path
                        d={`M ${source.x} ${source.y} Q ${cx} ${cy} ${target.x} ${target.y}`}
                        fill="none"
                        stroke={color}
                        strokeWidth={8}
                        opacity={0.15}
                        strokeLinecap="round"
                      />
                    )}
                    <path
                      d={`M ${source.x} ${source.y} Q ${cx} ${cy} ${target.x} ${target.y}`}
                      fill="none"
                      stroke={color}
                      strokeWidth={isHighlighted ? 3 : 1.5}
                      opacity={isDimmed ? 0.08 : isHighlighted ? 1 : 0.35}
                      strokeLinecap="round"
                      strokeDasharray={isHighlighted ? 'none' : '4 4'}
                      style={{
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      {/* Draw-in animation */}
                      <animate
                        attributeName="stroke-dashoffset"
                        from={`${dist}`}
                        to="0"
                        dur={`${0.8 + i * 0.05}s`}
                        fill="freeze"
                        begin="0s"
                      />
                    </path>
                  </g>
                );
              })}

              {/* Nodes */}
              {nodes.map((node, index) => {
                const isSelected = selectedNode === node.id;
                const isHovered = hoveredNode === node.id;
                const isConnected = connectedNodes.has(node.id);
                const isDimmed = activeNode && !isConnected;
                const isActive = isSelected || isHovered;
                const nodeRadius = isActive ? 26 : 20;

                return (
                  <g
                    key={node.id}
                    className="graph-node cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(prev => prev === node.id ? null : node.id);
                    }}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    style={{
                      opacity: isDimmed ? 0.1 : 1,
                      transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      animation: `nodeEntry 0.5s ease-out ${index * 0.05}s both`,
                    }}
                  >

                    {/* Outer ring pulse for selected */}
                    {isSelected && (
                      <circle cx={node.x} cy={node.y} r={36} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.3">
                        <animate attributeName="r" values="28;40;28" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}

                    {/* Glow background */}
                    {isActive && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={34}
                        fill={node.isCompleted ? 'hsl(var(--primary))' : 'hsl(var(--foreground))'}
                        opacity={0.08}
                      />
                    )}

                    {/* Drop shadow */}
                    <circle
                      cx={node.x}
                      cy={node.y + 2}
                      r={nodeRadius}
                      fill="hsl(var(--foreground))"
                      opacity={isActive ? 0.12 : 0.05}
                      style={{ transition: 'all 0.3s ease' }}
                    />

                    {/* Main circle */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={nodeRadius}
                      fill={node.isCompleted ? 'hsl(210 90% 50%)' : 'hsl(var(--card))'}
                      stroke={isActive ? 'hsl(210 90% 50%)' : node.isCompleted ? 'hsl(210 90% 60%)' : 'hsl(var(--border))'}
                      strokeWidth={isActive ? 3 : 2}
                      filter={isActive ? 'url(#hover-glow)' : undefined}
                      style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    />

                    {/* Inner accent ring */}
                    {node.isCompleted && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={nodeRadius - 4}
                        fill="none"
                        stroke="hsl(var(--primary-foreground))"
                        strokeWidth="0.5"
                        opacity="0.3"
                      />
                    )}

                    {/* Check icon */}
                    {node.isCompleted && (
                      <foreignObject x={node.x - 8} y={node.y - 8} width={16} height={16}>
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </foreignObject>
                    )}

                    {/* Index number for incomplete */}
                    {!node.isCompleted && (
                      <text
                        x={node.x}
                        y={node.y + 4}
                        textAnchor="middle"
                        className="fill-foreground text-[10px] font-bold"
                        style={{ pointerEvents: 'none' }}
                      >
                        {index + 1}
                      </text>
                    )}

                    {/* Label */}
                    <text
                      x={node.x}
                      y={node.y + (isActive ? 44 : 38)}
                      textAnchor="middle"
                      className="fill-foreground font-semibold"
                      style={{
                        pointerEvents: 'none',
                        fontSize: isActive ? '12px' : '10px',
                        fontWeight: isActive ? 700 : 600,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {node.title}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        )}

        {/* Zoom controls - bottom left */}
        <div className="absolute bottom-20 md:bottom-6 left-4 flex flex-col gap-1.5">
          <Button size="icon" variant="secondary" className="w-9 h-9 rounded-xl shadow-lg bg-card/80 backdrop-blur-lg border" onClick={() => setScale(s => Math.min(3, s + 0.2))}>+</Button>
          <Button size="icon" variant="secondary" className="w-9 h-9 rounded-xl shadow-lg bg-card/80 backdrop-blur-lg border" onClick={() => setScale(s => Math.max(0.3, s - 0.2))}>−</Button>
          <Button size="icon" variant="secondary" className="w-9 h-9 rounded-xl shadow-lg bg-card/80 backdrop-blur-lg border text-xs" onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); }}>⟳</Button>
        </div>

        {/* Legend - bottom right */}
        <div className="absolute bottom-20 md:bottom-6 right-4 bg-card/90 backdrop-blur-lg rounded-xl p-3 border shadow-lg text-[11px] space-y-2">
          {Object.entries(RELATIONSHIP_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <div className="w-6 h-[3px] rounded-full" style={{ backgroundColor: RELATIONSHIP_COLORS[key] }} />
              <span className="text-foreground font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Panel - slides in from bottom on mobile, side on desktop */}
      {selectedTopic && (
        <div className="absolute bottom-0 left-0 right-0 lg:top-0 lg:left-auto lg:right-0 lg:bottom-auto lg:w-80 lg:h-full bg-card/95 backdrop-blur-xl border-t lg:border-t-0 lg:border-r shadow-2xl animate-fade-in z-20 max-h-[50vh] lg:max-h-full overflow-y-auto">
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <h2 className="font-bold text-lg leading-tight">{selectedTopic.title}</h2>
              <Button size="icon" variant="ghost" className="shrink-0 -mt-1" onClick={() => setSelectedNode(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {selectedTopic.description && (
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-4">
                {selectedTopic.description}
              </p>
            )}

            <Button
              size="sm"
              className="w-full mb-5 gap-2 rounded-xl"
              onClick={() => navigate(`/topic/${selectedTopic.id}`)}
            >
              <ExternalLink className="w-4 h-4" />
              قراءة النبوة
            </Button>

            {selectedConnections.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  النبوات المرتبطة ({selectedConnections.length})
                </h3>
                {selectedConnections.map(link => {
                  const otherId = link.source_topic_id === selectedNode ? link.target_topic_id : link.source_topic_id;
                  const otherTopic = publishedTopics.find(t => t.id === otherId);
                  if (!otherTopic) return null;

                  return (
                    <Card
                      key={link.id}
                      className="p-3 cursor-pointer hover:bg-muted/50 hover:scale-[1.02] transition-all duration-200 border-muted"
                      onClick={() => setSelectedNode(otherId)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 rounded-md"
                          style={{
                            borderColor: RELATIONSHIP_COLORS[link.relationship_type],
                            color: RELATIONSHIP_COLORS[link.relationship_type],
                          }}
                        >
                          {RELATIONSHIP_LABELS[link.relationship_type] || link.relationship_type}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{otherTopic.title}</p>
                      {link.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{link.description}</p>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}

            {selectedConnections.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                لا توجد روابط لهذه النبوة بعد
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
