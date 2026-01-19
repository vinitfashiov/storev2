import { useRef, useEffect, useState, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { useIsMobile } from '@/hooks/use-mobile';

interface SessionLocation {
  country: string;
  country_code: string;
  city: string;
  lat: number;
  lng: number;
  count: number;
}

interface LiveGlobeProps {
  locations: SessionLocation[];
  className?: string;
}

export function LiveGlobe({ locations, className = '' }: LiveGlobeProps) {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });
  const isMobile = useIsMobile();

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ 
          width: Math.max(width, 280), 
          height: Math.max(height, isMobile ? 280 : 400) 
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [isMobile]);

  // Auto-rotate the globe
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.5;
      globeRef.current.controls().enableZoom = true;
      globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 1000);
    }
  }, []);

  // Transform locations into points data
  const pointsData = useMemo(() => {
    return locations.map((loc) => ({
      lat: loc.lat,
      lng: loc.lng,
      size: Math.min(1.5, 0.3 + loc.count * 0.2),
      color: `rgba(99, 102, 241, ${Math.min(1, 0.4 + loc.count * 0.1)})`,
      label: `${loc.city}, ${loc.country}: ${loc.count} session${loc.count > 1 ? 's' : ''}`,
      count: loc.count,
    }));
  }, [locations]);

  // Heatmap (hex bins) – intensity by region
  const heatmapData = useMemo(() => {
    return locations
      .filter((l) => Number.isFinite(l.lat) && Number.isFinite(l.lng))
      .map((l) => ({ lat: l.lat, lng: l.lng, weight: l.count }));
  }, [locations]);

  const maxHeatWeight = useMemo(() => {
    return Math.max(1, ...heatmapData.map((d) => d.weight));
  }, [heatmapData]);

  // Arcs for visual effect (connecting active sessions to center)
  const arcsData = useMemo(() => {
    if (locations.length < 2) return [];
    return locations.slice(0, 10).map((loc, i) => ({
      startLat: loc.lat,
      startLng: loc.lng,
      endLat: locations[(i + 1) % locations.length]?.lat || 0,
      endLng: locations[(i + 1) % locations.length]?.lng || 0,
      color: ['rgba(99, 102, 241, 0.6)', 'rgba(168, 85, 247, 0.6)']
    }));
  }, [locations]);

  // Rings for pulse effect on active locations
  const ringsData = useMemo(() => {
    return locations.slice(0, 15).map((loc) => ({
      lat: loc.lat,
      lng: loc.lng,
      maxR: 2 + loc.count * 0.5,
      propagationSpeed: 1,
      repeatPeriod: 2000,
      color: 'rgba(99, 102, 241, 0.5)'
    }));
  }, [locations]);

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full ${className}`}
      style={{ minHeight: isMobile ? 280 : 400 }}
    >
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        // Heatmap overlay
        hexBinPointsData={heatmapData}
        hexBinPointWeight={(d: any) => d.weight}
        hexBinResolution={isMobile ? 3 : 4}
        hexBinMerge={true}
        hexAltitude={(d: any) => 0.05 + (d.sumWeight / maxHeatWeight) * 0.35}
        hexTopColor={(d: any) => `rgba(99, 102, 241, ${Math.min(0.9, 0.15 + (d.sumWeight / maxHeatWeight) * 0.85)})`}
        hexSideColor={(d: any) => `rgba(99, 102, 241, ${Math.min(0.6, 0.08 + (d.sumWeight / maxHeatWeight) * 0.5)})`}
        // Point markers
        pointsData={pointsData}
        pointAltitude={(d: any) => d.size * 0.01}
        pointColor={(d: any) => d.color}
        pointRadius={(d: any) => d.size * 0.4}
        pointLabel={(d: any) => d.label}
        arcsData={arcsData}
        arcColor="color"
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={1500}
        arcStroke={0.5}
        ringsData={ringsData}
        ringColor={() => (t: number) => `rgba(99, 102, 241, ${1 - t})`}
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"
        atmosphereColor="rgba(99, 102, 241, 0.3)"
        atmosphereAltitude={0.25}
        enablePointerInteraction={true}
      />
      
      {/* Location search overlay */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex items-center gap-2">
        <div className="bg-background/80 backdrop-blur-sm rounded-lg px-2 py-1 sm:px-3 sm:py-1.5 text-xs text-muted-foreground">
          {locations.length} location{locations.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
