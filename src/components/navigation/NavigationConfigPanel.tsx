'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useNavigationConfig, useNavigationStats } from '@/hooks/useNavigationConfig';
import { NavigationBadge } from './NavigationBadge';
import type { NavigationSection, UserMenuItem } from '@/types/navigation';
import type { BadgeVariant } from '@/lib/navigation/config-manager';
import { Download, Upload, RotateCcw, Settings, BarChart3, Eye, EyeOff } from 'lucide-react';

interface NavigationConfigPanelProps {
  className?: string;
}

export function NavigationConfigPanel({ className }: NavigationConfigPanelProps) {
  const { toast } = useToast();
  const {
    config,
    isLoading,
    toggleSection,
    toggleUserMenuItem,
    toggleAdminMenuItem,
    addSectionBadge,
    removeSectionBadge,
    addRoleRequirement,
    removeRoleRequirement,
    setAuthRequirement,
    resetToDefault,
    exportConfig,
    importConfig,
  } = useNavigationConfig();

  const stats = useNavigationStats();
  const [importText, setImportText] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [badgeText, setBadgeText] = useState('');
  const [badgeVariant, setBadgeVariant] = useState<BadgeVariant>('new');
  const [roleInput, setRoleInput] = useState('');

  // Handle section toggle
  const handleSectionToggle = async (sectionId: string, isImplemented: boolean) => {
    try {
      await toggleSection(sectionId, isImplemented);
      toast({
        title: 'Sección actualizada',
        description: `La sección ha sido ${isImplemented ? 'habilitada' : 'deshabilitada'} correctamente.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la sección.',
        variant: 'destructive',
      });
    }
  };

  // Handle user menu item toggle
  const handleUserMenuToggle = async (itemId: string, isImplemented: boolean) => {
    try {
      await toggleUserMenuItem(itemId, isImplemented);
      toast({
        title: 'Elemento actualizado',
        description: `El elemento del menú ha sido ${isImplemented ? 'habilitado' : 'deshabilitado'} correctamente.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el elemento del menú.',
        variant: 'destructive',
      });
    }
  };

  // Handle admin menu item toggle
  const handleAdminMenuToggle = async (itemId: string, isImplemented: boolean) => {
    try {
      await toggleAdminMenuItem(itemId, isImplemented);
      toast({
        title: 'Elemento actualizado',
        description: `El elemento del menú admin ha sido ${isImplemented ? 'habilitado' : 'deshabilitado'} correctamente.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el elemento del menú admin.',
        variant: 'destructive',
      });
    }
  };

  // Handle badge addition
  const handleAddBadge = async () => {
    if (!selectedSection || !badgeText.trim()) {
      toast({
        title: 'Error',
        description: 'Selecciona una sección e ingresa el texto del badge.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addSectionBadge(selectedSection, badgeText.trim(), badgeVariant);
      setBadgeText('');
      setSelectedSection('');
      toast({
        title: 'Badge agregado',
        description: 'El badge ha sido agregado correctamente.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo agregar el badge.',
        variant: 'destructive',
      });
    }
  };

  // Handle badge removal
  const handleRemoveBadge = async (sectionId: string) => {
    try {
      await removeSectionBadge(sectionId);
      toast({
        title: 'Badge eliminado',
        description: 'El badge ha sido eliminado correctamente.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el badge.',
        variant: 'destructive',
      });
    }
  };

  // Handle role requirement addition
  const handleAddRoles = async () => {
    if (!selectedSection || !roleInput.trim()) {
      toast({
        title: 'Error',
        description: 'Selecciona una sección e ingresa los roles.',
        variant: 'destructive',
      });
      return;
    }

    const roles = roleInput.split(',').map(role => role.trim()).filter(Boolean);
    if (roles.length === 0) {
      toast({
        title: 'Error',
        description: 'Ingresa al menos un rol válido.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addRoleRequirement(selectedSection, roles);
      setRoleInput('');
      setSelectedSection('');
      toast({
        title: 'Roles agregados',
        description: 'Los requisitos de rol han sido agregados correctamente.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron agregar los requisitos de rol.',
        variant: 'destructive',
      });
    }
  };

  // Handle configuration export
  const handleExport = () => {
    try {
      const configJson = exportConfig();
      const blob = new Blob([configJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'navigation-config.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Configuración exportada',
        description: 'La configuración ha sido descargada correctamente.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo exportar la configuración.',
        variant: 'destructive',
      });
    }
  };

  // Handle configuration import
  const handleImport = async () => {
    if (!importText.trim()) {
      toast({
        title: 'Error',
        description: 'Ingresa una configuración válida.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const success = await importConfig(importText);
      if (success) {
        setImportText('');
        toast({
          title: 'Configuración importada',
          description: 'La configuración ha sido importada correctamente.',
        });
      } else {
        toast({
          title: 'Error',
          description: 'La configuración no es válida.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo importar la configuración.',
        variant: 'destructive',
      });
    }
  };

  // Handle reset to default
  const handleReset = async () => {
    try {
      await resetToDefault();
      toast({
        title: 'Configuración restablecida',
        description: 'La configuración ha sido restablecida a los valores por defecto.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo restablecer la configuración.',
        variant: 'destructive',
      });
    }
  };

  // Render section item
  const renderSectionItem = (section: NavigationSection, level = 0) => (
    <div key={section.id} className={`space-y-2 ${level > 0 ? 'ml-6 border-l pl-4' : ''}`}>
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center space-x-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{section.label}</span>
              {section.badge && (
                <NavigationBadge text={section.badge.text} variant={section.badge.variant} />
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {section.href}
              {section.requiredAuth && <Badge variant="outline" className="ml-2">Auth Required</Badge>}
              {section.requiredRoles && section.requiredRoles.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  Roles: {section.requiredRoles.join(', ')}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {section.badge && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRemoveBadge(section.id)}
              disabled={isLoading}
            >
              Remove Badge
            </Button>
          )}
          <Switch
            checked={section.isImplemented}
            onCheckedChange={(checked) => handleSectionToggle(section.id, checked)}
            disabled={isLoading}
          />
          {section.isImplemented ? (
            <Eye className="h-4 w-4 text-green-600" />
          ) : (
            <EyeOff className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>
      {section.children && section.children.map(child => renderSectionItem(child, level + 1))}
    </div>
  );

  // Render user menu item
  const renderUserMenuItem = (item: UserMenuItem) => (
    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
      <div>
        <div className="font-medium">{item.label}</div>
        <div className="text-sm text-muted-foreground">
          {item.href}
          {item.action && <Badge variant="outline" className="ml-2">Action: {item.action}</Badge>}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          checked={item.isImplemented}
          onCheckedChange={(checked) => handleUserMenuToggle(item.id, checked)}
          disabled={isLoading}
        />
        {item.isImplemented ? (
          <Eye className="h-4 w-4 text-green-600" />
        ) : (
          <EyeOff className="h-4 w-4 text-gray-400" />
        )}
      </div>
    </div>
  );

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configuración de Navegación</span>
          </CardTitle>
          <CardDescription>
            Gestiona la configuración de navegación, habilita/deshabilita secciones y administra badges.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sections" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="sections">Secciones</TabsTrigger>
              <TabsTrigger value="user-menu">Menú Usuario</TabsTrigger>
              <TabsTrigger value="admin-menu">Menú Admin</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
              <TabsTrigger value="stats">Estadísticas</TabsTrigger>
            </TabsList>

            <TabsContent value="sections" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Secciones de Navegación</h3>
                {config.sections.map(section => renderSectionItem(section))}
              </div>
            </TabsContent>

            <TabsContent value="user-menu" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Elementos del Menú de Usuario</h3>
                {config.userMenuItems.map(renderUserMenuItem)}
              </div>
            </TabsContent>

            <TabsContent value="admin-menu" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Elementos del Menú de Administrador</h3>
                {config.adminMenuItems.map(renderUserMenuItem)}
              </div>
            </TabsContent>

            <TabsContent value="badges" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Gestión de Badges</h3>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Agregar Badge</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="section-select">Sección</Label>
                        <Select value={selectedSection} onValueChange={setSelectedSection}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una sección" />
                          </SelectTrigger>
                          <SelectContent>
                            {config.sections.map(section => (
                              <SelectItem key={section.id} value={section.id}>
                                {section.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="badge-variant">Tipo de Badge</Label>
                        <Select value={badgeVariant} onValueChange={(value: BadgeVariant) => setBadgeVariant(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">Nuevo</SelectItem>
                            <SelectItem value="beta">Beta</SelectItem>
                            <SelectItem value="coming-soon">Próximamente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="badge-text">Texto del Badge</Label>
                      <Input
                        id="badge-text"
                        value={badgeText}
                        onChange={(e) => setBadgeText(e.target.value)}
                        placeholder="Ej: Nuevo, Beta, Próximamente"
                      />
                    </div>
                    <Button onClick={handleAddBadge} disabled={isLoading}>
                      Agregar Badge
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Agregar Requisitos de Rol</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="section-select-roles">Sección</Label>
                      <Select value={selectedSection} onValueChange={setSelectedSection}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una sección" />
                        </SelectTrigger>
                        <SelectContent>
                          {config.sections.map(section => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="roles-input">Roles (separados por comas)</Label>
                      <Input
                        id="roles-input"
                        value={roleInput}
                        onChange={(e) => setRoleInput(e.target.value)}
                        placeholder="admin, instructor, student"
                      />
                    </div>
                    <Button onClick={handleAddRoles} disabled={isLoading}>
                      Agregar Roles
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Estadísticas de Configuración</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Secciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total:</span>
                          <span>{stats.sections.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Implementadas:</span>
                          <span className="text-green-600">{stats.sections.implemented}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pendientes:</span>
                          <span className="text-orange-600">{stats.sections.unimplemented}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Con Badges:</span>
                          <span className="text-blue-600">{stats.sections.withBadges}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Progreso:</span>
                          <span>{stats.sections.implementationRate.toFixed(1)}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Menú Usuario</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total:</span>
                          <span>{stats.userMenuItems.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Implementados:</span>
                          <span className="text-green-600">{stats.userMenuItems.implemented}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pendientes:</span>
                          <span className="text-orange-600">{stats.userMenuItems.unimplemented}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Progreso:</span>
                          <span>{stats.userMenuItems.implementationRate.toFixed(1)}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Menú Admin</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total:</span>
                          <span>{stats.adminMenuItems.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Implementados:</span>
                          <span className="text-green-600">{stats.adminMenuItems.implemented}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pendientes:</span>
                          <span className="text-orange-600">{stats.adminMenuItems.unimplemented}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Progreso:</span>
                          <span>{stats.adminMenuItems.implementationRate.toFixed(1)}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Acciones de Configuración</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={handleExport} variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar Configuración
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline">
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restablecer
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Restablecer configuración?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción restablecerá toda la configuración de navegación a los valores por defecto. 
                              Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleReset}>
                              Restablecer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="import-config">Importar Configuración</Label>
                      <Textarea
                        id="import-config"
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        placeholder="Pega aquí la configuración JSON..."
                        rows={4}
                      />
                      <Button onClick={handleImport} disabled={isLoading || !importText.trim()}>
                        <Upload className="h-4 w-4 mr-2" />
                        Importar Configuración
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}