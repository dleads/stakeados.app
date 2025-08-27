'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/Progress';
import {
  AlertCircle,
  Loader2,
  Archive,
  Tag,
  FolderOpen,
  Trash2,
  Eye,
} from 'lucide-react';
import { useBulkOperations } from '@/hooks/useBulkOperations';

interface BulkArticleOperationsProps {
  selectedArticles: string[];
  onOperationComplete: () => void;
  categories?: Array<{ id: string; name: string }>;
  availableTags?: string[];
}

export function BulkArticleOperations({
  selectedArticles,
  onOperationComplete,
  categories = [],
  availableTags = [],
}: BulkArticleOperationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showProgress, setShowProgress] = useState(false);

  const { executeArticleBulkOperation, isLoading, progress } =
    useBulkOperations();

  const operations = [
    {
      value: 'publish',
      label: 'Publicar artículos',
      icon: Eye,
      description: 'Cambiar estado a publicado',
    },
    {
      value: 'archive',
      label: 'Archivar artículos',
      icon: Archive,
      description: 'Mover a archivo',
    },
    {
      value: 'categorize',
      label: 'Cambiar categoría',
      icon: FolderOpen,
      description: 'Asignar nueva categoría',
    },
    {
      value: 'tag',
      label: 'Agregar etiquetas',
      icon: Tag,
      description: 'Añadir etiquetas a los artículos',
    },
    {
      value: 'delete',
      label: 'Eliminar artículos',
      icon: Trash2,
      description: 'Eliminar permanentemente',
    },
  ];

  const handleExecuteOperation = async () => {
    if (!selectedOperation) {
      return;
    }

    if (selectedOperation === 'categorize' && !selectedCategory) {
      return;
    }

    if (selectedOperation === 'tag' && selectedTags.length === 0) {
      return;
    }

    setShowProgress(true);

    try {
      const data: any = {};

      if (selectedOperation === 'categorize') {
        data.categoryId = selectedCategory;
      } else if (selectedOperation === 'tag') {
        data.tags = selectedTags;
      }

      const result = await executeArticleBulkOperation(
        selectedArticles,
        selectedOperation as any,
        data
      );

      if (result.errors.length > 0) {
        console.error('Bulk operation errors:', result.errors);
      }

      onOperationComplete();
      setIsOpen(false);
      setShowProgress(false);

      // Reset form
      setSelectedOperation('');
      setSelectedCategory('');
      setSelectedTags([]);
    } catch (error) {
      setShowProgress(false);
    }
  };

  const selectedOperationData = operations.find(
    op => op.value === selectedOperation
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={selectedArticles.length === 0}
          className="gap-2"
        >
          <Tag className="h-4 w-4" />
          Operaciones masivas ({selectedArticles.length})
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Operaciones masivas</DialogTitle>
        </DialogHeader>

        {showProgress ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Procesando {selectedArticles.length} artículos...</span>
            </div>

            {progress && (
              <div className="space-y-2">
                <Progress value={progress.progress} />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {progress.processed_items} / {progress.total_items}
                  </span>
                  <span>{Math.round(progress.progress)}%</span>
                </div>

                {progress.error_count > 0 && (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{progress.error_count} errores</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Badge variant="secondary">{selectedArticles.length}</Badge>
              <span className="text-sm">artículos seleccionados</span>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Operación</label>
              <Select
                value={selectedOperation}
                onValueChange={setSelectedOperation}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una operación" />
                </SelectTrigger>
                <SelectContent>
                  {operations.map(operation => {
                    const Icon = operation.icon;
                    return (
                      <SelectItem key={operation.value} value={operation.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{operation.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {operation.description}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedOperation === 'categorize' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Nueva categoría</label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedOperation === 'tag' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Etiquetas a agregar
                </label>
                <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
                  {selectedTags.map(tag => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() =>
                        setSelectedTags(prev => prev.filter(t => t !== tag))
                      }
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
                <Select
                  value=""
                  onValueChange={tag => {
                    if (tag && !selectedTags.includes(tag)) {
                      setSelectedTags(prev => [...prev, tag]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Agregar etiqueta" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTags
                      .filter(tag => !selectedTags.includes(tag))
                      .map(tag => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedOperation === 'delete' && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Advertencia</span>
                </div>
                <p className="text-sm text-destructive/80 mt-1">
                  Esta acción moverá los artículos al archivo. No se pueden
                  recuperar fácilmente.
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleExecuteOperation}
                disabled={!selectedOperation || isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Procesando...
                  </>
                ) : (
                  <>
                    {selectedOperationData?.icon && (
                      <selectedOperationData.icon className="h-4 w-4 mr-2" />
                    )}
                    Ejecutar
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
