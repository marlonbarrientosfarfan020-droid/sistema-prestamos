const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Cargar .env manualmente
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

const prisma = new PrismaClient({ log: ['error'] });

async function runHealthCheck() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║       AUDITORÍA DE SALUD: POSTGRESQL + SUPABASE + PRISMA  ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const start = Date.now();

  try {
    // 1. Conexión directa
    console.log('1️⃣  Comprobando conectividad de red con el servidor de base de datos...');
    const pingResult = await prisma.$queryRaw`SELECT current_database() as db, current_schema() as schema, version() as version;`;
    console.log('   ✅ Conexión establecida.');
    console.log(`      Base de datos: ${pingResult[0]?.db}`);
    console.log(`      Esquema activo: ${pingResult[0]?.schema}`);
    console.log(`      Versión motor : ${pingResult[0]?.version?.split(' ')[0]} ${pingResult[0]?.version?.split(' ')[1]}`);

    // 2. Conteo de tablas del modelo
    console.log('\n2️⃣  Verificando existencia y estado de las tablas del sistema de préstamos...');
    const [
      adminUsersCount,
      clientesCount,
      solicitudesCount,
      prestamosCount,
      cuotasCount,
      vouchersCount,
      docsCount,
      configCount,
    ] = await Promise.all([
      prisma.adminUser.count(),
      prisma.cliente.count(),
      prisma.solicitudPrestamo.count(),
      prisma.prestamo.count(),
      prisma.cronogramaCuota.count(),
      prisma.voucherPago.count(),
      prisma.documentoKYC.count(),
      prisma.configuracionFinanciera.count(),
    ]);

    console.log('   📊 Registros actuales por tabla:');
    console.log(`      - admin_users              : ${adminUsersCount}`);
    console.log(`      - clientes                 : ${clientesCount}`);
    console.log(`      - solicitudes_prestamo     : ${solicitudesCount}`);
    console.log(`      - prestamos                : ${prestamosCount}`);
    console.log(`      - cronograma_cuotas        : ${cuotasCount}`);
    console.log(`      - vouchers_pago            : ${vouchersCount}`);
    console.log(`      - documentos_kyc           : ${docsCount}`);
    console.log(`      - configuracion_financiera : ${configCount}`);

    // 3. Comprobar o inicializar configuración financiera
    console.log('\n3️⃣  Verificando registro Singleton de Configuración Financiera...');
    const config = await prisma.configuracionFinanciera.upsert({
      where: { id: 'default_config' },
      update: {},
      create: {
        id: 'default_config',
        tasaDiaria: 20.0,
        tasaSemanal: 20.0,
        tasaQuincenal: 15.0,
        tasaMensual: 10.0,
        tasaTrimestral: 15.0,
        tasaSemestral: 25.0,
        cuotasDefaultDiario: 24,
        cuotasDefaultSemanal: 4,
        cuotasDefaultQuincenal: 2,
        cuotasDefaultMensual: 1,
        cuotasDefaultTrimestral: 1,
        cuotasDefaultSemestral: 1,
        montoMinimo: 50.0,
        montoMaximo: 10000.0,
        tasaMoraDiaria: 1.5,
      },
    });
    console.log(`   ✅ Configuración OK: Tasa Mensual = ${config.tasaMensual}%, Mora Diaria = ${config.tasaMoraDiaria}%, Rango = S/ ${config.montoMinimo} - S/ ${config.montoMaximo}`);

    // 4. Comprobar usuario administrador
    console.log('\n4️⃣  Verificando existencia de usuario administrador...');
    const admin = await prisma.adminUser.findFirst({ where: { activo: true } });
    if (admin) {
      console.log(`   ✅ Administrador registrado: ${admin.email} (${admin.nombre}) | Rol: ${admin.role}`);
    } else {
      console.log('   ⚠️ No se encontró administrador activo en BD. Se creará con seed-admin.js si es necesario.');
    }

    const duration = Date.now() - start;
    console.log(`\n🎉 Diagnóstico de base de datos exitoso en ${duration}ms. Todas las tablas responden correctamente.\n`);
  } catch (error) {
    console.error('\n❌ ERROR EN AUDITORÍA DE BASE DE DATOS:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runHealthCheck();
