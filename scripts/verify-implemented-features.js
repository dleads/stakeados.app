#!/usr/bin/env node

/**
 * Script para verificar que las funcionalidades documentadas como implementadas
 * realmente estén en el código y funcionando
 */

const fs = require('fs');
const path = require('path');

class FeatureVerifier {
  constructor() {
    this.results = {
      implemented: [],
      notImplemented: [],
      partiallyImplemented: [],
      warnings: []
    };
  }

  /**
   * Verifica si un archivo existe
   */
  fileExists(filePath) {
    try {
      return fs.existsSync(filePath);
    } catch (error) {
      return false;
    }
  }

  /**
   * Busca texto en archivos
   */
  searchInFile(filePath, searchTerms) {
    try {
      if (!this.fileExists(filePath)) return false;
      const content = fs.readFileSync(filePath, 'utf8');
      return searchTerms.some(term => 
        content.toLowerCase().includes(term.toLowerCase())
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Busca en múltiples archivos
   */
  searchInFiles(filePaths, searchTerms) {
    return filePaths.some(filePath => this.searchInFile(filePath, searchTerms));
  }

  /**
   * Verifica funcionalidades de autenticación
   */
  verifyAuthFeatures() {
    const checks = [
      {
        name: 'Sistema de Login/Registro',
        files: ['src/app/login', 'src/app/register', 'src/lib/auth'],
        searchTerms: ['login', 'register', 'signIn', 'signUp'],
        type: 'directory_and_content'
      },
      {
        name: 'Middleware de Autenticación',
        files: ['src/middleware.ts', 'src/lib/supabase'],
        searchTerms: ['middleware', 'auth', 'session'],
        type: 'content'
      },
      {
        name: 'Protección de Rutas',
        files: ['src/app', 'src/middleware.ts'],
        searchTerms: ['protected', 'auth', 'redirect'],
        type: 'content'
      }
    ];

    return this.runFeatureChecks('Autenticación', checks);
  }

  /**
   * Verifica funcionalidades de artículos
   */
  verifyArticleFeatures() {
    const checks = [
      {
        name: 'Páginas de Artículos',
        files: ['src/app/articles', 'src/app/articulos'],
        searchTerms: [],
        type: 'directory'
      },
      {
        name: 'Componentes de Artículos',
        files: ['src/components', 'src/app'],
        searchTerms: ['article', 'articulo', 'post'],
        type: 'content'
      },
      {
        name: 'API de Artículos',
        files: ['src/app/api/articles', 'src/lib'],
        searchTerms: ['articles', 'articulos'],
        type: 'content'
      },
      {
        name: 'Base de Datos - Tabla Articles',
        files: ['supabase/migrations', 'src/lib/database'],
        searchTerms: ['articles', 'articulos', 'posts'],
        type: 'content'
      }
    ];

    return this.runFeatureChecks('Artículos', checks);
  }

  /**
   * Verifica funcionalidades de comunidad
   */
  verifyCommunityFeatures() {
    const checks = [
      {
        name: 'Páginas de Comunidad',
        files: ['src/app/community', 'src/app/comunidad'],
        searchTerms: [],
        type: 'directory'
      },
      {
        name: 'Sistema de Comentarios',
        files: ['src/components', 'src/app'],
        searchTerms: ['comment', 'comentario', 'reply'],
        type: 'content'
      },
      {
        name: 'Sistema de Likes/Reactions',
        files: ['src/components', 'src/lib'],
        searchTerms: ['like', 'reaction', 'vote'],
        type: 'content'
      },
      {
        name: 'Perfiles de Usuario',
        files: ['src/app/profile', 'src/app/user'],
        searchTerms: ['profile', 'perfil', 'usuario'],
        type: 'content'
      }
    ];

    return this.runFeatureChecks('Comunidad', checks);
  }

  /**
   * Verifica funcionalidades de noticias
   */
  verifyNewsFeatures() {
    const checks = [
      {
        name: 'Páginas de Noticias',
        files: ['src/app/news', 'src/app/noticias'],
        searchTerms: [],
        type: 'directory'
      },
      {
        name: 'Componentes de Noticias',
        files: ['src/components', 'src/app'],
        searchTerms: ['news', 'noticias', 'noticia'],
        type: 'content'
      },
      {
        name: 'API de Noticias',
        files: ['src/app/api/news', 'src/lib'],
        searchTerms: ['news', 'noticias'],
        type: 'content'
      }
    ];

    return this.runFeatureChecks('Noticias', checks);
  }

  /**
   * Verifica funcionalidades de roles y permisos
   */
  verifyRoleFeatures() {
    const checks = [
      {
        name: 'Sistema de Roles',
        files: ['src/lib/auth', 'src/lib/roles', 'supabase/migrations'],
        searchTerms: ['role', 'roles', 'permission', 'rbac'],
        type: 'content'
      },
      {
        name: 'Middleware de Permisos',
        files: ['src/middleware.ts', 'src/lib'],
        searchTerms: ['permission', 'authorize', 'role'],
        type: 'content'
      },
      {
        name: 'Componentes Protegidos por Rol',
        files: ['src/components', 'src/app'],
        searchTerms: ['hasRole', 'checkRole', 'permission'],
        type: 'content'
      }
    ];

    return this.runFeatureChecks('Roles y Permisos', checks);
  }

  /**
   * Verifica funcionalidades de Fase 2 (que NO deberían estar implementadas)
   */
  verifyPhase2Features() {
    const checks = [
      {
        name: 'Sistema de Cursos',
        files: ['src/app/courses', 'src/app/cursos'],
        searchTerms: ['course', 'curso', 'lesson'],
        type: 'directory_and_content'
      },
      {
        name: 'Sistema de NFTs',
        files: ['src/app/nft', 'src/lib/blockchain'],
        searchTerms: ['nft', 'blockchain', 'mint'],
        type: 'directory_and_content'
      },
      {
        name: 'Sistema de Certificados',
        files: ['src/app/certificates', 'src/app/certificados'],
        searchTerms: ['certificate', 'certificado', 'badge'],
        type: 'directory_and_content'
      },
      {
        name: 'Gamificación Avanzada',
        files: ['src/app/gamification', 'src/lib/gamification'],
        searchTerms: ['points', 'badges', 'leaderboard', 'achievement'],
        type: 'directory_and_content'
      }
    ];

    return this.runFeatureChecks('Fase 2 (No Implementada)', checks, true);
  }

  /**
   * Ejecuta verificaciones para un conjunto de funcionalidades
   */
  runFeatureChecks(featureName, checks, shouldNotExist = false) {
    const results = {
      featureName,
      implemented: 0,
      notImplemented: 0,
      details: []
    };

    for (const check of checks) {
      let isImplemented = false;

      if (check.type === 'directory') {
        isImplemented = check.files.some(file => this.fileExists(file));
      } else if (check.type === 'content') {
        isImplemented = this.searchInFiles(check.files, check.searchTerms);
      } else if (check.type === 'directory_and_content') {
        const hasDirectory = check.files.some(file => this.fileExists(file));
        const hasContent = this.searchInFiles(check.files, check.searchTerms);
        isImplemented = hasDirectory || hasContent;
      }

      // Para funcionalidades de Fase 2, invertimos la lógica
      if (shouldNotExist) {
        if (isImplemented) {
          results.implemented++;
          results.details.push(`⚠️  ${check.name} - ENCONTRADO (no debería estar en Fase 1)`);
        } else {
          results.notImplemented++;
          results.details.push(`✅ ${check.name} - Correctamente no implementado`);
        }
      } else {
        if (isImplemented) {
          results.implemented++;
          results.details.push(`✅ ${check.name} - Implementado`);
        } else {
          results.notImplemented++;
          results.details.push(`❌ ${check.name} - No encontrado`);
        }
      }
    }

    return results;
  }

  /**
   * Verifica el estado de la base de datos
   */
  async verifyDatabaseState() {
    console.log('\n🗄️  Verificando estado de la base de datos...');
    
    const migrationFiles = [];
    const migrationsDir = 'supabase/migrations';
    
    if (this.fileExists(migrationsDir)) {
      try {
        const files = fs.readdirSync(migrationsDir);
        migrationFiles.push(...files.filter(f => f.endsWith('.sql')));
      } catch (error) {
        console.log('   ❌ Error leyendo migraciones:', error.message);
      }
    }

    console.log(`   📁 Migraciones encontradas: ${migrationFiles.length}`);
    
    // Buscar tablas específicas en las migraciones
    const expectedTables = ['articles', 'users', 'comments', 'likes', 'roles'];
    const foundTables = [];

    for (const table of expectedTables) {
      const found = migrationFiles.some(file => {
        const filePath = path.join(migrationsDir, file);
        return this.searchInFile(filePath, [table, `create table ${table}`, `CREATE TABLE ${table}`]);
      });
      
      if (found) {
        foundTables.push(table);
        console.log(`   ✅ Tabla ${table} encontrada en migraciones`);
      } else {
        console.log(`   ❌ Tabla ${table} no encontrada`);
      }
    }

    return {
      totalMigrations: migrationFiles.length,
      foundTables: foundTables.length,
      expectedTables: expectedTables.length
    };
  }

  /**
   * Ejecuta todas las verificaciones
   */
  async verifyAllFeatures() {
    console.log('🔍 Verificando funcionalidades implementadas vs documentadas...\n');

    // Verificar funcionalidades principales
    const authResults = this.verifyAuthFeatures();
    const articleResults = this.verifyArticleFeatures();
    const communityResults = this.verifyCommunityFeatures();
    const newsResults = this.verifyNewsFeatures();
    const roleResults = this.verifyRoleFeatures();
    const phase2Results = this.verifyPhase2Features();

    // Mostrar resultados
    const allResults = [authResults, articleResults, communityResults, newsResults, roleResults, phase2Results];
    
    for (const result of allResults) {
      console.log(`\n📋 ${result.featureName}:`);
      console.log(`   Implementado: ${result.implemented}/${result.implemented + result.notImplemented}`);
      
      for (const detail of result.details) {
        console.log(`   ${detail}`);
      }
    }

    // Verificar base de datos
    const dbResults = await this.verifyDatabaseState();

    // Generar reporte final
    this.generateReport(allResults, dbResults);
  }

  /**
   * Genera el reporte final
   */
  generateReport(featureResults, dbResults) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 REPORTE DE FUNCIONALIDADES IMPLEMENTADAS');
    console.log('='.repeat(60));

    let totalImplemented = 0;
    let totalFeatures = 0;
    const problematicFeatures = [];

    for (const result of featureResults) {
      totalImplemented += result.implemented;
      totalFeatures += result.implemented + result.notImplemented;
      
      // Identificar funcionalidades problemáticas
      if (result.featureName !== 'Fase 2 (No Implementada)') {
        const implementationRate = result.implemented / (result.implemented + result.notImplemented);
        if (implementationRate < 0.5) {
          problematicFeatures.push({
            name: result.featureName,
            rate: Math.round(implementationRate * 100),
            implemented: result.implemented,
            total: result.implemented + result.notImplemented
          });
        }
      }
    }

    console.log(`\n📈 Resumen General:`);
    console.log(`   Total de verificaciones: ${totalFeatures}`);
    console.log(`   Funcionalidades implementadas: ${totalImplemented}`);
    console.log(`   Porcentaje de implementación: ${Math.round((totalImplemented / totalFeatures) * 100)}%`);

    console.log(`\n🗄️  Estado de Base de Datos:`);
    console.log(`   Migraciones: ${dbResults.totalMigrations}`);
    console.log(`   Tablas encontradas: ${dbResults.foundTables}/${dbResults.expectedTables}`);

    if (problematicFeatures.length > 0) {
      console.log(`\n⚠️  Funcionalidades con Baja Implementación:`);
      for (const feature of problematicFeatures) {
        console.log(`   - ${feature.name}: ${feature.implemented}/${feature.total} (${feature.rate}%)`);
      }
    }

    // Generar archivo de reporte
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFeatures,
        totalImplemented,
        implementationRate: Math.round((totalImplemented / totalFeatures) * 100),
        problematicFeatures: problematicFeatures.length
      },
      features: featureResults,
      database: dbResults,
      recommendations: this.generateRecommendations(problematicFeatures)
    };

    fs.writeFileSync('feature-implementation-report.json', JSON.stringify(reportData, null, 2));
    console.log('\n📄 Reporte guardado en: feature-implementation-report.json');

    // Mostrar recomendaciones
    console.log('\n💡 RECOMENDACIONES:');
    const recommendations = this.generateRecommendations(problematicFeatures);
    for (const rec of recommendations) {
      console.log(`- ${rec}`);
    }
  }

  /**
   * Genera recomendaciones basadas en los hallazgos
   */
  generateRecommendations(problematicFeatures) {
    const recommendations = [];

    if (problematicFeatures.length > 0) {
      recommendations.push('Revisar y actualizar la documentación para reflejar el estado real de implementación');
      recommendations.push('Priorizar la implementación de funcionalidades documentadas como completadas');
      
      for (const feature of problematicFeatures) {
        recommendations.push(`Completar la implementación de: ${feature.name} (${feature.rate}% actual)`);
      }
    }

    recommendations.push('Crear specs específicas para funcionalidades faltantes');
    recommendations.push('Actualizar docs/current-state/implemented-features.md con hallazgos');
    
    return recommendations;
  }
}

// Ejecutar verificación
if (require.main === module) {
  const verifier = new FeatureVerifier();
  verifier.verifyAllFeatures().catch(console.error);
}

module.exports = FeatureVerifier;