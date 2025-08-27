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
import { Input } from '@/components/ui/input';
import {
  AlertCircle,
  Loader2,
  FolderOpen,
  Trash2,
  Merge,
  Palette,
} from 'lucide-react';
import { useBulkOperations } from '@/hooks/useBulkOperations';

interface BulkCategoryOperationsProps {
  selectedCategories: string[];
  onOperationComplete: () => void;
  categories?: Array<{ id: string; name: string; parent_id?: string }>;
}

export function BulkCategoryOperations({
  selectedCategories,
  onOperationComplete,
  categories = [],
}: BulkCategoryOperationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<string>('');
  const [targetCategory, setTargetCategory] = useState<string>('');
  const [newColor, setNewColor] = useState<string>('#3b82f6');
  const [newParentId, setNewParentId] = useState<string>('');
  const [showProgress, setShowProgress] = useState(false);

  const { executeCategoryBulkOperation, isLoading, progress } =
    useBulkOperations();

  const operations = [
    {
      value: 'merge',
      label: 'Fusionar categorías',
      icon: Merge,
      description: 'Combinar categorías en una sola',
    },
    {
      value: 'update',
      label: 'Actualizar propiedades',
      icon: Palette,
      description: 'Cambiar color o categoría padre',
    },
    {
      value: 'delete',
      label: 'Eliminar categorías',
      icon: Trash2,
      description: 'Eliminar categorías vacías',
    },
  ];

  const availableTargetCategories = categories.filter(
    cat => !selectedCategories.includes(cat.id)
  );

  const availableParentCategories = categories.filter(
    cat => !selectedCategories.includes(cat.id) && !cat.parent_id
  );

  const handleExecuteOperation = async () => {
    if (!selectedOperation) {
      return;
    }

    if (selectedOperation === 'merge' && !targetCategory) {
      return;
    }

    setShowProgress(true);

    try {
      const data: any = {};

      if (selectedOperation === 'merge') {
        data.targetCategoryId = targetCategory;
      } else if (selectedOperation === 'update') {
        data.updates = {};
        if (newColor) data.updates.color = newColor;
        if (newParentId) data.updates.parent_id = newParentId;
        if (newParentId === 'none') data.updates.parent_id = null;
      }

      const result = await executeCategoryBulkOperation(
        selectedCategories,
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
      setTargetCategory('');
      setNewColor('#3b82f6');
      setNewParentId('');
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
          disabled={selectedCategories.length === 0}
          className="gap-2"
        >
          <FolderOpen className="h-4 w-4" />
          Operaciones masivas ({selectedCategories.length})
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Operaciones masivas - Categorías</DialogTitle>
        </DialogHeader>

        {showProgress ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Procesando {selectedCategories.length} categorías...</span>
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
              <Badge variant="secondary">{selectedCategories.length}</Badge>
              <span className="text-sm">categorías seleccionadas</span>
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

            {selectedOperation === 'merge' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoría destino</label>
                <Select
                  value={targetCategory}
                  onValueChange={setTargetCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona categoría destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTargetCategories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Todo el contenido de las categorías seleccionadas se moverá a
                  esta categoría.
                </p>
              </div>
            )}

            {selectedOperation === 'update' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Nuevo color (opcional)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={newColor}
                      onChange={e => setNewColor(e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="text"
                      value={newColor}
                      onChange={e => setNewColor(e.target.value)}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Nueva categoría padre (opcional)
                  </label>
                  <Select value={newParentId} onValueChange={setNewParentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin cambios" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin categoría padre</SelectItem>
                      {availableParentCategories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {selectedOperation === 'delete' && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">Advertencia</span>
                </div>
                <p className="text-sm text-destructive/80 mt-1">
                  Solo se eliminarán las categorías que no tengan contenido
                  asociado ni subcategorías.
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
