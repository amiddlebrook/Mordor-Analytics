
import React, { useEffect, useRef, useState } from 'react';

// --- Types & Interfaces ---

interface BackgroundProps {
    imageUrl: string | null;
    focusZone: 'center' | 'left' | 'right' | 'bottom' | 'none';
    onNavigate: (zone: string) => void;
    centerNode?: React.ReactNode;
    leftNode?: React.ReactNode;
    rightNode?: React.ReactNode;
    bottomNode?: React.ReactNode;
}

// --- Visual Effects Components ---

const AshFallCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        const particles: { x: number; y: number; speed: number; size: number; drift: number }[] = [];
        const particleCount = 150;

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                speed: 0.5 + Math.random() * 1.5,
                size: 1 + Math.random() * 2,
                drift: (Math.random() - 0.5) * 0.5
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = 'rgba(200, 200, 200, 0.4)';
            
            particles.forEach(p => {
                p.y += p.speed;
                p.x += p.drift;

                if (p.y > height) {
                    p.y = -10;
                    p.x = Math.random() * width;
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });

            requestAnimationFrame(animate);
        };

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', handleResize);
        animate();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 z-20 pointer-events-none mix-blend-screen opacity-50" />;
};

// --- UI Components ---

export const ObsidianPanel: React.FC<{ children: React.ReactNode; title: string; className?: string }> = ({ children, title, className = "" }) => {
    return (
        <div className={`
            relative bg-[#050000]/80 backdrop-blur-md 
            border border-red-900/30 shadow-[0_0_50px_rgba(0,0,0,0.9)]
            transition-all duration-700 ease-out transform
            ${className}
        `}>
             {/* Architectural Details */}
             <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-red-600/60" />
             <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-red-600/60" />
             <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-red-600/60" />
             <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-red-600/60" />
             
             {/* Header */}
             <div className="flex items-center justify-between bg-gradient-to-r from-black via-red-950/30 to-black px-4 py-2 border-b border-white/5">
                 <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                     <h2 className="font-cinzel text-red-100 tracking-[0.2em] text-sm md:text-base text-glow">{title}</h2>
                 </div>
                 <span className="font-mono text-[10px] text-red-500/40 tracking-widest">SECURE_CON_01</span>
             </div>

             {/* Content */}
             <div className="relative z-10 p-1 h-[calc(100%-40px)]">
                 {children}
             </div>
        </div>
    );
};

export const MagmaInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => {
    return (
        <input 
            {...props}
            className={`
                w-full bg-black/40 border border-red-900/30 text-red-50 placeholder-red-900/50
                font-mono focus:outline-none focus:border-red-500 focus:bg-black/80 focus:shadow-[0_0_15px_rgba(220,38,38,0.2)]
                transition-all duration-300 px-4 py-3 text-sm
                ${props.className}
            `}
        />
    );
};

export const RetreatButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button 
        onClick={onClick}
        className="
            absolute bottom-8 left-1/2 -translate-x-1/2 z-50 
            flex flex-col items-center gap-1
            group cursor-pointer
        "
    >
        <div className="
            flex items-center justify-center w-12 h-12 rounded-full
            bg-black/60 border border-red-500/30 text-red-500
            group-hover:bg-red-600 group-hover:text-black group-hover:border-red-500
            transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)]
        ">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
        </div>
        <span className="font-cinzel text-[10px] tracking-[0.2em] text-red-500/80 group-hover:text-red-400 transition-colors">ZOOM OUT</span>
    </button>
);

// --- The Map Marker Beacon ---

const Beacon: React.FC<{ 
    label: string; 
    x: string; 
    y: string; 
    color: string;
    onClick: () => void;
    delay?: string;
}> = ({ label, x, y, color, onClick, delay = '0s' }) => {
    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="absolute group z-30 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform duration-300"
            style={{ left: x, top: y }}
        >
            {/* The Glowing Orb */}
            <div className="relative flex items-center justify-center w-16 h-16">
                <div 
                    className="absolute inset-0 rounded-full opacity-40 blur-xl animate-pulse-slow"
                    style={{ backgroundColor: color, animationDelay: delay }} 
                />
                <div 
                    className="w-4 h-4 rounded-full border-2 bg-black rotate-45 group-hover:rotate-90 transition-transform duration-500"
                    style={{ borderColor: color }}
                />
                <div 
                    className="absolute inset-0 rounded-full border border-dashed opacity-30 animate-spin-slow"
                    style={{ borderColor: color, width: '100%', height: '100%' }}
                />
            </div>

            {/* Label */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 flex flex-col items-center gap-1">
                <div className="h-4 w-[1px] bg-gradient-to-b from-white/50 to-transparent" />
                <span className="font-cinzel text-xs tracking-[0.2em] font-bold text-white whitespace-nowrap drop-shadow-md bg-black/50 px-2 py-0.5 rounded">
                    {label}
                </span>
            </div>
        </button>
    );
};

// --- Main Layout Component ---

export const ParallaxImageBackground: React.FC<BackgroundProps> = ({ 
    imageUrl, focusZone, onNavigate, centerNode, leftNode, rightNode, bottomNode 
}) => {
    
    // CSS Transform Logic for "Camera Swoops"
    const getTransform = () => {
        switch (focusZone) {
            case 'center': // Barad-dûr
                return 'scale(2.5) translate(0%, 10%)'; 
            case 'right': // Mount Doom
                return 'scale(3) translate(-25%, 5%)'; 
            case 'left': // Marshes
                return 'scale(3) translate(25%, 5%)'; 
            case 'bottom': // Gate
                return 'scale(2.5) translate(0%, -20%)'; 
            default: // Overview
                return 'scale(1) translate(0%, 0%)'; 
        }
    };

    return (
        <div className="relative w-full h-full overflow-hidden bg-[#0a0505]">
            
            {/* 1. THE WORLD LAYER (Moves and Zooms) */}
            <div 
                className="absolute inset-0 w-full h-full transition-transform duration-1000 cubic-bezier(0.25, 0.46, 0.45, 0.94) will-change-transform"
                style={{ transform: getTransform() }}
            >
                {/* Background Image */}
                {imageUrl ? (
                    <img 
                        src={imageUrl} 
                        alt="Mordor Map" 
                        className="w-full h-full object-cover opacity-80"
                    />
                ) : (
                    // Fallback Gradient if image fails
                    <div className="w-full h-full bg-gradient-to-br from-gray-900 via-red-950 to-black" />
                )}

                {/* Heat Haze Overlay (SVG Filter applied via CSS class) */}
                <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-red-500/10 to-transparent heat-distortion opacity-30 pointer-events-none" />
                
                {/* Vignette */}
                <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/20 to-black/80 pointer-events-none" />

                {/* --- NAVIGATION BEACONS (Only visible when zoomed out) --- */}
                <div className={`absolute inset-0 transition-opacity duration-500 ${focusZone !== 'none' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    
                    {/* Center: The Tower */}
                    <Beacon label="BARAD-DÛR" x="50%" y="40%" color="#ff0000" onClick={() => onNavigate('center')} />
                    
                    {/* Right: Mount Doom */}
                    <Beacon label="MT. DOOM" x="80%" y="50%" color="#ff6600" onClick={() => onNavigate('right')} delay="1s" />

                    {/* Left: Marshes */}
                    <Beacon label="DEAD MARSHES" x="20%" y="55%" color="#4ade80" onClick={() => onNavigate('left')} delay="2s" />

                    {/* Bottom: Black Gate */}
                    <Beacon label="BLACK GATE" x="50%" y="80%" color="#9ca3af" onClick={() => onNavigate('bottom')} delay="0.5s" />

                </div>
            </div>

            {/* 2. ATMOSPHERE LAYER (Static on top) */}
            <AshFallCanvas />
            
            {/* 3. UI LAYERS (Fade in when focused) */}
            
            {/* Center UI */}
            <div className={`
                absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-2xl h-[70vh]
                transition-all duration-700 delay-300
                ${focusZone === 'center' ? 'opacity-100 scale-100 translate-y-[-50%]' : 'opacity-0 scale-95 translate-y-[-40%] pointer-events-none'}
            `}>
                {centerNode}
            </div>

            {/* Right UI (Doom) */}
            <div className={`
                absolute top-1/2 right-12 -translate-y-1/2 w-[450px] h-[60vh]
                transition-all duration-700 delay-300
                ${focusZone === 'right' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20 pointer-events-none'}
            `}>
                {rightNode}
            </div>

            {/* Left UI (Marshes) */}
            <div className={`
                absolute top-1/2 left-12 -translate-y-1/2 w-[450px] h-[60vh]
                transition-all duration-700 delay-300
                ${focusZone === 'left' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-20 pointer-events-none'}
            `}>
                {leftNode}
            </div>

            {/* Bottom UI (Gate) */}
            <div className={`
                absolute bottom-24 left-1/2 -translate-x-1/2 w-[600px] h-[400px]
                transition-all duration-700 delay-300
                ${focusZone === 'bottom' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none'}
            `}>
                {bottomNode}
            </div>

        </div>
    );
};
