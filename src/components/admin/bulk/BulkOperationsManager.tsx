'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BulkArticleOperations } from './BulkArticleOperations';
import { BulkNewsOperations } from './BulkNewsOperations';
import { BulkCategoryOperations } from './BulkCategoryOperations';
import { BulkOperationProgressTracker } from './BulkOperationProgress';
import { FileText, Newspaper, FolderOpen, Zap } from 'lucide-react';

interface BulkOperationsManagerProps {
  selectedArticles?: string[];
  selectedNews?: string[];
  selectedCategories?: string[];
  onOperationComplete?: () => void;
  categories?: Array<{ id: string; name: string; parent_id?: string }>;
  availableTags?: string[];
}

export function BulkOperationsManager({
  selectedArticles = [],
  selectedNews = [],
  selectedCategories = [],
  onOperationComplete,
  categories = [],
  availableTags = [],
}: BulkOperationsManagerProps) {
  const [activeJobs, setActiveJobs] = useState<string[]>([]);

  const handleOperationComplete = () => {
    onOperationComplete?.();
  };

  const handleJobComplete = (jobId: string) => {
    setActiveJobs(prev => prev.filter(id => id !== jobId));
  };

  const totalSelected =
    selectedArticles.length + selectedNews.length + selectedCategories.length;

  if (totalSelected === 0 && activeJobs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Operaciones masivas</h3>
          <p className="text-muted-foreground">
            Selecciona elementos para realizar operaciones masivas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Operaciones en progreso</h3>
          {activeJobs.map(jobId => (
            <BulkOperationProgressTracker
              key={jobId}
              jobId={jobId}
              onComplete={() => handleJobComplete(jobId)}
            />
          ))}
        </div>
      )}

      {/* Bulk Operations */}
      {totalSelected > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Operaciones masivas disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="articles" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger
                  value="articles"
                  disabled={selectedArticles.length === 0}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Artículos ({selectedArticles.length})
                </TabsTrigger>
                <TabsTrigger
                  value="news"
                  disabled={selectedNews.length === 0}
                  className="flex items-center gap-2"
                >
                  <Newspaper className="h-4 w-4" />
                  Noticias ({selectedNews.length})
                </TabsTrigger>
                <TabsTrigger
                  value="categories"
                  disabled={selectedCategories.length === 0}
                  className="flex items-center gap-2"
                >
                  <FolderOpen className="h-4 w-4" />
                  Categorías ({selectedCategories.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="articles" className="mt-4">
                {selectedArticles.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Operaciones disponibles para {selectedArticles.length}{' '}
                      artículos seleccionados:
                    </p>
                    <BulkArticleOperations
                      selectedArticles={selectedArticles}
                      onOperationComplete={handleOperationComplete}
                      categories={categories}
                      availableTags={availableTags}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="news" className="mt-4">
                {selectedNews.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Operaciones disponibles para {selectedNews.length}{' '}
                      noticias seleccionadas:
                    </p>
                    <BulkNewsOperations
                      selectedNews={selectedNews}
                      onOperationComplete={handleOperationComplete}
                      categories={categories}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="categories" className="mt-4">
                {selectedCategories.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Operaciones disponibles para {selectedCategories.length}{' '}
                      categorías seleccionadas:
                    </p>
                    <BulkCategoryOperations
                      selectedCategories={selectedCategories}
                      onOperationComplete={handleOperationComplete}
                      categories={categories}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
