# Stakeados Platform v4

Una plataforma moderna de contenido y comunidad para la Web3.

## 🚀 **Última actualización: Configuración optimizada para Vercel**

Esta versión incluye una configuración mínima de Next.js optimizada para deployment en Vercel.

## 🚀 Características

- **📚 Contenido Educativo**: Artículos y cursos sobre blockchain y Web3
- **🌐 Multilingüe**: Soporte para español e inglés
- **🎮 Gamificación**: Sistema de puntos, logros y certificados NFT
- **🤖 IA Integrada**: Procesamiento automático de contenido con OpenAI
- **📊 Analytics**: Métricas detalladas de engagement y rendimiento
- **🔔 Notificaciones**: Sistema de notificaciones en tiempo real
- **👥 Comunidad**: Propuestas de artículos y colaboración
- **🔐 Autenticación**: Sistema de autenticación seguro con Supabase

## 🛠️ Tecnologías

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Base de Datos**: PostgreSQL (Supabase)
- **Autenticación**: Supabase Auth
- **IA**: OpenAI GPT-4
- **Web3**: Viem, Wagmi, Base Network
- **Cache**: Redis
- **Email**: Resend
- **Deployment**: Vercel

## 📦 Instalación

### Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Supabase CLI
- Redis (opcional para desarrollo local)

### Configuración Local

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/stakeados-platform.git
cd stakeados-platform
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp config/environments/example.env .env.local
```

4. **Configurar Supabase**
```bash
npx supabase start
npx supabase gen types typescript --local > src/types/supabase.ts
```

5. **Ejecutar en desarrollo**
```bash
npm run dev
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linting
npm run type-check   # Verificación de tipos

# Supabase
npm run regenerate-types  # Regenerar tipos de Supabase
npx supabase start        # Iniciar Supabase local
npx supabase stop         # Detener Supabase local
```

## 🌍 Variables de Entorno

### Requeridas
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# OpenAI
OPENAI_API_KEY=tu_openai_key

# Email
RESEND_API_KEY=tu_resend_key
FROM_EMAIL=noreply@tudominio.com
```

### Opcionales
```env
# Redis
REDIS_URL=redis://localhost:6379

# Monitoreo
SENTRY_DSN=tu_sentry_dsn
NEXT_PUBLIC_HIGHLIGHT_PROJECT_ID=tu_highlight_id
```

## 📁 Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Rutas internacionalizadas
│   ├── api/               # API Routes
│   └── globals.css        # Estilos globales
├── components/            # Componentes React
│   ├── admin/            # Componentes de administración
│   ├── articles/         # Componentes de artículos
│   ├── auth/             # Componentes de autenticación
│   ├── news/             # Componentes de noticias
│   └── web3/             # Componentes Web3
├── lib/                  # Utilidades y servicios
│   ├── supabase/         # Cliente y funciones de Supabase
│   ├── web3/             # Funciones Web3
│   ├── ai/               # Servicios de IA
│   └── services/         # Servicios de negocio
├── hooks/                # Custom React hooks
├── types/                # Definiciones de tipos TypeScript
└── utils/                # Utilidades generales
```

## 🚀 Deployment

### Vercel (Recomendado)

1. **Conectar con GitHub**
   - Ve a [vercel.com](https://vercel.com)
   - Conecta tu repositorio de GitHub

2. **Configurar variables de entorno**
   - En el dashboard de Vercel, ve a Settings > Environment Variables
   - Agrega todas las variables de entorno requeridas

3. **Deploy automático**
   - Cada push a `main` desplegará automáticamente

### Otros Proveedores

- **Netlify**: Similar a Vercel
- **Railway**: Para aplicaciones full-stack
- **Docker**: Para contenedores

## 🔍 Estado de TypeScript

El proyecto tiene algunos errores de tipos que no afectan la funcionalidad:

- **Total de errores**: 407
- **Errores críticos**: ~170
- **Configuración**: Permisiva para desarrollo continuo

Ver `TYPE_CHECK_STATUS.md` para más detalles.

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

- **Documentación**: [docs.stakeados.com](https://docs.stakeados.com)
- **Issues**: [GitHub Issues](https://github.com/tu-usuario/stakeados-platform/issues)
- **Discord**: [Stakeados Community](https://discord.gg/stakeados)

## 🗺️ Roadmap

- [ ] Soporte para más idiomas
- [ ] App móvil nativa
- [ ] Integración con más redes blockchain
- [ ] Sistema de marketplace de NFTs
- [ ] IA avanzada para generación de contenido
- [ ] Sistema de reputación descentralizado

---

**Stakeados Platform** - Educando el futuro de Web3 🌟
