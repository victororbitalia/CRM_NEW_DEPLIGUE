const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function removePrismaClientCache() {
  const prismaClientDir = path.join(process.cwd(), 'node_modules', '.prisma', 'client');
  if (fs.existsSync(prismaClientDir)) {
    fs.rmSync(prismaClientDir, { recursive: true, force: true });
    console.log('✅ Caché de Prisma eliminada');
  }
}

function runPrisma(command, { ignoreFailure = false } = {}) {
  try {
    execSync(`npx prisma ${command}`, { stdio: 'inherit' });
    return true;
  } catch (error) {
    if (!ignoreFailure) {
      throw error;
    }
    return false;
  }
}

// Función para ejecutar la migración completa del schema
async function runMigration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Iniciando migración completa del CRM Restaurante...');
    
    console.log('🔄 Forzando regeneración del cliente Prisma con binaryTargets para Linux...');
    removePrismaClientCache();
    runPrisma('generate');
    console.log('✅ Cliente Prisma regenerado con binaryTargets para Linux');
    
    // Verificar conexión a base de datos
    console.log('🔍 Verificando conexión a base de datos...');
    await prisma.$queryRaw`SELECT 1`;
    
    // Aplicar migraciones
    console.log('📋 Aplicando migraciones pendientes...');
    try {
      runPrisma('migrate deploy');
    } catch (error) {
      if (error?.message?.includes('P3005')) {
        console.error('❌ Error P3005: la base de datos no está vacía.');
        console.error('ℹ️ Marca las migraciones existentes con `prisma migrate resolve --applied <migration>` antes de continuar.');
      }
      throw error;
    }
    
    // Verificar que las tablas se crearon correctamente
    console.log('✅ Verificando tablas creadas...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    console.log('📊 Tablas en la base de datos:', tables.map(t => t.table_name).join(', '));
    
    // Ejecutar seed si existe y es un entorno fresco
    console.log('🌱 Verificando si se necesitan datos iniciales...');
    try {
      // Verificar si ya hay usuarios (indicador de que no es un setup fresco)
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        console.log('🌱 Ejecutando seed de datos iniciales...');
        try {
          execSync('npx prisma db seed', { stdio: 'inherit' });
        } catch (error) {
          console.log('⚠️ Error con npx prisma db seed, intentando con prisma directamente...');
          try {
            execSync('./node_modules/.bin/prisma db seed', { stdio: 'inherit' });
          } catch (error2) {
            console.log('ℹ️ Seed no ejecutado (puede ser normal):', error2.message);
          }
        }
      } else {
        console.log(`ℹ️ Base de datos ya contiene ${userCount} usuarios, omitiendo seed`);
      }
    } catch (seedError) {
      console.log('ℹ️ Seed no ejecutado (puede ser normal):', seedError.message);
    }
    
    // Verificación final de conexión
    console.log('🔍 Verificación final de conexión...');
    await prisma.$queryRaw`SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public'`;
    
    console.log('✅ Migración completada exitosamente!');
    console.log('🎉 Base de datos lista para usar');
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    console.error('📋 Detalles del error:', error.message);
    
    // Intentar diagnóstico adicional
    try {
      console.log('🔍 Intentando diagnóstico de conexión...');
      await prisma.$queryRaw`SELECT version()`;
      console.log('✅ Conexión a PostgreSQL funciona');
    } catch (dbError) {
      console.error('❌ Error de conexión a PostgreSQL:', dbError.message);
      console.error('🔧 Verifica la variable DATABASE_URL');
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Conexión a base de datos cerrada');
  }
}

// Ejecutar la migración solo si este archivo se ejecuta directamente
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('🚀 Proceso de migración finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falló el proceso de migración:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };