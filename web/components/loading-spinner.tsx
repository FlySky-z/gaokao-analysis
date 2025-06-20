/**
 * 加载动画组件
 * 用于替换所有的文字加载提示，提供一致的视觉体验
 */

import * as React from "react"

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LoadingSpinner({ 
  size = 'sm', 
  text, 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-6 h-6'
  };

  return (
    <div className={`flex items-center space-x-2 text-xs text-muted-foreground ${className}`}>
      <div className={`${sizeClasses[size]} border-2 border-blue-500 border-t-transparent rounded-full animate-spin`}></div>
      {text && <span>{text}</span>}
    </div>
  );
}

export function LoadingCard({ 
  title = "加载中", 
  description,
  className = '' 
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <LoadingSpinner size="lg" />
      <h3 className="mt-4 text-lg font-medium text-muted-foreground">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground text-center">{description}</p>
      )}
    </div>
  );
}
