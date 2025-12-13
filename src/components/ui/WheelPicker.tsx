import React, { useRef, useEffect, useState } from 'react';

interface WheelPickerProps {
    min: number;
    max: number;
    value: number;
    onChange: (value: number) => void;
    label?: string;
}

const ITEM_HEIGHT = 48; // px
const VISIBLE_ITEMS = 5;

export const WheelPicker: React.FC<WheelPickerProps> = ({ min, max, value, onChange, label }) => {
    const range = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Initial scroll position
    useEffect(() => {
        if (containerRef.current) {
            const index = range.indexOf(value);
            if (index !== -1) {
                containerRef.current.scrollTop = index * ITEM_HEIGHT;
            }
        }
    }, [value, range]); // Added dependencies for correctness

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        if (isDragging) return;
        const scrollTop = e.currentTarget.scrollTop;
        const index = Math.round(scrollTop / ITEM_HEIGHT);
        const newValue = range[Math.min(Math.max(index, 0), range.length - 1)];
        if (newValue !== value) {
            onChange(newValue);
        }
    };

    return (
        <div className="relative h-60 w-32 flex flex-col items-center justify-center select-none">
            {/* Overlay Gradient/Highlight */}
            <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-white via-transparent to-white opacity-90" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-12 border-y border-primary-200 bg-primary-50/30 backdrop-blur-sm rounded-lg z-0 pointer-events-none" />

            {/* Label */}
            {label && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-sm font-medium text-primary-700 pointer-events-none">
                    {label}
                </div>
            )}

            {/* Scroll Container */}
            <div
                ref={containerRef}
                className="w-full h-full overflow-y-auto scroll-smooth snap-y snap-mandatory no-scrollbar py-[100px]"
                onScroll={handleScroll}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {range.map((num) => (
                    <WheelItem
                        key={num}
                        value={num}
                        selectedValue={value}
                    />
                ))}
            </div>
        </div>
    );
};

const WheelItem: React.FC<{ value: number; selectedValue: number }> = ({ value, selectedValue }) => {
    // We can add intricate animations here if we want to hook into parent scroll position,
    // but for performance and simplicity with CSS snap, we'll stick to CSS transforms based on selection state roughly.
    // However, to make it "Super Aesthetic", let's use a bit of logic to fade/scale neighbors.

    // Actually, since we don't have per-item scroll hooks easily without heavy overhead,
    // let's rely on the `selectedValue` prop to style the "active" one clearly.

    const isSelected = value === selectedValue;
    const distance = Math.abs(value - selectedValue);

    return (
        <div className={`h-[48px] w-full flex items-center justify-center snap-center transition-all duration-200 ${isSelected
            ? 'text-3xl font-bold text-primary-600 scale-110'
            : distance === 1
                ? 'text-xl font-medium text-gray-400 scale-95'
                : 'text-sm text-gray-300 scale-90'
            }`}>
            {value}
        </div>
    );
};
