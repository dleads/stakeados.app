#!/usr/bin/env node

/**
 * Script para verificar que las tareas marcadas como completadas realmente estén terminadas
 * Analiza el archivo tasks.md y valida cada tarea completada
 */

const fs = require('fs');
const path = require('path');

class TaskVerifier {
  constructor() {
    this.tasksFile = '.kiro/specs/active/project-organization-documentation/tasks.md';
    this.results = {
      verified: [],
      failed: [],
      warnings: []
    };
  }

  /**
   * Lee y parsea el archivo de tareas
   */
  readTasksFile() {
    try {
      const content = fs.readFileSync(this.tasksFile, 'utf8');
      return content;
    } catch (error) {
      console.error('Error leyendo archivo de tareas:', error.message);
      process.exit(1);
    }
  }

  /**
   * Extrae las tareas completadas del contenido
   */
  extractCompletedTasks(content) {
    const lines = content.split('\n');
    const completedTasks = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('- [x]')) {
        const taskMatch = line.match(/- \[x\]\s*(\d+)\.\s*(.+)/);
        if (taskMatch) {
          const taskNumber = taskMatch[1];
          const taskTitle = taskMatch[2];
          
          // Buscar detalles de la tarea en las siguientes líneas
          const details = [];
          let j = i + 1;
          while (j < lines.length && !lines[j].trim().startsWith('- [')) {
            if (lines[j].trim() && !lines[j].trim().startsWith('_Requirements:')) {
              details.push(lines[j].trim());
            }
            j++;
          }
          
          completedTasks.push({
            number: taskNumber,
            title: taskTitle,
            details: details,
            lineNumber: i + 1
          });
        }
      }
    }
    
    return completedTasks;
  }

  /**
   * Verifica si un archivo o directorio existe
   */
  checkFileExists(filePath) {
    try {
      return fs.existsSync(filePath);
    } catch (error) {
      return false;
    }
  }

  /**
   * Verifica si un directorio contiene archivos
   */
  checkDirectoryHasFiles(dirPath) {
    try {
      if (!fs.existsSync(dirPath)) return false;
      const files = fs.readdirSync(dirPath);
      return files.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verifica la tarea 1: Análisis y auditoría inicial del proyecto
   */
  verifyTask1() {
    const checks = [
      {
        name: 'Script de análisis de documentación',
        paths: ['scripts/project-analysis/analyze-project-documentation.js'],
        type: 'file'
      },
      {
        name: 'Reporte de estado actual',
        paths: ['project-analysis-report.json', 'project-analysis-report.md'],
        type: 'file'
      },
      {
        name: 'Catálogo de archivos',
        paths: ['file-catalog.json', 'file-catalog.md'],
        type: 'file'
      }
    ];

    return this.runChecks('Tarea 1: Análisis y auditoría inicial', checks);
  }

  /**
   * Verifica la tarea 2: Auditoría de especificaciones existentes
   */
  verifyTask2() {
    const checks = [
      {
        name: 'Script de auditoría de specs',
        paths: ['scripts/project-analysis/audit-specifications.js'],
        type: 'file'
      },
      {
        name: 'Reporte de auditoría de specs',
        paths: ['specification-audit-report.json', 'specification-audit-report.md'],
        type: 'file'
      },
      {
        name: 'Resumen de reorganización',
        paths: ['specification-reorganization-summary.md'],
        type: 'file'
      }
    ];

    return this.runChecks('Tarea 2: Auditoría de especificaciones', checks);
  }

  /**
   * Verifica la tarea 3: Catalogación de deuda técnica
   */
  verifyTask3() {
    const checks = [
      {
        name: 'Script de análisis de deuda técnica',
        paths: ['scripts/technical-debt-analysis.js'],
        type: 'file'
      },
      {
        name: 'Documentación de deuda técnica',
        paths: ['docs/technical-debt-database.md', 'docs/technical-debt/README.md'],
        type: 'file'
      },
      {
        name: 'Estado de TypeScript',
        paths: ['TYPE_CHECK_STATUS.md'],
        type: 'file'
      }
    ];

    return this.runChecks('Tarea 3: Catalogación de deuda técnica', checks);
  }

  /**
   * Verifica la tarea 4: Crear estructura de documentación centralizada
   */
  verifyTask4() {
    const checks = [
      {
        name: 'Directorio docs principal',
        paths: ['docs'],
        type: 'directory'
      },
      {
        name: 'Subdirectorios organizados',
        paths: ['docs/current-state', 'docs/development', 'docs/templates'],
        type: 'directory'
      },
      {
        name: 'Plantillas de documentación',
        paths: ['docs/templates'],
        type: 'directory_with_files'
      }
    ];

    return this.runChecks('Tarea 4: Estructura de documentación centralizada', checks);
  }

  /**
   * Verifica la tarea 5: Consolidar documentación duplicada
   */
  verifyTask5() {
    const checks = [
      {
        name: 'Script de consolidación',
        paths: ['scripts/consolidate-documentation.js'],
        type: 'file'
      },
      {
        name: 'Resumen de consolidación',
        paths: ['documentation-consolidation-summary.md'],
        type: 'file'
      },
      {
        name: 'Documentos principales consolidados',
        paths: ['docs/README.md', 'docs/GETTING_STARTED.md'],
        type: 'file'
      }
    ];

    return this.runChecks('Tarea 5: Consolidar documentación duplicada', checks);
  }

  /**
   * Verifica la tarea 6: Reorganizar especificaciones
   */
  verifyTask6() {
    const checks = [
      {
        name: 'Directorio de specs activas',
        paths: ['.kiro/specs/active'],
        type: 'directory'
      },
      {
        name: 'README de specs',
        paths: ['.kiro/specs/README.md'],
        type: 'file'
      },
      {
        name: 'Specs organizadas',
        paths: ['.kiro/specs/active'],
        type: 'directory_with_files'
      }
    ];

    return this.runChecks('Tarea 6: Reorganizar especificaciones', checks);
  }

  /**
   * Verifica la tarea 8: Generar documentación de estado actual
   */
  verifyTask8() {
    const checks = [
      {
        name: 'Funcionalidades implementadas',
        paths: ['docs/current-state/implemented-features.md'],
        type: 'file'
      },
      {
        name: 'Estado de Fase 1',
        paths: ['docs/current-state/phase-1-status.md'],
        type: 'file'
      },
      {
        name: 'Roadmap de Fase 2',
        paths: ['docs/current-state/phase-2-roadmap.md'],
        type: 'file'
      }
    ];

    return this.runChecks('Tarea 8: Documentación de estado actual', checks);
  }

  /**
   * Verifica la tarea 9: Crear guía de onboarding
   */
  verifyTask9() {
    const checks = [
      {
        name: 'Getting Started',
        paths: ['docs/GETTING_STARTED.md'],
        type: 'file'
      },
      {
        name: 'Setup Guide',
        paths: ['docs/development/setup-guide.md'],
        type: 'file'
      },
      {
        name: 'Contributing Guide',
        paths: ['docs/CONTRIBUTING.md'],
        type: 'file'
      }
    ];

    return this.runChecks('Tarea 9: Guía de onboarding', checks);
  }

  /**
   * Verifica la tarea 10: Documentar arquitectura
   */
  verifyTask10() {
    const checks = [
      {
        name: 'Documentación de arquitectura',
        paths: ['docs/ARCHITECTURE.md'],
        type: 'file'
      }
    ];

    return this.runChecks('Tarea 10: Documentación de arquitectura', checks);
  }

  /**
   * Verifica la tarea 11: Actualizar documentación de deployment
   */
  verifyTask11() {
    const checks = [
      {
        name: 'Documentación de deployment',
        paths: ['docs/DEPLOYMENT.md'],
        type: 'file'
      }
    ];

    return this.runChecks('Tarea 11: Documentación de deployment', checks);
  }

  /**
   * Verifica la tarea 12: Crear documentación de APIs
   */
  verifyTask12() {
    const checks = [
      {
        name: 'API Reference',
        paths: ['docs/API_REFERENCE.md'],
        type: 'file'
      },
      {
        name: 'Directorio de APIs',
        paths: ['docs/api'],
        type: 'directory_with_files'
      }
    ];

    return this.runChecks('Tarea 12: Documentación de APIs', checks);
  }

  /**
   * Verifica la tarea 13: Sistema de validación de documentación
   */
  verifyTask13() {
    const checks = [
      {
        name: 'Script de validación',
        paths: ['scripts/validate-documentation.js'],
        type: 'file'
      },
      {
        name: 'Configuración de validación',
        paths: ['docs-validation.config.js'],
        type: 'file'
      },
      {
        name: 'Scripts de pre-commit',
        paths: ['scripts/pre-commit-docs-validation.js'],
        type: 'file'
      }
    ];

    return this.runChecks('Tarea 13: Sistema de validación', checks);
  }

  /**
   * Verifica la tarea 14: Guía de troubleshooting
   */
  verifyTask14() {
    const checks = [
      {
        name: 'Guía de troubleshooting',
        paths: ['docs/TROUBLESHOOTING.md'],
        type: 'file'
      }
    ];

    return this.runChecks('Tarea 14: Guía de troubleshooting', checks);
  }

  /**
   * Ejecuta las verificaciones para un conjunto de checks
   */
  runChecks(taskName, checks) {
    const results = {
      passed: 0,
      failed: 0,
      details: []
    };

    for (const check of checks) {
      let passed = false;
      
      if (check.type === 'file') {
        passed = check.paths.some(p => this.checkFileExists(p));
      } else if (check.type === 'directory') {
        passed = check.paths.some(p => this.checkFileExists(p) && fs.statSync(p).isDirectory());
      } else if (check.type === 'directory_with_files') {
        passed = check.paths.some(p => this.checkDirectoryHasFiles(p));
      }

      if (passed) {
        results.passed++;
        results.details.push(`✅ ${check.name}`);
      } else {
        results.failed++;
        results.details.push(`❌ ${check.name} - Archivos esperados: ${check.paths.join(', ')}`);
      }
    }

    return {
      taskName,
      ...results
    };
  }

  /**
   * Verifica tareas pendientes para ver si algunas ya están completadas
   */
  verifyPendingTasks(content) {
    const lines = content.split('\n');
    const pendingTasks = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('- [ ]')) {
        const taskMatch = line.match(/- \[ \]\s*(\d+)\.\s*(.+)/);
        if (taskMatch) {
          const taskNumber = taskMatch[1];
          const taskTitle = taskMatch[2];
          
          // Verificar si esta tarea podría estar completada
          const isActuallyComplete = this.checkIfTaskIsComplete(taskNumber, taskTitle);
          
          if (isActuallyComplete.isComplete) {
            pendingTasks.push({
              number: taskNumber,
              title: taskTitle,
              shouldBeCompleted: true,
              reason: isActuallyComplete.reason,
              lineNumber: i + 1
            });
          }
        }
      }
    }
    
    return pendingTasks;
  }

  /**
   * Verifica si una tarea pendiente realmente está completada
   */
  checkIfTaskIsComplete(taskNumber, taskTitle) {
    const completionChecks = {
      '6': () => {
        // Reorganizar especificaciones
        const hasCompleted = this.checkFileExists('.kiro/specs/completed');
        const hasActive = this.checkFileExists('.kiro/specs/active');
        const hasReadme = this.checkFileExists('.kiro/specs/README.md');
        return {
          isComplete: hasActive && hasReadme,
          reason: hasActive && hasReadme ? 'Specs organizadas en active/ con README' : 'Falta organización completa'
        };
      },
      '8': () => {
        // Generar documentación de estado actual
        const hasImplemented = this.checkFileExists('docs/current-state/implemented-features.md');
        const hasPhase1 = this.checkFileExists('docs/current-state/phase-1-status.md');
        const hasPhase2 = this.checkFileExists('docs/current-state/phase-2-roadmap.md');
        return {
          isComplete: hasImplemented && hasPhase1 && hasPhase2,
          reason: hasImplemented && hasPhase1 && hasPhase2 ? 'Documentos de estado creados' : 'Faltan documentos de estado'
        };
      },
      '9': () => {
        // Crear guía de onboarding
        const hasGettingStarted = this.checkFileExists('docs/GETTING_STARTED.md');
        const hasSetupGuide = this.checkFileExists('docs/development/setup-guide.md');
        const hasContributing = this.checkFileExists('docs/CONTRIBUTING.md');
        return {
          isComplete: hasGettingStarted && hasSetupGuide && hasContributing,
          reason: hasGettingStarted && hasSetupGuide && hasContributing ? 'Guías de onboarding creadas' : 'Faltan guías de onboarding'
        };
      },
      '10': () => {
        // Documentar arquitectura
        const hasArchitecture = this.checkFileExists('docs/ARCHITECTURE.md');
        return {
          isComplete: hasArchitecture,
          reason: hasArchitecture ? 'Documentación de arquitectura creada' : 'Falta documentación de arquitectura'
        };
      },
      '11': () => {
        // Actualizar documentación de deployment
        const hasDeployment = this.checkFileExists('docs/DEPLOYMENT.md');
        return {
          isComplete: hasDeployment,
          reason: hasDeployment ? 'Documentación de deployment actualizada' : 'Falta documentación de deployment'
        };
      },
      '12': () => {
        // Crear documentación de APIs
        const hasApiRef = this.checkFileExists('docs/API_REFERENCE.md');
        const hasApiDir = this.checkDirectoryHasFiles('docs/api');
        return {
          isComplete: hasApiRef || hasApiDir,
          reason: hasApiRef || hasApiDir ? 'Documentación de API creada' : 'Falta documentación de API'
        };
      },
      '13': () => {
        // Sistema de validación de documentación
        const hasValidationScript = this.checkFileExists('scripts/validate-documentation.js');
        const hasValidationConfig = this.checkFileExists('docs-validation.config.js');
        return {
          isComplete: hasValidationScript && hasValidationConfig,
          reason: hasValidationScript && hasValidationConfig ? 'Sistema de validación implementado' : 'Falta sistema de validación'
        };
      },
      '14': () => {
        // Guía de troubleshooting
        const hasTroubleshooting = this.checkFileExists('docs/TROUBLESHOOTING.md');
        return {
          isComplete: hasTroubleshooting,
          reason: hasTroubleshooting ? 'Guía de troubleshooting creada' : 'Falta guía de troubleshooting'
        };
      }
    };

    if (completionChecks[taskNumber]) {
      return completionChecks[taskNumber]();
    }

    return { isComplete: false, reason: 'No hay verificador para esta tarea' };
  }

  /**
   * Ejecuta todas las verificaciones
   */
  async verifyAllCompletedTasks() {
    console.log('🔍 Verificando tareas marcadas como completadas...\n');

    const content = this.readTasksFile();
    const completedTasks = this.extractCompletedTasks(content);

    console.log(`📋 Encontradas ${completedTasks.length} tareas marcadas como completadas:\n`);

    // Mapeo de tareas a sus verificadores
    const taskVerifiers = {
      '1': () => this.verifyTask1(),
      '2': () => this.verifyTask2(),
      '3': () => this.verifyTask3(),
      '4': () => this.verifyTask4(),
      '5': () => this.verifyTask5(),
      '6': () => this.verifyTask6(),
      '8': () => this.verifyTask8(),
      '9': () => this.verifyTask9(),
      '10': () => this.verifyTask10(),
      '11': () => this.verifyTask11(),
      '12': () => this.verifyTask12(),
      '13': () => this.verifyTask13(),
      '14': () => this.verifyTask14()
    };

    let totalVerified = 0;
    let totalFailed = 0;

    for (const task of completedTasks) {
      console.log(`\n📝 Verificando Tarea ${task.number}: ${task.title}`);
      
      if (taskVerifiers[task.number]) {
        const result = taskVerifiers[task.number]();
        
        console.log(`   Verificaciones pasadas: ${result.passed}`);
        console.log(`   Verificaciones fallidas: ${result.failed}`);
        
        for (const detail of result.details) {
          console.log(`   ${detail}`);
        }

        if (result.failed === 0) {
          this.results.verified.push(task);
          totalVerified++;
        } else {
          this.results.failed.push({
            task,
            result
          });
          totalFailed++;
        }
      } else {
        console.log(`   ⚠️  No hay verificador implementado para esta tarea`);
        this.results.warnings.push(task);
      }
    }

    // Verificar tareas pendientes que podrían estar completadas
    console.log('\n🔍 Verificando tareas pendientes que podrían estar completadas...\n');
    const pendingButComplete = this.verifyPendingTasks(content);
    
    if (pendingButComplete.length > 0) {
      console.log('📋 Tareas pendientes que parecen estar completadas:');
      for (const task of pendingButComplete) {
        console.log(`✅ Tarea ${task.number}: ${task.title}`);
        console.log(`   Razón: ${task.reason}`);
      }
      this.results.shouldBeCompleted = pendingButComplete;
    } else {
      console.log('✅ No se encontraron tareas pendientes que estén completadas');
      this.results.shouldBeCompleted = [];
    }

    this.generateReport(totalVerified, totalFailed);
  }

  /**
   * Genera el reporte final
   */
  generateReport(totalVerified, totalFailed) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 REPORTE DE VERIFICACIÓN DE TAREAS');
    console.log('='.repeat(60));

    console.log(`\n✅ Tareas verificadas correctamente: ${totalVerified}`);
    console.log(`❌ Tareas con problemas: ${totalFailed}`);
    console.log(`⚠️  Tareas sin verificador: ${this.results.warnings.length}`);

    if (this.results.failed.length > 0) {
      console.log('\n🚨 TAREAS CON PROBLEMAS:');
      for (const failed of this.results.failed) {
        console.log(`\n- Tarea ${failed.task.number}: ${failed.task.title}`);
        console.log(`  Problemas encontrados:`);
        for (const detail of failed.result.details) {
          if (detail.startsWith('❌')) {
            console.log(`    ${detail}`);
          }
        }
      }
    }

    if (this.results.warnings.length > 0) {
      console.log('\n⚠️  TAREAS SIN VERIFICADOR:');
      for (const warning of this.results.warnings) {
        console.log(`- Tarea ${warning.number}: ${warning.title}`);
      }
    }

    // Generar archivo de reporte
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalCompleted: totalVerified + totalFailed + this.results.warnings.length,
        verified: totalVerified,
        failed: totalFailed,
        warnings: this.results.warnings.length
      },
      verified: this.results.verified,
      failed: this.results.failed,
      warnings: this.results.warnings
    };

    fs.writeFileSync('task-verification-report.json', JSON.stringify(reportData, null, 2));
    console.log('\n📄 Reporte guardado en: task-verification-report.json');

    // Sugerencias
    console.log('\n💡 RECOMENDACIONES:');
    if (totalFailed > 0) {
      console.log('- Revisar las tareas marcadas como completadas que tienen problemas');
      console.log('- Actualizar el estado de las tareas en tasks.md según los hallazgos');
      console.log('- Completar los archivos o funcionalidades faltantes');
    }
    if (this.results.warnings.length > 0) {
      console.log('- Implementar verificadores para las tareas restantes');
      console.log('- Revisar manualmente las tareas sin verificador');
    }
  }
}

// Ejecutar verificación
if (require.main === module) {
  const verifier = new TaskVerifier();
  verifier.verifyAllCompletedTasks().catch(console.error);
}

module.exports = TaskVerifier;