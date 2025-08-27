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
  FolderOpen,
  Trash2,
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react';
import { useBulkOperations } from '@/hooks/useBulkOperations';

interface BulkNewsOperationsProps {
  selectedNews: string[];
  onOperationComplete: () => void;
  categories?: Array<{ id: string; name: string }>;
}

export function BulkNewsOperations({
  selectedNews,
  onOperationComplete,
  categories = [],
}: BulkNewsOperationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showProgress, setShowProgress] = useState(false);

  const { executeNewsBulkOperation, isLoading, progress } = useBulkOperations();

  const operations = [
    {
      value: 'categorize',
      label: 'Cambiar categoría',
      icon: FolderOpen,
      description: 'Asignar nueva categoría a las noticias',
    },
    {
      value: 'process',
      label: 'Procesar con IA',
      icon: Zap,
      description: 'Ejecutar procesamiento de IA en lote',
    },
    {
      value: 'approve',
      label: 'Aprobar noticias',
      icon: Eye,
      description: 'Aprobar y publicar noticias',
    },
    {
      value: 'reject',
      label: 'Rechazar noticias',
      icon: EyeOff,
      description: 'Marcar como rechazadas',
    },
    {
      value: 'delete',
      label: 'Eliminar noticias',
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

    setShowProgress(true);

    try {
      const data: any = {};

      if (selectedOperation === 'categorize') {
        data.categoryId = selectedCategory;
      } else if (selectedOperation === 'process') {
        data.processed = true;
      }

      const result = await executeNewsBulkOperation(
        selectedNews,
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
          disabled={selectedNews.length === 0}
          className="gap-2"
        >
          <Zap className="h-4 w-4" />
          Operaciones masivas ({selectedNews.length})
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Operaciones masivas - Noticias</DialogTitle>
        </DialogHeader>

        {showProgress ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Procesando {selectedNews.length} noticias...</span>
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
              <Badge variant="secondary">{selectedNews.length}</Badge>
              <span className="text-sm">noticias seleccionadas</span>
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

            {selectedOperation === 'process' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700">
                  <Zap className="h-4 w-4" />
                  <span className="font-medium">Procesamiento IA</span>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  Se ejecutará el procesamiento de IA para generar resúmenes,
                  detectar duplicados y categorizar automáticamente.
                </p>
              </div>
            )}

            {selectedOperation === 'delete' && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Advertencia</span>
                </div>
                <p className="text-sm text-destructive/80 mt-1">
                  Esta acción eliminará permanentemente las noticias
                  seleccionadas. No se pueden recuperar.
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
