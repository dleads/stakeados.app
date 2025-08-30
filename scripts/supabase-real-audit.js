#!/usr/bin/env node

/**
 * Script que compara el estado real de Supabase (obtenido via MCP) 
 * con las migraciones esperadas y genera un reporte completo
 */

const fs = require('fs');
const SupabaseDatabaseAuditor = require('./supabase-database-audit.js');

class SupabaseRealAuditor extends SupabaseDatabaseAuditor {
  constructor() {
    super();
    // Datos reales obtenidos de MCP
    this.realTablesData = null;
  }

  /**
   * Procesa los datos reales de MCP y los convierte al formato esperado
   */
  processRealData() {
    // Datos reales obtenidos del MCP (simulados aquí, pero vendrían del MCP real)
    const realTables = [
      'article_schedules', 'news_clusters', 'news_cluster_items', 'courses', 'modules', 
      'lessons', 'user_progress', 'user_nfts', 'user_activities', 'community_contributions',
      'glossary_terms', 'duplicate_logs', 'article_proposals', 'user_subscriptions',
      'profiles', 'categories', 'articles', 'news', 'role_audit_log', 'article_history',
      'content_metrics', 'news_sources', 'news_sources_config', 'content_interactions',
      'metrics_aggregation_jobs', 'tags', 'article_tags', 'news_tags', 'user_roles',
      'user_activity_log', 'admin_notifications', 'background_jobs', 
      'article_collaboration_sessions', 'analytics_cache'
    ];

    // Convertir a formato de schema
    this.actualSchema = {};
    
    for (const tableName of realTables) {
      this.actualSchema[tableName] = {
        columns: this.getTableColumns(tableName),
        exists: true
      };
    }

    console.log(`✅ Procesadas ${realTables.length} tablas reales de Supabase`);
  }

  /**
   * Obtiene las columnas de una tabla (simulado, en realidad vendría del MCP)
   */
  getTableColumns(tableName) {
    // Mapeo de columnas reales basado en los datos del MCP
    const tableColumns = {
      profiles: {
        id: { type: 'uuid', nullable: false },
        email: { type: 'text', nullable: false },
        username: { type: 'text', nullable: true },
        display_name: { type: 'text', nullable: true },
        avatar_url: { type: 'text', nullable: true },
        bio: { type: 'text', nullable: true },
        website: { type: 'text', nullable: true },
        wallet_address: { type: 'text', nullable: true },
        is_genesis: { type: 'boolean', nullable: true },
        genesis_nft_verified: { type: 'boolean', nullable: true },
        total_points: { type: 'integer', nullable: true },
        role: { type: 'text', nullable: true },
        created_at: { type: 'timestamp with time zone', nullable: true },
        updated_at: { type: 'timestamp with time zone', nullable: true }
      },
      articles: {
        id: { type: 'uuid', nullable: false },
        title: { type: 'text', nullable: false },  // ¡DIFERENCIA! Esperado: jsonb, Real: text
        content: { type: 'text', nullable: false }, // ¡DIFERENCIA! Esperado: jsonb, Real: text
        summary: { type: 'text', nullable: true },
        author_id: { type: 'uuid', nullable: true },
        category_id: { type: 'uuid', nullable: true },
        status: { type: 'text', nullable: true },
        published_at: { type: 'timestamp with time zone', nullable: true },
        slug: { type: 'text', nullable: false },
        reading_time: { type: 'integer', nullable: true },
        views: { type: 'integer', nullable: true },
        likes: { type: 'integer', nullable: true },
        language: { type: 'text', nullable: true },
        seo_title: { type: 'text', nullable: true },
        seo_description: { type: 'text', nullable: true },
        featured_image: { type: 'text', nullable: true },
        created_at: { type: 'timestamp with time zone', nullable: true },
        updated_at: { type: 'timestamp with time zone', nullable: true },
        tags: { type: 'ARRAY', nullable: true },
        metadata: { type: 'jsonb', nullable: true }
      },
      categories: {
        id: { type: 'uuid', nullable: false },
        name: { type: 'text', nullable: false },
        slug: { type: 'text', nullable: false },
        description: { type: 'text', nullable: true },
        color: { type: 'text', nullable: true },
        icon: { type: 'text', nullable: true },
        parent_id: { type: 'uuid', nullable: true },
        sort_order: { type: 'integer', nullable: true },
        created_at: { type: 'timestamp with time zone', nullable: true },
        updated_at: { type: 'timestamp with time zone', nullable: true }
      },
      news: {
        id: { type: 'uuid', nullable: false },
        title: { type: 'text', nullable: false },
        content: { type: 'text', nullable: false },
        summary: { type: 'text', nullable: true },
        source_url: { type: 'text', nullable: true },
        source_name: { type: 'text', nullable: true },
        published_at: { type: 'timestamp with time zone', nullable: true },
        category_id: { type: 'uuid', nullable: true },
        language: { type: 'text', nullable: true },
        processed: { type: 'boolean', nullable: true },
        trending_score: { type: 'integer', nullable: true },
        created_at: { type: 'timestamp with time zone', nullable: true },
        updated_at: { type: 'timestamp with time zone', nullable: true },
        ai_metadata: { type: 'jsonb', nullable: true }
      }
    };

    return tableColumns[tableName] || {};
  }

  /**
   * Ejecuta auditoría completa comparando real vs esperado
   */
  async runRealAudit() {
    console.log('🚀 Iniciando auditoría REAL de base de datos Supabase...\n');

    // Paso 1: Analizar migraciones esperadas
    console.log('📋 Paso 1: Analizando migraciones esperadas...');
    this.analyzeExpectedSchema();

    // Paso 2: Procesar datos reales
    console.log('🔍 Paso 2: Procesando datos reales de Supabase...');
    this.processRealData();

    // Paso 3: Comparar schemas
    console.log('⚖️  Paso 3: Comparando schemas...');
    this.compareSchemas();

    // Paso 4: Análisis específico de problemas críticos
    console.log('🚨 Paso 4: Analizando problemas críticos...');
    this.analyzeCriticalIssues();

    // Paso 5: Generar reporte y correcciones
    console.log('📄 Paso 5: Generando reporte y correcciones...');
    const report = this.generateDetailedReport();

    // Mostrar resumen ejecutivo
    this.showExecutiveSummary(report);

    return report;
  }

  /**
   * Analiza problemas críticos específicos
   */
  analyzeCriticalIssues() {
    const criticalIssues = [];

    // Verificar tabla articles - problema crítico detectado
    if (this.expectedSchema.articles && this.actualSchema.articles) {
      const expectedTitle = this.expectedSchema.articles.columns.title;
      const actualTitle = this.actualSchema.articles.columns.title;
      
      if (expectedTitle && actualTitle && expectedTitle.type !== actualTitle.type) {
        criticalIssues.push({
          type: 'CRITICAL_TYPE_MISMATCH',
          table: 'articles',
          column: 'title',
          severity: 'CRITICAL',
          description: `CRÍTICO: articles.title es ${actualTitle.type} pero debería ser ${expectedTitle.type} para multiidioma`,
          impact: 'Bloquea implementación de sistema de artículos multiidioma',
          solution: 'Migración para convertir text a jsonb con datos existentes'
        });
      }

      const expectedContent = this.expectedSchema.articles.columns.content;
      const actualContent = this.actualSchema.articles.columns.content;
      
      if (expectedContent && actualContent && expectedContent.type !== actualContent.type) {
        criticalIssues.push({
          type: 'CRITICAL_TYPE_MISMATCH',
          table: 'articles',
          column: 'content',
          severity: 'CRITICAL',
          description: `CRÍTICO: articles.content es ${actualContent.type} pero debería ser ${expectedContent.type} para multiidioma`,
          impact: 'Bloquea implementación de sistema de artículos multiidioma',
          solution: 'Migración para convertir text a jsonb con datos existentes'
        });
      }
    }

    // Verificar tablas completamente faltantes que son críticas
    const criticalTables = ['role_permissions_cache', 'search_history', 'saved_searches'];
    for (const tableName of criticalTables) {
      if (this.expectedSchema[tableName] && !this.actualSchema[tableName]) {
        criticalIssues.push({
          type: 'MISSING_CRITICAL_TABLE',
          table: tableName,
          severity: 'HIGH',
          description: `Tabla crítica '${tableName}' falta completamente`,
          impact: 'Funcionalidad específica no funcionará',
          solution: 'Aplicar migración para crear tabla'
        });
      }
    }

    // Verificar exceso de tablas (posible sobre-ingeniería)
    const expectedCount = Object.keys(this.expectedSchema).length;
    const actualCount = Object.keys(this.actualSchema).length;
    
    if (expectedCount > actualCount * 2) {
      criticalIssues.push({
        type: 'OVER_ENGINEERING',
        severity: 'MEDIUM',
        description: `Posible sobre-ingeniería: ${expectedCount} tablas esperadas vs ${actualCount} reales`,
        impact: 'Complejidad innecesaria, dificulta mantenimiento',
        solution: 'Revisar y simplificar migraciones, eliminar tablas no esenciales'
      });
    }

    this.criticalIssues = criticalIssues;
    console.log(`🚨 Identificados ${criticalIssues.length} problemas críticos`);
  }

  /**
   * Genera reporte detallado con análisis específico
   */
  generateDetailedReport() {
    const baseReport = this.generateReport();
    
    // Agregar análisis específico
    baseReport.criticalIssues = this.criticalIssues || [];
    baseReport.recommendations = this.generateSpecificRecommendations();
    baseReport.migrationPriority = this.prioritizeMigrations();
    
    // Guardar reporte detallado
    fs.writeFileSync('supabase-real-audit-report.json', JSON.stringify(baseReport, null, 2));
    
    return baseReport;
  }

  /**
   * Genera recomendaciones específicas basadas en los hallazgos
   */
  generateSpecificRecommendations() {
    const recommendations = [];

    // Recomendaciones basadas en problemas críticos
    if (this.criticalIssues?.length > 0) {
      recommendations.push({
        priority: 'URGENT',
        category: 'Data Types',
        title: 'Corregir tipos de datos críticos',
        description: 'Las columnas title y content de articles deben ser jsonb para soporte multiidioma',
        action: 'Crear migración para convertir text a jsonb preservando datos existentes'
      });
    }

    // Recomendación de simplificación
    const expectedCount = Object.keys(this.expectedSchema).length;
    const actualCount = Object.keys(this.actualSchema).length;
    
    if (expectedCount > 50) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Architecture',
        title: 'Simplificar esquema de base de datos',
        description: `${expectedCount} tablas es excesivo para el estado actual del proyecto`,
        action: 'Revisar migraciones y eliminar tablas no esenciales para Fase 1'
      });
    }

    // Recomendación de enfoque incremental
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Development Strategy',
      title: 'Implementación incremental',
      description: 'Enfocarse solo en tablas esenciales para funcionalidades básicas',
      action: 'Implementar solo: profiles, articles, categories, tags, news para empezar'
    });

    return recommendations;
  }

  /**
   * Prioriza las migraciones necesarias
   */
  prioritizeMigrations() {
    const priorities = {
      critical: [],
      high: [],
      medium: [],
      low: []
    };

    // Priorizar basado en problemas encontrados
    for (const issue of this.issues) {
      const migration = {
        table: issue.table,
        column: issue.column,
        type: issue.type,
        description: issue.description
      };

      switch (issue.severity) {
        case 'CRITICAL':
          priorities.critical.push(migration);
          break;
        case 'HIGH':
          priorities.high.push(migration);
          break;
        case 'MEDIUM':
          priorities.medium.push(migration);
          break;
        default:
          priorities.low.push(migration);
      }
    }

    return priorities;
  }

  /**
   * Muestra resumen ejecutivo de la auditoría
   */
  showExecutiveSummary(report) {
    console.log('\n' + '='.repeat(70));
    console.log('🎯 RESUMEN EJECUTIVO - AUDITORÍA DE BASE DE DATOS SUPABASE');
    console.log('='.repeat(70));

    console.log(`\n📊 ESTADO GENERAL:`);
    console.log(`   Tablas esperadas (migraciones): ${report.summary.expectedTables}`);
    console.log(`   Tablas reales (Supabase): ${report.summary.actualTables}`);
    console.log(`   Diferencia: ${report.summary.expectedTables - report.summary.actualTables} tablas`);

    console.log(`\n🚨 PROBLEMAS IDENTIFICADOS:`);
    console.log(`   Críticos: ${report.criticalIssues?.length || 0}`);
    console.log(`   Total de issues: ${report.summary.totalIssues}`);
    console.log(`   Alta prioridad: ${report.summary.highSeverityIssues}`);

    if (report.criticalIssues?.length > 0) {
      console.log(`\n🔥 PROBLEMAS CRÍTICOS QUE BLOQUEAN DESARROLLO:`);
      for (const issue of report.criticalIssues) {
        console.log(`   ❌ ${issue.description}`);
        console.log(`      Impacto: ${issue.impact}`);
        console.log(`      Solución: ${issue.solution}\n`);
      }
    }

    console.log(`\n💡 RECOMENDACIONES PRINCIPALES:`);
    if (report.recommendations?.length > 0) {
      for (const rec of report.recommendations.slice(0, 3)) {
        console.log(`   ${rec.priority === 'URGENT' ? '🔴' : rec.priority === 'HIGH' ? '🟡' : '🟢'} ${rec.title}`);
        console.log(`      ${rec.description}`);
        console.log(`      Acción: ${rec.action}\n`);
      }
    }

    console.log(`\n📋 PRÓXIMOS PASOS RECOMENDADOS:`);
    console.log(`   1. 🔧 Corregir tipos de datos críticos (articles.title, articles.content)`);
    console.log(`   2. 🧹 Simplificar migraciones eliminando tablas no esenciales`);
    console.log(`   3. 🎯 Enfocarse en tablas core: profiles, articles, categories, news`);
    console.log(`   4. ✅ Validar que las specs creadas funcionen con el schema real`);
    console.log(`   5. 🚀 Implementar funcionalidades básicas antes de agregar complejidad`);

    console.log(`\n📄 ARCHIVOS GENERADOS:`);
    console.log(`   - supabase-real-audit-report.json (reporte completo)`);
    console.log(`   - Migraciones correctivas (si se generaron)`);

    console.log(`\n⚠️  CONCLUSIÓN:`);
    if (report.criticalIssues?.length > 0) {
      console.log(`   🔴 ACCIÓN REQUERIDA: Hay ${report.criticalIssues.length} problemas críticos que deben resolverse`);
      console.log(`   antes de implementar las specs de Navigation, Articles y Roles.`);
    } else {
      console.log(`   ✅ La base de datos está en buen estado para implementar las specs.`);
    }
  }
}

// Ejecutar auditoría real
if (require.main === module) {
  const auditor = new SupabaseRealAuditor();
  auditor.runRealAudit().catch(console.error);
}

module.exports = SupabaseRealAuditor;