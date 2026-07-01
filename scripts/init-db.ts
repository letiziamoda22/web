import { initAuthTables } from '../lib/auth-db';

initAuthTables()
  .then(() => {
    console.log('Tablas creadas correctamente ✅');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error creando tablas:', err);
    process.exit(1);
  });