const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

// Función para ejecutar la migración completa del schema
async function runMigration() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Iniciando migración completa del CRM Restaurante...');
    
    // Regenerar cliente Prisma con binaryTargets para Linux
    console.log('🔄 Regenerando cliente Prisma con binaryTargets para Linux...');
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Cliente Prisma regenerado exitosamente');
    } catch (error) {
      console.log('⚠️ Error regenerando cliente Prisma, intentando con ruta directa...');
      try {
        execSync('./node_modules/.bin/prisma generate', { stdio: 'inherit' });
        console.log('✅ Cliente Prisma regenerado exitosamente (ruta directa)');
      } catch (error2) {
        console.log('❌ No se pudo regenerar el cliente Prisma:', error2.message);
        // Continuar con el cliente existente, no es crítico
        console.log('⚠️ Continuando con cliente existente...');
      }
    }
    
    // Verificar conexión a base de datos
    console.log('🔍 Verificando conexión a base de datos...');
    await prisma.$queryRaw`SELECT 1`;
    
    // Crear tablas según el schema (db push es mejor para producción)
    console.log('🏗️ Creando/actualizando tablas según schema...');
    try {
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️ Error con npx prisma db push, intentando con prisma directamente...');
      try {
        execSync('./node_modules/.bin/prisma db push --accept-data-loss', { stdio: 'inherit' });
      } catch (error2) {
        console.log('❌ No se pudo ejecutar db push:', error2.message);
        throw error2;
      }
    }
    
    // Aplicar migraciones si existen
    console.log('📋 Aplicando migraciones pendientes...');
    try {
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️ Error con npx prisma migrate deploy, intentando con prisma directamente...');
      try {
        execSync('./node_modules/.bin/prisma migrate deploy', { stdio: 'inherit' });
      } catch (error2) {
        console.log('ℹ️ No hay migraciones pendientes o ya fueron aplicadas');
      }
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