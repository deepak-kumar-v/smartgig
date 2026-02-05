'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingInputProps {
    value: number;
    onChange: (value: number) => void;
    max?: number;
    size?: 'sm' | 'md' | 'lg';
    readonly?: boolean;
    showValue?: boolean;
    allowHalf?: boolean;
    className?: string;
}

export function RatingInput({
    value,
    onChange,
    max = 5,
    size = 'md',
    readonly = false,
    showValue = true,
    allowHalf = false,
    className = '',
}: RatingInputProps) {
    const [hovered, setHovered] = useState<number | null>(null);

    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
    };

    const gapClasses = {
        sm: 'gap-0.5',
        md: 'gap-1',
        lg: 'gap-1.5',
    };

    const handleClick = (starValue: number, isHalf: boolean = false) => {
        if (readonly) return;
        const newValue = allowHalf && isHalf ? starValue - 0.5 : starValue;
        onChange(newValue);
    };

    const displayValue = hovered !== null ? hovered : value;

    return (
        <div className={`flex items-center ${gapClasses[size]} ${className}`}>
            {Array.from({ length: max }, (_, i) => i + 1).map((star) => {
                const isFilled = star <= displayValue;
                const isHalf = allowHalf && star - 0.5 === displayValue;

                return (
                    <button
                        key={star}
                        type="button"
                        disabled={readonly}
                        onClick={() => handleClick(star)}
                        onMouseEnter={() => !readonly && setHovered(star)}
                        onMouseLeave={() => setHovered(null)}
                        className={`relative transition-transform ${!readonly && 'hover:scale-110 cursor-pointer'} ${readonly && 'cursor-default'}`}
                    >
                        {/* Background star */}
                        <Star className={`${sizeClasses[size]} fill-zinc-700 text-zinc-600`} />

                        {/* Filled star overlay */}
                        {(isFilled || isHalf) && (
                            <Star
                                className={`${sizeClasses[size]} absolute inset-0 fill-amber-400 text-amber-400 transition-all`}
                                style={isHalf ? { clipPath: 'inset(0 50% 0 0)' } : {}}
                            />
                        )}
                    </button>
                );
            })}

            {showValue && (
                <span className="ml-2 text-white font-medium">
                    {displayValue.toFixed(allowHalf ? 1 : 0)}
                </span>
            )}
        </div>
    );
}

// Display-only rating (for showing existing ratings)
interface RatingDisplayProps {
    value: number;
    max?: number;
    size?: 'sm' | 'md' | 'lg';
    showValue?: boolean;
    reviewCount?: number;
    className?: string;
}

export function RatingDisplay({
    value,
    max = 5,
    size = 'md',
    showValue = true,
    reviewCount,
    className = '',
}: RatingDisplayProps) {
    const sizeClasses = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
    };

    const textClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
    };

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            {Array.from({ length: max }, (_, i) => i + 1).map((star) => {
                const fillPercentage = Math.min(100, Math.max(0, (value - star + 1) * 100));

                return (
                    <div key={star} className="relative">
                        <Star className={`${sizeClasses[size]} fill-zinc-700 text-zinc-600`} />
                        {fillPercentage > 0 && (
                            <Star
                                className={`${sizeClasses[size]} absolute inset-0 fill-amber-400 text-amber-400`}
                                style={{ clipPath: `inset(0 ${100 - fillPercentage}% 0 0)` }}
                            />
                        )}
                    </div>
                );
            })}

            {showValue && (
                <span className={`ml-1 text-white font-medium ${textClasses[size]}`}>
                    {value.toFixed(1)}
                </span>
            )}

            {reviewCount !== undefined && (
                <span className={`text-zinc-500 ${textClasses[size]}`}>
                    ({reviewCount.toLocaleString()})
                </span>
            )}
        </div>
    );
}
