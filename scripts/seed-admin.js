// ─────────────────────────────────────────────────────────────────────────────
// seed-admin.js — Crea o restablece el usuario Administrador en PostgreSQL
//
// Uso:
//   node scripts/seed-admin.js
//
// Variables de entorno (leídas desde .env o variables del sistema):
//   DATABASE_URL   — URL de conexión a PostgreSQL
//   ADMIN_EMAIL    — Correo del administrador (default: admin@prestamos.pe)
//   ADMIN_PASSWORD — Contraseña en texto plano (default: Admin123!)
// ─────────────────────────────────────────────────────────────────────────────

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// ─── Carga manual de .env si existe ─────────────────────────────────────────
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
    // Quitar comillas envolventes si las hay
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
  console.log('✅ Variables de entorno cargadas desde .env');
} else {
  console.log('⚠️  Archivo .env no encontrado — usando variables del sistema.');
}

// ─── Configuración ───────────────────────────────────────────────────────────
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@prestamos.pe').trim().toLowerCase();
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || 'Admin123!').trim();
const SALT_ROUNDS = 10;

const prisma = new PrismaClient({
  log: ['error'],
});

// ─── Función principal ───────────────────────────────────────────────────────
async function seedAdmin() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║     PrestaPerú — Seed Administrador del Sistema   ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  console.log(`📧  Correo   : ${ADMIN_EMAIL}`);
  console.log(`🔑  Contraseña: ${'*'.repeat(ADMIN_PASSWORD.length)}`);
  console.log(`🔒  Salt Rounds: ${SALT_ROUNDS}\n`);

  // 1. Verificar conectividad con la base de datos
  console.log('🔗 Verificando conexión a PostgreSQL...');
  await prisma.$connect();
  console.log('   ✔ Conexión establecida.\n');

  // 2. Encriptar contraseña con bcryptjs
  console.log('🔐 Cifrando contraseña con bcryptjs...');
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
  console.log('   ✔ Hash generado correctamente.\n');

  // 3. Upsert idempotente en la tabla admin_users
  console.log('📝 Ejecutando upsert en tabla admin_users con rol SUPER_ADMIN...');
  const admin = await prisma.adminUser.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      nombre: 'Administrador Principal (SUPER_ADMIN)',
      password_hash: passwordHash,
      role: 'SUPER_ADMIN',
      activo: true,
    },
    update: {
      password_hash: passwordHash,
      role: 'SUPER_ADMIN',
      activo: true,
    },
    select: {
      id: true,
      email: true,
      nombre: true,
      role: true,
      activo: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // 4. Resumen final
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║               ✅ SEED COMPLETADO                  ║');
  console.log('╠═══════════════════════════════════════════════════╣');
  console.log(`║  ID      : ${admin.id.padEnd(38)} ║`);
  console.log(`║  Nombre  : ${admin.nombre.padEnd(38)} ║`);
  console.log(`║  Correo  : ${admin.email.padEnd(38)} ║`);
  console.log(`║  Rol     : ${String(admin.role).padEnd(38)} ║`);
  console.log(`║  Activo  : ${String(admin.activo).padEnd(38)} ║`);
  console.log(`║  Creado  : ${admin.createdAt.toISOString().slice(0, 19).padEnd(38)} ║`);
  console.log(`║  Updated : ${admin.updatedAt.toISOString().slice(0, 19).padEnd(38)} ║`);
  console.log('╚═══════════════════════════════════════════════════╝\n');

  console.log('🚀 El administrador puede iniciar sesión en:');
  console.log(`   http://localhost:3000/admin/login\n`);
  console.log(`   Correo   : ${ADMIN_EMAIL}`);
  console.log(`   Contraseña: ${ADMIN_PASSWORD}\n`);
}

// ─── Ejecución con manejo de errores y cierre de Prisma ─────────────────────
seedAdmin()
  .catch((err) => {
    console.error('\n❌ ERROR durante el seed del administrador:\n');
    console.error('   Tipo   :', err.constructor?.name ?? 'Error');
    console.error('   Mensaje:', err.message);
    if (err.code) {
      console.error('   Código :', err.code);
    }
    if (err.meta) {
      console.error('   Meta   :', JSON.stringify(err.meta, null, 2));
    }
    console.error('\n💡 Verifica que:');
    console.error('   1. DATABASE_URL en .env apunte a PostgreSQL correctamente.');
    console.error('   2. Las migraciones de Prisma estén aplicadas (npx prisma migrate deploy).');
    console.error('   3. El servidor de base de datos esté activo y accesible.\n');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Conexión a base de datos cerrada.');
  });
