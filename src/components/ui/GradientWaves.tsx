import { useEffect, useRef } from 'react';

// Settings adapted for Blue/Indigo theme
const settings = {
    amplitudeX: 150,
    amplitudeY: 30,
    lines: 28,
    hueStart: 210, // Blue
    saturationStart: 80,
    lightnessStart: 70, // Lighter blue at top
    hueEnd: 260, // Indigo/Purple
    saturationEnd: 90,
    lightnessEnd: 30, // Darker at bottom
    smoothness: 3,
    offsetX: 10,
    speed: 0.002, // Animation speed
};

export function GradientWaves() {
    const svgRef = useRef<SVGSVGElement>(null);
    const pathsRef = useRef<SVGPathElement[]>([]);
    const animationRef = useRef<number>();
    const timeRef = useRef(0);

    useEffect(() => {
        if (!svgRef.current) return;

        const svg = svgRef.current;
        let winW = window.innerWidth;
        let winH = window.innerHeight;
        const overflow = Math.abs(settings.lines * settings.offsetX);

        // Initialize Paths
        const init = () => {
            // Clear existing paths
            while (svg.lastChild) {
                svg.removeChild(svg.lastChild);
            }
            pathsRef.current = [];

            // Background Color (First Color) - As a rect to ensure full coverage
            const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bgRect.setAttribute('width', '100%');
            bgRect.setAttribute('height', '100%');
            bgRect.setAttribute('fill', `hsl(${settings.hueStart}, ${settings.saturationStart}%, ${settings.lightnessStart}%)`);
            svg.appendChild(bgRect);
            pathsRef.current.push(bgRect as any); // Treat as path for cleanup, though it won't animate

            // Generate Colors & Paths
            // Start from -5 to ensure waves cover the top edge even when oscillating down
            for (let i = -5; i < settings.lines + 1; i++) {
                const rootY = (winH / settings.lines) * i;

                // Linear Interpolation for HSL
                // Clamp t to 0 for negative indices so top waves match the background color
                const t = Math.max(0, i) / settings.lines;
                const h = settings.hueStart + t * (settings.hueEnd - settings.hueStart);
                const s = settings.saturationStart + t * (settings.saturationEnd - settings.saturationStart);
                const l = settings.lightnessStart + t * (settings.lightnessEnd - settings.lightnessStart);
                const color = `hsl(${h}, ${s}%, ${l}%)`;

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('fill', color);
                path.setAttribute('stroke', color);
                path.setAttribute('stroke-width', '1'); // Add slight stroke to prevent gaps between waves
                svg.appendChild(path);
                pathsRef.current.push(path);
            }
        };

        const update = () => {
            timeRef.current += settings.speed;

            pathsRef.current.forEach((path, i) => {
                // Skip the background rect (index 0)
                if (i === 0) return;

                // Adjust index for calculation since we added a rect at index 0
                const waveIndex = i - 1;
                // Since wave loop starts at -5, we need to map waveIndex back to that range
                const logicalIndex = -5 + waveIndex;

                const rootY = (winH / settings.lines) * logicalIndex;
                const offsetX = settings.offsetX * logicalIndex;
                const lineOffset = logicalIndex * 0.1; // Phase shift per line

                let points = [];
                let x = -overflow + offsetX;
                let y = 0;

                // Generate points for this frame
                points.push({ x, y: rootY }); // Start point

                let upSideDown = 0;

                while (x < winW + overflow) {
                    upSideDown = !upSideDown ? 1 : 0;
                    let value = upSideDown ? 1 : -1;

                    // Add wave motion based on time
                    const waveY = Math.sin(x * 0.003 + timeRef.current + lineOffset) * settings.amplitudeY;

                    x += settings.amplitudeX;
                    y = waveY * value + rootY;
                    points.push({ x, y });
                }

                points.push({ x: winW + overflow, y: rootY }); // End point

                // Build SVG Path 'd' attribute
                let d = `M -${overflow} ${winH + overflow}`; // Bot Left
                d += ` L ${points[0].x} ${points[0].y}`; // Start Line

                // Bezier Curves
                for (let j = 1; j < points.length - 1; j++) {
                    let prev = points[j - 1];
                    let curr = points[j];

                    let diffX = (curr.x - prev.x) / settings.smoothness;
                    let x1 = prev.x + diffX;
                    let x2 = curr.x - diffX;

                    d += ` C ${x1} ${prev.y}, ${x2} ${curr.y}, ${curr.x} ${curr.y}`;
                }

                // Close Path
                d += ` L ${winW + overflow} ${winH + overflow} Z`;

                path.setAttribute('d', d);
            });

            animationRef.current = requestAnimationFrame(update);
        };

        const handleResize = () => {
            winW = window.innerWidth;
            winH = window.innerHeight;
            init();
        };

        window.addEventListener('resize', handleResize);
        init();
        update();

        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, []);

    return (
        <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="none"
        />
    );
}
