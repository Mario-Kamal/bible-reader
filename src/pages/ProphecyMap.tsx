import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTopics, useUserProgress } from '@/hooks/useTopics';
import { useTopicLinks, useGenerateTopicLinks } from '@/hooks/useTopicLinks';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Sparkles, X, ExternalLink, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const RELATIONSHIP_LABELS: Record<string, string> = {
  fulfillment: 'تحقيق',
  parallel: 'تشابه',
  continuation: 'استمرار',
  contrast: 'تضاد',
  typology: 'رمز',
  related: 'مرتبط',
};

const RELATIONSHIP_COLORS: Record<string, string> = {
  fulfillment: 'hsl(var(--primary))',
  parallel: 'hsl(var(--accent))',
  continuation: 'hsl(142 76% 36%)',
  contrast: 'hsl(0 84% 60%)',
  typology: 'hsl(280 67% 55%)',
  related: 'hsl(var(--muted-foreground))',
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

  // Calculate node positions in a circular/force-directed-ish layout
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
        title: topic.title.length > 25 ? topic.title.slice(0, 25) + '…' : topic.title,
        isCompleted: completedIds.has(topic.id),
      };
    });
  }, [publishedTopics, completedIds]);

  const nodeMap = useMemo(() => {
    const m = new Map<string, NodePosition>();
    nodes.forEach(n => m.set(n.id, n));
    return m;
  }, [nodes]);

  // Filter links to only connected nodes
  const validLinks = useMemo(
    () => (links || []).filter(l => nodeMap.has(l.source_topic_id) && nodeMap.has(l.target_topic_id)),
    [links, nodeMap]
  );

  // Links connected to selected node
  const highlightedLinks = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    return new Set(
      validLinks
        .filter(l => l.source_topic_id === selectedNode || l.target_topic_id === selectedNode)
        .map(l => l.id)
    );
  }, [selectedNode, validLinks]);

  const connectedNodes = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    const s = new Set<string>();
    validLinks.forEach(l => {
      if (l.source_topic_id === selectedNode) s.add(l.target_topic_id);
      if (l.target_topic_id === selectedNode) s.add(l.source_topic_id);
    });
    s.add(selectedNode);
    return s;
  }, [selectedNode, validLinks]);

  const selectedTopic = useMemo(
    () => publishedTopics.find(t => t.id === selectedNode),
    [selectedNode, publishedTopics]
  );

  const selectedConnections = useMemo(
    () => validLinks.filter(l => l.source_topic_id === selectedNode || l.target_topic_id === selectedNode),
    [selectedNode, validLinks]
  );

  // Pan/Zoom handlers
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

  // Touch support
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
      <AppLayout>
        <div className="min-h-screen p-4" dir="rtl">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-[60vh] w-full rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen" dir="rtl">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b p-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GitBranch className="w-6 h-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">خريطة النبوات</h1>
                <p className="text-xs text-muted-foreground">
                  {publishedTopics.length} نبوة · {validLinks.length} رابط
                </p>
              </div>
            </div>
            {isAdmin && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => generateLinks.mutate(undefined)}
                disabled={generateLinks.isPending}
                className="gap-2"
              >
                {generateLinks.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                توليد الروابط
              </Button>
            )}
          </div>
        </header>

        <div className="flex flex-col lg:flex-row">
          {/* Graph */}
          <div className="flex-1 relative overflow-hidden bg-muted/30" style={{ height: 'calc(100vh - 120px)' }}>
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
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
                  {/* Links */}
                  {validLinks.map(link => {
                    const source = nodeMap.get(link.source_topic_id);
                    const target = nodeMap.get(link.target_topic_id);
                    if (!source || !target) return null;

                    const isHighlighted = highlightedLinks.has(link.id);
                    const isDimmed = selectedNode && !isHighlighted;
                    const color = RELATIONSHIP_COLORS[link.relationship_type] || RELATIONSHIP_COLORS.related;

                    // Curved line
                    const mx = (source.x + target.x) / 2;
                    const my = (source.y + target.y) / 2;
                    const dx = target.x - source.x;
                    const dy = target.y - source.y;
                    const offset = 30;
                    const cx = mx - dy * offset / Math.sqrt(dx * dx + dy * dy || 1);
                    const cy = my + dx * offset / Math.sqrt(dx * dx + dy * dy || 1);

                    return (
                      <path
                        key={link.id}
                        d={`M ${source.x} ${source.y} Q ${cx} ${cy} ${target.x} ${target.y}`}
                        fill="none"
                        stroke={color}
                        strokeWidth={isHighlighted ? 3 : 1.5}
                        opacity={isDimmed ? 0.1 : isHighlighted ? 1 : 0.4}
                        className="transition-all duration-300"
                      />
                    );
                  })}

                  {/* Nodes */}
                  {nodes.map(node => {
                    const isSelected = selectedNode === node.id;
                    const isConnected = connectedNodes.has(node.id);
                    const isDimmed = selectedNode && !isConnected;

                    return (
                      <g
                        key={node.id}
                        className="graph-node cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNode(prev => prev === node.id ? null : node.id);
                        }}
                        opacity={isDimmed ? 0.15 : 1}
                        style={{ transition: 'opacity 0.3s' }}
                      >
                        {/* Glow for selected */}
                        {isSelected && (
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={32}
                            fill="hsl(var(--primary) / 0.15)"
                            className="animate-pulse"
                          />
                        )}
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={isSelected ? 24 : 20}
                          fill={node.isCompleted ? 'hsl(var(--primary))' : 'hsl(var(--card))'}
                          stroke={isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
                          strokeWidth={isSelected ? 3 : 1.5}
                          className="transition-all duration-200"
                        />
                        {node.isCompleted && (
                          <foreignObject x={node.x - 8} y={node.y - 8} width={16} height={16}>
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </foreignObject>
                        )}
                        <text
                          x={node.x}
                          y={node.y + 36}
                          textAnchor="middle"
                          className="fill-foreground text-[10px] font-medium"
                          style={{ pointerEvents: 'none' }}
                        >
                          {node.title}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            )}

            {/* Zoom controls */}
            <div className="absolute bottom-4 left-4 flex flex-col gap-1">
              <Button size="icon" variant="secondary" className="w-8 h-8" onClick={() => setScale(s => Math.min(3, s + 0.2))}>+</Button>
              <Button size="icon" variant="secondary" className="w-8 h-8" onClick={() => setScale(s => Math.max(0.3, s - 0.2))}>−</Button>
              <Button size="icon" variant="secondary" className="w-8 h-8 text-xs" onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); }}>⟳</Button>
            </div>

            {/* Legend */}
            <div className="absolute top-4 left-4 bg-card/90 backdrop-blur rounded-lg p-3 border text-xs space-y-1.5">
              {Object.entries(RELATIONSHIP_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="w-4 h-0.5 rounded" style={{ backgroundColor: RELATIONSHIP_COLORS[key] }} />
                  <span className="text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detail Panel */}
          {selectedTopic && (
            <div className="lg:w-80 border-t lg:border-t-0 lg:border-r bg-card p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
              <div className="flex items-start justify-between mb-4">
                <h2 className="font-bold text-lg leading-tight">{selectedTopic.title}</h2>
                <Button size="icon" variant="ghost" className="shrink-0" onClick={() => setSelectedNode(null)}>
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
                className="w-full mb-4 gap-2"
                onClick={() => navigate(`/topic/${selectedTopic.id}`)}
              >
                <ExternalLink className="w-4 h-4" />
                قراءة النبوة
              </Button>

              {selectedConnections.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground">النبوات المرتبطة ({selectedConnections.length})</h3>
                  {selectedConnections.map(link => {
                    const otherId = link.source_topic_id === selectedNode ? link.target_topic_id : link.source_topic_id;
                    const otherTopic = publishedTopics.find(t => t.id === otherId);
                    if (!otherTopic) return null;

                    return (
                      <Card
                        key={link.id}
                        className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedNode(otherId)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5"
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
          )}
        </div>
      </div>
    </AppLayout>
  );
}
