import React from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';

// Skeleton component for Kanban board loading state
export function KanbanBoardSkeleton({ columnCount = 4 }: { columnCount?: number }) {
  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-full overflow-hidden">
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 md:p-6">
        <div className="flex gap-4 h-full min-w-max">
          {Array.from({ length: columnCount }).map((_, colIndex) => (
            <div key={colIndex} className="flex flex-col w-80 flex-shrink-0">
              {/* Column Header Skeleton */}
              <div className="flex items-center gap-2 mb-4 animate-pulse">
                <div className="w-3 h-3 rounded-full bg-gray-300" />
                <div className="h-5 bg-gray-300 rounded w-24" />
                <Badge variant="secondary" className="ml-auto bg-gray-200">
                  <div className="w-4 h-4" />
                </Badge>
              </div>

              {/* Column Content Skeleton */}
              <div className="flex-1 space-y-3 overflow-y-auto p-3 rounded-lg">
                {Array.from({ length: Math.floor(Math.random() * 3) + 2 }).map((_, cardIndex) => (
                  <Card key={cardIndex} className="animate-pulse">
                    <CardHeader className="pb-3">
                      <div className="h-5 bg-gray-300 rounded w-3/4" />
                    </CardHeader>
                    <CardContent className="pb-3 space-y-3">
                      {/* Badges skeleton */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="h-6 bg-gray-200 rounded-full w-20" />
                        <div className="h-6 bg-gray-200 rounded-full w-16" />
                      </div>
                      
                      {/* Footer skeleton */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="h-4 bg-gray-200 rounded w-16" />
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-gray-200" />
                          <div className="h-3 bg-gray-200 rounded w-12" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
