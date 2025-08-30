#!/usr/bin/env node

/**
 * Script para auditar el estado real de la base de datos Supabase
 * y compararlo con lo que esperamos según las migraciones
 */

const fs = require('fs');
const path = require('path');

class SupabaseDatabaseAuditor {
  constructor() {
    this.expectedSchema = {};
    this.actualSchema = {};
    this.issues = [];
    this.corrections = [];
  }

  /**
   * Analiza las migraciones para entender qué debería existir
   */
  analyzeExpectedSchema() {
    console.log('📋 Analizando migraciones esperadas...');
    
    const migrationsDir = 'supabase/migrations';
    if (!fs.existsSync(migrationsDir)) {
      console.log('❌ No se encontró directorio de migraciones');
      return;
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`📁 Encontradas ${migrationFiles.length} migraciones`);

    // Analizar cada migración para extraer schema esperado
    for (const file of migrationFiles) {
      this.parseMigrationFile(path.join(migrationsDir, file));
    }

    console.log('✅ Análisis de migraciones completado');
    return this.expectedSchema;
  }

  /**
   * Parsea un archivo de migración para extraer definiciones de tablas
   */
  parseMigrationFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileName = path.basename(filePath);
      
      // Buscar CREATE TABLE statements
      const createTableRegex = /CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(\w+)\s*\(([\s\S]*?)\);/gi;
      let match;

      while ((match = createTableRegex.exec(content)) !== null) {
        const tableName = match[1];
        const tableDefinition = match[2];
        
        if (!this.expectedSchema[tableName]) {
          this.expectedSchema[tableName] = {
            columns: {},
            constraints: [],
            indexes: [],
            policies: [],
            source: fileName
          };
        }

        this.parseTableDefinition(tableName, tableDefinition);
      }

      // Buscar ALTER TABLE statements
      const alterTableRegex = /ALTER TABLE\s+(\w+)\s+(ADD COLUMN|DROP COLUMN|ALTER COLUMN)\s+([\s\S]*?);/gi;
      while ((match = alterTableRegex.exec(content)) !== null) {
        const tableName = match[1];
        const operation = match[2];
        const definition = match[3];
        
        this.parseAlterTable(tableName, operation, definition);
      }

      // Buscar CREATE INDEX statements
      const createIndexRegex = /CREATE(?:\s+UNIQUE)?\s+INDEX(?:\s+IF NOT EXISTS)?\s+(\w+)\s+ON\s+(\w+)\s*\(([\s\S]*?)\);/gi;
      while ((match = createIndexRegex.exec(content)) !== null) {
        const indexName = match[1];
        const tableName = match[2];
        const columns = match[3];
        
        if (this.expectedSchema[tableName]) {
          this.expectedSchema[tableName].indexes.push({
            name: indexName,
            columns: columns.trim(),
            source: fileName
          });
        }
      }

    } catch (error) {
      console.log(`⚠️  Error parseando ${filePath}: ${error.message}`);
    }
  }

  /**
   * Parsea la definición de una tabla
   */
  parseTableDefinition(tableName, definition) {
    const lines = definition.split(',').map(line => line.trim());
    
    for (const line of lines) {
      if (line.includes('CONSTRAINT') || line.includes('PRIMARY KEY') || line.includes('FOREIGN KEY')) {
        this.expectedSchema[tableName].constraints.push(line);
        continue;
      }

      // Parsear columnas
      const columnMatch = line.match(/^(\w+)\s+(.+)$/);
      if (columnMatch) {
        const columnName = columnMatch[1];
        const columnDefinition = columnMatch[2];
        
        this.expectedSchema[tableName].columns[columnName] = {
          definition: columnDefinition,
          type: this.extractColumnType(columnDefinition),
          nullable: !columnDefinition.includes('NOT NULL'),
          defaultValue: this.extractDefault(columnDefinition)
        };
      }
    }
  }

  /**
   * Extrae el tipo de columna de la definición
   */
  extractColumnType(definition) {
    const typeMatch = definition.match(/^(\w+(?:\(\d+(?:,\d+)?\))?)/);
    return typeMatch ? typeMatch[1] : 'unknown';
  }

  /**
   * Extrae el valor por defecto
   */
  extractDefault(definition) {
    const defaultMatch = definition.match(/DEFAULT\s+(.+?)(?:\s|$)/i);
    return defaultMatch ? defaultMatch[1] : null;
  }

  /**
   * Parsea ALTER TABLE statements
   */
  parseAlterTable(tableName, operation, definition) {
    if (!this.expectedSchema[tableName]) {
      this.expectedSchema[tableName] = { columns: {}, constraints: [], indexes: [], policies: [] };
    }

    if (operation === 'ADD COLUMN') {
      const columnMatch = definition.match(/(\w+)\s+(.+)/);
      if (columnMatch) {
        const columnName = columnMatch[1];
        const columnDefinition = columnMatch[2];
        
        this.expectedSchema[tableName].columns[columnName] = {
          definition: columnDefinition,
          type: this.extractColumnType(columnDefinition),
          nullable: !columnDefinition.includes('NOT NULL'),
          defaultValue: this.extractDefault(columnDefinition)
        };
      }
    }
  }

  /**
   * Obtiene el schema real de la base de datos usando MCP
   */
  async getActualSchema() {
    console.log('🔍 Obteniendo schema real de Supabase...');
    
    try {
      // Usar MCP para obtener lista de tablas
      console.log('📋 Obteniendo lista de tablas...');
      // Nota: Aquí necesitaremos usar el MCP de Supabase
      // Por ahora simularemos la estructura
      
      return this.actualSchema;
    } catch (error) {
      console.error('❌ Error obteniendo schema real:', error.message);
      return null;
    }
  }

  /**
   * Compara schema esperado vs real
   */
  compareSchemas() {
    console.log('🔍 Comparando schemas...');
    
    // Verificar tablas faltantes
    for (const tableName of Object.keys(this.expectedSchema)) {
      if (!this.actualSchema[tableName]) {
        this.issues.push({
          type: 'MISSING_TABLE',
          table: tableName,
          severity: 'HIGH',
          description: `Tabla '${tableName}' definida en migraciones pero no existe en BD`,
          expectedDefinition: this.expectedSchema[tableName]
        });
      } else {
        this.compareTableStructure(tableName);
      }
    }

    // Verificar tablas extra (que existen pero no están en migraciones)
    for (const tableName of Object.keys(this.actualSchema)) {
      if (!this.expectedSchema[tableName]) {
        this.issues.push({
          type: 'EXTRA_TABLE',
          table: tableName,
          severity: 'MEDIUM',
          description: `Tabla '${tableName}' existe en BD pero no está definida en migraciones`
        });
      }
    }

    console.log(`📊 Encontrados ${this.issues.length} problemas`);
  }

  /**
   * Compara la estructura de una tabla específica
   */
  compareTableStructure(tableName) {
    const expected = this.expectedSchema[tableName];
    const actual = this.actualSchema[tableName];

    // Comparar columnas
    for (const columnName of Object.keys(expected.columns)) {
      if (!actual.columns[columnName]) {
        this.issues.push({
          type: 'MISSING_COLUMN',
          table: tableName,
          column: columnName,
          severity: 'HIGH',
          description: `Columna '${columnName}' falta en tabla '${tableName}'`,
          expectedDefinition: expected.columns[columnName]
        });
      } else {
        this.compareColumnDefinition(tableName, columnName, expected.columns[columnName], actual.columns[columnName]);
      }
    }

    // Verificar columnas extra
    for (const columnName of Object.keys(actual.columns)) {
      if (!expected.columns[columnName]) {
        this.issues.push({
          type: 'EXTRA_COLUMN',
          table: tableName,
          column: columnName,
          severity: 'LOW',
          description: `Columna '${columnName}' existe pero no está en migraciones`
        });
      }
    }
  }

  /**
   * Compara la definición de una columna
   */
  compareColumnDefinition(tableName, columnName, expected, actual) {
    if (expected.type !== actual.type) {
      this.issues.push({
        type: 'COLUMN_TYPE_MISMATCH',
        table: tableName,
        column: columnName,
        severity: 'HIGH',
        description: `Tipo de columna no coincide: esperado '${expected.type}', actual '${actual.type}'`,
        expected: expected.type,
        actual: actual.type
      });
    }

    if (expected.nullable !== actual.nullable) {
      this.issues.push({
        type: 'COLUMN_NULLABLE_MISMATCH',
        table: tableName,
        column: columnName,
        severity: 'MEDIUM',
        description: `Nullabilidad no coincide: esperado ${expected.nullable ? 'NULL' : 'NOT NULL'}, actual ${actual.nullable ? 'NULL' : 'NOT NULL'}`,
        expected: expected.nullable,
        actual: actual.nullable
      });
    }
  }

  /**
   * Genera migraciones correctivas
   */
  generateCorrections() {
    console.log('🔧 Generando correcciones...');
    
    const corrections = [];
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
    
    for (const issue of this.issues) {
      switch (issue.type) {
        case 'MISSING_TABLE':
          corrections.push(this.generateCreateTableCorrection(issue));
          break;
        case 'MISSING_COLUMN':
          corrections.push(this.generateAddColumnCorrection(issue));
          break;
        case 'COLUMN_TYPE_MISMATCH':
          corrections.push(this.generateAlterColumnCorrection(issue));
          break;
      }
    }

    if (corrections.length > 0) {
      const migrationContent = corrections.join('\n\n');
      const migrationFile = `supabase/migrations/${timestamp}_database_corrections.sql`;
      
      fs.writeFileSync(migrationFile, migrationContent);
      console.log(`📄 Migración correctiva generada: ${migrationFile}`);
    }

    return corrections;
  }

  /**
   * Genera SQL para crear tabla faltante
   */
  generateCreateTableCorrection(issue) {
    const { table, expectedDefinition } = issue;
    let sql = `-- Crear tabla faltante: ${table}\n`;
    sql += `CREATE TABLE IF NOT EXISTS ${table} (\n`;
    
    const columnDefs = [];
    for (const [columnName, columnDef] of Object.entries(expectedDefinition.columns)) {
      columnDefs.push(`  ${columnName} ${columnDef.definition}`);
    }
    
    sql += columnDefs.join(',\n');
    sql += '\n);';
    
    return sql;
  }

  /**
   * Genera SQL para agregar columna faltante
   */
  generateAddColumnCorrection(issue) {
    const { table, column, expectedDefinition } = issue;
    return `-- Agregar columna faltante: ${table}.${column}\nALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${expectedDefinition.definition};`;
  }

  /**
   * Genera SQL para corregir tipo de columna
   */
  generateAlterColumnCorrection(issue) {
    const { table, column, expected } = issue;
    return `-- Corregir tipo de columna: ${table}.${column}\nALTER TABLE ${table} ALTER COLUMN ${column} TYPE ${expected};`;
  }

  /**
   * Genera reporte completo
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        expectedTables: Object.keys(this.expectedSchema).length,
        actualTables: Object.keys(this.actualSchema).length,
        totalIssues: this.issues.length,
        highSeverityIssues: this.issues.filter(i => i.severity === 'HIGH').length,
        mediumSeverityIssues: this.issues.filter(i => i.severity === 'MEDIUM').length,
        lowSeverityIssues: this.issues.filter(i => i.severity === 'LOW').length
      },
      expectedSchema: this.expectedSchema,
      actualSchema: this.actualSchema,
      issues: this.issues,
      corrections: this.corrections
    };

    fs.writeFileSync('supabase-database-audit-report.json', JSON.stringify(report, null, 2));
    console.log('📄 Reporte guardado en: supabase-database-audit-report.json');

    return report;
  }

  /**
   * Ejecuta auditoría completa
   */
  async runCompleteAudit() {
    console.log('🚀 Iniciando auditoría completa de base de datos Supabase...\n');

    // Paso 1: Analizar migraciones
    this.analyzeExpectedSchema();

    // Paso 2: Obtener schema real (necesita MCP)
    console.log('\n⚠️  NOTA: Para obtener el schema real necesitamos usar MCP de Supabase');
    console.log('   Ejecuta: node scripts/supabase-database-audit-with-mcp.js');

    // Paso 3: Generar reporte preliminar
    const report = this.generateReport();

    console.log('\n📊 RESUMEN PRELIMINAR:');
    console.log(`   Tablas esperadas: ${report.summary.expectedTables}`);
    console.log(`   Migraciones analizadas: ${fs.readdirSync('supabase/migrations').filter(f => f.endsWith('.sql')).length}`);

    console.log('\n📋 TABLAS ESPERADAS:');
    for (const [tableName, tableDef] of Object.entries(this.expectedSchema)) {
      const columnCount = Object.keys(tableDef.columns).length;
      console.log(`   ✓ ${tableName} (${columnCount} columnas)`);
    }

    console.log('\n💡 PRÓXIMOS PASOS:');
    console.log('   1. Ejecutar script con MCP para obtener schema real');
    console.log('   2. Comparar schemas y generar correcciones');
    console.log('   3. Aplicar migraciones correctivas si es necesario');

    return report;
  }
}

// Ejecutar auditoría
if (require.main === module) {
  const auditor = new SupabaseDatabaseAuditor();
  auditor.runCompleteAudit().catch(console.error);
}

module.exports = SupabaseDatabaseAuditor;