'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  Shield,
  Users,
  UserCheck,
  UserX,
  Activity,
  History,
} from 'lucide-react';
import UserActivityMonitor from '@/components/admin/users/UserActivityMonitor';
import UserAuditTrail from '@/components/admin/users/UserAuditTrail';

interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: string;
  permissions: string[];
  last_sign_in_at?: string;
  created_at: string;
  is_active: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  is_system: boolean;
}

const AVAILABLE_PERMISSIONS = [
  'articles.create',
  'articles.edit',
  'articles.delete',
  'articles.publish',
  'articles.review',
  'news.create',
  'news.edit',
  'news.delete',
  'news.process',
  'categories.manage',
  'tags.manage',
  'users.manage',
  'settings.manage',
  'analytics.view',
  'backup.manage',
];

export default function UserPermissionManagement() {
  const t = useTranslations('admin.settings.users');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/roles'),
      ]);

      if (usersResponse.ok && rolesResponse.ok) {
        const [usersData, rolesData] = await Promise.all([
          usersResponse.json(),
          rolesResponse.json(),
        ]);
        setUsers(usersData);
        setRoles(rolesData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error(t('errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const saveUser = async (userData: Partial<User>) => {
    try {
      const url = selectedUser
        ? `/api/admin/users/${selectedUser.id}`
        : '/api/admin/users';

      const method = selectedUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        toast.success(
          t(selectedUser ? 'success.userUpdated' : 'success.userCreated')
        );
        setIsUserDialogOpen(false);
        setSelectedUser(null);
        loadData();
      } else {
        throw new Error('Failed to save user');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(t('errors.saveFailed'));
    }
  };

  const saveRole = async (roleData: Partial<Role>) => {
    try {
      const url = selectedRole
        ? `/api/admin/roles/${selectedRole.id}`
        : '/api/admin/roles';

      const method = selectedRole ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleData),
      });

      if (response.ok) {
        toast.success(
          t(selectedRole ? 'success.roleUpdated' : 'success.roleCreated')
        );
        setIsRoleDialogOpen(false);
        setSelectedRole(null);
        loadData();
      } else {
        throw new Error('Failed to save role');
      }
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error(t('errors.saveFailed'));
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (response.ok) {
        toast.success(
          t(isActive ? 'success.userActivated' : 'success.userDeactivated')
        );
        loadData();
      } else {
        throw new Error('Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error(t('errors.statusUpdateFailed'));
    }
  };

  const deleteRole = async (roleId: string) => {
    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(t('success.roleDeleted'));
        loadData();
      } else {
        throw new Error('Failed to delete role');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error(t('errors.deleteFailed'));
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="users" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="users" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          {t('tabs.users')}
        </TabsTrigger>
        <TabsTrigger value="roles" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          {t('tabs.roles')}
        </TabsTrigger>
        <TabsTrigger value="activity" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          {t('tabs.activity')}
        </TabsTrigger>
        <TabsTrigger value="audit" className="flex items-center gap-2">
          <History className="h-4 w-4" />
          {t('tabs.audit')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="users">
        {/* Users Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('users.title')}
            </CardTitle>
            <CardDescription>{t('users.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters and Search */}
            <div className="flex justify-between items-center gap-4">
              <div className="flex gap-4 flex-1">
                <Input
                  placeholder={t('users.searchPlaceholder')}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('users.allRoles')}</SelectItem>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Dialog
                open={isUserDialogOpen}
                onOpenChange={setIsUserDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button onClick={() => setSelectedUser(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('users.addUser')}
                  </Button>
                </DialogTrigger>
                <UserDialog
                  user={selectedUser}
                  roles={roles}
                  onSave={saveUser}
                  onClose={() => setIsUserDialogOpen(false)}
                />
              </Dialog>
            </div>

            {/* Users List */}
            <div className="space-y-3">
              {filteredUsers.map(user => (
                <div key={user.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>
                          {user.full_name
                            .split(' ')
                            .map(n => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{user.full_name}</h4>
                          <Badge
                            variant={user.is_active ? 'default' : 'secondary'}
                          >
                            {user.is_active
                              ? t('users.active')
                              : t('users.inactive')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{user.role}</Badge>
                          <span className="text-xs text-gray-400">
                            {user.permissions.length} {t('users.permissions')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toggleUserStatus(user.id, !user.is_active)
                        }
                      >
                        {user.is_active ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsUserDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="roles">
        {/* Roles Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('roles.title')}
            </CardTitle>
            <CardDescription>{t('roles.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-end">
              <Dialog
                open={isRoleDialogOpen}
                onOpenChange={setIsRoleDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button onClick={() => setSelectedRole(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('roles.addRole')}
                  </Button>
                </DialogTrigger>
                <RoleDialog
                  role={selectedRole}
                  onSave={saveRole}
                  onClose={() => setIsRoleDialogOpen(false)}
                />
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map(role => (
                <div key={role.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{role.name}</h4>
                        {role.is_system && (
                          <Badge variant="secondary">{t('roles.system')}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {role.description}
                      </p>
                      <div className="mt-2">
                        <p className="text-xs text-gray-400 mb-1">
                          {t('roles.permissions')} ({role.permissions.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.slice(0, 3).map(permission => (
                            <Badge
                              key={permission}
                              variant="outline"
                              className="text-xs"
                            >
                              {permission}
                            </Badge>
                          ))}
                          {role.permissions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{role.permissions.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRole(role);
                          setIsRoleDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!role.is_system && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRole(role.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="activity">
        <UserActivityMonitor />
      </TabsContent>

      <TabsContent value="audit">
        <UserAuditTrail showAllUsers={true} />
      </TabsContent>
    </Tabs>
  );
}

function UserDialog({
  user,
  roles,
  onSave,
  onClose,
}: {
  user: User | null;
  roles: Role[];
  onSave: (data: Partial<User>) => void;
  onClose: () => void;
}) {
  const t = useTranslations('admin.settings.users');
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    role: user?.role || '',
    is_active: user?.is_active ?? true,
  });

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          {user ? t('dialogs.editUser') : t('dialogs.addUser')}
        </DialogTitle>
        <DialogDescription>
          {user
            ? t('dialogs.editUserDescription')
            : t('dialogs.addUserDescription')}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">{t('fields.fullName')}</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={e =>
              setFormData({ ...formData, full_name: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t('fields.email')}</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">{t('fields.role')}</Label>
          <Select
            value={formData.role}
            onValueChange={value => setFormData({ ...formData, role: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map(role => (
                <SelectItem key={role.id} value={role.name}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          {t('actions.cancel')}
        </Button>
        <Button onClick={handleSave}>{t('actions.save')}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function RoleDialog({
  role,
  onSave,
  onClose,
}: {
  role: Role | null;
  onSave: (data: Partial<Role>) => void;
  onClose: () => void;
}) {
  const t = useTranslations('admin.settings.users');
  const [formData, setFormData] = useState({
    name: role?.name || '',
    description: role?.description || '',
    permissions: role?.permissions || [],
  });

  const togglePermission = (permission: string) => {
    const permissions = formData.permissions.includes(permission)
      ? formData.permissions.filter(p => p !== permission)
      : [...formData.permissions, permission];
    setFormData({ ...formData, permissions });
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {role ? t('dialogs.editRole') : t('dialogs.addRole')}
        </DialogTitle>
        <DialogDescription>
          {role
            ? t('dialogs.editRoleDescription')
            : t('dialogs.addRoleDescription')}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t('fields.roleName')}</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">{t('fields.description')}</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={e =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>{t('fields.permissions')}</Label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {AVAILABLE_PERMISSIONS.map(permission => (
              <div key={permission} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={permission}
                  checked={formData.permissions.includes(permission)}
                  onChange={() => togglePermission(permission)}
                  className="rounded"
                />
                <Label htmlFor={permission} className="text-sm">
                  {permission}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          {t('actions.cancel')}
        </Button>
        <Button onClick={handleSave}>{t('actions.save')}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
